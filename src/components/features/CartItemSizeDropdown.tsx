'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ProductSize } from '@/types';

/**
 * PHASE 4: Cart UI Size Dropdown Extension
 * 
 * Purpose: Dropdown component for changing item sizes within cart
 * Features: Responsive design, smooth animations, accessibility, touch-friendly
 * Testing: Real-environment validation with cart state synchronization
 */

interface CartItemSizeDropdownProps {
  currentSize: ProductSize;
  availableSizes: ProductSize[];
  onSizeChange: (newSize: ProductSize) => void;
  disabled?: boolean;
  className?: string;
}

const sizeLabels: Record<ProductSize, string> = {
  'XS': 'Extra Small',
  'S': 'Small',
  'M': 'Medium',
  'L': 'Large',
  'XL': 'Extra Large',
  'XXL': 'XX Large'
};

export const CartItemSizeDropdown: React.FC<CartItemSizeDropdownProps> = ({
  currentSize,
  availableSizes,
  onSizeChange,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, availableSizes.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleSizeSelect(availableSizes[focusedIndex]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, availableSizes]);

  const handleSizeSelect = (size: ProductSize) => {
    if (disabled || size === currentSize) return;

    // Observability: Log size changes for debugging
    console.log(`CartItemSizeDropdown: Changed size from ${currentSize} to ${size}`);
    
    onSizeChange(size);
    setIsOpen(false);
    
    // Return focus to trigger
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 100);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setFocusedIndex(availableSizes.indexOf(currentSize));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        ref={triggerRef}
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          relative w-full min-w-[80px] px-3 py-2 text-left bg-white border border-gray-300 
          rounded-md shadow-sm transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-primary-bg focus:border-primary-bg
          ${disabled 
            ? 'cursor-not-allowed opacity-50 bg-gray-50' 
            : 'cursor-pointer hover:border-gray-400 active:scale-95'
          }
          ${isOpen ? 'ring-2 ring-primary-bg border-primary-bg' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Change size from ${currentSize}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
            {currentSize}
          </span>
          <ChevronDownIcon 
            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg animate-slide-up">
          <div
            className="py-1 max-h-60 overflow-auto"
            role="listbox"
            aria-label="Size options"
          >
            {availableSizes.map((size, index) => {
              const isSelected = size === currentSize;
              const isFocused = index === focusedIndex;
              
              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`
                    relative w-full px-3 py-2 text-left text-sm sm:text-base transition-colors duration-150
                    focus:outline-none
                    ${isSelected 
                      ? 'bg-primary-bg text-white' 
                      : isFocused 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{size}</span>
                      <span className="ml-2 text-xs sm:text-sm opacity-75">
                        {sizeLabels[size]}
                      </span>
                    </div>
                    
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-current" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CartItemSizeDropdown; 