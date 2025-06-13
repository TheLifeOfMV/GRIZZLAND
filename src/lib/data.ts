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
    price: 119900,
    description: 'Premium cotton t-shirt with GRIZZLAND signature silhouette design. Comfortable fit and durable construction.',
    images: [
      '/images/placeholder-product.svg',
      '/images/placeholder-product.svg',
    ],
    colors: [PRODUCT_COLORS[0], PRODUCT_COLORS[1], PRODUCT_COLORS[5]],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'T-SHIRTS',
    inStock: true,
    stockCount: 25,
    featured: true,
    silhouettes: {
      male: '/images/placeholder-silhouette.svg',
      female: '/images/placeholder-silhouette.svg',
    },
  },
  {
    id: '2',
    name: 'GRIZZLAND Premium Hoodie',
    price: 239900,
    description: 'Luxury hoodie with premium materials and GRIZZLAND branding. Perfect for casual wear and outdoor activities.',
    images: [
      '/images/placeholder-product.svg',
      '/images/placeholder-product.svg',
    ],
    colors: [PRODUCT_COLORS[3], PRODUCT_COLORS[0], PRODUCT_COLORS[5]],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'HOODIES',
    inStock: true,
    stockCount: 15,
    featured: true,
    silhouettes: {
      male: '/images/placeholder-silhouette.svg',
      female: '/images/placeholder-silhouette.svg',
    },
  },
  {
    id: '6',
    name: 'GRIZZLAND Long Sleeve',
    price: 159900,
    description: 'Versatile long sleeve shirt perfect for layering. Soft cotton blend with GRIZZLAND signature branding.',
    images: [
      '/images/placeholder-product.svg',
      '/images/placeholder-product.svg',
    ],
    colors: [PRODUCT_COLORS[4], PRODUCT_COLORS[0], PRODUCT_COLORS[5]],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'LONG SLEEVES',
    inStock: true,
    stockCount: 18,
    featured: true,
    silhouettes: {
      male: '/images/placeholder-silhouette.svg',
      female: '/images/placeholder-silhouette.svg',
    },
  },
];

// Featured Products (for homepage carousel)
export const FEATURED_PRODUCTS = MOCK_PRODUCTS.filter(product => product.featured);

// Product Categories - Updated to only include T-SHIRTS, HOODIES, and LONG SLEEVES
export const PRODUCT_CATEGORIES = [
  'T-SHIRTS',
  'HOODIES', 
  'LONG SLEEVES',
];

// Constants
export const SHIPPING_FEE = 31900;
export const FREE_SHIPPING_THRESHOLD = 300000;

// Utility functions
export const getProductById = (id: string): Product | undefined => {
  return MOCK_PRODUCTS.find(product => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return MOCK_PRODUCTS.filter(product => product.category === category);
};

export const getInStockProducts = (): Product[] => {
  return MOCK_PRODUCTS.filter(product => product.inStock);
};

export const calculateShipping = (subtotal: number): number => {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}; 