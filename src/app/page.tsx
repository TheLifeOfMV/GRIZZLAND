import React from 'react';
import DefaultHero from '@/components/layout/Hero';
import ProductCard from '@/components/features/ProductCard';
import Carousel from '@/components/ui/Carousel';
import ScrollingBanner from '@/components/ui/ScrollingBanner';
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

      {/* Brand Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white border-opacity-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-widest mb-8">
            The GRIZZLAND Story
          </h2>
          <div className="space-y-6 text-lg text-white opacity-90 leading-relaxed">
            <p>
            Nacida en las calles de Colombia y forjada por lo salvaje, GRIZZLAND fusiona el estilo urbano con el diseño outdoor. Más que moda, es un movimiento, una mentalidad y una identidad.
            </p>
            <p>
            Nuestras siluetas icónicas capturan la esencia del diseño outdoor moderno, manteniendo la calidad premium y la atención al detalle que definen nuestra marca.
            </p>
            <p>
            Cada prenda está hecha con propósito, pensada para quienes se atreven a destacar y expresar su estilo único con confianza.
            </p>
          </div>
          <div className="mt-12">
            <Link
              href="/about"
              className="btn-secondary text-white border-white hover:bg-white hover:text-primary-bg"
            >
              LEARN MORE
            </Link>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quality */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white uppercase tracking-wide mb-4">
                Premium Quality
              </h3>
              <p className="text-white opacity-80">
                Every piece is crafted with the finest materials and attention to detail, ensuring lasting quality and comfort.
              </p>
            </div>

            {/* Sustainability */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white uppercase tracking-wide mb-4">
                Sustainable
              </h3>
              <p className="text-white opacity-80">
                We're committed to responsible production practices and sustainable materials for a better future.
              </p>
            </div>

            {/* Design */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white uppercase tracking-wide mb-4">
                Unique Design
              </h3>
              <p className="text-white opacity-80">
                Our signature silhouette graphics and innovative designs set us apart in the streetwear landscape.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 