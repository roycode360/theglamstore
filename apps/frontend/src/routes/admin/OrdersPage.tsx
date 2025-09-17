import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import {
  GET_ORDER,
  LIST_ORDERS_PAGE,
  UPDATE_ORDER_STATUS,
  DELETE_ORDER,
} from '../../graphql/orders';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';

type OrderListItem = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [paymentFilter] = useState<string | undefined>(undefined);
  const [startDate] = useState<string | undefined>(undefined);
  const [endDate] = useState<string | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, loading, refetch } = useQuery(LIST_ORDERS_PAGE, {
    variables: {
      page,
      pageSize,
      status: statusFilter || null,
      // removed filters
    },
    fetchPolicy: 'cache-and-network',
  });
  const orders: OrderListItem[] = data?.listOrdersPage?.items ?? [];
  const totalPages: number = data?.listOrdersPage?.totalPages ?? 1;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fetchOrder, { data: orderData, loading: orderLoading }] =
    useLazyQuery(GET_ORDER);
  const [updateStatus, { loading: updating }] =
    useMutation(UPDATE_ORDER_STATUS);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteOrderMutation, { loading: deleting }] = useMutation(
    DELETE_ORDER,
    {
      update(cache, { data: delData }, { variables }) {
        if (!delData?.deleteOrder) return;
        try {
          cache.updateQuery(
            {
              query: LIST_ORDERS_PAGE,
              variables: {
                page,
                pageSize,
                status: statusFilter || null,
                paymentMethod: paymentFilter || null,
                startDate: startDate || null,
                endDate: endDate || null,
              },
            },
            (existing: any) => {
              if (!existing?.listOrdersPage?.items) return existing;
              return {
                ...existing,
                listOrdersPage: {
                  ...existing.listOrdersPage,
                  items: existing.listOrdersPage.items.filter(
                    (o: any) => o._id !== variables?.id,
                  ),
                },
              };
            },
          );
        } catch {}
      },
    },
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { showToast } = useToast();
  const [proofOpen, setProofOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  // Open order details if id is present in query string
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedId(id);
      fetchOrder({ variables: { id } });
    }
  }, [searchParams]);

  // Auto-scroll to order details when a selection is present and data is ready
  useEffect(() => {
    if (selectedId && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedId, orderData]);

  const statusClasses: Record<string, string> = {
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    confirmed: 'bg-blue-50 border-blue-200 text-blue-800',
    processing: 'bg-amber-50 border-amber-200 text-amber-800',
    shipped: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    delivered: 'bg-green-50 border-green-200 text-green-800',
    cancelled: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Orders</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Track and fulfill customer orders.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 text-sm rounded-md btn-ghost h-9"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            className="block mb-1 text-xs"
            style={{ color: 'rgb(var(--muted))' }}
          >
            Status
          </label>
          <Select
            value={statusFilter || ''}
            onChange={(v) => {
              setPage(1);
              setStatusFilter(v || undefined);
            }}
            options={[
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            buttonClassName="px-2 py-2 text-sm"
          />
        </div>
      </div>
      {loading ? (
        <div className="py-10">
          <Spinner label="Loading orders" />
        </div>
      ) : (
        <div className="overflow-visible border rounded-md theme-border">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr className="text-left">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-3 font-mono text-xs">{o._id}</td>
                  <td className="px-4 py-3">
                    {o.firstName} {o.lastName}
                    <div
                      className="text-xs"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      {o.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ₦{Number(o.total).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {o.paymentMethod?.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <Select
                        value={o.status}
                        onChange={async (newStatus) => {
                          try {
                            setUpdatingId(o._id);
                            await updateStatus({
                              variables: { id: o._id, status: newStatus },
                              optimisticResponse: {
                                updateOrderStatus: {
                                  __typename: 'Order',
                                  _id: o._id,
                                  status: newStatus,
                                  updatedAt: new Date().toISOString(),
                                },
                              },
                              update(cache) {
                                try {
                                  cache.updateQuery(
                                    {
                                      query: LIST_ORDERS_PAGE,
                                      variables: {
                                        page,
                                        pageSize,
                                        status: statusFilter || null,
                                      },
                                    },
                                    (existing: any) => {
                                      if (!existing?.listOrdersPage?.items)
                                        return existing;
                                      return {
                                        ...existing,
                                        listOrdersPage: {
                                          ...existing.listOrdersPage,
                                          items:
                                            existing.listOrdersPage.items.map(
                                              (row: any) =>
                                                row._id === o._id
                                                  ? {
                                                      ...row,
                                                      status: newStatus,
                                                    }
                                                  : row,
                                            ),
                                        },
                                      };
                                    },
                                  );
                                } catch {}
                              },
                            });
                            showToast('Order status updated', 'success');
                          } catch (err) {
                            showToast('Failed to update status', 'error');
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'confirmed', label: 'Confirmed' },
                          { value: 'processing', label: 'Processing' },
                          { value: 'shipped', label: 'Shipped' },
                          { value: 'delivered', label: 'Delivered' },
                          { value: 'cancelled', label: 'Cancelled' },
                        ]}
                        disabled={updatingId === o._id}
                        buttonClassName={`${statusClasses[o.status] ?? 'theme-border text-brand-800 bg-yellow-50'} px-2 py-1 text-xs`}
                        className="min-w-[160px]"
                      />
                      {updatingId === o._id && (
                        <div className="absolute inset-y-0 flex items-center right-2">
                          <span className="w-3 h-3 border-2 rounded-full border-brand animate-spin border-t-transparent" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        className="w-20 h-8 text-xs border rounded-md theme-border"
                        onClick={() => {
                          setSelectedId(o._id);
                          fetchOrder({ variables: { id: o._id } });
                          const next = new URLSearchParams(searchParams);
                          next.set('id', o._id);
                          setSearchParams(next, { replace: true });
                        }}
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
                    className="py-10 text-sm text-center"
                    colSpan={7}
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3">
            <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 text-sm rounded-md btn-ghost h-9"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                className="px-3 text-sm rounded-md btn-primary h-9"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedId && (
        <div
          ref={detailsRef}
          className="p-6 border rounded-lg theme-card theme-border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Order Details</div>
            <button
              className="px-3 rounded-md btn-ghost h-9"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
          <div className="flex justify-end mb-4">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-800 border border-red-200 rounded-md bg-red-50 hover:bg-red-100 disabled:opacity-50"
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
            >
              <span>Delete Order</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9.75 9a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3A.75.75 0 0 1 9.75 9Zm-3 3a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9A.75.75 0 0 1 6.75 12Zm1.5 3a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {orderLoading ? (
            <div className="py-6">
              <Spinner label="Loading order details" />
            </div>
          ) : orderData?.getOrder ? (
            <>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div>
                  <div className="font-medium">Customer</div>
                  <div>
                    {orderData.getOrder.firstName} {orderData.getOrder.lastName}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    {orderData.getOrder.email}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    {orderData.getOrder.phone}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Shipping</div>
                  <div>{orderData.getOrder.address1}</div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    {orderData.getOrder.city}, {orderData.getOrder.state}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Payment</div>
                  <div className="capitalize">
                    {orderData.getOrder.paymentMethod?.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span>Status:</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-1 ${
                        statusClasses[orderData.getOrder.status] ??
                        'theme-border text-brand-800 bg-yellow-50'
                      }`}
                    >
                      {orderData.getOrder.status}
                    </span>
                  </div>
                  {orderData.getOrder.transferProofUrl && (
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => {
                        setProofUrl(
                          orderData.getOrder.transferProofUrl as string,
                        );
                        setProofOpen(true);
                      }}
                    >
                      View transfer proof
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 font-medium">Items</div>
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
                      {orderData.getOrder.items?.map((it: any, idx: number) => (
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
                            ₦{Number(it.price ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            ₦
                            {Number(
                              (it.price ?? 0) * (it.quantity ?? 0),
                            ).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {(!orderData.getOrder.items ||
                        orderData.getOrder.items.length === 0) && (
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

              <div className="flex justify-end mt-4 text-sm">
                <div className="w-full max-w-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      ₦
                      {Number(
                        orderData.getOrder.subtotal ?? 0,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>
                      ₦{Number(orderData.getOrder.tax ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>
                      ₦{Number(orderData.getOrder.total ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="py-6 text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              No order found.
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        open={confirmOpen}
        title="Delete this order?"
        message={<span>This action cannot be undone.</span>}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={async () => {
          if (!selectedId) return;
          try {
            await deleteOrderMutation({
              variables: { id: selectedId },
              optimisticResponse: { deleteOrder: true },
            });
            setSelectedId(null);
            showToast('Order deleted', 'success');
          } catch (err) {
            showToast('Failed to delete order', 'error');
          }
        }}
        onClose={() => setConfirmOpen(false)}
      />
      <Modal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        title="Transfer Proof"
        widthClassName="max-w-3xl"
      >
        {proofUrl ? (
          <div className="flex items-center justify-center">
            <img
              src={proofUrl}
              alt="Transfer proof"
              className="max-h-[70vh] w-auto rounded"
            />
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            No image to display.
          </div>
        )}
      </Modal>
    </div>
  );
}
