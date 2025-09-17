import React, { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  ADD_TO_WISHLIST,
  LIST_WISHLIST,
  REMOVE_FROM_WISHLIST,
} from '../graphql/wishlist';

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
  refetch: () => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data, refetch } = useQuery(LIST_WISHLIST, {
    fetchPolicy: 'cache-and-network',
  });
  const [addMutation] = useMutation(ADD_TO_WISHLIST);
  const [removeMutation] = useMutation(REMOVE_FROM_WISHLIST);

  const add = async (vars: {
    productId: string;
    selectedSize?: string;
    selectedColor?: string;
  }) => {
    await addMutation({
      variables: vars,
      refetchQueries: [{ query: LIST_WISHLIST }],
    });
  };

  const remove = async (vars: {
    productId: string;
    selectedSize?: string;
    selectedColor?: string;
  }) => {
    await removeMutation({
      variables: vars,
      refetchQueries: [{ query: LIST_WISHLIST }],
    });
  };

  return (
    <WishlistContext.Provider
      value={{ items: data?.listWishlist ?? [], add, remove, refetch }}
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
