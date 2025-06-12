'use client';

import React, { useState, useEffect, useRef, Children, isValidElement } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CarouselProps {
  children: React.ReactNode;
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
  className?: string;
}

const Carousel: React.FC<CarouselProps> = ({
  children,
  autoPlay = false,
  interval = 4000,
  showArrows = true,
  showDots = true,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 16,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [itemsVisible, setItemsVisible] = useState(itemsPerView.desktop);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const validChildren = Children.toArray(children).filter(isValidElement);
  const totalItems = validChildren.length;
  const maxIndex = Math.max(0, totalItems - itemsVisible);

  // Responsive items per view
  useEffect(() => {
    const updateItemsVisible = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsVisible(itemsPerView.mobile);
      } else if (width < 1024) {
        setItemsVisible(itemsPerView.tablet);
      } else {
        setItemsVisible(itemsPerView.desktop);
      }
    };

    updateItemsVisible();
    window.addEventListener('resize', updateItemsVisible);
    return () => window.removeEventListener('resize', updateItemsVisible);
  }, [itemsPerView]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && totalItems > itemsVisible) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, interval, maxIndex, totalItems, itemsVisible]);

  // Navigation functions
  const goToSlide = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clampedIndex);
  };

  const goToPrevious = () => {
    goToSlide(currentIndex > 0 ? currentIndex - 1 : maxIndex);
  };

  const goToNext = () => {
    goToSlide(currentIndex < maxIndex ? currentIndex + 1 : 0);
  };

  // Touch/Mouse handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setScrollLeft(currentIndex);
    setIsPlaying(false);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    const deltaX = startX - clientX;
    const threshold = 50;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentIndex < maxIndex) {
        goToNext();
      } else if (deltaX < 0 && currentIndex > 0) {
        goToPrevious();
      }
      setIsDragging(false);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (autoPlay) {
      setTimeout(() => setIsPlaying(true), 1000);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const itemWidth = `calc(${100 / itemsVisible}% - ${(gap * (itemsVisible - 1)) / itemsVisible}px)`;
  const translateX = `calc(-${currentIndex * (100 / itemsVisible)}% - ${currentIndex * gap}px)`;

  if (totalItems === 0) {
    return <div className="text-center py-8 text-gray-500">No items to display</div>;
  }

  return (
    <div 
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Carousel"
    >
      {/* Main Carousel */}
      <div 
        ref={carouselRef}
        className="overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${translateX})`,
            gap: `${gap}px`,
          }}
        >
          {validChildren.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ width: itemWidth }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalItems > itemsVisible && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus-outline"
            aria-label="Previous items"
            disabled={currentIndex === 0}
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus-outline"
            aria-label="Next items"
            disabled={currentIndex === maxIndex}
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalItems > itemsVisible && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 focus-outline ${
                index === currentIndex
                  ? 'bg-primary-bg scale-110'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Button (for auto-play) */}
      {autoPlay && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-80 rounded-full shadow-md hover:shadow-lg transition-all duration-200 focus-outline"
          aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {/* Screen Reader Info */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing items {currentIndex + 1} to {Math.min(currentIndex + itemsVisible, totalItems)} of {totalItems}
      </div>
    </div>
  );
};

export default Carousel; 