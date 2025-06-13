import React from 'react';
import type { Metadata } from 'next';
import HeroSection from '@/components/about/HeroSection';
import BrandStory from '@/components/about/BrandStory';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Structured logging for debugging (Observable Implementation)
console.log('[ABOUT_PAGE] Component initialized', {
  timestamp: new Date().toISOString(),
  page: 'about',
  components: ['HeroSection', 'BrandStory']
});

export const metadata: Metadata = {
  title: 'About Us - GRIZZLAND | Premium Streetwear Brand Story',
  description: 'Discover GRIZZLAND\'s story - where authenticity meets innovation. Learn about our premium streetwear brand, values, and commitment to urban excellence and quality craftsmanship.',
  keywords: [
    'GRIZZLAND about',
    'streetwear brand story',
    'premium urban fashion',
    'authentic streetwear',
    'brand mission',
    'quality craftsmanship',
    'urban culture',
    'street fashion heritage'
  ],
  authors: [{ name: 'GRIZZLAND' }],
  creator: 'GRIZZLAND',
  publisher: 'GRIZZLAND',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grizzland.com/about',
    siteName: 'GRIZZLAND',
    title: 'About GRIZZLAND - Premium Streetwear Brand Story',
    description: 'Discover the story behind GRIZZLAND - where authenticity meets innovation in premium streetwear. Learn about our mission, values, and commitment to urban excellence.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&h=630&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'GRIZZLAND About Us - Premium Streetwear Brand',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About GRIZZLAND - Premium Streetwear Brand Story',
    description: 'Discover the story behind GRIZZLAND - where authenticity meets innovation in premium streetwear.',
    images: ['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&h=630&fit=crop&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://grizzland.com/about',
  },
};

/**
 * About Us Page Component
 * 
 * Implements MONOCODE principles:
 * - Observable Implementation: Structured logging and clear component naming
 * - Explicit Error Handling: Error boundaries for each section
 * - Dependency Transparency: Clear imports and component dependencies
 * - Progressive Construction: Modular component structure
 */
export default function AboutPage() {
  // Structured state logging (Observable Implementation)
  console.log('[ABOUT_PAGE] Page render started', {
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
    route: '/about'
  });

  return (
    <main className="min-h-screen bg-primary-bg">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About GRIZZLAND",
            "description": "Learn about GRIZZLAND's premium streetwear brand, mission, values, and commitment to authentic urban fashion.",
            "url": "https://grizzland.com/about",
            "mainEntity": {
              "@type": "Organization",
              "name": "GRIZZLAND",
              "description": "Premium streetwear brand combining authenticity with innovation",
              "foundingDate": "2023",
              "category": "Fashion",
              "specialty": "Premium Streetwear",
              "slogan": "Where authenticity meets innovation",
              "values": ["Authenticity", "Quality", "Innovation"],
              "target": "Urban fashion enthusiasts who value quality and authentic design"
            }
          })
        }}
      />

      {/* Hero Section with Error Boundary */}
      <ErrorBoundary fallback={
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">About GRIZZLAND</h1>
          <p className="text-white/70">Premium streetwear that defines urban excellence</p>
        </div>
      }>
        <HeroSection />
      </ErrorBoundary>

      {/* Brand Story Section with Error Boundary */}
      <ErrorBoundary fallback={
        <div className="py-20 text-center bg-white/5">
          <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            GRIZZLAND represents the perfect fusion of street culture and premium quality, 
            creating authentic pieces for those who refuse to compromise on style.
          </p>
        </div>
      }>
        <BrandStory />
      </ErrorBoundary>

      {/* Performance Monitoring Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Performance monitoring for About page (Observable Implementation)
            if (typeof window !== 'undefined') {
              window.addEventListener('load', function() {
                console.log('[ABOUT_PAGE] Page load complete', {
                  timestamp: new Date().toISOString(),
                  loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                  route: '/about',
                  components: ['HeroSection', 'BrandStory']
                });
              });
              
              // Track scroll engagement
              let scrollEngagement = 0;
              window.addEventListener('scroll', function() {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                if (scrollPercent > scrollEngagement) {
                  scrollEngagement = Math.max(scrollEngagement, scrollPercent);
                  if (scrollEngagement % 25 === 0) {
                    console.log('[ABOUT_PAGE] Scroll engagement', {
                      timestamp: new Date().toISOString(),
                      scrollPercent: scrollEngagement,
                      route: '/about'
                    });
                  }
                }
              });
            }
          `,
        }}
      />
    </main>
  );
} 