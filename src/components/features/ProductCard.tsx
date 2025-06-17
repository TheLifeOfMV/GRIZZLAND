'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductColor, ProductSize } from '@/types';
import { formatPrice } from '@/lib/data';
import { useCart } from '@/hooks/useCart';
import { HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  showQuickAdd?: boolean;
  customBadge?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onQuickView,
  showQuickAdd = true,
  customBadge
}) => {
  const { addToCart } = useCart();
  const [isLiked, setIsLiked] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[0]);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock) return;
    
    addToCart(product, selectedColor, selectedSize, 1);
    
    // Show feedback (could be toast notification in future)
    console.log(`Added ${product.name} to cart`);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Link 
      href={`/products/${product.id}`}
      className="group block"
    >
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image with Enhanced Responsive Aspect Ratios */}
        <div className="relative aspect-square sm:aspect-[4/5] lg:aspect-square bg-gray-100 overflow-hidden">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">📷</div>
                <div className="text-sm font-medium">Image Not Available</div>
              </div>
            </div>
          ) : (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImageError(true)}
            />
          )}

          {/* Enhanced Badge System */}
          {(customBadge || !product.inStock) && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
              <span 
                className={`inline-block px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold uppercase tracking-wide rounded-md ${
                  !product.inStock
                    ? 'bg-red-600 text-white'
                    : customBadge === 'NEW'
                    ? 'bg-green-600 text-white'
                    : customBadge === 'BEST SELLER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-primary-bg text-white'
                }`}
              >
                {!product.inStock ? 'SOLD OUT' : customBadge}
              </span>
            </div>
          )}

          {/* Enhanced Action Buttons with Better Touch Targets */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-2">
            <button
              onClick={handleLike}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-md hover:bg-opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-bg focus:ring-opacity-50"
              aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isLiked ? (
                <HeartSolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              )}
            </button>
            
            {onQuickView && (
              <button
                onClick={handleQuickView}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-md hover:bg-opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-bg focus:ring-opacity-50"
                aria-label="Quick view"
              >
                <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Enhanced Hover Overlay for Better UX */}
          <div 
            className={`absolute inset-0 bg-black bg-opacity-0 transition-all duration-300 ${
              isHovered ? 'bg-opacity-10' : ''
            }`}
          />
        </div>

        {/* Enhanced Product Info with Better Typography Scale */}
        <div className="p-3 sm:p-4 lg:p-5 space-y-2 sm:space-y-3">
          {/* Product Name with Responsive Typography */}
          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-200 line-clamp-2">
            {product.name}
          </h3>

          {/* Price with Enhanced Responsive Sizing */}
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            {formatPrice(product.price)}
          </p>

          {/* Enhanced Color Swatches with Better Touch Targets */}
          {product.colors.length > 1 && (
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {product.colors.slice(0, 4).map((color) => (
                <button
                  key={color.code}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(color);
                  }}
                  className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-bg ${
                    selectedColor.code === color.code
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
              {product.colors.length > 4 && (
                <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full border-2 border-gray-300 bg-gray-100">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    +{product.colors.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Size Options (Condensed) */}
          {showQuickAdd && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {product.sizes.slice(0, 3).map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium border rounded transition-all duration-200 min-w-[32px] sm:min-w-[36px] focus:outline-none focus:ring-2 focus:ring-primary-bg focus:ring-opacity-50 ${
                    selectedSize === size
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-500'
                  }`}
                  aria-label={`Select size ${size}`}
                >
                  {size}
                </button>
              ))}
              {product.sizes.length > 3 && (
                <div className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium border border-gray-300 rounded bg-gray-100 text-gray-600">
                  +{product.sizes.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Add to Cart Button with Better Touch Target */}
          {showQuickAdd && (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-2 sm:py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wide rounded-md transition-all duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                product.inStock
                  ? 'bg-primary-bg text-white hover:bg-opacity-90 focus:ring-primary-bg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              aria-label={`Add ${product.name} to cart`}
            >
              {product.inStock ? 'ADD TO CART' : 'SOLD OUT'}
            </button>
          )}

          {/* Stock Status Indicator */}
          {product.inStock && product.stockCount <= 5 && (
            <p className="text-xs sm:text-sm text-orange-600 font-medium">
              Only {product.stockCount} left in stock
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard; 