'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, GiftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

/**
 * PHASE 2: DiscountModal Component
 * 
 * Purpose: First-visit discount modal with promo code display and email signup
 * Features: LocalStorage tracking, responsive design, accessibility support
 * Prevention: Cookie fallback, modal spam prevention, graceful UX timing
 */

interface DiscountModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  discount?: string;
  promoCode?: string;
  delayMs?: number;
  className?: string;
}

const STORAGE_KEY = 'grizzland_first_visit_modal_shown';
const COOKIE_KEY = 'grizzland_first_visit';

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  discount = '15%',
  promoCode = 'WELCOME15',
  delayMs = 3000,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Check if this is a controlled component
  const isControlled = controlledIsOpen !== undefined;

  useEffect(() => {
    if (isControlled) return;

    // Structured logging for observability
    console.log('DISCOUNT_MODAL_INIT', {
      timestamp: new Date().toISOString(),
      delayMs,
      component: 'DiscountModal'
    });

    const checkFirstVisit = () => {
      try {
        // Check localStorage first
        const hasSeenModal = localStorage.getItem(STORAGE_KEY);
        if (hasSeenModal) {
          console.log('DISCOUNT_MODAL_SKIP_LOCALSTORAGE', {
            timestamp: new Date().toISOString(),
            reason: 'Modal already shown'
          });
          return false;
        }
      } catch (error) {
        // Fallback to cookie if localStorage unavailable
        console.warn('DISCOUNT_MODAL_LOCALSTORAGE_ERROR', {
          timestamp: new Date().toISOString(),
          error: error.message,
          fallback: 'cookie'
        });
        
        const cookies = document.cookie.split(';');
        const hasSeenCookie = cookies.some(cookie => 
          cookie.trim().startsWith(`${COOKIE_KEY}=true`)
        );
        
        if (hasSeenCookie) {
          console.log('DISCOUNT_MODAL_SKIP_COOKIE', {
            timestamp: new Date().toISOString(),
            reason: 'Modal already shown (cookie fallback)'
          });
          return false;
        }
      }
      return true;
    };

    if (checkFirstVisit()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        console.log('DISCOUNT_MODAL_SHOW', {
          timestamp: new Date().toISOString(),
          delayMs
        });
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [delayMs, isControlled]);

  const handleClose = () => {
    console.log('DISCOUNT_MODAL_CLOSE', {
      timestamp: new Date().toISOString(),
      emailSubmitted: isSubmitted,
      component: 'DiscountModal'
    });

    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setIsOpen(false);
      markAsShown();
    }
  };

  const markAsShown = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      console.log('DISCOUNT_MODAL_MARKED_SHOWN_LOCALSTORAGE', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Fallback to cookie
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
      document.cookie = `${COOKIE_KEY}=true; expires=${expiryDate.toUTCString()}; path=/`;
      
      console.log('DISCOUNT_MODAL_MARKED_SHOWN_COOKIE', {
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Por favor ingresa un email válido');
      setIsSubmitting(false);
      return;
    }

    console.log('DISCOUNT_MODAL_EMAIL_SUBMIT', {
      timestamp: new Date().toISOString(),
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked email for privacy
      promoCode
    });

    try {
      // Simulate API call - replace with actual newsletter signup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
      console.log('DISCOUNT_MODAL_EMAIL_SUCCESS', {
        timestamp: new Date().toISOString(),
        promoCode
      });
      
      // Auto-close after successful submission
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (error) {
      setError('Error al suscribirse. Inténtalo de nuevo.');
      console.error('DISCOUNT_MODAL_EMAIL_ERROR', {
        timestamp: new Date().toISOString(),
        error: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPromoCode = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      console.log('DISCOUNT_MODAL_PROMO_COPIED', {
        timestamp: new Date().toISOString(),
        promoCode
      });
      // You could add a toast notification here
    } catch (error) {
      console.error('DISCOUNT_MODAL_COPY_ERROR', {
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };

  const modalIsOpen = isControlled ? controlledIsOpen : isOpen;

  return (
    <AnimatePresence>
      {modalIsOpen && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            transition={{ duration: 0.3 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
            initial={{ 
              opacity: 0, 
              scale: 0.8, 
              y: 50 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              y: 50 
            }}
            transition={{ 
              duration: 0.4,
              ease: "easeOut"
            }}
            role="dialog"
            aria-labelledby="discount-modal-title"
            aria-describedby="discount-modal-description"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-bg focus:ring-opacity-50 rounded-full transition-colors duration-200"
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Header Section */}
            <div className="bg-primary-bg text-white px-6 pt-8 pb-6 text-center relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="relative"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <GiftIcon className="w-8 h-8 text-white" />
                </div>
                
                <h2 
                  id="discount-modal-title"
                  className="text-2xl font-bold uppercase tracking-wide mb-2"
                >
                  ¡Bienvenido a GRIZZLAND!
                </h2>
                
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="inline-block bg-white text-primary-bg px-6 py-3 rounded-lg font-bold text-xl"
                >
                  {discount} DE DESCUENTO
                </motion.div>
              </motion.div>
            </div>

            {/* Content Section */}
            <div className="px-6 py-6">
              {!isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <p 
                    id="discount-modal-description"
                    className="text-gray-600 text-center mb-6 leading-relaxed"
                  >
                    Suscríbete a nuestro newsletter y obtén <strong>{discount} de descuento</strong> en tu primera compra. 
                    Además, recibe ofertas exclusivas y novedades de GRIZZLAND.
                  </p>

                  {/* Email Form */}
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="discount-email" className="sr-only">
                        Dirección de email
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="discount-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-bg focus:border-primary-bg transition-colors duration-200"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-red-600 text-sm text-center"
                      >
                        {error}
                      </motion.p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-bg text-white py-3 px-6 rounded-lg font-medium uppercase tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-bg focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Suscribiendo...
                        </div>
                      ) : (
                        'OBTENER DESCUENTO'
                      )}
                    </motion.button>
                  </form>

                  {/* Promo Code Display */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-600 text-center mb-2">
                      O usa este código en tu próxima compra:
                    </p>
                    <motion.button
                      onClick={copyPromoCode}
                      className="w-full bg-white border border-gray-300 py-2 px-4 rounded-lg font-mono font-bold text-lg text-primary-bg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-bg focus:ring-opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {promoCode}
                    </motion.button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Haz clic para copiar
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ¡Perfecto!
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    Te has suscrito exitosamente. Revisa tu email para confirmar tu suscripción 
                    y obtener tu código de descuento.
                  </p>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      Tu código: <span className="font-mono font-bold">{promoCode}</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-500 text-center">
                Al suscribirte, aceptas recibir emails promocionales de GRIZZLAND. 
                Puedes darte de baja en cualquier momento.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiscountModal; 