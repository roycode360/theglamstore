import Spinner from '../../../components/ui/Spinner';
import { StatusBanner } from './types';

type CustomerLookupCardProps = {
  lookupEmail: string;
  statusBanner: StatusBanner;
  isLoading: boolean;
  onLookupEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function CustomerLookupCard({
  lookupEmail,
  statusBanner,
  isLoading,
  onLookupEmailChange,
  onSubmit,
}: CustomerLookupCardProps) {
  return (
    <div className="theme-card theme-border rounded-lg border p-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Lookup by email
          </label>
          <p className="mt-1 text-xs" style={{ color: 'rgb(var(--muted))' }}>
            Search recent orders to auto-fill customer information.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            className="theme-border w-full rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="customer@email.com"
            value={lookupEmail}
            onChange={(event) => onLookupEmailChange(event.target.value)}
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
          Tip: If no records exist, fill out the customer information manually.
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Spinner size={16} label="" />
            <span>Loading…</span>
          </div>
        ) : null}
      </form>
    </div>
  );
}

