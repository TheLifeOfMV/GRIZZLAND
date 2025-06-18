import { z } from 'zod';

// Name validation schema (reusable)
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens')
  .transform((name) => name.trim());

// Email validation schema (following existing patterns)
const emailSchema = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .transform((email) => email.toLowerCase().trim())
  .refine(
    (email) => email.includes('@') && email.includes('.'),
    'Please enter a valid email address'
  );

// Colombian phone validation schema
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^(\+57)?[13-9]\d{9}$/,
    'Please enter a valid Colombian phone number (e.g., +573001234567 or 3001234567)'
  )
  .transform((phone) => {
    // Normalize phone number format
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('+57')) {
      return cleaned;
    } else if (cleaned.startsWith('57')) {
      return '+' + cleaned;
    } else {
      return '+57' + cleaned;
    }
  });

// Message validation schema
const messageSchema = z
  .string()
  .min(10, 'Message must be at least 10 characters')
  .max(500, 'Message is too long (maximum 500 characters)')
  .transform((message) => message.trim());

// Subject validation schema (optional field)
const subjectSchema = z
  .string()
  .min(5, 'Subject must be at least 5 characters')
  .max(100, 'Subject is too long')
  .optional()
  .transform((subject) => subject?.trim());

// Main contact form validation schema
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: subjectSchema,
  message: messageSchema,
});

// Contact form data type
export type ContactFormData = z.infer<typeof contactSchema>;

// Contact submission type for API
export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'responded' | 'closed';
  created_at?: string;
  updated_at?: string;
  admin_notes?: string;
}

// Contact response type for API
export interface ContactResponse {
  success: boolean;
  data?: ContactSubmission;
  message: string;
  errors?: Record<string, string>;
}

// Validation helpers
export const validateContactField = (
  field: keyof ContactFormData,
  value: string
): { isValid: boolean; error?: string } => {
  try {
    const fieldSchema = contactSchema.shape[field];
    fieldSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid input' };
  }
};

// Format validation errors
export const formatContactValidationErrors = (error: z.ZodError): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });
  
  return formattedErrors;
};

// Contact form initial values
export const getContactFormDefaults = (): Partial<ContactFormData> => ({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
});

// Phone number formatting helper
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('57')) {
    const number = cleaned.slice(2);
    return `+57 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  } else if (cleaned.length === 10) {
    return `+57 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
};

// Message preview for admin
export const getMessagePreview = (message: string, maxLength: number = 100): string => {
  if (message.length <= maxLength) {
    return message;
  }
  
  return message.slice(0, maxLength) + '...';
}; 