import { Link, useNavigate } from 'react-router-dom';
import { TCartItem } from 'src/types';
import { LocalCartItem } from '../utils/localCart';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useCheckout } from '../contexts/CheckoutContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { CREATE_BANK_TRANSFER_ORDER } from '../graphql/orders';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import { VALIDATE_COUPON } from '../graphql/coupons';
import { GET_COMPANY_SETTINGS } from '../graphql/settings';
import { getAnalyticsRefetches } from '../graphql/refetches';
import { useAnalyticsTracker } from '../hooks/useAnalyticsTracker';
import CheckoutDeliveryForm, {
  CheckoutFormValues,
} from '../routes/checkout/components/CheckoutDeliveryForm';
import CheckoutOrderSummary from './checkout/components/CheckoutOrderSummary';
import BankTransferModal from './checkout/components/BankTransferModal';
import { LIST_DELIVERY_LOCATIONS } from '../graphql/delivery';
import Input from '../components/ui/Input';
import { formatCurrency } from '../utils/currency';
import { Skeleton } from '../components/ui/Skeleton';

export default function CheckoutPage() {
  const { cartItems, isLoading, cartLoaded } = useCart();
  const { isUserAuthenticated, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const items = cartItems as (TCartItem | LocalCartItem)[];
  const loading = isLoading;
  const { trackCheckoutStart, trackPurchase } = useAnalyticsTracker();
  const hasTrackedCheckout = useRef(false);

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
  const [form, setForm] = useState<CheckoutFormValues>({
    firstName: info.firstName ?? '',
    lastName: info.lastName ?? '',
    email: user?.email || info.email || '',
    phone: info.phone ?? '',
    address1: info.address1 ?? '',
    city: info.city ?? '',
    state: info.state ?? '',
    notes: info.notes ?? '',
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

  const { data: deliveryData } = useQuery(LIST_DELIVERY_LOCATIONS, {
    fetchPolicy: 'cache-and-network',
  });
  const deliveries = useMemo(
    () =>
      (deliveryData?.listDeliveryLocations ?? []).filter((d: any) => d.active),
    [deliveryData],
  );
  const defaultDelivery = useMemo(
    () => deliveries.find((d: any) => d.isDefault),
    [deliveries],
  );
  const [deliveryId, setDeliveryId] = useState<string>('');
  useEffect(() => {
    if (deliveryId) return;
    if (defaultDelivery) {
      setDeliveryId(defaultDelivery._id);
      return;
    }
    if (deliveries.length) {
      setDeliveryId(deliveries[0]._id);
    }
  }, [deliveryId, defaultDelivery, deliveries]);
  const selectedDelivery = deliveries.find((d: any) => d._id === deliveryId);
  const deliveryFee = Number(selectedDelivery?.price ?? 0);
  const baseAfterDiscount = appliedCoupon?.newTotal ?? totalBeforeDiscount;
  const payableTotal = Math.max(0, baseAfterDiscount + deliveryFee);

  const canContinueToPayment = useMemo(
    () =>
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.address1.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.state.trim().length > 0,
    [form.firstName, form.lastName, form.address1, form.city, form.state],
  );

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoaded) return;
    if (!loading && items.length === 0) {
      showToast('Your cart is empty', 'warning');
      navigate('/cart');
    }
  }, [cartLoaded, loading, items, navigate, showToast]);

  useEffect(() => {
    if (!cartLoaded) return;
    if (!loading && items.length > 0 && !hasTrackedCheckout.current) {
      trackCheckoutStart();
      hasTrackedCheckout.current = true;
    }
  }, [cartLoaded, loading, items, trackCheckoutStart]);

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  function update<K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K],
  ) {
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
    return <CheckoutPageSkeleton />;
  }

  // Show login modal for unauthenticated users
  if (!isUserAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-4 text-6xl">🔒</div>
            <h1 className="mb-4 text-3xl font-bold">Login Required</h1>
            <p className="mb-8 text-muted">
              You need to be logged in to access the checkout page.
            </p>
            <button
              onClick={login}
              className="px-8 py-3 text-lg rounded-lg btn-primary"
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
      <div className="px-2 py-8 mx-auto max-w-7xl sm:px-4">
        <div className="mb-6">
          <Link to="/cart" className="text-brand hover:text-brand-700">
            ← Back to Cart
          </Link>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CheckoutDeliveryForm
              values={form}
              onChange={update}
              onContinue={() => {
                if (validate()) {
                  setInfo(form);
                  setShowBankModal(true);
                }
              }}
              canContinue={canContinueToPayment}
            />
          </div>

          <CheckoutOrderSummary
            items={items}
            subtotal={subtotal}
            payableTotal={payableTotal}
            couponCode={couponCode}
            onCouponCodeChange={(value) => setCouponCode(value.toUpperCase())}
            appliedCoupon={
              appliedCoupon
                ? { code: appliedCoupon.code, discountAmount }
                : null
            }
            onApplyCoupon={async () => {
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
                  showToast(result?.message || 'Coupon invalid', 'error');
                  return;
                }
                setAppliedCoupon({
                  code,
                  discountAmount: result.discountAmount ?? 0,
                  newTotal: result.newTotal ?? totalBeforeDiscount,
                });
                setCouponCode(code);
                showToast(result.message || 'Coupon applied', 'success');
              } catch (err) {
                console.error(err);
                showToast('Failed to apply coupon', 'error');
              }
            }}
            onRemoveCoupon={() => {
              setAppliedCoupon(null);
              setCouponCode('');
              showToast('Coupon removed', 'info');
            }}
            applyingCoupon={applyingCoupon}
            discountAmount={discountAmount}
            deliveries={deliveries}
            selectedDeliveryId={deliveryId}
            onChangeDelivery={setDeliveryId}
            deliveryFee={deliveryFee}
          notes={form.notes}
          />
        </div>
      </div>

      <BankTransferModal
        open={showBankModal}
        onClose={() => {
          if (!submitting) {
            setShowBankModal(false);
          }
        }}
        bankDetails={bankDetails}
        payableTotal={payableTotal}
        transferFile={transferFile}
        onTransferFileChange={setTransferFile}
        submitting={submitting}
        setSubmitting={setSubmitting}
        whatsappClicked={whatsappClicked}
        onWhatsappClick={() => setWhatsappClicked(true)}
        onPaymentSubmitted={async ({ transferProofUrl }) => {
          const notesPayload =
            form.notes.trim().length > 0 ? form.notes.trim() : undefined;
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
            transferProofUrl,
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
            // Delivery fields
            deliveryLocationId: deliveryId || undefined,
            deliveryLocationName: selectedDelivery?.name || undefined,
            deliveryFee,
            amountPaid: payableTotal,
            notes: notesPayload,
          };
          const { data: orderResponse } = await createOrder({
            variables: { payload: JSON.stringify(payload) },
          });
          if (orderResponse?.createBankTransferOrder) {
            trackPurchase();
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
              notes: '',
            });
            setTransferFile(null);
            setWhatsappClicked(false);
            setAppliedCoupon(null);
            setCouponCode('');
            navigate('/checkout/confirmation');
          } else {
            showToast('Failed to submit order', 'error');
          }
        }}
      />

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

function CheckoutPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <Skeleton className="h-5 w-40 rounded-md" />
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
                <div className="md:col-span-2 space-y-2">
                  <Skeleton className="h-3 w-28 rounded-full" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <Skeleton className="h-5 w-48 rounded-md" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="rounded-md border border-dashed p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Skeleton className="h-3 w-24 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <Skeleton className="h-5 w-36 rounded-md" />
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="mt-5 h-11 w-full rounded-md" />
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="mt-3 h-10 w-full rounded-md" />
              <Skeleton className="mt-3 h-10 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
