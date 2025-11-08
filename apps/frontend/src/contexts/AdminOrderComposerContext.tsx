import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type AdminOrderCustomer = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
};

export type AdminOrderItemDraft = {
  productId: string;
  name?: string;
  price?: number;
  quantity?: number;
  selectedSize?: string;
  selectedColor?: string;
  image?: string;
  sku?: string;
  availableSizes?: string[];
  availableColors?: string[];
  maxQuantity?: number | null;
};

export type AdminOrderPricing = {
  shippingFee?: number;
  discountAmount?: number;
  discountCode?: string;
  amountPaid?: number;
  paymentReference?: string;
  paymentProofUrl?: string;
};

export type AdminOrderComposerState = {
  customer: AdminOrderCustomer;
  items: AdminOrderItemDraft[];
  pricing: AdminOrderPricing;
  notes?: string;
};

type AdminOrderComposerContextValue = {
  draft: AdminOrderComposerState;
  setCustomer: (customer: Partial<AdminOrderCustomer>) => void;
  setItems: (items: AdminOrderItemDraft[]) => void;
  setPricing: (pricing: Partial<AdminOrderPricing>) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
};

function createDefaultCustomer(): AdminOrderCustomer {
  return {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
  };
}

function createDefaultState(): AdminOrderComposerState {
  return {
    customer: createDefaultCustomer(),
    items: [],
    pricing: {
      shippingFee: undefined,
      discountAmount: undefined,
      discountCode: '',
      amountPaid: undefined,
      paymentReference: '',
      paymentProofUrl: '',
    },
    notes: '',
  };
}

const AdminOrderComposerContext = createContext<
  AdminOrderComposerContextValue | undefined
>(undefined);

export function AdminOrderComposerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] =
    useState<AdminOrderComposerState>(createDefaultState);

  const setCustomer = useCallback((customer: Partial<AdminOrderCustomer>) => {
    setDraft((prev) => {
      const nextCustomer = {
        ...prev.customer,
        ...customer,
      };
      return {
        ...prev,
        customer: nextCustomer,
      };
    });
  }, []);

  const setItems = useCallback((items: AdminOrderItemDraft[]) => {
    setDraft((prev) => ({
      ...prev,
      items,
    }));
  }, []);

  const setPricing = useCallback((pricing: Partial<AdminOrderPricing>) => {
    setDraft((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        ...pricing,
      },
    }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setDraft((prev) => ({
      ...prev,
      notes,
    }));
  }, []);

  const reset = useCallback(() => {
    setDraft(createDefaultState());
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setCustomer,
      setItems,
      setPricing,
      setNotes,
      reset,
    }),
    [draft, reset, setCustomer, setItems, setPricing, setNotes],
  );

  return (
    <AdminOrderComposerContext.Provider value={value}>
      {children}
    </AdminOrderComposerContext.Provider>
  );
}

export function useAdminOrderComposer(): AdminOrderComposerContextValue {
  const context = useContext(AdminOrderComposerContext);
  if (!context) {
    throw new Error(
      'useAdminOrderComposer must be used within AdminOrderComposerProvider',
    );
  }
  return context;
}
