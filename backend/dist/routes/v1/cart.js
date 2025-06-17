"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CartService_1 = require("../../services/CartService");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
const cartService = new CartService_1.CartService();
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const cart = await cartService.getCart(userId);
    res.json({
        success: true,
        data: cart,
        message: `Cart retrieved with ${cart.length} items`
    });
}));
router.get('/summary', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const summary = await cartService.getCartSummary(userId);
    res.json({
        success: true,
        data: summary,
        message: 'Cart summary retrieved successfully'
    });
}));
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const itemData = req.body;
    if (!itemData.product_id || !itemData.selected_color || !itemData.selected_size || !itemData.quantity) {
        throw new errorHandler_1.ApplicationError('Missing required fields: product_id, selected_color, selected_size, and quantity are required', 400, 'VALIDATION_ERROR');
    }
    if (itemData.quantity <= 0) {
        throw new errorHandler_1.ApplicationError('Quantity must be greater than 0', 400, 'VALIDATION_ERROR');
    }
    const cartItem = await cartService.addToCart(userId, itemData);
    res.status(201).json({
        success: true,
        data: cartItem,
        message: 'Item added to cart successfully'
    });
}));
router.put('/:itemId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (!itemId) {
        throw new errorHandler_1.ApplicationError('Item ID is required', 400, 'VALIDATION_ERROR');
    }
    if (!quantity || quantity <= 0) {
        throw new errorHandler_1.ApplicationError('Valid quantity is required', 400, 'VALIDATION_ERROR');
    }
    const updatedItem = await cartService.updateCartItemQuantity(userId, itemId, quantity);
    res.json({
        success: true,
        data: updatedItem,
        message: 'Cart item updated successfully'
    });
}));
router.delete('/:itemId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { itemId } = req.params;
    if (!itemId) {
        throw new errorHandler_1.ApplicationError('Item ID is required', 400, 'VALIDATION_ERROR');
    }
    await cartService.removeFromCart(userId, itemId);
    res.json({
        success: true,
        message: 'Item removed from cart successfully'
    });
}));
router.delete('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    await cartService.clearCart(userId);
    res.json({
        success: true,
        message: 'Cart cleared successfully'
    });
}));
router.get('/validate', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
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
exports.default = router;
//# sourceMappingURL=cart.js.map