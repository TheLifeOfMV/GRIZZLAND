import { Router, Response } from 'express';
import { CartService } from '../../services/CartService';
import { AuthenticatedRequest, ApiResponse, CartItemInput } from '../../types';
import { asyncHandler, ApplicationError } from '../../middleware/errorHandler';

const router = Router();
const cartService = new CartService();

/**
 * GET /api/v1/cart
 * Get user's cart with product details
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const cart = await cartService.getCart(userId);
  
  res.json({
    success: true,
    data: cart,
    message: `Cart retrieved with ${cart.length} items`
  });
}));

/**
 * GET /api/v1/cart/summary
 * Get cart summary with totals
 */
router.get('/summary', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const summary = await cartService.getCartSummary(userId);
  
  res.json({
    success: true,
    data: summary,
    message: 'Cart summary retrieved successfully'
  });
}));

/**
 * POST /api/v1/cart
 * Add item to cart
 */
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const itemData: CartItemInput = req.body;

  // Validate required fields
  if (!itemData.product_id || !itemData.selected_color || !itemData.selected_size || !itemData.quantity) {
    throw new ApplicationError(
      'Missing required fields: product_id, selected_color, selected_size, and quantity are required',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (itemData.quantity <= 0) {
    throw new ApplicationError(
      'Quantity must be greater than 0',
      400,
      'VALIDATION_ERROR'
    );
  }

  const cartItem = await cartService.addToCart(userId, itemData);
  
  res.status(201).json({
    success: true,
    data: cartItem,
    message: 'Item added to cart successfully'
  });
}));

/**
 * PUT /api/v1/cart/:itemId
 * Update cart item quantity
 */
router.put('/:itemId', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!itemId) {
    throw new ApplicationError('Item ID is required', 400, 'VALIDATION_ERROR');
  }

  if (!quantity || quantity <= 0) {
    throw new ApplicationError(
      'Valid quantity is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const updatedItem = await cartService.updateCartItemQuantity(userId, itemId, quantity);
  
  res.json({
    success: true,
    data: updatedItem,
    message: 'Cart item updated successfully'
  });
}));

/**
 * DELETE /api/v1/cart/:itemId
 * Remove item from cart
 */
router.delete('/:itemId', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const { itemId } = req.params;

  if (!itemId) {
    throw new ApplicationError('Item ID is required', 400, 'VALIDATION_ERROR');
  }

  await cartService.removeFromCart(userId, itemId);
  
  res.json({
    success: true,
    message: 'Item removed from cart successfully'
  });
}));

/**
 * DELETE /api/v1/cart
 * Clear entire cart
 */
router.delete('/', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;

  await cartService.clearCart(userId);
  
  res.json({
    success: true,
    message: 'Cart cleared successfully'
  });
}));

/**
 * GET /api/v1/cart/validate
 * Validate cart before checkout
 */
router.get('/validate', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const validation = await cartService.validateCartForCheckout(userId);
  
  res.json({
    success: validation.valid,
    data: {
      valid: validation.valid,
      errors: validation.errors,
      itemCount: validation.items.length
    },
    message: validation.valid ? 'Cart is valid for checkout' : 'Cart validation failed'
  });
}));

export default router; 