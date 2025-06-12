'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroProps } from '@/types';

interface ExtendedHeroProps extends Omit<HeroProps, 'backgroundVideo' | 'backgroundImage'> {
  backgroundVideo?: string;
  backgroundImage?: string;
}

const Hero: React.FC<ExtendedHeroProps> = ({
  title,
  subtitle,
  backgroundVideo,
  backgroundImage,
  ctaText,
  ctaLink,
}) => {
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {backgroundVideo && !videoError ? (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            aria-hidden="true"
          >
            <source src={backgroundVideo} type="video/mp4" />
            <source src={backgroundVideo.replace('.mp4', '.webm')} type="video/webm" />
          </video>
        ) : backgroundImage ? (
          <Image
            src={backgroundImage}
            alt="GRIZZLAND Hero Background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          /* Fallback gradient background */
          <div className="w-full h-full bg-gradient-to-br from-primary-bg via-gray-800 to-gray-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-overlay bg-opacity-60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-8 animate-fade-in">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-widest leading-tight">
            {title}
          </h1>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg sm:text-xl md:text-2xl text-white opacity-90 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* CTA Button */}
          <div className="pt-8">
            <Link
              href={ctaLink}
              className="btn-primary text-lg px-8 py-4 hover:scale-105 transform transition-all duration-300 inline-block"
              aria-label={`${ctaText} - Navigate to products`}
            >
              {ctaText}
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center text-white opacity-75">
              <span className="text-sm uppercase tracking-wider mb-2">Scroll</span>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Elements */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="text-white opacity-50 text-sm uppercase tracking-widest">
          GRIZZLAND
        </div>
      </div>
    </section>
  );
};

// Default Hero for homepage
const DefaultHero: React.FC = () => {
  return (
    <Hero
      title="GRIZZLAND"
      subtitle="Premium streetwear that defines your style. Discover our signature collection."
      backgroundImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&q=80"
      ctaText="SHOP NOW"
      ctaLink="/products"
    />
  );
};

export default DefaultHero;
export { Hero }; 