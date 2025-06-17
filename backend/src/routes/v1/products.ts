import { Router, Response } from 'express';
import { ProductService } from '../../services/ProductService';
import { AuthenticatedRequest, ApiResponse, ProductFilters } from '../../types';
import { asyncHandler, ApplicationError } from '../../middleware/errorHandler';

const router = Router();
const productService = new ProductService();

/**
 * GET /api/v1/products
 * Get all products with optional filtering
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const filters: ProductFilters = {
    category: req.query.category as string,
    featured: req.query.featured ? req.query.featured === 'true' : undefined,
    inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
    priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
    priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
    search: req.query.search as string
  };

  // Remove undefined values
  Object.keys(filters).forEach(key => {
    if (filters[key as keyof ProductFilters] === undefined) {
      delete filters[key as keyof ProductFilters];
    }
  });

  const products = await productService.getAllProducts(filters);
  
  res.json({
    success: true,
    data: products,
    message: `Found ${products.length} products`
  });
}));

/**
 * GET /api/v1/products/featured
 * Get featured products for homepage
 */
router.get('/featured', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
  const products = await productService.getFeaturedProducts(limit);
  
  res.json({
    success: true,
    data: products,
    message: `Found ${products.length} featured products`
  });
}));

/**
 * GET /api/v1/products/:id
 * Get product by ID
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
  }
  
  const product = await productService.getProductById(id);
  
  res.json({
    success: true,
    data: product,
    message: 'Product retrieved successfully'
  });
}));

/**
 * GET /api/v1/products/category/:category
 * Get products by category
 */
router.get('/category/:category', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { category } = req.params;
  const products = await productService.getAllProducts({ category });
  
  res.json({
    success: true,
    data: products,
    message: `Found ${products.length} products in category: ${category}`
  });
}));

/**
 * GET /api/v1/products/search/:query
 * Search products by name or description
 */
router.get('/search/:query', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { query } = req.params;
  const products = await productService.getAllProducts({ search: query });
  
  res.json({
    success: true,
    data: products,
    message: `Found ${products.length} products matching: ${query}`
  });
}));

export default router; 