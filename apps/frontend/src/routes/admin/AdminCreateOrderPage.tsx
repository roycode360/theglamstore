import { useLazyQuery, useMutation } from '@apollo/client';
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
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/currency';
import { uploadToCloudinary } from '../../utils/cloudinary';
import Input from '../../components/ui/Input';

type StatusBanner = {
  kind: 'success' | 'info' | 'error';
  message: string;
} | null;

type CreatedOrderInfo = {
  id: string;
  orderNumber?: string | null;
  total: number;
  amountPaid: number;
  email?: string | null;
};

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

  const productResults =
    productData?.listProductsPage?.items ??
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

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [amountPaidManuallySet, setAmountPaidManuallySet] = useState(false);
  const autoAmountPaidValueRef = useRef<number | null>(null);

  useEffect(() => {
    reset();
  }, [reset]);

  const handleLookup = async (event: React.FormEvent) => {
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
      const first = data?.listOrdersPage?.items && data.listOrdersPage.items[0];

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

  const handleCustomerChange =
    (field: keyof typeof draft.customer) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCustomer({ [field]: event.target.value });
    };

  const isLoading = searching || loadingOrder;
  const productSearchLoading = productSearching;
  const lastProductSearchRef = useRef<string | null>(null);

  const canContinue = useMemo(() => {
    const customer = draft.customer;
    return (
      customer.firstName.trim().length > 0 &&
      customer.lastName.trim().length > 0 &&
      customer.email.trim().length > 0 &&
      customer.address1?.trim().length &&
      customer.city?.trim().length &&
      customer.state?.trim().length
    );
  }, [draft.customer]);

  const handleAddProduct = (product: (typeof productResults)[number]) => {
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
    const next = draft.items.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item,
    );
    setItems(next);
  };

  const removeItem = (index: number) => {
    const next = draft.items.filter((_, idx) => idx !== index);
    setItems(next);
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

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value);
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

  const shippingFee = useMemo(() => {
    const shipping = Number(draft.pricing.shippingFee ?? 0);
    if (!Number.isFinite(shipping) || shipping <= 0) return 0;
    return shipping;
  }, [draft.pricing.shippingFee]);

  const total = useMemo(() => {
    const base = Math.max(0, subtotal - discountAmount);
    return base + shippingFee;
  }, [subtotal, discountAmount, shippingFee]);

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
    if (draft.pricing.amountPaid == null) return;
    const numeric = Number(draft.pricing.amountPaid);
    if (!Number.isFinite(numeric)) return;
    const clamped = Math.min(Math.max(0, numeric), total);
    if (clamped !== numeric) {
      setPricing({ amountPaid: clamped });
    }
  }, [total, draft.pricing.amountPaid, setPricing]);

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
    const shippingFeePayload =
      shippingFee > 0 ? Number(shippingFee) : shippingFee === 0 ? 0 : undefined;
    const amountPaidPayload =
      amountPaid > 0 ? Math.min(amountPaid, total) : undefined;
    const transferProofUrl = draft.pricing.paymentProofUrl?.trim().length
      ? draft.pricing.paymentProofUrl.trim()
      : undefined;
    const paymentReference = draft.pricing.paymentReference?.trim().length
      ? draft.pricing.paymentReference.trim()
      : undefined;
    const notes = draft.notes?.trim().length ? draft.notes.trim() : undefined;

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
      shippingFee: shippingFeePayload,
      amountPaid: amountPaidPayload,
      transferProofUrl,
      paymentReference,
      notes,
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
    const link = `${window.location.origin}/orders/${createdOrder.id}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Customer link copied to clipboard.', 'success');
    } catch {
      showToast('Unable to copy link automatically.', 'error');
    }
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
            className="btn-ghost h-9 rounded-md px-3 text-sm"
            onClick={() => navigate('/admin/orders')}
          >
            ← Back to orders
          </button>
          <h1 className="text-brand mt-2 text-2xl font-semibold">
            Create Offline Order
          </h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Start by confirming customer details before adding items.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary h-9 rounded-md px-4 text-sm"
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
        <div className="theme-card theme-border rounded-lg border p-4">
          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Lookup by email
              </label>
              <p
                className="mt-1 text-xs"
                style={{ color: 'rgb(var(--muted))' }}
              >
                Search recent orders to auto-fill customer information.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                className="theme-border w-full rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="customer@email.com"
                value={lookupEmail}
                onChange={(event) => setLookupEmail(event.target.value)}
              />
              <button
                type="submit"
                className="btn-primary h-10 rounded-md px-4 text-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Searching…' : 'Search'}
              </button>
            </div>
            {statusBanner ? (
              <div
                className={`rounded-md border px-3 py-2 text-xs ${
                  statusBanner.kind === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : statusBanner.kind === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {statusBanner.message}
              </div>
            ) : null}
            <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              Tip: If no records exist, fill out the customer information
              manually.
            </div>
          </form>
        </div>

        <div className="theme-card theme-border rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Customer information</h2>
              <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                Required fields are marked with *
              </p>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Spinner size={16} label="" />
                <span>Loading...</span>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              First name *
              <input
                value={draft.customer.firstName}
                onChange={handleCustomerChange('firstName')}
                className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="Ada"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Last name *
              <input
                value={draft.customer.lastName}
                onChange={handleCustomerChange('lastName')}
                className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="Lovelace"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email *
              <input
                type="email"
                value={draft.customer.email}
                onChange={handleCustomerChange('email')}
                className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="customer@email.com"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Phone
              <input
                value={draft.customer.phone ?? ''}
                onChange={handleCustomerChange('phone')}
                className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="+234 801 234 5678"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              Address *
              <input
                value={draft.customer.address1 ?? ''}
                onChange={handleCustomerChange('address1')}
                className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="123 Fashion Street"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              City *
              <input
                value={draft.customer.city ?? ''}
                onChange={handleCustomerChange('city')}
                className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="Lagos"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              State *
              <input
                value={draft.customer.state ?? ''}
                onChange={handleCustomerChange('state')}
                className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="Lagos State"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-col justify-between gap-3 border-t border-dashed pt-4 text-sm md:flex-row md:items-center">
            <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              This information will be used for order confirmation emails and
              delivery instructions.
            </div>
            <button
              type="button"
              className="btn-primary h-10 rounded-md px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canContinue}
              onClick={() => {
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
              }}
            >
              Continue to items
            </button>
          </div>
        </div>
      </div>

      <div
        id="order-items-anchor"
        className="theme-card theme-border rounded-lg border p-6 text-sm text-neutral-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Order items</h2>
            <p className="text-xs text-neutral-500">
              Search products, choose variants, and adjust quantities.
            </p>
          </div>
          <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
            Subtotal: <strong>{formatCurrency(subtotal)}</strong>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px,_1fr]">
          <div className="space-y-3">
            <div className="theme-border rounded-lg border p-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Search products
              </label>
              <input
                value={productSearchTerm}
                onChange={(event) => setProductSearchTerm(event.target.value)}
                placeholder="Search by name, SKU, or category"
                className="theme-border mt-2 w-full rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
              <p
                className="mt-2 text-xs"
                style={{ color: 'rgb(var(--muted))' }}
              >
                Select a product to add it to this order. Adding the same
                product again will increase its quantity.
              </p>
            </div>
            <div className="theme-border rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>Results</span>
                {productSearchLoading ? (
                  <span className="text-xs text-gray-500">Searching…</span>
                ) : null}
              </div>
              <div className="space-y-2">
                {productResults.length === 0 && !productSearchLoading ? (
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    {productSearchTerm
                      ? 'No products match your search.'
                      : 'Start typing to find products to add.'}
                  </div>
                ) : null}
                {productResults.map(
                  (product: (typeof productResults)[number]) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="theme-border hover:bg-brand-50 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{product.name}</div>
                        <div
                          className="flex flex-wrap items-center gap-2 text-xs"
                          style={{ color: 'rgb(var(--muted))' }}
                        >
                          {product.sku ? <span>SKU: {product.sku}</span> : null}
                          {product.stockQuantity != null ? (
                            <span>Stock: {product.stockQuantity}</span>
                          ) : null}
                          {product.stockQuantity === 0 ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-600">
                              Out of stock
                            </span>
                          ) : null}
                        </div>
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
            </div>
          </div>

          <div className="theme-border rounded-lg border p-4">
            {draft.items.length === 0 ? (
              <div
                className="py-8 text-center text-sm"
                style={{ color: 'rgb(var(--muted))' }}
              >
                No items added yet. Search for a product to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {draft.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="rounded-lg border border-dashed p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold">
                          {item.name ?? 'Untitled product'}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: 'rgb(var(--muted))' }}
                        >
                          {item.sku
                            ? `SKU: ${item.sku}`
                            : `ID: ${item.productId}`}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatCurrency(
                          (item.price ?? 0) * (item.quantity ?? 0),
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Quantity
                        <input
                          type="number"
                          min={1}
                          max={
                            item.maxQuantity != null && item.maxQuantity > 0
                              ? item.maxQuantity
                              : undefined
                          }
                          value={item.quantity ?? 1}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            const clamped =
                              item.maxQuantity != null && item.maxQuantity > 0
                                ? Math.min(Math.max(1, value), item.maxQuantity)
                                : Math.max(1, value);
                            updateItemField(index, { quantity: clamped });
                          }}
                          onWheel={(event) => {
                            (event.target as HTMLInputElement).blur();
                            event.preventDefault();
                          }}
                          className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Unit price
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.price ?? ''}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            updateItemField(index, {
                              price: Math.max(0, value),
                            });
                          }}
                          onWheel={(event) => {
                            (event.target as HTMLInputElement).blur();
                            event.preventDefault();
                          }}
                          placeholder="Unit price"
                          className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                      </label>

                      {item.availableSizes?.length ? (
                        <label className="flex flex-col gap-1 text-xs font-medium">
                          Size
                          <select
                            value={item.selectedSize ?? ''}
                            onChange={(event) =>
                              updateItemField(index, {
                                selectedSize: event.target.value || undefined,
                              })
                            }
                            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          >
                            <option value="">Select</option>
                            {item.availableSizes.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {item.availableColors?.length ? (
                        <label className="flex flex-col gap-1 text-xs font-medium">
                          Color
                          <select
                            value={item.selectedColor ?? ''}
                            onChange={(event) =>
                              updateItemField(index, {
                                selectedColor: event.target.value || undefined,
                              })
                            }
                            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          >
                            <option value="">Select</option>
                            {item.availableColors.map((color) => (
                              <option key={color} value={color}>
                                {color}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      {item.maxQuantity != null && item.maxQuantity > 0 ? (
                        <span>In stock: {item.maxQuantity}</span>
                      ) : (
                        <span>Stock quantity not tracked</span>
                      )}
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => removeItem(index)}
                      >
                        Remove item
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  <div className="text-xs text-neutral-500">Subtotal</div>
                  <div className="text-base font-semibold">
                    {formatCurrency(subtotal)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="theme-card theme-border rounded-lg border p-6 text-sm text-neutral-900">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <p className="text-xs text-neutral-500">
            Preview totals for this offline order. Taxes are excluded; adjust
            discounts or shipping as needed.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Discount code
            <input
              value={draft.pricing.discountCode ?? ''}
              onChange={(event) =>
                setPricing({ discountCode: event.target.value })
              }
              placeholder="Optional"
              className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Discount amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                draft.pricing.discountAmount != null &&
                !Number.isNaN(draft.pricing.discountAmount)
                  ? draft.pricing.discountAmount
                  : ''
              }
              onChange={(event) =>
                setPricing({
                  discountAmount: Number(event.target.value || 0),
                })
              }
              onWheel={(event) => {
                (event.target as HTMLInputElement).blur();
                event.preventDefault();
              }}
              placeholder="Optional"
              className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Shipping fee
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                draft.pricing.shippingFee != null &&
                !Number.isNaN(draft.pricing.shippingFee)
                  ? draft.pricing.shippingFee
                  : ''
              }
              onChange={(event) =>
                setPricing({ shippingFee: Number(event.target.value || 0) })
              }
              onWheel={(event) => {
                (event.target as HTMLInputElement).blur();
                event.preventDefault();
              }}
              placeholder="Optional"
              className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
            Notes for this order
            <textarea
              value={draft.notes ?? ''}
              onChange={handleNotesChange}
              placeholder="Special instructions, delivery notes, etc."
              className="theme-border h-24 rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </label>

          <div className="border-t border-dashed pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 md:col-span-2">
            Payment received
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Amount paid
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amountPaidInput}
              onChange={(event) => {
                const next = event.target.value;
                setAmountPaidManuallySet(true);
                if (!next.trim()) {
                  setPricing({ amountPaid: undefined });
                  setAmountPaidInput('');
                  return;
                }
                const numeric = Number(next);
                if (Number.isNaN(numeric)) return;
                const clamped = Math.max(0, numeric);
                setAmountPaidInput(next);
                setPricing({ amountPaid: clamped });
              }}
              onWheel={(event) => {
                (event.target as HTMLInputElement).blur();
                event.preventDefault();
              }}
              placeholder="Enter amount received"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Payment reference
            <Input
              value={draft.pricing.paymentReference ?? ''}
              onChange={(event) =>
                setPricing({ paymentReference: event.target.value })
              }
              placeholder="Optional reference or receipt number"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
            Proof of payment
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <label className="theme-border inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                {uploadingProof ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-neutral-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>Uploading…</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                      />
                    </svg>
                    <span>Upload image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleProofFileChange}
                  disabled={uploadingProof}
                />
              </label>
              <Input
                value={draft.pricing.paymentProofUrl ?? ''}
                onChange={(event) =>
                  setPricing({ paymentProofUrl: event.target.value })
                }
                placeholder="https://res.cloudinary.com/…"
                className="flex-1"
                disabled={uploadingProof}
              />
            </div>
            {draft.pricing.paymentProofUrl ? (
              <div className="flex items-center gap-2 text-xs">
                <a
                  href={draft.pricing.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand font-medium underline"
                >
                  View uploaded proof
                </a>
                <button
                  type="button"
                  onClick={handleClearProof}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                Upload a receipt image or paste a secure proof link.
              </div>
            )}
          </label>
        </div>

        <div className="mt-6 space-y-2 rounded-lg border border-dashed px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-emerald-600">
            <span>
              Discount
              {draft.pricing.discountCode
                ? ` (${draft.pricing.discountCode})`
                : ''}
            </span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{formatCurrency(shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Amount paid</span>
            <span>{formatCurrency(amountPaid)}</span>
          </div>
          <div className="flex items-center justify-between text-amber-600">
            <span>Balance due</span>
            <span>{formatCurrency(balanceDue)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {!createdOrder ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={!canSubmitOrder || creatingOrder}
            className="btn-primary inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingOrder ? 'Creating order…' : 'Create offline order'}
          </button>
        </div>
      ) : (
        <div className="theme-card theme-border rounded-lg border p-6 text-sm">
          <div className="flex flex-col gap-2 border-b border-dashed pb-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="text-lg font-semibold text-emerald-600">
                Offline order created
              </h3>
            </div>
            <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              Order No:{' '}
              <span className="font-mono">
                {createdOrder.orderNumber || createdOrder.id}
              </span>
              . Total {formatCurrency(createdOrder.total)} · Paid{' '}
              {formatCurrency(createdOrder.amountPaid)}.
            </p>
            {balanceDue > 0 ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Balance due remaining: {formatCurrency(balanceDue)}.
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/admin/orders?id=${createdOrder.id}`)}
              className="btn-primary inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold"
            >
              View order
            </button>
            <button
              type="button"
              onClick={handleCopyCustomerLink}
              className="btn-secondary inline-flex h-9 items-center justify-center rounded-md px-4 text-sm"
            >
              Copy customer link
            </button>
            <button
              type="button"
              onClick={() =>
                window.open(
                  `/orders/${createdOrder.id}/receipt?print=1`,
                  '_blank',
                  'noopener',
                )
              }
              className="btn-ghost inline-flex h-9 items-center justify-center rounded-md px-4 text-sm"
            >
              Print receipt
            </button>
          </div>
          <div className="mt-4 text-xs" style={{ color: 'rgb(var(--muted))' }}>
            Need to start another?{' '}
            <button
              type="button"
              onClick={handleStartNewOrder}
              className="text-brand underline"
            >
              Reset form
            </button>
          </div>
        </div>
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
