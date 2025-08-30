import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_CART_ITEMS,
  GET_CART_ITEM_COUNT,
  ADD_TO_CART,
  UPDATE_CART_ITEM,
  REMOVE_FROM_CART,
  CLEAR_CART,
} from '../graphql/cart';

interface CartItem {
  id: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  createdAt: string;
  productId: {
    id: string;
    name: string;
    brand: string;
    price: number;
    salePrice?: number;
    images: string[];
    description?: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartItemCount: number;
  loading: boolean;
  addToCart: (input: {
    productId: string;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
  }) => Promise<void>;
  updateCartItem: (input: {
    cartItemId: string;
    quantity: number;
  }) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetchCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartItemCount, setCartItemCount] = useState(0);

  const client = useApolloClient();

  const {
    data: cartData,
    loading: cartLoading,
    refetch: refetchCart,
  } = useQuery(GET_CART_ITEMS, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      if (data?.getCartItems) {
        setCartItems(data.getCartItems);
      }
    },
  });

  const { data: countData, loading: countLoading } = useQuery(
    GET_CART_ITEM_COUNT,
    {
      fetchPolicy: 'cache-and-network',
      onCompleted: (data) => {
        if (data?.getCartItemCount !== undefined) {
          setCartItemCount(data.getCartItemCount);
        }
      },
    },
  );

  const [addToCartMutation] = useMutation(ADD_TO_CART);
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
        // Toast is handled by the calling component
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
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

  const loading = cartLoading || countLoading;

  const value: CartContextType = {
    cartItems,
    cartItemCount,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
