'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth-context';
import CartSlideOver from '@/components/features/CartSlideOver';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  ShoppingBagIcon, 
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const { cart } = useCart();
  const { user, signOut, loading, isAdmin } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/products' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  // Handle user sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

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

              {/* User Menu */}
              <div className="relative user-menu">
                {user ? (
                  // Authenticated user menu
                  <div>
                    <button
                      type="button"
                      className="flex items-center text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      aria-label="User menu"
                      aria-expanded={isUserMenuOpen}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <span className="hidden sm:block text-sm font-medium">
                          {user.user_metadata?.first_name || user.email?.split('@')[0] || 'Account'}
                        </span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* User dropdown menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-2">
                          {/* User info */}
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {user.user_metadata?.first_name && user.user_metadata?.last_name
                                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                                : user.email
                              }
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {isAdmin && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                Admin
                              </span>
                            )}
                          </div>

                          {/* Menu items */}
                          <div className="py-1">
                            <Link
                              href="/account/profile"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              My Profile
                            </Link>
                            <Link
                              href="/account/orders"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              Order History
                            </Link>
                            <Link
                              href="/account/wishlist"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              Wishlist
                            </Link>
                            
                            {/* Admin menu items */}
                            {isAdmin && (
                              <>
                                <div className="border-t border-gray-100 my-1"></div>
                                <Link
                                  href="/admin/dashboard"
                                  className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  Admin Dashboard
                                </Link>
                                <Link
                                  href="/admin/products"
                                  className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  Manage Products
                                </Link>
                              </>
                            )}
                          </div>

                          {/* Sign out */}
                          <div className="border-t border-gray-100 py-1">
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              disabled={loading}
                            >
                              {loading ? 'Signing out...' : 'Sign Out'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Guest user menu
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/auth/login"
                      className="text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                      aria-label="Sign in"
                    >
                      <UserIcon className="h-6 w-6" />
                    </Link>
                    <span className="hidden sm:block text-white opacity-75">|</span>
                    <Link
                      href="/auth/login"
                      className="hidden sm:block text-sm text-white hover:text-gray-300 transition-colors duration-300 focus-outline"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

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