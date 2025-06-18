'use client';

import React from 'react';
import CheckoutForm from '@/components/features/CheckoutForm';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * CHECKOUT PAGE - GRIZZLAND
 * 
 * Following MONOCODE Principles:
 * - Observable Implementation: Structured logging for checkout flow
 * - Progressive Construction: Minimal viable checkout page
 * - Explicit Error Handling: Redirect if cart empty
 */

export default function CheckoutPage() {
  const { cart } = useCart();
  const router = useRouter();

  // Observable Implementation - Structured Logging
  useEffect(() => {
    console.log('CHECKOUT_PAGE_ACCESS', {
      timestamp: new Date().toISOString(),
      cartItemCount: cart.items.length,
      cartTotal: cart.total,
      sessionId: `checkout_${Date.now()}`
    });

    // Explicit Error Handling - Fail Fast if cart empty
    if (cart.items.length === 0) {
      console.log('CHECKOUT_REDIRECT_EMPTY_CART', {
        timestamp: new Date().toISOString(),
        reason: 'Empty cart detected',
        redirectTo: '/products'
      });
      
      router.push('/products');
    }
  }, [cart.items.length, cart.total, router]);

  // Progressive Construction - Early return for empty cart
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4"></div>
          <p className="text-white">Redirecting to products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Header Section */}
      <div className="border-b border-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-white hover:opacity-80 transition-opacity duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Back</span>
            </button>
            
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
              Secure Checkout
            </h1>
            
            <div className="flex items-center text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <CheckoutForm />
        </div>
      </div>

      {/* Security Footer */}
      <div className="border-t border-white mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-white opacity-75">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs uppercase tracking-wider">SSL Secured</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-xs uppercase tracking-wider">Secure Payment</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs uppercase tracking-wider">Privacy Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 