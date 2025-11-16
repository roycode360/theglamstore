import { useState } from 'react';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { StatusBadge } from './StatusBadge';
import { Skeleton } from '../ui/Skeleton';

type CouponDiscount = 'PERCENTAGE' | 'FIXED';

type AdminCoupon = {
  _id: string;
  code: string;
  discountType: CouponDiscount;
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

type CouponsSectionProps = {
  coupons: AdminCoupon[];
  loading: boolean;
  openCoupons: boolean;
  setOpenCoupons: (open: boolean) => void;
  onCreateCoupon: () => void;
  onEditCoupon: (coupon: AdminCoupon) => void;
  onToggleActive: (coupon: AdminCoupon) => Promise<void>;
  onDeleteCoupon: (coupon: AdminCoupon) => void;
  toggleTarget: string | null;
};

function formatDiscountValue(coupon: AdminCoupon) {
  return coupon.discountType === 'PERCENTAGE'
    ? `${coupon.discountValue}%`
    : formatCurrency(coupon.discountValue);
}

export function CouponsSection({
  coupons,
  loading,
  openCoupons,
  setOpenCoupons,
  onCreateCoupon,
  onEditCoupon,
  onToggleActive,
  onDeleteCoupon,
  toggleTarget,
}: CouponsSectionProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Coupons</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Create and manage promotional codes for your customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateCoupon}
            className="btn-primary inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold"
          >
            Create coupon
          </button>
            <button
              type="button"
              onClick={() => setOpenCoupons(!openCoupons)}
              aria-expanded={!!openCoupons}
              className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-200 px-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              title={openCoupons ? 'Collapse' : 'Expand'}
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`h-4 w-4 transition-transform ${openCoupons ? 'rotate-180' : ''}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9l6 6 6-6"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={openCoupons ? '' : 'hidden'}>
        {loading ? (
          <CouponsSkeleton />
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h8M8 12h5M12 17h8"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5a2 2 0 0 1 2-2h10l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
                />
              </svg>
            </span>
            <div className="text-base font-semibold text-neutral-800">
              No coupons yet
            </div>
            <p className="max-w-sm text-sm text-neutral-600">
              Create a coupon to reward loyal customers or run limited-time
              promotions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Code
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Type
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Value
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Min spend
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Max discount
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Usage
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="bg-white">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide text-neutral-900">
                        {coupon.code}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 capitalize text-neutral-700">
                        {coupon.discountType}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                        {formatDiscountValue(coupon)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                        {coupon.minOrderAmount != null
                          ? formatCurrency(coupon.minOrderAmount)
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                        {coupon.maxDiscount != null
                          ? formatCurrency(coupon.maxDiscount)
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                        {coupon.usageLimit
                          ? `${coupon.usedCount}/${coupon.usageLimit}`
                          : `${coupon.usedCount}`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge active={coupon.isActive} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                        {formatDate(coupon.expiresAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => onEditCoupon(coupon)}
                            className="text-sm font-semibold text-neutral-700 transition hover:text-neutral-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleActive(coupon)}
                            className="text-sm font-semibold text-neutral-700 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={toggleTarget === coupon._id}
                          >
                            {coupon.isActive ? 'Disable' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCoupon(coupon)}
                            className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {coupons.map((coupon) => (
                <div
                  key={`${coupon._id}-mobile`}
                  className="rounded-xl border border-neutral-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
                        {coupon.code}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        Expires {formatDate(coupon.expiresAt)}
                      </div>
                    </div>
                    <StatusBadge active={coupon.isActive} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-neutral-600">
                    <div className="space-y-1">
                      <span className="block font-semibold text-neutral-800">
                        Type
                      </span>
                      <span className="capitalize">
                        {coupon.discountType}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-semibold text-neutral-800">
                        Value
                      </span>
                      <span>{formatDiscountValue(coupon)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-semibold text-neutral-800">
                        Min spend
                      </span>
                      <span>
                        {coupon.minOrderAmount != null
                          ? formatCurrency(coupon.minOrderAmount)
                          : '—'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-semibold text-neutral-800">
                        Usage
                      </span>
                      <span>
                        {coupon.usageLimit
                          ? `${coupon.usedCount}/${coupon.usageLimit}`
                          : `${coupon.usedCount}`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => onEditCoupon(coupon)}
                      className="font-semibold text-neutral-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(coupon)}
                      className="font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={toggleTarget === coupon._id}
                    >
                      {coupon.isActive ? 'Disable' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCoupon(coupon)}
                      className="font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CouponsSkeleton() {
  const rows = Array.from({ length: 5 });
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50">
            <tr>
              {Array.from({ length: 9 }).map((_, idx) => (
                <th key={idx} className="px-4 py-3 text-left">
                  <Skeleton className="h-3 w-24 rounded-full" />
                </th>
              ))}
              <th className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-3 w-16 rounded-full" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {rows.map((_, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
