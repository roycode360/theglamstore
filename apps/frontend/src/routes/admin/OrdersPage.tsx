import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import {
  GET_ORDER,
  LIST_ORDERS_PAGE,
  UPDATE_ORDER_STATUS,
  DELETE_ORDER,
  UPDATE_ADMIN_ORDER,
  EDIT_ORDER_ITEMS,
} from '../../graphql/orders';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { formatDate, formatDateOnly } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { getAnalyticsRefetches } from '../../graphql/refetches';
import Input from '../../components/ui/Input';
import { LIST_PRODUCTS_PAGE } from '../../graphql/products';
import { VALIDATE_COUPON } from '../../graphql/coupons';

type OrderListItem = {
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

type EditableOrderItem = {
  productId: string;
  name?: string | null;
  price: number;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  image?: string | null;
  sku?: string | null;
  availableSizes?: string[] | null;
  availableColors?: string[] | null;
  maxQuantity?: number | null;
  key: string;
};

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'awaiting_additional_payment', label: 'Awaiting Payment' },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [paymentFilter] = useState<string | undefined>(undefined);
  const [startDate] = useState<string | undefined>(undefined);
  const [endDate] = useState<string | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data, loading, refetch } = useQuery(LIST_ORDERS_PAGE, {
    variables: {
      page,
      pageSize,
      status: statusFilter || null,
      // removed filters
    },
    fetchPolicy: 'cache-and-network',
  });
  const orders: OrderListItem[] = data?.listOrdersPage?.items ?? [];
  const totalPages: number = data?.listOrdersPage?.totalPages ?? 1;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fetchOrder, { data: orderData, loading: orderLoading }] =
    useLazyQuery(GET_ORDER);
  const [updateStatus, { loading: updating }] = useMutation(
    UPDATE_ORDER_STATUS,
    {
      refetchQueries: getAnalyticsRefetches,
      awaitRefetchQueries: true,
    },
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteOrderMutation, { loading: deleting }] = useMutation(
    DELETE_ORDER,
    {
      refetchQueries: getAnalyticsRefetches,
      awaitRefetchQueries: true,
      update(cache, { data: delData }, { variables }) {
        if (!delData?.deleteOrder) return;
        try {
          cache.updateQuery(
            {
              query: LIST_ORDERS_PAGE,
              variables: {
                page,
                pageSize,
                status: statusFilter || null,
                paymentMethod: paymentFilter || null,
                startDate: startDate || null,
                endDate: endDate || null,
              },
            },
            (existing: any) => {
              if (!existing?.listOrdersPage?.items) return existing;
              return {
                ...existing,
                listOrdersPage: {
                  ...existing.listOrdersPage,
                  items: existing.listOrdersPage.items.filter(
                    (o: any) => o._id !== variables?.id,
                  ),
                },
              };
            },
          );
        } catch {}
      },
    },
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { showToast } = useToast();
  const [proofOpen, setProofOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const [itemsDraft, setItemsDraft] = useState<EditableOrderItem[]>([]);
  const [customerDraft, setCustomerDraft] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
  });
  const [pricingDraft, setPricingDraft] = useState({
    couponCode: '',
    couponDiscount: 0,
    shippingFee: 0,
    amountPaid: 0,
    amountRefunded: 0,
    paymentReference: '',
    transferProofUrl: '',
  });
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const productSearchTimer = useRef<number | undefined>(undefined);
  const originalOrderRef = useRef<any | null>(null);

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
            couponDiscount: Number(
              result.discountAmount ?? prev.couponDiscount,
            ),
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

  const productResults =
    productSearchData?.listProductsPage?.items ??
    ([] as Array<{
      _id: string;
      name: string;
      salePrice?: number | null;
      price?: number | null;
      stockQuantity?: number | null;
      images?: string[] | null;
      colors?: string[] | null;
      sizes?: string[] | null;
      sku?: string | null;
    }>);

  const selectedOrder = orderData?.getOrder ?? null;

  const getItemKey = (item: {
    productId: string;
    selectedSize?: string | null;
    selectedColor?: string | null;
  }) =>
    `${item.productId}::${item.selectedSize ?? ''}::${item.selectedColor ?? ''}`;

  const hydrateFromOrder = (order: any) => {
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
      }),
    );
    setItemsDraft(nextItems);

    setPricingDraft({
      couponCode: order.couponCode ?? '',
      couponDiscount: Number(order.couponDiscount ?? 0),
      shippingFee: Number(order.shippingFee ?? 0),
      amountPaid: Number(order.amountPaid ?? 0),
      amountRefunded: Number(order.amountRefunded ?? 0),
      paymentReference: order.paymentReference ?? '',
      transferProofUrl: order.transferProofUrl ?? '',
    });
    setNotesDraft(order.notes ?? '');
  };

  const buildItemOperations = () => {
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
  };

  const buildUpdatePayload = () => {
    const original = originalOrderRef.current;
    if (!original) return null;
    const payload: Record<string, any> = { id: original._id };

    const normalizeString = (value: string) => value.trim();
    const normalizeOptional = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const stringFields: Array<
      [keyof typeof customerDraft, keyof OrderListItem | string]
    > = [
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
      const originalValue = normalizeString(original[originalKey] || '');
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
  };

  // Open order details if id is present in query string
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedId(id);
      fetchOrder({ variables: { id } });
    }
  }, [searchParams]);

  // Auto-scroll to order details when a selection is present and data is ready
  useEffect(() => {
    if (selectedId && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedId, orderData]);

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

  useEffect(() => {
    const order = orderData?.getOrder;
    if (!order) return;
    hydrateFromOrder(order);
  }, [orderData?.getOrder]);

  const itemOperations = useMemo(
    () => buildItemOperations(),
    [itemsDraft, orderData?.getOrder],
  );
  const updatePayloadPreview = useMemo(
    () => buildUpdatePayload(),
    [customerDraft, pricingDraft, notesDraft, orderData?.getOrder],
  );
  const hasItemChanges = itemOperations.length > 0;
  const hasDetailChanges = !!updatePayloadPreview;
  const isDirty = hasItemChanges || hasDetailChanges;
  const actionBusy = saving || editingItems || updatingOrderDetails;

  const subtotal = useMemo(
    () =>
      itemsDraft.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
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
  };

  const handleItemQuantityChange = (index: number, value: string) => {
    const numeric = Math.max(0, Number(value) || 0);
    const max = itemsDraft[index]?.maxQuantity ?? null;
    const clamped = max != null ? Math.min(numeric, max) : numeric;
    updateItemDraft(index, { quantity: clamped });
  };

  const handleItemPriceChange = (index: number, value: string) => {
    const numeric = Math.max(0, Number(value) || 0);
    updateItemDraft(index, { price: numeric });
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
  };

  const handleAddProduct = (product: (typeof productResults)[number]) => {
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
        const nextQuantity =
          max != null
            ? Math.min(existing.quantity + 1, max)
            : existing.quantity + 1;
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
  };

  const handleCustomerFieldChange = (
    field: keyof typeof customerDraft,
    value: string,
  ) => {
    setCustomerDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handlePricingNumberChange = (
    field: 'couponDiscount' | 'shippingFee' | 'amountPaid' | 'amountRefunded',
    value: string,
  ) => {
    const numeric = Number(value);
    setPricingDraft((prev) => ({
      ...prev,
      [field]: Number.isFinite(numeric) ? numeric : 0,
    }));
  };

  const handleCouponCodeChange = (value: string) => {
    setPricingDraft((prev) => ({
      ...prev,
      couponCode: value,
    }));
  };

  const handlePaymentReferenceChange = (value: string) => {
    setPricingDraft((prev) => ({ ...prev, paymentReference: value }));
  };

  const handleTransferProofChange = (value: string) => {
    setPricingDraft((prev) => ({ ...prev, transferProofUrl: value }));
  };

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

  const handleResetChanges = () => {
    const original = originalOrderRef.current;
    if (!original) return;
    hydrateFromOrder(original);
    setProductSearchTerm('');
    showToast('Changes reset to order values.', 'info');
  };

  const handleSaveChanges = async () => {
    if (!selectedId) return;
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
              orderId: selectedId,
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
      await fetchOrder({
        variables: { id: selectedId },
        fetchPolicy: 'network-only',
      });
      showToast('Order updated successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to update order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusClasses: Record<string, string> = {
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    confirmed: 'bg-blue-50 border-blue-200 text-blue-800',
    processing: 'bg-amber-50 border-amber-200 text-amber-800',
    shipped: 'bg-gray-50 border-gray-200 text-gray-800',
    delivered: 'bg-green-50 border-green-200 text-green-800',
    cancelled: 'bg-red-50 border-red-200 text-red-800',
    awaiting_additional_payment:
      'bg-orange-50 border-orange-200 text-orange-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-brand text-2xl font-semibold">Orders</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Track and fulfill customer orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/orders/new')}
            className="btn-primary h-9 rounded-md px-3 text-sm"
          >
            + New offline order
          </button>
          <button
            onClick={() => refetch()}
            className="btn-ghost h-9 rounded-md px-3 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-xs"
            style={{ color: 'rgb(var(--muted))' }}
          >
            Status
          </label>
          <Select
            value={statusFilter || ''}
            onChange={(v) => {
              setPage(1);
              setStatusFilter(v || undefined);
            }}
            options={[
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
              {
                value: 'awaiting_additional_payment',
                label: 'Awaiting Payment',
              },
            ]}
            buttonClassName="px-2 py-2 text-sm"
          />
        </div>
      </div>
      {loading ? (
        <div className="py-10">
          <Spinner label="Loading orders" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="theme-border overflow-visible rounded-md border">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr className="text-left">
                    <th className="px-4 py-3">Order No</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="theme-border divide-y">
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td className="px-4 py-3 font-mono text-xs">
                        {o.orderNumber || o._id}
                      </td>
                      <td className="px-4 py-3">
                        {o.firstName} {o.lastName}
                        <div
                          className="text-xs"
                          style={{ color: 'rgb(var(--muted))' }}
                        >
                          {o.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {o.paymentMethod?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <Select
                            value={o.status}
                            onChange={async (newStatus) => {
                              try {
                                setUpdatingId(o._id);
                                await updateStatus({
                                  variables: { id: o._id, status: newStatus },
                                  optimisticResponse: {
                                    updateOrderStatus: {
                                      __typename: 'Order',
                                      _id: o._id,
                                      status: newStatus,
                                      updatedAt: new Date().toISOString(),
                                    },
                                  },
                                  update(cache) {
                                    try {
                                      cache.updateQuery(
                                        {
                                          query: LIST_ORDERS_PAGE,
                                          variables: {
                                            page,
                                            pageSize,
                                            status: statusFilter || null,
                                          },
                                        },
                                        (existing: any) => {
                                          if (!existing?.listOrdersPage?.items)
                                            return existing;
                                          return {
                                            ...existing,
                                            listOrdersPage: {
                                              ...existing.listOrdersPage,
                                              items:
                                                existing.listOrdersPage.items.map(
                                                  (row: any) =>
                                                    row._id === o._id
                                                      ? {
                                                          ...row,
                                                          status: newStatus,
                                                        }
                                                      : row,
                                                ),
                                            },
                                          };
                                        },
                                      );
                                    } catch {}
                                  },
                                });
                                showToast('Order status updated', 'success');
                              } catch (err) {
                                showToast('Failed to update status', 'error');
                              } finally {
                                setUpdatingId(null);
                              }
                            }}
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'confirmed', label: 'Confirmed' },
                              { value: 'processing', label: 'Processing' },
                              { value: 'shipped', label: 'Shipped' },
                              { value: 'delivered', label: 'Delivered' },
                              { value: 'cancelled', label: 'Cancelled' },
                            ]}
                            disabled={updatingId === o._id}
                            buttonClassName={`${statusClasses[o.status] ?? 'theme-border text-brand-800 bg-yellow-50'} px-2 py-1 text-xs`}
                            className="min-w-[160px]"
                          />
                          {updatingId === o._id && (
                            <div className="absolute inset-y-0 right-2 flex items-center">
                              <span className="border-brand h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            className="theme-border h-8 w-20 rounded-md border text-xs"
                            onClick={() => {
                              setSelectedId(o._id);
                              fetchOrder({ variables: { id: o._id } });
                              const next = new URLSearchParams(searchParams);
                              next.set('id', o._id);
                              setSearchParams(next, { replace: true });
                            }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td
                        className="py-10 text-center text-sm"
                        colSpan={7}
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        No orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {orders.length === 0 ? (
              <div
                className="py-10 text-center text-sm"
                style={{ color: 'rgb(var(--muted))' }}
              >
                No orders
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div
                    key={o._id}
                    className="theme-border rounded-lg border p-4"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 font-mono text-xs text-gray-500">
                          Order No
                        </div>
                        <div className="truncate font-mono text-sm">
                          {o.orderNumber || o._id}
                        </div>
                      </div>
                      <div className="relative">
                        <Select
                          value={o.status}
                          onChange={async (newStatus) => {
                            try {
                              setUpdatingId(o._id);
                              await updateStatus({
                                variables: { id: o._id, status: newStatus },
                                optimisticResponse: {
                                  updateOrderStatus: {
                                    __typename: 'Order',
                                    _id: o._id,
                                    status: newStatus,
                                    updatedAt: new Date().toISOString(),
                                  },
                                },
                                update(cache) {
                                  try {
                                    cache.updateQuery(
                                      {
                                        query: LIST_ORDERS_PAGE,
                                        variables: {
                                          page,
                                          pageSize,
                                          status: statusFilter || null,
                                          paymentMethod: paymentFilter || null,
                                          startDate: startDate || null,
                                          endDate: endDate || null,
                                        },
                                      },
                                      (existing: any) => {
                                        if (!existing?.listOrdersPage?.items)
                                          return existing;
                                        return {
                                          ...existing,
                                          listOrdersPage: {
                                            ...existing.listOrdersPage,
                                            items:
                                              existing.listOrdersPage.items.map(
                                                (row: any) =>
                                                  row._id === o._id
                                                    ? {
                                                        ...row,
                                                        status: newStatus,
                                                      }
                                                    : row,
                                              ),
                                          },
                                        };
                                      },
                                    );
                                  } catch {}
                                },
                              });
                              showToast('Order status updated', 'success');
                            } catch (err) {
                              showToast('Failed to update status', 'error');
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'confirmed', label: 'Confirmed' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'shipped', label: 'Shipped' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'cancelled', label: 'Cancelled' },
                            {
                              value: 'awaiting_additional_payment',
                              label: 'Awaiting Payment',
                            },
                          ]}
                          disabled={updatingId === o._id}
                          buttonClassName={`${statusClasses[o.status] ?? 'theme-border text-brand-800 bg-yellow-50'} px-2 py-1 text-xs`}
                          className="min-w-[120px]"
                        />
                        {updatingId === o._id && (
                          <div className="absolute inset-y-0 right-2 flex items-center">
                            <span className="border-brand h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="mb-1 text-xs text-gray-500">Customer</div>
                      <div className="text-sm font-medium">
                        {o.firstName} {o.lastName}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        {o.email}
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="mb-1 text-xs text-gray-500">Total</div>
                        <div className="text-sm font-semibold">
                          {formatCurrency(o.total)}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          Payment
                        </div>
                        <div className="text-sm capitalize">
                          {o.paymentMethod?.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="mb-1 text-xs text-gray-500">Date</div>
                      <div className="text-sm">
                        {formatDateOnly(o.createdAt)}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        className="theme-border h-8 w-20 rounded-md border text-xs"
                        onClick={() => {
                          setSelectedId(o._id);
                          fetchOrder({ variables: { id: o._id } });
                          const next = new URLSearchParams(searchParams);
                          next.set('id', o._id);
                          setSearchParams(next, { replace: true });
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between p-3">
        <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-ghost h-9 rounded-md px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="btn-primary h-9 rounded-md px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {selectedId && (
        <div
          ref={detailsRef}
          className="theme-card theme-border rounded-lg border px-2 py-6"
        >
          {orderLoading ? (
            <div className="py-6">
              <Spinner label="Loading order details" />
            </div>
          ) : !selectedOrder ? (
            <div
              className="py-6 text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              No order found.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-gray-500">
                    {selectedOrder.orderNumber || selectedOrder._id}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Created {formatDate(selectedOrder.createdAt)}
                  </div>
                  {selectedOrder.updatedAt && (
                    <div
                      className="text-[11px]"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      Updated {formatDate(selectedOrder.updatedAt)}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="theme-border inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setConfirmOpen(true)}
                    disabled={actionBusy || deleting}
                  >
                    Delete order
                  </button>
                  <button
                    className="btn-ghost inline-flex h-9 items-center justify-center rounded-md px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleResetChanges}
                    disabled={!isDirty || actionBusy}
                  >
                    Reset
                  </button>
                  <button
                    className="btn-primary inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSaveChanges}
                    disabled={!isDirty || actionBusy}
                  >
                    {actionBusy ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                  <section className="rounded-lg border p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer & Shipping
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        First name
                        <Input
                          value={customerDraft.firstName}
                          onChange={(event) =>
                            handleCustomerFieldChange(
                              'firstName',
                              event.target.value,
                            )
                          }
                          placeholder="First name"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Last name
                        <Input
                          value={customerDraft.lastName}
                          onChange={(event) =>
                            handleCustomerFieldChange(
                              'lastName',
                              event.target.value,
                            )
                          }
                          placeholder="Last name"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Email
                        <Input
                          type="email"
                          value={customerDraft.email}
                          onChange={(event) =>
                            handleCustomerFieldChange(
                              'email',
                              event.target.value,
                            )
                          }
                          placeholder="Email address"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Phone
                        <Input
                          value={customerDraft.phone}
                          onChange={(event) =>
                            handleCustomerFieldChange(
                              'phone',
                              event.target.value,
                            )
                          }
                          placeholder="Phone number"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
                        Address
                        <Input
                          value={customerDraft.address1}
                          onChange={(event) =>
                            handleCustomerFieldChange(
                              'address1',
                              event.target.value,
                            )
                          }
                          placeholder="Street address"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        City
                        <Input
                          value={customerDraft.city}
                          onChange={(event) =>
                            handleCustomerFieldChange(
                              'city',
                              event.target.value,
                            )
                          }
                          placeholder="City"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        State
                        <Input
                          value={customerDraft.state}
                          onChange={(event) =>
                            handleCustomerFieldChange(
                              'state',
                              event.target.value,
                            )
                          }
                          placeholder="State"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-lg border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Order items
                      </div>
                      <Input
                        value={productSearchTerm}
                        onChange={(event) =>
                          setProductSearchTerm(event.target.value)
                        }
                        placeholder="Search products to add"
                        className="md:w-72"
                      />
                    </div>
                    {productSearchTerm.trim() ? (
                      <div className="rounded-lg border border-dashed bg-gray-50 p-3">
                        {productSearchLoading ? (
                          <div className="text-xs text-gray-500">
                            Searching products…
                          </div>
                        ) : productResults.length === 0 ? (
                          <div className="text-xs text-gray-500">
                            No products match “{productSearchTerm.trim()}”.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {productResults.map(
                              (product: (typeof productResults)[number]) => (
                                <button
                                  key={product._id}
                                  type="button"
                                  className="theme-border hover:bg-brand-50 flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm"
                                  onClick={() => handleAddProduct(product)}
                                >
                                  <div>
                                    <div className="font-medium">
                                      {product.name}
                                    </div>
                                    <div
                                      className="text-xs"
                                      style={{ color: 'rgb(var(--muted))' }}
                                    >
                                      {product.sku
                                        ? `SKU: ${product.sku}`
                                        : 'SKU: —'}{' '}
                                      · Stock: {product.stockQuantity ?? '—'}
                                    </div>
                                    {product.stockQuantity === 0 && (
                                      <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                        Out of stock
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm font-semibold">
                                    {formatCurrency(
                                      product.salePrice ?? product.price ?? 0,
                                    )}
                                  </div>
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {itemsDraft.length === 0 ? (
                      <div
                        className="py-6 text-center text-sm"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        No items in this order yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {itemsDraft.map((item, index) => (
                          <div
                            key={`${item.key}-${index}`}
                            className="rounded-lg border border-dashed p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-semibold">
                                  {item.name || 'Untitled product'}
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: 'rgb(var(--muted))' }}
                                >
                                  ID: {item.productId}
                                </div>
                                {item.sku && (
                                  <div className="text-[11px] text-gray-400">
                                    SKU: {item.sku}
                                  </div>
                                )}
                                {item.maxQuantity != null && (
                                  <div className="text-[11px] text-gray-400">
                                    In stock: {item.maxQuantity}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                className="text-xs text-red-600 underline"
                                onClick={() => handleRemoveItem(index)}
                              >
                                Remove
                              </button>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-4">
                              <label className="flex flex-col gap-1 text-xs font-medium">
                                Quantity
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    handleItemQuantityChange(
                                      index,
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-xs font-medium">
                                Unit price
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(event) =>
                                    handleItemPriceChange(
                                      index,
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>
                              {item.availableSizes?.length ? (
                                <label className="flex flex-col gap-1 text-xs font-medium">
                                  Size
                                  <select
                                    className="theme-border rounded-md border px-2 py-2 text-sm"
                                    value={item.selectedSize ?? ''}
                                    onChange={(event) =>
                                      handleItemOptionChange(
                                        index,
                                        'selectedSize',
                                        event.target.value,
                                      )
                                    }
                                  >
                                    {item.availableSizes.map((size) => (
                                      <option
                                        key={size ?? 'default'}
                                        value={size ?? ''}
                                      >
                                        {size || 'Default'}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : item.selectedSize ? (
                                <div className="text-xs text-gray-500">
                                  Size: {item.selectedSize}
                                </div>
                              ) : null}
                              {item.availableColors?.length ? (
                                <label className="flex flex-col gap-1 text-xs font-medium">
                                  Color
                                  <select
                                    className="theme-border rounded-md border px-2 py-2 text-sm"
                                    value={item.selectedColor ?? ''}
                                    onChange={(event) =>
                                      handleItemOptionChange(
                                        index,
                                        'selectedColor',
                                        event.target.value,
                                      )
                                    }
                                  >
                                    {item.availableColors.map((color) => (
                                      <option
                                        key={color ?? 'default'}
                                        value={color ?? ''}
                                      >
                                        {color || 'Default'}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : item.selectedColor ? (
                                <div className="text-xs text-gray-500">
                                  Color: {item.selectedColor}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 rounded-lg border p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Pricing & Payments
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Coupon code
                        <Input
                          value={pricingDraft.couponCode}
                          onChange={(event) =>
                            handleCouponCodeChange(event.target.value)
                          }
                          placeholder="e.g. SUMMER25"
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="button"
                          className="btn-secondary h-10 rounded-md px-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={handleValidateCoupon}
                          disabled={validatingCoupon || subtotal <= 0}
                        >
                          {validatingCoupon ? 'Checking…' : 'Validate coupon'}
                        </button>
                      </div>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Manual discount
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricingDraft.couponDiscount}
                          onChange={(event) =>
                            handlePricingNumberChange(
                              'couponDiscount',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Shipping fee
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricingDraft.shippingFee}
                          onChange={(event) =>
                            handlePricingNumberChange(
                              'shippingFee',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Amount paid
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricingDraft.amountPaid}
                          onChange={(event) =>
                            handlePricingNumberChange(
                              'amountPaid',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Amount refunded
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricingDraft.amountRefunded}
                          onChange={(event) =>
                            handlePricingNumberChange(
                              'amountRefunded',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
                        Payment reference
                        <Input
                          value={pricingDraft.paymentReference}
                          onChange={(event) =>
                            handlePaymentReferenceChange(event.target.value)
                          }
                          placeholder="Optional reference or receipt number"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
                        Transfer proof URL
                        <Input
                          value={pricingDraft.transferProofUrl}
                          onChange={(event) =>
                            handleTransferProofChange(event.target.value)
                          }
                          placeholder="https://…"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-lg border p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Notes
                    </div>
                    <textarea
                      value={notesDraft}
                      onChange={(event) => setNotesDraft(event.target.value)}
                      placeholder="Internal notes visible to admins."
                      className="theme-border h-28 w-full rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                  </section>
                </div>

                <aside className="space-y-4">
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order summary
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Discount</span>
                      <span className="font-medium text-emerald-600">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Shipping</span>
                      <span className="font-medium">
                        {formatCurrency(shippingFeeValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total</span>
                      <span className="text-base font-semibold">
                        {formatCurrency(computedTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Amount paid</span>
                      <span className="font-medium">
                        {formatCurrency(amountPaidValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Amount refunded</span>
                      <span className="font-medium">
                        {formatCurrency(amountRefundedValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Balance due</span>
                      <span
                        className={`font-medium ${
                          balanceDuePreview > 0
                            ? 'text-orange-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(balanceDuePreview)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status & metadata
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
                          statusClasses[selectedOrder.status] ??
                          'theme-border text-brand-800 bg-yellow-50'
                        }`}
                      >
                        {selectedOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      Payment: {selectedOrder.paymentMethod?.replace('_', ' ')}
                    </div>
                    {selectedOrder.transferProofUrl && (
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => {
                          setProofUrl(selectedOrder.transferProofUrl as string);
                          setProofOpen(true);
                        }}
                      >
                        View transfer proof
                      </button>
                    )}
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      )}
      <ConfirmModal
        open={confirmOpen}
        title="Delete this order?"
        message={<span>This action cannot be undone.</span>}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={async () => {
          if (!selectedId) return;
          try {
            await deleteOrderMutation({
              variables: { id: selectedId },
              optimisticResponse: { deleteOrder: true },
            });
            setSelectedId(null);
            showToast('Order deleted', 'success');
          } catch (err) {
            showToast('Failed to delete order', 'error');
          }
        }}
        onClose={() => setConfirmOpen(false)}
      />
      <Modal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        title="Transfer Proof"
        widthClassName="max-w-3xl"
      >
        {proofUrl ? (
          <div className="flex items-center justify-center">
            <img
              src={proofUrl}
              alt="Transfer proof"
              className="max-h-[70vh] w-auto rounded"
            />
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            No image to display.
          </div>
        )}
      </Modal>
    </div>
  );
}
