"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config/config");
const errorHandler_1 = require("../middleware/errorHandler");
class InventoryService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceKey);
        this.DEFAULT_LOW_STOCK_THRESHOLD = 5;
        this.RESERVATION_DURATION_MINUTES = 15;
    }
    async withRetry(operation, maxRetries = 3, delay = 1000, operationName = 'INVENTORY_OPERATION') {
        let lastError;
        const startTime = Date.now();
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                console.log(`${operationName}_SUCCESS`, {
                    timestamp: new Date().toISOString(),
                    attempt,
                    duration: `${Date.now() - startTime}ms`,
                    success: true
                });
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`${operationName}_RETRY`, {
                    timestamp: new Date().toISOString(),
                    attempt,
                    maxRetries,
                    error: lastError.message,
                    duration: `${Date.now() - startTime}ms`
                });
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }
        console.error(`${operationName}_FAILED`, {
            timestamp: new Date().toISOString(),
            attempts: maxRetries,
            duration: `${Date.now() - startTime}ms`,
            finalError: lastError.message
        });
        throw new errorHandler_1.ApplicationError(`${operationName} failed after ${maxRetries} attempts: ${lastError.message}`, 500, 'INVENTORY_ERROR');
    }
    async validateStock(productId, quantity, context) {
        return this.withRetry(async () => {
            const timestamp = new Date().toISOString();
            if (!productId || quantity <= 0) {
                const result = {
                    available: false,
                    currentStock: 0,
                    requestedQuantity: quantity,
                    productId,
                    message: 'Invalid product ID or quantity',
                    timestamp
                };
                console.warn('STOCK_VALIDATION_INVALID_INPUT', {
                    timestamp,
                    productId,
                    quantity,
                    context
                });
                return result;
            }
            const { data: product, error } = await this.supabase
                .from('products')
                .select('id, name, stock_count')
                .eq('id', productId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    throw new errorHandler_1.ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
                }
                throw new errorHandler_1.ApplicationError(`Failed to fetch product stock: ${error.message}`, 500, 'STOCK_FETCH_ERROR');
            }
            const currentStock = product.stock_count || 0;
            const available = currentStock >= quantity;
            const warnings = [];
            if (currentStock <= this.DEFAULT_LOW_STOCK_THRESHOLD && available) {
                warnings.push(`Low stock warning: Only ${currentStock} items remaining`);
            }
            if (quantity > 10) {
                warnings.push('Large quantity requested - may require special handling');
            }
            const result = {
                available,
                currentStock,
                requestedQuantity: quantity,
                productId,
                message: available
                    ? `Stock available: ${currentStock} units`
                    : `Insufficient stock: ${currentStock} available, ${quantity} requested`,
                warnings: warnings.length > 0 ? warnings : undefined,
                timestamp
            };
            console.log('STOCK_VALIDATION', {
                timestamp,
                productId,
                productName: product.name,
                requestedQuantity: quantity,
                currentStock,
                available,
                warnings,
                context: context || {}
            });
            return result;
        }, 3, 1000, 'STOCK_VALIDATION');
    }
    async reserveStock(productId, quantity, userId, context) {
        return this.withRetry(async () => {
            const timestamp = new Date().toISOString();
            const expiresAt = new Date(Date.now() + this.RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();
            const validation = await this.validateStock(productId, quantity, { userId, ...context });
            if (!validation.available) {
                throw new errorHandler_1.ApplicationError(validation.message || 'Insufficient stock for reservation', 400, 'INSUFFICIENT_STOCK');
            }
            const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reservation = {
                id: reservationId,
                productId,
                userId,
                quantity,
                reservedAt: timestamp,
                expiresAt,
                status: 'active'
            };
            console.log('STOCK_RESERVATION_CREATED', {
                timestamp,
                reservation,
                context: context || {},
                validationResult: validation
            });
            return reservation;
        }, 3, 1000, 'STOCK_RESERVATION');
    }
    async decrementStock(productId, quantity, context) {
        return this.withRetry(async () => {
            const timestamp = new Date().toISOString();
            const { data: product, error: fetchError } = await this.supabase
                .from('products')
                .select('id, name, stock_count')
                .eq('id', productId)
                .single();
            if (fetchError) {
                throw new errorHandler_1.ApplicationError(`Failed to fetch product for stock decrement: ${fetchError.message}`, 500, 'STOCK_FETCH_ERROR');
            }
            const previousStock = product.stock_count || 0;
            const newStock = Math.max(0, previousStock - quantity);
            if (previousStock < quantity) {
                console.error('STOCK_DECREMENT_INSUFFICIENT', {
                    timestamp,
                    productId,
                    productName: product.name,
                    previousStock,
                    requestedDecrement: quantity,
                    context
                });
                throw new errorHandler_1.ApplicationError(`Insufficient stock for decrement: ${previousStock} available, ${quantity} requested`, 400, 'INSUFFICIENT_STOCK');
            }
            const { error: updateError } = await this.supabase
                .from('products')
                .update({
                stock_count: newStock,
                updated_at: timestamp
            })
                .eq('id', productId);
            if (updateError) {
                throw new errorHandler_1.ApplicationError(`Failed to update stock: ${updateError.message}`, 500, 'STOCK_UPDATE_ERROR');
            }
            const stockChange = {
                productId,
                previousStock,
                newStock,
                changeAmount: -quantity,
                reason: context.reason,
                userId: context.userId,
                orderId: context.orderId,
                timestamp,
                metadata: {
                    operation: 'decrement',
                    success: true
                }
            };
            console.log('STOCK_DECREMENTED', {
                timestamp,
                productId,
                productName: product.name,
                stockChange,
                context
            });
            await this.checkLowStockAlert(productId, newStock, product.name);
            return stockChange;
        }, 3, 1000, 'STOCK_DECREMENT');
    }
    async incrementStock(productId, quantity, context) {
        return this.withRetry(async () => {
            const timestamp = new Date().toISOString();
            const { data: product, error: fetchError } = await this.supabase
                .from('products')
                .select('id, name, stock_count')
                .eq('id', productId)
                .single();
            if (fetchError) {
                throw new errorHandler_1.ApplicationError(`Failed to fetch product for stock increment: ${fetchError.message}`, 500, 'STOCK_FETCH_ERROR');
            }
            const previousStock = product.stock_count || 0;
            const newStock = previousStock + quantity;
            const { error: updateError } = await this.supabase
                .from('products')
                .update({
                stock_count: newStock,
                updated_at: timestamp
            })
                .eq('id', productId);
            if (updateError) {
                throw new errorHandler_1.ApplicationError(`Failed to update stock: ${updateError.message}`, 500, 'STOCK_UPDATE_ERROR');
            }
            const stockChange = {
                productId,
                previousStock,
                newStock,
                changeAmount: quantity,
                reason: context.reason,
                userId: context.userId,
                timestamp,
                metadata: {
                    operation: 'increment',
                    batchNumber: context.batchNumber,
                    supplier: context.supplier,
                    success: true
                }
            };
            console.log('STOCK_INCREMENTED', {
                timestamp,
                productId,
                productName: product.name,
                stockChange,
                context
            });
            return stockChange;
        }, 3, 1000, 'STOCK_INCREMENT');
    }
    async getLowStockProducts(threshold) {
        return this.withRetry(async () => {
            const stockThreshold = threshold || this.DEFAULT_LOW_STOCK_THRESHOLD;
            const { data: products, error } = await this.supabase
                .from('products')
                .select('id, name, stock_count, updated_at')
                .lt('stock_count', stockThreshold)
                .order('stock_count', { ascending: true });
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to fetch low stock products: ${error.message}`, 500, 'LOW_STOCK_FETCH_ERROR');
            }
            const alerts = (products || []).map(product => {
                let severity = 'warning';
                if (product.stock_count === 0) {
                    severity = 'out_of_stock';
                }
                else if (product.stock_count <= 2) {
                    severity = 'critical';
                }
                return {
                    productId: product.id,
                    productName: product.name,
                    currentStock: product.stock_count,
                    threshold: stockThreshold,
                    severity,
                    lastRestockDate: product.updated_at
                };
            });
            console.log('LOW_STOCK_PRODUCTS_FETCHED', {
                timestamp: new Date().toISOString(),
                threshold: stockThreshold,
                alertCount: alerts.length,
                severityBreakdown: {
                    out_of_stock: alerts.filter(a => a.severity === 'out_of_stock').length,
                    critical: alerts.filter(a => a.severity === 'critical').length,
                    warning: alerts.filter(a => a.severity === 'warning').length
                }
            });
            return alerts;
        }, 3, 1000, 'LOW_STOCK_FETCH');
    }
    async checkLowStockAlert(productId, currentStock, productName) {
        if (currentStock <= this.DEFAULT_LOW_STOCK_THRESHOLD) {
            let severity = 'warning';
            if (currentStock === 0) {
                severity = 'out_of_stock';
            }
            else if (currentStock <= 2) {
                severity = 'critical';
            }
            console.warn('LOW_STOCK_ALERT', {
                timestamp: new Date().toISOString(),
                productId,
                productName,
                currentStock,
                severity,
                threshold: this.DEFAULT_LOW_STOCK_THRESHOLD,
                action: 'NOTIFY_ADMIN'
            });
        }
    }
    async validateMultipleStock(items, context) {
        const results = [];
        const errors = [];
        console.log('BULK_STOCK_VALIDATION_START', {
            timestamp: new Date().toISOString(),
            itemCount: items.length,
            context: context || {}
        });
        for (const item of items) {
            try {
                const validation = await this.validateStock(item.productId, item.quantity, context);
                results.push(validation);
                if (!validation.available) {
                    errors.push(`${item.productId}: ${validation.message}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${item.productId}: Validation failed - ${errorMessage}`);
                results.push({
                    available: false,
                    currentStock: 0,
                    requestedQuantity: item.quantity,
                    productId: item.productId,
                    message: errorMessage,
                    timestamp: new Date().toISOString()
                });
            }
        }
        const valid = errors.length === 0;
        console.log('BULK_STOCK_VALIDATION_COMPLETE', {
            timestamp: new Date().toISOString(),
            itemCount: items.length,
            valid,
            errorCount: errors.length,
            context: context || {}
        });
        return { valid, results, errors };
    }
}
exports.InventoryService = InventoryService;
//# sourceMappingURL=InventoryService.js.map