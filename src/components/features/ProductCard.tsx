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
    <div 
      className="product-card group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-lg">
          {!imageError ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
              <span className="text-sm">Image not available</span>
            </div>
          )}
          
          {/* Overlay Actions */}
          <div className={`absolute inset-0 bg-black bg-opacity-20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 focus-outline"
                aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Quick View Button */}
              {onQuickView && (
                <button
                  onClick={handleQuickView}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 focus-outline"
                  aria-label="Quick view"
                >
                  <EyeIcon className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Quick Add Button */}
            {showQuickAdd && (
              <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full py-2 px-4 text-sm font-medium uppercase tracking-wide rounded-md transition-all duration-200 focus-outline ${
                    product.inStock
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                  aria-label={product.inStock ? 'Add to cart' : 'Out of stock'}
                >
                  {product.inStock ? 'QUICK ADD' : 'SOLD OUT'}
                </button>
              </div>
            )}
          </div>

          {/* Stock Badge */}
          {!product.inStock && (
            <div className="absolute top-4 left-4">
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-md uppercase tracking-wide">
                Sold Out
              </span>
            </div>
          )}

          {/* Badge */}
          {(customBadge || product.featured) && (
            <div className="absolute top-4 left-4">
              <span className="bg-primary-bg text-white text-xs font-medium px-2 py-1 rounded-md uppercase tracking-wide">
                {customBadge || 'Featured'}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-200 truncate">
            {product.name}
          </h3>

          {/* Price */}
          <p className="text-xl font-semibold text-gray-900">
            {formatPrice(product.price)}
          </p>

          {/* Color Swatches */}
          {product.colors.length > 1 && (
            <div className="flex space-x-2">
              {product.colors.map((color) => (
                <button
                  key={color.code}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(color);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    selectedColor.code === color.code
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          )}

          {/* Size Options (condensed) */}
          {product.sizes.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {product.sizes.slice(0, 4).map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`px-2 py-1 text-xs font-medium uppercase rounded border transition-all duration-200 ${
                    selectedSize === size
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-500'
                  }`}
                  aria-label={`Select size ${size}`}
                >
                  {size}
                </button>
              ))}
              {product.sizes.length > 4 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{product.sizes.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Stock Count (for low stock) */}
          {product.inStock && product.stockCount <= 5 && (
            <p className="text-sm text-orange-600 font-medium">
              Only {product.stockCount} left in stock
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard; 