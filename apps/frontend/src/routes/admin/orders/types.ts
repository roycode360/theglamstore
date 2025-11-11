export type OrderListItem = {
  _id: string;
  orderNumber?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
};

export type EditableOrderItem = {
  productId: string;
  name?: string | null;
  price: number | null;
  quantity: number | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
  image?: string | null;
  sku?: string | null;
  availableSizes?: string[] | null;
  availableColors?: string[] | null;
  maxQuantity?: number | null;
  key: string;
};

export type ProductSearchResult = {
  _id: string;
  name: string;
  salePrice?: number | null;
  price?: number | null;
  stockQuantity?: number | null;
  images?: string[] | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  sku?: string | null;
};

export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'awaiting_additional_payment', label: 'Awaiting Payment' },
] as const;
