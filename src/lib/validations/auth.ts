import { z } from 'zod';

// Email validation schema
const emailSchema = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .refine(
    (email) => email.includes('@') && email.includes('.'),
    'Please enter a valid email address'
  );

// Password validation schema
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(128, 'Password is too long')
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number'
  );

// Basic password schema for login (less strict)
const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password is too long');

// Name validation schema
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens');

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean().optional(),
});

// Registration form validation schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Password reset form validation schema
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// Update password form validation schema
export const updatePasswordSchema = z
  .object({
    currentPassword: loginPasswordSchema,
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// Profile update form validation schema
export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
});

// Base login schema for admin
export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email is too long')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional().default(false),
});

// Login form data type
export type LoginFormData = z.infer<typeof adminLoginSchema>;

// Password validation (for future use)
export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email validation
export const emailValidation = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(100, 'Email is too long')
  .transform((email) => email.toLowerCase().trim());

// Validation error mapping
export const getFieldError = (errors: z.ZodError, field: string): string | undefined => {
  const fieldError = errors.errors.find((error) => error.path.includes(field));
  return fieldError?.message;
};

// Helper function to format validation errors
export const formatValidationErrors = (error: z.ZodError): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });
  
  return formattedErrors;
};

// Custom validation functions
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid email format' };
  }
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  try {
    passwordSchema.parse(password);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid password format' };
  }
};

// Password strength calculation
export const calculatePasswordStrength = (password: string): {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  // Character type checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }
  
  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 3) {
    strength = 'fair';
  } else if (score <= 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }
  
  return { strength, score, feedback };
};

// Form validation state management
export interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export const createInitialValidationState = (): ValidationState => ({
  isValid: true,
  errors: {},
  touched: {},
});

export const updateValidationState = (
  state: ValidationState,
  field: string,
  value: string,
  schema: z.ZodSchema
): ValidationState => {
  const newState = { ...state };
  newState.touched[field] = true;
  
  try {
    schema.parse({ [field]: value });
    delete newState.errors[field];
  } catch (error) {
    if (error instanceof z.ZodError) {
      newState.errors[field] = getFieldError(error, field) || 'Invalid value';
    }
  }
  
  newState.isValid = Object.keys(newState.errors).length === 0;
  return newState;
}; 