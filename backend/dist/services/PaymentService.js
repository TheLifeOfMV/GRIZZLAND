"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config/config");
const errorHandler_1 = require("../middleware/errorHandler");
const CartService_1 = require("./CartService");
class PaymentService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceKey);
        this.cartService = new CartService_1.CartService();
    }
    generatePaymentInstructions(orderTotal, orderId, paymentMethod) {
        const instructions = {};
        switch (paymentMethod) {
            case 'bank_transfer':
                instructions.bank_transfer = {
                    account_number: config_1.config.payment.bankAccountNumber,
                    bank: config_1.config.payment.bankName,
                    account_type: config_1.config.payment.bankAccountType,
                    reference: orderId,
                    amount: orderTotal
                };
                break;
            case 'nequi':
                instructions.nequi = {
                    phone: config_1.config.payment.nequiPhone,
                    reference: orderId,
                    amount: orderTotal
                };
                break;
            case 'pse':
                instructions.pse = {
                    redirect_url: `${config_1.config.frontendUrl}/payment/pse/${orderId}`,
                    amount: orderTotal
                };
                break;
            default:
                throw new errorHandler_1.ApplicationError('Invalid payment method', 400, 'INVALID_PAYMENT_METHOD');
        }
        return instructions;
    }
    async processCheckout(userId, checkoutData) {
        try {
            const cartValidation = await this.cartService.validateCartForCheckout(userId);
            if (!cartValidation.valid) {
                throw new errorHandler_1.ApplicationError(`Cart validation failed: ${cartValidation.errors.join(', ')}`, 400, 'CART_VALIDATION_ERROR');
            }
            const cartSummary = await this.cartService.getCartSummary(userId);
            if (cartSummary.itemCount === 0) {
                throw new errorHandler_1.ApplicationError('Cart is empty', 400, 'EMPTY_CART');
            }
            let discount = 0;
            if (checkoutData.promo_code) {
                discount = await this.applyPromoCode(checkoutData.promo_code, cartSummary.subtotal);
            }
            const finalTotal = cartSummary.subtotal + cartSummary.shipping - discount;
            const paymentInstructions = this.generatePaymentInstructions(finalTotal, '', checkoutData.payment_method);
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
                throw new errorHandler_1.ApplicationError(`Failed to create order: ${error.message}`, 500, 'ORDER_CREATE_ERROR');
            }
            const updatedInstructions = this.generatePaymentInstructions(finalTotal, order.id, checkoutData.payment_method);
            const { data: updatedOrder, error: updateError } = await this.supabase
                .from('orders')
                .update({ payment_instructions: updatedInstructions })
                .eq('id', order.id)
                .select()
                .single();
            if (updateError) {
                throw new errorHandler_1.ApplicationError(`Failed to update payment instructions: ${updateError.message}`, 500, 'ORDER_UPDATE_ERROR');
            }
            await this.cartService.moveCartToOrder(userId, order.id);
            await this.decrementStock(cartSummary.items);
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
        }
        catch (error) {
            console.error('Checkout process failed:', error);
            throw error;
        }
    }
    async applyPromoCode(promoCode, subtotal) {
        const { data: promo, error } = await this.supabase
            .from('promo_codes')
            .select('*')
            .eq('code', promoCode)
            .eq('is_active', true)
            .single();
        if (error || !promo) {
            throw new errorHandler_1.ApplicationError('Invalid or expired promo code', 400, 'INVALID_PROMO_CODE');
        }
        if (promo.used_count >= promo.usage_limit) {
            throw new errorHandler_1.ApplicationError('Promo code usage limit exceeded', 400, 'PROMO_CODE_EXHAUSTED');
        }
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            throw new errorHandler_1.ApplicationError('Promo code has expired', 400, 'PROMO_CODE_EXPIRED');
        }
        let discount = 0;
        if (promo.discount_type === 'percentage') {
            discount = (subtotal * promo.discount_value) / 100;
        }
        else if (promo.discount_type === 'fixed') {
            discount = promo.discount_value;
        }
        discount = Math.min(discount, subtotal);
        return discount;
    }
    async markPromoCodeAsUsed(promoCode) {
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
            }
        }
    }
    async decrementStock(cartItems) {
        for (const item of cartItems) {
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
                }
            }
        }
    }
    async getOrderById(orderId, userId) {
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
        if (userId) {
            query = query.eq('user_id', userId);
        }
        const { data, error } = await query.single();
        if (error) {
            if (error.code === 'PGRST116') {
                throw new errorHandler_1.ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
            }
            throw new errorHandler_1.ApplicationError(`Failed to fetch order: ${error.message}`, 500, 'FETCH_ERROR');
        }
        return data;
    }
    async getUserOrders(userId, limit = 10, offset = 0) {
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
            throw new errorHandler_1.ApplicationError(`Failed to fetch user orders: ${error.message}`, 500, 'FETCH_ERROR');
        }
        return data || [];
    }
    async updateOrderStatus(orderId, status) {
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new errorHandler_1.ApplicationError('Invalid order status', 400, 'INVALID_STATUS');
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
                throw new errorHandler_1.ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
            }
            throw new errorHandler_1.ApplicationError(`Failed to update order status: ${error.message}`, 500, 'UPDATE_ERROR');
        }
        console.log('Order status updated:', { orderId, status });
        return data;
    }
    getPaymentInstructionsText(instructions, paymentMethod) {
        switch (paymentMethod) {
            case 'bank_transfer':
                const bank = instructions.bank_transfer;
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
                const nequi = instructions.nequi;
                return `
Pago por Nequi:
• Número: ${nequi.phone}
• Referencia: ${nequi.reference}
• Monto: $${nequi.amount.toLocaleString('es-CO')}

Envía el dinero y luego comparte la captura de pantalla por WhatsApp.
        `;
            case 'pse':
                const pse = instructions.pse;
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
exports.PaymentService = PaymentService;
//# sourceMappingURL=PaymentService.js.map