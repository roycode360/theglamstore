export type LocalWishlistItem = {
  _id: string;
  productId: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  salePrice?: number | null;
  stockQuantity?: number | null;
  images: string[];
  selectedSize?: string | null;
  selectedColor?: string | null;
};

const LOCAL_WISHLIST_KEY = 'theglamstore_wishlist';

function read(): LocalWishlistItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Error reading wishlist from localStorage:', error);
    return [];
  }
}

function write(items: LocalWishlistItem[]) {
  try {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error writing wishlist to localStorage:', error);
  }
}

export const localWishlistUtils = {
  getItems(): LocalWishlistItem[] {
    return read();
  },

  add(item: LocalWishlistItem): void {
    const items = read();
    const exists = items.find((existing) => existing._id === item._id);
    if (exists) {
      return;
    }
    items.push(item);
    write(items);
  },

  remove(productId: string): void {
    const items = read().filter((item) => item._id !== productId);
    write(items);
  },

  clear(): void {
    try {
      localStorage.removeItem(LOCAL_WISHLIST_KEY);
    } catch (error) {
      console.error('Error clearing wishlist in localStorage:', error);
    }
  },
};
