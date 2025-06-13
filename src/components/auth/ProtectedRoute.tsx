'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRouteProps } from '@/types/auth';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-primary-bg flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="loader w-8 h-8"></div>
      <p className="text-white opacity-75 uppercase tracking-wide text-sm">
        Loading...
      </p>
    </div>
  </div>
);

// Access denied component
const AccessDenied: React.FC<{ message?: string; showHomeButton?: boolean }> = ({ 
  message = "You don't have permission to access this page.",
  showHomeButton = true 
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-12 h-12 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wide mb-2">
            Access Denied
          </h1>
          <p className="text-white opacity-75 mb-6">
            {message}
          </p>
        </div>

        {showHomeButton && (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="btn-primary w-full"
            >
              Go Home
            </button>
            <button
              onClick={() => router.back()}
              className="btn-secondary w-full"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Unauthorized component (for users who need to log in)
const Unauthorized: React.FC<{ redirectTo?: string }> = ({ redirectTo = '/auth/login' }) => {
  const router = useRouter();

  useEffect(() => {
    // Redirect after a short delay
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, redirectTo]);

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-12 h-12 text-yellow-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wide mb-2">
            Authentication Required
          </h1>
          <p className="text-white opacity-75 mb-6">
            Please log in to access this page. Redirecting...
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => router.push(redirectTo)}
            className="btn-primary flex-1"
          >
            Log In Now
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-secondary flex-1"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ProtectedRoute component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
  redirectTo = '/auth/login',
}) => {
  const { user, loading, initialized, isAdmin, isUser } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && initialized) {
      if (!user) {
        // No user logged in
        setShouldRedirect(true);
        return;
      }

      if (requiredRole === 'admin' && !isAdmin) {
        // Admin role required but user is not admin
        setShouldRedirect(true);
        return;
      }

      if (requiredRole === 'user' && !isUser) {
        // User role required but user is not authenticated properly
        setShouldRedirect(true);
        return;
      }

      // User has required permissions
      setShouldRedirect(false);
    }
  }, [user, loading, initialized, isAdmin, isUser, requiredRole]);

  // Handle redirect logic
  useEffect(() => {
    if (shouldRedirect && initialized && !loading) {
      if (!user) {
        // User needs to log in
        const loginPath = requiredRole === 'admin' ? '/admin/login' : redirectTo;
        router.push(loginPath);
      } else if (requiredRole === 'admin' && !isAdmin) {
        // User is logged in but doesn't have admin privileges
        router.push('/auth/login'); // Or to an access denied page
      }
    }
  }, [shouldRedirect, user, isAdmin, requiredRole, redirectTo, router, initialized, loading]);

  // Show loading while initializing
  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  // Show unauthorized screen if no user
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Unauthorized redirectTo={requiredRole === 'admin' ? '/admin/login' : redirectTo} />;
  }

  // Check role-based access
  if (requiredRole === 'admin' && !isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDenied 
        message="You need administrator privileges to access this page."
        showHomeButton={true}
      />
    );
  }

  if (requiredRole === 'user' && !isUser) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDenied 
        message="You need to be logged in as a user to access this page."
        showHomeButton={true}
      />
    );
  }

  // User has permission, render children
  return <>{children}</>;
};

export default ProtectedRoute;

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: 'user' | 'admin';
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Utility component for admin-only content
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Utility component for user-only content
export const UserOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isUser } = useAuth();

  if (!isUser) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Utility component for authenticated content
export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Export all components and utilities
export {
  LoadingScreen,
  AccessDenied,
  Unauthorized,
  AdminOnly,
  UserOnly,
  AuthenticatedOnly,
}; 