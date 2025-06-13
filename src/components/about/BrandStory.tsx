'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface BrandStoryProps {
  className?: string;
}

// Typewriter Animation Component (Progressive Construction)
const TypewriterText: React.FC<{ 
  text: string; 
  className?: string; 
  delay?: number;
  speed?: number;
}> = ({ text, className = '', delay = 0, speed = 0.1 }) => {
  // Split text into words for better layout (Explicit Error Handling)
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: delay,
        staggerChildren: speed,
        delayChildren: delay
      }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-1"
        >
          {word}
          {index < words.length - 1 && ' '}
        </motion.span>
      ))}
    </motion.span>
  );
};

const BrandStory: React.FC<BrandStoryProps> = ({ className = '' }) => {
  // State for image loading (Observable Implementation)
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Structured logging for debugging (Observable Implementation)
  console.log('[BRAND_STORY] Component render', {
    timestamp: new Date().toISOString(),
    component: 'BrandStory',
    simplified: true,
    imageLoaded,
    imageError,
    typewriterEnabled: true
  });

  return (
    <section className={`py-20 md:py-32 relative ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-wider leading-tight">
            Our Story
          </h2>
          <div className="mt-6 flex justify-center">
            <div className="w-24 h-0.5 bg-white/40" />
          </div>
        </motion.div>

        {/* Main Story Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Story Text */}
          <div className="space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-primary-bg uppercase tracking-wide mb-6">
                <TypewriterText 
                  text="Born for the Outdoors. Built in Colombia."
                  delay={0.5}
                  speed={0.15}
                />
              </h3>
              <div className="space-y-6 text-primary-bg">
                <p className="text-lg leading-relaxed">
                  <TypewriterText 
                    text="GRIZZLAND emerged from the intersection of outdoor culture and premium craftsmanship. Founded in Colombia by creators who believe that clothing should empower exploration—it's not just what you wear, it's how you live."
                    delay={2.0}
                    speed={0.08}
                  />
                </p>
                <p className="text-lg leading-relaxed">
                  <TypewriterText 
                    text="Our journey began with a simple vision: to design modern, functional apparel that honors the spirit of adventure while elevating it through exceptional quality and innovative design."
                    delay={5.5}
                    speed={0.08}
                  />
                </p>
                <p className="text-lg leading-relaxed font-medium">
                  <TypewriterText 
                    text="From the city to the mountains, GRIZZLAND is made for those who move freely, think boldly, and wear their identity with pride."
                    delay={9.0}
                    speed={0.08}
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Visual Element - Image Container */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
              className="relative"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] w-full max-w-lg mx-auto">
                {/* Model Image */}
                <div className="w-full h-full bg-white/5 border-2 border-white/30 rounded-lg backdrop-blur-sm overflow-hidden group hover:border-white/40 transition-colors duration-300">
                  {!imageError ? (
                    <Image
                      src="/images/Model about us.png"
                      alt="GRIZZLAND model wearing signature streetwear - About Us"
                      fill
                      className={`object-cover object-center transition-opacity duration-500 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      sizes="(max-width: 768px) 95vw, (max-width: 1200px) 50vw, 40vw"
                      priority={false}
                      quality={90}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    // Graceful Fallback (Explicit Error Handling)
                    <div className="w-full h-full flex items-center justify-center text-center p-8">
                      <div>
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg 
                            className="w-8 h-8 text-white/60" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={1.5} 
                              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" 
                            />
                          </svg>
                        </div>
                        <p className="text-white/60 text-sm font-medium tracking-wide uppercase">
                          GRIZZLAND Model
                        </p>
                        <p className="text-white/40 text-xs mt-2">
                          Image loading...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Loading State */}
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-white/30 border-t-white/60 rounded-full"
                      />
                    </div>
                  )}
                  
                  {/* Subtle Overlay for Better Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>
                
                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-lg blur-xl -z-10" />
                
                {/* Optional Border Animation */}
                <motion.div
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandStory; 