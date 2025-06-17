import { Router, Response } from 'express';
import { PaymentService } from '../../services/PaymentService';
import { AuthenticatedRequest, ApiResponse, CheckoutRequest } from '../../types';
import { asyncHandler, ApplicationError } from '../../middleware/errorHandler';

const router = Router();
const paymentService = new PaymentService();

/**
 * POST /api/v1/checkout
 * Process checkout and create order
 */
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const checkoutData: CheckoutRequest = req.body;

  // Validate required fields
  if (!checkoutData.payment_method || !checkoutData.shipping_address) {
    throw new ApplicationError(
      'Payment method and shipping address are required',
      400,
      'VALIDATION_ERROR'
    );
  }

  // Validate payment method
  const validPaymentMethods = ['bank_transfer', 'nequi', 'pse'];
  if (!validPaymentMethods.includes(checkoutData.payment_method)) {
    throw new ApplicationError(
      'Invalid payment method. Supported methods: bank_transfer, nequi, pse',
      400,
      'INVALID_PAYMENT_METHOD'
    );
  }

  // Validate shipping address
  const address = checkoutData.shipping_address;
  if (!address.first_name || !address.last_name || !address.email || 
      !address.phone || !address.address || !address.city || !address.postal_code) {
    throw new ApplicationError(
      'Complete shipping address is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const order = await paymentService.processCheckout(userId, checkoutData);
  
  res.status(201).json({
    success: true,
    data: {
      order,
      payment_instructions_text: paymentService.getPaymentInstructionsText(
        order.payment_instructions!,
        order.payment_method!
      )
    },
    message: 'Order created successfully'
  });
}));

/**
 * GET /api/v1/checkout/orders
 * Get user's orders
 */
router.get('/orders', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const orders = await paymentService.getUserOrders(userId, limit, offset);
  
  res.json({
    success: true,
    data: orders,
    message: `Found ${orders.length} orders`
  });
}));

/**
 * GET /api/v1/checkout/orders/:id
 * Get order details by ID
 */
router.get('/orders/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const { id } = req.params;

  if (!id) {
    throw new ApplicationError('Order ID is required', 400, 'VALIDATION_ERROR');
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

/**
 * GET /api/v1/checkout/payment-methods
 * Get available payment methods with descriptions
 */
router.get('/payment-methods', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
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

/**
 * POST /api/v1/checkout/validate-promo
 * Validate promo code
 */
router.post('/validate-promo', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { promo_code, subtotal } = req.body;

  if (!promo_code || !subtotal) {
    throw new ApplicationError(
      'Promo code and subtotal are required',
      400,
      'VALIDATION_ERROR'
    );
  }

  try {
    // This is a simplified validation - in real implementation, you'd check the promo service
    const { data, error } = await (paymentService as any).supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promo_code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new ApplicationError(
        'Invalid or expired promo code',
        400,
        'INVALID_PROMO_CODE'
      );
    }

    // Calculate discount
    let discount = 0;
    if (data.discount_type === 'percentage') {
      discount = (subtotal * data.discount_value) / 100;
    } else if (data.discount_type === 'fixed') {
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
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/v1/checkout/shipping-info
 * Get shipping information
 */
router.get('/shipping-info', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
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

export default router; 