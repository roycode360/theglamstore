import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import { LIST_ORDERS } from '../../graphql/orders';
import { ME } from '../../graphql/auth';

export default function CustomerOrdersPage() {
  const { data: meData } = useQuery(ME);
  const { data, loading, refetch } = useQuery(LIST_ORDERS, {
    fetchPolicy: 'cache-and-network',
  });
  const me = meData?.me;
  const all: any[] = data?.listOrders ?? [];
  const orders = me?.email ? all.filter((o) => o.email === me.email) : all;

  const statusClasses: Record<string, string> = {
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    confirmed: 'bg-blue-50 border-blue-200 text-blue-800',
    processing: 'bg-amber-50 border-amber-200 text-amber-800',
    shipped: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    delivered: 'bg-green-50 border-green-200 text-green-800',
    cancelled: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold theme-fg">My Orders</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Track your purchases and view order details
          </p>
        </div>
      </div>

      <div className="p-0 overflow-hidden border rounded-lg theme-card theme-border">
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading your orders" />
          </div>
        ) : orders.length === 0 ? (
          <div
            className="py-16 text-center"
            style={{ color: 'rgb(var(--muted))' }}
          >
            You have no orders yet.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr className="text-left">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {orders
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((o) => (
                      <tr key={o._id}>
                        <td className="px-4 py-3 font-mono text-xs">{o._id}</td>
                        <td className="px-4 py-3">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          ₦{Number(o.total).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
                              statusClasses[o.status] ?? 'theme-border'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Link
                              className="inline-flex items-center h-8 gap-2 px-3 text-xs bg-white border rounded-md theme-border text-brand hover:bg-brand-50"
                              to={`/orders/${o._id}`}
                            >
                              <span>View</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-3.5 w-3.5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M13.28 4.22a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06L18.94 12l-5.66-5.72a.75.75 0 0 1 0-1.06Z"
                                  clipRule="evenodd"
                                />
                                <path d="M3 12.75h15.5v-1.5H3v1.5Z" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="divide-y theme-border">
                {orders
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((o) => (
                    <div key={o._id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 font-mono text-xs text-gray-500">
                            Order ID
                          </div>
                          <div className="font-mono text-sm truncate">
                            {o._id}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
                            statusClasses[o.status] ?? 'theme-border'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="mb-1 text-xs text-gray-500">Date</div>
                          <div className="text-sm">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-gray-500">
                            Total
                          </div>
                          <div className="text-sm font-semibold">
                            ₦{Number(o.total).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          className="inline-flex items-center h-8 gap-2 px-3 text-xs bg-white border rounded-md theme-border text-brand hover:bg-brand-50"
                          to={`/orders/${o._id}`}
                        >
                          <span>View Details</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M13.28 4.22a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06L18.94 12l-5.66-5.72a.75.75 0 0 1 0-1.06Z"
                              clipRule="evenodd"
                            />
                            <path d="M3 12.75h15.5v-1.5H3v1.5Z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
