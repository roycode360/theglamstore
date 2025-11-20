import { useMemo } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { formatCurrency } from '../../../utils/currency';
import { PricingDraft } from './types';

type OrderSummaryPanelProps = {
  pricing: PricingDraft;
  notes: string | undefined;
  discountAmount: number;
  deliveryFee: number | undefined;
  subtotal: number;
  amountPaid: number;
  balanceDue: number;
  total: number;
  amountPaidInput: string;
  uploadingProof: boolean;
  onDiscountCodeChange: (value: string) => void;
  onDiscountAmountChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onAmountPaidInputChange: (value: string) => void;
  onPaymentReferenceChange: (value: string) => void;
  onProofFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProofUrlChange: (value: string) => void;
  onClearProof: () => void;
  deliveryLocations: Array<{ _id: string; name: string; price: number }>;
  selectedDeliveryId: string;
  onDeliveryLocationChange: (id: string) => void;
  deliveryLocationsLoading?: boolean;
};

export function OrderSummaryPanel({
  pricing,
  notes,
  discountAmount,
  deliveryFee,
  subtotal,
  amountPaid,
  balanceDue,
  total,
  amountPaidInput,
  uploadingProof,
  onDiscountCodeChange,
  onDiscountAmountChange,
  onNotesChange,
  onAmountPaidInputChange,
  onPaymentReferenceChange,
  onProofFileChange,
  onProofUrlChange,
  onClearProof,
  deliveryLocations,
  selectedDeliveryId,
  onDeliveryLocationChange,
  deliveryLocationsLoading,
}: OrderSummaryPanelProps) {
  const deliveryOptions = useMemo(
    () => [
      { value: '', label: 'Select delivery location' },
      ...deliveryLocations.map((location) => ({
        value: location._id,
        label: `${location.name} (${formatCurrency(location.price)})`,
      })),
    ],
    [deliveryLocations],
  );

  return (
    <div className="p-6 text-sm border rounded-lg theme-card theme-border text-neutral-900">
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <p className="text-xs text-neutral-500">
          Preview totals for this offline order.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Discount code
          <input
            value={pricing.discountCode ?? ''}
            onChange={(event) => onDiscountCodeChange(event.target.value)}
            placeholder="Optional"
            className="px-3 py-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Discount amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={
              pricing.discountAmount != null &&
              !Number.isNaN(pricing.discountAmount)
                ? pricing.discountAmount
                : ''
            }
            onChange={(event) => onDiscountAmountChange(event.target.value)}
            onWheel={(event) => {
              (event.target as HTMLInputElement).blur();
              event.preventDefault();
            }}
            placeholder="Optional"
            className="px-3 py-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Delivery location
          <Select
            value={selectedDeliveryId}
            onChange={onDeliveryLocationChange}
            options={deliveryOptions}
            disabled={
              deliveryLocationsLoading || deliveryLocations.length === 0
            }
          />
          <span className="text-xs text-neutral-500">
            Selecting a location applies its delivery fee automatically.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
          Additional notes (optional)
          <textarea
            value={notes ?? ''}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Special instructions, delivery details, or customer notes."
            className="h-24 px-3 py-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <span className="text-xs text-neutral-500">
            Visible to admins and auto-filled when customers add notes at checkout.
          </span>
        </label>

        <div className="pt-4 text-xs font-semibold tracking-wide text-gray-500 uppercase border-t border-dashed md:col-span-2">
          Payment received
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Amount paid
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amountPaidInput}
            onChange={(event) => onAmountPaidInputChange(event.target.value)}
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
            value={pricing.paymentReference ?? ''}
            onChange={(event) => onPaymentReferenceChange(event.target.value)}
            placeholder="Optional reference or receipt number"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
          Proof of payment
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer theme-border hover:bg-gray-50">
              {uploadingProof ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-neutral-600"
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
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                    />
                  </svg>
                  <span>Upload image</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={onProofFileChange}
                disabled={uploadingProof}
              />
            </label>
            <Input
              value={pricing.paymentProofUrl ?? ''}
              onChange={(event) => onProofUrlChange(event.target.value)}
              placeholder="https://res.cloudinary.com/…"
              className="flex-1"
              disabled={uploadingProof}
            />
          </div>
          {pricing.paymentProofUrl ? (
            <div className="flex items-center gap-2 text-xs">
              <a
                href={pricing.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-brand"
              >
                View uploaded proof
              </a>
              <button
                type="button"
                onClick={onClearProof}
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

      <div className="px-4 py-3 mt-6 space-y-2 text-sm border border-dashed rounded-lg">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-emerald-600">
          <span>
            Discount
            {pricing.discountCode ? ` (${pricing.discountCode})` : ''}
          </span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span>{formatCurrency(deliveryFee ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Amount paid</span>
          <span>{formatCurrency(amountPaid)}</span>
        </div>
        <div className="flex items-center justify-between text-amber-600">
          <span>Balance due</span>
          <span>{formatCurrency(balanceDue)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 text-base font-semibold border-t">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
