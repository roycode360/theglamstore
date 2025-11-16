import { Skeleton } from '../../../components/ui/Skeleton';
import { formatNumber } from './utils';

type TrafficEntry = {
  label: string;
  value: number;
};

type TrafficOverview = {
  countries?: TrafficEntry[];
  sources?: TrafficEntry[];
  devices?: TrafficEntry[];
};

type TrafficOverviewCardProps = {
  overview: TrafficOverview | null | undefined;
  totals: { country: number; source: number; device: number };
  loading: boolean;
};

const sections: Array<{
  key: 'countries' | 'sources' | 'devices';
  title: string;
}> = [
  { key: 'countries', title: 'Top countries' },
  { key: 'sources', title: 'Top sources' },
  { key: 'devices', title: 'Top devices' },
];

export function TrafficOverviewCard({
  overview,
  totals,
  loading,
}: TrafficOverviewCardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Traffic overview</h2>
        {loading ? (
          <TrafficOverviewSkeleton />
        ) : !overview ? (
          <p className="py-8 text-sm text-gray-500">No traffic data yet</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {sections.map((section) => {
              const data = overview[section.key] ?? [];
              const total = totals[section.key === 'countries' ? 'country' : section.key === 'sources' ? 'source' : 'device'];
              return (
                <div key={section.key}>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {data.slice(0, 5).map((item) => {
                      const percent =
                        total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <div
                          key={`${section.key}-${item.label}`}
                          className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                        >
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="font-medium text-gray-800">
                              {item.label}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-black"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {data.length === 0 && (
                      <p className="text-xs text-gray-500">No data available</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TrafficOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {sections.map((section) => (
        <div key={section.key} className="space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-3 w-10 rounded-full" />
                </div>
                <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

