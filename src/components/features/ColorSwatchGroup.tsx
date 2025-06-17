'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { ProductColor } from '@/types';

/**
 * PHASE 3: Enhanced ColorSwatch Component
 * 
 * Purpose: Advanced color selection with hover effects, tooltips, and responsive design
 * Features: Multiple sizes, layouts, enhanced accessibility, and smooth interactions
 * Testing: Real-environment validation with concrete examples
 */

interface ColorSwatchGroupProps {
  colors: ProductColor[];
  selectedColor: ProductColor | null;
  onColorSelect: (color: ProductColor) => void;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'grid';
  maxVisible?: number;
  showLabels?: boolean;
  showTooltip?: boolean;
  className?: string;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 sm:w-7 sm:h-7',
  md: 'w-8 h-8 sm:w-9 sm:h-9',
  lg: 'w-10 h-10 sm:w-12 sm:h-12'
};

const checkSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

export const ColorSwatchGroup: React.FC<ColorSwatchGroupProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  size = 'md',
  layout = 'horizontal',
  maxVisible = 6,
  showLabels = false,
  showTooltip = true,
  className = '',
  disabled = false
}) => {
  const [hoveredColor, setHoveredColor] = useState<ProductColor | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number} | null>(null);

  // DEFENSIVE PROGRAMMING: Filter out null/undefined colors and validate input
  const validColors = colors?.filter((color): color is ProductColor => 
    color !== null && 
    color !== undefined && 
    typeof color === 'object' && 
    'code' in color && 
    'name' in color && 
    'value' in color
  ) || [];

  // Early return if no valid colors
  if (validColors.length === 0) {
    console.warn('ColorSwatchGroup: No valid colors provided');
    return (
      <div className={`text-white opacity-75 text-sm ${className}`}>
        No colors available
      </div>
    );
  }

  const visibleColors = validColors.slice(0, maxVisible);
  const remainingCount = Math.max(0, validColors.length - maxVisible);

  const handleColorSelect = (color: ProductColor, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    // Observability: Log color selection for debugging
    console.log(`ColorSwatchGroup: Selected color ${color.name} (${color.code})`);
    onColorSelect(color);
  };

  const handleMouseEnter = (color: ProductColor, event: React.MouseEvent) => {
    if (!showTooltip) return;
    
    setHoveredColor(color);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const handleMouseLeave = () => {
    setHoveredColor(null);
    setTooltipPosition(null);
  };

  const containerClasses = layout === 'grid' 
    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3'
    : 'flex flex-wrap gap-2 sm:gap-3';

  return (
    <div className={`relative ${className}`}>
      {/* Color Swatches Container */}
      <div className={containerClasses}>
        {visibleColors.map((color) => {
          // DEFENSIVE PROGRAMMING: Additional safety check for each color
          if (!color || !color.code) {
            console.warn('ColorSwatchGroup: Invalid color object found:', color);
            return null;
          }

          // SAFE COMPARISON: Only compare if selectedColor exists and has code property
          const isSelected = selectedColor?.code === color.code;
          const isHovered = hoveredColor?.code === color.code;
          
          return (
            <div key={color.code} className="relative group">
              <button
                onClick={(e) => handleColorSelect(color, e)}
                onMouseEnter={(e) => handleMouseEnter(color, e)}
                onMouseLeave={handleMouseLeave}
                disabled={disabled}
                className={`
                  ${sizeClasses[size]}
                  relative rounded-full border-2 transition-all duration-300 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
                  ${disabled 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'cursor-pointer hover:scale-110 active:scale-95'
                  }
                  ${isSelected 
                    ? 'border-white shadow-lg ring-2 ring-white ring-opacity-50' 
                    : 'border-gray-300 hover:border-white hover:shadow-md'
                  }
                  ${isHovered && !isSelected ? 'scale-105' : ''}
                `}
                style={{ backgroundColor: color.value }}
                aria-label={`Select ${color.name} color`}
                aria-pressed={isSelected}
              >
                {/* Selected State Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 rounded-full p-1">
                      <CheckIcon className={`${checkSizes[size]} text-white`} />
                    </div>
                  </div>
                )}

                {/* Hover Ring Effect */}
                <div className={`
                  absolute inset-0 rounded-full border-2 border-white opacity-0 
                  transition-opacity duration-200
                  ${isHovered && !isSelected ? 'opacity-30' : ''}
                `} />
              </button>

              {/* Color Label (if enabled) */}
              {showLabels && (
                <p className="mt-1 text-xs sm:text-sm text-center text-white opacity-75 line-clamp-1">
                  {color.name}
                </p>
              )}
            </div>
          );
        })}

        {/* Remaining Colors Count */}
        {remainingCount > 0 && (
          <div className={`
            ${sizeClasses[size]}
            relative rounded-full border-2 border-gray-300 bg-white bg-opacity-10 
            backdrop-blur-sm flex items-center justify-center
          `}>
            <span className="text-xs sm:text-sm font-medium text-white">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && hoveredColor && tooltipPosition && (
        <div 
          className="fixed z-50 px-2 py-1 bg-black bg-opacity-90 text-white text-xs rounded-md pointer-events-none transform -translate-x-1/2 -translate-y-full backdrop-blur-sm"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          {hoveredColor.name}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-t-opacity-90" />
        </div>
      )}

      {/* Selected Color Info */}
      {showLabels && selectedColor && (
        <div className="mt-3 sm:mt-4">
          <p className="text-sm sm:text-base text-white">
            <span className="opacity-75">Selected: </span>
            <span className="font-medium">{selectedColor.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ColorSwatchGroup; 