import { useQuery } from '@apollo/client';
import { useParams, Link } from 'react-router-dom';
import { GET_ORDER } from '../../graphql/orders';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { Skeleton } from '../../components/ui/Skeleton';

export default function CustomerOrderDetailsPage() {
  const { id } = useParams();
  const { data, loading } = useQuery(GET_ORDER, { variables: { id } });
  const order = data?.getOrder;

  const statusClasses: Record<string, string> = {
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    confirmed: 'bg-blue-50 border-blue-200 text-blue-800',
    processing: 'bg-amber-50 border-amber-200 text-amber-800',
    shipped: 'bg-gray-50 border-gray-200 text-gray-800',
    delivered: 'bg-green-50 border-green-200 text-green-800',
    cancelled: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className="px-4 py-10 space-y-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold theme-fg">Order Details</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Review your purchase information and status
          </p>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-lg theme-border text-brand hover:bg-brand-50 sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
          title="Back to Orders"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M10.72 4.22a.75.75 0 0 1 0 1.06L5.56 10.5H21a.75.75 0 0 1 0 1.5H5.56l5.16 5.22a.75.75 0 0 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">Back to Orders</span>
        </Link>
      </div>

      {loading ? (
        <CustomerOrderDetailsSkeleton />
      ) : !order ? (
        <div
          className="p-6 text-sm border rounded-lg theme-card theme-border"
          style={{ color: 'rgb(var(--muted))' }}
        >
          Order not found.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 border rounded-lg theme-card theme-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-sm">
                <div>
                  <span
                    className="mr-2 text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Order No
                  </span>
                  <span className="font-mono">
                    {order.orderNumber || order._id}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  Placed on {formatDate(order.createdAt)}
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${statusClasses[order.status] ?? 'theme-border'}`}
              >
                {order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="p-6 border rounded-lg theme-card theme-border md:col-span-2">
              <div className="mb-2 font-medium">Items</div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-hidden border rounded-md theme-border">
                  <table className="w-full text-sm">
                    <thead className="table-head">
                      <tr className="text-left">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Options</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y theme-border">
                      {order.items?.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 overflow-hidden bg-gray-100 rounded">
                                {it.image && (
                                  <img
                                    src={it.image}
                                    className="object-cover w-full h-full"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{it.name}</div>
                                <div
                                  className="text-xs"
                                  style={{ color: 'rgb(var(--muted))' }}
                                >
                                  ID: {it.productId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            Size: {it.selectedSize || '—'} · Color:{' '}
                            {it.selectedColor || '—'}
                          </td>
                          <td className="px-4 py-3">{it.quantity}</td>
                          <td className="px-4 py-3">
                            {formatCurrency(it.price ?? 0)}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {formatCurrency(
                              (it.price ?? 0) * (it.quantity ?? 0),
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!order.items || order.items.length === 0) && (
                        <tr>
                          <td
                            className="py-6 text-sm text-center"
                            colSpan={5}
                            style={{ color: 'rgb(var(--muted))' }}
                          >
                            No items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="-mx-4 md:hidden">
                {!order.items || order.items.length === 0 ? (
                  <div
                    className="py-6 text-sm text-center"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    No items
                  </div>
                ) : (
                  <div className="space-y-4">
                    {order.items.map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 border rounded-lg theme-border"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-16 h-16 overflow-hidden bg-gray-100 rounded">
                            {it.image && (
                              <img
                                src={it.image}
                                className="object-cover w-full h-full"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 text-sm font-medium">
                              {it.name}
                            </div>
                            <div
                              className="mb-2 text-xs"
                              style={{ color: 'rgb(var(--muted))' }}
                            >
                              ID: {it.productId}
                            </div>
                            <div className="text-xs text-gray-600">
                              Size: {it.selectedSize || '—'} · Color:{' '}
                              {it.selectedColor || '—'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="mb-1 text-xs text-gray-500">
                              Quantity
                            </div>
                            <div className="font-medium">{it.quantity}</div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">
                              Price
                            </div>
                            <div className="font-medium">
                              {formatCurrency(it.price ?? 0)}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">
                              Total
                            </div>
                            <div className="font-semibold">
                              {formatCurrency(
                                (it.price ?? 0) * (it.quantity ?? 0),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 text-sm border rounded-lg theme-card theme-border">
                <div className="mb-2 font-medium">Delivery</div>
                <div>
                  {order.firstName} {order.lastName}
                </div>
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  {order.email}
                </div>
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  {order.phone}
                </div>
                <div className="mt-2">{order.address1}</div>
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  {order.city}, {order.state}
                </div>
              </div>

              <div className="p-6 text-sm border rounded-lg theme-card theme-border">
                <div className="mb-2 font-medium">Payment</div>
                <div className="capitalize">
                  {order.paymentMethod?.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span>Status:</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 ${statusClasses[order.status] ?? 'theme-border'}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="p-6 text-sm border rounded-lg theme-card theme-border">
                <div className="mb-1">
                  Subtotal:{' '}
                  <span className="float-right">
                    {formatCurrency(order.subtotal ?? 0)}
                  </span>
                </div>

                <div className="pt-2 mt-2 text-lg font-semibold border-t">
                  Total
                  <span className="float-right">
                    {formatCurrency(order.total ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerOrderDetailsSkeleton() {
  const items = Array.from({ length: 3 });
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed theme-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 rounded-lg border border-dashed theme-border p-6 md:col-span-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-md border border-dashed theme-border">
              <table className="w-full">
                <thead className="table-head">
                  <tr className="text-left">
                    {['Product', 'Options', 'Qty', 'Price', 'Total'].map(
                      (heading) => (
                        <th key={heading} className="px-4 py-3">
                          <Skeleton className="h-3 w-16 rounded-full" />
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y border-t border-dashed theme-border">
                  {items.map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-md" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-full" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-3 w-32 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-3 w-10 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-3 w-16 rounded-md" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {items.map((_, idx) => (
              <div key={idx} className="rounded-lg border border-dashed p-4">
                <div className="mb-3 flex items-start gap-3">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-28 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-3 w-14 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-dashed theme-border p-6">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-md" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed theme-border p-6">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-40 rounded-full" />
              <Skeleton className="h-3 w-44 rounded-full" />
              <Skeleton className="h-3 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
