import { z } from 'zod';

/**
 * CHECKOUT VALIDATION SCHEMA - GRIZZLAND
 * 
 * Following MONOCODE Principles:
 * - Explicit Error Handling: Comprehensive input validation
 * - Dependency Transparency: Clear schema definitions
 * - Observable Implementation: Validation with context
 */

// Colombian phone number validation
const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;

// Colombian postal code validation (6 digits)
const postalCodeRegex = /^\d{6}$/;

export const checkoutSchema = z.object({
  // Customer Information
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'First name can only contain letters'),
  
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'Last name can only contain letters'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters'),
  
  phone: z
    .string()
    .regex(phoneRegex, 'Please enter a valid phone number (10-15 digits)')
    .min(10, 'Phone number must be at least 10 digits'),
  
  // Shipping Address
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  
  city: z
    .string()
    .min(2, 'City name is required')
    .max(50, 'City name cannot exceed 50 characters'),
  
  department: z
    .string()
    .optional(),
  
  postalCode: z
    .string()
    .regex(postalCodeRegex, 'Postal code must be 6 digits')
    .optional(),
  
  // Payment Method
  paymentMethod: z.enum(['bank_transfer', 'nequi', 'pse'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  }),
  
  // Optional Fields
  promoCode: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 3, 'Promo code must be at least 3 characters'),
  
  // Terms and Conditions
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
  
  // Newsletter subscription (optional)
  subscribeNewsletter: z.boolean().optional()
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

/**
 * Transform frontend form data to backend API format
 * Following: Observable Implementation - clear data transformation
 */
export const transformToCheckoutRequest = (data: CheckoutFormData) => {
  console.log('CHECKOUT_DATA_TRANSFORM', {
    timestamp: new Date().toISOString(),
    paymentMethod: data.paymentMethod,
    hasPromoCode: !!data.promoCode,
    acceptedTerms: data.acceptTerms
  });

  return {
    payment_method: data.paymentMethod as 'bank_transfer' | 'nequi' | 'pse',
    shipping_address: {
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.replace(/\s+/g, ''),
      address: data.address.trim(),
      city: data.city.trim(),
      department: data.department?.trim(),
      postal_code: data.postalCode?.trim()
    },
    promo_code: data.promoCode?.trim() || undefined
  };
};

/**
 * Format validation errors for user display
 * Following: Explicit Error Handling - human-readable errors
 */
export const formatCheckoutValidationErrors = (errors: z.ZodError): string[] => {
  return errors.errors.map(error => {
    const field = error.path.join('.');
    return `${field}: ${error.message}`;
  });
};

/**
 * Colombian departments for address validation
 * Following: Dependency Transparency - clear data definitions
 */
export const COLOMBIAN_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada', 'Bogotá D.C.'
] as const;

/**
 * Payment method display information
 * Following: Observable Implementation - clear method descriptions
 */
export const PAYMENT_METHODS = {
  bank_transfer: {
    name: 'Bank Transfer',
    description: 'Direct bank transfer - Manual verification required',
    icon: '🏦',
    processingTime: '1-2 business days'
  },
  nequi: {
    name: 'Nequi',
    description: 'Mobile payment platform - Instant verification',
    icon: '📱',
    processingTime: 'Instant'
  },
  pse: {
    name: 'PSE',
    description: 'Online banking platform - Secure payment',
    icon: '💳',
    processingTime: 'Instant'
  }
} as const; 