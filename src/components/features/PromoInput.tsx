'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TagIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * PHASE 4: PromoInput Component
 * 
 * Purpose: Promo code input and validation for checkout with discount calculation
 * Features: Real-time validation, visual feedback, error handling
 * Prevention: Invalid codes, network errors, pricing inconsistencies
 */

interface PromoCode {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_amount?: number;
  maximum_discount?: number;
  valid_until?: string;
  usage_limit?: number;
  used_count?: number;
}

interface PromoInputProps {
  onPromoApplied?: (promo: PromoCode) => void;
  onPromoRemoved?: () => void;
  subtotal?: number;
  appliedPromo?: PromoCode | null;
  className?: string;
  disabled?: boolean;
}

interface PromoState {
  code: string;
  isValidating: boolean;
  validationError: string | null;
  isValid: boolean;
  appliedCode: PromoCode | null;
  showSuccess: boolean;
}

const PromoInput: React.FC<PromoInputProps> = ({
  onPromoApplied,
  onPromoRemoved,
  subtotal = 0,
  appliedPromo = null,
  className = '',
  disabled = false
}) => {
  const [state, setState] = useState<PromoState>({
    code: '',
    isValidating: false,
    validationError: null,
    isValid: false,
    appliedCode: appliedPromo,
    showSuccess: false
  });

  // Mock promo codes for demonstration
  const mockPromoCodes: Record<string, PromoCode> = {
    'WELCOME15': {
      code: 'WELCOME15',
      discount_type: 'percentage',
      discount_value: 15,
      minimum_amount: 50000,
      valid_until: '2024-12-31T23:59:59Z'
    },
    'SAVE20K': {
      code: 'SAVE20K',
      discount_type: 'fixed',
      discount_value: 20000,
      minimum_amount: 100000,
      maximum_discount: 50000,
      valid_until: '2024-06-30T23:59:59Z'
    },
    'FIRSTBUY': {
      code: 'FIRSTBUY',
      discount_type: 'percentage',
      discount_value: 25,
      minimum_amount: 75000,
      maximum_discount: 30000,
      valid_until: '2024-12-31T23:59:59Z',
      usage_limit: 1,
      used_count: 0
    }
  };

  // Debounced validation function
  const validatePromoCode = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        setState(prev => ({
          ...prev,
          isValidating: false,
          validationError: null,
          isValid: false
        }));
        return;
      }

      setState(prev => ({ ...prev, isValidating: true, validationError: null }));

      console.log('PROMO_VALIDATION_START', {
        timestamp: new Date().toISOString(),
        code: code.toUpperCase(),
        subtotal,
        component: 'PromoInput'
      });

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const promoCode = mockPromoCodes[code.toUpperCase()];
        
        if (!promoCode) {
          throw new Error('Código promocional no válido');
        }

        // Check if expired
        if (promoCode.valid_until) {
          const now = new Date();
          const validUntil = new Date(promoCode.valid_until);
          if (now > validUntil) {
            throw new Error('Este código promocional ha expirado');
          }
        }

        // Check minimum amount
        if (promoCode.minimum_amount && subtotal < promoCode.minimum_amount) {
          const formattedMin = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(promoCode.minimum_amount);
          throw new Error(`Compra mínima requerida: ${formattedMin}`);
        }

        setState(prev => ({
          ...prev,
          isValidating: false,
          validationError: null,
          isValid: true,
          showSuccess: true
        }));

        console.log('PROMO_VALIDATION_SUCCESS', {
          timestamp: new Date().toISOString(),
          code: code.toUpperCase(),
          discountType: promoCode.discount_type,
          discountValue: promoCode.discount_value
        });

        setTimeout(() => {
          setState(prev => ({ ...prev, showSuccess: false }));
        }, 2000);

      } catch (error) {
        setState(prev => ({
          ...prev,
          isValidating: false,
          validationError: error.message,
          isValid: false,
          showSuccess: false
        }));

        console.error('PROMO_VALIDATION_ERROR', {
          timestamp: new Date().toISOString(),
          code: code.toUpperCase(),
          error: error.message
        });
      }
    },
    [subtotal]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.code && !state.appliedCode) {
        validatePromoCode(state.code);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state.code, validatePromoCode, state.appliedCode]);

  const handleApplyPromo = () => {
    const promoCode = mockPromoCodes[state.code.toUpperCase()];
    if (promoCode && state.isValid) {
      setState(prev => ({ ...prev, appliedCode: promoCode }));
      
      if (onPromoApplied) {
        onPromoApplied(promoCode);
      }

      console.log('PROMO_APPLIED', {
        timestamp: new Date().toISOString(),
        code: state.code.toUpperCase(),
        subtotal
      });
    }
  };

  const handleRemovePromo = () => {
    setState(prev => ({
      ...prev,
      code: '',
      appliedCode: null,
      isValid: false,
      validationError: null,
      showSuccess: false
    }));

    if (onPromoRemoved) {
      onPromoRemoved();
    }

    console.log('PROMO_REMOVED', {
      timestamp: new Date().toISOString(),
      code: state.appliedCode?.code
    });
  };

  const calculateDiscount = (promo: PromoCode, amount: number): number => {
    if (promo.discount_type === 'percentage') {
      let discount = (amount * promo.discount_value) / 100;
      if (promo.maximum_discount) {
        discount = Math.min(discount, promo.maximum_discount);
      }
      return discount;
    } else {
      return Math.min(promo.discount_value, amount);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const currentPromo = state.appliedCode || appliedPromo;
  const discount = currentPromo ? calculateDiscount(currentPromo, subtotal) : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {!currentPromo ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <TagIcon className="w-5 h-5 text-gray-500" />
            <label htmlFor="promo-code" className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              Código Promocional
            </label>
          </div>

          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                id="promo-code"
                type="text"
                value={state.code}
                onChange={(e) => setState(prev => ({ 
                  ...prev, 
                  code: e.target.value.toUpperCase(),
                  validationError: null,
                  isValid: false,
                  showSuccess: false
                }))}
                placeholder="Ingresa tu código"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  state.validationError
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : state.isValid
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-primary-bg focus:border-primary-bg'
                }`}
                disabled={disabled || state.isValidating}
                maxLength={20}
              />

              <AnimatePresence>
                {state.isValidating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-gray-300 border-t-primary-bg rounded-full"
                    />
                  </motion.div>
                )}

                {state.isValid && !state.isValidating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}

                {state.validationError && !state.isValidating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              onClick={handleApplyPromo}
              disabled={!state.isValid || state.isValidating || disabled}
              className="px-6 py-3 bg-primary-bg text-white rounded-lg font-medium uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all duration-200"
              whileHover={{ scale: disabled || !state.isValid || state.isValidating ? 1 : 1.02 }}
              whileTap={{ scale: disabled || !state.isValid || state.isValidating ? 1 : 0.98 }}
            >
              {state.isValidating ? 'Validando...' : 'Aplicar'}
            </motion.button>
          </div>

          <AnimatePresence>
            {state.validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <XCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{state.validationError}</p>
              </motion.div>
            )}

            {state.showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">¡Código válido! Haz clic en "Aplicar" para usar el descuento.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium">Códigos disponibles para prueba:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(mockPromoCodes).map(code => (
                <button
                  key={code}
                  onClick={() => setState(prev => ({ ...prev, code }))}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors duration-200"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TagIcon className="w-5 h-5 text-green-600" />
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-green-900 uppercase tracking-wide">
                    {currentPromo.code}
                  </h4>
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                </div>
                
                <p className="text-sm text-green-700 mt-1">
                  {currentPromo.discount_type === 'percentage'
                    ? `${currentPromo.discount_value}% de descuento`
                    : `${formatPrice(currentPromo.discount_value)} de descuento`
                  }
                  {currentPromo.maximum_discount && currentPromo.discount_type === 'percentage' && (
                    ` (máximo ${formatPrice(currentPromo.maximum_discount)})`
                  )}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-green-900">
                    Ahorras: {formatPrice(discount)}
                  </span>
                  
                  {currentPromo.valid_until && (
                    <div className="flex items-center text-xs text-green-600">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      Válido hasta {new Date(currentPromo.valid_until).toLocaleDateString('es-CO')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleRemovePromo}
              className="p-1 text-green-600 hover:text-green-800 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Remover código promocional"
            >
              <XCircleIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PromoInput; 