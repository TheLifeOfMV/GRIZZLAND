'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

import { useCart } from '@/hooks/useCart';
import { checkoutService } from '@/lib/checkout-service';
import { 
  checkoutSchema, 
  CheckoutFormData, 
  PAYMENT_METHODS, 
  COLOMBIAN_DEPARTMENTS 
} from '@/lib/validations/checkout';
import { formatPrice } from '@/lib/data';
import PromoInput from './PromoInput';

/**
 * CHECKOUT FORM COMPONENT - GRIZZLAND
 * 
 * Following MONOCODE Principles:
 * - Observable Implementation: Comprehensive state logging
 * - Explicit Error Handling: Graceful error states with user feedback
 * - Progressive Construction: Multi-step form with validation
 * - Dependency Transparency: Clear component dependencies
 */

interface CheckoutState {
  currentStep: 'shipping' | 'payment' | 'review';
  isSubmitting: boolean;
  formError: string | null;
  validationErrors: string[];
  promoDiscount: number;
  appliedPromo: string | null;
}

const CheckoutForm: React.FC = () => {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  
  // Observable Implementation - Structured State Management
  const [state, setState] = useState<CheckoutState>({
    currentStep: 'shipping',
    isSubmitting: false,
    formError: null,
    validationErrors: [],
    promoDiscount: 0,
    appliedPromo: null
  });

  // Form management with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      paymentMethod: 'bank_transfer',
      acceptTerms: false,
      subscribeNewsletter: false
    }
  });

  const watchedFields = watch();

  // Observable Implementation - Component Mount Logging
  useEffect(() => {
    console.log('CHECKOUT_FORM_MOUNT', {
      timestamp: new Date().toISOString(),
      cartItems: cart.items.length,
      cartTotal: cart.total,
      currentStep: state.currentStep
    });
  }, []);

  // Calculate totals with promo discount
  const calculatedTotals = {
    subtotal: cart.subtotal,
    shipping: cart.shipping,
    discount: state.promoDiscount,
    total: cart.subtotal + cart.shipping - state.promoDiscount
  };

  // Step Navigation Functions
  const goToStep = (step: CheckoutState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
    
    console.log('CHECKOUT_STEP_CHANGE', {
      timestamp: new Date().toISOString(),
      fromStep: state.currentStep,
      toStep: step,
      formValid: isValid
    });
  };

  const nextStep = async () => {
    const currentStepFields = getCurrentStepFields();
    const isStepValid = await trigger(currentStepFields);
    
    if (isStepValid) {
      if (state.currentStep === 'shipping') {
        goToStep('payment');
      } else if (state.currentStep === 'payment') {
        goToStep('review');
      }
    }
  };

  const getCurrentStepFields = (): (keyof CheckoutFormData)[] => {
    switch (state.currentStep) {
      case 'shipping':
        return ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'department', 'postalCode'];
      case 'payment':
        return ['paymentMethod'];
      case 'review':
        return ['acceptTerms'];
      default:
        return [];
    }
  };

  // Promo Code Handlers
  const handlePromoApplied = (promo: any) => {
    setState(prev => ({
      ...prev,
      promoDiscount: promo.discount_amount || 0,
      appliedPromo: promo.code
    }));
    
    setValue('promoCode', promo.code);
    
    console.log('CHECKOUT_PROMO_APPLIED', {
      timestamp: new Date().toISOString(),
      promoCode: promo.code,
      discountAmount: promo.discount_amount,
      discountType: promo.discount_type
    });
  };

  const handlePromoRemoved = () => {
    setState(prev => ({
      ...prev,
      promoDiscount: 0,
      appliedPromo: null
    }));
    
    setValue('promoCode', undefined);
    
    console.log('CHECKOUT_PROMO_REMOVED', {
      timestamp: new Date().toISOString()
    });
  };

  // Form Submission
  const onSubmit = async (data: CheckoutFormData) => {
    setState(prev => ({ ...prev, isSubmitting: true, formError: null }));

    try {
      // Observable Implementation - Process Start Logging
      console.log('CHECKOUT_SUBMIT_START', {
        timestamp: new Date().toISOString(),
        paymentMethod: data.paymentMethod,
        hasPromoCode: !!data.promoCode,
        totalAmount: calculatedTotals.total
      });

      const result = await checkoutService.processCheckout(data);
      
      // Progressive Construction - Clear cart and navigate
      clearCart();
      
      // Observable Implementation - Success Logging
      console.log('CHECKOUT_SUBMIT_SUCCESS', {
        timestamp: new Date().toISOString(),
        orderId: result.order.id,
        paymentMethod: result.order.payment_method
      });

      router.push(`/checkout/confirmation/${result.order.id}`);

    } catch (error) {
      // Explicit Error Handling - User-friendly error display
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      
      setState(prev => ({ 
        ...prev, 
        formError: errorMessage,
        isSubmitting: false 
      }));

      console.error('CHECKOUT_SUBMIT_ERROR', {
        timestamp: new Date().toISOString(),
        error: errorMessage,
        paymentMethod: data.paymentMethod
      });
    }
  };

  // Progressive Construction - Early return for empty cart
  if (cart.items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <TruckIcon className="w-16 h-16 text-white opacity-50 mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Your cart is empty</p>
          <button 
            onClick={() => router.push('/products')}
            className="mt-4 button button-secondary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Side - Form */}
      <div className="lg:col-span-2">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {['shipping', 'payment', 'review'].map((step, index) => {
            const isActive = state.currentStep === step;
            const isCompleted = ['shipping', 'payment', 'review'].indexOf(state.currentStep) > index;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium uppercase tracking-wider
                  ${isActive ? 'border-white bg-white text-primary-bg' : 
                    isCompleted ? 'border-white bg-white text-primary-bg' : 'border-white border-opacity-30 text-white text-opacity-50'}
                `}>
                  {isCompleted ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={`
                    w-16 h-0.5 mx-4
                    ${isCompleted ? 'bg-white' : 'bg-white bg-opacity-30'}
                  `} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {state.formError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="alert alert-error mb-6"
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                <strong>Error:</strong>
                <span className="ml-1">{state.formError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Shipping Information Step */}
          <AnimatePresence mode="wait">
            {state.currentStep === 'shipping' && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
              >
                <div className="flex items-center mb-6">
                  <UserIcon className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Shipping Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="form-group">
                    <label className="form-label text-white">
                      First Name *
                    </label>
                    <input
                      type="text"
                      className={`form-input bg-transparent border-white text-white placeholder-gray-400 ${
                        errors.firstName ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your first name"
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="form-group">
                    <label className="form-label text-white">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      className={`form-input bg-transparent border-white text-white placeholder-gray-400 ${
                        errors.lastName ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your last name"
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label text-white flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className={`form-input bg-transparent border-white text-white placeholder-gray-400 ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      placeholder="your.email@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label className="form-label text-white flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      className={`form-input bg-transparent border-white text-white placeholder-gray-400 ${
                        errors.phone ? 'border-red-500' : ''
                      }`}
                      placeholder="+57 300 123 4567"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="form-group md:col-span-2">
                    <label className="form-label text-white flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      Street Address *
                    </label>
                    <input
                      type="text"
                      className={`form-input bg-transparent border-white text-white placeholder-gray-400 ${
                        errors.address ? 'border-red-500' : ''
                      }`}
                      placeholder="Calle 123 # 45-67, Apartment 890"
                      {...register('address')}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-400">{errors.address.message}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="form-group">
                    <label className="form-label text-white">
                      City *
                    </label>
                    <input
                      type="text"
                      className={`form-input bg-transparent border-white text-white placeholder-gray-400 ${
                        errors.city ? 'border-red-500' : ''
                      }`}
                      placeholder="Bogotá"
                      {...register('city')}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div className="form-group">
                    <label className="form-label text-white">
                      Department (Optional)
                    </label>
                    <select
                      className="form-input bg-transparent border-white text-white"
                      {...register('department')}
                    >
                      <option value="" className="bg-primary-bg">Select department</option>
                      {COLOMBIAN_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept} className="bg-primary-bg">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Postal Code */}
                  <div className="form-group">
                    <label className="form-label text-white">
                      Postal Code (Optional)
                    </label>
                    <input
                      type="text"
                      className={`form-input bg-transparent border-white text-white placeholder-gray-400 ${
                        errors.postalCode ? 'border-red-500' : ''
                      }`}
                      placeholder="110111"
                      {...register('postalCode')}
                    />
                    {errors.postalCode && (
                      <p className="mt-1 text-sm text-red-400">{errors.postalCode.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="button button-secondary"
                  >
                    Continue to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* Payment Method Step */}
            {state.currentStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
              >
                <div className="flex items-center mb-6">
                  <CreditCardIcon className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-4">
                  {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                    <label
                      key={key}
                      className={`
                        block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                        ${watchedFields.paymentMethod === key 
                          ? 'border-white bg-white bg-opacity-10' 
                          : 'border-white border-opacity-30 hover:border-opacity-50'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          value={key}
                          className="sr-only"
                          {...register('paymentMethod')}
                        />
                        <div className="flex items-center space-x-3 text-white">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <div className="font-medium text-lg">{method.name}</div>
                            <div className="text-sm opacity-75">{method.description}</div>
                            <div className="text-xs opacity-60">Processing: {method.processingTime}</div>
                          </div>
                        </div>
                        {watchedFields.paymentMethod === key && (
                          <CheckCircleIcon className="w-6 h-6 text-white ml-auto" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => goToStep('shipping')}
                    className="button button-secondary border-opacity-50 text-opacity-75"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="button button-secondary"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {/* Review Step */}
            {state.currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
              >
                <div className="flex items-center mb-6">
                  <ShieldCheckIcon className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Review & Confirm
                  </h2>
                </div>

                {/* Order Summary */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-white uppercase tracking-wider">
                    Order Summary
                  </h3>
                  
                  <div className="space-y-2 text-white">
                    <div className="flex justify-between">
                      <span>Subtotal ({cart.itemCount} items)</span>
                      <span>{formatPrice(calculatedTotals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{calculatedTotals.shipping === 0 ? 'FREE' : formatPrice(calculatedTotals.shipping)}</span>
                    </div>
                    {state.promoDiscount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount ({state.appliedPromo})</span>
                        <span>-{formatPrice(state.promoDiscount)}</span>
                      </div>
                    )}
                    <div className="border-t border-white border-opacity-20 pt-2">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>{formatPrice(calculatedTotals.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      {...register('acceptTerms')}
                    />
                    <span className="text-white text-sm">
                      I accept the{' '}
                      <a href="/terms" className="underline hover:opacity-80">
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="underline hover:opacity-80">
                        Privacy Policy
                      </a>
                      *
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-400">{errors.acceptTerms.message}</p>
                  )}

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      {...register('subscribeNewsletter')}
                    />
                    <span className="text-white text-sm opacity-75">
                      Subscribe to our newsletter for exclusive offers and updates
                    </span>
                  </label>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => goToStep('payment')}
                    className="button button-secondary border-opacity-50 text-opacity-75"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={state.isSubmitting || !isValid}
                    className="button button-secondary flex items-center space-x-2"
                  >
                    {state.isSubmitting ? (
                      <>
                        <div className="loader w-4 h-4"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Right Side - Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20 sticky top-8">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6">
            Order Summary
          </h3>

          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={`${item.product.id}-${item.selectedColor.code}-${item.selectedSize}`} 
                   className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {item.product.name}
                  </p>
                  <p className="text-white text-xs opacity-75">
                    {item.selectedColor.name} • {item.selectedSize} • Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-white text-sm font-medium">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Promo Code Input */}
          <div className="mb-6">
            <PromoInput
              onPromoApplied={handlePromoApplied}
              onPromoRemoved={handlePromoRemoved}
              subtotal={calculatedTotals.subtotal}
              appliedPromo={state.appliedPromo ? { code: state.appliedPromo } : null}
              className="mb-4"
            />
          </div>

          {/* Order Totals */}
          <div className="space-y-3 text-white">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(calculatedTotals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span className={calculatedTotals.shipping === 0 ? 'text-green-400' : ''}>
                {calculatedTotals.shipping === 0 ? 'FREE' : formatPrice(calculatedTotals.shipping)}
              </span>
            </div>
            {state.promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span>-{formatPrice(state.promoDiscount)}</span>
              </div>
            )}
            <div className="border-t border-white border-opacity-20 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(calculatedTotals.total)}</span>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="flex items-center justify-center space-x-4 text-white opacity-75">
              <div className="flex items-center text-xs">
                <ShieldCheckIcon className="w-4 h-4 mr-1" />
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center text-xs">
                <TruckIcon className="w-4 h-4 mr-1" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm; 