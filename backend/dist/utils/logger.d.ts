export interface LogContext {
    timestamp?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    action: string;
    resource?: string;
    metadata?: Record<string, any>;
    error?: string | Error;
    duration?: string;
    performance?: 'GOOD' | 'ACCEPTABLE' | 'SLOW' | 'CRITICAL';
}
export interface CartOperationContext extends LogContext {
    cartId?: string;
    productId?: string;
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
    stockAvailable?: number;
}
export interface InventoryOperationContext extends LogContext {
    productId: string;
    productName?: string;
    previousStock?: number;
    newStock?: number;
    changeAmount?: number;
    reason?: string;
    orderId?: string;
}
export interface ShippingOperationContext extends LogContext {
    subtotal?: number;
    shippingFee?: number;
    method?: string;
    destination?: {
        city?: string;
        department?: string;
    };
    freeShippingEligible?: boolean;
}
export interface ApiRequestContext extends LogContext {
    method: string;
    endpoint: string;
    statusCode?: number;
    userAgent?: string;
    ip?: string;
    responseTime?: number;
}
export declare class Logger {
    private static formatTimestamp;
    private static formatLog;
    static info(message: string, context: LogContext): void;
    static warn(message: string, context: LogContext): void;
    static error(message: string, context: LogContext): void;
    static debug(message: string, context: LogContext): void;
}
export declare const logCartOperation: (operation: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "VALIDATE" | "CHECKOUT", success: boolean, context: CartOperationContext) => void;
export declare const logInventoryOperation: (operation: "VALIDATE" | "DECREMENT" | "INCREMENT" | "RESERVE" | "LOW_STOCK_ALERT", success: boolean, context: InventoryOperationContext) => void;
export declare const logShippingOperation: (operation: "CALCULATE" | "VALIDATE_ADDRESS" | "PROGRESS", success: boolean, context: ShippingOperationContext) => void;
export declare const logApiRequest: (context: ApiRequestContext) => void;
export declare const logDatabaseOperation: (operation: string, table: string, success: boolean, context: {
    duration?: number;
    recordsAffected?: number;
    userId?: string;
    error?: string | Error;
    metadata?: Record<string, any>;
}) => void;
export declare const logAuthEvent: (event: "LOGIN" | "LOGOUT" | "TOKEN_REFRESH" | "UNAUTHORIZED" | "FORBIDDEN", success: boolean, context: {
    userId?: string;
    email?: string;
    role?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
}) => void;
export declare const logBusinessEvent: (event: string, context: {
    userId?: string;
    value?: number;
    currency?: string;
    orderId?: string;
    productId?: string;
    category?: string;
    metadata?: Record<string, any>;
}) => void;
export declare class PerformanceMonitor {
    private static activeOperations;
    static start(operationId: string): void;
    static end(operationId: string, context: LogContext): number;
}
export declare const logError: (message: string, error: Error, context?: Partial<LogContext>) => void;
export declare const logInfo: (message: string, context?: Partial<LogContext>) => void;
export declare const logWarning: (message: string, context?: Partial<LogContext>) => void;
//# sourceMappingURL=logger.d.ts.map