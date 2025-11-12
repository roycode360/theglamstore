import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
  ADD_TO_WISHLIST,
  LIST_WISHLIST,
  REMOVE_FROM_WISHLIST,
} from '../graphql/wishlist';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';
import { localWishlistUtils, LocalWishlistItem } from '../utils/localWishlist';
import { GET_PRODUCT } from '../graphql/products';

type WishlistContextType = {
  items: any[];
  add: (vars: {
    productId: string;
    selectedSize?: string;
    selectedColor?: string;
  }) => Promise<void>;
  remove: (vars: {
    productId: string;
    selectedSize?: string;
    selectedColor?: string;
  }) => Promise<void>;
  refetch: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isUserAuthenticated } = useAuth();
  const { showToast } = useToast();
  const client = useApolloClient();

  const [items, setItems] = useState<any[]>([]);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  const { data, refetch } = useQuery(LIST_WISHLIST, {
    fetchPolicy: 'cache-and-network',
    skip: !isUserAuthenticated,
  });
  const [addMutation] = useMutation(ADD_TO_WISHLIST);
  const [removeMutation] = useMutation(REMOVE_FROM_WISHLIST);

  const loadLocalWishlist = useCallback(() => {
    const localItems = localWishlistUtils.getItems();
    setItems(localItems);
  }, []);

  const syncLocalWishlistToServer = useCallback(async () => {
    if (!isUserAuthenticated) return;

    const localItems = localWishlistUtils.getItems();
    if (localItems.length === 0) return;

    try {
      for (const item of localItems) {
        await addMutation({
          variables: {
            productId: item.productId,
            selectedSize: item.selectedSize || undefined,
            selectedColor: item.selectedColor || undefined,
          },
        });
      }
      localWishlistUtils.clear();
      const { data: refreshed } = await refetch();
      setItems(refreshed?.listWishlist ?? []);
    } catch (error) {
      console.error('Error syncing wishlist:', error);
      showToast('Failed to sync wishlist items', 'error');
    }
  }, [addMutation, isUserAuthenticated, refetch, showToast]);

  useEffect(() => {
    if (isUserAuthenticated) {
      setItems(data?.listWishlist ?? []);
      return;
    }
    loadLocalWishlist();
  }, [data?.listWishlist, isUserAuthenticated, loadLocalWishlist]);

  useEffect(() => {
    if (!isUserAuthenticated) {
      setInitialSyncDone(false);
      return;
    }
    if (!initialSyncDone) {
      setInitialSyncDone(true);
      void syncLocalWishlistToServer();
    }
  }, [initialSyncDone, isUserAuthenticated, syncLocalWishlistToServer]);

  const add = useCallback(
    async (vars: {
      productId: string;
      selectedSize?: string;
      selectedColor?: string;
    }) => {
      if (isUserAuthenticated) {
        try {
          await addMutation({
            variables: vars,
            refetchQueries: [{ query: LIST_WISHLIST }],
          });
          const { data: refreshed } = await refetch();
          setItems(refreshed?.listWishlist ?? []);
        } catch (error) {
          showToast('Unable to update wishlist', 'error');
          throw error;
        }
        return;
      }

      try {
        const existing = localWishlistUtils
          .getItems()
          .find((item) => item.productId === vars.productId);
        if (existing) {
          // Already present; nothing else to do
          return;
        }

        const { data: productData } = await client.query({
          query: GET_PRODUCT,
          variables: { id: vars.productId },
          fetchPolicy: 'cache-first',
        });

        const product = productData?.getProduct;
        if (!product) {
          showToast('Product not found', 'error');
          return;
        }

        const localItem: LocalWishlistItem = {
          _id: product._id,
          productId: product._id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          salePrice: product.salePrice ?? null,
          stockQuantity: (product as any)?.stockQuantity ?? null,
          images: product.images ?? [],
          selectedColor: vars.selectedColor ?? null,
          selectedSize: vars.selectedSize ?? null,
        };

        localWishlistUtils.add(localItem);
        loadLocalWishlist();
      } catch (error) {
        console.error('Error updating local wishlist:', error);
        showToast('Unable to update wishlist', 'error');
        throw error;
      }
    },
    [
      addMutation,
      client,
      isUserAuthenticated,
      loadLocalWishlist,
      refetch,
      showToast,
    ],
  );

  const remove = useCallback(
    async (vars: {
      productId: string;
      selectedSize?: string;
      selectedColor?: string;
    }) => {
      if (isUserAuthenticated) {
        try {
          await removeMutation({
            variables: vars,
            refetchQueries: [{ query: LIST_WISHLIST }],
          });
          const { data: refreshed } = await refetch();
          setItems(refreshed?.listWishlist ?? []);
        } catch (error) {
          console.error('Error removing wishlist item:', error);
          showToast('Unable to update wishlist', 'error');
          throw error;
        }
        return;
      }

      localWishlistUtils.remove(vars.productId);
      loadLocalWishlist();
    },
    [
      isUserAuthenticated,
      loadLocalWishlist,
      refetch,
      removeMutation,
      showToast,
    ],
  );

  const handleRefetch = useCallback(async () => {
    if (isUserAuthenticated) {
      const { data: refreshed } = await refetch();
      setItems(refreshed?.listWishlist ?? []);
    } else {
      loadLocalWishlist();
    }
  }, [isUserAuthenticated, loadLocalWishlist, refetch]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        add,
        remove,
        refetch: handleRefetch,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
