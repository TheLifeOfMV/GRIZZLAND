import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { CartItem, CartItemInput, Product } from '../types';
import { ApplicationError } from '../middleware/errorHandler';
import { InventoryService } from './InventoryService';
import { shippingFee, calculateShippingWithRules } from '../utils/shippingUtils';

/**
 * Service for managing shopping cart with Supabase integration
 */
export class CartService {
  private supabase = createClient(config.supabase.url, config.supabase.serviceKey);
  private inventoryService = new InventoryService();

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
   * Enhanced with dedicated InventoryService for robust stock validation
   */
  async addToCart(userId: string, item: CartItemInput): Promise<CartItem> {
    return this.withRetry(async () => {
      const timestamp = new Date().toISOString();
      
      // Validate input
      if (!item.product_id || !item.selected_color || !item.selected_size || item.quantity <= 0) {
        console.warn('CART_ADD_INVALID_INPUT', {
          timestamp,
          userId,
          item,
          reason: 'Missing required fields or invalid quantity'
        });
        
        throw new ApplicationError(
          'Invalid cart item data: product_id, selected_color, selected_size, and valid quantity are required',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Use dedicated inventory service for stock validation
      const stockValidation = await this.inventoryService.validateStock(
        item.product_id, 
        item.quantity,
        { userId, cartId: `cart_${userId}` }
      );

      if (!stockValidation.available) {
        console.warn('CART_ADD_INSUFFICIENT_STOCK', {
          timestamp,
          userId,
          productId: item.product_id,
          requestedQuantity: item.quantity,
          availableStock: stockValidation.currentStock,
          stockValidation
        });

        throw new ApplicationError(
          stockValidation.message || 'Insufficient stock',
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
        
        // Re-validate stock for the new total quantity
        const totalStockValidation = await this.inventoryService.validateStock(
          item.product_id,
          newQuantity,
          { userId, cartId: `cart_${userId}` }
        );

        if (!totalStockValidation.available) {
          console.warn('CART_UPDATE_INSUFFICIENT_STOCK', {
            timestamp,
            userId,
            productId: item.product_id,
            existingQuantity: existingItem.quantity,
            additionalQuantity: item.quantity,
            newTotalQuantity: newQuantity,
            availableStock: totalStockValidation.currentStock
          });

          throw new ApplicationError(
            totalStockValidation.message || `Insufficient stock for total quantity ${newQuantity}`,
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

        console.log('CART_ITEM_UPDATED', {
          timestamp,
          userId,
          productId: item.product_id,
          previousQuantity: existingItem.quantity,
          additionalQuantity: item.quantity,
          newQuantity,
          stockValidation: totalStockValidation
        });
        
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
          console.error('CART_ADD_DATABASE_ERROR', {
            timestamp,
            userId,
            productId: item.product_id,
            error: error.message,
            item
          });

          throw new ApplicationError(
            `Failed to add item to cart: ${error.message}`,
            500,
            'ADD_ERROR'
          );
        }

        console.log('CART_ITEM_ADDED', {
          timestamp,
          userId,
          productId: item.product_id,
          quantity: item.quantity,
          selectedSize: item.selected_size,
          selectedColor: item.selected_color.name,
          stockValidation
        });
        
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
   * Get cart summary with totals using enhanced shipping utilities
   */
  async getCartSummary(userId: string): Promise<{
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
    itemCount: number;
    shippingDetails?: {
      method: 'standard' | 'express' | 'free';
      freeShippingThreshold: number;
      isEligibleForFreeShipping: boolean;
      remainingForFreeShipping: number;
    };
  }> {
    const timestamp = new Date().toISOString();
    const items = await this.getCart(userId);
    
    const subtotal = items.reduce((sum, item) => {
      const price = item.products?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Use enhanced shipping calculation with rules
    const shippingCalculation = calculateShippingWithRules({
      subtotal,
      userId,
      timestamp
    });

    const total = subtotal + shippingCalculation.fee;

    // Log cart summary calculation
    console.log('CART_SUMMARY_CALCULATED', {
      timestamp,
      userId,
      itemCount,
      subtotal,
      shipping: shippingCalculation.fee,
      total,
      shippingMethod: shippingCalculation.method,
      freeShippingEligible: shippingCalculation.isEligibleForFreeShipping
    });

    return {
      items,
      subtotal,
      shipping: shippingCalculation.fee,
      total,
      itemCount,
      shippingDetails: {
        method: shippingCalculation.method,
        freeShippingThreshold: shippingCalculation.freeShippingThreshold,
        isEligibleForFreeShipping: shippingCalculation.isEligibleForFreeShipping,
        remainingForFreeShipping: shippingCalculation.remainingForFreeShipping
      }
    };
  }

  /**
   * Validate cart before checkout using enhanced InventoryService
   */
  async validateCartForCheckout(userId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    items: CartItem[];
    stockValidations: any[];
  }> {
    const timestamp = new Date().toISOString();
    const items = await this.getCart(userId);
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('CART_CHECKOUT_VALIDATION_START', {
      timestamp,
      userId,
      itemCount: items.length
    });

    if (items.length === 0) {
      errors.push('Cart is empty');
      return { 
        valid: false, 
        errors, 
        warnings,
        items,
        stockValidations: []
      };
    }

    // Prepare items for bulk stock validation
    const itemsForValidation = items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity
    }));

    // Use InventoryService for comprehensive validation
    const bulkValidation = await this.inventoryService.validateMultipleStock(
      itemsForValidation,
      { userId, cartId: `checkout_${userId}` }
    );

         // Process validation results
     bulkValidation.results.forEach((validation, index) => {
       const cartItem = items[index];
       
       if (!cartItem) {
         errors.push(`Cart item at index ${index} not found for product ${validation.productId}`);
         return;
       }
       
       if (!validation.available) {
         errors.push(
           `${cartItem.products?.name || `Product ${validation.productId}`}: ${validation.message}`
         );
       }

       // Add warnings from stock validation
       if (validation.warnings) {
         validation.warnings.forEach(warning => {
           warnings.push(`${cartItem.products?.name || validation.productId}: ${warning}`);
         });
       }
     });

    // Add any bulk validation errors
    if (bulkValidation.errors.length > 0) {
      errors.push(...bulkValidation.errors);
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings,
      items,
      stockValidations: bulkValidation.results
    };

    console.log('CART_CHECKOUT_VALIDATION_COMPLETE', {
      timestamp,
      userId,
      itemCount: items.length,
      valid: result.valid,
      errorCount: errors.length,
      warningCount: warnings.length,
      validationSummary: {
        totalItems: items.length,
        validItems: bulkValidation.results.filter(v => v.available).length,
        invalidItems: bulkValidation.results.filter(v => !v.available).length
      }
    });

    return result;
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