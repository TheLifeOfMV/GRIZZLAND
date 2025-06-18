'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PHASE 2: SilhouetteSelector Component
 * 
 * Purpose: Interactive gender silhouette selection for product visualization
 * Features: Smooth transitions, responsive design, accessibility support
 * Testing: Real-environment validation with example-driven specs
 */

interface SilhouetteSelectorProps {
  maleImage: string;
  femaleImage: string;
  selectedSilhouette: 'male' | 'female';
  onSilhouetteChange: (silhouette: 'male' | 'female') => void;
  className?: string;
  productName?: string;
}

export const SilhouetteSelector: React.FC<SilhouetteSelectorProps> = ({
  maleImage,
  femaleImage,
  selectedSilhouette,
  onSilhouetteChange,
  className = '',
  productName = 'Product'
}) => {
  const [imageLoading, setImageLoading] = useState<{male: boolean, female: boolean}>({
    male: true,
    female: true
  });
  const [imageError, setImageError] = useState<{male: boolean, female: boolean}>({
    male: false,
    female: false
  });

  // Preload images for smooth transitions
  useEffect(() => {
    const preloadImage = (src: string, gender: 'male' | 'female') => {
      const img = new window.Image();
      img.onload = () => {
        setImageLoading(prev => ({ ...prev, [gender]: false }));
      };
      img.onerror = () => {
        setImageError(prev => ({ ...prev, [gender]: true }));
        setImageLoading(prev => ({ ...prev, [gender]: false }));
      };
      img.src = src;
    };

    preloadImage(maleImage, 'male');
    preloadImage(femaleImage, 'female');
  }, [maleImage, femaleImage]);

  const handleSilhouetteChange = (silhouette: 'male' | 'female') => {
    // Observability: Log silhouette changes for debugging with structured logging
    console.log('SILHOUETTE_CHANGE', {
      timestamp: new Date().toISOString(),
      productName,
      fromSilhouette: selectedSilhouette,
      toSilhouette: silhouette,
      component: 'SilhouetteSelector'
    });
    onSilhouetteChange(silhouette);
  };

  const currentImage = selectedSilhouette === 'male' ? maleImage : femaleImage;
  const isCurrentImageLoading = imageLoading[selectedSilhouette];
  const hasCurrentImageError = imageError[selectedSilhouette];

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Gender Selection Toggle with Enhanced Animations */}
      <motion.div 
        className="flex justify-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-1 sm:p-2"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex space-x-1 sm:space-x-2">
            {/* Male Toggle */}
            <motion.button
              onClick={() => handleSilhouetteChange('male')}
              className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-all duration-300 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                selectedSilhouette === 'male'
                  ? 'bg-white text-primary-bg shadow-md'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
              aria-label="View on male model"
              aria-pressed={selectedSilhouette === 'male'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={selectedSilhouette === 'male' ? { 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium uppercase tracking-wide">
                Male
              </span>
            </motion.button>

            {/* Female Toggle */}
            <motion.button
              onClick={() => handleSilhouetteChange('female')}
              className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-all duration-300 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                selectedSilhouette === 'female'
                  ? 'bg-white text-primary-bg shadow-md'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
              aria-label="View on female model"
              aria-pressed={selectedSilhouette === 'female'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={selectedSilhouette === 'female' ? { 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium uppercase tracking-wide">
                Female
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Silhouette Image Display with Enhanced Animations */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div 
          className="relative aspect-[3/4] sm:aspect-[2/3] lg:aspect-[3/4] max-w-xs sm:max-w-sm mx-auto bg-white bg-opacity-5 rounded-lg overflow-hidden"
          whileHover={{ 
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Loading State with Enhanced Animation */}
          <AnimatePresence>
            {isCurrentImageLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-10 backdrop-blur-sm z-10"
              >
                <div className="space-y-3 text-center">
                  <motion.div 
                    className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  <motion.p 
                    className="text-white text-xs sm:text-sm opacity-75"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Loading {selectedSilhouette} model...
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State with Enhanced Animation */}
          <AnimatePresence>
            {hasCurrentImageError && !isCurrentImageLoading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-10 backdrop-blur-sm z-10"
              >
                <div className="text-center space-y-3 p-4">
                  <motion.div 
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {selectedSilhouette === 'male' ? (
                      <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    ) : (
                      <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    )}
                  </motion.div>
                  <div>
                    <p className="text-white text-sm sm:text-base font-medium">
                      {selectedSilhouette.charAt(0).toUpperCase() + selectedSilhouette.slice(1)} Model
                    </p>
                    <p className="text-white text-xs sm:text-sm opacity-75">
                      Preview not available
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Silhouette Image with Enhanced Transitions */}
          <AnimatePresence mode="wait">
            {!hasCurrentImageError && (
              <motion.div 
                key={selectedSilhouette}
                initial={{ 
                  opacity: 0, 
                  scale: 0.8,
                  rotateY: selectedSilhouette === 'male' ? -20 : 20
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotateY: 0
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  rotateY: selectedSilhouette === 'male' ? 20 : -20
                }}
                transition={{ 
                  duration: 0.7,
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 100
                }}
                className="relative w-full h-full"
              >
                <Image
                  src={currentImage}
                  alt={`${productName} on ${selectedSilhouette} model`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, 384px"
                  priority={selectedSilhouette === 'male'}
                />
                
                {/* Subtle overlay for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black from-0% via-transparent via-30% to-transparent opacity-20" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gender Label with Enhanced Animation */}
          <motion.div 
            className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.div 
              className="bg-black bg-opacity-50 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(0, 0, 0, 0.7)"
              }}
              transition={{ duration: 0.2 }}
            >
              <motion.p 
                className="text-white text-xs sm:text-sm font-medium uppercase tracking-wide"
                key={selectedSilhouette}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {selectedSilhouette} Model
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Enhanced Animated Indicator */}
        <motion.div 
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="flex space-x-1">
            <motion.div 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                selectedSilhouette === 'male' ? 'bg-white' : 'bg-white bg-opacity-30'
              }`}
              animate={selectedSilhouette === 'male' ? { 
                scale: [1, 1.3, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={{ duration: 0.6 }}
            />
            <motion.div 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                selectedSilhouette === 'female' ? 'bg-white' : 'bg-white bg-opacity-30'
              }`}
              animate={selectedSilhouette === 'female' ? { 
                scale: [1, 1.3, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={{ duration: 0.6 }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Usage Instructions (Screen Reader) */}
      <div className="sr-only">
        <p>
          Use the toggle buttons above to switch between male and female model views of {productName}.
          Currently showing: {selectedSilhouette} model.
        </p>
      </div>
    </div>
  );
};

export default SilhouetteSelector; 