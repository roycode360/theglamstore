import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency } from '../../utils/currency';
import { formatDateOnly } from '../../utils/date';
import {
  GET_USER_ANALYTICS_SUMMARY,
  GET_USER_ACTIVITY_TREND,
  GET_USER_PAGE_VISIT_TREND,
  GET_USER_TOP_PRODUCTS,
  GET_USER_TRAFFIC_OVERVIEW,
  GET_USER_BEHAVIOR_FUNNEL,
  LIST_USERS_FOR_ANALYTICS,
  GET_USER_ANALYTICS_USER,
  EXPORT_USERS_FOR_ANALYTICS,
} from '../../graphql/userAnalytics';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

type ActivityPeriod = 'daily' | 'weekly';

function formatNumber(value: number | null | undefined) {
  if (value == null) return '0';
  return Number(value).toLocaleString('en-US');
}

function secondsFromMillis(value: number | null | undefined) {
  if (!value || value <= 0) return '0s';
  const seconds = Math.round(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export default function AdminUserAnalyticsPage() {
  const { showToast } = useToast();
  const { data: summaryData, loading: summaryLoading } = useQuery(
    GET_USER_ANALYTICS_SUMMARY,
    { fetchPolicy: 'cache-and-network' },
  );
  const summary = summaryData?.getUserAnalyticsSummary;

  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>('daily');
  const { data: activityData, loading: activityLoading } = useQuery(
    GET_USER_ACTIVITY_TREND,
    {
      variables: {
        period: activityPeriod,
        days: activityPeriod === 'daily' ? 14 : 12,
      },
      fetchPolicy: 'cache-and-network',
    },
  );
  const activityPoints =
    activityData?.getUserActivityTrend?.map((point: any) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    })) ?? [];

  const { data: pageTrendData } = useQuery(GET_USER_PAGE_VISIT_TREND, {
    variables: { range: null },
    fetchPolicy: 'cache-and-network',
  });
  const pageTrendPoints =
    pageTrendData?.getUserPageVisitTrend?.map((point: any) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    })) ?? [];

  const { data: topProductsData, loading: topProductsLoading } = useQuery(
    GET_USER_TOP_PRODUCTS,
    {
      variables: { limit: 5 },
      fetchPolicy: 'cache-and-network',
    },
  );
  const topProducts = topProductsData?.getUserTopProducts ?? [];

  const { data: trafficData, loading: trafficLoading } = useQuery(
    GET_USER_TRAFFIC_OVERVIEW,
    {
      fetchPolicy: 'cache-and-network',
    },
  );
  const trafficOverview = trafficData?.getUserTrafficOverview;

  const { data: funnelData, loading: funnelLoading } = useQuery(
    GET_USER_BEHAVIOR_FUNNEL,
    {
      fetchPolicy: 'cache-and-network',
    },
  );
  const funnelSteps = funnelData?.getUserBehaviorFunnel ?? [];

  const [userPage, setUserPage] = useState(1);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setUserPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(LIST_USERS_FOR_ANALYTICS, {
    variables: {
      input: {
        page: userPage,
        pageSize,
        search: debouncedSearch || undefined,
        country: countryFilter || undefined,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    void refetchUsers({
      input: {
        page: userPage,
        pageSize,
        search: debouncedSearch || undefined,
        country: countryFilter || undefined,
      },
    });
  }, [userPage, debouncedSearch, countryFilter, pageSize, refetchUsers]);

  const userPageData = usersData?.listUsersForAnalytics;
  const userItems = userPageData?.items ?? [];
  const userTotal = userPageData?.total ?? 0;
  const totalUserPages = Math.max(1, Math.ceil(userTotal / pageSize));

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [
    fetchUserDetail,
    { data: detailData, loading: detailLoading },
  ] = useLazyQuery(GET_USER_ANALYTICS_USER, {
    fetchPolicy: 'network-only',
  });
  const detail = detailData?.getUserAnalyticsUser ?? null;

  const [
    fetchExport,
    { loading: exportLoading },
  ] = useLazyQuery(EXPORT_USERS_FOR_ANALYTICS, {
    fetchPolicy: 'network-only',
  });

  const buildExportInput = () => ({
    page: 1,
    pageSize: 5000,
    search: debouncedSearch || undefined,
    country: countryFilter || undefined,
  });

  const handleOpenDetail = (user: any) => {
    setSelectedUserName(user.fullName);
    setSelectedUserId(user.userId);
    setDetailOpen(true);
    void fetchUserDetail({
      variables: { userId: user.userId },
    });
  };

  const handleExportCsv = async () => {
    try {
      const { data } = await fetchExport({
        variables: { input: buildExportInput() },
      });
      const rows = data?.exportUsersForAnalytics?.rows ?? [];
      if (!rows.length) {
        showToast('No data available to export right now.', 'warning');
        return;
      }
      const header = [
        'Name',
        'Email',
        'Country',
        'Region',
        'Joined',
        'Last Login',
        'Last Seen',
        'Total Orders',
        'Total Spend',
        'Average Order',
        'Sessions',
      ];
      const csvLines = [
        header.join(','),
        ...rows.map((row: any) =>
          [
            row.fullName,
            row.email,
            row.country ?? '',
            row.region ?? '',
            row.createdAt ? formatDateOnly(row.createdAt) : '',
            row.lastLoginAt ? formatDateOnly(row.lastLoginAt) : '',
            row.lastSeenAt ? formatDateOnly(row.lastSeenAt) : '',
            row.totalOrders ?? 0,
            row.totalSpend ?? 0,
            row.averageOrderValue ?? 0,
            row.totalSessions ?? 0,
          ]
            .map((value) => {
              const asString = String(value ?? '');
              if (asString.includes(',') || asString.includes('"')) {
                return `"${asString.replace(/"/g, '""')}"`;
              }
              return asString;
            })
            .join(','),
        ),
      ];
      const blob = new Blob([csvLines.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-analytics-${new Date().toISOString()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      showToast('CSV export generated.', 'success');
    } catch (error: any) {
      showToast(
        error?.message || 'Unable to export CSV at the moment.',
        'error',
      );
    }
  };

  const handleExportPdf = async () => {
    try {
      const { data } = await fetchExport({
        variables: { input: buildExportInput() },
      });
      const rows = data?.exportUsersForAnalytics?.rows ?? [];
      if (!rows.length) {
        showToast('No data available to export right now.', 'warning');
        return;
      }
      const popup = window.open('', '_blank');
      if (!popup) {
        showToast(
          'Pop-up blocked. Please allow pop-ups to export as PDF.',
          'error',
        );
        return;
      }
      const tableRows = rows
        .map(
          (row: any) => `
            <tr>
              <td>${row.fullName}</td>
              <td>${row.email}</td>
              <td>${row.country ?? ''}</td>
              <td>${row.region ?? ''}</td>
              <td>${row.createdAt ? formatDateOnly(row.createdAt) : ''}</td>
              <td>${row.totalOrders ?? 0}</td>
              <td>${formatCurrency(row.totalSpend ?? 0)}</td>
              <td>${row.totalSessions ?? 0}</td>
            </tr>
          `,
        )
        .join('');
      popup.document.write(`
        <html>
          <head>
            <title>User Analytics Export</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
              h1 { font-size: 20px; margin-bottom: 16px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
              th { background: #f9fafb; }
            </style>
          </head>
          <body>
            <h1>User Analytics Export</h1>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Country</th>
                  <th>Region</th>
                  <th>Joined</th>
                  <th>Orders</th>
                  <th>Total Spend</th>
                  <th>Sessions</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </body>
        </html>
      `);
      popup.document.close();
      popup.focus();
      popup.print();
      showToast('PDF export opened in a new tab.', 'success');
    } catch (error: any) {
      showToast(
        error?.message || 'Unable to export PDF at the moment.',
        'error',
      );
    }
  };

  const trafficTotals = useMemo(() => {
    if (!trafficOverview)
      return { country: 0, source: 0, device: 0 };
    const sumValues = (entries: Array<{ value: number }>) =>
      entries.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
    return {
      country: sumValues(trafficOverview.countries ?? []),
      source: sumValues(trafficOverview.sources ?? []),
      device: sumValues(trafficOverview.devices ?? []),
    };
  }, [trafficOverview]);

  const activityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold">{current.dateLabel}</p>
          <p className="mt-1 text-xs text-gray-600">
            Active users: <span className="font-semibold">{formatNumber(current.activeUsers)}</span>
          </p>
          <p className="text-xs text-gray-600">
            Sessions: <span className="font-semibold">{formatNumber(current.sessions)}</span>
          </p>
          <p className="text-xs text-gray-600">
            New users: <span className="font-semibold">{formatNumber(current.newUsers)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const pageTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold">{current.dateLabel}</p>
          <p className="mt-1 text-xs text-gray-600">
            Page views: <span className="font-semibold">{formatNumber(current.pageViews)}</span>
          </p>
          <p className="text-xs text-gray-600">
            Sessions: <span className="font-semibold">{formatNumber(current.sessions)}</span>
          </p>
          <p className="text-xs text-gray-600">
            Avg. session: <span className="font-semibold">{secondsFromMillis(current.averageSessionDuration)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const funnelDataChart = funnelSteps.map((step: any) => ({
    ...step,
    labelShort: step.label,
  }));

  return (
    <>
      <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold theme-fg">User Analytics</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Understand how people discover, browse, and purchase on your store.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total users',
            value: summary?.totalUsers,
          },
          {
            label: 'New signups this month',
            value: summary?.newSignupsThisMonth,
          },
          {
            label: 'Active users today',
            value: summary?.activeUsersToday,
          },
          {
            label: 'Returning users this week',
            value: summary?.returningUsersThisWeek,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            {summaryLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-black"></div>
              </div>
            ) : (
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(card.value)}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              User activity over time
            </h2>
            <div className="flex items-center gap-2">
              {(['daily', 'weekly'] as ActivityPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setActivityPeriod(period)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activityPeriod === period
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === 'daily' ? 'Daily' : 'Weekly'}
                </button>
              ))}
            </div>
          </div>
          {activityLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : activityPoints.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500">
              No activity data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={activityPoints}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value, index) => activityPoints[index]?.dateLabel}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip content={activityTooltip} />
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

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Page visits & engagement
            </h2>
            <p className="text-xs text-gray-500">
              Average session duration measured in seconds
            </p>
          </div>
          {pageTrendPoints.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500">
              No page visit data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={pageTrendPoints}>
                <defs>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(59 130 246)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="rgb(59 130 246)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(16 185 129)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="rgb(16 185 129)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value, index) => pageTrendPoints[index]?.dateLabel}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={pageTrendTooltip} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page views"
                  stroke="rgb(59 130 246)"
                  fillOpacity={1}
                  fill="url(#colorPageViews)"
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="rgb(16 185 129)"
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Top viewed products
            </h2>
          </div>
          {topProductsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              No product engagement data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Views</th>
                    <th className="px-4 py-2">Clicks</th>
                    <th className="px-4 py-2">Purchases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((product: any) => (
                    <tr key={product.productId}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.productId}</p>
                      </td>
                      <td className="px-4 py-2">{formatNumber(product.views)}</td>
                      <td className="px-4 py-2">{formatNumber(product.clicks)}</td>
                      <td className="px-4 py-2">{formatNumber(product.purchases)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Traffic overview</h2>
            {trafficLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : !trafficOverview ? (
              <p className="py-8 text-sm text-gray-500">No traffic data yet</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { title: 'Top countries', data: trafficOverview.countries, total: trafficTotals.country },
                  { title: 'Top sources', data: trafficOverview.sources, total: trafficTotals.source },
                  { title: 'Top devices', data: trafficOverview.devices, total: trafficTotals.device },
                ].map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {(section.data ?? []).slice(0, 5).map((item: any) => {
                        const percent =
                          section.total > 0
                            ? Math.round((item.value / section.total) * 100)
                            : 0;
                        return (
                          <div
                            key={`${section.title}-${item.label}`}
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
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      {(section.data ?? []).length === 0 && (
                        <p className="text-xs text-gray-500">
                          No data available
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Behavior funnel</h2>
            {funnelLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : funnelDataChart.length === 0 ? (
              <p className="py-8 text-sm text-gray-500">No funnel data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={funnelDataChart}
                  layout="vertical"
                  margin={{ left: 60, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
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
                  <Bar dataKey="count" fill="rgb(var(--brand-700))" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Users
            </h2>
            <p className="text-xs text-gray-500">
              Search, filter, and explore user engagement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="h-9 w-72 text-sm focus-brand"
            />
            <Select
              value={countryFilter}
              onChange={(value) => {
                setCountryFilter(value);
                setUserPage(1);
              }}
              options={[
                { value: '', label: 'All countries' },
                ...(trafficOverview?.countries ?? []).map((item: any) => ({
                  value: item.label,
                  label: item.label,
                })),
              ]}
              className="h-9 w-48 text-sm"
            />
            <button
              onClick={handleExportCsv}
              disabled={exportLoading}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                exportLoading
                  ? 'cursor-not-allowed border-gray-200 text-gray-300'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exportLoading}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                exportLoading
                  ? 'cursor-not-allowed border-gray-200 text-gray-300'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Country</th>
                <th className="px-4 py-2 text-left">Orders</th>
                <th className="px-4 py-2 text-left">Total spend</th>
                <th className="px-4 py-2 text-left">Avg. order</th>
                <th className="px-4 py-2 text-left">Sessions</th>
                <th className="px-4 py-2 text-left">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : userItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                    No users found for this filter
                  </td>
                </tr>
              ) : (
                userItems.map((user: any) => (
                  <tr
                    key={user.userId}
                    onClick={() => handleOpenDetail(user)}
                    className="cursor-pointer transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined {user.createdAt ? formatDateOnly(user.createdAt) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {user.country ? (
                        <>
                          <span className="font-medium text-gray-800">{user.country}</span>
                          {user.region && (
                            <span className="ml-1 text-xs text-gray-500">
                              · {user.region}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">
                        {formatNumber(user.totalOrders)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(user.totalSpend)}</td>
                    <td className="px-4 py-3">{formatCurrency(user.averageOrderValue)}</td>
                    <td className="px-4 py-3">{formatNumber(user.totalSessions)}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">
                        <div>
                          Last login:{' '}
                          <span className="font-medium text-gray-800">
                            {user.lastLoginAt ? formatDateOnly(user.lastLoginAt) : '—'}
                          </span>
                        </div>
                        <div>
                          Last seen:{' '}
                          <span className="font-medium text-gray-800">
                            {user.lastSeenAt ? formatDateOnly(user.lastSeenAt) : '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Showing {(userPage - 1) * pageSize + Math.min(pageSize, userItems.length)} of{' '}
            {formatNumber(userTotal)} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
              disabled={userPage === 1}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                userPage === 1
                  ? 'cursor-not-allowed border-gray-200 text-gray-300'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {userPage} of {formatNumber(totalUserPages)}
            </span>
            <button
              onClick={() => setUserPage((prev) => Math.min(totalUserPages, prev + 1))}
              disabled={userPage >= totalUserPages}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                userPage >= totalUserPages
                  ? 'cursor-not-allowed border-gray-200 text-gray-300'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedUserName || 'User details'}
        widthClassName="max-w-5xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner label="Loading user insights..." />
          </div>
        ) : !detail ? (
          <p className="py-6 text-sm text-gray-500">
            No analytics available for this user.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Email', value: detail.email },
                {
                  label: 'Location',
                  value: detail.country
                    ? `${detail.country}${detail.region ? ` · ${detail.region}` : ''}`
                    : '—',
                },
                {
                  label: 'Joined',
                  value: detail.createdAt ? formatDateOnly(detail.createdAt) : '—',
                },
                {
                  label: 'Last login',
                  value: detail.lastLoginAt ? formatDateOnly(detail.lastLoginAt) : '—',
                },
                {
                  label: 'Last seen',
                  value: detail.lastSeenAt ? formatDateOnly(detail.lastSeenAt) : '—',
                },
                {
                  label: 'Lifetime orders',
                  value: formatNumber(detail.lifetimeOrders),
                },
                {
                  label: 'Lifetime spend',
                  value: formatCurrency(detail.lifetimeSpend ?? 0),
                },
                {
                  label: 'Total sessions',
                  value: formatNumber(detail.totalSessions),
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Recent orders
                </h3>
                <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Order</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Total</th>
                        <th className="px-3 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {detail.recentOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-4 text-center text-gray-500"
                          >
                            No orders yet
                          </td>
                        </tr>
                      ) : (
                        detail.recentOrders.map((order: any) => (
                          <tr key={order.orderId}>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {order.orderNumber || order.orderId}
                            </td>
                            <td className="px-3 py-2 capitalize text-gray-600">
                              {order.status}
                            </td>
                            <td className="px-3 py-2">
                              {formatCurrency(order.total ?? 0)}
                            </td>
                            <td className="px-3 py-2">
                              {order.createdAt ? formatDateOnly(order.createdAt) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Recent activity
                </h3>
                <div className="mt-2 max-h-72 overflow-y-auto space-y-3 rounded-lg border border-gray-200 bg-white p-3">
                  {detail.recentEvents.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No recent activity logs.
                    </p>
                  ) : (
                    detail.recentEvents.map((event: any, idx: number) => (
                      <div key={`${event.createdAt}-${idx}`}>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-semibold text-gray-800">
                            {event.eventType.replace(/_/g, ' ')}
                          </span>
                          <span>{formatDateOnly(event.createdAt)}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                          {event.page && (
                            <span>
                              <span className="font-semibold">Page:</span> {event.page}
                            </span>
                          )}
                          {event.productId && (
                            <span>
                              <span className="font-semibold">Product:</span>{' '}
                              {event.productId}
                            </span>
                          )}
                          {event.device && (
                            <span>
                              <span className="font-semibold">Device:</span>{' '}
                              {event.device}
                            </span>
                          )}
                          {event.country && (
                            <span>
                              <span className="font-semibold">Country:</span>{' '}
                              {event.country}
                            </span>
                          )}
                          {event.source && (
                            <span>
                              <span className="font-semibold">Source:</span>{' '}
                              {event.source}
                            </span>
                          )}
                          {event.medium && (
                            <span>
                              <span className="font-semibold">Medium:</span>{' '}
                              {event.medium}
                            </span>
                          )}
                          {event.durationMs ? (
                            <span>
                              <span className="font-semibold">Duration:</span>{' '}
                              {secondsFromMillis(event.durationMs)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

