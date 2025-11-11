import Spinner from '../../../components/ui/Spinner';
import { formatNumber } from './utils';

type SummaryCard = {
  label: string;
  value: number | null | undefined;
};

type SummaryCardsProps = {
  items: SummaryCard[];
  loading: boolean;
};

export function SummaryCards({ items, loading }: SummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-gray-500">{card.label}</p>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatNumber(card.value)}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

