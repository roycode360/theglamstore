import Select from '../../../components/ui/Select';
import { formatCurrency } from '../../../utils/currency';
import { formatDate, formatDateOnly } from '../../../utils/date';
import { ORDER_STATUS_OPTIONS, OrderListItem } from './types';

type OrdersListProps = {
  orders: OrderListItem[];
  updatingOrderId: string | null;
  statusClasses: Record<string, string>;
  onChangeStatus: (orderId: string, newStatus: string) => Promise<void>;
  onViewOrder: (orderId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function OrdersList({
  orders,
  updatingOrderId,
  statusClasses,
  onChangeStatus,
  onViewOrder,
  page,
  totalPages,
  onPageChange,
}: OrdersListProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  const handleStatusChange = async (
    orderId: string,
    nextStatus: string,
  ): Promise<void> => {
    const current = orders.find((order) => order._id === orderId);
    if (!nextStatus || !current || current.status === nextStatus) {
      return;
    }
    await onChangeStatus(orderId, nextStatus);
  };

  const renderStatusSelect = (order: OrderListItem) => (
    <div className="relative">
      <Select
        value={order.status}
        onChange={(status: string) => handleStatusChange(order._id, status)}
        options={ORDER_STATUS_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        disabled={updatingOrderId === order._id}
        buttonClassName={`${
          statusClasses[order.status] ??
          'theme-border text-brand-800 bg-yellow-50'
        } px-2 py-1 text-xs`}
        className="min-w-[160px]"
      />
      {updatingOrderId === order._id && (
        <div className="absolute inset-y-0 right-2 flex items-center">
          <span className="border-brand h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="theme-border overflow-visible rounded-md border">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr className="text-left">
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="theme-border divide-y">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-mono text-xs">
                    {order.orderNumber || order._id}
                  </td>
                  <td className="px-4 py-3">
                    {order.firstName} {order.lastName}
                    <div
                      className="text-xs"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      {order.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {order.paymentMethod?.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3">{renderStatusSelect(order)}</td>
                  <td className="px-4 py-3 text-xs">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        className="theme-border h-8 w-20 rounded-md border text-xs"
                        onClick={() => onViewOrder(order._id)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    className="py-10 text-center text-sm"
                    colSpan={7}
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {orders.length === 0 ? (
          <div
            className="py-10 text-center text-sm"
            style={{ color: 'rgb(var(--muted))' }}
          >
            No orders
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="theme-border rounded-lg border p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 font-mono text-xs text-gray-500">
                      Order No
                    </div>
                    <div className="truncate font-mono text-sm">
                      {order.orderNumber || order._id}
                    </div>
                  </div>
                  <div className="relative">
                    <Select
                      value={order.status}
                      onChange={(status: string) =>
                        handleStatusChange(order._id, status)
                      }
                      options={ORDER_STATUS_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      disabled={updatingOrderId === order._id}
                      buttonClassName={`${
                        statusClasses[order.status] ??
                        'theme-border text-brand-800 bg-yellow-50'
                      } px-2 py-1 text-xs`}
                      className="min-w-[120px]"
                    />
                    {updatingOrderId === order._id && (
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <span className="border-brand h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-1 text-xs text-gray-500">Customer</div>
                  <div className="text-sm font-medium">
                    {order.firstName} {order.lastName}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    {order.email}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Total</div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Payment</div>
                    <div className="text-sm capitalize">
                      {order.paymentMethod?.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-1 text-xs text-gray-500">Date</div>
                  <div className="text-sm">{formatDateOnly(order.createdAt)}</div>
                </div>

                <div className="flex justify-end">
                  <button
                    className="theme-border h-8 w-20 rounded-md border text-xs"
                    onClick={() => onViewOrder(order._id)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-3">
        <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
          Page {page} of {safeTotalPages}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-ghost h-9 rounded-md px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="btn-primary h-9 rounded-md px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
            disabled={page >= safeTotalPages}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

