'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductById, formatPrice, MOCK_PRODUCTS } from '@/lib/data';
import { Product, ProductColor, ProductSize } from '@/types';
import { useCart } from '@/hooks/useCart';
import ProductCard from '@/components/features/ProductCard';
import { 
  HeartIcon, 
  ShareIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const productId = params.id as string;
  const product = getProductById(productId);

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSilhouette, setSelectedSilhouette] = useState<'male' | 'female'>('male');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize selections when product loads
  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0]);
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  // Related products (same category, excluding current product)
  const relatedProducts = MOCK_PRODUCTS
    .filter(p => p.category === product?.category && p.id !== productId)
    .slice(0, 4);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product Not Found</h1>
          <p className="text-white opacity-75 mb-8">The product you're looking for doesn't exist.</p>
          <Link href="/products" className="btn-primary">
            BACK TO SHOP
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      alert('Please select color and size');
      return;
    }

    if (!product.inStock) {
      alert('This product is currently out of stock');
      return;
    }

    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      addToCart(product, selectedColor, selectedSize, quantity);
      setIsLoading(false);
      
      // Could show success toast here
      console.log(`Added ${quantity}x ${product.name} to cart`);
    }, 500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Product URL copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-white opacity-75 mb-8">
          <Link href="/" className="hover:opacity-100 transition-opacity">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:opacity-100 transition-opacity">Shop</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category}`} className="hover:opacity-100 transition-opacity">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.images[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : product.images.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all duration-200"
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex < product.images.length - 1 ? selectedImageIndex + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all duration-200"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              )}

              {/* Image Indicators */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === selectedImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                      index === selectedImageIndex ? 'border-white' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12.5vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Title and Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wide mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-white">
                  {formatPrice(product.price)}
                </span>
                {!product.inStock && (
                  <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-md uppercase">
                    Sold Out
                  </span>
                )}
              </div>
              
              {/* Rating placeholder */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
                    />
                  ))}
                </div>
                <span className="text-white opacity-75 text-sm">(4.0) 24 reviews</span>
              </div>
            </div>

            {/* Product Description */}
            <div>
              <p className="text-white opacity-90 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Silhouette Selector */}
            <div>
              <h3 className="text-lg font-medium text-white uppercase tracking-wide mb-3">
                Silhouette
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedSilhouette('male')}
                  className={`px-4 py-2 border rounded-md transition-all duration-200 ${
                    selectedSilhouette === 'male'
                      ? 'border-white bg-white text-primary-bg'
                      : 'border-white text-white hover:bg-white hover:text-primary-bg'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setSelectedSilhouette('female')}
                  className={`px-4 py-2 border rounded-md transition-all duration-200 ${
                    selectedSilhouette === 'female'
                      ? 'border-white bg-white text-primary-bg'
                      : 'border-white text-white hover:bg-white hover:text-primary-bg'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-lg font-medium text-white uppercase tracking-wide mb-3">
                Color: {selectedColor?.name}
              </h3>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.code}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      selectedColor?.code === color.code
                        ? 'border-white ring-2 ring-primary-bg ring-offset-2 ring-offset-primary-bg'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-lg font-medium text-white uppercase tracking-wide mb-3">
                Size: {selectedSize}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-md transition-all duration-200 ${
                      selectedSize === size
                        ? 'border-white bg-white text-primary-bg'
                        : 'border-white text-white hover:bg-white hover:text-primary-bg'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-medium text-white uppercase tracking-wide mb-3">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-white rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white hover:text-primary-bg transition-colors duration-200"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-white font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-white hover:text-primary-bg transition-colors duration-200"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                {product.inStock && product.stockCount <= 10 && (
                  <span className="text-orange-400 text-sm">
                    Only {product.stockCount} left in stock
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || isLoading}
                className={`flex-1 py-4 px-6 font-medium uppercase tracking-wide rounded-md transition-all duration-200 ${
                  product.inStock && !isLoading
                    ? 'bg-white text-primary-bg hover:bg-gray-100'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="loader"></div>
                    Adding...
                  </div>
                ) : product.inStock ? (
                  'ADD TO CART'
                ) : (
                  'OUT OF STOCK'
                )}
              </button>
              
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-4 border border-white rounded-md hover:bg-white hover:text-primary-bg transition-all duration-200"
                aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-6 h-6" />
                ) : (
                  <HeartIcon className="w-6 h-6" />
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="p-4 border border-white rounded-md hover:bg-white hover:text-primary-bg transition-all duration-200"
                aria-label="Share product"
              >
                <ShareIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t border-white border-opacity-20 pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white opacity-75">SKU:</span>
                <span className="text-white">GRZ-{product.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white opacity-75">Category:</span>
                <span className="text-white">{product.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white opacity-75">Availability:</span>
                <span className={product.inStock ? 'text-green-400' : 'text-red-400'}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-8 text-center">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  showQuickAdd={true}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
} 