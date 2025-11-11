import { useEffect, useMemo, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { formatCurrency } from '../../utils/currency';
import { formatDateOnly } from '../../utils/date';
import { useToast } from '../../components/ui/Toast';
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
import { SummaryCards } from './user-analytics/SummaryCards';
import { ActivityTrendCard } from './user-analytics/ActivityTrendCard';
import { PageEngagementCard } from './user-analytics/PageEngagementCard';
import { TopProductsCard } from './user-analytics/TopProductsCard';
import { TrafficOverviewCard } from './user-analytics/TrafficOverviewCard';
import { BehaviorFunnelCard } from './user-analytics/BehaviorFunnelCard';
import { UsersTable } from './user-analytics/UsersTable';
import { UserDetailModal } from './user-analytics/UserDetailModal';
import {
  ActivityPeriod,
  formatNumber,
  secondsFromMillis,
} from './user-analytics/utils';

type TopProduct = {
  productId: string;
  name: string;
  views: number;
  clicks: number;
  purchases: number;
};

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
  const topProducts: TopProduct[] = topProductsData?.getUserTopProducts ?? [];

  const { data: trafficData, loading: trafficLoading } = useQuery(
    GET_USER_TRAFFIC_OVERVIEW,
    { fetchPolicy: 'cache-and-network' },
  );
  const trafficOverview = trafficData?.getUserTrafficOverview;

  const { data: funnelData, loading: funnelLoading } = useQuery(
    GET_USER_BEHAVIOR_FUNNEL,
    { fetchPolicy: 'cache-and-network' },
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

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [fetchUserDetail, { data: detailData, loading: detailLoading }] =
    useLazyQuery(GET_USER_ANALYTICS_USER, {
      fetchPolicy: 'network-only',
    });
  const detail = detailData?.getUserAnalyticsUser ?? null;

  const [fetchExport, { loading: exportLoading }] = useLazyQuery(
    EXPORT_USERS_FOR_ANALYTICS,
    { fetchPolicy: 'network-only' },
  );

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
    void fetchUserDetail({ variables: { userId: user.userId } });
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedUserId(null);
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
                return '"' + asString.replace(/"/g, '""') + '"';
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
      link.download = 'user-analytics-' + new Date().toISOString() + '.csv';
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
          (row: any) =>
            '<tr>' +
            '<td>' +
            row.fullName +
            '</td>' +
            '<td>' +
            row.email +
            '</td>' +
            '<td>' +
            (row.country ?? '') +
            '</td>' +
            '<td>' +
            (row.region ?? '') +
            '</td>' +
            '<td>' +
            (row.createdAt ? formatDateOnly(row.createdAt) : '') +
            '</td>' +
            '<td>' +
            (row.totalOrders ?? 0) +
            '</td>' +
            '<td>' +
            formatCurrency(row.totalSpend ?? 0) +
            '</td>' +
            '<td>' +
            (row.totalSessions ?? 0) +
            '</td>' +
            '</tr>',
        )
        .join('');
      popup.document.write(
        '<html>' +
          '<head>' +
          '<title>User Analytics Export</title>' +
          '<style>' +
          'body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }' +
          'h1 { font-size: 20px; margin-bottom: 16px; }' +
          'table { border-collapse: collapse; width: 100%; }' +
          'th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }' +
          'th { background: #f9fafb; }' +
          '</style>' +
          '</head>' +
          '<body>' +
          '<h1>User Analytics Export</h1>' +
          '<table>' +
          '<thead>' +
          '<tr>' +
          '<th>Name</th>' +
          '<th>Email</th>' +
          '<th>Country</th>' +
          '<th>Region</th>' +
          '<th>Joined</th>' +
          '<th>Orders</th>' +
          '<th>Total Spend</th>' +
          '<th>Sessions</th>' +
          '</tr>' +
          '</thead>' +
          '<tbody>' +
          tableRows +
          '</tbody>' +
          '</table>' +
          '</body>' +
          '</html>',
      );
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
    if (!trafficOverview) return { country: 0, source: 0, device: 0 };
    const sumValues = (entries: Array<{ value: number }>) =>
      entries.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
    return {
      country: sumValues(trafficOverview.countries ?? []),
      source: sumValues(trafficOverview.sources ?? []),
      device: sumValues(trafficOverview.devices ?? []),
    };
  }, [trafficOverview]);

  const countryOptions = useMemo(
    () =>
      (trafficOverview?.countries ?? []).map((item: any) => ({
        value: item.label,
        label: item.label,
      })),
    [trafficOverview],
  );

  return (
    <>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-semibold theme-fg">User Analytics</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Understand how people discover, browse, and purchase on your store.
          </p>
        </div>

        <SummaryCards
          items={[
            { label: 'Total users', value: summary?.totalUsers },
            {
              label: 'New signups this month',
              value: summary?.newSignupsThisMonth,
            },
            { label: 'Active users today', value: summary?.activeUsersToday },
            {
              label: 'Returning users this week',
              value: summary?.returningUsersThisWeek,
            },
          ]}
          loading={summaryLoading}
        />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ActivityTrendCard
            period={activityPeriod}
            onPeriodChange={setActivityPeriod}
            data={activityPoints}
            loading={activityLoading}
          />
          <PageEngagementCard data={pageTrendPoints} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TopProductsCard
            products={topProducts}
            loading={topProductsLoading}
          />
          <div className="grid grid-cols-1 gap-4">
            <TrafficOverviewCard
              overview={trafficOverview}
              totals={trafficTotals}
              loading={trafficLoading}
            />
            <BehaviorFunnelCard data={funnelSteps} loading={funnelLoading} />
          </div>
        </section>

        <UsersTable
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          countryFilter={countryFilter}
          countryOptions={countryOptions}
          onCountryChange={(value) => {
            setCountryFilter(value);
            setUserPage(1);
          }}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          exportLoading={exportLoading}
          users={userItems}
          loading={usersLoading}
          page={userPage}
          pageSize={pageSize}
          totalUsers={userTotal}
          onPageChange={setUserPage}
          onRowClick={handleOpenDetail}
        />
      </div>

      <UserDetailModal
        open={detailOpen}
        onClose={handleCloseDetail}
        title={selectedUserName || 'User details'}
        loading={detailLoading}
        detail={detail}
      />
    </>
  );
}
