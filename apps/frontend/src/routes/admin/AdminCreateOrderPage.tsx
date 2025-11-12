import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GET_ORDER,
  LIST_ORDERS_PAGE,
  CREATE_ADMIN_ORDER,
} from '../../graphql/orders';
import { LIST_PRODUCTS_PAGE } from '../../graphql/products';
import {
  AdminOrderComposerProvider,
  useAdminOrderComposer,
} from '../../contexts/AdminOrderComposerContext';
import { useToast } from '../../components/ui/Toast';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { CustomerLookupCard } from './create-order/CustomerLookupCard';
import { CustomerInfoCard } from './create-order/CustomerInfoCard';
import { OrderItemsPanel } from './create-order/OrderItemsPanel';
import { OrderSummaryPanel } from './create-order/OrderSummaryPanel';
import { CreatedOrderSuccessCard } from './create-order/CreatedOrderSuccessCard';
import {
  CreatedOrderInfo,
  ProductSearchResult,
  StatusBanner,
} from './create-order/types';
import { LIST_DELIVERY_LOCATIONS } from '../../graphql/delivery';

function AdminCreateOrderPageInner() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { draft, setCustomer, setItems, setPricing, setNotes, reset } =
    useAdminOrderComposer();

  const [lookupEmail, setLookupEmail] = useState('');
  const [statusBanner, setStatusBanner] = useState<StatusBanner>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderInfo | null>(
    null,
  );

  const [searchOrders, { loading: searching }] = useLazyQuery(
    LIST_ORDERS_PAGE,
    {
      fetchPolicy: 'network-only',
    },
  );
  const [fetchOrder, { loading: loadingOrder }] = useLazyQuery(GET_ORDER, {
    fetchPolicy: 'network-only',
  });
  const [createAdminOrderMutation, { loading: creatingOrder }] =
    useMutation(CREATE_ADMIN_ORDER);
  const [searchProducts, { data: productData, loading: productSearching }] =
    useLazyQuery(LIST_PRODUCTS_PAGE, {
      fetchPolicy: 'network-only',
    });

  const productResults: ProductSearchResult[] =
    (productData?.listProductsPage?.items as
      | ProductSearchResult[]
      | undefined) ?? [];

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [amountPaidManuallySet, setAmountPaidManuallySet] = useState(false);
  const autoAmountPaidValueRef = useRef<number | null>(null);
  const lastProductSearchRef = useRef<string | null>(null);

  const { data: deliveryData, loading: deliveryLocationsLoading } = useQuery(
    LIST_DELIVERY_LOCATIONS,
    {
      fetchPolicy: 'cache-and-network',
    },
  );

  const deliveryLocations = useMemo(
    () =>
      (deliveryData?.listDeliveryLocations ?? []).filter(
        (location: any) => location.active,
      ),
    [deliveryData],
  );

  const defaultDeliveryLocation = useMemo(
    () => deliveryLocations.find((location: any) => location.isDefault) ?? null,
    [deliveryLocations],
  );

  const selectedDeliveryId = draft.pricing.deliveryLocationId ?? '';

  useEffect(() => {
    if (selectedDeliveryId || deliveryLocations.length === 0) {
      return;
    }
    const preferred = defaultDeliveryLocation ?? deliveryLocations[0] ?? null;
    if (!preferred) return;
    const fee = Number(preferred.price ?? 0) || 0;
    setPricing({
      deliveryLocationId: preferred._id,
      deliveryLocationName: preferred.name,
      deliveryFee: fee,
    });
  }, [
    selectedDeliveryId,
    deliveryLocations,
    defaultDeliveryLocation,
    setPricing,
  ]);

  const handleDeliveryLocationChange = (id: string) => {
    if (!id) {
      setPricing({
        deliveryLocationId: undefined,
        deliveryLocationName: undefined,
        deliveryFee: undefined,
      });
      return;
    }
    const location = deliveryLocations.find((loc: any) => loc._id === id);
    if (!location) return;
    const fee = Number(location.price ?? 0) || 0;
    setPricing({
      deliveryLocationId: location._id,
      deliveryLocationName: location.name,
      deliveryFee: fee,
    });
  };

  useEffect(() => {
    reset();
  }, [reset]);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = lookupEmail.trim().toLowerCase();
    if (!trimmed) {
      setStatusBanner({ kind: 'error', message: 'Enter an email to search.' });
      return;
    }
    try {
      setStatusBanner({
        kind: 'info',
        message: 'Searching existing orders...',
      });
      const { data } = await searchOrders({
        variables: {
          page: 1,
          pageSize: 1,
          email: trimmed,
        },
      });
      const first = data?.listOrdersPage?.items?.[0];

      if (!first) {
        setCustomer({
          email: trimmed,
        });
        setStatusBanner({
          kind: 'info',
          message: 'No existing orders found. Enter customer details below.',
        });
        return;
      }

      const { data: detail } = await fetchOrder({
        variables: { id: first._id },
      });
      const order = detail?.getOrder;

      setCustomer({
        email: trimmed,
        firstName: order?.firstName ?? first.firstName ?? '',
        lastName: order?.lastName ?? first.lastName ?? '',
        phone: order?.phone ?? '',
        address1: order?.address1 ?? '',
        city: order?.city ?? '',
        state: order?.state ?? '',
      });

      setStatusBanner({
        kind: 'success',
        message: 'Existing customer details loaded from latest order.',
      });
      showToast('Customer loaded', 'success');
    } catch (error: any) {
      showToast(error?.message ?? 'Lookup failed', 'error');
      setStatusBanner({
        kind: 'error',
        message: 'Failed to search existing orders.',
      });
    }
  };

  const handleCustomerFieldChange = (
    field: keyof typeof draft.customer,
    value: string,
  ) => {
    setCustomer({ [field]: value });
  };

  const isLoading = searching || loadingOrder;
  const productSearchLoading = productSearching;

  const canContinue = useMemo(() => {
    const customer = draft.customer;
    return (
      customer.firstName.trim().length > 0 &&
      customer.lastName.trim().length > 0 &&
      customer.email.trim().length > 0 &&
      (customer.address1 ?? '').trim().length > 0 &&
      (customer.city ?? '').trim().length > 0 &&
      (customer.state ?? '').trim().length > 0
    );
  }, [draft.customer]);

  const handleContinueToItems = () => {
    if (!canContinue) {
      showToast('Fill in required fields to continue.', 'error');
      return;
    }
    const anchor = document.getElementById('order-items-anchor');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      showToast('Items builder coming soon.', 'info');
    }
  };

  const handleAddProduct = (product: ProductSearchResult) => {
    const price =
      typeof product.salePrice === 'number' && product.salePrice > 0
        ? product.salePrice
        : (product.price ?? 0);

    const existingIndex = draft.items.findIndex(
      (item) => item.productId === product._id,
    );

    if (existingIndex >= 0) {
      const existing = draft.items[existingIndex];
      const max = product.stockQuantity ?? existing.maxQuantity ?? undefined;
      const nextQuantity = Math.min(
        max ?? Number.MAX_SAFE_INTEGER,
        (existing.quantity ?? 0) + 1,
      );
      const nextItems = draft.items.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: nextQuantity } : item,
      );
      setItems(nextItems);
      showToast('Quantity updated', 'success');
      return;
    }

    const nextItem = {
      productId: product._id,
      name: product.name,
      price,
      quantity: 1,
      selectedColor: product.colors?.[0],
      selectedSize: product.sizes?.[0],
      image: product.images?.[0],
      sku: product.sku ?? undefined,
      availableColors: product.colors ?? undefined,
      availableSizes: product.sizes ?? undefined,
      maxQuantity:
        typeof product.stockQuantity === 'number'
          ? Math.max(0, product.stockQuantity)
          : null,
    };

    setItems([...draft.items, nextItem]);
    if ((product.stockQuantity ?? 0) === 0) {
      showToast('Item added but currently out of stock.', 'warning', {
        title: 'Out of stock',
      });
    } else {
      showToast('Item added to order', 'success');
    }
  };

  const updateItemField = (
    index: number,
    patch: Partial<(typeof draft.items)[number]>,
  ) => {
    setItems(
      draft.items.map((item, idx) =>
        idx === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const handleItemQuantityChange = (index: number, value: string) => {
    const trimmed = value.trim();
    if (trimmed === '') {
      updateItemField(index, { quantity: undefined });
      return;
    }
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      return;
    }
    const base = Math.max(1, numeric);
    const item = draft.items[index];
    if (!item) return;
    const max = item.maxQuantity;
    const clamped = max != null && max > 0 ? Math.min(base, max) : base;
    updateItemField(index, { quantity: clamped });
  };

  const handleItemPriceChange = (index: number, value: string) => {
    const trimmed = value.trim();
    if (trimmed === '') {
      updateItemField(index, { price: undefined });
      return;
    }
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      return;
    }
    const clamped = Math.max(0, numeric);
    updateItemField(index, { price: clamped });
  };

  const handleItemOptionChange = (
    index: number,
    field: 'selectedSize' | 'selectedColor',
    value: string,
  ) => {
    updateItemField(index, {
      [field]: value ? value : undefined,
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(draft.items.filter((_, idx) => idx !== index));
  };

  const handleProofFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const { secure_url } = await uploadToCloudinary(file);
      setPricing({ paymentProofUrl: secure_url });
      showToast('Proof uploaded successfully', 'success');
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to upload proof', 'error');
    } finally {
      setUploadingProof(false);
      event.target.value = '';
    }
  };

  const handleClearProof = () => {
    setPricing({ paymentProofUrl: '' });
  };

  const handleProofUrlChange = (value: string) => {
    setPricing({ paymentProofUrl: value });
  };

  const handleDiscountCodeChange = (value: string) => {
    setPricing({ discountCode: value });
  };

  const handleDiscountAmountInputChange = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setPricing({ discountAmount: undefined });
      return;
    }
    const numeric = Number(trimmed);
    if (Number.isNaN(numeric)) return;
    setPricing({ discountAmount: numeric });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleAmountPaidInputChange = (value: string) => {
    setAmountPaidManuallySet(true);
    if (!value.trim()) {
      setPricing({ amountPaid: undefined });
      setAmountPaidInput('');
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return;
    }
    const clamped = Math.max(0, numeric);
    setAmountPaidInput(value);
    setPricing({ amountPaid: clamped });
  };

  const handlePaymentReferenceChange = (value: string) => {
    setPricing({ paymentReference: value });
  };

  const subtotal = useMemo(() => {
    return draft.items.reduce((sum, item) => {
      const line =
        (typeof item.price === 'number' ? item.price : 0) *
        (typeof item.quantity === 'number' ? item.quantity : 0);
      return sum + line;
    }, 0);
  }, [draft.items]);

  const discountAmount = useMemo(() => {
    const discount = Number(draft.pricing.discountAmount ?? 0);
    if (!Number.isFinite(discount) || discount <= 0) return 0;
    return Math.min(discount, subtotal);
  }, [draft.pricing.discountAmount, subtotal]);

  const deliveryFee = useMemo(() => {
    const raw = draft.pricing.deliveryFee ?? null;
    if (raw == null) return undefined;
    const fee = Number(raw);
    if (!Number.isFinite(fee) || fee < 0) return undefined;
    return fee;
  }, [draft.pricing.deliveryFee]);

  const total = useMemo(() => {
    const base = Math.max(0, subtotal - discountAmount);
    const fee = deliveryFee ?? 0;
    return base + fee;
  }, [subtotal, discountAmount, deliveryFee]);

  const rawAmountPaid = draft.pricing.amountPaid;
  const amountPaid = useMemo(() => {
    if (rawAmountPaid == null) return 0;
    const numeric = Number(rawAmountPaid);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.min(numeric, total);
  }, [rawAmountPaid, total]);

  const balanceDue = useMemo(
    () => Math.max(0, total - amountPaid),
    [total, amountPaid],
  );

  useEffect(() => {
    if (!draft.items.length) {
      if (draft.pricing.amountPaid != null) {
        setPricing({ amountPaid: undefined });
      }
      if (amountPaidInput !== '') {
        setAmountPaidInput('');
      }
      if (amountPaidManuallySet) {
        setAmountPaidManuallySet(false);
      }
      autoAmountPaidValueRef.current = null;
      return;
    }

    if (amountPaidManuallySet) {
      return;
    }

    const existingRaw = draft.pricing.amountPaid;
    const numericExisting =
      existingRaw == null ? null : Number(draft.pricing.amountPaid);
    const existing =
      numericExisting == null || Number.isNaN(numericExisting)
        ? null
        : numericExisting;
    const shouldAutofill =
      existingRaw == null ||
      (autoAmountPaidValueRef.current != null &&
        existing === autoAmountPaidValueRef.current);

    if (!shouldAutofill) {
      return;
    }

    if (total > 0 && autoAmountPaidValueRef.current !== total) {
      autoAmountPaidValueRef.current = total;
      setPricing({ amountPaid: total });
      setAmountPaidInput(String(total));
    }
  }, [
    draft.items.length,
    draft.pricing.amountPaid,
    total,
    amountPaidManuallySet,
    amountPaidInput,
    setPricing,
  ]);

  useEffect(() => {
    if (draft.pricing.amountPaid == null) {
      return;
    }
    const numeric = Number(draft.pricing.amountPaid);
    if (!Number.isFinite(numeric)) {
      return;
    }
    const clamped = Math.min(Math.max(0, numeric), total);
    if (clamped !== numeric) {
      setPricing({ amountPaid: clamped });
    }
    if (!amountPaidManuallySet) {
      setAmountPaidInput(String(clamped));
    }
  }, [total, draft.pricing.amountPaid, amountPaidManuallySet, setPricing]);

  const canSubmitOrder =
    canContinue && draft.items.length > 0 && subtotal > 0 && !createdOrder;

  const buildOrderInput = () => {
    const email = draft.customer.email.trim();
    if (!email) {
      showToast('Customer email is required.', 'error');
      return null;
    }
    if (draft.items.length === 0) {
      showToast('Add at least one item to the order.', 'error');
      return null;
    }

    const firstName = (draft.customer.firstName ?? '').trim();
    const lastName = (draft.customer.lastName ?? '').trim();
    const address1 = (draft.customer.address1 ?? '').trim();
    const city = (draft.customer.city ?? '').trim();
    const state = (draft.customer.state ?? '').trim();

    if (!firstName || !lastName || !address1 || !city || !state) {
      showToast('Fill in required customer fields before saving.', 'error');
      return null;
    }

    const phone = draft.customer.phone?.trim();

    const items = draft.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        name: item.name ?? undefined,
        price: Number(item.price ?? 0),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        selectedSize: item.selectedSize ?? undefined,
        selectedColor: item.selectedColor ?? undefined,
        image: item.image ?? undefined,
      }));

    if (!items.length) {
      showToast(
        'Unable to build order items. Please re-add products.',
        'error',
      );
      return null;
    }

    const couponCode = draft.pricing.discountCode?.trim().length
      ? draft.pricing.discountCode.trim().toUpperCase()
      : undefined;
    const couponDiscount =
      discountAmount > 0 ? Number(discountAmount) : undefined;
    const rawDeliveryFee = draft.pricing.deliveryFee;
    const deliveryFeePayload =
      rawDeliveryFee == null
        ? undefined
        : Math.max(0, Number(rawDeliveryFee) || 0);
    const deliveryLocationId = draft.pricing.deliveryLocationId?.trim() || '';
    const deliveryLocationName =
      draft.pricing.deliveryLocationName?.trim() || '';
    const amountPaidPayload =
      amountPaid > 0 ? Math.min(amountPaid, total) : undefined;
    const transferProofUrl = draft.pricing.paymentProofUrl?.trim().length
      ? draft.pricing.paymentProofUrl.trim()
      : undefined;
    const paymentReference = draft.pricing.paymentReference?.trim().length
      ? draft.pricing.paymentReference.trim()
      : undefined;
    const notesPayload = draft.notes?.trim().length
      ? draft.notes.trim()
      : undefined;

    return {
      email,
      firstName,
      lastName,
      phone: phone || undefined,
      address1,
      city,
      state,
      items,
      couponCode,
      couponDiscount,
      deliveryFee: deliveryFeePayload,
      deliveryLocationId: deliveryLocationId || undefined,
      deliveryLocationName: deliveryLocationName || undefined,
      amountPaid: amountPaidPayload,
      transferProofUrl,
      paymentReference,
      notes: notesPayload,
    };
  };

  const handleCreateOrder = async () => {
    if (!canSubmitOrder) {
      showToast(
        'Complete customer details, add items, and ensure totals are valid before saving.',
        'error',
      );
      return;
    }
    const input = buildOrderInput();
    if (!input) return;
    try {
      const { data } = await createAdminOrderMutation({
        variables: { input },
      });
      const order = data?.createAdminOrder;
      if (order?._id) {
        setCreatedOrder({
          id: order._id,
          orderNumber: order.orderNumber,
          total: Number(order.total ?? total),
          amountPaid: Number(order.amountPaid ?? amountPaid),
          email: order.email,
        });
        showToast('Offline order created successfully.', 'success', {
          title: 'Order created',
        });
      } else {
        showToast('Order created but no ID returned.', 'error');
      }
    } catch (error: any) {
      const errMsg = error?.message ?? 'Failed to create order';
      if (/insufficient stock/i.test(errMsg)) {
        showToast(
          'Some items are out of stock. Please adjust or remove them before saving.',
          'error',
          { title: 'Out of stock items' },
        );
      } else {
        showToast(errMsg, 'error');
      }
    }
  };

  const handleStartNewOrder = () => {
    reset();
    setCreatedOrder(null);
    setLookupEmail('');
    setStatusBanner(null);
    setProductSearchTerm('');
    setAmountPaidInput('');
    setAmountPaidManuallySet(false);
    autoAmountPaidValueRef.current = null;
    showToast('Ready for the next order.', 'info');
  };

  const handleCopyCustomerLink = async () => {
    if (!createdOrder) return;
    const link = window.location.origin + '/orders/' + createdOrder.id;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Customer link copied to clipboard.', 'success');
    } catch {
      showToast('Unable to copy link automatically.', 'error');
    }
  };

  const handleViewCreatedOrder = () => {
    if (!createdOrder) return;
    navigate('/admin/orders?id=' + createdOrder.id);
  };

  const handlePrintReceipt = () => {
    if (!createdOrder) return;
    window.open(
      '/orders/' + createdOrder.id + '/receipt?print=1',
      '_blank',
      'noopener',
    );
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const term = productSearchTerm.trim().toLowerCase();
      if (lastProductSearchRef.current === term) {
        return;
      }
      searchProducts({
        variables: {
          page: 1,
          pageSize: 8,
          search: term,
          inStockOnly: false,
          active: true,
        },
      });
      lastProductSearchRef.current = term;
    }, 300);

    return () => clearTimeout(handler);
  }, [productSearchTerm, searchProducts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            className="px-3 text-sm rounded-md btn-ghost h-9"
            onClick={() => navigate('/admin/orders')}
          >
            ← Back to orders
          </button>
          <h1 className="mt-2 text-2xl font-semibold text-brand">
            Create Offline Order
          </h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Start by confirming customer details before adding items.
          </p>
        </div>
        <button
          type="button"
          className="px-4 text-sm rounded-md btn-secondary h-9"
          onClick={() => {
            reset();
            setLookupEmail('');
            setStatusBanner(null);
          }}
        >
          Reset form
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,_1fr]">
        <CustomerLookupCard
          lookupEmail={lookupEmail}
          statusBanner={statusBanner}
          isLoading={isLoading}
          onLookupEmailChange={setLookupEmail}
          onSubmit={handleLookup}
        />
        <CustomerInfoCard
          customer={draft.customer}
          isLoading={isLoading}
          canContinue={canContinue}
          onFieldChange={handleCustomerFieldChange}
          onContinue={handleContinueToItems}
        />
      </div>

      <OrderItemsPanel
        productSearchTerm={productSearchTerm}
        onProductSearchTermChange={setProductSearchTerm}
        productSearchLoading={productSearchLoading}
        productResults={productResults}
        onAddProduct={handleAddProduct}
        items={draft.items}
        onQuantityChange={handleItemQuantityChange}
        onPriceChange={handleItemPriceChange}
        onOptionChange={handleItemOptionChange}
        onRemoveItem={handleRemoveItem}
        subtotal={subtotal}
      />

      <OrderSummaryPanel
        pricing={draft.pricing}
        notes={draft.notes}
        discountAmount={discountAmount}
        deliveryFee={deliveryFee}
        subtotal={subtotal}
        amountPaid={amountPaid}
        balanceDue={balanceDue}
        total={total}
        amountPaidInput={amountPaidInput}
        uploadingProof={uploadingProof}
        onDiscountCodeChange={handleDiscountCodeChange}
        onDiscountAmountChange={handleDiscountAmountInputChange}
        onNotesChange={handleNotesChange}
        onAmountPaidInputChange={handleAmountPaidInputChange}
        onPaymentReferenceChange={handlePaymentReferenceChange}
        onProofFileChange={handleProofFileChange}
        onProofUrlChange={handleProofUrlChange}
        onClearProof={handleClearProof}
        deliveryLocations={deliveryLocations}
        selectedDeliveryId={selectedDeliveryId}
        onDeliveryLocationChange={handleDeliveryLocationChange}
        deliveryLocationsLoading={deliveryLocationsLoading}
      />

      {!createdOrder ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={!canSubmitOrder || creatingOrder}
            className="inline-flex items-center justify-center h-10 px-6 text-sm font-semibold rounded-md btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingOrder ? 'Creating order…' : 'Create offline order'}
          </button>
        </div>
      ) : (
        <CreatedOrderSuccessCard
          createdOrder={createdOrder}
          balanceDue={balanceDue}
          onViewOrder={handleViewCreatedOrder}
          onCopyLink={handleCopyCustomerLink}
          onPrintReceipt={handlePrintReceipt}
          onStartNewOrder={handleStartNewOrder}
        />
      )}
    </div>
  );
}

export default function AdminCreateOrderPage() {
  return (
    <AdminOrderComposerProvider>
      <AdminCreateOrderPageInner />
    </AdminOrderComposerProvider>
  );
}
