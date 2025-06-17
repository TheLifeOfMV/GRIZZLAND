// Product Types
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  colors: ProductColor[];
  sizes: ProductSize[];
  category: string;
  inStock: boolean;
  stockCount: number;
  featured: boolean;
  silhouettes: {
    male: string;
    female: string;
  };
  originalPrice?: number;
  subcategory?: string;
  onSale?: boolean;
  tags?: string[];
  specifications?: {
    material: string;
    fit: string;
    care: string;
    origin: string;
  };
  reviews?: {
    average: number;
    count: number;
  };
}

export interface ProductColor {
  name: string;
  value: string;
  code: string;
}

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

// Cart Types
export interface CartItem {
  product: Product;
  selectedColor: ProductColor;
  selectedSize: ProductSize;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

// Component Props Types
export interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundVideo?: string;
  backgroundImage?: string;
  ctaText: string;
  ctaLink: string;
}

export interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export interface CarouselProps {
  children: React.ReactNode;
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

export interface ColorSwatchProps {
  colors: ProductColor[];
  selectedColor?: ProductColor;
  onColorSelect: (color: ProductColor) => void;
}

export interface SizeSelectProps {
  sizes: ProductSize[];
  selectedSize?: ProductSize;
  onSizeSelect: (size: ProductSize) => void;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// Form Types
export interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface ProductFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  colors?: string[];
  sizes?: ProductSize[];
  inStock?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Component State Types
export interface LoadingState {
  isLoading: boolean;
  error?: AppError | null;
}

// Utility Types
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// Event Types
export interface ProductEvent {
  productId: string;
  eventType: 'view' | 'add_to_cart' | 'purchase' | 'remove_from_cart';
  metadata?: Record<string, any>;
} 