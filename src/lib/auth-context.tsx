'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, handleSupabaseError, withRetry, logAuthEvent } from '@/lib/supabase';
import { AuthContextType, User, AuthError, AuthEvent } from '@/types/auth';

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Helper function to log auth events
  const logEvent = useCallback((event: AuthEvent['type'], metadata?: Record<string, unknown>, error?: AuthError) => {
    logAuthEvent(event, {
      userId: user?.id,
      email: user?.email,
      ...metadata,
    }, error);
  }, [user]);

  // Initialize authentication
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          logEvent('session_refresh', {}, handleSupabaseError(error));
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user as User || null);
          setInitialized(true);
          setLoading(false);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            console.log('Auth state changed:', event, newSession?.user?.email);
            
            setSession(newSession);
            setUser(newSession?.user as User || null);
            setLoading(false);

            // Log auth events
            switch (event) {
              case 'SIGNED_IN':
                logEvent('sign_in', { provider: newSession?.user?.app_metadata?.provider });
                break;
              case 'SIGNED_OUT':
                logEvent('sign_out');
                break;
              case 'TOKEN_REFRESHED':
                logEvent('session_refresh');
                break;
              case 'USER_UPDATED':
                logEvent('profile_update');
                break;
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [logEvent]);

  // Sign in function (only for admin)
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      
      const result = await withRetry(async () => {
        return await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      });

      const { data, error } = result;

      if (error) {
        const authError = handleSupabaseError(error);
        logEvent('sign_in', { email, success: false }, authError);
        return { error: authError };
      }

      if (data.user) {
        logEvent('sign_in', { email, success: true, userId: data.user.id });
      }

      return { error: null };
    } catch (error) {
      const authError = handleSupabaseError(error);
      logEvent('sign_in', { email, success: false }, authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  }, [logEvent]);

  // Sign out function
  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        const authError = handleSupabaseError(error);
        logEvent('sign_out', { success: false }, authError);
        return { error: authError };
      }

      logEvent('sign_out', { success: true });
      return { error: null };
    } catch (error) {
      const authError = handleSupabaseError(error);
      logEvent('sign_out', { success: false }, authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  }, [logEvent]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    return user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
  }, [user]);

  // Context value
  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    signIn,
    signOut,
    isAdmin: isAdmin(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for admin-only components
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: React.ComponentType;
  }
) {
  const { redirectTo = '/admin/login', fallback: Fallback } = options || {};

  return function AdminAuthenticatedComponent(props: P) {
    const { user, loading, initialized, isAdmin } = useAuth();

    // Show loading while initializing
    if (!initialized || loading) {
      return Fallback ? <Fallback /> : <div>Loading...</div>;
    }

    // Redirect if not admin
    if (!user || !isAdmin) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return Fallback ? <Fallback /> : null;
    }

    return <Component {...props} />;
  };
}

// Hook to check admin role
export function useAdminRole() {
  const { user, isAdmin } = useAuth();
  return { user, isAdmin };
}

// Hook to get loading state
export function useAuthLoading() {
  const { loading, initialized } = useAuth();
  return loading || !initialized;
} 