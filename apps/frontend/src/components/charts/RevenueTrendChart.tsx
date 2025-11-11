import {
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_REVENUE_TREND } from '../../graphql/analytics';

interface RevenueTrendChartProps {
  className?: string;
}

export default function RevenueTrendChart({
  className,
}: RevenueTrendChartProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data, loading } = useQuery(GET_REVENUE_TREND, {
    variables: { period },
    fetchPolicy: 'cache-and-network',
  });

  const points = data?.getRevenueTrend?.points ?? [];

  // Format date labels based on period
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case 'daily':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      case 'weekly':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      default:
        return dateStr;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 bg-white border rounded-lg shadow-lg"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <p className="text-sm font-medium">
            {formatDateLabel(payload[0].payload.date)}
          </p>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: 'rgb(var(--brand-700))' }}
          >
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Revenue Trend</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriod('daily')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === 'daily'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === 'weekly'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-black"></div>
        </div>
      ) : points.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            No revenue data available
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={points}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(var(--brand-700))"
                  stopOpacity={0.28}
                />
                <stop
                  offset="60%"
                  stopColor="rgb(var(--brand-700))"
                  stopOpacity={0.12}
                />
                <stop
                  offset="100%"
                  stopColor="rgb(var(--brand-700))"
                  stopOpacity={0.04}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(value) => {
                if (value >= 1000000)
                  return `₦${(value / 1000000).toFixed(2)}M`;
                if (value >= 1000) return `₦${(value / 1000).toFixed(2)}K`;
                return formatCurrency(value);
              }}
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill="url(#revenueGradient)"
              fillOpacity={1}
              dot={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="rgb(var(--brand-700))"
              strokeWidth={2}
              dot={{ fill: 'rgb(var(--brand-700))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
