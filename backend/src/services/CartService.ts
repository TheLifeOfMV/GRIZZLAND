import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { CartItem, CartItemInput, Product } from '../types';
import { ApplicationError } from '../middleware/errorHandler';

/**
 * Service for managing shopping cart with Supabase integration
 */
export class CartService {
  private supabase = createClient(config.supabase.url, config.supabase.serviceKey);

  /**
   * Retry wrapper for database operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.warn(`Cart operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw new ApplicationError(
      `Cart operation failed after ${maxRetries} attempts: ${lastError!.message}`,
      500,
      'CART_ERROR'
    );
  }

  /**
   * Add item to cart or update quantity if item already exists
   */
  async addToCart(userId: string, item: CartItemInput): Promise<CartItem> {
    return this.withRetry(async () => {
      // Validate input
      if (!item.product_id || !item.selected_color || !item.selected_size || item.quantity <= 0) {
        throw new ApplicationError(
          'Invalid cart item data',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Check if product exists and has sufficient stock
      const { data: product } = await this.supabase
        .from('products')
        .select('stock_count, name')
        .eq('id', item.product_id)
        .single();

      if (!product) {
        throw new ApplicationError(
          'Product not found',
          404,
          'PRODUCT_NOT_FOUND'
        );
      }

      if (product.stock_count < item.quantity) {
        throw new ApplicationError(
          `Insufficient stock. Only ${product.stock_count} items available`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      // Check if item already exists in cart
      const { data: existingItem } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', item.product_id)
        .eq('selected_size', item.selected_size)
        .eq('selected_color->code', item.selected_color.code)
        .single();

      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + item.quantity;
        
        if (product.stock_count < newQuantity) {
          throw new ApplicationError(
            `Insufficient stock. Only ${product.stock_count} items available`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }

        const { data, error } = await this.supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select(`
            *,
            products (*)
          `)
          .single();

        if (error) {
          throw new ApplicationError(
            `Failed to update cart item: ${error.message}`,
            500,
            'UPDATE_ERROR'
          );
        }

        console.log('Cart item updated:', { userId, productId: item.product_id, newQuantity });
        return data;
      } else {
        // Add new item to cart
        const { data, error } = await this.supabase
          .from('cart_items')
          .insert([{ user_id: userId, ...item }])
          .select(`
            *,
            products (*)
          `)
          .single();

        if (error) {
          throw new ApplicationError(
            `Failed to add item to cart: ${error.message}`,
            500,
            'ADD_ERROR'
          );
        }

        console.log('Item added to cart:', { userId, productId: item.product_id, quantity: item.quantity });
        return data;
      }
    });
  }

  /**
   * Get user's cart with product details
   */
  async getCart(userId: string): Promise<CartItem[]> {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new ApplicationError(
          `Failed to fetch cart: ${error.message}`,
          500,
          'FETCH_ERROR'
        );
      }

      return data || [];
    });
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartItem> {
    return this.withRetry(async () => {
      if (quantity <= 0) {
        throw new ApplicationError(
          'Quantity must be greater than 0',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Get current cart item with product info
      const { data: cartItem } = await this.supabase
        .from('cart_items')
        .select(`
          *,
          products (stock_count, name)
        `)
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (!cartItem) {
        throw new ApplicationError(
          'Cart item not found',
          404,
          'ITEM_NOT_FOUND'
        );
      }

      // Check stock availability
      if (cartItem.products && cartItem.products.stock_count < quantity) {
        throw new ApplicationError(
          `Insufficient stock. Only ${cartItem.products.stock_count} items available`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      const { data, error } = await this.supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .eq('user_id', userId)
        .select(`
          *,
          products (*)
        `)
        .single();

      if (error) {
        throw new ApplicationError(
          `Failed to update cart item: ${error.message}`,
          500,
          'UPDATE_ERROR'
        );
      }

      console.log('Cart item quantity updated:', { userId, itemId, quantity });
      return data;
    });
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, itemId: string): Promise<void> {
    return this.withRetry(async () => {
      const { error } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        throw new ApplicationError(
          `Failed to remove item from cart: ${error.message}`,
          500,
          'REMOVE_ERROR'
        );
      }

      console.log('Item removed from cart:', { userId, itemId });
    });
  }

  /**
   * Clear entire cart for user
   */
  async clearCart(userId: string): Promise<void> {
    return this.withRetry(async () => {
      const { error } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new ApplicationError(
          `Failed to clear cart: ${error.message}`,
          500,
          'CLEAR_ERROR'
        );
      }

      console.log('Cart cleared:', { userId });
    });
  }

  /**
   * Get cart summary with totals
   */
  async getCartSummary(userId: string): Promise<{
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
    itemCount: number;
  }> {
    const items = await this.getCart(userId);
    
    const subtotal = items.reduce((sum, item) => {
      const price = item.products?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    const shipping = config.shipping.defaultFee;
    const total = subtotal + shipping;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      shipping,
      total,
      itemCount
    };
  }

  /**
   * Validate cart before checkout
   */
  async validateCartForCheckout(userId: string): Promise<{
    valid: boolean;
    errors: string[];
    items: CartItem[];
  }> {
    const items = await this.getCart(userId);
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors, items };
    }

    // Check stock availability for each item
    for (const item of items) {
      if (!item.products) {
        errors.push(`Product information not available for item ${item.id}`);
        continue;
      }

      if (item.products.stock_count < item.quantity) {
        errors.push(
          `Insufficient stock for ${item.products.name}. ` +
          `Requested: ${item.quantity}, Available: ${item.products.stock_count}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      items
    };
  }

  /**
   * Move cart items to order (used during checkout)
   */
  async moveCartToOrder(userId: string, orderId: string): Promise<void> {
    return this.withRetry(async () => {
      const cartItems = await this.getCart(userId);
      
      if (cartItems.length === 0) {
        throw new ApplicationError(
          'Cart is empty',
          400,
          'EMPTY_CART'
        );
      }

      // Create order items from cart items
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        selected_color: item.selected_color,
        selected_size: item.selected_size,
        quantity: item.quantity,
        unit_price: item.products?.price || 0
      }));

      const { error } = await this.supabase
        .from('order_items')
        .insert(orderItems);

      if (error) {
        throw new ApplicationError(
          `Failed to create order items: ${error.message}`,
          500,
          'ORDER_CREATE_ERROR'
        );
      }

      // Clear the cart after successful order creation
      await this.clearCart(userId);
      
      console.log('Cart moved to order:', { userId, orderId, itemCount: cartItems.length });
    });
  }
} 