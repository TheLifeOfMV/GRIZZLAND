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
    name: 'Essential Cotton T-Shirt',
    description: 'A premium cotton t-shirt designed for comfort and style. Made from 100% organic cotton with a relaxed fit perfect for everyday wear.',
    price: 29990,
    originalPrice: 39990,
    category: 'T-Shirts',
    subcategory: 'Basic Tees',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      female: 'https://images.unsplash.com/photo-1494790108755-2616c3b5b4be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    colors: [
      { name: 'Charcoal Gray', code: 'charcoal-gray', value: '#36454F' },
      { name: 'Forest Green', code: 'forest-green', value: '#355E3B' },
      { name: 'Navy Blue', code: 'navy-blue', value: '#1B2951' },
      { name: 'Burgundy', code: 'burgundy', value: '#722F37' },
      { name: 'Cream', code: 'cream', value: '#F5F5DC' },
      { name: 'Black', code: 'black', value: '#000000' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    stockCount: 15,
    featured: true,
    onSale: true,
    tags: ['organic', 'comfortable', 'versatile'],
    specifications: {
      material: '100% Organic Cotton',
      fit: 'Relaxed',
      care: 'Machine wash cold, tumble dry low',
      origin: 'Made in Colombia'
    },
    reviews: {
      average: 4.8,
      count: 127
    }
  },
  {
    id: '2',
    name: 'Vintage Denim Jacket',
    description: 'Classic denim jacket with a vintage wash and perfect fit. Features authentic detailing and premium denim construction.',
    price: 89990,
    originalPrice: 119990,
    category: 'Jackets',
    subcategory: 'Denim',
    images: [
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544441893-675973e31985?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      female: 'https://images.unsplash.com/photo-1494790108755-2616c3b5b4be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    colors: [
      { name: 'Classic Blue', code: 'classic-blue', value: '#4F7CAC' },
      { name: 'Faded Black', code: 'faded-black', value: '#2C2C2C' },
      { name: 'Light Wash', code: 'light-wash', value: '#8BB8E8' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 8,
    featured: true,
    onSale: true,
    tags: ['vintage', 'classic', 'denim'],
    specifications: {
      material: '100% Cotton Denim',
      fit: 'Regular',
      care: 'Machine wash cold, air dry',
      origin: 'Made in Colombia'
    },
    reviews: {
      average: 4.6,
      count: 89
    }
  },
  {
    id: '3',
    name: 'Merino Wool Sweater',
    description: 'Luxurious merino wool sweater with a modern fit. Perfect for layering or wearing solo in cooler weather.',
    price: 79990,
    category: 'Sweaters',
    subcategory: 'Pullovers',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    silhouettes: {
      male: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      female: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    colors: [
      { name: 'Heather Gray', code: 'heather-gray', value: '#8B8680' },
      { name: 'Camel', code: 'camel', value: '#C19A6B' },
      { name: 'Deep Navy', code: 'deep-navy', value: '#1B2951' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 12,
    featured: false,
    onSale: false,
    tags: ['wool', 'premium', 'warm'],
    specifications: {
      material: '100% Merino Wool',
      fit: 'Modern',
      care: 'Dry clean only',
      origin: 'Made in Colombia'
    },
    reviews: {
      average: 4.9,
      count: 67
    }
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