import { formatCurrency } from '../../../utils/currency';
import { CreatedOrderInfo } from './types';

type CreatedOrderSuccessCardProps = {
  createdOrder: CreatedOrderInfo;
  balanceDue: number;
  onViewOrder: () => void;
  onCopyLink: () => void;
  onPrintReceipt: () => void;
  onStartNewOrder: () => void;
};

export function CreatedOrderSuccessCard({
  createdOrder,
  balanceDue,
  onViewOrder,
  onCopyLink,
  onPrintReceipt,
  onStartNewOrder,
}: CreatedOrderSuccessCardProps) {
  return (
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-lg font-semibold">Offline order created</h3>
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
          onClick={onViewOrder}
          className="btn-primary inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold"
        >
          View order
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          className="btn-secondary inline-flex h-9 items-center justify-center rounded-md px-4 text-sm"
        >
          Copy customer link
        </button>
        <button
          type="button"
          onClick={onPrintReceipt}
          className="btn-ghost inline-flex h-9 items-center justify-center rounded-md px-4 text-sm"
        >
          Print receipt
        </button>
      </div>

      <div className="mt-4 text-xs" style={{ color: 'rgb(var(--muted))' }}>
        Need to start another?{' '}
        <button
          type="button"
          onClick={onStartNewOrder}
          className="text-brand underline"
        >
          Reset form
        </button>
      </div>
    </div>
  );
}

