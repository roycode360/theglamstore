import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { TCartItem } from 'src/types';
import { LocalCartItem } from '../../../utils/localCart';
import { getOptimizedImageUrl } from '../../../utils/cloudinary';

interface CheckoutOrderSummaryProps {
  items: Array<TCartItem | LocalCartItem>;
  subtotal: number;
  payableTotal: number;
  couponCode: string;
  onCouponCodeChange: (value: string) => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon: () => Promise<void> | void;
  onRemoveCoupon: () => void;
  applyingCoupon: boolean;
  discountAmount: number;
  // Delivery props
  deliveryFee: number;
  notes?: string;
  className?: string;
  onContinue: () => void;
  canContinue: boolean;
}

export default function CheckoutOrderSummary({
  items,
  subtotal,
  payableTotal,
  couponCode,
  onCouponCodeChange,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  applyingCoupon,
  discountAmount,
  deliveryFee,
  notes,
  className,
  onContinue,
  canContinue,
}: CheckoutOrderSummaryProps) {
  const containerClassName = ['lg:col-span-1', className]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <aside className={containerClassName}>
      <div className="p-4 bg-white border rounded-lg shadow-sm sm:p-6 lg:sticky lg:top-8">
        <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
        <div className="mb-4 space-y-4">
          {items.map((it) => {
            const itemId = '_id' in it ? it._id : it.id;
            const productImage =
              getOptimizedImageUrl(it.product?.images?.[0]) ??
              it.product?.images?.[0];
            return (
              <div key={itemId} className="flex items-center gap-3">
                <div className="w-12 h-12 overflow-hidden bg-gray-100 rounded">
                  {productImage && (
                    <img
                      src={productImage}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {it.product?.name}
                  </div>
                  <div className="text-xs text-muted">
                    Qty: {it.quantity} · Size: {it.selectedSize || '—'} · Color:{' '}
                    {it.selectedColor || '—'}
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
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="border rounded-lg theme-border">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <div>
                <div className="text-sm font-medium">Have a coupon?</div>
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  Enter code to apply discount
                </div>
              </div>
              {appliedCoupon ? (
                <button
                  className="text-xs font-medium text-gray-700 transition-colors hover:text-black"
                  onClick={onRemoveCoupon}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-3 py-2 text-sm uppercase border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="GLAMBABE5"
                  value={couponCode}
                  onChange={(e) => onCouponCodeChange(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                <button
                  className="px-3 py-2 text-sm font-semibold text-white transition-colors bg-black rounded-md hover:bg-black/90 disabled:opacity-50"
                  disabled={
                    applyingCoupon ||
                    !!appliedCoupon ||
                    couponCode.trim().length === 0
                  }
                  onClick={() => void onApplyCoupon()}
                >
                  {applyingCoupon ? 'Applying…' : 'Apply'}
                </button>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 px-2 py-1 border rounded-full theme-border bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-3 h-3"
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
            <span>Delivery</span>
            <span className="font-medium text-gray-700">
              {formatCurrency(deliveryFee)}
            </span>
          </div>

          {appliedCoupon ? (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Coupon ({appliedCoupon.code})</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          ) : null}
          <div className="pt-3 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(payableTotal)}</span>
            </div>
          </div>
          <button
            type="button"
            aria-disabled={!canContinue}
            className={`btn-primary mt-4 h-11 w-full rounded-md ${
              canContinue ? '' : 'cursor-not-allowed opacity-60'
            }`}
            onClick={(e) => {
              e.preventDefault();
              onContinue();
            }}
          >
            Continue to Payment
          </button>
          {notes && notes.trim().length > 0 ? (
            <div className="pt-4 mt-4 border-t">
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Additional Notes
              </div>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {notes}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
