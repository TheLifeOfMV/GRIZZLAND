import { PaymentInstructions, PaymentMethod, Order, CheckoutRequest } from '../types';
export declare class PaymentService {
    private supabase;
    private cartService;
    generatePaymentInstructions(orderTotal: number, orderId: string, paymentMethod: PaymentMethod): PaymentInstructions;
    processCheckout(userId: string, checkoutData: CheckoutRequest): Promise<Order>;
    private applyPromoCode;
    private markPromoCodeAsUsed;
    private decrementStock;
    getOrderById(orderId: string, userId?: string): Promise<Order>;
    getUserOrders(userId: string, limit?: number, offset?: number): Promise<Order[]>;
    updateOrderStatus(orderId: string, status: string): Promise<Order>;
    getPaymentInstructionsText(instructions: PaymentInstructions, paymentMethod: PaymentMethod): string;
}
//# sourceMappingURL=PaymentService.d.ts.map