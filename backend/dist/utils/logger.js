"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWarning = exports.logInfo = exports.logError = exports.PerformanceMonitor = exports.logBusinessEvent = exports.logAuthEvent = exports.logDatabaseOperation = exports.logApiRequest = exports.logShippingOperation = exports.logInventoryOperation = exports.logCartOperation = exports.Logger = void 0;
class Logger {
    static formatTimestamp() {
        return new Date().toISOString();
    }
    static formatLog(level, message, context) {
        const logEntry = {
            level,
            message,
            timestamp: context.timestamp || this.formatTimestamp(),
            service: 'grizzland-backend',
            ...context
        };
        return JSON.stringify(logEntry);
    }
    static info(message, context) {
        console.log(this.formatLog('INFO', message, context));
    }
    static warn(message, context) {
        console.warn(this.formatLog('WARN', message, context));
    }
    static error(message, context) {
        console.error(this.formatLog('ERROR', message, context));
    }
    static debug(message, context) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatLog('DEBUG', message, context));
        }
    }
}
exports.Logger = Logger;
const logCartOperation = (operation, success, context) => {
    const message = `Cart ${operation.toLowerCase()} ${success ? 'successful' : 'failed'}`;
    const logContext = {
        ...context,
        action: `CART_${operation}`,
        resource: 'cart',
        timestamp: context.timestamp || new Date().toISOString()
    };
    if (success) {
        Logger.info(message, logContext);
    }
    else {
        Logger.error(message, logContext);
    }
};
exports.logCartOperation = logCartOperation;
const logInventoryOperation = (operation, success, context) => {
    const message = `Inventory ${operation.toLowerCase()} ${success ? 'successful' : 'failed'}`;
    const logContext = {
        ...context,
        action: `INVENTORY_${operation}`,
        resource: 'inventory',
        timestamp: context.timestamp || new Date().toISOString()
    };
    if (success) {
        Logger.info(message, logContext);
    }
    else {
        Logger.error(message, logContext);
    }
    if (operation === 'LOW_STOCK_ALERT' && success) {
        const severity = context.newStock === 0 ? 'CRITICAL' : context.newStock <= 2 ? 'HIGH' : 'MEDIUM';
        Logger.warn(`Low stock alert for product ${context.productId}`, {
            ...logContext,
            action: 'LOW_STOCK_ALERT',
            metadata: {
                ...logContext.metadata,
                severity
            }
        });
    }
};
exports.logInventoryOperation = logInventoryOperation;
const logShippingOperation = (operation, success, context) => {
    const message = `Shipping ${operation.toLowerCase()} ${success ? 'successful' : 'failed'}`;
    const logContext = {
        ...context,
        action: `SHIPPING_${operation}`,
        resource: 'shipping',
        timestamp: context.timestamp || new Date().toISOString()
    };
    if (success) {
        Logger.info(message, logContext);
    }
    else {
        Logger.error(message, logContext);
    }
};
exports.logShippingOperation = logShippingOperation;
const logApiRequest = (context) => {
    const message = `API ${context.method} ${context.endpoint}`;
    const statusCode = context.statusCode || 0;
    let logLevel = 'info';
    if (statusCode >= 400 && statusCode < 500) {
        logLevel = 'warn';
    }
    else if (statusCode >= 500) {
        logLevel = 'error';
    }
    const responseTime = context.responseTime || 0;
    let performance = 'GOOD';
    if (responseTime > 5000) {
        performance = 'CRITICAL';
    }
    else if (responseTime > 2000) {
        performance = 'SLOW';
    }
    else if (responseTime > 500) {
        performance = 'ACCEPTABLE';
    }
    const logContext = {
        ...context,
        action: 'API_REQUEST',
        resource: 'api',
        performance,
        timestamp: context.timestamp || new Date().toISOString()
    };
    switch (logLevel) {
        case 'info':
            Logger.info(message, logContext);
            break;
        case 'warn':
            Logger.warn(message, logContext);
            break;
        case 'error':
            Logger.error(message, logContext);
            break;
    }
};
exports.logApiRequest = logApiRequest;
const logDatabaseOperation = (operation, table, success, context) => {
    const message = `Database ${operation} on ${table} ${success ? 'successful' : 'failed'}`;
    let performance = 'GOOD';
    const duration = context.duration || 0;
    if (duration > 10000) {
        performance = 'CRITICAL';
    }
    else if (duration > 5000) {
        performance = 'SLOW';
    }
    else if (duration > 1000) {
        performance = 'ACCEPTABLE';
    }
    const logContext = {
        action: `DB_${operation.toUpperCase()}`,
        resource: table,
        duration: context.duration ? `${context.duration}ms` : undefined,
        performance,
        userId: context.userId,
        error: context.error instanceof Error ? context.error.message : context.error,
        metadata: {
            recordsAffected: context.recordsAffected,
            ...context.metadata
        },
        timestamp: new Date().toISOString()
    };
    if (success) {
        if (performance === 'SLOW' || performance === 'CRITICAL') {
            Logger.warn(message, logContext);
        }
        else {
            Logger.info(message, logContext);
        }
    }
    else {
        Logger.error(message, logContext);
    }
};
exports.logDatabaseOperation = logDatabaseOperation;
const logAuthEvent = (event, success, context) => {
    const message = `Auth ${event.toLowerCase()} ${success ? 'successful' : 'failed'}`;
    const logContext = {
        action: `AUTH_${event}`,
        resource: 'authentication',
        userId: context.userId,
        metadata: {
            email: context.email,
            role: context.role,
            ip: context.ip,
            userAgent: context.userAgent,
            endpoint: context.endpoint,
            reason: context.reason
        },
        timestamp: new Date().toISOString()
    };
    if (success) {
        Logger.info(message, logContext);
    }
    else {
        Logger.warn(message, logContext);
    }
};
exports.logAuthEvent = logAuthEvent;
const logBusinessEvent = (event, context) => {
    const message = `Business event: ${event}`;
    const logContext = {
        action: `BUSINESS_${event.toUpperCase().replace(/\s+/g, '_')}`,
        resource: 'business_logic',
        userId: context.userId,
        metadata: {
            value: context.value,
            currency: context.currency,
            orderId: context.orderId,
            productId: context.productId,
            category: context.category,
            ...context.metadata
        },
        timestamp: new Date().toISOString()
    };
    Logger.info(message, logContext);
};
exports.logBusinessEvent = logBusinessEvent;
class PerformanceMonitor {
    static start(operationId) {
        this.activeOperations.set(operationId, Date.now());
    }
    static end(operationId, context) {
        const startTime = this.activeOperations.get(operationId);
        if (!startTime) {
            Logger.warn('Performance monitor: Operation not found', {
                ...context,
                action: 'PERFORMANCE_MONITOR_ERROR',
                metadata: { operationId }
            });
            return 0;
        }
        const duration = Date.now() - startTime;
        this.activeOperations.delete(operationId);
        let performance = 'GOOD';
        if (duration > 10000) {
            performance = 'CRITICAL';
        }
        else if (duration > 5000) {
            performance = 'SLOW';
        }
        else if (duration > 1000) {
            performance = 'ACCEPTABLE';
        }
        Logger.info(`Operation completed: ${operationId}`, {
            ...context,
            action: 'PERFORMANCE_METRIC',
            duration: `${duration}ms`,
            performance,
            metadata: {
                operationId,
                ...context.metadata
            }
        });
        return duration;
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
PerformanceMonitor.activeOperations = new Map();
const logError = (message, error, context) => {
    Logger.error(message, {
        action: 'ERROR',
        error: error.message,
        metadata: {
            stack: error.stack,
            name: error.name
        },
        ...context
    });
};
exports.logError = logError;
const logInfo = (message, context) => {
    Logger.info(message, {
        action: 'INFO',
        ...context
    });
};
exports.logInfo = logInfo;
const logWarning = (message, context) => {
    Logger.warn(message, {
        action: 'WARNING',
        ...context
    });
};
exports.logWarning = logWarning;
//# sourceMappingURL=logger.js.map