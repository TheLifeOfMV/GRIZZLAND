"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentService_1 = require("../../services/PaymentService");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
const paymentService = new PaymentService_1.PaymentService();
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const checkoutData = req.body;
    if (!checkoutData.payment_method || !checkoutData.shipping_address) {
        throw new errorHandler_1.ApplicationError('Payment method and shipping address are required', 400, 'VALIDATION_ERROR');
    }
    const validPaymentMethods = ['bank_transfer', 'nequi', 'pse'];
    if (!validPaymentMethods.includes(checkoutData.payment_method)) {
        throw new errorHandler_1.ApplicationError('Invalid payment method. Supported methods: bank_transfer, nequi, pse', 400, 'INVALID_PAYMENT_METHOD');
    }
    const address = checkoutData.shipping_address;
    if (!address.first_name || !address.last_name || !address.email ||
        !address.phone || !address.address || !address.city || !address.postal_code) {
        throw new errorHandler_1.ApplicationError('Complete shipping address is required', 400, 'VALIDATION_ERROR');
    }
    const order = await paymentService.processCheckout(userId, checkoutData);
    res.status(201).json({
        success: true,
        data: {
            order,
            payment_instructions_text: paymentService.getPaymentInstructionsText(order.payment_instructions, order.payment_method)
        },
        message: 'Order created successfully'
    });
}));
router.get('/orders', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const orders = await paymentService.getUserOrders(userId, limit, offset);
    res.json({
        success: true,
        data: orders,
        message: `Found ${orders.length} orders`
    });
}));
router.get('/orders/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    if (!id) {
        throw new errorHandler_1.ApplicationError('Order ID is required', 400, 'VALIDATION_ERROR');
    }
    const order = await paymentService.getOrderById(id, userId);
    res.json({
        success: true,
        data: {
            order,
            payment_instructions_text: order.payment_instructions && order.payment_method ?
                paymentService.getPaymentInstructionsText(order.payment_instructions, order.payment_method) :
                null
        },
        message: 'Order retrieved successfully'
    });
}));
router.get('/payment-methods', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const paymentMethods = [
        {
            id: 'bank_transfer',
            name: 'Transferencia Bancaria',
            description: 'Transfiere desde tu banco a nuestra cuenta bancaria',
            icon: '🏦',
            processing_time: '1-2 días hábiles',
            fees: 'Sin costo adicional'
        },
        {
            id: 'nequi',
            name: 'Nequi',
            description: 'Paga fácil y rápido con tu app Nequi',
            icon: '📱',
            processing_time: 'Inmediato',
            fees: 'Sin costo adicional'
        },
        {
            id: 'pse',
            name: 'PSE',
            description: 'Pago seguro en línea a través del portal de tu banco',
            icon: '💳',
            processing_time: 'Inmediato',
            fees: 'Según tu banco'
        }
    ];
    res.json({
        success: true,
        data: paymentMethods,
        message: 'Payment methods retrieved successfully'
    });
}));
router.post('/validate-promo', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { promo_code, subtotal } = req.body;
    if (!promo_code || !subtotal) {
        throw new errorHandler_1.ApplicationError('Promo code and subtotal are required', 400, 'VALIDATION_ERROR');
    }
    try {
        const { data, error } = await paymentService.supabase
            .from('promo_codes')
            .select('*')
            .eq('code', promo_code)
            .eq('is_active', true)
            .single();
        if (error || !data) {
            throw new errorHandler_1.ApplicationError('Invalid or expired promo code', 400, 'INVALID_PROMO_CODE');
        }
        let discount = 0;
        if (data.discount_type === 'percentage') {
            discount = (subtotal * data.discount_value) / 100;
        }
        else if (data.discount_type === 'fixed') {
            discount = data.discount_value;
        }
        discount = Math.min(discount, subtotal);
        res.json({
            success: true,
            data: {
                code: data.code,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                discount_amount: discount,
                valid: true
            },
            message: 'Promo code is valid'
        });
    }
    catch (error) {
        throw error;
    }
}));
router.get('/shipping-info', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        data: {
            default_fee: 15000,
            free_shipping_threshold: 200000,
            estimated_delivery: '3-5 días hábiles',
            coverage: 'Todo Colombia',
            description: 'Envío nacional a través de nuestros aliados logísticos'
        },
        message: 'Shipping information retrieved successfully'
    });
}));
exports.default = router;
//# sourceMappingURL=checkout.js.map