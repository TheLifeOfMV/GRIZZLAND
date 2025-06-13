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
  const [imageError, setImageError] = useState(false);

  return (
    <section className="hero-section flex items-center justify-center">
      {/* Background Media */}
      <div className="hero-image-container">
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
        ) : backgroundImage && !imageError ? (
          <>
            {/* Main Background Image - Optimized Display */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url("${backgroundImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%'
              }}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          /* Fallback gradient background */
          <div className="w-full h-full bg-gradient-to-br from-primary-bg via-gray-800 to-gray-900" />
        )}
        
        {/* Enhanced Overlay with better visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="space-y-10">
          {/* Main Title */}
          <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white uppercase tracking-[0.15em] leading-tight drop-shadow-2xl">
            {title}
          </h1>
          
          {/* Hunter's Club Badge */}
          <div className="hero-hunters-club">
            <span className="inline-block text-white/90 text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-[0.2em] drop-shadow-lg pl-6 pr-8 py-2 rounded-md bg-black/20 backdrop-blur-sm">
              HUNTER'S CLUB<sup className="text-2xl ml-1">®</sup>
            </span>
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="hero-subtitle text-xl sm:text-2xl md:text-3xl text-white opacity-95 max-w-3xl mx-auto leading-relaxed font-light tracking-wide drop-shadow-lg">
              {subtitle}
            </p>
          )}

          {/* CTA Button */}
          <div className="hero-cta pt-12">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center px-10 py-5 border-2 border-white bg-transparent text-white text-lg font-semibold uppercase tracking-[0.1em] rounded-md transition-all duration-500 ease-out hover:bg-white hover:text-primary-bg hover:scale-110 hover:shadow-2xl transform focus:outline-none focus:ring-4 focus:ring-white/30"
              aria-label={`${ctaText} - Navigate to products`}
            >
              {ctaText}
            </Link>
          </div>


        </div>
      </div>

      {/* Brand Elements */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="text-right space-y-1">
          <div className="hero-brand text-white opacity-70 text-sm uppercase tracking-[0.3em] font-semibold drop-shadow-lg hover:opacity-95 transition-opacity duration-300">
            GRIZZLAND
          </div>
          <div className="hero-brand-subtitle text-white opacity-55 text-xs uppercase tracking-[0.25em] font-light drop-shadow-md hover:opacity-85 transition-opacity duration-300">
            Hunter's Club
          </div>
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
      subtitle="Not just fashion, identity. Discover our outdoor signature collection."
      backgroundImage="/images/GRIZZLAND%20HOMEPAGE.png"
      ctaText="SHOP NOW"
      ctaLink="/products"
    />
  );
};

export default DefaultHero;
export { Hero }; 