import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation } from '@apollo/client';
import {
  GET_CART_ITEMS,
  GET_CART_ITEM_COUNT,
  ADD_TO_CART,
  UPDATE_CART_ITEM,
  REMOVE_FROM_CART,
  CLEAR_CART,
} from '../graphql/cart';
import { TCartItem } from '../types';
import { useToast } from '../components/ui/Toast';

interface TCartContext {
  addToCart: (input: {
    productId: string;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
  }) => Promise<void>;

  updateCartItem: (input: {
    cartItemId: string;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }) => Promise<void>;

  removeFromCart: (cartItemId: string) => Promise<void>;

  clearCart: () => Promise<void>;
}

interface CartProviderProps {
  children: ReactNode;
}

const CartContext = createContext<TCartContext | undefined>(undefined);

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { showToast } = useToast();

  const [addToCartMutation] = useMutation<{ addToCart: TCartItem }>(
    ADD_TO_CART,
  );

  const [updateCartItemMutation] = useMutation(UPDATE_CART_ITEM);
  const [removeFromCartMutation] = useMutation(REMOVE_FROM_CART);
  const [clearCartMutation] = useMutation(CLEAR_CART);

  const addToCart = async (input: {
    productId: string;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
  }) => {
    try {
      const { data } = await addToCartMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_CART_ITEMS },
          { query: GET_CART_ITEM_COUNT },
        ],
      });

      if (data?.addToCart) {
        const { product } = data.addToCart;
        showToast(
          `${product.name} has been added to your shopping cart.`,
          'success',
          { title: 'Added to Cart!' },
        );
      }
    } catch (error) {
      showToast('Failed to add item to cart', 'error');
    }
  };

  const updateCartItem = async (input: {
    cartItemId: string;
    quantity: number;
  }) => {
    try {
      await updateCartItemMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_CART_ITEMS },
          { query: GET_CART_ITEM_COUNT },
        ],
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await removeFromCartMutation({
        variables: { input: { cartItemId } },
        refetchQueries: [
          { query: GET_CART_ITEMS },
          { query: GET_CART_ITEM_COUNT },
        ],
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await clearCartMutation({
        refetchQueries: [
          { query: GET_CART_ITEMS },
          { query: GET_CART_ITEM_COUNT },
        ],
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const value: TCartContext = {
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
