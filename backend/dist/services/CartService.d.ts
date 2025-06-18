import { CartItem, CartItemInput } from '../types';
export declare class CartService {
    private supabase;
    private inventoryService;
    private withRetry;
    addToCart(userId: string, item: CartItemInput): Promise<CartItem>;
    getCart(userId: string): Promise<CartItem[]>;
    updateCartItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartItem>;
    removeFromCart(userId: string, itemId: string): Promise<void>;
    clearCart(userId: string): Promise<void>;
    getCartSummary(userId: string): Promise<{
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
    }>;
    validateCartForCheckout(userId: string): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
        items: CartItem[];
        stockValidations: any[];
    }>;
    moveCartToOrder(userId: string, orderId: string): Promise<void>;
}
//# sourceMappingURL=CartService.d.ts.map