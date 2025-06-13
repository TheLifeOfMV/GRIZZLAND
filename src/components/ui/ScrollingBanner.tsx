'use client';

import React from 'react';

interface ScrollingBannerProps {
  text: string;
  className?: string;
  speed?: 'slow' | 'medium' | 'fast';
  backgroundColor?: string;
  textColor?: string;
}

const ScrollingBanner: React.FC<ScrollingBannerProps> = ({
  text,
  className = '',
  speed = 'medium',
  backgroundColor = 'bg-white',
  textColor = 'text-primary-bg'
}) => {
  // Observable Implementation: Structured logging for component lifecycle
  React.useEffect(() => {
    console.log('ScrollingBanner: Component mounted', { 
      text, 
      speed, 
      backgroundColor, 
      textColor 
    });
    return () => {
      console.log('ScrollingBanner: Component unmounted');
    };
  }, [text, speed, backgroundColor, textColor]);

  // Explicit Error Handling: Validate inputs
  if (!text || text.trim().length === 0) {
    console.warn('ScrollingBanner: Empty text provided, using fallback');
    return null;
  }

  // Speed configuration mapping
  const speedClasses = {
    slow: 'animate-scroll-slow',
    medium: 'animate-scroll-medium', 
    fast: 'animate-scroll-fast'
  };

  // Progressive Construction: Build component with clear structure
  return (
    <div 
      className={`w-full overflow-hidden ${backgroundColor} border-y border-gray-200 ${className}`}
      role="banner"
      aria-label="Scrolling banner"
    >
      <div className="relative py-2">
        {/* Primary scrolling text */}
        <div 
          className={`whitespace-nowrap ${speedClasses[speed]} ${textColor}`}
          aria-hidden="true"
        >
          {/* Dependency Transparency: Repeat pattern for seamless scroll */}
          {Array.from({ length: 6 }, (_, index) => (
            <React.Fragment key={index}>
              <span className="inline-block px-6 text-sm md:text-base font-bold uppercase tracking-[0.2em]">
                {text}
              </span>
              {/* Observable Implementation: Black square separator */}
              <span 
                className="inline-block w-2 h-2 bg-black mx-6 align-middle"
                aria-hidden="true"
                style={{ transform: 'translateY(-1px)' }}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingBanner; 