import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Spinner from '../../../components/ui/Spinner';
import { ActivityPeriod, formatNumber } from './utils';

type ActivityTrendCardProps = {
  period: ActivityPeriod;
  onPeriodChange: (period: ActivityPeriod) => void;
  data: Array<{
    date: string;
    dateLabel: string;
    activeUsers: number;
    sessions: number;
    newUsers: number;
  }>;
  loading: boolean;
};

const PERIOD_OPTIONS: ActivityPeriod[] = ['daily', 'weekly'];

export function ActivityTrendCard({
  period,
  onPeriodChange,
  data,
  loading,
}: ActivityTrendCardProps) {
  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold">{current.dateLabel}</p>
          <p className="mt-1 text-xs text-gray-600">
            Active users:{' '}
            <span className="font-semibold">
              {formatNumber(current.activeUsers)}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            Sessions:{' '}
            <span className="font-semibold">{formatNumber(current.sessions)}</span>
          </p>
          <p className="text-xs text-gray-600">
            New users:{' '}
            <span className="font-semibold">{formatNumber(current.newUsers)}</span>
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
          User activity over time
        </h2>
        <div className="flex items-center gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => onPeriodChange(option)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                period === option
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option === 'daily' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-500">
          No activity data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
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
            <Line
              type="monotone"
              dataKey="activeUsers"
              name="Active users"
              stroke="rgb(var(--brand-700))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="sessions"
              name="Sessions"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="newUsers"
              name="New users"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

