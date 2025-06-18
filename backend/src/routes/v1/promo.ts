import { Router, Response } from 'express';
import { PromoService } from '../../services/PromoService';
import { AuthenticatedRequest, ApiResponse } from '../../types';
import { asyncHandler, ApplicationError } from '../../middleware/errorHandler';

const router = Router();
const promoService = new PromoService();

/**
 * POST /api/v1/promo/generate
 * Generate new promo code (Admin only)
 */
router.post('/generate', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  // Check admin permissions
  if (!req.user || req.user.role !== 'admin') {
    throw new ApplicationError(
      'Admin access required for promo generation',
      403,
      'ADMIN_REQUIRED'
    );
  }

  const { discount, type, expirationDays, usageLimit, prefix } = req.body;

  // Validate required fields
  if (!discount || !type) {
    throw new ApplicationError(
      'Discount amount and type are required',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (type !== 'percentage' && type !== 'fixed') {
    throw new ApplicationError(
      'Discount type must be either "percentage" or "fixed"',
      400,
      'INVALID_DISCOUNT_TYPE'
    );
  }

  if (type === 'percentage' && (discount <= 0 || discount > 100)) {
    throw new ApplicationError(
      'Percentage discount must be between 1 and 100',
      400,
      'INVALID_PERCENTAGE'
    );
  }

  if (type === 'fixed' && discount <= 0) {
    throw new ApplicationError(
      'Fixed discount must be greater than 0',
      400,
      'INVALID_FIXED_AMOUNT'
    );
  }

  const promoCode = await promoService.generatePromoCode({
    discount,
    type,
    expirationDays: expirationDays || 30,
    usageLimit: usageLimit || 1,
    prefix: prefix || 'GRIZZLAND'
  });

  res.status(201).json({
    success: true,
    data: promoCode,
    message: 'Promo code generated successfully'
  });
}));

/**
 * POST /api/v1/promo/validate
 * Validate promo code without redeeming
 */
router.post('/validate', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { code, subtotal } = req.body;

  if (!code) {
    throw new ApplicationError(
      'Promo code is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const validation = await promoService.validatePromoCode(
    code,
    req.user?.id,
    subtotal
  );

  res.json({
    success: true,
    data: {
      valid: validation.valid,
      reason: validation.reason,
      discountAmount: validation.discountAmount,
      promoCode: validation.valid ? {
        code: validation.promoCode?.code,
        discount_type: validation.promoCode?.discount_type,
        discount_value: validation.promoCode?.discount_value,
        expires_at: validation.promoCode?.expires_at
      } : undefined
    },
    message: validation.valid ? 'Promo code is valid' : 'Promo code validation failed'
  });
}));

/**
 * POST /api/v1/promo/redeem
 * Redeem promo code (mark as used)
 */
router.post('/redeem', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    throw new ApplicationError(
      'Authentication required for promo redemption',
      401,
      'AUTH_REQUIRED'
    );
  }

  const { code, orderId } = req.body;

  if (!code) {
    throw new ApplicationError(
      'Promo code is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const redemption = await promoService.redeemPromoCode(
    code,
    req.user.id,
    orderId
  );

  res.json({
    success: true,
    data: {
      discountAmount: redemption.discountAmount,
      usageId: redemption.usageId,
      promoCode: {
        code: redemption.promoCode.code,
        discount_type: redemption.promoCode.discount_type,
        discount_value: redemption.promoCode.discount_value
      }
    },
    message: 'Promo code redeemed successfully'
  });
}));

/**
 * POST /api/v1/promo/welcome
 * Generate welcome promo for new user
 */
router.post('/welcome', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    throw new ApplicationError(
      'Authentication required',
      401,
      'AUTH_REQUIRED'
    );
  }

  // Check if user already has a welcome promo
  const { data: existingPromo } = await (promoService as any).supabase
    .from('promo_codes')
    .select('id')
    .like('code', 'WELCOME%')
    .eq('is_active', true)
    .single();

  if (existingPromo) {
    throw new ApplicationError(
      'Welcome promo already generated for this session',
      400,
      'WELCOME_PROMO_EXISTS'
    );
  }

  const welcomePromo = await promoService.generateWelcomePromo(req.user.id);

  res.status(201).json({
    success: true,
    data: welcomePromo,
    message: 'Welcome promo code generated successfully'
  });
}));

/**
 * GET /api/v1/promo/user-usage
 * Get user's promo code usage history
 */
router.get('/user-usage', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    throw new ApplicationError(
      'Authentication required',
      401,
      'AUTH_REQUIRED'
    );
  }

  const { data: usageHistory, error } = await (promoService as any).supabase
    .from('promo_code_usage')
    .select(`
      id,
      discount_amount,
      used_at,
      promo_codes(code, discount_type, discount_value),
      orders(id, total_amount)
    `)
    .eq('user_id', req.user.id)
    .order('used_at', { ascending: false });

  if (error) {
    throw new ApplicationError(
      `Failed to fetch usage history: ${error.message}`,
      500,
      'DATABASE_ERROR'
    );
  }

  res.json({
    success: true,
    data: usageHistory || [],
    message: 'User promo usage history retrieved successfully'
  });
}));

/**
 * GET /api/v1/promo/stats (Admin only)
 * Get promo code statistics
 */
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApplicationError(
      'Admin access required',
      403,
      'ADMIN_REQUIRED'
    );
  }

  // Get promo statistics
  const { data: promoStats, error: statsError } = await (promoService as any).supabase
    .from('promo_codes')
    .select('id, code, discount_type, discount_value, usage_limit, used_count, is_active, created_at');

  if (statsError) {
    throw new ApplicationError(
      `Failed to fetch promo stats: ${statsError.message}`,
      500,
      'DATABASE_ERROR'
    );
  }

  // Get usage statistics
  const { data: usageStats, error: usageError } = await (promoService as any).supabase
    .from('promo_code_usage')
    .select('id, discount_amount, used_at');

  if (usageError) {
    throw new ApplicationError(
      `Failed to fetch usage stats: ${usageError.message}`,
      500,
      'DATABASE_ERROR'
    );
  }

  const totalPromoCodes = promoStats?.length || 0;
  const activePromoCodes = promoStats?.filter(p => p.is_active).length || 0;
  const totalUsages = usageStats?.length || 0;
  const totalDiscountsGiven = usageStats?.reduce((sum, usage) => sum + Number(usage.discount_amount), 0) || 0;

  // Recent usage (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsages = usageStats?.filter(usage => 
    new Date(usage.used_at) >= thirtyDaysAgo
  ).length || 0;

  const stats = {
    overview: {
      total_promo_codes: totalPromoCodes,
      active_promo_codes: activePromoCodes,
      total_usages: totalUsages,
      recent_usages: recentUsages,
      total_discounts_given: totalDiscountsGiven
    },
    promo_codes: promoStats || [],
    recent_usage: usageStats?.slice(0, 10) || []
  };

  res.json({
    success: true,
    data: stats,
    message: 'Promo code statistics retrieved successfully'
  });
}));

export default router; 