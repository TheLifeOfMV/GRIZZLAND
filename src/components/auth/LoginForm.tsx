'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { loginSchema, adminLoginSchema, LoginFormData } from '@/lib/validations/auth';
import { AuthError } from '@/types/auth';

// Form input component with GRIZZLAND styling
interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  register: any;
  icon?: React.ReactNode;
  onToggle?: () => void;
  disabled?: boolean;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register,
  icon,
  onToggle,
  disabled = false,
  required = false,
}) => {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          className={`form-input ${error ? 'border-error focus:border-error focus:ring-error' : ''} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={disabled}
          {...register(name)}
        />
        {icon && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white hover:text-gray-300 focus:outline-none"
            onClick={onToggle}
            tabIndex={-1}
          >
            {icon}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
};

// Login form props
interface LoginFormProps {
  type?: 'user' | 'admin';
  onSuccess?: (user: any) => void;
  onError?: (error: AuthError) => void;
  redirectTo?: string;
  className?: string;
}

// Main login form component
const LoginForm: React.FC<LoginFormProps> = ({
  type = 'user',
  onSuccess,
  onError,
  redirectTo,
  className = '',
}) => {
  const { signIn, loading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use appropriate schema based on type
  const schema = type === 'admin' ? adminLoginSchema : loginSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    setFocus,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Focus email field on mount
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  // Clear form error when user starts typing
  useEffect(() => {
    if (formError && (touchedFields.email || touchedFields.password)) {
      setFormError(null);
      clearErrors();
    }
  }, [formError, touchedFields, clearErrors]);

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setFormError(null);

      const { error } = await signIn(data.email, data.password);

      if (error) {
        setFormError(error.message);
        onError?.(error);
        return;
      }

      // Success callback
      onSuccess?.(data);

      // Handle redirect
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Default redirects based on type
        const defaultRedirect = type === 'admin' ? '/admin/dashboard' : '/';
        router.push(defaultRedirect);
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setFormError(errorMessage);
      onError?.({ message: errorMessage, code: 'UNKNOWN_ERROR' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Form header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white uppercase tracking-wide mb-2">
          {type === 'admin' ? 'Admin Login' : 'Welcome Back'}
        </h1>
        <p className="text-white opacity-75">
          {type === 'admin' 
            ? 'Access your admin dashboard' 
            : 'Sign in to your GRIZZLAND account'
          }
        </p>
      </div>

      {/* Form error alert */}
      {formError && (
        <div className="alert alert-error mb-6" role="alert">
          <strong>Error:</strong> {formError}
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Email field */}
        <FormInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          register={register}
          required
          disabled={isSubmitting}
        />

        {/* Password field */}
        <FormInput
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          error={errors.password?.message}
          register={register}
          required
          disabled={isSubmitting}
          icon={showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          onToggle={togglePasswordVisibility}
        />

        {/* Remember me checkbox */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-white bg-transparent text-white focus:ring-white focus:ring-offset-0"
              {...register('rememberMe')}
              disabled={isSubmitting}
            />
            <span className="ml-2 text-sm text-white">Remember me</span>
          </label>

          {/* Forgot password link - only for user login */}
          {type === 'user' && (
            <button
              type="button"
              onClick={() => router.push('/auth/forgot-password')}
              className="text-sm text-white hover:text-gray-300 transition-colors duration-300 focus:outline-none focus:underline"
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting || loading}
          className={`button button-primary button-large w-full flex items-center justify-center ${
            (!isValid || isSubmitting || loading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting || loading ? (
            <>
              <div className="loader w-5 h-5 mr-2"></div>
              Signing In...
            </>
          ) : (
            `Sign In${type === 'admin' ? ' as Admin' : ''}`
          )}
        </button>

        {/* Security notice for admin */}
        {type === 'admin' && (
          <div className="alert alert-info text-sm">
            <strong>Security Notice:</strong> Admin access is monitored and logged for security purposes.
          </div>
        )}

        {/* Sign up link - only for user login */}
        {type === 'user' && (
          <div className="text-center pt-4">
            <p className="text-white opacity-75">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/register')}
                className="font-medium text-white hover:text-gray-300 transition-colors duration-300 focus:outline-none focus:underline"
                disabled={isSubmitting}
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </form>

      {/* Additional security info for admin */}
      {type === 'admin' && (
        <div className="mt-8 text-center">
          <p className="text-xs text-white opacity-50">
            This is a secure area. Unauthorized access is prohibited.
          </p>
        </div>
      )}
    </div>
  );
};

// Enhanced login form with additional features
interface EnhancedLoginFormProps extends LoginFormProps {
  showSocialLogin?: boolean;
  allowGuestAccess?: boolean;
  brandLogo?: boolean;
}

export const EnhancedLoginForm: React.FC<EnhancedLoginFormProps> = ({
  brandLogo = true,
  showSocialLogin = false,
  allowGuestAccess = false,
  ...props
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand logo */}
        {brandLogo && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white uppercase tracking-wider">
              GRIZZLAND
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mt-4"></div>
          </div>
        )}

        {/* Login form */}
        <div className="bg-primary-bg border border-white rounded-lg p-8">
          <LoginForm {...props} />

          {/* Social login options */}
          {showSocialLogin && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white opacity-30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-primary-bg text-white opacity-75">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  className="button button-secondary w-full"
                  onClick={() => {/* Implement Google login */}}
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="button button-secondary w-full"
                  onClick={() => {/* Implement GitHub login */}}
                >
                  Continue with GitHub
                </button>
              </div>
            </div>
          )}

          {/* Guest access */}
          {allowGuestAccess && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-white opacity-75 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:underline"
              >
                Continue as guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 