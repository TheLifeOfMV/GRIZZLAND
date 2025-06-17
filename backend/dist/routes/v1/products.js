"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductService_1 = require("../../services/ProductService");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
const productService = new ProductService_1.ProductService();
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = {
        category: req.query.category,
        featured: req.query.featured ? req.query.featured === 'true' : undefined,
        inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax) : undefined,
        search: req.query.search
    };
    Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
            delete filters[key];
        }
    });
    const products = await productService.getAllProducts(filters);
    res.json({
        success: true,
        data: products,
        message: `Found ${products.length} products`
    });
}));
router.get('/featured', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 8;
    const products = await productService.getFeaturedProducts(limit);
    res.json({
        success: true,
        data: products,
        message: `Found ${products.length} featured products`
    });
}));
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new errorHandler_1.ApplicationError('Product ID is required', 400, 'VALIDATION_ERROR');
    }
    const product = await productService.getProductById(id);
    res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully'
    });
}));
router.get('/category/:category', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { category } = req.params;
    const products = await productService.getAllProducts({ category });
    res.json({
        success: true,
        data: products,
        message: `Found ${products.length} products in category: ${category}`
    });
}));
router.get('/search/:query', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { query } = req.params;
    const products = await productService.getAllProducts({ search: query });
    res.json({
        success: true,
        data: products,
        message: `Found ${products.length} products matching: ${query}`
    });
}));
exports.default = router;
//# sourceMappingURL=products.js.map