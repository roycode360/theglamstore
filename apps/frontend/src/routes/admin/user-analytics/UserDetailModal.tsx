import Modal from '../../../components/ui/Modal';
import { formatCurrency } from '../../../utils/currency';
import { formatDateOnly } from '../../../utils/date';
import { formatNumber, secondsFromMillis } from './utils';
import { Skeleton } from '../../../components/ui/Skeleton';

type UserDetailModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  detail: any;
};

export function UserDetailModal({
  open,
  onClose,
  title,
  loading,
  detail,
}: UserDetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} widthClassName="max-w-5xl">
      {loading ? (
        <UserDetailSkeleton />
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
              <h3 className="text-sm font-semibold text-gray-900">Recent orders</h3>
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
              <h3 className="text-sm font-semibold text-gray-900">Recent activity</h3>
              <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
                {detail.recentEvents.length === 0 ? (
                  <p className="text-xs text-gray-500">No recent activity logs.</p>
                ) : (
                  detail.recentEvents.map((event: any, idx: number) => (
                    <div key={`${event.createdAt}-${idx}`} className="space-y-1 pb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-semibold text-gray-800">
                          {event.eventType.replace(/_/g, ' ')}
                        </span>
                        <span>{formatDateOnly(event.createdAt)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
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
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx}>
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="mt-2 h-4 w-32 rounded-md" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

