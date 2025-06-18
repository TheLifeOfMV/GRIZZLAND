/**
 * GRIZZLAND Structured Logging Utility
 * Comprehensive logging system for observability and debugging
 * Following MONOCODE principles: Observable, Explicit Error Handling, Dependency Transparency
 */

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

/**
 * Core logging functions with structured output
 */
export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatLog(level: string, message: string, context: LogContext): string {
    const logEntry = {
      level,
      message,
      timestamp: context.timestamp || this.formatTimestamp(),
      service: 'grizzland-backend',
      ...context
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Info level logging for normal operations
   */
  static info(message: string, context: LogContext): void {
    console.log(this.formatLog('INFO', message, context));
  }

  /**
   * Warning level logging for concerning but non-critical issues
   */
  static warn(message: string, context: LogContext): void {
    console.warn(this.formatLog('WARN', message, context));
  }

  /**
   * Error level logging for errors and failures
   */
  static error(message: string, context: LogContext): void {
    console.error(this.formatLog('ERROR', message, context));
  }

  /**
   * Debug level logging for development and troubleshooting
   */
  static debug(message: string, context: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('DEBUG', message, context));
    }
  }
}

/**
 * Specialized logging functions for different operations
 */

/**
 * Log cart operations with structured context
 */
export const logCartOperation = (
  operation: 'ADD' | 'UPDATE' | 'REMOVE' | 'CLEAR' | 'VALIDATE' | 'CHECKOUT',
  success: boolean,
  context: CartOperationContext
): void => {
  const message = `Cart ${operation.toLowerCase()} ${success ? 'successful' : 'failed'}`;
  
  const logContext: CartOperationContext = {
    ...context,
    action: `CART_${operation}`,
    resource: 'cart',
    timestamp: context.timestamp || new Date().toISOString()
  };

  if (success) {
    Logger.info(message, logContext);
  } else {
    Logger.error(message, logContext);
  }
};

/**
 * Log inventory operations with stock tracking
 */
export const logInventoryOperation = (
  operation: 'VALIDATE' | 'DECREMENT' | 'INCREMENT' | 'RESERVE' | 'LOW_STOCK_ALERT',
  success: boolean,
  context: InventoryOperationContext
): void => {
  const message = `Inventory ${operation.toLowerCase()} ${success ? 'successful' : 'failed'}`;
  
  const logContext: InventoryOperationContext = {
    ...context,
    action: `INVENTORY_${operation}`,
    resource: 'inventory',
    timestamp: context.timestamp || new Date().toISOString()
  };

  if (success) {
    Logger.info(message, logContext);
  } else {
    Logger.error(message, logContext);
  }

  // Special handling for low stock alerts
  if (operation === 'LOW_STOCK_ALERT' && success) {
    const severity = context.newStock === 0 ? 'CRITICAL' : context.newStock! <= 2 ? 'HIGH' : 'MEDIUM';
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

/**
 * Log shipping calculations and validations
 */
export const logShippingOperation = (
  operation: 'CALCULATE' | 'VALIDATE_ADDRESS' | 'PROGRESS',
  success: boolean,
  context: ShippingOperationContext
): void => {
  const message = `Shipping ${operation.toLowerCase()} ${success ? 'successful' : 'failed'}`;
  
  const logContext: ShippingOperationContext = {
    ...context,
    action: `SHIPPING_${operation}`,
    resource: 'shipping',
    timestamp: context.timestamp || new Date().toISOString()
  };

  if (success) {
    Logger.info(message, logContext);
  } else {
    Logger.error(message, logContext);
  }
};

/**
 * Log API requests and responses
 */
export const logApiRequest = (
  context: ApiRequestContext
): void => {
  const message = `API ${context.method} ${context.endpoint}`;
  
  // Determine log level based on status code
  const statusCode = context.statusCode || 0;
  let logLevel: 'info' | 'warn' | 'error' = 'info';
  
  if (statusCode >= 400 && statusCode < 500) {
    logLevel = 'warn'; // Client errors
  } else if (statusCode >= 500) {
    logLevel = 'error'; // Server errors
  }

  // Add performance classification
  const responseTime = context.responseTime || 0;
  let performance: 'GOOD' | 'ACCEPTABLE' | 'SLOW' | 'CRITICAL' = 'GOOD';
  
  if (responseTime > 5000) {
    performance = 'CRITICAL';
  } else if (responseTime > 2000) {
    performance = 'SLOW';
  } else if (responseTime > 500) {
    performance = 'ACCEPTABLE';
  }

  const logContext: ApiRequestContext = {
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

/**
 * Log database operations with performance tracking
 */
export const logDatabaseOperation = (
  operation: string,
  table: string,
  success: boolean,
  context: {
    duration?: number;
    recordsAffected?: number;
    userId?: string;
    error?: string | Error;
    metadata?: Record<string, any>;
  }
): void => {
  const message = `Database ${operation} on ${table} ${success ? 'successful' : 'failed'}`;
  
  // Performance classification for database operations
  let performance: 'GOOD' | 'ACCEPTABLE' | 'SLOW' | 'CRITICAL' = 'GOOD';
  const duration = context.duration || 0;
  
  if (duration > 10000) {
    performance = 'CRITICAL';
  } else if (duration > 5000) {
    performance = 'SLOW';
  } else if (duration > 1000) {
    performance = 'ACCEPTABLE';
  }

  const logContext: LogContext = {
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
    } else {
      Logger.info(message, logContext);
    }
  } else {
    Logger.error(message, logContext);
  }
};

/**
 * Log authentication and authorization events
 */
export const logAuthEvent = (
  event: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'UNAUTHORIZED' | 'FORBIDDEN',
  success: boolean,
  context: {
    userId?: string;
    email?: string;
    role?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
  }
): void => {
  const message = `Auth ${event.toLowerCase()} ${success ? 'successful' : 'failed'}`;
  
  const logContext: LogContext = {
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
  } else {
    Logger.warn(message, logContext);
  }
};

/**
 * Log business logic events and metrics
 */
export const logBusinessEvent = (
  event: string,
  context: {
    userId?: string;
    value?: number;
    currency?: string;
    orderId?: string;
    productId?: string;
    category?: string;
    metadata?: Record<string, any>;
  }
): void => {
  const message = `Business event: ${event}`;
  
  const logContext: LogContext = {
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

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static activeOperations = new Map<string, number>();

  static start(operationId: string): void {
    this.activeOperations.set(operationId, Date.now());
  }

  static end(operationId: string, context: LogContext): number {
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

    // Log performance metrics
    let performance: 'GOOD' | 'ACCEPTABLE' | 'SLOW' | 'CRITICAL' = 'GOOD';
    
    if (duration > 10000) {
      performance = 'CRITICAL';
    } else if (duration > 5000) {
      performance = 'SLOW';
    } else if (duration > 1000) {
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

// Export convenience functions for backward compatibility
export const logError = (message: string, error: Error, context?: Partial<LogContext>) => {
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

export const logInfo = (message: string, context?: Partial<LogContext>) => {
  Logger.info(message, {
    action: 'INFO',
    ...context
  });
};

export const logWarning = (message: string, context?: Partial<LogContext>) => {
  Logger.warn(message, {
    action: 'WARNING',
    ...context
  });
}; 