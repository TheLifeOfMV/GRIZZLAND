'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/features/ProductCard';
import { MOCK_PRODUCTS, PRODUCT_CATEGORIES } from '@/lib/data';
import { Product } from '@/types';
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'T-SHIRTS';
  
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Update category when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'T-SHIRTS';
    if (PRODUCT_CATEGORIES.includes(categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = MOCK_PRODUCTS;

    // Filter by category - always filter since we no longer have 'All'
    filtered = filtered.filter(product => product.category === selectedCategory);

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          // For demo, assuming newer products have higher IDs
          return parseInt(b.id) - parseInt(a.id);
        case 'featured':
        default:
          // Featured products first, then by price
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.price - b.price;
      }
    });

    return sorted;
  }, [selectedCategory, sortBy]);

  const handleQuickView = (product: Product) => {
    // TODO: Implement quick view modal
    console.log('Quick view:', product.name);
    alert(`Quick view for ${product.name} - This feature will be implemented in the next phase!`);
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-widest mb-4">
            Shop Collection
          </h1>
          <p className="text-lg text-white opacity-80 max-w-2xl mx-auto">
            Discover our complete range of premium outdoor pieces designed for the modern urban lifestyle.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          {/* Left Side - Category Filter */}
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium uppercase tracking-wide rounded-md transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-white text-primary-bg'
                    : 'bg-transparent text-white border border-white hover:bg-white hover:text-primary-bg'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Right Side - Sort and View Controls */}
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white border border-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              <option value="featured" className="bg-primary-bg">Featured</option>
              <option value="newest" className="bg-primary-bg">Newest</option>
              <option value="price-low" className="bg-primary-bg">Price: Low to High</option>
              <option value="price-high" className="bg-primary-bg">Price: High to Low</option>
              <option value="name" className="bg-primary-bg">Name A-Z</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-white rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-bg'
                    : 'bg-transparent text-white hover:bg-white hover:text-primary-bg'
                }`}
                aria-label="Grid view"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-bg'
                    : 'bg-transparent text-white hover:bg-white hover:text-primary-bg'
                }`}
                aria-label="List view"
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden p-2 border border-white rounded-md text-white hover:bg-white hover:text-primary-bg transition-colors duration-200"
              aria-label="Toggle filters"
            >
              <FunnelIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-white opacity-75">
            Showing {filteredAndSortedProducts.length} of {MOCK_PRODUCTS.length} products
            in {selectedCategory}
          </p>
        </div>

        {/* Products Grid/List */}
        {filteredAndSortedProducts.length > 0 ? (
          <div
            className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={handleQuickView}
                showQuickAdd={true}
              />
            ))}
          </div>
        ) : (
          /* No Products Found */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Squares2X2Icon className="w-12 h-12 text-white opacity-50" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">No products found</h3>
            <p className="text-white opacity-75 mb-8">
              Try adjusting your filters or browse our full collection.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('T-SHIRTS');
                setSortBy('featured');
              }}
              className="btn-primary"
            >
              RESET FILTERS
            </button>
          </div>
        )}

        {/* Load More Button (Placeholder for pagination) */}
        {filteredAndSortedProducts.length > 0 && filteredAndSortedProducts.length >= 12 && (
          <div className="text-center mt-12">
            <button
              onClick={() => {
                // TODO: Implement pagination
                alert('Load more functionality will be implemented in the next phase!');
              }}
              className="btn-secondary text-white border-white hover:bg-white hover:text-primary-bg"
            >
              LOAD MORE PRODUCTS
            </button>
          </div>
        )}

        {/* Category Description */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white uppercase tracking-wide mb-4">
              {selectedCategory}
            </h2>
            <p className="text-white opacity-80">
              {getCategoryDescription(selectedCategory)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get category descriptions
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'T-SHIRTS': 'Our premium t-shirt collection features comfortable cuts and signature GRIZZLAND designs.',
    'HOODIES': 'Stay warm and stylish with our luxury hoodie collection, perfect for any season.',
    'LONG SLEEVES': 'Versatile long sleeve pieces that work perfectly for layering.',
  };
  
  return descriptions[category] || 'Discover our premium collection of streetwear essentials.';
} 