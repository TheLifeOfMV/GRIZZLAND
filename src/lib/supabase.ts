import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthError } from '@/types/auth';

// Environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lilwbdgmyfhtowlzmlhy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHdiZGdteWZodG93bHptbGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NzA1MzYsImV4cCI6MjA2NTM0NjUzNn0.cDzS3nOsATJWdeFqFbGmThm0tUSVpXZLbj2BPZoXTsE';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client configuration options
const supabaseClientOptions = {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client-info': 'grizzland-frontend',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Create Supabase client instance
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  supabaseClientOptions
);

// Connection test and retry logic
export const testConnection = async (): Promise<{ success: boolean; error?: AuthError }> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return {
        success: false,
        error: {
          message: 'Failed to connect to authentication service',
          code: error.name,
          details: error.message,
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return {
      success: false,
      error: {
        message: 'Network connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

// Retry wrapper for Supabase operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Log retry attempt
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
      
      // Don't retry on certain errors
      if (
        lastError.message.includes('Invalid login credentials') ||
        lastError.message.includes('Email not confirmed') ||
        lastError.message.includes('User not found')
      ) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
};

// Enhanced error handler for Supabase errors
export const handleSupabaseError = (error: any): AuthError => {
  // Handle different types of Supabase errors
  if (error?.message) {
    // Common authentication errors
    switch (error.message) {
      case 'Invalid login credentials':
        return {
          message: 'Invalid email or password. Please check your credentials and try again.',
          code: 'INVALID_CREDENTIALS',
          status: 401,
        };
      case 'Email not confirmed':
        return {
          message: 'Please check your email and click the confirmation link before logging in.',
          code: 'EMAIL_NOT_CONFIRMED',
          status: 401,
        };
      case 'User not found':
        return {
          message: 'No account found with this email address.',
          code: 'USER_NOT_FOUND',
          status: 404,
        };
      case 'Too many requests':
        return {
          message: 'Too many login attempts. Please wait a few minutes and try again.',
          code: 'RATE_LIMITED',
          status: 429,
        };
      case 'Password should be at least 6 characters':
        return {
          message: 'Password must be at least 6 characters long.',
          code: 'WEAK_PASSWORD',
          status: 400,
        };
      case 'User already registered':
        return {
          message: 'An account with this email already exists.',
          code: 'USER_EXISTS',
          status: 409,
        };
      default:
        return {
          message: error.message,
          code: 'SUPABASE_ERROR',
          details: error.message,
        };
    }
  }
  
  // Network or unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    details: error?.toString() || 'Unknown error',
  };
};

// Helper function to check if client is initialized
export const isClientInitialized = (): boolean => {
  try {
    return !!supabase && typeof supabase.auth.getSession === 'function';
  } catch {
    return false;
  }
};

// Structured logging for authentication events
export const logAuthEvent = (
  event: string,
  metadata?: Record<string, unknown>,
  error?: AuthError
): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    metadata,
    error,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    if (error) {
      console.error('Auth Event Error:', logData);
    } else {
      console.log('Auth Event:', logData);
    }
  }

  // In production, you would send this to your logging service
  // Example: sendToLoggingService(logData);
};

// Export the client as default
export default supabase; 