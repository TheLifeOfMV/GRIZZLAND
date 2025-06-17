'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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
    // Observability: Log silhouette changes for debugging
    console.log(`SilhouetteSelector: Changed to ${silhouette} for ${productName}`);
    onSilhouetteChange(silhouette);
  };

  const currentImage = selectedSilhouette === 'male' ? maleImage : femaleImage;
  const isCurrentImageLoading = imageLoading[selectedSilhouette];
  const hasCurrentImageError = imageError[selectedSilhouette];

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Gender Selection Toggle */}
      <div className="flex justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-1 sm:p-2">
          <div className="flex space-x-1 sm:space-x-2">
            {/* Male Toggle */}
            <button
              onClick={() => handleSilhouetteChange('male')}
              className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-all duration-300 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                selectedSilhouette === 'male'
                  ? 'bg-white text-primary-bg shadow-md'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
              aria-label="View on male model"
              aria-pressed={selectedSilhouette === 'male'}
            >
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium uppercase tracking-wide">
                Male
              </span>
            </button>

            {/* Female Toggle */}
            <button
              onClick={() => handleSilhouetteChange('female')}
              className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-all duration-300 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                selectedSilhouette === 'female'
                  ? 'bg-white text-primary-bg shadow-md'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
              aria-label="View on female model"
              aria-pressed={selectedSilhouette === 'female'}
            >
              <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium uppercase tracking-wide">
                Female
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Silhouette Image Display */}
      <div className="relative">
        <div className="relative aspect-[3/4] sm:aspect-[2/3] lg:aspect-[3/4] max-w-xs sm:max-w-sm mx-auto bg-white bg-opacity-5 rounded-lg overflow-hidden">
          {/* Loading State */}
          {isCurrentImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-10 backdrop-blur-sm">
              <div className="space-y-3 text-center">
                <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                <p className="text-white text-xs sm:text-sm opacity-75">
                  Loading {selectedSilhouette} model...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasCurrentImageError && !isCurrentImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-10 backdrop-blur-sm">
              <div className="text-center space-y-3 p-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {selectedSilhouette === 'male' ? (
                    <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  ) : (
                    <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm sm:text-base font-medium">
                    {selectedSilhouette.charAt(0).toUpperCase() + selectedSilhouette.slice(1)} Model
                  </p>
                  <p className="text-white text-xs sm:text-sm opacity-75">
                    Preview not available
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Silhouette Image */}
          {!hasCurrentImageError && (
            <div className="relative w-full h-full">
              <Image
                src={currentImage}
                alt={`${productName} on ${selectedSilhouette} model`}
                fill
                className={`object-cover transition-all duration-500 ${
                  isCurrentImageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
                sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, 384px"
                priority={selectedSilhouette === 'male'} // Prioritize male image for faster initial load
              />
              
              {/* Subtle overlay for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black from-0% via-transparent via-30% to-transparent opacity-20" />
            </div>
          )}

          {/* Gender Label */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-black bg-opacity-50 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full">
              <p className="text-white text-xs sm:text-sm font-medium uppercase tracking-wide">
                {selectedSilhouette} Model
              </p>
            </div>
          </div>
        </div>

        {/* Animated Indicator */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              selectedSilhouette === 'male' ? 'bg-white' : 'bg-white bg-opacity-30'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              selectedSilhouette === 'female' ? 'bg-white' : 'bg-white bg-opacity-30'
            }`} />
          </div>
        </div>
      </div>

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