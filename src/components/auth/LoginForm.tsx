'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { adminLoginSchema, LoginFormData } from '@/lib/validations/auth';
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

// Admin login form props
interface AdminLoginFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: AuthError) => void;
  redirectTo?: string;
  className?: string;
  brandLogo?: boolean;
  showSocialLogin?: boolean;
  allowGuestAccess?: boolean;
}

// Admin login form component
const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  onSuccess,
  onError,
  redirectTo = '/admin/dashboard',
  className = '',
  brandLogo = true,
}) => {
  const { signIn, loading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    setFocus,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(adminLoginSchema),
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
      router.push(redirectTo);
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
      {brandLogo && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white uppercase tracking-wide mb-2">
            Admin Access
          </h1>
          <p className="text-white opacity-75">
            Secure login for authorized personnel
          </p>
        </div>
      )}

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
          placeholder="Enter your admin email"
          error={errors.email?.message}
          register={register}
          required
        />

        {/* Password field */}
        <FormInput
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          error={errors.password?.message}
          register={register}
          icon={
            showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )
          }
          onToggle={togglePasswordVisibility}
          required
        />

        {/* Remember me checkbox */}
        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 text-white focus:ring-white border-gray-300 rounded"
            {...register('rememberMe')}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-white">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting || loading}
          className={`w-full btn-primary uppercase tracking-wide font-medium ${
            (!isValid || isSubmitting || loading)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white hover:text-primary-bg'
          }`}
        >
          {isSubmitting || loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Security notice */}
      <div className="mt-8 p-4 border border-yellow-500 rounded-md bg-yellow-500 bg-opacity-10">
        <h3 className="text-yellow-300 font-semibold text-sm mb-2 uppercase tracking-wide">
          Security Notice
        </h3>
        <ul className="text-yellow-200 text-xs space-y-1">
          <li>• All login attempts are monitored and logged</li>
          <li>• Unauthorized access attempts will be reported</li>
          <li>• Session timeout: 30 minutes of inactivity</li>
        </ul>
      </div>
    </div>
  );
};

// Export for backward compatibility
export const EnhancedLoginForm: React.FC<AdminLoginFormProps> = AdminLoginForm;
export default AdminLoginForm; 