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
  costPrice?: number;
  sku: string;
  stockQuantity?: number;
  description?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  reviewCount?: number;
  reviewAverage?: number | null;
}

export interface TReview {
  _id: string;
  customerName: string;
  customerAvatarUrl?: string | null;
  rating: number;
  message: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}
