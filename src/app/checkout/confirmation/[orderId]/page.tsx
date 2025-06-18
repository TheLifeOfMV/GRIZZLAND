'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  TruckIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

import { checkoutService } from '@/lib/checkout-service';
import { formatPrice } from '@/lib/data';

/**
 * ORDER CONFIRMATION PAGE - GRIZZLAND
 * 
 * Following MONOCODE Principles:
 * - Observable Implementation: Order tracking and logging
 * - Explicit Error Handling: Graceful error states
 * - Progressive Construction: Incremental information display
 * - Graceful Fallbacks: Fallback for failed order retrieval
 */

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_fee: number;
  status: string;
  payment_method: string;
  payment_instructions: any;
  shipping_address: any;
  created_at: string;
}

interface ConfirmationState {
  order: Order | null;
  paymentInstructions: string | null;
  isLoading: boolean;
  error: string | null;
  copied: boolean;
}

export default function ConfirmationPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const { orderId } = params;
  
  const [state, setState] = useState<ConfirmationState>({
    order: null,
    paymentInstructions: null,
    isLoading: true,
    error: null,
    copied: false
  });

  // Observable Implementation - Order Retrieval
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('ORDER_CONFIRMATION_FETCH_START', {
          timestamp: new Date().toISOString(),
          orderId,
          source: 'confirmation_page'
        });

        const result = await checkoutService.getOrder(orderId);
        
        setState(prev => ({
          ...prev,
          order: result.order,
          paymentInstructions: result.payment_instructions_text,
          isLoading: false
        }));

        console.log('ORDER_CONFIRMATION_FETCH_SUCCESS', {
          timestamp: new Date().toISOString(),
          orderId,
          orderStatus: result.order.status,
          paymentMethod: result.order.payment_method
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load order';
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));

        console.error('ORDER_CONFIRMATION_FETCH_ERROR', {
          timestamp: new Date().toISOString(),
          orderId,
          error: errorMessage
        });
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Copy to clipboard functionality
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setState(prev => ({ ...prev, copied: true }));
      setTimeout(() => setState(prev => ({ ...prev, copied: false })), 2000);
      
      console.log('ORDER_CONFIRMATION_COPY', {
        timestamp: new Date().toISOString(),
        orderId,
        action: 'copy_order_id'
      });
    });
  };

  // Loading State
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 w-8 h-8 mx-auto"></div>
          <p className="text-white text-lg">Loading your order details...</p>
        </div>
      </div>
    );
  }

  // Error State - Graceful Fallbacks
  if (state.error || !state.order) {
    return (
      <div className="min-h-screen bg-primary-bg">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider mb-4">
              Order Not Found
            </h1>
            <p className="text-white opacity-75 mb-8">
              {state.error || 'We could not find the order you are looking for.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/products')}
                className="button button-secondary flex items-center justify-center space-x-2"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                <span>Continue Shopping</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="button button-secondary border-opacity-50 text-opacity-75 flex items-center justify-center space-x-2"
              >
                <HomeIcon className="w-5 h-5" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Header */}
      <div className="border-b border-white">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider mb-2">
              Order Confirmed
            </h1>
            <p className="text-white opacity-75">
              Thank you for your purchase! Your order has been successfully placed.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Order Details */}
            <div className="space-y-6">
              
              {/* Order Information */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
              >
                <div className="flex items-center mb-4">
                  <DocumentDuplicateIcon className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Order Details
                  </h2>
                </div>

                <div className="space-y-3 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-wider opacity-75">Order ID</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{state.order.id}</span>
                      <button
                        onClick={() => copyToClipboard(state.order.id)}
                        className="p-1 hover:opacity-80 transition-opacity"
                        title="Copy Order ID"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm uppercase tracking-wider opacity-75">Date</span>
                    <span className="text-sm">
                      {new Date(state.order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm uppercase tracking-wider opacity-75">Status</span>
                    <span className="text-sm px-2 py-1 bg-yellow-400 text-black rounded uppercase text-xs font-medium">
                      {state.order.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm uppercase tracking-wider opacity-75">Payment Method</span>
                    <span className="text-sm font-medium">
                      {state.order.payment_method.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="border-t border-white border-opacity-20 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span>{formatPrice(state.order.total_amount)}</span>
                    </div>
                    {state.order.shipping_fee > 0 && (
                      <div className="flex justify-between text-sm opacity-75">
                        <span>Including shipping</span>
                        <span>{formatPrice(state.order.shipping_fee)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {state.copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-green-400 text-sm text-center"
                  >
                    Order ID copied to clipboard!
                  </motion.div>
                )}
              </motion.div>

              {/* Shipping Address */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
              >
                <div className="flex items-center mb-4">
                  <TruckIcon className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Shipping Address
                  </h2>
                </div>

                <div className="text-white space-y-1">
                  <p className="font-medium">
                    {state.order.shipping_address.first_name} {state.order.shipping_address.last_name}
                  </p>
                  <p className="text-sm opacity-75">{state.order.shipping_address.email}</p>
                  <p className="text-sm opacity-75">{state.order.shipping_address.phone}</p>
                  <p className="text-sm">{state.order.shipping_address.address}</p>
                  <p className="text-sm">
                    {state.order.shipping_address.city}
                    {state.order.shipping_address.department && `, ${state.order.shipping_address.department}`}
                    {state.order.shipping_address.postal_code && ` ${state.order.shipping_address.postal_code}`}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Payment Instructions */}
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20 sticky top-8"
              >
                <div className="flex items-center mb-4">
                  <CreditCardIcon className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Payment Instructions
                  </h2>
                </div>

                {state.paymentInstructions ? (
                  <div className="text-white space-y-4">
                    <div className="bg-yellow-400 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <ClockIcon className="w-5 h-5 text-yellow-400 mr-2" />
                        <span className="text-yellow-400 font-medium">Action Required</span>
                      </div>
                      <p className="text-sm text-white">
                        Please complete your payment using the instructions below to confirm your order.
                      </p>
                    </div>

                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {state.paymentInstructions}
                    </div>

                    <div className="border-t border-white border-opacity-20 pt-4">
                      <p className="text-xs text-white opacity-60">
                        * Payment verification may take 1-2 business days for bank transfers.
                        For faster processing, use Nequi or PSE payments.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-white">
                    <p className="text-sm opacity-75">
                      Payment instructions are being generated. Please refresh the page in a moment.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 space-y-4"
              >
                <button
                  onClick={() => router.push('/products')}
                  className="w-full button button-secondary flex items-center justify-center space-x-2"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  <span>Continue Shopping</span>
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full button button-secondary border-opacity-50 text-opacity-75 flex items-center justify-center space-x-2"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Return Home</span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-white opacity-75">
            <p className="text-sm">
              Need help? Contact us at{' '}
              <a href="mailto:support@grizzland.com" className="underline hover:opacity-100">
                support@grizzland.com
              </a>{' '}
              or visit our{' '}
              <a href="/contact" className="underline hover:opacity-100">
                contact page
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 