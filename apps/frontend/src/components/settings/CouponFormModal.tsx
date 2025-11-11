import { useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

type AdminCoupon = {
  _id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CouponFormState = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
  createdBy: string;
};

function toDateTimeLocalValue(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

type CouponFormModalProps = {
  modalOpen: boolean;
  editingCoupon: AdminCoupon | null;
  form: CouponFormState;
  setForm: React.Dispatch<React.SetStateAction<CouponFormState>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export function CouponFormModal({
  modalOpen,
  editingCoupon,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}: CouponFormModalProps) {
  useEffect(() => {
    if (!modalOpen) {
      setForm({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        expiresAt: '',
        isActive: true,
        createdBy: '',
      });
    }
  }, [modalOpen, setForm]);

  return (
    <Modal
      open={modalOpen}
      onClose={onClose}
      title={editingCoupon ? 'Edit coupon' : 'Create coupon'}
      widthClassName="max-w-3xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost h-10 rounded-md px-4 text-sm font-semibold"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="coupon-form"
            className="btn-primary h-10 rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingCoupon
                ? 'Save changes'
                : 'Create coupon'}
          </button>
        </>
      }
    >
      <form id="coupon-form" className="space-y-6" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Coupon code
            <Input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="GLAMBABE10"
              className="uppercase tracking-wide"
              autoFocus
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Discount type
            <Select
              value={form.discountType}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  discountType: value as 'percentage' | 'fixed',
                }))
              }
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed amount' },
              ]}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Discount value
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.discountValue}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  discountValue: event.target.value,
                }))
              }
              onWheel={(event) => {
                (event.currentTarget as HTMLInputElement).blur();
                event.preventDefault();
              }}
              placeholder={form.discountType === 'percentage' ? '10' : '5000'}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Minimum order amount
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  minOrderAmount: event.target.value,
                }))
              }
              onWheel={(event) => {
                (event.currentTarget as HTMLInputElement).blur();
                event.preventDefault();
              }}
              placeholder="Optional"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Maximum discount
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.maxDiscount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  maxDiscount: event.target.value,
                }))
              }
              onWheel={(event) => {
                (event.currentTarget as HTMLInputElement).blur();
                event.preventDefault();
              }}
              placeholder="Optional"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Usage limit
            <Input
              type="number"
              min="1"
              step="1"
              value={form.usageLimit}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  usageLimit: event.target.value,
                }))
              }
              onWheel={(event) => {
                (event.currentTarget as HTMLInputElement).blur();
                event.preventDefault();
              }}
              placeholder="Optional"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
            Expires at
            <Input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  expiresAt: event.target.value,
                }))
              }
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
            Created by
            <Input
              value={form.createdBy}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  createdBy: event.target.value,
                }))
              }
              placeholder="Optional admin name"
            />
          </label>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-neutral-800">
              Active status
            </div>
            <p className="text-xs text-neutral-600">
              Active coupons can be applied at checkout immediately.
            </p>
          </div>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                isActive: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
}
