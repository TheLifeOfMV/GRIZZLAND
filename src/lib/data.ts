import { Product, ProductColor } from '@/types';

// Product Colors
export const PRODUCT_COLORS: ProductColor[] = [
  { name: 'Gray', value: '#9ca3af', code: 'gray' },
  { name: 'Tan', value: '#d2b48c', code: 'tan' },
  { name: 'Light Blue', value: '#87ceeb', code: 'light-blue' },
  { name: 'Navy', value: '#1e3a8a', code: 'navy' },
  { name: 'Cream', value: '#f5f5dc', code: 'cream' },
  { name: 'Black', value: '#000000', code: 'black' },
];

// Mock Product Data
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'GRIZZLAND Classic Tee',
    price: 29.99,
    description: 'Premium cotton t-shirt with GRIZZLAND signature silhouette design. Comfortable fit and durable construction.',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=600&fit=crop',
    ],
    colors: [PRODUCT_COLORS[0], PRODUCT_COLORS[1], PRODUCT_COLORS[5]],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'T-Shirts',
    inStock: true,
    stockCount: 25,
    featured: true,
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop',
      female: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=400&fit=crop',
    },
  },
  {
    id: '2',
    name: 'GRIZZLAND Premium Hoodie',
    price: 59.99,
    description: 'Luxury hoodie with premium materials and GRIZZLAND branding. Perfect for casual wear and outdoor activities.',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop',
    ],
    colors: [PRODUCT_COLORS[3], PRODUCT_COLORS[0], PRODUCT_COLORS[5]],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'Hoodies',
    inStock: true,
    stockCount: 15,
    featured: true,
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop',
      female: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop',
    },
  },
  {
    id: '3',
    name: 'GRIZZLAND Vintage Jacket',
    price: 89.99,
    description: 'Vintage-inspired jacket with modern fit. Features GRIZZLAND signature details and premium finishing.',
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=600&fit=crop',
    ],
    colors: [PRODUCT_COLORS[5], PRODUCT_COLORS[3], PRODUCT_COLORS[1]],
    sizes: ['M', 'L', 'XL'],
    category: 'Jackets',
    inStock: false,
    stockCount: 0,
    featured: false,
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=400&fit=crop',
      female: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=400&fit=crop',
    },
  },
  {
    id: '4',
    name: 'GRIZZLAND Essential Tank',
    price: 24.99,
    description: 'Lightweight tank top perfect for workouts and summer wear. Breathable fabric with moisture-wicking technology.',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f37f7ad3?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=600&fit=crop',
    ],
    colors: [PRODUCT_COLORS[0], PRODUCT_COLORS[4], PRODUCT_COLORS[2]],
    sizes: ['XS', 'S', 'M', 'L'],
    category: 'Tank Tops',
    inStock: true,
    stockCount: 30,
    featured: false,
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1583743814966-8936f37f7ad3?w=300&h=400&fit=crop',
      female: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop',
    },
  },
  {
    id: '5',
    name: 'GRIZZLAND Sport Shorts',
    price: 34.99,
    description: 'Athletic shorts designed for performance and comfort. Features moisture-wicking fabric and side pockets.',
    images: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1608749241508-13dc8c0c9ec3?w=500&h=600&fit=crop',
    ],
    colors: [PRODUCT_COLORS[5], PRODUCT_COLORS[3], PRODUCT_COLORS[0]],
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'Shorts',
    inStock: true,
    stockCount: 20,
    featured: true,
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300&h=400&fit=crop',
      female: 'https://images.unsplash.com/photo-1608749241508-13dc8c0c9ec3?w=300&h=400&fit=crop',
    },
  },
  {
    id: '6',
    name: 'GRIZZLAND Long Sleeve',
    price: 39.99,
    description: 'Versatile long sleeve shirt perfect for layering. Soft cotton blend with GRIZZLAND signature branding.',
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1489455506899-c5ed0e96aa2d?w=500&h=600&fit=crop',
    ],
    colors: [PRODUCT_COLORS[4], PRODUCT_COLORS[0], PRODUCT_COLORS[5]],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'Long Sleeves',
    inStock: true,
    stockCount: 18,
    featured: false,
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop',
      female: 'https://images.unsplash.com/photo-1489455506899-c5ed0e96aa2d?w=300&h=400&fit=crop',
    },
  },
];

// Featured Products (for homepage carousel)
export const FEATURED_PRODUCTS = MOCK_PRODUCTS.filter(product => product.featured);

// Product Categories
export const PRODUCT_CATEGORIES = [
  'All',
  'T-Shirts',
  'Hoodies',
  'Jackets',
  'Tank Tops',
  'Shorts',
  'Long Sleeves',
];

// Constants
export const SHIPPING_FEE = 7.99;
export const FREE_SHIPPING_THRESHOLD = 75;

// Utility functions
export const getProductById = (id: string): Product | undefined => {
  return MOCK_PRODUCTS.find(product => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  if (category === 'All') return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter(product => product.category === category);
};

export const getInStockProducts = (): Product[] => {
  return MOCK_PRODUCTS.filter(product => product.inStock);
};

export const calculateShipping = (subtotal: number): number => {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}; 