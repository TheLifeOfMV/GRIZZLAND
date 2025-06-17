import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { PaymentInstructions, PaymentMethod, Order, CheckoutRequest } from '../types';
import { ApplicationError } from '../middleware/errorHandler';
import { CartService } from './CartService';

/**
 * Service for handling Colombian payment methods and order processing
 */
export class PaymentService {
  private supabase = createClient(config.supabase.url, config.supabase.serviceKey);
  private cartService = new CartService();

  /**
   * Generate payment instructions for Colombian payment methods
   */
  generatePaymentInstructions(
    orderTotal: number, 
    orderId: string, 
    paymentMethod: PaymentMethod
  ): PaymentInstructions {
    const instructions: PaymentInstructions = {};

    switch (paymentMethod) {
      case 'bank_transfer':
        instructions.bank_transfer = {
          account_number: config.payment.bankAccountNumber,
          bank: config.payment.bankName,
          account_type: config.payment.bankAccountType,
          reference: orderId,
          amount: orderTotal
        };
        break;

      case 'nequi':
        instructions.nequi = {
          phone: config.payment.nequiPhone,
          reference: orderId,
          amount: orderTotal
        };
        break;

      case 'pse':
        instructions.pse = {
          redirect_url: `${config.frontendUrl}/payment/pse/${orderId}`,
          amount: orderTotal
        };
        break;

      default:
        throw new ApplicationError(
          'Invalid payment method',
          400,
          'INVALID_PAYMENT_METHOD'
        );
    }

    return instructions;
  }

  /**
   * Process checkout and create order
   */
  async processCheckout(userId: string, checkoutData: CheckoutRequest): Promise<Order> {
    try {
      // Validate cart before checkout
      const cartValidation = await this.cartService.validateCartForCheckout(userId);
      if (!cartValidation.valid) {
        throw new ApplicationError(
          `Cart validation failed: ${cartValidation.errors.join(', ')}`,
          400,
          'CART_VALIDATION_ERROR'
        );
      }

      // Get cart summary
      const cartSummary = await this.cartService.getCartSummary(userId);
      
      if (cartSummary.itemCount === 0) {
        throw new ApplicationError(
          'Cart is empty',
          400,
          'EMPTY_CART'
        );
      }

      // Apply promo code if provided
      let discount = 0;
      if (checkoutData.promo_code) {
        discount = await this.applyPromoCode(checkoutData.promo_code, cartSummary.subtotal);
      }

      const finalTotal = cartSummary.subtotal + cartSummary.shipping - discount;

      // Generate payment instructions
      const paymentInstructions = this.generatePaymentInstructions(
        finalTotal,
        '', // Will be set after order creation
        checkoutData.payment_method
      );

      // Create order
      const { data: order, error } = await this.supabase
        .from('orders')
        .insert([{
          user_id: userId,
          total_amount: finalTotal,
          shipping_fee: cartSummary.shipping,
          status: 'pending',
          payment_method: checkoutData.payment_method,
          payment_instructions: paymentInstructions,
          shipping_address: checkoutData.shipping_address
        }])
        .select()
        .single();

      if (error) {
        throw new ApplicationError(
          `Failed to create order: ${error.message}`,
          500,
          'ORDER_CREATE_ERROR'
        );
      }

      // Update payment instructions with actual order ID
      const updatedInstructions = this.generatePaymentInstructions(
        finalTotal,
        order.id,
        checkoutData.payment_method
      );

      // Update order with correct payment instructions
      const { data: updatedOrder, error: updateError } = await this.supabase
        .from('orders')
        .update({ payment_instructions: updatedInstructions })
        .eq('id', order.id)
        .select()
        .single();

      if (updateError) {
        throw new ApplicationError(
          `Failed to update payment instructions: ${updateError.message}`,
          500,
          'ORDER_UPDATE_ERROR'
        );
      }

      // Move cart items to order
      await this.cartService.moveCartToOrder(userId, order.id);

      // Decrement stock for ordered items
      await this.decrementStock(cartSummary.items);

      // Mark promo code as used if provided
      if (checkoutData.promo_code) {
        await this.markPromoCodeAsUsed(checkoutData.promo_code);
      }

      console.log('Order created successfully:', {
        orderId: order.id,
        userId,
        total: finalTotal,
        paymentMethod: checkoutData.payment_method
      });

      return updatedOrder;
    } catch (error) {
      console.error('Checkout process failed:', error);
      throw error;
    }
  }

  /**
   * Apply promo code and return discount amount
   */
  private async applyPromoCode(promoCode: string, subtotal: number): Promise<number> {
    const { data: promo, error } = await this.supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode)
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      throw new ApplicationError(
        'Invalid or expired promo code',
        400,
        'INVALID_PROMO_CODE'
      );
    }

    // Check if promo code has reached usage limit
    if (promo.used_count >= promo.usage_limit) {
      throw new ApplicationError(
        'Promo code usage limit exceeded',
        400,
        'PROMO_CODE_EXHAUSTED'
      );
    }

    // Check if promo code has expired
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      throw new ApplicationError(
        'Promo code has expired',
        400,
        'PROMO_CODE_EXPIRED'
      );
    }

    // Calculate discount
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = (subtotal * promo.discount_value) / 100;
    } else if (promo.discount_type === 'fixed') {
      discount = promo.discount_value;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    return discount;
  }

  /**
   * Mark promo code as used
   */
  private async markPromoCodeAsUsed(promoCode: string): Promise<void> {
    // First get current used_count
    const { data: promo } = await this.supabase
      .from('promo_codes')
      .select('used_count')
      .eq('code', promoCode)
      .single();

    if (promo) {
      const { error } = await this.supabase
        .from('promo_codes')
        .update({ used_count: promo.used_count + 1 })
        .eq('code', promoCode);

      if (error) {
        console.error('Failed to update promo code usage:', error);
        // Don't throw error here as order was already created successfully
      }
    }
  }

  /**
   * Decrement stock for ordered items
   */
  private async decrementStock(cartItems: any[]): Promise<void> {
    for (const item of cartItems) {
      // First get current stock
      const { data: product } = await this.supabase
        .from('products')
        .select('stock_count')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const newStock = Math.max(0, product.stock_count - item.quantity);
        const { error } = await this.supabase
          .from('products')
          .update({ stock_count: newStock })
          .eq('id', item.product_id);

        if (error) {
          console.error(`Failed to decrement stock for product ${item.product_id}:`, error);
          // Log but don't throw error to avoid order rollback
        }
      }
    }
  }

  /**
   * Get order by ID with payment details
   */
  async getOrderById(orderId: string, userId?: string): Promise<Order> {
    let query = this.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', orderId);

    // If userId provided, ensure user can only see their own orders
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApplicationError(
          'Order not found',
          404,
          'ORDER_NOT_FOUND'
        );
      }
      throw new ApplicationError(
        `Failed to fetch order: ${error.message}`,
        500,
        'FETCH_ERROR'
      );
    }

    return data;
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string, limit: number = 10, offset: number = 0): Promise<Order[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, images)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApplicationError(
        `Failed to fetch user orders: ${error.message}`,
        500,
        'FETCH_ERROR'
      );
    }

    return data || [];
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new ApplicationError(
        'Invalid order status',
        400,
        'INVALID_STATUS'
      );
    }

    const { data, error } = await this.supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApplicationError(
          'Order not found',
          404,
          'ORDER_NOT_FOUND'
        );
      }
      throw new ApplicationError(
        `Failed to update order status: ${error.message}`,
        500,
        'UPDATE_ERROR'
      );
    }

    console.log('Order status updated:', { orderId, status });
    return data;
  }

  /**
   * Generate payment instructions display text for frontend
   */
  getPaymentInstructionsText(instructions: PaymentInstructions, paymentMethod: PaymentMethod): string {
    switch (paymentMethod) {
      case 'bank_transfer':
        const bank = instructions.bank_transfer!;
        return `
Transferencia Bancaria:
• Banco: ${bank.bank}
• Número de cuenta: ${bank.account_number}
• Tipo de cuenta: ${bank.account_type}
• Referencia: ${bank.reference}
• Monto: $${bank.amount.toLocaleString('es-CO')}

Por favor envía el comprobante de pago por WhatsApp al finalizar la transferencia.
        `;

      case 'nequi':
        const nequi = instructions.nequi!;
        return `
Pago por Nequi:
• Número: ${nequi.phone}
• Referencia: ${nequi.reference}
• Monto: $${nequi.amount.toLocaleString('es-CO')}

Envía el dinero y luego comparte la captura de pantalla por WhatsApp.
        `;

      case 'pse':
        const pse = instructions.pse!;
        return `
Pago PSE:
• Monto: $${pse.amount.toLocaleString('es-CO')}
• Serás redirigido al portal de tu banco para completar el pago.

Haz clic en el enlace de pago para continuar.
        `;

      default:
        return 'Método de pago no válido';
    }
  }
} 