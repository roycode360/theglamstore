import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
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
import { useAuth } from './AuthContext';
import { localCartUtils, LocalCartItem } from '../utils/localCart';
import { GET_PRODUCT } from '../graphql/products';
import { useAnalyticsTracker } from '../hooks/useAnalyticsTracker';

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

  // Hybrid cart state
  cartItems: TCartItem[] | LocalCartItem[];
  cartItemCount: number;
  isLoading: boolean;
  cartLoaded: boolean;
  syncLocalCartToServer: () => Promise<void>;
}

interface CartProviderProps {
  children: ReactNode;
}

const CartContext = createContext<TCartContext | undefined>(undefined);

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { showToast } = useToast();
  const { isUserAuthenticated, user } = useAuth();
  const client = useApolloClient();
  const { trackAddToCart } = useAnalyticsTracker();

  // State for hybrid cart
  const [cartItems, setCartItems] = useState<TCartItem[] | LocalCartItem[]>([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);

  const [addToCartMutation] = useMutation<{ addToCart: TCartItem }>(
    ADD_TO_CART,
  );

  const [updateCartItemMutation] = useMutation(UPDATE_CART_ITEM);
  const [removeFromCartMutation] = useMutation(REMOVE_FROM_CART);
  const [clearCartMutation] = useMutation(CLEAR_CART);

  // Query for authenticated users
  const {
    data: apiCartData,
    loading: apiCartLoading,
    refetch: refetchApiCart,
  } = useQuery<{
    getCartItems: TCartItem[];
  }>(GET_CART_ITEMS, {
    skip: !isUserAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const { data: apiCartCountData, refetch: refetchApiCartCount } = useQuery<{
    getCartItemCount: number;
  }>(GET_CART_ITEM_COUNT, {
    skip: !isUserAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  // Sync local cart to server when user logs in
  const syncLocalCartToServer = async () => {
    if (!isUserAuthenticated) return;

    const localItems = localCartUtils.getCartItems();
    if (localItems.length === 0) return;

    try {
      setIsLoading(true);
      // Add each local item to the server
      for (const item of localItems) {
        await addToCartMutation({
          variables: {
            input: {
              productId: item.productId,
              quantity: item.quantity,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
            },
          },
        });
      }

      // Clear local cart after successful sync
      localCartUtils.clearCart();

      // Refresh server cart data
      await refetchApiCart();
      await refetchApiCartCount();

      // showToast('Cart synced successfully', 'success');
    } catch (error) {
      console.error('Error syncing cart:', error);
      showToast('Failed to sync cart items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart data based on authentication status
  useEffect(() => {
    if (isUserAuthenticated) {
      setIsLoading(apiCartLoading);
      if (!apiCartLoading) {
        setCartItems(apiCartData?.getCartItems ?? []);
        if (apiCartCountData?.getCartItemCount !== undefined) {
          setCartItemCount(apiCartCountData.getCartItemCount);
        } else {
          setCartItemCount(apiCartData?.getCartItems?.length ?? 0);
        }
        setCartLoaded(true);
      } else {
        setCartLoaded(false);
      }
    } else {
      // User is not authenticated, use local storage
      const localItems = localCartUtils.getCartItems();
      setCartItems(localItems);
      setCartItemCount(localCartUtils.getCartItemCount());
      setIsLoading(false);
      setCartLoaded(true);
    }
  }, [isUserAuthenticated, apiCartData, apiCartCountData, apiCartLoading]);

  // Sync local cart when user logs in
  useEffect(() => {
    if (isUserAuthenticated && user) {
      syncLocalCartToServer();
    }
  }, [isUserAuthenticated, user]);

  const addToCart = async (input: {
    productId: string;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
  }) => {
    if (isUserAuthenticated) {
      // Use API for authenticated users
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
          trackAddToCart(input.productId);
        }
      } catch (error) {
        showToast('Failed to add item to cart', 'error');
      }
    } else {
      // Use local storage for unauthenticated users
      try {
        // Fetch product details first
        const { data: productData } = await client.query({
          query: GET_PRODUCT,
          variables: { id: input.productId },
          fetchPolicy: 'cache-first',
        });

        if (productData?.getProduct) {
          const product = productData.getProduct;
          const localItem: LocalCartItem = {
            id: `${input.productId}-${Date.now()}`, // This will be ignored if item exists
            productId: input.productId,
            quantity: input.quantity,
            selectedSize: input.selectedSize,
            selectedColor: input.selectedColor,
            product: {
              _id: product._id,
              name: product.name,
              brand: product.brand,
              price: product.price,
              salePrice: product.salePrice,
              images: product.images || [],
            },
          };

          // Check existing items before adding
          const existingItems = localCartUtils.getCartItems();
          const existingItem = existingItems.find(
            (i) =>
              i.productId === input.productId &&
              i.selectedSize === input.selectedSize &&
              i.selectedColor === input.selectedColor,
          );

          localCartUtils.addToCart(localItem);

          // Update local state
          const localItems = localCartUtils.getCartItems();
          setCartItems(localItems);
          setCartItemCount(localCartUtils.getCartItemCount());

          if (existingItem) {
            showToast(`${product.name} quantity updated in cart`, 'success');
          } else {
            showToast(`${product.name} added to cart`, 'success');
          }
          trackAddToCart(input.productId);
        } else {
          showToast('Product not found', 'error');
        }
      } catch (error) {
        console.error('Error adding to local cart:', error);
        showToast('Failed to add item to cart', 'error');
      }
    }
  };

  const updateCartItem = async (input: {
    cartItemId: string;
    quantity: number;
  }) => {
    if (isUserAuthenticated) {
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
    } else {
      // Update local storage
      localCartUtils.updateCartItem(input.cartItemId, {
        quantity: input.quantity,
      });

      // Update local state
      const localItems = localCartUtils.getCartItems();
      setCartItems(localItems);
      setCartItemCount(localCartUtils.getCartItemCount());
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (isUserAuthenticated) {
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
    } else {
      // Remove from local storage
      localCartUtils.removeFromCart(cartItemId);

      // Update local state
      const localItems = localCartUtils.getCartItems();
      setCartItems(localItems);
      setCartItemCount(localCartUtils.getCartItemCount());
    }
  };

  const clearCart = async () => {
    if (isUserAuthenticated) {
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
    } else {
      // Clear local storage
      localCartUtils.clearCart();

      // Update local state
      setCartItems([]);
      setCartItemCount(0);
    }
  };

  const value: TCartContext = {
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    cartItems,
    cartItemCount,
    isLoading,
    cartLoaded,
    syncLocalCartToServer,
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
