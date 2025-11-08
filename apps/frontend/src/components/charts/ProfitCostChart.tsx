import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PROFIT_COST_COMPARISON } from '../../graphql/analytics';

interface ProfitCostChartProps {
  className?: string;
}

export default function ProfitCostChart({ className }: ProfitCostChartProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data, loading } = useQuery(GET_PROFIT_COST_COMPARISON, {
    variables: { period },
    fetchPolicy: 'cache-and-network',
  });

  const points = data?.getProfitCostComparison?.points ?? [];

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
          className="rounded-lg border bg-white p-3 shadow-lg"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <p className="text-sm font-medium">
            {formatDateLabel(payload[0].payload.date)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="mt-1 text-sm font-semibold"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profit vs Cost Comparison</h3>
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
        </div>
      ) : points.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            No profit/cost data available
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={points}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
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
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
              formatter={(value) => (
                <span style={{ color: '#6b7280', fontSize: '12px' }}>
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="profit"
              name="Profit"
              fill="rgb(var(--brand-700))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="cost"
              name="Cost"
              fill="#9ca3af"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
