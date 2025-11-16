import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from './utils';
import { Skeleton } from '../../../components/ui/Skeleton';

type FunnelStep = {
  label: string;
  count: number;
};

type BehaviorFunnelCardProps = {
  data: FunnelStep[];
  loading: boolean;
};

export function BehaviorFunnelCard({
  data,
  loading,
}: BehaviorFunnelCardProps) {
  const chartData = data.map((step) => ({
    ...step,
    labelShort: step.label,
  }));

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Behavior funnel</h2>
      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : chartData.length === 0 ? (
        <p className="py-8 text-sm text-gray-500">No funnel data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 60, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
            <XAxis
              type="number"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="labelShort"
              width={130}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-lg">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-gray-600">
                        {formatNumber(item.count)} users
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              fill="rgb(var(--brand-700))"
              radius={[4, 4, 4, 4]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

