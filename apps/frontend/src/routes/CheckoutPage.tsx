import { useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_CART_ITEMS } from '../graphql/cart';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { TCartItem } from 'src/types';
import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../components/ui/Modal';
import { useCheckout } from '../contexts/CheckoutContext';
import { useCart } from '../contexts/CartContext';
import { useMutation } from '@apollo/client';
import { CREATE_BANK_TRANSFER_ORDER } from '../graphql/orders';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useToast } from '../components/ui/Toast';

export default function CheckoutPage() {
  const { data, loading } = useQuery<{ getCartItems: TCartItem[] }>(
    GET_CART_ITEMS,
  );

  const items = data?.getCartItems ?? [];

  const subtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const price = it.product?.salePrice ?? it.product?.price ?? 0;
        return sum + price * (it.quantity ?? 0);
      }, 0),
    [items],
  );
  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const { info, setInfo, reset } = useCheckout();
  const [form, setForm] = useState({ ...info });
  const [createOrder] = useMutation(CREATE_BANK_TRANSFER_ORDER);
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBankModal, setShowBankModal] = useState(false);
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [whatsappClicked, setWhatsappClicked] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      showToast('Your cart is empty', 'warning');
      navigate('/cart');
    }
  }, [loading, items]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'Enter a valid email';
    if (!form.address1.trim()) next.address1 = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.state.trim()) next.state = 'State is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading checkout" />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-8 mx-auto max-w-7xl">
        <div className="mb-6">
          <Link to="/cart" className="text-brand hover:text-brand-700">
            ← Back to Cart
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Shipping form */}
          <div className="lg:col-span-2">
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    First Name *
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-md theme-border"
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Last Name *
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-md theme-border"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-md theme-border"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Phone
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-md theme-border"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">
                    Address *
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-md theme-border"
                    value={form.address1}
                    onChange={(e) => update('address1', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    City *
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-md theme-border"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    State *
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-md theme-border"
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                className="w-full mt-6 rounded-md btn-primary h-11"
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
            <div className="sticky p-6 bg-white border rounded-lg shadow-sm top-8">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
              <div className="mb-4 space-y-4">
                {items.map((it) => (
                  <div key={it._id} className="flex items-center gap-3">
                    <div className="w-12 h-12 overflow-hidden bg-gray-100 rounded">
                      {it.product?.images?.[0] && (
                        <img
                          src={it.product.images[0]}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {it.product?.name}
                      </div>
                      <div className="text-xs text-muted">
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
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
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
            className="w-4 h-4"
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
          <div className="p-4 border rounded-lg theme-border">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-4 h-4"
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
                  <div className="font-medium">TheGlamStore LTD</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 text-blue-600 rounded-md bg-blue-50 ring-1 ring-blue-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-4 h-4"
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
                  <div className="font-medium tracking-wider">0123456789</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 text-purple-600 rounded-md bg-purple-50 ring-1 ring-purple-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-4 h-4"
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
                  <div className="font-medium">Example Bank</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 text-sm rounded-lg bg-amber-50 text-amber-800 ring-1 ring-amber-200">
            Please transfer{' '}
            <span className="font-semibold">{formatCurrency(total)}</span> to
            the account above. After transfer, upload your receipt or send it
            via WhatsApp. Either ways,{' '}
            <b>
              please ensure to click the button below to complete the order.
            </b>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Upload transfer proof
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer theme-border hover:bg-gray-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
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
              `Hello, I just placed an order on TheGlamStore. Total: ${formatCurrency(total)}. Attaching payment receipt now.`,
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setWhatsappClicked(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md theme-border hover:bg-green-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              className="w-4 h-4"
              fill="#25D366"
            >
              <path d="M128 24a104 104 0 00-89.85 156.73L32 232l52.27-13.8A104 104 0 10128 24zm0 192a88 88 0 01-44.83-12.31l-3-.18-31.3 8.26 8.37-30.53-.2-3.12A88 88 0 11128 216zm50-66.31c-2.74-1.37-16.18-7.98-18.7-8.89s-4.33-1.37-6.12 1.37-7 8.89-8.59 10.73-3.16 2.06-5.9.69-11.5-4.24-21.94-13.5c-8.1-7.22-13.58-16.12-15.16-18.86s-.17-4.2 1.2-5.58c1.24-1.24 2.74-3.16 4.11-4.74a18.55 18.55 0 002.74-4.57 4.95 4.95 0 00-.23-4.57c-.69-1.37-6.12-14.72-8.4-20.17-2.21-5.3-4.46-4.58-6.12-4.66l-5.2-.09a10 10 0 00-7.27 3.39c-2.5 2.74-9.55 9.33-9.55 22.75s9.78 26.39 11.14 28.17 19.25 29.36 46.65 41.17A158.51 158.51 0 00164 170c6.86 0 12.32-2.17 16.9-6.85s7.85-10.51 8.88-14.63-.43-9.27-3.78-11.83z" />
            </svg>
            WhatsApp Payment Proof
          </a>

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="px-3 rounded-md btn-ghost h-9 disabled:opacity-50"
              disabled={submitting}
              onClick={() => setShowBankModal(false)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 rounded-md btn-primary h-9 disabled:opacity-50"
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
                    tax,
                    total,
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
                    email: '',
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
                  <span className="w-3 h-3 border-2 rounded-full border-brand animate-spin border-t-transparent" />
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
                    className="w-4 h-4"
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
    </>
  );
}
