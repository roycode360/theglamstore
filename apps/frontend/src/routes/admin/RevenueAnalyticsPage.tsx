import { useQuery } from '@apollo/client';
import { formatCurrency } from '../../utils/currency';
import RevenueTrendChart from '../../components/charts/RevenueTrendChart';
import ProfitCostChart from '../../components/charts/ProfitCostChart';
import TopSellingProductsTable from '../../components/tables/TopSellingProductsTable';
import {
  GET_ANALYTICS,
  GET_REVENUE_TREND,
  GET_PROFIT_COST_COMPARISON,
  GET_TOP_SELLING_PRODUCTS,
} from '../../graphql/analytics';
import { Skeleton } from '../../components/ui/Skeleton';

export default function RevenueAnalyticsPage() {
  const { data: analyticsData, loading: analyticsLoading } = useQuery(
    GET_ANALYTICS,
    {
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: revenueTrendData, loading: revenueTrendLoading } = useQuery(
    GET_REVENUE_TREND,
    {
      variables: { period: 'daily' },
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: profitCostData, loading: profitCostLoading } = useQuery(
    GET_PROFIT_COST_COMPARISON,
    {
      variables: { period: 'daily' },
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: topProductsData, loading: topProductsLoading } = useQuery(
    GET_TOP_SELLING_PRODUCTS,
    {
      variables: { limit: 10 },
      fetchPolicy: 'cache-and-network',
    },
  );

  const isLoading =
    analyticsLoading ||
    revenueTrendLoading ||
    profitCostLoading ||
    topProductsLoading;

  const initialLoading =
    isLoading &&
    !analyticsData &&
    !revenueTrendData &&
    !profitCostData &&
    !topProductsData;

  const analytics = analyticsData?.getAnalytics;
  const revenueTrend = revenueTrendData?.getRevenueTrend?.points ?? [];
  const profitCost = profitCostData?.getProfitCostComparison?.points ?? [];
  const topProducts = topProductsData?.getTopSellingProducts?.products ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Revenue Analytics</h2>
          <p className="mt-1 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Key business metrics and performance insights
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <div className="text-right">
            <div
              className="flex items-center text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              <div className="flex h-6 w-6 items-center justify-center bg-white text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-4 w-4"
                >
                  <path d="M3 7h18v13H3z" />
                  <path d="M16 3h-8l-1 4h10l-1-4Z" />
                </svg>
              </div>
              <p>
                <span>Inventory Value</span>
              </p>
            </div>
            <div className="text-2xl font-semibold">
              {analytics?.inventoryValue
                ? formatCurrency(analytics.inventoryValue)
                : formatCurrency(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {initialLoading ? (
        <AnalyticsMetricsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Total Revenue
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {analytics?.totalRevenue
                  ? formatCurrency(analytics.totalRevenue)
                  : formatCurrency(0)}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <span className="font-semibold text-emerald-700">₦</span>
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Total Profit
              </div>
              <div
                className={`mt-2 text-2xl font-semibold ${
                  analytics?.totalProfit && analytics.totalProfit < 0
                    ? 'text-red-600'
                    : ''
                }`}
              >
                {analytics?.totalProfit
                  ? formatCurrency(analytics.totalProfit)
                  : formatCurrency(0)}
              </div>
            </div>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                analytics?.totalProfit && analytics.totalProfit < 0
                  ? 'border-red-200 bg-red-50'
                  : 'border-emerald-200 bg-emerald-50'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
                style={{
                  color:
                    analytics?.totalProfit && analytics.totalProfit < 0
                      ? '#dc2626'
                      : '#059669',
                }}
              >
                <path d="M3 3v18h18" />
                <path d="M7 12l4-4 4 4 6-6" />
                <path d="M21 12h-6v6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Cost Price */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Total Cost Price
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {analytics?.totalCostPrice
                  ? formatCurrency(analytics.totalCostPrice)
                  : formatCurrency(0)}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
              <span className="font-semibold text-amber-700">₦</span>
            </div>
          </div>
        </div>

        {/* Total Selling Price */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Total Selling Price
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {analytics?.totalSellingPrice
                  ? formatCurrency(analytics.totalSellingPrice)
                  : formatCurrency(0)}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
              <span className="font-semibold text-blue-700">₦</span>
            </div>
          </div>
        </div>

        {/* Number of Customers */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Customers
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {analytics?.numberOfCustomers ?? 0}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5 text-slate-600"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>

        {/* Number of Returning Customers */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Returning Customers
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {analytics?.numberOfReturningCustomers ?? 0}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5 text-emerald-700"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 11v2a4 4 0 0 1-4 4H9" />
                <path d="M22 11a4 4 0 0 0-8 0" />
              </svg>
            </div>
          </div>
        </div>

        {/* Number of Completed Orders */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Completed Orders
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {analytics?.numberOfCompletedOrders ?? 0}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5 text-blue-700"
              >
                <path d="M3 6h2l2.4 9.6A2 2 0 0 0 9.35 17H17a2 2 0 0 0 1.94-1.52L20.5 9H6" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="20" cy="20" r="1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Products Sold */}
        <div className="theme-border rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Products Sold
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {analytics?.totalProductsSold ?? 0}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5 text-indigo-700"
              >
                <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
                <path d="M12 12 20 8" />
                <path d="M12 12v9" />
                <path d="M12 12 4 8" />
              </svg>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Revenue Trend Chart */}
      <div className="theme-border rounded-lg border bg-white p-6">
        {initialLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <RevenueTrendChart />
        )}
      </div>

      {/* Profit vs Cost Comparison Chart */}
      <div className="theme-border rounded-lg border bg-white p-6">
        {initialLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <ProfitCostChart />
        )}
      </div>

      {/* Top Selling Products Table */}
      <div className="theme-border rounded-lg border bg-white p-6">
        {initialLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <TopSellingProductsTable limit={10} />
        )}
      </div>
    </div>
  );
}

function AnalyticsMetricsSkeleton() {
  const cards = Array.from({ length: 8 });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((_, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-dashed border-gray-200 bg-white p-4"
        >
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-3 h-6 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );
}
