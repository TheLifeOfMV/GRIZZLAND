export interface StockValidationResult {
    available: boolean;
    currentStock: number;
    requestedQuantity: number;
    productId: string;
    message?: string;
    warnings?: string[];
    timestamp: string;
}
export interface StockReservation {
    id: string;
    productId: string;
    userId: string;
    quantity: number;
    reservedAt: string;
    expiresAt: string;
    status: 'active' | 'expired' | 'consumed';
}
export interface StockChange {
    productId: string;
    previousStock: number;
    newStock: number;
    changeAmount: number;
    reason: 'sale' | 'restock' | 'adjustment' | 'reservation' | 'return' | 'damaged';
    userId?: string;
    orderId?: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface LowStockAlert {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    severity: 'warning' | 'critical' | 'out_of_stock';
    lastRestockDate?: string;
}
export declare class InventoryService {
    private supabase;
    private readonly DEFAULT_LOW_STOCK_THRESHOLD;
    private readonly RESERVATION_DURATION_MINUTES;
    private withRetry;
    validateStock(productId: string, quantity: number, context?: {
        userId?: string;
        cartId?: string;
    }): Promise<StockValidationResult>;
    reserveStock(productId: string, quantity: number, userId: string, context?: {
        cartId?: string;
        sessionId?: string;
    }): Promise<StockReservation>;
    decrementStock(productId: string, quantity: number, context: {
        orderId?: string;
        userId?: string;
        reason: 'sale' | 'adjustment' | 'damaged';
    }): Promise<StockChange>;
    incrementStock(productId: string, quantity: number, context: {
        userId?: string;
        reason: 'restock' | 'return' | 'adjustment';
        batchNumber?: string;
        supplier?: string;
    }): Promise<StockChange>;
    getLowStockProducts(threshold?: number): Promise<LowStockAlert[]>;
    private checkLowStockAlert;
    validateMultipleStock(items: Array<{
        productId: string;
        quantity: number;
    }>, context?: {
        userId?: string;
        cartId?: string;
    }): Promise<{
        valid: boolean;
        results: StockValidationResult[];
        errors: string[];
    }>;
}
//# sourceMappingURL=InventoryService.d.ts.map