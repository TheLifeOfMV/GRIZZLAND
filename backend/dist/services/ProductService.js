"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config/config");
const errorHandler_1 = require("../middleware/errorHandler");
class ProductService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceKey);
    }
    async withRetry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }
        throw new errorHandler_1.ApplicationError(`Database operation failed after ${maxRetries} attempts: ${lastError.message}`, 500, 'DATABASE_ERROR');
    }
    async getAllProducts(filters = {}) {
        return this.withRetry(async () => {
            let query = this.supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.featured !== undefined) {
                query = query.eq('featured', filters.featured);
            }
            if (filters.inStock) {
                query = query.gt('stock_count', 0);
            }
            if (filters.priceMin !== undefined) {
                query = query.gte('price', filters.priceMin);
            }
            if (filters.priceMax !== undefined) {
                query = query.lte('price', filters.priceMax);
            }
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }
            const { data, error } = await query;
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to fetch products: ${error.message}`, 500, 'FETCH_ERROR');
            }
            return data || [];
        });
    }
    async getProductById(id) {
        return this.withRetry(async () => {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    throw new errorHandler_1.ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
                }
                throw new errorHandler_1.ApplicationError(`Failed to fetch product: ${error.message}`, 500, 'FETCH_ERROR');
            }
            return data;
        });
    }
    async createProduct(productData) {
        return this.withRetry(async () => {
            if (!productData.name || !productData.price || !productData.category) {
                throw new errorHandler_1.ApplicationError('Missing required fields: name, price, and category are required', 400, 'VALIDATION_ERROR');
            }
            if (productData.price <= 0) {
                throw new errorHandler_1.ApplicationError('Price must be greater than 0', 400, 'VALIDATION_ERROR');
            }
            const { data, error } = await this.supabase
                .from('products')
                .insert([productData])
                .select()
                .single();
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to create product: ${error.message}`, 500, 'CREATE_ERROR');
            }
            console.log('Product created:', { id: data.id, name: data.name });
            return data;
        });
    }
    async updateProduct(id, updates) {
        return this.withRetry(async () => {
            if (updates.price !== undefined && updates.price <= 0) {
                throw new errorHandler_1.ApplicationError('Price must be greater than 0', 400, 'VALIDATION_ERROR');
            }
            const { data, error } = await this.supabase
                .from('products')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    throw new errorHandler_1.ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
                }
                throw new errorHandler_1.ApplicationError(`Failed to update product: ${error.message}`, 500, 'UPDATE_ERROR');
            }
            console.log('Product updated:', { id: data.id, name: data.name });
            return data;
        });
    }
    async deleteProduct(id) {
        return this.withRetry(async () => {
            await this.getProductById(id);
            const { error } = await this.supabase
                .from('products')
                .delete()
                .eq('id', id);
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to delete product: ${error.message}`, 500, 'DELETE_ERROR');
            }
            console.log('Product deleted:', { id });
        });
    }
    async getFeaturedProducts(limit = 8) {
        return this.withRetry(async () => {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .eq('featured', true)
                .limit(limit)
                .order('created_at', { ascending: false });
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to fetch featured products: ${error.message}`, 500, 'FETCH_ERROR');
            }
            return data || [];
        });
    }
    async updateStock(id, newStockCount) {
        return this.withRetry(async () => {
            if (newStockCount < 0) {
                throw new errorHandler_1.ApplicationError('Stock count cannot be negative', 400, 'VALIDATION_ERROR');
            }
            const { data, error } = await this.supabase
                .from('products')
                .update({
                stock_count: newStockCount,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    throw new errorHandler_1.ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
                }
                throw new errorHandler_1.ApplicationError(`Failed to update stock: ${error.message}`, 500, 'UPDATE_ERROR');
            }
            return data;
        });
    }
    async getLowStockProducts(threshold = 5) {
        return this.withRetry(async () => {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .lt('stock_count', threshold)
                .order('stock_count', { ascending: true });
            if (error) {
                throw new errorHandler_1.ApplicationError(`Failed to fetch low stock products: ${error.message}`, 500, 'FETCH_ERROR');
            }
            return data || [];
        });
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=ProductService.js.map