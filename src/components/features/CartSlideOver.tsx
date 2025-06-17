'use client';

import React from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ShoppingBagIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/data';
import CartItemSizeDropdown from '@/components/features/CartItemSizeDropdown';

interface CartSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSlideOver: React.FC<CartSlideOverProps> = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, updateItemSize } = useCart();

  const handleQuantityChange = (productId: string, color: string, size: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, color, size);
    } else {
      updateQuantity(productId, color, size, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string, color: string, size: string) => {
    removeFromCart(productId, color, size);
  };

  const handleSizeChange = (productId: string, color: string, oldSize: string, newSize: string) => {
    console.log('Cart size change:', { productId, color, oldSize, newSize });
    updateItemSize(productId, color, oldSize, newSize);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-overlay bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-start justify-between p-4 border-b border-gray-200">
                      <Dialog.Title className="text-lg font-medium text-gray-900 uppercase tracking-wide">
                        Shopping Cart
                      </Dialog.Title>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="relative -m-2 p-2 text-gray-400 hover:text-gray-500 focus-outline"
                          onClick={onClose}
                          aria-label="Close cart"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Cart Content */}
                    <div className="flex-1 overflow-y-auto">
                      {cart.items.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center h-full px-4 py-16">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                          <p className="text-sm text-gray-500 text-center mb-6">
                            Start adding some items to your cart to see them here.
                          </p>
                          <Link
                            href="/products"
                            onClick={onClose}
                            className="btn-secondary text-primary-bg border-primary-bg hover:bg-primary-bg hover:text-white"
                          >
                            Browse Products
                          </Link>
                        </div>
                      ) : (
                        /* Cart Items */
                        <div className="p-4 space-y-4">
                          {cart.items.map((item) => (
                            <div key={`${item.product.id}-${item.selectedColor.code}-${item.selectedSize}`} className="flex space-x-4">
                              {/* Product Image */}
                              <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                                <Image
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {item.product.name}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>{item.selectedColor.name}</span>
                                  <span>•</span>
                                  <CartItemSizeDropdown
                                    currentSize={item.selectedSize}
                                    availableSizes={item.product.sizes}
                                    onSizeChange={(newSize) => 
                                      handleSizeChange(
                                        item.product.id, 
                                        item.selectedColor.code, 
                                        item.selectedSize, 
                                        newSize
                                      )
                                    }
                                    className="inline-block"
                                  />
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatPrice(item.product.price)}
                                </p>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex flex-col items-end space-y-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.product.id, item.selectedColor.code, item.selectedSize)}
                                  className="text-gray-400 hover:text-red-500 transition-colors duration-200 focus-outline"
                                  aria-label="Remove item"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                                
                                <div className="flex items-center border border-gray-300 rounded-md">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(item.product.id, item.selectedColor.code, item.selectedSize, item.quantity - 1)}
                                    className="p-1 hover:bg-gray-100 transition-colors duration-200 focus-outline"
                                    aria-label="Decrease quantity"
                                  >
                                    <MinusIcon className="h-3 w-3" />
                                  </button>
                                  <span className="px-2 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(item.product.id, item.selectedColor.code, item.selectedSize, item.quantity + 1)}
                                    className="p-1 hover:bg-gray-100 transition-colors duration-200 focus-outline"
                                    aria-label="Increase quantity"
                                  >
                                    <PlusIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer - Cart Summary */}
                    {cart.items.length > 0 && (
                      <div className="border-t border-gray-200 p-4 space-y-4">
                        {/* PHASE 5: Enhanced Order Summary with Shipping Display */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})</span>
                            <span className="font-medium text-gray-900">{formatPrice(cart.subtotal)}</span>
                          </div>
                          
                          {/* Enhanced Shipping Line Item */}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 flex items-center">
                              Shipping
                              {cart.shipping === 0 && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  FREE
                                </span>
                              )}
                            </span>
                            <span className={`font-medium ${cart.shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              {cart.shipping === 0 ? 'FREE' : formatPrice(cart.shipping)}
                            </span>
                          </div>
                          
                          {/* Shipping Progress Indicator */}
                          {cart.shipping > 0 && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Free shipping progress</span>
                                <span className="font-semibold">
                                  {formatPrice(300000 - cart.subtotal)} to go
                                </span>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min((cart.subtotal / 300000) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                              <p className="mt-2 text-blue-700">
                                🚚 Add {formatPrice(300000 - cart.subtotal)} more for FREE shipping!
                              </p>
                            </div>
                          )}

                          {/* Free Shipping Celebration */}
                          {cart.shipping === 0 && cart.subtotal > 0 && (
                            <div className="text-xs text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                              <div className="flex items-center">
                                <span className="text-base mr-2">🎉</span>
                                <div>
                                  <p className="font-medium">You got free shipping!</p>
                                  <p className="text-green-600">Your order qualifies for complimentary delivery</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between text-base font-semibold">
                              <span className="text-gray-900">Total</span>
                              <span className="text-gray-900">{formatPrice(cart.total)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Including all taxes and fees
                            </p>
                          </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                          type="button"
                          className="w-full btn-secondary text-primary-bg border-primary-bg hover:bg-primary-bg hover:text-white"
                          onClick={() => {
                            // TODO: Implement checkout functionality
                            alert('Checkout functionality will be implemented in the next phase!');
                          }}
                        >
                          CHECKOUT
                        </button>

                        {/* Continue Shopping */}
                        <Link
                          href="/products"
                          onClick={onClose}
                          className="block text-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 focus-outline"
                        >
                          Continue Shopping
                        </Link>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CartSlideOver; 