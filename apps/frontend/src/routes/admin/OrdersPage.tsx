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
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { formatDate, formatDateOnly } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { getAnalyticsRefetches } from '../../graphql/refetches';
import Input from '../../components/ui/Input';
import { OrdersList } from './orders/OrdersList';
import { OrderDetailsPanel } from './orders/OrderDetailsPanel';
import { OrderListItem, ProductSearchResult } from './orders/types';
import { useOrderDetailState } from './orders/useOrderDetailState';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [paymentFilter] = useState<string | undefined>(undefined);
  const [startDate] = useState<string | undefined>(undefined);
  const [endDate] = useState<string | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [updateStatus, { loading: updating }] = useMutation(
    UPDATE_ORDER_STATUS,
    {
      refetchQueries: getAnalyticsRefetches,
      awaitRefetchQueries: true,
    },
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteOrderMutation, { loading: deleting }] = useMutation(
    DELETE_ORDER,
    {
      refetchQueries: getAnalyticsRefetches,
      awaitRefetchQueries: true,
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
  const detailState = useOrderDetailState({
    showToast,
    fetchOrderById: (orderId: string) =>
      fetchOrder({
        variables: { id: orderId },
        fetchPolicy: 'network-only',
      }),
  });

  const {
    itemsDraft,
    customerDraft,
    pricingDraft,
    notesDraft,
    productResults,
    productSearchTerm,
    productSearchLoading,
    subtotal,
    discountAmount,
    shippingFeeValue,
    amountPaidValue,
    amountRefundedValue,
    computedTotal,
    balanceDuePreview,
    validatingCoupon,
    isDirty,
    actionBusy,
    editingEnabled,
    setEditingEnabled,
    hydrateFromOrder,
    handleAddProduct,
    handleRemoveItem,
    handleItemQuantityChange,
    handleItemPriceChange,
    handleItemOptionChange,
    handleCustomerFieldChange,
    handleProductSearchTermChange,
    handlePricingNumberChange,
    handleCouponCodeChange,
    handlePaymentReferenceChange,
    handleTransferProofChange,
    handleValidateCoupon,
    handleNotesChange,
    resetChanges,
    saveChanges,
  } = detailState;

  const selectedOrder = orderData?.getOrder ?? null;

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

  const lastHydratedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const order = orderData?.getOrder;
    if (!order) return;
    const key = `${order._id}:${order.updatedAt ?? ''}:${order.items?.length ?? 0}:${order.total ?? ''}`;
    if (lastHydratedKeyRef.current === key) return;
    hydrateFromOrder(order);
    setEditingEnabled(false);
    lastHydratedKeyRef.current = key;
  }, [orderData?.getOrder, hydrateFromOrder, setEditingEnabled]);

  const handlePageChange = (nextPage: number) => {
    const safeTotal = Math.max(totalPages, 1);
    const clamped = Math.min(safeTotal, Math.max(1, nextPage));
    setPage(clamped);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedId(orderId);
    fetchOrder({ variables: { id: orderId } });
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.set('id', orderId);
      return next;
    });
    setEditingEnabled(false);
  };

  const handleStatusChange = async (
    orderId: string,
    nextStatus: string,
  ): Promise<void> => {
    const current = orders.find((order) => order._id === orderId);
    if (!nextStatus || !current || current.status === nextStatus) {
      return;
    }

    try {
      setUpdatingId(orderId);
      await updateStatus({
        variables: { id: orderId, status: nextStatus },
        optimisticResponse: {
          updateOrderStatus: {
            __typename: 'Order',
            _id: orderId,
            status: nextStatus,
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
                    items: existing.listOrdersPage.items.map((row: any) =>
                      row._id === orderId
                        ? { ...row, status: nextStatus }
                        : row,
                    ),
                  },
                };
              },
            );
          } catch {
            /* noop */
          }
        },
      });
      showToast('Order status updated', 'success');
      await refetch();
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetChanges = () => {
    resetChanges({ silent: true });
    setEditingEnabled(false);
  };

  const handleSaveChanges = () => {
    if (!editingEnabled) return;
    if (!selectedId) return;
    void (async () => {
      await saveChanges(selectedId);
    })();
  };

  const handleToggleEditing = () => {
    if (editingEnabled) {
      resetChanges({ silent: true });
      setEditingEnabled(false);
    } else {
      setEditingEnabled(true);
    }
  };

  const statusClasses: Record<string, string> = {
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    confirmed: 'bg-blue-50 border-blue-200 text-blue-800',
    processing: 'bg-amber-50 border-amber-200 text-amber-800',
    shipped: 'bg-gray-50 border-gray-200 text-gray-800',
    delivered: 'bg-green-50 border-green-200 text-green-800',
    cancelled: 'bg-red-50 border-red-200 text-red-800',
    awaiting_additional_payment:
      'bg-orange-50 border-orange-200 text-orange-800',
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/orders/new')}
            className="px-3 text-sm rounded-md btn-primary h-9"
          >
            + New offline order
          </button>
        <button
          onClick={() => refetch()}
          className="px-3 text-sm rounded-md btn-ghost h-9"
        >
          Refresh
        </button>
        </div>
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
              {
                value: 'awaiting_additional_payment',
                label: 'Awaiting Payment',
              },
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
        <OrdersList
          orders={orders}
          updatingOrderId={updatingId}
          statusClasses={statusClasses}
          onChangeStatus={handleStatusChange}
          onViewOrder={handleViewOrder}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {selectedId && (
        <div
          ref={detailsRef}
          className="px-2 py-6 border rounded-lg theme-card theme-border"
        >
          {orderLoading ? (
            <div className="py-6">
              <Spinner label="Loading order details" />
            </div>
          ) : !selectedOrder ? (
            <div
              className="py-6 text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              No order found.
            </div>
          ) : (
            <OrderDetailsPanel
              order={selectedOrder}
              customerDraft={customerDraft}
              pricingDraft={pricingDraft}
              notesDraft={notesDraft}
              itemsDraft={itemsDraft}
              productResults={productResults}
              productSearchTerm={productSearchTerm}
              productSearchLoading={productSearchLoading}
              statusClasses={statusClasses}
              validatingCoupon={validatingCoupon}
              actionBusy={actionBusy}
              deleting={deleting}
              isDirty={isDirty}
              subtotal={subtotal}
              discountAmount={discountAmount}
              shippingFeeValue={shippingFeeValue}
              amountPaidValue={amountPaidValue}
              amountRefundedValue={amountRefundedValue}
              computedTotal={computedTotal}
              balanceDuePreview={balanceDuePreview}
              editingEnabled={editingEnabled}
              onRequestDelete={() => setConfirmOpen(true)}
              onResetChanges={handleResetChanges}
              onSaveChanges={handleSaveChanges}
              onToggleEditing={handleToggleEditing}
              onCustomerFieldChange={handleCustomerFieldChange}
              onProductSearchTermChange={handleProductSearchTermChange}
              onAddProduct={handleAddProduct}
              onRemoveItem={handleRemoveItem}
              onItemQuantityChange={handleItemQuantityChange}
              onItemPriceChange={handleItemPriceChange}
              onItemOptionChange={handleItemOptionChange}
              onCouponCodeChange={handleCouponCodeChange}
              onPricingNumberChange={handlePricingNumberChange}
              onPaymentReferenceChange={handlePaymentReferenceChange}
              onTransferProofChange={handleTransferProofChange}
              onValidateCoupon={handleValidateCoupon}
              onNotesChange={handleNotesChange}
              onShowTransferProof={(url) => {
                setProofUrl(url);
                setProofOpen(true);
              }}
            />
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
