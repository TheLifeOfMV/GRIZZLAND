'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Cart, CartItem, Product, ProductColor, ProductSize } from '@/types';
import { calculateShipping } from '@/lib/data';

// Cart Actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; color: ProductColor; size: ProductSize; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; color: string; size: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; color: string; size: string; quantity: number } }
  | { type: 'UPDATE_SIZE'; payload: { productId: string; color: string; oldSize: string; newSize: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart };

// Initial Cart State
const initialCart: Cart = {
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
  itemCount: 0,
};

// Cart Reducer
function cartReducer(state: Cart, action: CartAction): Cart {
  console.log('Cart Action:', action.type, 'payload' in action ? action.payload : null);

  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, color, size, quantity = 1 } = action.payload;
      
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        item => 
          item.product.id === product.id && 
          item.selectedColor.code === color.code && 
          item.selectedSize === size
      );

      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          selectedColor: color,
          selectedSize: size,
          quantity,
        };
        newItems = [...state.items, newItem];
      }

      const subtotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shipping = calculateShipping(subtotal);
      const total = subtotal + shipping;
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        subtotal,
        shipping,
        total,
        itemCount,
      };
    }

    case 'REMOVE_ITEM': {
      const { productId, color, size } = action.payload;
      
      const newItems = state.items.filter(
        item => !(
          item.product.id === productId && 
          item.selectedColor.code === color && 
          item.selectedSize === size
        )
      );

      const subtotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shipping = calculateShipping(subtotal);
      const total = subtotal + shipping;
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        subtotal,
        shipping,
        total,
        itemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, color, size, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return cartReducer(state, { 
          type: 'REMOVE_ITEM', 
          payload: { productId, color, size } 
        });
      }

      const newItems = state.items.map(item =>
        item.product.id === productId && 
        item.selectedColor.code === color && 
        item.selectedSize === size
          ? { ...item, quantity }
          : item
      );

      const subtotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shipping = calculateShipping(subtotal);
      const total = subtotal + shipping;
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        subtotal,
        shipping,
        total,
        itemCount,
      };
    }

    case 'UPDATE_SIZE': {
      const { productId, color, oldSize, newSize } = action.payload;
      
      // Find the item to update
      const itemToUpdate = state.items.find(
        item => 
          item.product.id === productId && 
          item.selectedColor.code === color && 
          item.selectedSize === oldSize
      );

      if (!itemToUpdate) return state;

      // Check if an item with the new size already exists
      const existingNewSizeItem = state.items.find(
        item => 
          item.product.id === productId && 
          item.selectedColor.code === color && 
          item.selectedSize === newSize
      );

      let newItems;
      if (existingNewSizeItem) {
        // Merge quantities and remove old item
        newItems = state.items
          .filter(item => item !== itemToUpdate)
          .map(item =>
            item === existingNewSizeItem
              ? { ...item, quantity: item.quantity + itemToUpdate.quantity }
              : item
          );
      } else {
        // Update the size
        newItems = state.items.map(item =>
          item === itemToUpdate
            ? { ...item, selectedSize: newSize as ProductSize }
            : item
        );
      }

      const subtotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shipping = calculateShipping(subtotal);
      const total = subtotal + shipping;
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, subtotal, shipping, total, itemCount };
    }

    case 'CLEAR_CART':
      return initialCart;

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
}

// Cart Context
interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, color: ProductColor, size: ProductSize, quantity?: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  updateItemSize: (productId: string, color: string, oldSize: string, newSize: string) => void;
  clearCart: () => void;
  isInCart: (productId: string, color: string, size: string) => boolean;
  getItemQuantity: (productId: string, color: string, size: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('grizzland-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('grizzland-cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (product: Product, color: ProductColor, size: ProductSize, quantity = 1) => {
    console.log('Adding to cart:', { product: product.name, color: color.name, size, quantity });
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: { product, color, size, quantity } 
    });
  };

  const removeFromCart = (productId: string, color: string, size: string) => {
    console.log('Removing from cart:', { productId, color, size });
    dispatch({ 
      type: 'REMOVE_ITEM', 
      payload: { productId, color, size } 
    });
  };

  const updateQuantity = (productId: string, color: string, size: string, quantity: number) => {
    console.log('Updating quantity:', { productId, color, size, quantity });
    dispatch({ 
      type: 'UPDATE_QUANTITY', 
      payload: { productId, color, size, quantity } 
    });
  };

  const updateItemSize = (productId: string, color: string, oldSize: string, newSize: string) => {
    console.log('Updating item size:', { productId, color, oldSize, newSize });
    dispatch({ 
      type: 'UPDATE_SIZE', 
      payload: { productId, color, oldSize, newSize } 
    });
  };

  const clearCart = () => {
    console.log('Clearing cart');
    dispatch({ type: 'CLEAR_CART' });
  };

  const isInCart = (productId: string, color: string, size: string): boolean => {
    return cart.items.some(
      item => 
        item.product.id === productId && 
        item.selectedColor.code === color && 
        item.selectedSize === size
    );
  };

  const getItemQuantity = (productId: string, color: string, size: string): number => {
    const item = cart.items.find(
      item => 
        item.product.id === productId && 
        item.selectedColor.code === color && 
        item.selectedSize === size
    );
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateItemSize,
      clearCart,
      isInCart,
      getItemQuantity,
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Cart Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 