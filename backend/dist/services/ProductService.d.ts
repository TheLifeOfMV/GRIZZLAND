import { Product, ProductFilters } from '../types';
export declare class ProductService {
    private supabase;
    private withRetry;
    getAllProducts(filters?: ProductFilters): Promise<Product[]>;
    getProductById(id: string): Promise<Product>;
    private validateProductMetadata;
    createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product>;
    updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product>;
    deleteProduct(id: string): Promise<void>;
    getFeaturedProducts(limit?: number): Promise<Product[]>;
    updateStock(id: string, newStockCount: number): Promise<Product>;
    getLowStockProducts(threshold?: number): Promise<Product[]>;
}
//# sourceMappingURL=ProductService.d.ts.map