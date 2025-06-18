"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config/config");
const errorHandler_1 = require("../middleware/errorHandler");
const InventoryService_1 = require("./InventoryService");
const shippingUtils_1 = require("../utils/shippingUtils");
class CartService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceKey);
        this.inventoryService = new InventoryService_1.InventoryService();
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
            const timestamp = new Date().toISOString();
            if (!item.product_id || !item.selected_color || !item.selected_size || item.quantity <= 0) {
                console.warn('CART_ADD_INVALID_INPUT', {
                    timestamp,
                    userId,
                    item,
                    reason: 'Missing required fields or invalid quantity'
                });
                throw new errorHandler_1.ApplicationError('Invalid cart item data: product_id, selected_color, selected_size, and valid quantity are required', 400, 'VALIDATION_ERROR');
            }
            const stockValidation = await this.inventoryService.validateStock(item.product_id, item.quantity, { userId, cartId: `cart_${userId}` });
            if (!stockValidation.available) {
                console.warn('CART_ADD_INSUFFICIENT_STOCK', {
                    timestamp,
                    userId,
                    productId: item.product_id,
                    requestedQuantity: item.quantity,
                    availableStock: stockValidation.currentStock,
                    stockValidation
                });
                throw new errorHandler_1.ApplicationError(stockValidation.message || 'Insufficient stock', 400, 'INSUFFICIENT_STOCK');
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
                const totalStockValidation = await this.inventoryService.validateStock(item.product_id, newQuantity, { userId, cartId: `cart_${userId}` });
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
                    throw new errorHandler_1.ApplicationError(totalStockValidation.message || `Insufficient stock for total quantity ${newQuantity}`, 400, 'INSUFFICIENT_STOCK');
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
                    console.error('CART_ADD_DATABASE_ERROR', {
                        timestamp,
                        userId,
                        productId: item.product_id,
                        error: error.message,
                        item
                    });
                    throw new errorHandler_1.ApplicationError(`Failed to add item to cart: ${error.message}`, 500, 'ADD_ERROR');
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
        const timestamp = new Date().toISOString();
        const items = await this.getCart(userId);
        const subtotal = items.reduce((sum, item) => {
            const price = item.products?.price || 0;
            return sum + (price * item.quantity);
        }, 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const shippingCalculation = (0, shippingUtils_1.calculateShippingWithRules)({
            subtotal,
            userId,
            timestamp
        });
        const total = subtotal + shippingCalculation.fee;
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
    async validateCartForCheckout(userId) {
        const timestamp = new Date().toISOString();
        const items = await this.getCart(userId);
        const errors = [];
        const warnings = [];
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
        const itemsForValidation = items.map(item => ({
            productId: item.product_id,
            quantity: item.quantity
        }));
        const bulkValidation = await this.inventoryService.validateMultipleStock(itemsForValidation, { userId, cartId: `checkout_${userId}` });
        bulkValidation.results.forEach((validation, index) => {
            const cartItem = items[index];
            if (!cartItem) {
                errors.push(`Cart item at index ${index} not found for product ${validation.productId}`);
                return;
            }
            if (!validation.available) {
                errors.push(`${cartItem.products?.name || `Product ${validation.productId}`}: ${validation.message}`);
            }
            if (validation.warnings) {
                validation.warnings.forEach(warning => {
                    warnings.push(`${cartItem.products?.name || validation.productId}: ${warning}`);
                });
            }
        });
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