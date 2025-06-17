import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Extended user type
export interface User extends SupabaseUser {
  user_metadata?: {
    role?: 'admin';
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  };
  app_metadata?: {
    role?: 'admin';
    [key: string]: any;
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

// Auth error type
export interface AuthError {
  message: string;
  code?: string;
}

// Auth event type for logging
export interface AuthEvent {
  type: 'sign_in' | 'sign_out' | 'session_refresh' | 'profile_update';
  timestamp: Date;
  metadata?: Record<string, unknown>;
  error?: AuthError;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  isAdmin: boolean;
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

// Session storage configuration
export interface SessionConfig {
  persistSession: boolean;
  storage?: Storage;
  storageKey?: string;
  detectSessionInUrl?: boolean;
} 