import React from 'react';
import DefaultHero from '@/components/layout/Hero';
import ProductCard from '@/components/features/ProductCard';
import Carousel from '@/components/ui/Carousel';
import ScrollingBanner from '@/components/ui/ScrollingBanner';
import ProductCategoriesSection from '@/components/features/ProductCategoriesSection';
import { FEATURED_PRODUCTS } from '@/lib/data';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <DefaultHero />

      {/* Scrolling Banner */}
      <ScrollingBanner 
        text="GRIZZLAND HUNTER´S CLUB - INSPIRED BY WILD"
        speed="medium"
        backgroundColor="bg-white"
        textColor="text-primary-bg"
      />

      {/* Featured Products Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-widest mb-4">
              Featured Collection
            </h2>
            <p className="text-lg text-white opacity-80 max-w-2xl mx-auto">
              Discover our most wanted pieces and freshest arrivals, crafted for comfort, built for adventure, and styled for the outdoors.
            </p>
          </div>

          {/* Featured Products Carousel */}
          {FEATURED_PRODUCTS.length > 0 ? (
            <Carousel
              autoPlay={true}
              interval={5000}
              showArrows={true}
              showDots={true}
              itemsPerView={{
                mobile: 1,
                tablet: 2,
                desktop: 3,
              }}
              gap={24}
              className="mb-12"
            >
              {FEATURED_PRODUCTS.map((product, index) => {
                let badgeText;
                if (index === 0) {
                  badgeText = 'NEW';
                } else if (index === 1 || index === 2) {
                  badgeText = 'BEST SELLER';
                } else {
                  badgeText = 'FEATURED';
                }
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showQuickAdd={true}
                    customBadge={badgeText}
                  />
                );
              })}
            </Carousel>
          ) : (
            <div className="text-center py-16">
              <p className="text-white opacity-75 text-lg">
                No featured products available at the moment.
              </p>
            </div>
          )}

          {/* CTA to Shop All */}
          <div className="text-center">
            <Link
              href="/products"
              className="btn-primary text-lg px-8 py-4 hover:scale-105 transform transition-all duration-300 inline-block"
            >
              VIEW ALL PRODUCTS
            </Link>
          </div>
        </div>
      </section>

      {/* Product Categories Interactive Section */}
      <ProductCategoriesSection />

    </div>
  );
} 