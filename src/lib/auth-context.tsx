'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, handleSupabaseError, withRetry } from '@/lib/supabase';
import { AuthContextType, User, AuthError } from '@/types/auth';

// MONOCODE: Observable Implementation - Structured Logging
const logAuthEvent = (event: string, metadata: Record<string, any> = {}) => {
  console.log('AUTH_EVENT', {
    timestamp: new Date().toISOString(),
    event,
    ...metadata
  });
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// MONOCODE: Progressive Construction - Minimal AuthProvider implementation
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  // MONOCODE: Observable Implementation - Initialize authentication with structured logging
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logAuthEvent('AUTH_INIT_START');
        setLoading(true);
        
        // MONOCODE: Explicit Error Handling - Check mock admin session first
        const adminToken = localStorage.getItem('admin_token');
        const adminUser = localStorage.getItem('admin_user');
        
        if (adminToken && adminUser) {
          try {
            const mockUser = JSON.parse(adminUser);
            const mockSession = {
              access_token: adminToken,
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              refresh_token: 'mock-refresh-token',
              user: mockUser
            };
            
            if (mounted) {
              setSession(mockSession as any);
              setUser(mockUser as User);
              setInitialized(true);
              setLoading(false);
              logAuthEvent('AUTH_INIT_SUCCESS', { type: 'mock_admin', userId: mockUser.id });
              return;
            }
          } catch (e) {
            logAuthEvent('AUTH_INIT_ERROR', { error: 'Invalid stored admin data' });
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
          }
        }
        
        // MONOCODE: Explicit Error Handling - Get initial session from Supabase
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          logAuthEvent('AUTH_INIT_ERROR', { error: error.message });
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user as User || null);
          setInitialized(true);
          setLoading(false);
          logAuthEvent('AUTH_INIT_SUCCESS', { 
            type: 'supabase', 
            hasSession: !!initialSession,
            userId: initialSession?.user?.id 
          });
        }

        // MONOCODE: Observable Implementation - Set up auth state listener with logging
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            logAuthEvent('AUTH_STATE_CHANGE', { 
              event, 
              hasSession: !!newSession,
              userId: newSession?.user?.id 
            });
            
            setSession(newSession);
            setUser(newSession?.user as User || null);
            setLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        logAuthEvent('AUTH_INIT_FATAL_ERROR', { error: (error as Error).message });
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
  }, []); // MONOCODE: Deterministic State - Empty dependencies to prevent infinite loop

  // MONOCODE: Explicit Error Handling - Sign in function with admin fallback
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      logAuthEvent('SIGN_IN_ATTEMPT', { email });
      setLoading(true);
      
      // MONOCODE: Progressive Construction - Admin test credentials
      const adminCredentials = {
        email: 'admin@grizzland.com',
        password: 'Admin123!'
      };

      // MONOCODE: Graceful Fallbacks - Check for admin test credentials first
      if (email.trim().toLowerCase() === adminCredentials.email && password === adminCredentials.password) {
        const mockUser = {
          id: 'admin-mock-001',
          email: adminCredentials.email,
          user_metadata: { role: 'admin', name: 'Administrator' },
          app_metadata: { role: 'admin' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          phone: null,
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          aud: 'authenticated'
        };

        const mockSession = {
          access_token: 'mock-admin-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'mock-refresh-token',
          user: mockUser
        };

        setSession(mockSession as any);
        setUser(mockUser as any);
        
        localStorage.setItem('admin_token', 'mock-admin-token');
        localStorage.setItem('admin_user', JSON.stringify(mockUser));
        
        logAuthEvent('SIGN_IN_SUCCESS', { type: 'admin_mock', userId: mockUser.id });
        return { error: null };
      }

      // MONOCODE: Dependency Transparency - Try Supabase authentication
      const result = await withRetry(async () => {
        return await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      });

      const { data, error } = result;

      if (error) {
        const authError = handleSupabaseError(error);
        logAuthEvent('SIGN_IN_ERROR', { email, error: authError.message });
        return { error: authError };
      }

      if (data.user) {
        logAuthEvent('SIGN_IN_SUCCESS', { type: 'supabase', userId: data.user.id });
        return { error: null };
      }

      logAuthEvent('SIGN_IN_ERROR', { email, error: 'Sign in failed' });
      return { error: { message: 'Sign in failed', code: 'SIGN_IN_FAILED' } };
    } catch (error) {
      logAuthEvent('SIGN_IN_FATAL_ERROR', { email, error: (error as Error).message });
      return { error: { message: 'An unexpected error occurred', code: 'UNEXPECTED_ERROR' } };
    } finally {
      setLoading(false);
    }
  }, []);

  // MONOCODE: Explicit Error Handling - Sign out function
  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    try {
      logAuthEvent('SIGN_OUT_ATTEMPT');
      setLoading(true);
      
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const authError = handleSupabaseError(error);
        logAuthEvent('SIGN_OUT_ERROR', { error: authError.message });
        return { error: authError };
      }

      setSession(null);
      setUser(null);
      logAuthEvent('SIGN_OUT_SUCCESS');
      
      return { error: null };
    } catch (error) {
      logAuthEvent('SIGN_OUT_FATAL_ERROR', { error: (error as Error).message });
      return { error: { message: 'An unexpected error occurred', code: 'UNEXPECTED_ERROR' } };
    } finally {
      setLoading(false);
    }
  }, []);

  // MONOCODE: Deterministic State - Check if user is admin
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';

  // MONOCODE: Observable Implementation - Context value with clear state
  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    isAdmin,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// MONOCODE: Progressive Construction - HOC for admin-only components
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: React.ComponentType;
  }
) {
  return function AdminAuthenticatedComponent(props: P) {
    const { user, loading, isAdmin, initialized } = useAuth();
    
    if (!initialized || loading) {
      return <div>Loading...</div>;
    }
    
    if (!user || !isAdmin) {
      if (options?.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent />;
      }
      return <div>Access denied</div>;
    }
    
    return <Component {...props} />;
  };
}

// MONOCODE: Observable Implementation - Hook for admin role checking
export function useAdminRole() {
  const { isAdmin, user, loading } = useAuth();
  return { isAdmin, user, loading };
}

// Hook for auth loading state
export function useAuthLoading() {
  const { loading } = useAuth();
  return loading;
} 