export interface TCartItem {
  _id: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    _id: string;
    name: string;
    brand: string;
    price: number;
    salePrice?: number;
    stockQuantity?: number;
    images: string[];
    description?: string;
  };
}

export interface TProduct {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  salePrice?: number;
  sku: string;
  stockQuantity: number;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
