import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config';
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/errorHandler';
import { supabaseAuthMiddleware, adminAuthMiddleware, optionalAuthMiddleware } from './middleware/auth';

// Import route handlers
import productsRoutes from './routes/v1/products';
import cartRoutes from './routes/v1/cart';
import checkoutRoutes from './routes/v1/checkout';
import adminRoutes from './routes/v1/admin';

/**
 * GRIZZLAND Backend API Server
 * Comprehensive e-commerce backend with Colombian payment integration
 */
class GrizzlandServer {
  public app: express.Application;
  
  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize core middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
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

    // CORS configuration
    this.app.use(cors({
      origin: [config.frontendUrl, 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timeout middleware
    this.app.use(timeoutHandler(config.security.requestTimeout));

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'GRIZZLAND API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API v1 routes
    const apiV1 = express.Router();
    
    // Public routes (no authentication required)
    apiV1.use('/products', optionalAuthMiddleware, productsRoutes);
    
    // Protected routes (authentication required)
    apiV1.use('/cart', supabaseAuthMiddleware, cartRoutes);
    apiV1.use('/checkout', supabaseAuthMiddleware, checkoutRoutes);
    
    // Admin routes (admin authentication required)
    apiV1.use('/admin', adminAuthMiddleware, adminRoutes);

    // Mount API routes
    this.app.use('/api/v1', apiV1);

    // API documentation endpoint
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

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler for unknown routes
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public start(): void {
    const port = config.port;
    
    this.app.listen(port, () => {
      console.log(`
🚀 GRIZZLAND Backend Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Environment: ${config.nodeEnv}
🚪 Port: ${port}
🔗 Frontend URL: ${config.frontendUrl}
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
  • Request timeout (${config.security.requestTimeout}ms)
  • JWT authentication via Supabase
  • Role-based access control
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('\n⏹️  Shutting down GRIZZLAND server gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n⏹️  Shutting down GRIZZLAND server gracefully...');
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (error) => {
      console.error('❌ Unhandled Promise Rejection:', error);
      process.exit(1);
    });
  }
}

// Create and start server
const server = new GrizzlandServer();
server.start();

export default server.app; 