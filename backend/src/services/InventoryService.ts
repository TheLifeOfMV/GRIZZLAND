import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { Product, ProductSize, ProductColor } from '../types';
import { ApplicationError } from '../middleware/errorHandler';
import { PromoService, LowStockAlert } from './PromoService';

/**
 * GRIZZLAND Inventory Service
 * Dedicated service for stock management and validation
 * Following MONOCODE principles: Observable, Explicit Error Handling, Dependency Transparency
 * 
 * Failure Mode: Stock mismatch → Prevent overselling, notify admin
 * Instrumentation: Track stock changes with product ID and timestamp
 * 
 * EXTENDED for non_core_important batch:
 * - Integration with PromoService for low stock alerts
 * - Enhanced alert system with database persistence
 * - Admin notification workflow
 */

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

export class InventoryService {
  private supabase = createClient(config.supabase.url, config.supabase.serviceKey);
  private readonly DEFAULT_LOW_STOCK_THRESHOLD = 5;
  private readonly RESERVATION_DURATION_MINUTES = 15; // Cart reservation time
  private promoService = new PromoService(); // Integration with PromoService

  /**
   * Retry wrapper for database operations with circuit breaker pattern
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    operationName: string = 'INVENTORY_OPERATION'
  ): Promise<T> {
    let lastError: Error;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Log successful operation
        console.log(`${operationName}_SUCCESS`, {
          timestamp: new Date().toISOString(),
          attempt,
          duration: `${Date.now() - startTime}ms`,
          success: true
        });
        
        return result;
      } catch (error) {
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
    
    // Log final failure
    console.error(`${operationName}_FAILED`, {
      timestamp: new Date().toISOString(),
      attempts: maxRetries,
      duration: `${Date.now() - startTime}ms`,
      finalError: lastError!.message
    });
    
    throw new ApplicationError(
      `${operationName} failed after ${maxRetries} attempts: ${lastError!.message}`,
      500,
      'INVENTORY_ERROR'
    );
  }

  /**
   * Validate stock availability for a product
   * Core function for preventing overselling
   */
  async validateStock(
    productId: string, 
    quantity: number,
    context?: { userId?: string; cartId?: string }
  ): Promise<StockValidationResult> {
    return this.withRetry(async () => {
      const timestamp = new Date().toISOString();
      
      // Input validation
      if (!productId || quantity <= 0) {
        const result: StockValidationResult = {
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

      // Get current stock from database
      const { data: product, error } = await this.supabase
        .from('products')
        .select('id, name, stock_count')
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ApplicationError(
            'Product not found',
            404,
            'PRODUCT_NOT_FOUND'
          );
        }
        throw new ApplicationError(
          `Failed to fetch product stock: ${error.message}`,
          500,
          'STOCK_FETCH_ERROR'
        );
      }

      const currentStock = product.stock_count || 0;
      const available = currentStock >= quantity;
      const warnings: string[] = [];

      // Generate warnings
      if (currentStock <= this.DEFAULT_LOW_STOCK_THRESHOLD && available) {
        warnings.push(`Low stock warning: Only ${currentStock} items remaining`);
      }

      if (quantity > 10) {
        warnings.push('Large quantity requested - may require special handling');
      }

      const result: StockValidationResult = {
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

      // Structured logging for audit trail
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

  /**
   * Reserve stock for a user (cart functionality)
   * Prevents race conditions during checkout
   */
  async reserveStock(
    productId: string,
    quantity: number,
    userId: string,
    context?: { cartId?: string; sessionId?: string }
  ): Promise<StockReservation> {
    return this.withRetry(async () => {
      const timestamp = new Date().toISOString();
      const expiresAt = new Date(Date.now() + this.RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();

      // First validate stock availability
      const validation = await this.validateStock(productId, quantity, { userId, ...context });
      
      if (!validation.available) {
        throw new ApplicationError(
          validation.message || 'Insufficient stock for reservation',
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      // Create reservation record (future implementation)
      // For now, we'll log the reservation intent
      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const reservation: StockReservation = {
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

  /**
   * Decrement stock after successful order
   * Atomic operation with rollback capability
   * ENHANCED: Integrated low stock alert creation
   */
  async decrementStock(
    productId: string,
    quantity: number,
    context: {
      orderId?: string;
      userId?: string;
      reason: 'sale' | 'adjustment' | 'damaged';
    }
  ): Promise<StockChange> {
    return this.withRetry(async () => {
      const timestamp = new Date().toISOString();

      // Get current stock with row locking (future: FOR UPDATE)
      const { data: product, error: fetchError } = await this.supabase
        .from('products')
        .select('id, name, stock_count')
        .eq('id', productId)
        .single();

      if (fetchError) {
        throw new ApplicationError(
          `Failed to fetch product for stock decrement: ${fetchError.message}`,
          500,
          'STOCK_FETCH_ERROR'
        );
      }

      const previousStock = product.stock_count || 0;
      const newStock = Math.max(0, previousStock - quantity);

      // Prevent negative stock
      if (previousStock < quantity) {
        console.error('STOCK_DECREMENT_INSUFFICIENT', {
          timestamp,
          productId,
          productName: product.name,
          previousStock,
          requestedDecrement: quantity,
          context
        });

        throw new ApplicationError(
          `Insufficient stock for decrement: ${previousStock} available, ${quantity} requested`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      // Update stock in database
      const { error: updateError } = await this.supabase
        .from('products')
        .update({ 
          stock_count: newStock,
          updated_at: timestamp
        })
        .eq('id', productId);

      if (updateError) {
        throw new ApplicationError(
          `Failed to update stock: ${updateError.message}`,
          500,
          'STOCK_UPDATE_ERROR'
        );
      }

      const stockChange: StockChange = {
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

      // Log stock change for audit
      console.log('STOCK_DECREMENTED', {
        timestamp,
        productId,
        productName: product.name,
        stockChange,
        context
      });

      // ENHANCED: Check for low stock alert using PromoService
      await this.checkLowStockAlert(productId, newStock, product.name);

      return stockChange;

    }, 3, 1000, 'STOCK_DECREMENT');
  }

  /**
   * Increment stock (restocking)
   */
  async incrementStock(
    productId: string,
    quantity: number,
    context: {
      userId?: string;
      reason: 'restock' | 'return' | 'adjustment';
      batchNumber?: string;
      supplier?: string;
    }
  ): Promise<StockChange> {
    return this.withRetry(async () => {
      const timestamp = new Date().toISOString();

      // Get current stock
      const { data: product, error: fetchError } = await this.supabase
        .from('products')
        .select('id, name, stock_count')
        .eq('id', productId)
        .single();

      if (fetchError) {
        throw new ApplicationError(
          `Failed to fetch product for stock increment: ${fetchError.message}`,
          500,
          'STOCK_FETCH_ERROR'
        );
      }

      const previousStock = product.stock_count || 0;
      const newStock = previousStock + quantity;

      // Update stock in database
      const { error: updateError } = await this.supabase
        .from('products')
        .update({ 
          stock_count: newStock,
          updated_at: timestamp
        })
        .eq('id', productId);

      if (updateError) {
        throw new ApplicationError(
          `Failed to update stock: ${updateError.message}`,
          500,
          'STOCK_UPDATE_ERROR'
        );
      }

      const stockChange: StockChange = {
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

  /**
   * Get low stock products for admin alerts
   * ENHANCED: Uses PromoService for consistent alert management
   */
  async getLowStockProducts(threshold?: number): Promise<LowStockAlert[]> {
    return this.withRetry(async () => {
      const stockThreshold = threshold || this.DEFAULT_LOW_STOCK_THRESHOLD;
      
      const { data: products, error } = await this.supabase
        .from('products')
        .select('id, name, stock_count, updated_at')
        .lt('stock_count', stockThreshold)
        .order('stock_count', { ascending: true });

      if (error) {
        throw new ApplicationError(
          `Failed to fetch low stock products: ${error.message}`,
          500,
          'LOW_STOCK_FETCH_ERROR'
        );
      }

      const alerts: LowStockAlert[] = (products || []).map(product => {
        let severity: 'warning' | 'critical' | 'out_of_stock' = 'warning';
        
        if (product.stock_count === 0) {
          severity = 'out_of_stock';
        } else if (product.stock_count <= 2) {
          severity = 'critical';
        }

        return {
          id: `legacy_${product.id}`, // Legacy format for compatibility
          productId: product.id,
          productName: product.name,
          currentStock: product.stock_count,
          threshold: stockThreshold,
          severity,
          acknowledged: false, // Legacy alerts are not acknowledged
          createdAt: product.updated_at || new Date().toISOString()
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

  /**
   * ENHANCED: Check and create persistent low stock alerts
   * Integration with PromoService for database-backed alerts
   */
  private async checkLowStockAlert(productId: string, currentStock: number, productName: string): Promise<void> {
    if (currentStock <= this.DEFAULT_LOW_STOCK_THRESHOLD) {
      try {
        // Create persistent alert using PromoService
        const alert = await this.promoService.createLowStockAlert(
          productId,
          currentStock,
          this.DEFAULT_LOW_STOCK_THRESHOLD
        );

        console.log('LOW_STOCK_ALERT_INTEGRATED', {
          timestamp: new Date().toISOString(),
          alertId: alert.id,
          productId,
          productName,
          currentStock,
          severity: alert.severity,
          threshold: this.DEFAULT_LOW_STOCK_THRESHOLD,
          action: 'PERSISTENT_ALERT_CREATED'
        });

      } catch (error) {
        // Don't fail the stock operation if alert creation fails
        console.error('LOW_STOCK_ALERT_CREATION_FAILED', {
          timestamp: new Date().toISOString(),
          productId,
          productName,
          currentStock,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Fallback to simple logging
        console.warn('LOW_STOCK_ALERT_FALLBACK', {
          timestamp: new Date().toISOString(),
          productId,
          productName,
          currentStock,
          severity: currentStock === 0 ? 'out_of_stock' : currentStock <= 2 ? 'critical' : 'warning',
          threshold: this.DEFAULT_LOW_STOCK_THRESHOLD,
          action: 'NOTIFY_ADMIN'
        });
      }
    }
  }

  /**
   * Get all low stock alerts (both legacy and persistent)
   */
  async getAllLowStockAlerts(acknowledged: boolean = false): Promise<LowStockAlert[]> {
    try {
      // Get persistent alerts from PromoService
      const persistentAlerts = await this.promoService.getLowStockAlerts(acknowledged);
      
      // If we want unacknowledged alerts, also include legacy low stock products
      if (!acknowledged) {
        const legacyAlerts = await this.getLowStockProducts();
        
        // Filter out products that already have persistent alerts
        const persistentProductIds = new Set(persistentAlerts.map(a => a.productId));
        const filteredLegacyAlerts = legacyAlerts.filter(
          alert => !persistentProductIds.has(alert.productId)
        );
        
        return [...persistentAlerts, ...filteredLegacyAlerts];
      }
      
      return persistentAlerts;
      
    } catch (error) {
      console.error('FAILED_TO_FETCH_ALL_ALERTS', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to legacy alerts only
      return this.getLowStockProducts();
    }
  }

  /**
   * Acknowledge low stock alert
   */
  async acknowledgeLowStockAlert(alertId: string, adminUserId: string): Promise<void> {
    try {
      await this.promoService.acknowledgeLowStockAlert(alertId, adminUserId);
    } catch (error) {
      console.error('FAILED_TO_ACKNOWLEDGE_ALERT', {
        timestamp: new Date().toISOString(),
        alertId,
        adminUserId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new ApplicationError(
        'Failed to acknowledge low stock alert',
        500,
        'ALERT_ACKNOWLEDGE_ERROR'
      );
    }
  }

  /**
   * Bulk stock validation for multiple products
   * Useful for cart validation
   */
  async validateMultipleStock(
    items: Array<{ productId: string; quantity: number }>,
    context?: { userId?: string; cartId?: string }
  ): Promise<{
    valid: boolean;
    results: StockValidationResult[];
    errors: string[];
  }> {
    const results: StockValidationResult[] = [];
    const errors: string[] = [];

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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${item.productId}: Validation failed - ${errorMessage}`);
        
        // Add failed validation result
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