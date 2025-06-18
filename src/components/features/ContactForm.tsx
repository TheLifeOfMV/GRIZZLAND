'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  UserIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { contactSchema, ContactFormData, formatContactValidationErrors } from '@/lib/validations/contact';

// Form input component following GRIZZLAND styling patterns
interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  register: any;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register,
  icon,
  disabled = false,
  required = false,
  rows,
  maxLength,
}) => {
  const isTextarea = type === 'textarea';
  
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      <div className="relative">
        {isTextarea ? (
          <textarea
            id={name}
            placeholder={placeholder}
            rows={rows || 4}
            maxLength={maxLength}
            className={`form-input resize-none ${error ? 'border-error focus:border-error focus:ring-error' : ''} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={disabled}
            {...register(name)}
          />
        ) : (
          <input
            id={name}
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`form-input ${error ? 'border-error focus:border-error focus:ring-error' : ''} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={disabled}
            {...register(name)}
          />
        )}
        {icon && !isTextarea && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white opacity-75">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {maxLength && isTextarea && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          Character limit: {maxLength}
        </p>
      )}
    </div>
  );
};

// Contact form props
interface ContactFormProps {
  onSuccess?: (data: ContactFormData) => void;
  onError?: (error: string) => void;
  className?: string;
  autoFocus?: boolean;
}

// Main contact form component
const ContactForm: React.FC<ContactFormProps> = ({
  onSuccess,
  onError,
  className = '',
  autoFocus = true,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    setFocus,
    clearErrors,
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  // Watch message length for character counter
  const messageValue = watch('message', '');

  // Observable Implementation - Structured Logging
  useEffect(() => {
    console.log('CONTACT_FORM_MOUNTED', {
      timestamp: new Date().toISOString(),
      component: 'ContactForm',
      autoFocus,
    });

    if (autoFocus) {
      setFocus('name');
    }
  }, [setFocus, autoFocus]);

  // Clear form error when user starts typing
  useEffect(() => {
    if (formError && Object.keys(touchedFields).length > 0) {
      setFormError(null);
      clearErrors();
    }
  }, [formError, touchedFields, clearErrors]);

  // Handle form submission
  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      setSubmitStatus('idle');

      // Observable Implementation - Log submission attempt
      console.log('CONTACT_FORM_SUBMIT_START', {
        timestamp: new Date().toISOString(),
        formData: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          hasSubject: !!data.subject,
          messageLength: data.message.length,
        },
      });

      // Make API call to backend
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit contact form');
      }

      // Success handling
      setSubmitStatus('success');
      setSuccessMessage(result.message || 'Thank you for your message! We\'ll get back to you soon.');
      
      // Observable Implementation - Log success
      console.log('CONTACT_FORM_SUBMIT_SUCCESS', {
        timestamp: new Date().toISOString(),
        submissionId: result.data?.id,
        responseTime: Date.now(),
      });

      // Success callback
      onSuccess?.(data);

      // Reset form after success
      setTimeout(() => {
        reset();
        setSubmitStatus('idle');
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      
      setFormError(errorMessage);
      setSubmitStatus('error');
      
      // Observable Implementation - Log error
      console.error('CONTACT_FORM_SUBMIT_ERROR', {
        timestamp: new Date().toISOString(),
        error: errorMessage,
        formData: data,
      });

      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Form header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white uppercase tracking-wide mb-4">
          Contact Us
        </h2>
        <p className="text-white opacity-75 text-lg">
          Get in touch with our team for any questions about orders, products, or general inquiries.
        </p>
      </div>

      {/* Success message */}
      {submitStatus === 'success' && successMessage && (
        <div className="alert alert-success mb-6" role="alert">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <strong>Success:</strong>
            <span className="ml-1">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Form error alert */}
      {formError && submitStatus === 'error' && (
        <div className="alert alert-error mb-6" role="alert">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            <strong>Error:</strong>
            <span className="ml-1">{formError}</span>
          </div>
        </div>
      )}

      {/* Contact form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Name and Email row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Full Name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            error={errors.name?.message}
            register={register}
            icon={<UserIcon className="w-5 h-5" />}
            maxLength={50}
            required
          />
          
          <FormInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter your email address"
            error={errors.email?.message}
            register={register}
            icon={<EnvelopeIcon className="w-5 h-5" />}
            maxLength={254}
            required
          />
        </div>

        {/* Phone and Subject row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="+57 300 123 4567"
            error={errors.phone?.message}
            register={register}
            icon={<PhoneIcon className="w-5 h-5" />}
            required
          />
          
          <FormInput
            label="Subject (Optional)"
            name="subject"
            type="text"
            placeholder="Brief subject of your inquiry"
            error={errors.subject?.message}
            register={register}
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
            maxLength={100}
          />
        </div>

        {/* Message field */}
        <FormInput
          label="Message"
          name="message"
          type="textarea"
          placeholder="Tell us about your inquiry, order questions, or feedback..."
          error={errors.message?.message}
          register={register}
          rows={6}
          maxLength={500}
          required
        />

        {/* Character counter for message */}
        <div className="text-right">
          <span className={`text-xs ${messageValue.length > 450 ? 'text-warning' : 'text-gray-400'}`}>
            {messageValue.length}/500 characters
          </span>
        </div>

        {/* Submit button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`button button-primary button-large min-w-[200px] ${
              (!isValid || isSubmitting) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-white hover:text-primary-bg'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="loader mr-2" style={{ width: '16px', height: '16px' }}></div>
                Sending...
              </div>
            ) : (
              'Send Message'
            )}
          </button>
        </div>
      </form>

      {/* Contact information */}
      <div className="mt-12 pt-8 border-t border-white border-opacity-20">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white uppercase tracking-wide mb-4">
            Other Ways to Reach Us
          </h3>
          <div className="space-y-2 text-white opacity-75">
            <p>📧 support@grizzland.com</p>
            <p>📞 +57 (1) 234-5678</p>
            <p>💬 Customer support hours: Mon-Fri 9:00 AM - 6:00 PM (COT)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm; 