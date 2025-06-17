"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductService_1 = require("../../services/ProductService");
const PaymentService_1 = require("../../services/PaymentService");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
const productService = new ProductService_1.ProductService();
const paymentService = new PaymentService_1.PaymentService();
router.post('/products', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const productData = req.body;
    const product = await productService.createProduct(productData);
    res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
    });
}));
router.put('/products/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (!id) {
        throw new errorHandler_1.ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
    }
    const product = await productService.updateProduct(id, updates);
    res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
    });
}));
router.delete('/products/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new errorHandler_1.ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
    }
    await productService.deleteProduct(id);
    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
}));
router.put('/products/:id/stock', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { stock_count } = req.body;
    if (!id) {
        throw new errorHandler_1.ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
    }
    if (stock_count === undefined || stock_count < 0) {
        throw new errorHandler_1.ApplicationError('Valid stock count is required', 400, 'VALIDATION_ERROR');
    }
    const product = await productService.updateStock(id, stock_count);
    res.json({
        success: true,
        data: product,
        message: 'Product stock updated successfully'
    });
}));
router.get('/products/low-stock', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const threshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
    const products = await productService.getLowStockProducts(threshold);
    res.json({
        success: true,
        data: products,
        message: `Found ${products.length} products with low stock (< ${threshold})`
    });
}));
router.get('/orders', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const status = req.query.status;
    let orders;
    if (status) {
        orders = await paymentService.supabase
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
    }
    else {
        orders = await paymentService.supabase
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
        throw new errorHandler_1.ApplicationError(`Failed to fetch orders: ${orders.error.message}`, 500, 'FETCH_ERROR');
    }
    res.json({
        success: true,
        data: orders.data || [],
        message: `Found ${orders.data?.length || 0} orders`
    });
}));
router.get('/orders/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new errorHandler_1.ApplicationError('Order ID is required', 400, 'VALIDATION_ERROR');
    }
    const order = await paymentService.getOrderById(id);
    res.json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
    });
}));
router.put('/orders/:id/status', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!id) {
        throw new errorHandler_1.ApplicationError('Order ID is required', 400, 'VALIDATION_ERROR');
    }
    if (!status) {
        throw new errorHandler_1.ApplicationError('Status is required', 400, 'VALIDATION_ERROR');
    }
    const order = await paymentService.updateOrderStatus(id, status);
    res.json({
        success: true,
        data: order,
        message: 'Order status updated successfully'
    });
}));
router.get('/analytics', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { data: orderStats } = await paymentService.supabase
            .from('orders')
            .select('status, total_amount, created_at');
        const { data: productStats } = await productService.supabase
            .from('products')
            .select('stock_count, featured, category');
        const totalOrders = orderStats?.length || 0;
        const totalRevenue = orderStats?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        const ordersByStatus = orderStats?.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {}) || {};
        const totalProducts = productStats?.length || 0;
        const lowStockProducts = productStats?.filter((p) => p.stock_count < 5).length || 0;
        const featuredProducts = productStats?.filter((p) => p.featured).length || 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentOrders = orderStats?.filter((order) => new Date(order.created_at) >= sevenDaysAgo).length || 0;
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
    }
    catch (error) {
        throw new errorHandler_1.ApplicationError('Failed to generate analytics', 500, 'ANALYTICS_ERROR');
    }
}));
router.get('/analytics/sales', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || '30';
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const { data: sales, error } = await paymentService.supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
    if (error) {
        throw new errorHandler_1.ApplicationError(`Failed to fetch sales data: ${error.message}`, 500, 'FETCH_ERROR');
    }
    const salesByDate = sales?.reduce((acc, sale) => {
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
            total_revenue: Object.values(salesByDate).reduce((sum, day) => sum + day.revenue, 0),
            total_orders: Object.values(salesByDate).reduce((sum, day) => sum + day.orders, 0)
        },
        message: `Sales analytics for last ${periodDays} days retrieved successfully`
    });
}));
exports.default = router;
//# sourceMappingURL=admin.js.map