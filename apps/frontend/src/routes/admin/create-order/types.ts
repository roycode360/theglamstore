import {
  AdminOrderCustomer,
  AdminOrderItemDraft,
  AdminOrderPricing,
} from '../../../contexts/AdminOrderComposerContext';
import { ProductSearchResult } from '../orders/types';

export type StatusBanner = {
  kind: 'success' | 'info' | 'error';
  message: string;
} | null;

export type CustomerDraft = AdminOrderCustomer;
export type ItemDraft = AdminOrderItemDraft;
export type PricingDraft = AdminOrderPricing;

export type CreatedOrderInfo = {
  id: string;
  orderNumber?: string | null;
  total: number;
  amountPaid: number;
  email?: string | null;
};

export type { ProductSearchResult };

