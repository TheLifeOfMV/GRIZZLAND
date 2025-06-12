'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import CartSlideOver from '@/components/features/CartSlideOver';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  ShoppingBagIcon, 
  Bars3Icon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Header = () => {
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/products' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className="bg-primary-bg border-b border-white">
        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300 transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-gray-300 text-sm font-medium uppercase tracking-wide transition-colors duration-300 focus-outline"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Logo */}
            <div className="flex-1 flex justify-center md:justify-center">
              <Link 
                href="/" 
                className="text-2xl font-bold text-white uppercase tracking-widest hover:text-gray-300 transition-colors duration-300 focus-outline"
              >
                GRIZZLAND
              </Link>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button
                type="button"
                className="text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>

              {/* User Icon */}
              <Link
                href="/auth/login"
                className="text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                aria-label="Account"
              >
                <UserIcon className="h-6 w-6" />
              </Link>

              {/* Cart Icon */}
              <button
                type="button"
                className="relative text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                onClick={() => setIsCartOpen(true)}
                aria-label={`Shopping cart with ${cart.itemCount} items`}
              >
                <ShoppingBagIcon className="h-6 w-6" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-primary-bg rounded-full text-xs font-bold h-5 w-5 flex items-center justify-center animate-pulse">
                    {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-white hover:text-gray-300 block px-3 py-2 text-base font-medium uppercase tracking-wide transition-colors duration-300 focus-outline"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Cart Slide Over */}
      <CartSlideOver 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
};

export default Header; 