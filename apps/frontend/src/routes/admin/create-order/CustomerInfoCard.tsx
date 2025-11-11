import Spinner from '../../../components/ui/Spinner';
import { CustomerDraft } from './types';

type CustomerInfoCardProps = {
  customer: CustomerDraft;
  isLoading: boolean;
  canContinue: boolean;
  onFieldChange: (field: keyof CustomerDraft, value: string) => void;
  onContinue: () => void;
};

export function CustomerInfoCard({
  customer,
  isLoading,
  canContinue,
  onFieldChange,
  onContinue,
}: CustomerInfoCardProps) {
  return (
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
            <span>Loading…</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          First name *
          <input
            value={customer.firstName}
            onChange={(event) => onFieldChange('firstName', event.target.value)}
            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="Ada"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Last name *
          <input
            value={customer.lastName}
            onChange={(event) => onFieldChange('lastName', event.target.value)}
            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="Lovelace"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email *
          <input
            type="email"
            value={customer.email}
            onChange={(event) => onFieldChange('email', event.target.value)}
            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="customer@email.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone
          <input
            value={customer.phone ?? ''}
            onChange={(event) => onFieldChange('phone', event.target.value)}
            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="+234 801 234 5678"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Address *
          <input
            value={customer.address1 ?? ''}
            onChange={(event) => onFieldChange('address1', event.target.value)}
            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="123 Fashion Street"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          City *
          <input
            value={customer.city ?? ''}
            onChange={(event) => onFieldChange('city', event.target.value)}
            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="Lagos"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          State *
          <input
            value={customer.state ?? ''}
            onChange={(event) => onFieldChange('state', event.target.value)}
            className="theme-border rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="Lagos State"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-dashed pt-4 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
          This information will be used for order confirmation emails and delivery instructions.
        </div>
        <button
          type="button"
          className="btn-primary h-10 rounded-md px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continue to items
        </button>
      </div>
    </div>
  );
}

