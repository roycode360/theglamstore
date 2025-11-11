import { useLazyQuery, useMutation } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LIST_PRODUCTS_PAGE } from '../../../graphql/products';
import { VALIDATE_COUPON } from '../../../graphql/coupons';
import { EDIT_ORDER_ITEMS, UPDATE_ADMIN_ORDER } from '../../../graphql/orders';
import { getAnalyticsRefetches } from '../../../graphql/refetches';
import { EditableOrderItem, ProductSearchResult } from './types';

type UseOrderDetailStateOptions = {
  showToast: (
    message: string,
    variant: 'success' | 'error' | 'warning' | 'info',
    options?: { title?: string },
  ) => void;
  fetchOrderById: (orderId: string) => Promise<unknown>;
};

type CustomerDraftState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
};

type PricingDraftState = {
  couponCode: string;
  couponDiscount: string;
  shippingFee: string;
  amountPaid: string;
  amountRefunded: string;
  paymentReference: string;
  transferProofUrl: string;
};

type OrderLike = {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  items?: Array<Record<string, unknown>>;
  couponCode?: string | null;
  couponDiscount?: number | null;
  shippingFee?: number | null;
  amountPaid?: number | null;
  amountRefunded?: number | null;
  paymentReference?: string | null;
  transferProofUrl?: string | null;
  notes?: string | null;
};

export function useOrderDetailState({
  showToast,
  fetchOrderById,
}: UseOrderDetailStateOptions) {
  const [itemsDraft, setItemsDraft] = useState<EditableOrderItem[]>([]);
  const [customerDraft, setCustomerDraft] = useState<CustomerDraftState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
  });
  const [pricingDraft, setPricingDraft] = useState<PricingDraftState>({
    couponCode: '',
    couponDiscount: '',
    shippingFee: '',
    amountPaid: '',
    amountRefunded: '',
    paymentReference: '',
    transferProofUrl: '',
  });
  const [notesDraft, setNotesDraft] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const productSearchTimer = useRef<number | undefined>(undefined);
  const originalOrderRef = useRef<OrderLike | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingEnabled, setEditingEnabled] = useState(false);

  const [
    searchProducts,
    { data: productSearchData, loading: productSearchLoading },
  ] = useLazyQuery(LIST_PRODUCTS_PAGE, {
    fetchPolicy: 'network-only',
  });

  const [validateCouponQuery, { loading: validatingCoupon }] = useLazyQuery(
    VALIDATE_COUPON,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        const result = data?.validateCoupon;
        if (!result) return;
        if (result.valid) {
          setPricingDraft((prev) => ({
            ...prev,
            couponCode: result.code ?? prev.couponCode,
            couponDiscount:
              result.discountAmount != null
                ? String(result.discountAmount)
                : prev.couponDiscount,
          }));
          showToast('Coupon applied to order preview.', 'success', {
            title: 'Coupon validated',
          });
        } else {
          showToast(
            result.message || 'Coupon invalid for this order.',
            'error',
          );
        }
      },
      onError: (error) => {
        showToast(error.message, 'error', { title: 'Coupon check failed' });
      },
    },
  );

  const [editOrderItemsMutation, { loading: editingItems }] = useMutation(
    EDIT_ORDER_ITEMS,
    {
      refetchQueries: getAnalyticsRefetches,
      awaitRefetchQueries: true,
    },
  );
  const [updateAdminOrderMutation, { loading: updatingOrderDetails }] =
    useMutation(UPDATE_ADMIN_ORDER, {
      refetchQueries: getAnalyticsRefetches,
      awaitRefetchQueries: true,
    });

  useEffect(() => {
    if (!productSearchTerm.trim()) {
      return;
    }
    if (productSearchTimer.current) {
      window.clearTimeout(productSearchTimer.current);
    }
    productSearchTimer.current = window.setTimeout(() => {
      searchProducts({
        variables: {
          page: 1,
          pageSize: 10,
          search: productSearchTerm.trim(),
        },
      }).catch(() => undefined);
    }, 250) as unknown as number;

    return () => {
      if (productSearchTimer.current) {
        window.clearTimeout(productSearchTimer.current);
      }
    };
  }, [productSearchTerm, searchProducts]);

  const productResults: ProductSearchResult[] =
    (productSearchData?.listProductsPage?.items as
      | ProductSearchResult[]
      | undefined) ?? [];

  const getItemKey = useCallback(
    (item: {
      productId: string;
      selectedSize?: string | null;
      selectedColor?: string | null;
    }) =>
      `${item.productId}::${item.selectedSize ?? ''}::${item.selectedColor ?? ''}`,
    [],
  );

  const hydrateFromOrder = useCallback(
    (order: OrderLike) => {
      originalOrderRef.current = order;
      setCustomerDraft({
        firstName: order.firstName ?? '',
        lastName: order.lastName ?? '',
        email: order.email ?? '',
        phone: order.phone ?? '',
        address1: order.address1 ?? '',
        city: order.city ?? '',
        state: order.state ?? '',
      });

      const nextItems: EditableOrderItem[] = (order.items ?? []).map(
        (item: any) => ({
          productId: item.productId,
          name: item.name,
          price:
            item.price != null && !Number.isNaN(Number(item.price))
              ? Number(item.price)
              : null,
          quantity:
            item.quantity != null && !Number.isNaN(Number(item.quantity))
              ? Number(item.quantity)
              : null,
          selectedSize: item.selectedSize ?? null,
          selectedColor: item.selectedColor ?? null,
          image: item.image ?? null,
          sku: undefined,
          availableColors: null,
          availableSizes: null,
          maxQuantity: null,
          key: getItemKey(item),
        }),
      );
      setItemsDraft(nextItems);

      setPricingDraft({
        couponCode: order.couponCode ?? '',
        couponDiscount:
          order.couponDiscount != null ? String(order.couponDiscount) : '',
        shippingFee: order.shippingFee != null ? String(order.shippingFee) : '',
        amountPaid: order.amountPaid != null ? String(order.amountPaid) : '',
        amountRefunded:
          order.amountRefunded != null ? String(order.amountRefunded) : '',
        paymentReference: order.paymentReference ?? '',
        transferProofUrl: order.transferProofUrl ?? '',
      });
      setNotesDraft(order.notes ?? '');
      setEditingEnabled(false);
    },
    [getItemKey],
  );

  const buildItemOperations = useCallback(() => {
    const original = originalOrderRef.current;
    if (!original) return [] as Array<Record<string, any>>;

    const originalMap = new Map<string, EditableOrderItem>();
    (original.items ?? []).forEach((item: any) => {
      const mapped: EditableOrderItem = {
        productId: item.productId,
        name: item.name,
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 0) || 0,
        selectedSize: item.selectedSize ?? null,
        selectedColor: item.selectedColor ?? null,
        image: item.image ?? null,
        sku: undefined,
        availableColors: null,
        availableSizes: null,
        maxQuantity: null,
        key: getItemKey(item),
      };
      originalMap.set(mapped.key, mapped);
    });

    const currentMap = new Map<string, EditableOrderItem>();
    itemsDraft.forEach((item) => {
      if (!item.productId) {
        return;
      }
      currentMap.set(item.key, item);
    });

    const operations: Array<Record<string, any>> = [];

    for (const [key, originalItem] of originalMap.entries()) {
      const current = currentMap.get(key);
      if (!current || (current.quantity ?? 0) <= 0) {
        operations.push({
          op: 'REMOVE',
          productId: originalItem.productId,
          selectedSize: originalItem.selectedSize ?? undefined,
          selectedColor: originalItem.selectedColor ?? undefined,
        });
      }
    }

    for (const [key, current] of currentMap.entries()) {
      const originalItem = originalMap.get(key);
      const payload = {
        productId: current.productId,
        name: current.name,
        price: Number(current.price ?? 0),
        quantity: Number(current.quantity ?? 0) || 0,
        selectedSize: current.selectedSize ?? undefined,
        selectedColor: current.selectedColor ?? undefined,
        image: current.image ?? undefined,
      };
      if (!originalItem) {
        operations.push({
          op: 'ADD',
          ...payload,
        });
      } else {
        const priceChanged = Number(originalItem.price ?? 0) !== payload.price;
        const qtyChanged =
          Number(originalItem.quantity ?? 0) !== payload.quantity;
        const sizeChanged =
          (originalItem.selectedSize ?? null) !==
          (current.selectedSize ?? null);
        const colorChanged =
          (originalItem.selectedColor ?? null) !==
          (current.selectedColor ?? null);
        const nameChanged = (originalItem.name ?? '') !== (current.name ?? '');
        const imageChanged =
          (originalItem.image ?? '') !== (current.image ?? '');
        if (
          priceChanged ||
          qtyChanged ||
          sizeChanged ||
          colorChanged ||
          nameChanged ||
          imageChanged
        ) {
          operations.push({
            op: 'UPDATE',
            ...payload,
          });
        }
      }
    }

    return operations;
  }, [itemsDraft, getItemKey]);

  const buildUpdatePayload = useCallback(() => {
    const original = originalOrderRef.current;
    if (!original) return null;
    const payload: Record<string, any> = { id: original._id };

    const normalizeString = (value: string) => value.trim();
    const normalizeOptional = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const stringFields: Array<[keyof CustomerDraftState, string]> = [
      ['firstName', 'firstName'],
      ['lastName', 'lastName'],
      ['email', 'email'],
      ['phone', 'phone'],
      ['address1', 'address1'],
      ['city', 'city'],
      ['state', 'state'],
    ];

    stringFields.forEach(([draftKey, originalKey]) => {
      const currentValue = normalizeString(
        (customerDraft as Record<string, string>)[draftKey] || '',
      );
      const rawOriginal = (original as Record<string, unknown>)[originalKey];
      const originalValue = normalizeString(
        typeof rawOriginal === 'string'
          ? rawOriginal
          : rawOriginal
            ? String(rawOriginal)
            : '',
      );
      if (currentValue !== originalValue) {
        payload[originalKey] = currentValue;
      }
    });

    const couponCodeCurrent = normalizeString(pricingDraft.couponCode || '');
    const couponCodeOriginal = normalizeString(original.couponCode || '');
    if (couponCodeCurrent !== couponCodeOriginal) {
      payload.couponCode = couponCodeCurrent || null;
    }

    const couponDiscountCurrent = Number(pricingDraft.couponDiscount || 0);
    const couponDiscountOriginal = Number(original.couponDiscount || 0);
    if (couponDiscountCurrent !== couponDiscountOriginal) {
      payload.couponDiscount = Math.max(0, couponDiscountCurrent);
    }

    const shippingFeeCurrent = Number(pricingDraft.shippingFee || 0);
    const shippingFeeOriginal = Number(original.shippingFee || 0);
    if (shippingFeeCurrent !== shippingFeeOriginal) {
      payload.shippingFee = Math.max(0, shippingFeeCurrent);
    }

    const amountPaidCurrent = Number(pricingDraft.amountPaid || 0);
    const amountPaidOriginal = Number(original.amountPaid || 0);
    if (amountPaidCurrent !== amountPaidOriginal) {
      payload.amountPaid = Math.max(0, amountPaidCurrent);
    }

    const amountRefundedCurrent = Number(pricingDraft.amountRefunded || 0);
    const amountRefundedOriginal = Number(original.amountRefunded || 0);
    if (amountRefundedCurrent !== amountRefundedOriginal) {
      payload.amountRefunded = Math.max(0, amountRefundedCurrent);
    }

    const paymentReferenceCurrent = normalizeOptional(
      pricingDraft.paymentReference || '',
    );
    const paymentReferenceOriginal =
      typeof original.paymentReference === 'string'
        ? normalizeOptional(original.paymentReference)
        : (original.paymentReference ?? null);
    if (paymentReferenceCurrent !== paymentReferenceOriginal) {
      payload.paymentReference = paymentReferenceCurrent;
    }

    const transferProofCurrent = normalizeOptional(
      pricingDraft.transferProofUrl || '',
    );
    const transferProofOriginal =
      typeof original.transferProofUrl === 'string'
        ? normalizeOptional(original.transferProofUrl)
        : (original.transferProofUrl ?? null);
    if (transferProofCurrent !== transferProofOriginal) {
      payload.transferProofUrl = transferProofCurrent;
    }

    const notesCurrent = normalizeOptional(notesDraft || '');
    const notesOriginal =
      typeof original.notes === 'string'
        ? normalizeOptional(original.notes)
        : (original.notes ?? null);
    if (notesCurrent !== notesOriginal) {
      payload.notes = notesCurrent;
    }

    return Object.keys(payload).length > 1 ? payload : null;
  }, [customerDraft, notesDraft, pricingDraft]);

  const subtotal = useMemo(
    () =>
      itemsDraft.reduce(
        (sum, item) =>
          sum +
          (Number(item.price ?? 0) || 0) * (Number(item.quantity ?? 0) || 0),
        0,
      ),
    [itemsDraft],
  );

  const discountAmount = useMemo(() => {
    const value = Number(pricingDraft.couponDiscount || 0);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.min(value, subtotal);
  }, [pricingDraft.couponDiscount, subtotal]);

  const shippingFeeValue = useMemo(() => {
    const value = Number(pricingDraft.shippingFee || 0);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return value;
  }, [pricingDraft.shippingFee]);

  const amountPaidValue = useMemo(() => {
    const value = Number(pricingDraft.amountPaid || 0);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return value;
  }, [pricingDraft.amountPaid]);

  const amountRefundedValue = useMemo(() => {
    const value = Number(pricingDraft.amountRefunded || 0);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return value;
  }, [pricingDraft.amountRefunded]);

  const computedTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount + shippingFeeValue),
    [subtotal, discountAmount, shippingFeeValue],
  );

  const balanceDuePreview = useMemo(
    () => Math.max(0, computedTotal - amountPaidValue + amountRefundedValue),
    [computedTotal, amountPaidValue, amountRefundedValue],
  );

  const itemOperations = useMemo(
    () => buildItemOperations(),
    [buildItemOperations],
  );

  const updatePayloadPreview = useMemo(
    () => buildUpdatePayload(),
    [buildUpdatePayload],
  );

  const hasItemChanges = itemOperations.length > 0;
  const hasDetailChanges = !!updatePayloadPreview;
  const isDirty = hasItemChanges || hasDetailChanges;
  const actionBusy = saving || editingItems || updatingOrderDetails;

  const handleCustomerFieldChange = (
    field: keyof CustomerDraftState,
    value: string,
  ) => {
    setCustomerDraft((prev) => ({ ...prev, [field]: value }));
    setEditingEnabled(true);
  };

  const handlePricingNumberChange = (
    field: 'couponDiscount' | 'shippingFee' | 'amountPaid' | 'amountRefunded',
    value: string,
  ) => {
    const sanitized = value.replace(/[^\d.]/g, '');
    setPricingDraft((prev) => ({
      ...prev,
      [field]: sanitized,
    }));
    setEditingEnabled(true);
  };

  const handleCouponCodeChange = (value: string) => {
    setPricingDraft((prev) => ({ ...prev, couponCode: value }));
    setEditingEnabled(true);
  };

  const handlePaymentReferenceChange = (value: string) => {
    setPricingDraft((prev) => ({ ...prev, paymentReference: value }));
    setEditingEnabled(true);
  };

  const handleTransferProofChange = (value: string) => {
    setPricingDraft((prev) => ({ ...prev, transferProofUrl: value }));
    setEditingEnabled(true);
  };

  const updateItemDraft = (
    index: number,
    patch: Partial<EditableOrderItem>,
  ) => {
    setItemsDraft((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const next = { ...item, ...patch };
        return { ...next, key: getItemKey(next) };
      }),
    );
    setEditingEnabled(true);
  };

  const handleItemQuantityChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    if (sanitized.length === 0) {
      updateItemDraft(index, { quantity: null });
      setEditingEnabled(true);
      return;
    }
    let numeric = Number(sanitized);
    if (Number.isNaN(numeric)) {
      updateItemDraft(index, { quantity: null });
      setEditingEnabled(true);
      return;
    }
    const max = itemsDraft[index]?.maxQuantity ?? null;
    if (max != null) {
      numeric = Math.min(numeric, max);
    }
    updateItemDraft(index, { quantity: numeric });
    setEditingEnabled(true);
  };

  const handleItemPriceChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^\d.]/g, '');
    if (sanitized.length === 0) {
      updateItemDraft(index, { price: null });
      setEditingEnabled(true);
      return;
    }
    const numeric = Number(sanitized);
    if (Number.isNaN(numeric) || numeric < 0) {
      updateItemDraft(index, { price: null });
      setEditingEnabled(true);
      return;
    }
    updateItemDraft(index, { price: numeric });
    setEditingEnabled(true);
  };

  const handleItemOptionChange = (
    index: number,
    field: 'selectedSize' | 'selectedColor',
    value: string,
  ) => {
    updateItemDraft(index, {
      [field]: value ? value : null,
    } as Partial<EditableOrderItem>);
  };

  const handleRemoveItem = (index: number) => {
    setItemsDraft((prev) => prev.filter((_, idx) => idx !== index));
    setEditingEnabled(true);
  };

  const handleAddProduct = (product: ProductSearchResult) => {
    const defaultSize = product.sizes?.[0] ?? null;
    const defaultColor = product.colors?.[0] ?? null;
    const newItem: EditableOrderItem = {
      productId: product._id,
      name: product.name,
      price: Number(product.salePrice ?? product.price ?? 0),
      quantity: 1,
      selectedSize: defaultSize,
      selectedColor: defaultColor,
      image: product.images?.[0] ?? null,
      sku: product.sku ?? undefined,
      availableColors: product.colors ?? null,
      availableSizes: product.sizes ?? null,
      maxQuantity:
        typeof product.stockQuantity === 'number'
          ? Math.max(0, product.stockQuantity)
          : null,
      key: '',
    };
    newItem.key = getItemKey(newItem);

    setItemsDraft((prev) => {
      const existingIndex = prev.findIndex((item) => item.key === newItem.key);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const max = existing.maxQuantity ?? null;
        const currentQty = Number(existing.quantity ?? 0);
        const nextQuantity =
          max != null ? Math.min(currentQty + 1, max) : currentQty + 1;
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: nextQuantity,
        };
        return updated;
      }
      return [...prev, newItem];
    });

    if ((product.stockQuantity ?? 0) === 0) {
      showToast('Item added but currently out of stock.', 'warning', {
        title: 'Out of stock',
      });
    } else {
      showToast('Item added to order.', 'success');
    }
    setEditingEnabled(true);
  };

  const handleNotesChange = (value: string) => {
    setNotesDraft(value);
    setEditingEnabled(true);
  };

  const resetChanges = useCallback(
    (options?: { silent?: boolean }) => {
      const original = originalOrderRef.current;
      if (!original) return;
      hydrateFromOrder(original);
      setProductSearchTerm('');
      setEditingEnabled(false);
      if (!options?.silent) {
        showToast('Changes reset to order values.', 'info');
      }
    },
    [hydrateFromOrder, showToast],
  );

  const handleValidateCoupon = () => {
    if (!pricingDraft.couponCode.trim()) {
      showToast('Enter a coupon code before validating.', 'error');
      return;
    }
    if (subtotal <= 0) {
      showToast('Add items to the order before applying a coupon.', 'error');
      return;
    }
    validateCouponQuery({
      variables: {
        code: pricingDraft.couponCode.trim(),
        orderAmount: subtotal,
      },
    });
  };

  const saveChanges = async (orderId: string | null) => {
    if (!orderId) return;
    const operations = buildItemOperations();
    const updatePayload = buildUpdatePayload();
    if (operations.length === 0 && !updatePayload) {
      showToast('No changes to save.', 'info');
      return;
    }

    try {
      setSaving(true);
      if (operations.length > 0) {
        await editOrderItemsMutation({
          variables: {
            input: {
              orderId,
              operations,
              note: notesDraft?.trim()
                ? `Item update: ${notesDraft.trim().slice(0, 120)}`
                : undefined,
            },
          },
        });
      }
      if (updatePayload) {
        await updateAdminOrderMutation({
          variables: {
            input: updatePayload,
          },
        });
      }
      await fetchOrderById(orderId);
      showToast('Order updated successfully.', 'success');
      setEditingEnabled(false);
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to update order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    customerDraft,
    pricingDraft,
    notesDraft,
    itemsDraft,
    productResults,
    productSearchTerm,
    productSearchLoading,
    setProductSearchTerm,
    subtotal,
    discountAmount,
    shippingFeeValue,
    amountPaidValue,
    amountRefundedValue,
    computedTotal,
    balanceDuePreview,
    validatingCoupon,
    isDirty,
    actionBusy,
    editingEnabled,
    setEditingEnabled,
    hydrateFromOrder,
    resetChanges,
    saveChanges,
    handleAddProduct,
    handleRemoveItem,
    handleItemQuantityChange,
    handleItemPriceChange,
    handleItemOptionChange,
    handleCustomerFieldChange,
    handleProductSearchTermChange: setProductSearchTerm,
    handlePricingNumberChange,
    handleCouponCodeChange,
    handlePaymentReferenceChange,
    handleTransferProofChange,
    handleValidateCoupon,
    handleNotesChange,
  };
}
