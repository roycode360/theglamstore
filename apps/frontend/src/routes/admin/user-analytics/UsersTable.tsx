import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { formatCurrency } from '../../../utils/currency';
import { formatDateOnly } from '../../../utils/date';
import { formatNumber } from './utils';
import { Skeleton } from '../../../components/ui/Skeleton';

type CountryOption = { value: string; label: string };

type UserRow = {
  userId: string;
  fullName: string;
  email: string;
  country?: string | null;
  region?: string | null;
  createdAt?: string | null;
  totalOrders?: number | null;
  totalSpend?: number | null;
  averageOrderValue?: number | null;
  totalSessions?: number | null;
  lastLoginAt?: string | null;
  lastSeenAt?: string | null;
};

type UsersTableProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  countryFilter: string;
  countryOptions: CountryOption[];
  onCountryChange: (value: string) => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  exportLoading: boolean;
  users: UserRow[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  onRowClick: (user: UserRow) => void;
};

export function UsersTable({
  searchTerm,
  onSearchChange,
  countryFilter,
  countryOptions,
  onCountryChange,
  onExportCsv,
  onExportPdf,
  exportLoading,
  users,
  loading,
  page,
  pageSize,
  totalUsers,
  onPageChange,
  onRowClick,
}: UsersTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const showingCount = (page - 1) * pageSize + Math.min(pageSize, users.length);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <p className="text-xs text-gray-500">
            Search, filter, and explore user engagement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email"
            className="focus-brand h-9 w-72 text-sm"
          />
          <Select
            value={countryFilter}
            onChange={(value) => onCountryChange(value)}
            options={[{ value: '', label: 'All countries' }, ...countryOptions]}
            className="h-9 w-48 text-sm"
          />
          <button
            onClick={onExportCsv}
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
            onClick={onExportPdf}
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
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-3 w-32 rounded-full" />
                      <Skeleton className="h-3 w-28 rounded-full" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-24 rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28 rounded-full" />
                      <Skeleton className="h-3 w-28 rounded-full" />
                    </div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                  No users found for this filter
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.userId}
                  onClick={() => onRowClick(user)}
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
                        <span className="font-medium text-gray-800">
                          {user.country}
                        </span>
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
                  <td className="px-4 py-3">
                    {formatCurrency(user.totalSpend ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(user.averageOrderValue ?? 0)}
                  </td>
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
          Showing {formatNumber(showingCount)} of {formatNumber(totalUsers)} users
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
              page === 1
                ? 'cursor-not-allowed border-gray-200 text-gray-300'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {formatNumber(totalPages)}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
              page >= totalPages
                ? 'cursor-not-allowed border-gray-200 text-gray-300'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

