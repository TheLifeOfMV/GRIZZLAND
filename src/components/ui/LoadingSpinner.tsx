'use client';

import React, { useEffect } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  overlay?: boolean;
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Loading...',
  overlay = false,
  onLoadingStart,
  onLoadingEnd,
}) => {
  useEffect(() => {
    // Observable Implementation: Log loading state changes
    const startTime = Date.now();
    console.log('LoadingSpinner: Started', {
      timestamp: new Date().toISOString(),
      component: 'LoadingSpinner',
      size,
      message,
      overlay,
    });

    onLoadingStart?.();

    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Observable Implementation: Track loading duration for performance monitoring
      console.log('LoadingSpinner: Ended', {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        component: 'LoadingSpinner',
      });

      // Performance monitoring: Flag slow loading times
      if (duration > 3000) {
        console.warn('LoadingSpinner: Slow loading detected', {
          duration: `${duration}ms`,
          threshold: '3000ms',
          recommendation: 'Investigate performance bottleneck',
        });
      }

      onLoadingEnd?.();
    };
  }, [size, message, overlay, onLoadingStart, onLoadingEnd]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-12 h-12';
      case 'md':
      default:
        return 'w-8 h-8';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'md':
      default:
        return 'text-base';
    }
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Animated Spinner */}
      <div className={`${getSizeClasses()} relative`}>
        <div className="absolute inset-0 border-2 border-white border-opacity-20 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      {/* Loading Message */}
      {message && (
        <p className={`text-white opacity-75 uppercase tracking-wide ${getTextSizeClasses()}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div 
        className="fixed inset-0 bg-primary-bg bg-opacity-80 flex items-center justify-center z-50"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center py-8"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {spinner}
    </div>
  );
};

// Specialized loading components for common use cases
export const ProductLoadingSpinner: React.FC = () => (
  <LoadingSpinner 
    size="md" 
    message="Loading products..." 
    onLoadingStart={() => console.log('Products: Loading started')}
    onLoadingEnd={() => console.log('Products: Loading completed')}
  />
);

export const CartLoadingSpinner: React.FC = () => (
  <LoadingSpinner 
    size="sm" 
    message="Adding to cart..." 
    onLoadingStart={() => console.log('Cart: Operation started')}
    onLoadingEnd={() => console.log('Cart: Operation completed')}
  />
);

export const PageLoadingSpinner: React.FC = () => (
  <LoadingSpinner 
    size="lg" 
    message="Loading page..." 
    overlay={true}
    onLoadingStart={() => console.log('Page: Loading started')}
    onLoadingEnd={() => console.log('Page: Loading completed')}
  />
);

export default LoadingSpinner; 