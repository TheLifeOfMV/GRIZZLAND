import { Request } from 'express';
export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    colors: ProductColor[];
    sizes: ProductSize[];
    category: string;
    stock_count: number;
    featured: boolean;
    silhouettes: {
        male?: string;
        female?: string;
    };
    created_at: string;
    updated_at: string;
}
export interface ProductColor {
    name: string;
    value: string;
    code: string;
}
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    selected_color: ProductColor;
    selected_size: ProductSize;
    quantity: number;
    created_at: string;
    products?: Product;
}
export interface CartItemInput {
    product_id: string;
    selected_color: ProductColor;
    selected_size: ProductSize;
    quantity: number;
}
export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    shipping_fee: number;
    status: OrderStatus;
    payment_method?: PaymentMethod;
    payment_instructions?: PaymentInstructions;
    shipping_address: ShippingAddress;
    created_at: string;
    updated_at: string;
}
export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    selected_color: ProductColor;
    selected_size: ProductSize;
    quantity: number;
    unit_price: number;
    created_at: string;
}
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'nequi' | 'pse';
export interface PaymentInstructions {
    bank_transfer?: {
        account_number: string;
        bank: string;
        account_type: string;
        reference: string;
        amount: number;
    };
    nequi?: {
        phone: string;
        reference: string;
        amount: number;
    };
    pse?: {
        redirect_url: string;
        amount: number;
    };
}
export interface ShippingAddress {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    department?: string;
}
export interface PromoCode {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    usage_limit: number;
    used_count: number;
    expires_at?: string;
    created_at: string;
    is_active: boolean;
}
export interface UserProfile {
    id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: ShippingAddress;
    role: 'customer' | 'admin';
    created_at: string;
    updated_at: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    code?: string;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
        aud: string;
        iat: number;
        exp: number;
    };
}
export interface ProductFilters {
    category?: string;
    featured?: boolean;
    inStock?: boolean;
    priceMin?: number;
    priceMax?: number;
    colors?: string[];
    sizes?: ProductSize[];
    search?: string;
}
export interface CheckoutRequest {
    payment_method: PaymentMethod;
    shipping_address: ShippingAddress;
    promo_code?: string;
}
export interface AppError extends Error {
    status?: number;
    code?: string;
}
export interface LogContext {
    userId?: string;
    action: string;
    resource?: string;
    metadata?: Record<string, any>;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map