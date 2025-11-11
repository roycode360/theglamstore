import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { secondsFromMillis, formatNumber } from './utils';

type PageEngagementCardProps = {
  data: Array<{
    date: string;
    dateLabel: string;
    pageViews: number;
    sessions: number;
    averageSessionDuration: number | null;
  }>;
};

export function PageEngagementCard({ data }: PageEngagementCardProps) {
  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold">{current.dateLabel}</p>
          <p className="mt-1 text-xs text-gray-600">
            Page views:{' '}
            <span className="font-semibold">
              {formatNumber(current.pageViews)}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            Sessions:{' '}
            <span className="font-semibold">{formatNumber(current.sessions)}</span>
          </p>
          <p className="text-xs text-gray-600">
            Avg. session:{' '}
            <span className="font-semibold">
              {secondsFromMillis(current.averageSessionDuration)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Page visits &amp; engagement
        </h2>
        <p className="text-xs text-gray-500">
          Average session duration measured in seconds
        </p>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-500">
          No page visit data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              {/* Unique, darker gradients to match dashboard/analytics */}
              <linearGradient id="eng-pv-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
                <stop offset="60%" stopColor="#3b82f6" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="eng-sess-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value, index) => data[index]?.dateLabel}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
            <Tooltip content={renderTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="pageViews"
              name="Page views"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#eng-pv-gradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="sessions"
              name="Sessions"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#eng-sess-gradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

