import { Router, Response } from 'express';
import { ProductService } from '../../services/ProductService';
import { PaymentService } from '../../services/PaymentService';
import { InventoryService } from '../../services/InventoryService';
import { AuthenticatedRequest, ApiResponse, Product } from '../../types';
import { asyncHandler, ApplicationError } from '../../middleware/errorHandler';

const router = Router();
const productService = new ProductService();
const paymentService = new PaymentService();
const inventoryService = new InventoryService();

// ========================================
// PRODUCT MANAGEMENT
// ========================================

/**
 * POST /api/v1/admin/products
 * Create new product
 */
router.post('/products', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = req.body;

  const product = await productService.createProduct(productData);
  
  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully'
  });
}));

/**
 * PUT /api/v1/admin/products/:id
 * Update product
 */
router.put('/products/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;
  const updates: Partial<Product> = req.body;

  if (!id) {
    throw new ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
  }

  const product = await productService.updateProduct(id, updates);
  
  res.json({
    success: true,
    data: product,
    message: 'Product updated successfully'
  });
}));

/**
 * DELETE /api/v1/admin/products/:id
 * Delete product
 */
router.delete('/products/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;

  if (!id) {
    throw new ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
  }

  await productService.deleteProduct(id);
  
  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

/**
 * PUT /api/v1/admin/products/:id/stock
 * Update product stock
 */
router.put('/products/:id/stock', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;
  const { stock_count } = req.body;

  if (!id) {
    throw new ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
  }

  if (stock_count === undefined || stock_count < 0) {
    throw new ApplicationError(
      'Valid stock count is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const product = await productService.updateStock(id, stock_count);
  
  res.json({
    success: true,
    data: product,
    message: 'Product stock updated successfully'
  });
}));

/**
 * GET /api/v1/admin/products/low-stock
 * Get low stock products
 */
router.get('/products/low-stock', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 5;
  const products = await productService.getLowStockProducts(threshold);
  
  res.json({
    success: true,
    data: products,
    message: `Found ${products.length} products with low stock (< ${threshold})`
  });
}));

// ========================================
// ORDER MANAGEMENT
// ========================================

/**
 * GET /api/v1/admin/orders
 * Get all orders (admin view)
 */
router.get('/orders', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const status = req.query.status as string;

  // Get all orders without user restriction (admin view)
  let orders;
  if (status) {
    // Filter by status if provided
    orders = await (paymentService as any).supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, images)
        ),
        user_profiles (first_name, last_name, phone)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  } else {
    orders = await (paymentService as any).supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, images)
        ),
        user_profiles (first_name, last_name, phone)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  }

  if (orders.error) {
    throw new ApplicationError(
      `Failed to fetch orders: ${orders.error.message}`,
      500,
      'FETCH_ERROR'
    );
  }
  
  res.json({
    success: true,
    data: orders.data || [],
    message: `Found ${orders.data?.length || 0} orders`
  });
}));

/**
 * GET /api/v1/admin/orders/:id
 * Get order details (admin view)
 */
router.get('/orders/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;

  if (!id) {
    throw new ApplicationError('Order ID is required', 400, 'VALIDATION_ERROR');
  }

  // Admin can view any order
  const order = await paymentService.getOrderById(id);
  
  res.json({
    success: true,
    data: order,
    message: 'Order retrieved successfully'
  });
}));

/**
 * PUT /api/v1/admin/orders/:id/status
 * Update order status
 */
router.put('/orders/:id/status', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    throw new ApplicationError('Order ID is required', 400, 'VALIDATION_ERROR');
  }

  if (!status) {
    throw new ApplicationError(
      'Status is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const order = await paymentService.updateOrderStatus(id, status);
  
  res.json({
    success: true,
    data: order,
    message: 'Order status updated successfully'
  });
}));

// ========================================
// ANALYTICS & REPORTS
// ========================================

/**
 * GET /api/v1/admin/analytics
 * Get admin analytics dashboard data
 */
router.get('/analytics', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  try {
    // Get order statistics
    const { data: orderStats } = await (paymentService as any).supabase
      .from('orders')
      .select('status, total_amount, created_at');

    // Get product statistics
    const { data: productStats } = await (productService as any).supabase
      .from('products')
      .select('stock_count, featured, category');

    // Calculate analytics
    const totalOrders = orderStats?.length || 0;
    const totalRevenue = orderStats?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0;
    const ordersByStatus = orderStats?.reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const totalProducts = productStats?.length || 0;
    const lowStockProducts = productStats?.filter((p: any) => p.stock_count < 5).length || 0;
    const featuredProducts = productStats?.filter((p: any) => p.featured).length || 0;

    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = orderStats?.filter((order: any) => 
      new Date(order.created_at) >= sevenDaysAgo
    ).length || 0;

    const analytics = {
      overview: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        recent_orders: recentOrders,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0
      },
      orders: {
        by_status: ordersByStatus,
        recent_count: recentOrders
      },
      products: {
        total_products: totalProducts,
        low_stock_count: lowStockProducts,
        featured_count: featuredProducts
      },
      alerts: {
        low_stock_products: lowStockProducts,
        pending_orders: ordersByStatus.pending || 0
      }
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Analytics retrieved successfully'
    });
  } catch (error) {
    throw new ApplicationError(
      'Failed to generate analytics',
      500,
      'ANALYTICS_ERROR'
    );
  }
}));

/**
 * GET /api/v1/admin/analytics/sales
 * Get sales analytics for specific period
 */
router.get('/analytics/sales', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const period = req.query.period as string || '30'; // days
  const periodDays = parseInt(period);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const { data: sales, error } = await (paymentService as any).supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new ApplicationError(
      `Failed to fetch sales data: ${error.message}`,
      500,
      'FETCH_ERROR'
    );
  }

  // Group sales by date
  const salesByDate = sales?.reduce((acc: any, sale: any) => {
    const date = sale.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, orders: 0 };
    }
    if (sale.status !== 'cancelled') {
      acc[date].revenue += sale.total_amount;
      acc[date].orders += 1;
    }
    return acc;
  }, {}) || {};

  res.json({
    success: true,
    data: {
      period_days: periodDays,
      sales_by_date: Object.values(salesByDate),
      total_revenue: Object.values(salesByDate).reduce((sum: number, day: any) => sum + day.revenue, 0),
      total_orders: Object.values(salesByDate).reduce((sum: number, day: any) => sum + day.orders, 0)
    },
    message: `Sales analytics for last ${periodDays} days retrieved successfully`
  });
}));

// ========================================
// ALERTS & NOTIFICATIONS (NEW)
// ========================================

/**
 * GET /api/v1/admin/alerts
 * Get all low stock alerts with optional filtering
 */
router.get('/alerts', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const acknowledged = req.query.acknowledged === 'true';
  
  console.log('ADMIN_ALERTS_REQUEST', {
    timestamp: new Date().toISOString(),
    adminUserId: req.user?.id,
    acknowledged,
    component: 'AdminAlertsEndpoint'
  });

  try {
    const alerts = await inventoryService.getAllLowStockAlerts(acknowledged);
    
    // Group alerts by severity for better admin overview
    const alertsByStatus = alerts.reduce((acc: any, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    console.log('ADMIN_ALERTS_SUCCESS', {
      timestamp: new Date().toISOString(),
      adminUserId: req.user?.id,
      totalAlerts: alerts.length,
      alertsByStatus,
      acknowledged
    });

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          by_severity: alertsByStatus,
          acknowledged,
          last_updated: new Date().toISOString()
        }
      },
      message: `Found ${alerts.length} ${acknowledged ? 'acknowledged' : 'unacknowledged'} low stock alerts`
    });

  } catch (error) {
    console.error('ADMIN_ALERTS_ERROR', {
      timestamp: new Date().toISOString(),
      adminUserId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw new ApplicationError(
      'Failed to fetch low stock alerts',
      500,
      'ALERTS_FETCH_ERROR'
    );
  }
}));

/**
 * POST /api/v1/admin/alerts/:id/acknowledge
 * Acknowledge a specific low stock alert
 */
router.post('/alerts/:id/acknowledge', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;

  if (!id) {
    throw new ApplicationError(
      'Alert ID is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (!req.user?.id) {
    throw new ApplicationError(
      'Admin user ID is required',
      401,
      'AUTH_ERROR'
    );
  }

  console.log('ADMIN_ALERT_ACKNOWLEDGE_REQUEST', {
    timestamp: new Date().toISOString(),
    alertId: id,
    adminUserId: req.user.id,
    component: 'AdminAlertsEndpoint'
  });

  try {
    await inventoryService.acknowledgeLowStockAlert(id, req.user.id);

    console.log('ADMIN_ALERT_ACKNOWLEDGE_SUCCESS', {
      timestamp: new Date().toISOString(),
      alertId: id,
      adminUserId: req.user.id
    });

    res.json({
      success: true,
      data: {
        alertId: id,
        acknowledgedBy: req.user.id,
        acknowledgedAt: new Date().toISOString()
      },
      message: 'Low stock alert acknowledged successfully'
    });

  } catch (error) {
    console.error('ADMIN_ALERT_ACKNOWLEDGE_ERROR', {
      timestamp: new Date().toISOString(),
      alertId: id,
      adminUserId: req.user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw new ApplicationError(
      'Failed to acknowledge low stock alert',
      500,
      'ALERT_ACKNOWLEDGE_ERROR'
    );
  }
}));

/**
 * GET /api/v1/admin/alerts/summary
 * Get summary of alerts for dashboard widgets
 */
router.get('/alerts/summary', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  console.log('ADMIN_ALERTS_SUMMARY_REQUEST', {
    timestamp: new Date().toISOString(),
    adminUserId: req.user?.id,
    component: 'AdminAlertsEndpoint'
  });

  try {
    // Get both acknowledged and unacknowledged alerts
    const [unacknowledgedAlerts, acknowledgedAlerts] = await Promise.all([
      inventoryService.getAllLowStockAlerts(false),
      inventoryService.getAllLowStockAlerts(true)
    ]);

    const totalAlerts = unacknowledgedAlerts.length + acknowledgedAlerts.length;
    
    // Calculate severity breakdown for unacknowledged alerts
    const severityBreakdown = unacknowledgedAlerts.reduce((acc: any, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, { warning: 0, critical: 0, out_of_stock: 0 });

    // Calculate recent trends (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const recentAlerts = unacknowledgedAlerts.filter(alert => 
      new Date(alert.createdAt) >= twentyFourHoursAgo
    ).length;

    const summary = {
      total_alerts: totalAlerts,
      unacknowledged_alerts: unacknowledgedAlerts.length,
      acknowledged_alerts: acknowledgedAlerts.length,
      severity_breakdown: severityBreakdown,
      recent_alerts_24h: recentAlerts,
      most_critical: unacknowledgedAlerts
        .filter(alert => alert.severity === 'out_of_stock' || alert.severity === 'critical')
        .slice(0, 5), // Top 5 most critical
      last_updated: new Date().toISOString()
    };

    console.log('ADMIN_ALERTS_SUMMARY_SUCCESS', {
      timestamp: new Date().toISOString(),
      adminUserId: req.user?.id,
      summary: {
        totalAlerts,
        unacknowledged: unacknowledgedAlerts.length,
        severityBreakdown,
        recentAlerts
      }
    });

    res.json({
      success: true,
      data: summary,
      message: 'Alerts summary retrieved successfully'
    });

  } catch (error) {
    console.error('ADMIN_ALERTS_SUMMARY_ERROR', {
      timestamp: new Date().toISOString(),
      adminUserId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw new ApplicationError(
      'Failed to fetch alerts summary',
      500,
      'ALERTS_SUMMARY_ERROR'
    );
  }
}));

export default router; 