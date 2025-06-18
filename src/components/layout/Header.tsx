'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import CartSlideOver from '@/components/features/CartSlideOver';
import { 
  MagnifyingGlassIcon, 
  ShoppingBagIcon, 
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// MONOCODE: Observable Implementation - Structured logging for navigation
const logNavigation = (action: string, metadata: Record<string, any> = {}) => {
  console.log('NAV_EVENT', {
    timestamp: new Date().toISOString(),
    action,
    ...metadata
  });
};

const Header = () => {
  const { cart } = useCart();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);

  // MONOCODE: Deterministic State - Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsShopDropdownOpen(false);
    };
    
    if (isShopDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isShopDropdownOpen]);

  // MONOCODE: Dependency Transparency - Navigation configuration
  const navigation = [
    { name: 'Home', href: '/' },
    { 
      name: 'Shop', 
      href: '/products',
      hasDropdown: true,
      categories: [
        { name: 'T-SHIRTS', href: '/products?category=T-SHIRTS' },
        { name: 'HOODIES', href: '/products?category=HOODIES' },
        { name: 'LONG SLEEVES', href: '/products?category=LONG SLEEVES' },
      ]
    },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className="bg-primary-bg border-b border-white relative z-50">
        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300 transition-colors duration-300"
                onClick={() => {
                  logNavigation('mobile_menu_toggle', { open: !isMobileMenuOpen });
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
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
                <div key={item.name} className="relative">
                  {item.hasDropdown ? (
                    // MONOCODE: Progressive Construction - Shop with dropdown
                    <div
                      className="relative group"
                      onMouseEnter={() => setIsShopDropdownOpen(true)}
                      onMouseLeave={() => setIsShopDropdownOpen(false)}
                    >
                      <Link
                        href={item.href}
                        className="nav-link-dropdown text-white hover:text-gray-300 text-sm font-medium uppercase tracking-wide transition-colors duration-300 focus-outline inline-flex items-center"
                        onClick={() => {
                          logNavigation('nav_click', { item: item.name, href: item.href });
                        }}
                      >
                        {item.name}
                        <span className={`ml-1 text-xs transition-transform duration-200 ${isShopDropdownOpen ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </Link>
                      
                      {/* MONOCODE: Observable Implementation - Dropdown Menu */}
                      <div
                        className={`dropdown-menu absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-out ${
                          isShopDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                        }`}
                        style={{ zIndex: 9999 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.categories?.map((category, index) => (
                          <Link
                            key={category.name}
                            href={category.href}
                            className={`dropdown-item block px-4 py-3 text-sm font-medium text-primary-bg uppercase tracking-wide transition-all duration-200 hover:bg-primary-bg hover:text-white ${
                              index !== item.categories.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                            onClick={() => {
                              logNavigation('dropdown_click', { category: category.name, href: category.href });
                              setIsShopDropdownOpen(false);
                            }}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // MONOCODE: Progressive Construction - Regular navigation item
                    <Link
                      href={item.href}
                      className="text-white hover:text-gray-300 text-sm font-medium uppercase tracking-wide transition-colors duration-300 focus-outline inline-flex items-center"
                      onClick={() => {
                        logNavigation('nav_click', { item: item.name, href: item.href });
                      }}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* MONOCODE: Observable Implementation - Logo with navigation */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
              <Link 
                href="/" 
                className="flex items-center space-x-2 md:space-x-3 text-xl md:text-2xl font-bold text-white uppercase tracking-widest"
                onClick={() => {
                  logNavigation('logo_click', { href: '/' });
                }}
              >
                <Image
                  src="/images/LOGO.png"
                  alt="GRIZZLAND Logo"
                  width={47}
                  height={47}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain flex-shrink-0"
                  priority
                />
                <span>GRIZZLAND</span>
              </Link>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button
                type="button"
                className="text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                aria-label="Search"
                onClick={() => {
                  logNavigation('search_click');
                }}
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>

              {/* MONOCODE: Observable Implementation - Cart Icon with counter */}
              <button
                type="button"
                className="relative text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                onClick={() => {
                  logNavigation('cart_open', { itemCount: cart.length });
                  setIsCartOpen(true);
                }}
                aria-label="Shopping cart"
              >
                <ShoppingBagIcon className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-primary-bg text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MONOCODE: Progressive Construction - Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary-bg border-t border-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="block px-3 py-2 text-white hover:text-gray-300 text-sm font-medium uppercase tracking-wide transition-colors duration-300"
                    onClick={() => {
                      logNavigation('mobile_nav_click', { item: item.name, href: item.href });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.name}
                  </Link>
                  {item.hasDropdown && item.categories && (
                    <div className="ml-4 space-y-1">
                      {item.categories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="block px-3 py-2 text-white opacity-75 hover:opacity-100 text-xs font-medium uppercase tracking-wide transition-opacity duration-300"
                          onClick={() => {
                            logNavigation('mobile_dropdown_click', { category: category.name, href: category.href });
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* MONOCODE: Observable Implementation - Cart Slide Over */}
      <CartSlideOver 
        isOpen={isCartOpen} 
        onClose={() => {
          logNavigation('cart_close');
          setIsCartOpen(false);
        }} 
      />
    </>
  );
};

export default Header; 