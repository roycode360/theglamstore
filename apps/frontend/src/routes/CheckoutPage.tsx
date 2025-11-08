import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { TCartItem } from 'src/types';
import { LocalCartItem } from '../utils/localCart';
import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../components/ui/Modal';
import { useCheckout } from '../contexts/CheckoutContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { CREATE_BANK_TRANSFER_ORDER } from '../graphql/orders';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import { VALIDATE_COUPON } from '../graphql/coupons';
import { GET_COMPANY_SETTINGS } from '../graphql/settings';
import { getAnalyticsRefetches } from '../graphql/refetches';

export default function CheckoutPage() {
  const { cartItems, isLoading } = useCart();
  const { isUserAuthenticated, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const items = cartItems as (TCartItem | LocalCartItem)[];
  const loading = isLoading;

  const subtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const price = it.product?.salePrice ?? it.product?.price ?? 0;
        return sum + price * (it.quantity ?? 0);
      }, 0),
    [items],
  );
  const totalBeforeDiscount = useMemo(() => subtotal, [subtotal]);

  const { info, setInfo, reset } = useCheckout();
  const { user } = useAuth();
  const [form, setForm] = useState({
    ...info,
    email: user?.email || info.email || '',
  });
  const [createOrder] = useMutation(CREATE_BANK_TRANSFER_ORDER, {
    refetchQueries: getAnalyticsRefetches,
    awaitRefetchQueries: true,
  });
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBankModal, setShowBankModal] = useState(false);
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [whatsappClicked, setWhatsappClicked] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    newTotal: number;
  } | null>(null);
  const [validateCoupon, { loading: applyingCoupon }] = useLazyQuery(
    VALIDATE_COUPON,
    {
      fetchPolicy: 'network-only',
    },
  );
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const payableTotal = appliedCoupon?.newTotal ?? totalBeforeDiscount;

  const { data: companyData } = useQuery(GET_COMPANY_SETTINGS, {
    fetchPolicy: 'cache-first',
  });

  const bankDetails = useMemo(() => {
    const settings = companyData?.companySettings;
    const fallbackName = 'TheGlamStore LTD';
    const fallbackNumber = '0123456789';
    const fallbackBank = 'Example Bank';
    const fallbackInstructions =
      'After transfer, upload your receipt or send it via WhatsApp. Please ensure to click the button below to complete the order.';

    return {
      businessName: settings?.businessName?.trim() || fallbackName,
      accountName: settings?.accountName?.trim() || fallbackName,
      accountNumber: settings?.accountNumber?.trim() || fallbackNumber,
      bankName: settings?.bankName?.trim() || fallbackBank,
      instructions:
        settings?.accountInstructions?.trim() || fallbackInstructions,
      contactEmail: settings?.contactEmail?.trim() || '',
      contactPhone: settings?.contactPhone?.trim() || '',
    };
  }, [companyData]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      showToast('Your cart is empty', 'warning');
      navigate('/cart');
    }
  }, [loading, items]);

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    // Email is pre-filled from user account, so no validation needed
    if (!form.address1.trim()) next.address1 = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.state.trim()) next.state = 'State is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading checkout" />
      </div>
    );
  }

  // Show login modal for unauthenticated users
  if (!isUserAuthenticated) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">🔒</div>
            <h1 className="mb-4 text-3xl font-bold">Login Required</h1>
            <p className="text-muted mb-8">
              You need to be logged in to access the checkout page.
            </p>
            <button
              onClick={login}
              className="btn-primary rounded-lg px-8 py-3 text-lg"
            >
              Login to Continue
            </button>
          </div>
        </div>

        {/* Login Confirmation Modal */}
        <ConfirmModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onConfirm={() => {
            setShowLoginModal(false);
            login();
          }}
          title="Login Required"
          message="You need to be logged in to proceed with checkout. Would you like to log in now?"
          confirmText="Login"
          cancelText="Cancel"
        />
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-2 py-8 sm:px-4">
        <div className="mb-6">
          <Link to="/cart" className="text-brand hover:text-brand-700">
            ← Back to Cart
          </Link>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Shipping form */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    First Name *
                  </label>
                  <input
                    className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Last Name *
                  </label>
                  <input
                    className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="theme-border w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-600 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={form.email}
                    readOnly
                    required
                  />
                  <p className="text-muted mt-1 text-xs">
                    This email is from your account
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Phone
                  </label>
                  <input
                    className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Address *
                  </label>
                  <input
                    className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={form.address1}
                    onChange={(e) => update('address1', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    City *
                  </label>
                  <input
                    className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    State *
                  </label>
                  <input
                    className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                className="btn-primary mt-6 h-11 w-full rounded-md"
                onClick={(e) => {
                  e.preventDefault();
                  if (validate()) {
                    setInfo(form);
                    setShowBankModal(true);
                  }
                }}
              >
                Continue to Payment
              </button>
            </div>
          </div>

          {/* Order summary */}
          <aside className="lg:col-span-1">
            <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-8">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
              <div className="mb-4 space-y-4">
                {items.map((it) => {
                  const itemId = '_id' in it ? it._id : it.id;
                  return (
                    <div key={itemId} className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
                        {it.product?.images?.[0] && (
                          <img
                            src={it.product.images[0]}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {it.product?.name}
                        </div>
                        <div className="text-muted text-xs">
                          Qty: {it.quantity} · Size: {it.selectedSize || '—'} ·
                          Color: {it.selectedColor || '—'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatCurrency(
                          (it.product?.salePrice ?? it.product?.price ?? 0) *
                            (it.quantity ?? 0),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="theme-border rounded-lg border">
                  <div className="flex items-center justify-between gap-3 px-3 py-3">
                    <div>
                      <div className="text-sm font-medium">Have a coupon?</div>
                      <div
                        className="text-xs"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        Enter code to apply discount
                      </div>
                    </div>
                    {appliedCoupon ? (
                      <button
                        className="text-xs font-medium text-gray-700 transition-colors hover:text-black"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode('');
                          showToast('Coupon removed', 'info');
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <input
                        className="theme-border flex-1 rounded-md border px-3 py-2 text-sm uppercase focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        placeholder="GLAMBABE5"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        disabled={!!appliedCoupon}
                      />
                      <button
                        className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-50"
                        disabled={
                          applyingCoupon ||
                          !!appliedCoupon ||
                          couponCode.trim().length === 0
                        }
                        onClick={async () => {
                          const code = couponCode.trim().toUpperCase();
                          if (!code) {
                            showToast('Please enter a coupon code', 'warning');
                            return;
                          }
                          try {
                            const { data } = await validateCoupon({
                              variables: {
                                code,
                                orderAmount: totalBeforeDiscount,
                                userId: (user as any)?._id ?? undefined,
                              },
                            });
                            const result = data?.validateCoupon;
                            if (!result?.valid) {
                              showToast(
                                result?.message || 'Coupon invalid',
                                'error',
                              );
                              return;
                            }
                            setAppliedCoupon({
                              code,
                              discountAmount: result.discountAmount ?? 0,
                              newTotal: result.newTotal ?? totalBeforeDiscount,
                            });
                            setCouponCode(code);
                            showToast(
                              result.message || 'Coupon applied',
                              'success',
                            );
                          } catch (err) {
                            console.error(err);
                            showToast('Failed to apply coupon', 'error');
                          }
                        }}
                      >
                        {applyingCoupon ? 'Applying…' : 'Apply'}
                      </button>
                    </div>
                    {appliedCoupon ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <span className="theme-border inline-flex items-center gap-1 rounded-full border bg-gray-50 px-2 py-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="h-3 w-3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {appliedCoupon.code} applied
                        </span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-700">Free</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                ) : null}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(payableTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bank Transfer Modal */}
      <Modal
        open={showBankModal}
        onClose={() => {
          if (!submitting) setShowBankModal(false);
        }}
        title="Bank Transfer Details"
        titleIcon={
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
              d="M3 10h18M5 6h14M7 14h10M9 18h6"
            />
          </svg>
        }
        widthClassName="max-w-xl"
        canDismiss={!submitting}
      >
        <div className="space-y-5">
          <div className="theme-border rounded-lg border p-4">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
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
                      d="M12 6v12m6-6H6"
                    />
                  </svg>
                </span>
                <div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Account Name
                  </div>
                  <div className="font-medium">{bankDetails.accountName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 text-gray-600 ring-1 ring-gray-200">
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
                      d="M5 12h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12a2 2 0 100 4h14a2 2 0 100-4"
                    />
                  </svg>
                </span>
                <div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Account Number
                  </div>
                  <div className="font-medium tracking-wider">
                    {bankDetails.accountNumber}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 text-gray-600 ring-1 ring-gray-200">
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
                      d="M3 10h18M5 6h14M7 14h10M9 18h6"
                    />
                  </svg>
                </span>
                <div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Bank
                  </div>
                  <div className="font-medium">{bankDetails.bankName}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800 ring-1 ring-gray-200">
            Please transfer{' '}
            <span className="font-semibold">
              {formatCurrency(payableTotal)}
            </span>{' '}
            to the account above.
            {bankDetails.instructions && <> {bankDetails.instructions}</>}
            <span className="block pt-2 text-xs text-gray-600">
              Please ensure to click the button below to complete the order.
            </span>
          </div>
          {(bankDetails.contactEmail || bankDetails.contactPhone) && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-3 text-xs text-gray-600">
              {bankDetails.contactEmail && (
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>{' '}
                  {bankDetails.contactEmail}
                </div>
              )}
              {bankDetails.contactPhone && (
                <div>
                  <span className="font-semibold text-gray-700">Phone:</span>{' '}
                  {bankDetails.contactPhone}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Upload transfer proof
            </label>
            <div className="flex items-center gap-3">
              <label className="theme-border inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
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
                <span>Choose file</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setTransferFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                {transferFile ? transferFile.name : 'No file selected'}
              </div>
            </div>
          </div>

          <a
            href={`https://wa.me/2348107833512?text=${encodeURIComponent(
              `Hello, I just placed an order on TheGlamStore. Total: ${formatCurrency(payableTotal)}. Attaching payment receipt now.`,
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setWhatsappClicked(true)}
            className="theme-border inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              className="h-4 w-4"
              fill="#25D366"
            >
              <path d="M128 24a104 104 0 00-89.85 156.73L32 232l52.27-13.8A104 104 0 10128 24zm0 192a88 88 0 01-44.83-12.31l-3-.18-31.3 8.26 8.37-30.53-.2-3.12A88 88 0 11128 216zm50-66.31c-2.74-1.37-16.18-7.98-18.7-8.89s-4.33-1.37-6.12 1.37-7 8.89-8.59 10.73-3.16 2.06-5.9.69-11.5-4.24-21.94-13.5c-8.1-7.22-13.58-16.12-15.16-18.86s-.17-4.2 1.2-5.58c1.24-1.24 2.74-3.16 4.11-4.74a18.55 18.55 0 002.74-4.57 4.95 4.95 0 00-.23-4.57c-.69-1.37-6.12-14.72-8.4-20.17-2.21-5.3-4.46-4.58-6.12-4.66l-5.2-.09a10 10 0 00-7.27 3.39c-2.5 2.74-9.55 9.33-9.55 22.75s9.78 26.39 11.14 28.17 19.25 29.36 46.65 41.17A158.51 158.51 0 00164 170c6.86 0 12.32-2.17 16.9-6.85s7.85-10.51 8.88-14.63-.43-9.27-3.78-11.83z" />
            </svg>
            WhatsApp Payment Proof
          </a>

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="btn-ghost h-9 rounded-md px-3 disabled:opacity-50"
              disabled={submitting}
              onClick={() => setShowBankModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary inline-flex h-9 items-center gap-2 rounded-md px-3 disabled:opacity-50"
              disabled={!(transferFile || whatsappClicked) || submitting}
              onClick={async () => {
                try {
                  setSubmitting(true);
                  let proofUrl: string | undefined = undefined;
                  if (transferFile) {
                    const up = await uploadToCloudinary(transferFile);
                    proofUrl = up.secure_url;
                  }
                  const payload = {
                    email: form.email,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    address1: form.address1,
                    city: form.city,
                    state: form.state,
                    subtotal,
                    total: payableTotal,
                    paymentMethod: 'bank_transfer',
                    status: 'awaiting_review',
                    transferProofUrl: proofUrl,
                    items: items.map((it) => ({
                      productId: it.product?._id,
                      name: it.product?.name,
                      price: it.product?.salePrice ?? it.product?.price ?? 0,
                      quantity: it.quantity,
                      selectedSize: it.selectedSize,
                      selectedColor: it.selectedColor,
                      image: it.product?.images?.[0],
                    })),
                    couponCode: appliedCoupon?.code,
                    couponDiscount: discountAmount,
                  };
                  await createOrder({
                    variables: { payload: JSON.stringify(payload) },
                  });
                  setShowBankModal(false);
                  clearCart();
                  reset();
                  setForm({
                    firstName: '',
                    lastName: '',
                    email: user?.email || '',
                    phone: '',
                    address1: '',
                    city: '',
                    state: '',
                  });
                  navigate('/checkout/confirmation');
                } catch (e) {
                  console.error(e);
                  showToast('Failed to submit order', 'error');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? (
                <>
                  <span className="border-brand h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                  <span>Submitting…</span>
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
                      d="M5 12l5 5L20 7"
                    />
                  </svg>
                  <span>Complete Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Login Confirmation Modal */}
      <ConfirmModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onConfirm={() => {
          setShowLoginModal(false);
          login();
        }}
        title="Login Required"
        message="You need to be logged in to proceed with checkout. Would you like to log in now?"
        confirmText="Login"
        cancelText="Cancel"
      />
    </>
  );
}
