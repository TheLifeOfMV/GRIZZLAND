"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config/config");
const errorHandler_1 = require("../middleware/errorHandler");
class CartService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceKey);
    }
    async withRetry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`Cart operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }
        throw new errorHandler_1.ApplicationError(`Cart operation failed after ${maxRetries} attempts: ${lastError.message}`, 500, 'CART_ERROR');
    }
    async addToCart(userId, item) {
        return this.withRetry(async () => {
            if (!item.product_id || !item.selected_color || !item.selected_size || item.quantity <= 0) {
                throw new errorHandler_1.ApplicationError('Invalid cart item data', 400, 'VALIDATION_ERROR');
            }
            const { data: product } = await this.supabase
                .from('products')
                .select('stock_count, name')
                .eq('id', item.product_id)
                .single();
            if (!product) {
                throw new errorHandler_1.ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
            }
            if (product.stock_count < item.quantity) {
                throw new errorHandler_1.ApplicationError(`Insufficient stock. Only ${product.stock_count} items available`, 400, 'INSUFFICIENT_STOCK');
            }
            const { data: existingItem } = await this.supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', userId)
                .eq('product_id', item.product_id)
                .eq('selected_size', item.selected_size)
                .eq('selected_color->code', item.selected_color.code)
                .single();
            if (existingItem) {
                const newQuantity = existingItem.quantity + item.quantity;
                if (product.stock_count < newQuantity) {
                    throw new errorHandler_1.ApplicationError(`Insufficient stock. Only ${product.stock_count} items available`, 400, 'INSUFFICIENT_STOCK');
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
                    throw new errorHandler_1.ApplicationError(`Failed to update cart item: ${error.message}`, 500, 'UPDATE_ERROR');
                }
                console.log('Cart item updated:', { userId, productId: item.product_id, newQuantity });
                return data;
            }
            else {
                const { data, error } = await this.supabase
                    .from('cart_items')
                    .insert([{ user_id: userId, ...item }])
                    .select(`
            *,
            products (*)
          `)
                    .single();
                if (error) {
                    throw new errorHandler_1.ApplicationError(`Failed to add item to cart: ${error.message}`, 500, 'ADD_ERROR');
                }
                console.log('Item added to cart:', { userId, productId: item.product_id, quantity: item.quantity });
                return data;
            }
        });
    }
    async getCart(userId) {
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
                throw new errorHandler_1.ApplicationError(`Failed to fetch cart: ${error.message}`, 500, 'FETCH_ERROR');
            }
            return data || [];
        });
    }
    async updateCartItemQuantity(userId, itemId, quantity) {
        return this.withRetry(async () => {
            if (quantity <= 0) {
                throw new errorHandler_1.ApplicationError('Quantity must be greater than 0', 400, 'VALIDATION_ERROR');
            }
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
                throw new errorHandler_1.ApplicationError('Cart item not found', 404, 'ITEM_NOT_FOUND');
            }
            if (cartItem.products && cartItem.products.stock_count < quantity) {
                throw new errorHandler_1.ApplicationError(`Insufficient stock. Only ${cartItem.products.stock_count} items available`, 400, 'INSUFFICIENT_STOCK');
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
                throw new errorHandler_1.ApplicationError(`Failed to update cart item: ${error.message}`, 500, 'UPDATE_ERROR');
            }
            console.log('Cart item quantity updated:', { userId, itemId, quantity });
            return data;
        });
    }
    async removeFromCart(userId, itemId) {
        return this.withRetry(async () => {
            const { error } = await this.supabase
                .from('cart_items')
                .delete()
                .eq('id', itemId)
                .eq('user_id', userId);
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to remove item from cart: ${error.message}`, 500, 'REMOVE_ERROR');
            }
            console.log('Item removed from cart:', { userId, itemId });
        });
    }
    async clearCart(userId) {
        return this.withRetry(async () => {
            const { error } = await this.supabase
                .from('cart_items')
                .delete()
                .eq('user_id', userId);
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to clear cart: ${error.message}`, 500, 'CLEAR_ERROR');
            }
            console.log('Cart cleared:', { userId });
        });
    }
    async getCartSummary(userId) {
        const items = await this.getCart(userId);
        const subtotal = items.reduce((sum, item) => {
            const price = item.products?.price || 0;
            return sum + (price * item.quantity);
        }, 0);
        const shipping = config_1.config.shipping.defaultFee;
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
    async validateCartForCheckout(userId) {
        const items = await this.getCart(userId);
        const errors = [];
        if (items.length === 0) {
            errors.push('Cart is empty');
            return { valid: false, errors, items };
        }
        for (const item of items) {
            if (!item.products) {
                errors.push(`Product information not available for item ${item.id}`);
                continue;
            }
            if (item.products.stock_count < item.quantity) {
                errors.push(`Insufficient stock for ${item.products.name}. ` +
                    `Requested: ${item.quantity}, Available: ${item.products.stock_count}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            items
        };
    }
    async moveCartToOrder(userId, orderId) {
        return this.withRetry(async () => {
            const cartItems = await this.getCart(userId);
            if (cartItems.length === 0) {
                throw new errorHandler_1.ApplicationError('Cart is empty', 400, 'EMPTY_CART');
            }
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
                throw new errorHandler_1.ApplicationError(`Failed to create order items: ${error.message}`, 500, 'ORDER_CREATE_ERROR');
            }
            await this.clearCart(userId);
            console.log('Cart moved to order:', { userId, orderId, itemCount: cartItems.length });
        });
    }
}
exports.CartService = CartService;
//# sourceMappingURL=CartService.js.map