import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Extended User interface with role information
export interface User extends SupabaseUser {
  user_metadata: {
    role?: 'user' | 'admin';
    first_name?: string;
    last_name?: string;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
}

// Authentication state interface
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

// Login form data interface
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Registration form data interface
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  agreeToTerms: boolean;
}

// Authentication error types
export interface AuthError {
  message: string;
  status?: number;
  code?: string;
  details?: string;
}

// Authentication context type
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, options?: { firstName?: string; lastName?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<User['user_metadata']>) => Promise<{ error: AuthError | null }>;
  isAdmin: boolean;
  isUser: boolean;
}

// Route protection props
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// Auth form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Social authentication providers
export type AuthProvider = 'google' | 'github' | 'facebook' | 'apple';

// Authentication events for logging
export interface AuthEvent {
  type: 'sign_in' | 'sign_up' | 'sign_out' | 'password_reset' | 'profile_update' | 'session_refresh';
  userId?: string;
  email?: string;
  provider?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  error?: AuthError;
}

// Session storage configuration
export interface SessionConfig {
  persistSession: boolean;
  storage?: Storage;
  storageKey?: string;
  detectSessionInUrl?: boolean;
} 