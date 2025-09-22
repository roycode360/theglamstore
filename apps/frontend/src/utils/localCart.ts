import { TCartItem } from '../types';

const LOCAL_CART_KEY = 'theglamstore_cart';

export interface LocalCartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  product: {
    _id: string;
    name: string;
    brand?: string;
    price: number;
    salePrice?: number;
    images: string[];
  };
}

export const localCartUtils = {
  getCartItems(): LocalCartItem[] {
    try {
      const cartData = localStorage.getItem(LOCAL_CART_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  },

  setCartItems(items: LocalCartItem[]): void {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  },

  addToCart(item: LocalCartItem): void {
    const items = this.getCartItems();
    const existingIndex = items.findIndex(
      (i) =>
        i.productId === item.productId &&
        i.selectedSize === item.selectedSize &&
        i.selectedColor === item.selectedColor,
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    this.setCartItems(items);
  },

  updateCartItem(itemId: string, updates: Partial<LocalCartItem>): void {
    const items = this.getCartItems();
    const index = items.findIndex((i) => i.id === itemId);

    if (index >= 0) {
      items[index] = { ...items[index], ...updates };
      this.setCartItems(items);
    }
  },

  removeFromCart(itemId: string): void {
    const items = this.getCartItems();
    const filtered = items.filter((i) => i.id !== itemId);
    this.setCartItems(filtered);
  },

  clearCart(): void {
    localStorage.removeItem(LOCAL_CART_KEY);
  },

  getCartItemCount(): number {
    const items = this.getCartItems();
    return items.length; // Return number of unique items, not total quantity
  },

  // Convert local cart items to API format for syncing
  convertToApiFormat(items: LocalCartItem[]): Array<{
    productId: string;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
  }> {
    return items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    }));
  },

  // Convert API cart items to local format
  convertFromApiFormat(apiItems: TCartItem[]): LocalCartItem[] {
    return apiItems.map((item) => ({
      id: item._id,
      productId: item.product._id,
      quantity: item.quantity,
      selectedSize: item.selectedSize || '',
      selectedColor: item.selectedColor || '',
      product: {
        _id: item.product._id,
        name: item.product.name,
        brand: item.product.brand,
        price: item.product.price,
        salePrice: item.product.salePrice,
        images: item.product.images || [],
      },
    }));
  },
};
