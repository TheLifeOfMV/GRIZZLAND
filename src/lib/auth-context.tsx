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

  // Sign in function
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

  // Sign up function
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    options?: { firstName?: string; lastName?: string }
  ): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      
      const result = await withRetry(async () => {
        return await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              first_name: options?.firstName,
              last_name: options?.lastName,
              role: 'user', // Default role
            },
          },
        });
      });

      const { data, error } = result;

      if (error) {
        const authError = handleSupabaseError(error);
        logEvent('sign_up', { email, success: false }, authError);
        return { error: authError };
      }

      if (data.user) {
        logEvent('sign_up', { email, success: true, userId: data.user.id });
      }

      return { error: null };
    } catch (error) {
      const authError = handleSupabaseError(error);
      logEvent('sign_up', { email, success: false }, authError);
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

  // Reset password function
  const resetPassword = useCallback(async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        const authError = handleSupabaseError(error);
        logEvent('password_reset', { email, success: false }, authError);
        return { error: authError };
      }

      logEvent('password_reset', { email, success: true });
      return { error: null };
    } catch (error) {
      const authError = handleSupabaseError(error);
      logEvent('password_reset', { email, success: false }, authError);
      return { error: authError };
    }
  }, [logEvent]);

  // Update profile function
  const updateProfile = useCallback(async (
    updates: Partial<User['user_metadata']>
  ): Promise<{ error: AuthError | null }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in', code: 'NO_USER' } };
      }

      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        const authError = handleSupabaseError(error);
        logEvent('profile_update', { success: false }, authError);
        return { error: authError };
      }

      logEvent('profile_update', { success: true });
      return { error: null };
    } catch (error) {
      const authError = handleSupabaseError(error);
      logEvent('profile_update', { success: false }, authError);
      return { error: authError };
    }
  }, [user, logEvent]);

  // Role-based access helpers
  const isAdmin = user?.user_metadata?.role === 'admin';
  const isUser = user?.user_metadata?.role === 'user' || (!user?.user_metadata?.role && !!user);

  // Context value
  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    isAdmin,
    isUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: 'user' | 'admin';
    redirectTo?: string;
    fallback?: React.ComponentType;
  }
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, initialized, isAdmin, isUser } = useAuth();
    const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

    useEffect(() => {
      if (!loading && initialized) {
        if (!user) {
          // Redirect to login if no user
          if (router) {
            router.push(options?.redirectTo || '/auth/login');
          }
          return;
        }

        if (options?.requiredRole === 'admin' && !isAdmin) {
          // Redirect if admin required but user is not admin
          if (router) {
            router.push('/auth/login');
          }
          return;
        }

        if (options?.requiredRole === 'user' && !isUser) {
          // Redirect if user required but not authenticated
          if (router) {
            router.push('/auth/login');
          }
          return;
        }
      }
    }, [user, loading, initialized, isAdmin, isUser, router]);

    if (loading || !initialized) {
      return (
        <div className="min-h-screen bg-primary-bg flex items-center justify-center">
          <div className="loader"></div>
        </div>
      );
    }

    if (!user) {
      if (options?.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent />;
      }
      return null;
    }

    if (options?.requiredRole === 'admin' && !isAdmin) {
      return (
        <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-white uppercase tracking-wide mb-4">
              Access Denied
            </h1>
            <p className="text-white opacity-75 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router?.push('/')}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Utility hook for role checking
export function useRole() {
  const { user, isAdmin, isUser } = useAuth();
  
  return {
    role: user?.user_metadata?.role || null,
    isAdmin,
    isUser,
    hasRole: (role: 'user' | 'admin') => {
      if (role === 'admin') return isAdmin;
      if (role === 'user') return isUser;
      return false;
    },
  };
}

// Utility hook for auth loading states
export function useAuthLoading() {
  const { loading, initialized } = useAuth();
  
  return {
    isLoading: loading,
    isInitialized: initialized,
    isReady: !loading && initialized,
  };
} 