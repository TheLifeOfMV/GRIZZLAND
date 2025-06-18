import { config } from '../config/config';

/**
 * GRIZZLAND Shipping Utilities
 * Comprehensive shipping calculation and management
 * Following MONOCODE principles: Observable, Explicit Error Handling, Dependency Transparency
 */

export interface ShippingCalculation {
  fee: number;
  freeShippingThreshold: number;
  isEligibleForFreeShipping: boolean;
  remainingForFreeShipping: number;
  region?: string;
  estimatedDelivery: string;
  method: 'standard' | 'express' | 'free';
}

export interface ShippingContext {
  subtotal: number;
  destination?: {
    city: string;
    department?: string;
    postalCode?: string;
  };
  items?: Array<{
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }>;
  userId?: string;
  timestamp?: string;
}

/**
 * Core shipping fee calculation with observability
 * Failure Mode: Configuration missing → Default to 0, log error
 * Instrumentation: Log shipping calculations for audit
 */
export const shippingFee = (context?: ShippingContext): number => {
  try {
    const fee = config.shipping?.defaultFee;
    
    if (fee === undefined || fee === null) {
      console.error('SHIPPING_CONFIG_ERROR: Default shipping fee not configured', {
        timestamp: new Date().toISOString(),
        context: context || {},
        fallback: 0
      });
      return 0;
    }

    // Structured logging for audit trail
    console.log('SHIPPING_CALCULATION', {
      timestamp: new Date().toISOString(),
      fee,
      context: context || {},
      configSource: 'config.shipping.defaultFee'
    });

    return fee;
  } catch (error) {
    console.error('SHIPPING_CALCULATION_ERROR', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      context: context || {},
      fallback: 0
    });
    return 0;
  }
};

/**
 * Advanced shipping calculation with rules and regions
 * Future extensibility for region-based shipping
 */
export const calculateShippingWithRules = (context: ShippingContext): ShippingCalculation => {
  const startTime = Date.now();
  
  try {
    const baseFee = shippingFee(context);
    const freeShippingThreshold = 200000; // $200,000 COP
    const { subtotal = 0, destination } = context;

    // Free shipping logic
    const isEligibleForFreeShipping = subtotal >= freeShippingThreshold;
    const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);
    
    // Determine shipping method and fee
    let finalFee = baseFee;
    let method: 'standard' | 'express' | 'free' = 'standard';
    let estimatedDelivery = '3-5 días hábiles';

    if (isEligibleForFreeShipping) {
      finalFee = 0;
      method = 'free';
    }

    // Future: Region-based calculations
    if (destination?.department) {
      // Placeholder for region-specific logic
      const regionMultiplier = getRegionMultiplier(destination.department);
      if (!isEligibleForFreeShipping) {
        finalFee = Math.round(baseFee * regionMultiplier);
      }
    }

    const calculation: ShippingCalculation = {
      fee: finalFee,
      freeShippingThreshold,
      isEligibleForFreeShipping,
      remainingForFreeShipping,
      region: destination?.department,
      estimatedDelivery,
      method
    };

    // Performance and audit logging
    const duration = Date.now() - startTime;
    console.log('SHIPPING_RULES_CALCULATION', {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      input: context,
      output: calculation,
      performance: duration < 50 ? 'GOOD' : duration < 100 ? 'ACCEPTABLE' : 'SLOW'
    });

    return calculation;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('SHIPPING_RULES_ERROR', {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      context,
      fallback: {
        fee: 0,
        freeShippingThreshold: 200000,
        isEligibleForFreeShipping: false,
        remainingForFreeShipping: 200000,
        estimatedDelivery: '3-5 días hábiles',
        method: 'standard' as const
      }
    });

    // Return safe fallback
    return {
      fee: 0,
      freeShippingThreshold: 200000,
      isEligibleForFreeShipping: false,
      remainingForFreeShipping: 200000,
      estimatedDelivery: '3-5 días hábiles',
      method: 'standard'
    };
  }
};

/**
 * Region-based shipping multiplier
 * Future: Implement comprehensive region mapping
 */
const getRegionMultiplier = (department: string): number => {
  // Simplified region mapping - future enhancement
  const regionMap: Record<string, number> = {
    'Bogotá': 1.0,
    'Cundinamarca': 1.0,
    'Antioquia': 1.1,
    'Valle del Cauca': 1.1,
    'Atlántico': 1.2,
    'Santander': 1.1,
    // Remote regions
    'Amazonas': 1.5,
    'Guainía': 1.5,
    'Vaupés': 1.5,
    'Vichada': 1.5
  };

  return regionMap[department] || 1.2; // Default for unlisted departments
};

/**
 * Shipping validation for checkout
 * Explicit error handling with detailed context
 */
export const validateShippingAddress = (address: {
  city: string;
  department?: string;
  postalCode?: string;
  address: string;
}): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Required field validation
    if (!address.city?.trim()) {
      errors.push('City is required');
    }

    if (!address.address?.trim()) {
      errors.push('Street address is required');
    }

    // Postal code validation (Colombian format)
    if (address.postalCode) {
      const postalCodeRegex = /^\d{6}$/;
      if (!postalCodeRegex.test(address.postalCode)) {
        warnings.push('Postal code should be 6 digits (optional but recommended)');
      }
    }

    // Department validation
    if (address.department) {
      const validDepartments = [
        'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
        'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
        'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
        'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
        'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
        'Vaupés', 'Vichada', 'Bogotá'
      ];

      if (!validDepartments.includes(address.department)) {
        warnings.push(`Department '${address.department}' not recognized. Shipping may require manual verification.`);
      }
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings
    };

    // Log validation result
    console.log('SHIPPING_ADDRESS_VALIDATION', {
      timestamp: new Date().toISOString(),
      address: {
        city: address.city,
        department: address.department,
        hasPostalCode: !!address.postalCode
      },
      result
    });

    return result;

  } catch (error) {
    console.error('SHIPPING_VALIDATION_ERROR', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      address
    });

    return {
      valid: false,
      errors: ['Validation failed due to system error'],
      warnings: []
    };
  }
};

/**
 * Calculate shipping progress for UI
 * Used for free shipping progress bars
 */
export const calculateShippingProgress = (subtotal: number): {
  progress: number;
  remaining: number;
  threshold: number;
  isEligible: boolean;
} => {
  const threshold = 200000;
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - subtotal, 0);
  const isEligible = subtotal >= threshold;

  console.log('SHIPPING_PROGRESS_CALCULATION', {
    timestamp: new Date().toISOString(),
    subtotal,
    progress: `${progress.toFixed(1)}%`,
    remaining,
    isEligible
  });

  return {
    progress,
    remaining,
    threshold,
    isEligible
  };
};

// Export default shipping configuration for external use
export const SHIPPING_CONFIG = {
  DEFAULT_FEE: 15000,
  FREE_SHIPPING_THRESHOLD: 200000,
  STANDARD_DELIVERY: '3-5 días hábiles',
  EXPRESS_DELIVERY: '1-2 días hábiles',
  COVERAGE: 'Todo Colombia'
} as const; 