import { transformToCheckoutRequest } from './validations/checkout';
import type { CheckoutFormData } from './validations/checkout';

/**
 * CHECKOUT SERVICE - GRIZZLAND
 * 
 * Following MONOCODE Principles:
 * - Observable Implementation: Structured logging for all operations
 * - Explicit Error Handling: Fail fast with contextual errors
 * - Dependency Transparency: Clear API interface declarations
 */

// Type definitions matching backend API
interface CheckoutRequest {
  payment_method: 'bank_transfer' | 'nequi' | 'pse';
  shipping_address: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    department?: string;
    postal_code?: string;
  };
  promo_code?: string;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_fee: number;
  status: string;
  payment_method: string;
  payment_instructions: PaymentInstructions;
  shipping_address: any;
  created_at: string;
}

interface PaymentInstructions {
  method: string;
  bank_info?: {
    bank_name: string;
    account_number: string;
    account_type: string;
    account_holder: string;
  };
  nequi_info?: {
    phone_number: string;
    reference: string;
  };
  pse_info?: {
    reference: string;
    redirect_url: string;
  };
  amount: number;
  order_id: string;
  expiry_time: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface CartValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  itemCount: number;
}

/**
 * Checkout Service Implementation
 * Following: Progressive Construction - build incrementally
 */
export class CheckoutService {
  private readonly baseUrl: string;
  
  constructor() {
    // Dependency Transparency - clear environment configuration
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  }

  /**
   * Validate cart before checkout
   * Following: Explicit Error Handling - validate before processing
   */
  async validateCart(): Promise<CartValidation> {
    const sessionId = `validation_${Date.now()}`;
    
    try {
      // Observable Implementation - Structured Logging
      console.log('CART_VALIDATION_START', {
        timestamp: new Date().toISOString(),
        sessionId,
        endpoint: `${this.baseUrl}/api/v1/cart/validate`
      });

      const response = await fetch(`${this.baseUrl}/api/v1/cart/validate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Auth header will be added by middleware
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Cart validation failed: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<CartValidation> = await response.json();

      // Observable Implementation - Log validation result
      console.log('CART_VALIDATION_COMPLETE', {
        timestamp: new Date().toISOString(),
        sessionId,
        valid: result.data.valid,
        itemCount: result.data.itemCount,
        errorCount: result.data.errors.length
      });

      return result.data;

    } catch (error) {
      // Explicit Error Handling - Fail Loud with context
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      
      console.error('CART_VALIDATION_ERROR', {
        timestamp: new Date().toISOString(),
        sessionId,
        error: errorMessage,
        endpoint: `${this.baseUrl}/api/v1/cart/validate`
      });

      throw new Error(`Cart validation failed: ${errorMessage}`);
    }
  }

  /**
   * Process checkout and create order
   * Following: Observable Implementation - comprehensive logging
   */
  async processCheckout(formData: CheckoutFormData): Promise<{
    order: Order;
    payment_instructions_text: string;
  }> {
    const sessionId = `checkout_${Date.now()}`;
    
    try {
      // Transform form data to API format
      const checkoutData = transformToCheckoutRequest(formData);

      // Observable Implementation - Structured Logging
      console.log('CHECKOUT_PROCESS_START', {
        timestamp: new Date().toISOString(),
        sessionId,
        paymentMethod: checkoutData.payment_method,
        hasPromoCode: !!checkoutData.promo_code,
        endpoint: `${this.baseUrl}/api/v1/checkout`
      });

      // Explicit Error Handling - Validate cart first
      const cartValidation = await this.validateCart();
      if (!cartValidation.valid) {
        throw new Error(`Cart validation failed: ${cartValidation.errors.join(', ')}`);
      }

      const response = await fetch(`${this.baseUrl}/api/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(checkoutData)
      });

      // Explicit Error Handling - Check response status
      if (!response.ok) {
        let errorMessage = `Checkout failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // Ignore JSON parse errors, use default message
        }
        
        throw new Error(errorMessage);
      }

      const result: ApiResponse<{
        order: Order;
        payment_instructions_text: string;
      }> = await response.json();

      // Observable Implementation - Log success
      console.log('CHECKOUT_PROCESS_SUCCESS', {
        timestamp: new Date().toISOString(),
        sessionId,
        orderId: result.data.order.id,
        paymentMethod: result.data.order.payment_method,
        totalAmount: result.data.order.total_amount
      });

      return result.data;

    } catch (error) {
      // Explicit Error Handling - Comprehensive error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown checkout error';
      
      console.error('CHECKOUT_PROCESS_ERROR', {
        timestamp: new Date().toISOString(),
        sessionId,
        error: errorMessage,
        paymentMethod: formData.paymentMethod,
        endpoint: `${this.baseUrl}/api/v1/checkout`
      });

      throw new Error(errorMessage);
    }
  }

  /**
   * Get order details by ID
   * Following: Observable Implementation - track order retrieval
   */
  async getOrder(orderId: string): Promise<{
    order: Order;
    payment_instructions_text: string | null;
  }> {
    const sessionId = `order_get_${Date.now()}`;
    
    try {
      console.log('ORDER_GET_START', {
        timestamp: new Date().toISOString(),
        sessionId,
        orderId,
        endpoint: `${this.baseUrl}/api/v1/checkout/orders/${orderId}`
      });

      const response = await fetch(`${this.baseUrl}/api/v1/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to get order: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<{
        order: Order;
        payment_instructions_text: string | null;
      }> = await response.json();

      console.log('ORDER_GET_SUCCESS', {
        timestamp: new Date().toISOString(),
        sessionId,
        orderId,
        orderStatus: result.data.order.status
      });

      return result.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('ORDER_GET_ERROR', {
        timestamp: new Date().toISOString(),
        sessionId,
        orderId,
        error: errorMessage
      });

      throw new Error(errorMessage);
    }
  }

  /**
   * Validate promo code
   * Following: Progressive Construction - optional enhancement
   */
  async validatePromoCode(promoCode: string, subtotal: number): Promise<{
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    discount_amount: number;
    valid: boolean;
  }> {
    const sessionId = `promo_validate_${Date.now()}`;
    
    try {
      console.log('PROMO_VALIDATION_START', {
        timestamp: new Date().toISOString(),
        sessionId,
        promoCode: promoCode.substring(0, 3) + '***', // Partial code for security
        subtotal
      });

      const response = await fetch(`${this.baseUrl}/api/v1/checkout/validate-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          promo_code: promoCode,
          subtotal
        })
      });

      if (!response.ok) {
        throw new Error(`Promo validation failed: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<{
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        discount_amount: number;
        valid: boolean;
      }> = await response.json();

      console.log('PROMO_VALIDATION_SUCCESS', {
        timestamp: new Date().toISOString(),
        sessionId,
        valid: result.data.valid,
        discountAmount: result.data.discount_amount
      });

      return result.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown promo error';
      
      console.error('PROMO_VALIDATION_ERROR', {
        timestamp: new Date().toISOString(),
        sessionId,
        error: errorMessage
      });

      throw new Error(errorMessage);
    }
  }
}

// Singleton instance for app-wide usage
// Following: Dependency Transparency - single source of truth
export const checkoutService = new CheckoutService(); 