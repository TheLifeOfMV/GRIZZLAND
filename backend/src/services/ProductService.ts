import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { Product, ProductFilters, ApiResponse } from '../types';
import { ApplicationError } from '../middleware/errorHandler';

/**
 * Service for managing products with Supabase integration
 */
export class ProductService {
  private supabase = createClient(config.supabase.url, config.supabase.serviceKey);

  /**
   * Retry wrapper for database operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw new ApplicationError(
      `Database operation failed after ${maxRetries} attempts: ${lastError!.message}`,
      500,
      'DATABASE_ERROR'
    );
  }

  /**
   * Get all products with optional filtering
   */
  async getAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
    return this.withRetry(async () => {
      let query = this.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
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
        throw new ApplicationError(
          `Failed to fetch products: ${error.message}`,
          500,
          'FETCH_ERROR'
        );
      }
      
      return data || [];
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product> {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
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
          `Failed to fetch product: ${error.message}`,
          500,
          'FETCH_ERROR'
        );
      }
      
      return data;
    });
  }

  /**
   * Create new product (admin only)
   */
  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    return this.withRetry(async () => {
      // Validate required fields
      if (!productData.name || !productData.price || !productData.category) {
        throw new ApplicationError(
          'Missing required fields: name, price, and category are required',
          400,
          'VALIDATION_ERROR'
        );
      }

      if (productData.price <= 0) {
        throw new ApplicationError(
          'Price must be greater than 0',
          400,
          'VALIDATION_ERROR'
        );
      }

      const { data, error } = await this.supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) {
        throw new ApplicationError(
          `Failed to create product: ${error.message}`,
          500,
          'CREATE_ERROR'
        );
      }
      
      console.log('Product created:', { id: data.id, name: data.name });
      return data;
    });
  }

  /**
   * Update product (admin only)
   */
  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product> {
    return this.withRetry(async () => {
      // Validate price if provided
      if (updates.price !== undefined && updates.price <= 0) {
        throw new ApplicationError(
          'Price must be greater than 0',
          400,
          'VALIDATION_ERROR'
        );
      }

      const { data, error } = await this.supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
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
          `Failed to update product: ${error.message}`,
          500,
          'UPDATE_ERROR'
        );
      }
      
      console.log('Product updated:', { id: data.id, name: data.name });
      return data;
    });
  }

  /**
   * Delete product (admin only)
   */
  async deleteProduct(id: string): Promise<void> {
    return this.withRetry(async () => {
      // Check if product exists first
      await this.getProductById(id);

      const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new ApplicationError(
          `Failed to delete product: ${error.message}`,
          500,
          'DELETE_ERROR'
        );
      }
      
      console.log('Product deleted:', { id });
    });
  }

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(limit)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new ApplicationError(
          `Failed to fetch featured products: ${error.message}`,
          500,
          'FETCH_ERROR'
        );
      }
      
      return data || [];
    });
  }

  /**
   * Update stock count for a product
   */
  async updateStock(id: string, newStockCount: number): Promise<Product> {
    return this.withRetry(async () => {
      if (newStockCount < 0) {
        throw new ApplicationError(
          'Stock count cannot be negative',
          400,
          'VALIDATION_ERROR'
        );
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
          throw new ApplicationError(
            'Product not found',
            404,
            'PRODUCT_NOT_FOUND'
          );
        }
        throw new ApplicationError(
          `Failed to update stock: ${error.message}`,
          500,
          'UPDATE_ERROR'
        );
      }
      
      return data;
    });
  }

  /**
   * Get low stock products (for admin alerts)
   */
  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .lt('stock_count', threshold)
        .order('stock_count', { ascending: true });
      
      if (error) {
        throw new ApplicationError(
          `Failed to fetch low stock products: ${error.message}`,
          500,
          'FETCH_ERROR'
        );
      }
      
      return data || [];
    });
  }
} 