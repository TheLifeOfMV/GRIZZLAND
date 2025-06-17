"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config/config");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const products_1 = __importDefault(require("./routes/v1/products"));
const cart_1 = __importDefault(require("./routes/v1/cart"));
const checkout_1 = __importDefault(require("./routes/v1/checkout"));
const admin_1 = __importDefault(require("./routes/v1/admin"));
class GrizzlandServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));
        this.app.use((0, cors_1.default)({
            origin: [config_1.config.frontendUrl, 'http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((0, errorHandler_1.timeoutHandler)(config_1.config.security.requestTimeout));
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });
    }
    initializeRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'GRIZZLAND API is running',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        const apiV1 = express_1.default.Router();
        apiV1.use('/products', auth_1.optionalAuthMiddleware, products_1.default);
        apiV1.use('/cart', auth_1.supabaseAuthMiddleware, cart_1.default);
        apiV1.use('/checkout', auth_1.supabaseAuthMiddleware, checkout_1.default);
        apiV1.use('/admin', auth_1.adminAuthMiddleware, admin_1.default);
        this.app.use('/api/v1', apiV1);
        this.app.get('/api/docs', (req, res) => {
            res.json({
                success: true,
                message: 'GRIZZLAND API Documentation',
                version: '1.0.0',
                endpoints: {
                    public: {
                        'GET /health': 'Server health check',
                        'GET /api/v1/products': 'Get all products with optional filters',
                        'GET /api/v1/products/:id': 'Get product by ID',
                    },
                    authenticated: {
                        'GET /api/v1/cart': 'Get user cart',
                        'POST /api/v1/cart': 'Add item to cart',
                        'PUT /api/v1/cart/:itemId': 'Update cart item quantity',
                        'DELETE /api/v1/cart/:itemId': 'Remove item from cart',
                        'POST /api/v1/checkout': 'Process checkout',
                        'GET /api/v1/checkout/orders': 'Get user orders',
                        'GET /api/v1/checkout/orders/:id': 'Get order details'
                    },
                    admin: {
                        'POST /api/v1/admin/products': 'Create product',
                        'PUT /api/v1/admin/products/:id': 'Update product',
                        'DELETE /api/v1/admin/products/:id': 'Delete product',
                        'GET /api/v1/admin/orders': 'Get all orders',
                        'PUT /api/v1/admin/orders/:id/status': 'Update order status',
                        'GET /api/v1/admin/analytics': 'Get admin analytics'
                    }
                },
                authentication: {
                    type: 'Bearer Token (Supabase JWT)',
                    header: 'Authorization: Bearer <token>'
                }
            });
        });
    }
    initializeErrorHandling() {
        this.app.use(errorHandler_1.notFoundHandler);
        this.app.use(errorHandler_1.errorHandler);
    }
    start() {
        const port = config_1.config.port;
        this.app.listen(port, () => {
            console.log(`
🚀 GRIZZLAND Backend Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Environment: ${config_1.config.nodeEnv}
🚪 Port: ${port}
🔗 Frontend URL: ${config_1.config.frontendUrl}
📊 API Documentation: http://localhost:${port}/api/docs
💚 Health Check: http://localhost:${port}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Available API Endpoints:
  • Products: /api/v1/products
  • Cart: /api/v1/cart (🔒 Auth Required)
  • Checkout: /api/v1/checkout (🔒 Auth Required)
  • Admin: /api/v1/admin (🔐 Admin Required)

💳 Payment Methods Supported:
  • Bank Transfer (Transferencia Bancaria)
  • Nequi
  • PSE

🛡️  Security Features:
  • Helmet.js protection
  • CORS configured
  • Request timeout (${config_1.config.security.requestTimeout}ms)
  • JWT authentication via Supabase
  • Role-based access control
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
        });
        process.on('SIGINT', () => {
            console.log('\n⏹️  Shutting down GRIZZLAND server gracefully...');
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            console.log('\n⏹️  Shutting down GRIZZLAND server gracefully...');
            process.exit(0);
        });
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (error) => {
            console.error('❌ Unhandled Promise Rejection:', error);
            process.exit(1);
        });
    }
}
const server = new GrizzlandServer();
server.start();
exports.default = server.app;
//# sourceMappingURL=server.js.map