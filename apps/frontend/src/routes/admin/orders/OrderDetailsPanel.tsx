import Input from '../../../components/ui/Input';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { EditableOrderItem, OrderListItem, ProductSearchResult } from './types';

type CustomerDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
};

type PricingDraft = {
  couponCode: string;
  couponDiscount: string;
  deliveryFee: string;
  amountPaid: string;
  amountRefunded: string;
  paymentReference: string;
  transferProofUrl: string;
};

type OrderDetailsPanelProps = {
  order: OrderListItem & {
    createdAt: string;
    updatedAt?: string | null;
    paymentMethod?: string | null;
    transferProofUrl?: string | null;
    status: string;
    deliveryLocationName?: string | null;
    deliveryFee?: number | null;
  };
  customerDraft: CustomerDraft;
  pricingDraft: PricingDraft;
  notesDraft: string;
  itemsDraft: EditableOrderItem[];
  productResults: ProductSearchResult[];
  productSearchTerm: string;
  productSearchLoading: boolean;
  statusClasses: Record<string, string>;
  validatingCoupon: boolean;
  actionBusy: boolean;
  deleting: boolean;
  isDirty: boolean;
  subtotal: number;
  discountAmount: number;
  deliveryFeeValue: number;
  amountPaidValue: number;
  amountRefundedValue: number;
  computedTotal: number;
  balanceDuePreview: number;
  editingEnabled: boolean;
  onRequestDelete: () => void;
  onResetChanges: () => void;
  onSaveChanges: () => void;
  onToggleEditing: () => void;
  onCustomerFieldChange: (field: keyof CustomerDraft, value: string) => void;
  onProductSearchTermChange: (value: string) => void;
  onAddProduct: (product: ProductSearchResult) => void;
  onRemoveItem: (index: number) => void;
  onItemQuantityChange: (index: number, value: string) => void;
  onItemPriceChange: (index: number, value: string) => void;
  onItemOptionChange: (
    index: number,
    field: 'selectedSize' | 'selectedColor',
    value: string,
  ) => void;
  onCouponCodeChange: (value: string) => void;
  onPricingNumberChange: (
    field: 'couponDiscount' | 'deliveryFee' | 'amountPaid' | 'amountRefunded',
    value: string,
  ) => void;
  onPaymentReferenceChange: (value: string) => void;
  onTransferProofChange: (value: string) => void;
  onValidateCoupon: () => void;
  onNotesChange: (value: string) => void;
  onShowTransferProof: (url: string) => void;
};

export function OrderDetailsPanel({
  order,
  customerDraft,
  pricingDraft,
  notesDraft,
  itemsDraft,
  productResults,
  productSearchTerm,
  productSearchLoading,
  statusClasses,
  validatingCoupon,
  actionBusy,
  deleting,
  isDirty,
  subtotal,
  discountAmount,
  deliveryFeeValue,
  amountPaidValue,
  amountRefundedValue,
  computedTotal,
  balanceDuePreview,
  editingEnabled,
  onRequestDelete,
  onResetChanges,
  onSaveChanges,
  onToggleEditing,
  onCustomerFieldChange,
  onProductSearchTermChange,
  onAddProduct,
  onRemoveItem,
  onItemQuantityChange,
  onItemPriceChange,
  onItemOptionChange,
  onCouponCodeChange,
  onPricingNumberChange,
  onPaymentReferenceChange,
  onTransferProofChange,
  onValidateCoupon,
  onNotesChange,
  onShowTransferProof,
}: OrderDetailsPanelProps) {
  const readOnly = !editingEnabled;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-gray-500">
            {order.orderNumber || order._id}
          </div>
          <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
            Created {formatDate(order.createdAt)}
          </div>
          {order.updatedAt && (
            <div className="text-[11px]" style={{ color: 'rgb(var(--muted))' }}>
              Updated {formatDate(order.updatedAt)}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              editingEnabled ? 'btn-ghost' : 'btn-secondary'
            }`}
            onClick={onToggleEditing}
            disabled={actionBusy}
          >
            {editingEnabled ? 'Cancel editing' : 'Edit order'}
          </button>
          <button
            className="btn-ghost inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRequestDelete}
            disabled={actionBusy || deleting}
          >
            Delete order
          </button>
          <button
            className="btn-ghost inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onResetChanges}
            disabled={readOnly || !isDirty || actionBusy}
          >
            Reset
          </button>
          <button
            className="btn-primary inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSaveChanges}
            disabled={readOnly || !isDirty || actionBusy}
          >
            {actionBusy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {readOnly && (
        <div className="mb-4 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">
          Fields are read-only. Click “Edit order” to enable editing.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Customer & Delivery
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium">
                First name
                <Input
                  value={customerDraft.firstName}
                  onChange={(event) =>
                    onCustomerFieldChange('firstName', event.target.value)
                  }
                  placeholder="First name"
                  readOnly={readOnly}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Last name
                <Input
                  value={customerDraft.lastName}
                  onChange={(event) =>
                    onCustomerFieldChange('lastName', event.target.value)
                  }
                  placeholder="Last name"
                  readOnly={readOnly}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Email
                <Input
                  type="email"
                  value={customerDraft.email}
                  onChange={(event) =>
                    onCustomerFieldChange('email', event.target.value)
                  }
                  placeholder="Email address"
                  readOnly={readOnly}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Phone
                <Input
                  value={customerDraft.phone}
                  onChange={(event) =>
                    onCustomerFieldChange('phone', event.target.value)
                  }
                  placeholder="Phone number"
                  readOnly={readOnly}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
                Address
                <Input
                  value={customerDraft.address1}
                  onChange={(event) =>
                    onCustomerFieldChange('address1', event.target.value)
                  }
                  placeholder="Street address"
                  readOnly={readOnly}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                City
                <Input
                  value={customerDraft.city}
                  onChange={(event) =>
                    onCustomerFieldChange('city', event.target.value)
                  }
                  placeholder="City"
                  readOnly={readOnly}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                State
                <Input
                  value={customerDraft.state}
                  onChange={(event) =>
                    onCustomerFieldChange('state', event.target.value)
                  }
                  placeholder="State"
                  readOnly={readOnly}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Order items
              </div>
              <Input
                value={productSearchTerm}
                onChange={(event) =>
                  onProductSearchTermChange(event.target.value)
                }
                placeholder="Search products to add"
                className="md:w-72"
                disabled={readOnly}
              />
            </div>
            {productSearchTerm.trim() ? (
              <div className="rounded-lg border border-dashed bg-gray-50 p-3">
                {productSearchLoading ? (
                  <div className="text-xs text-gray-500">
                    Searching products…
                  </div>
                ) : productResults.length === 0 ? (
                  <div className="text-xs text-gray-500">
                    No products match “{productSearchTerm.trim()}”.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productResults.map((product) => (
                      <button
                        key={product._id}
                        type="button"
                        className="theme-border hover:bg-brand-50 flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm"
                        onClick={() => onAddProduct(product)}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div
                            className="text-xs"
                            style={{ color: 'rgb(var(--muted))' }}
                          >
                            {product.sku ? `SKU: ${product.sku}` : 'SKU: —'} ·
                            Stock: {product.stockQuantity ?? '—'}
                          </div>
                          {product.stockQuantity === 0 && (
                            <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                              Out of stock
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold">
                          {formatCurrency(
                            product.salePrice ?? product.price ?? 0,
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {itemsDraft.length === 0 ? (
              <div
                className="py-6 text-center text-sm"
                style={{ color: 'rgb(var(--muted))' }}
              >
                No items in this order yet.
              </div>
            ) : (
              <div className="space-y-3">
                {itemsDraft.map((item, index) => (
                  <div
                    key={`${item.key}-${index}`}
                    className="rounded-lg border border-dashed p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">
                          {item.name || 'Untitled product'}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: 'rgb(var(--muted))' }}
                        >
                          ID: {item.productId}
                        </div>
                        {item.sku && (
                          <div className="text-[11px] text-gray-400">
                            SKU: {item.sku}
                          </div>
                        )}
                        {item.maxQuantity != null && (
                          <div className="text-[11px] text-gray-400">
                            In stock: {item.maxQuantity}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-xs text-red-600 underline"
                        onClick={() => onRemoveItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Quantity
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity ?? ''}
                          onChange={(event) =>
                            onItemQuantityChange(index, event.target.value)
                          }
                          readOnly={readOnly}
                          onWheel={(event) => {
                            event.currentTarget.blur();
                            event.preventDefault();
                          }}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Unit price
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price ?? ''}
                          onChange={(event) =>
                            onItemPriceChange(index, event.target.value)
                          }
                          readOnly={readOnly}
                          onWheel={(event) => {
                            event.currentTarget.blur();
                            event.preventDefault();
                          }}
                        />
                      </label>
                      {item.availableSizes?.length ? (
                        <label className="flex flex-col gap-1 text-xs font-medium">
                          Size
                          <select
                            className="theme-border rounded-md border px-2 py-2 text-sm"
                            value={item.selectedSize ?? ''}
                            onChange={(event) =>
                              onItemOptionChange(
                                index,
                                'selectedSize',
                                event.target.value,
                              )
                            }
                            disabled={readOnly}
                          >
                            {item.availableSizes.map((size) => (
                              <option
                                key={size ?? 'default'}
                                value={size ?? ''}
                              >
                                {size || 'Default'}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : item.selectedSize ? (
                        <div className="text-xs text-gray-500">
                          Size: {item.selectedSize}
                        </div>
                      ) : null}
                      {item.availableColors?.length ? (
                        <label className="flex flex-col gap-1 text-xs font-medium">
                          Color
                          <select
                            className="theme-border rounded-md border px-2 py-2 text-sm"
                            value={item.selectedColor ?? ''}
                            onChange={(event) =>
                              onItemOptionChange(
                                index,
                                'selectedColor',
                                event.target.value,
                              )
                            }
                            disabled={readOnly}
                          >
                            {item.availableColors.map((color) => (
                              <option
                                key={color ?? 'default'}
                                value={color ?? ''}
                              >
                                {color || 'Default'}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : item.selectedColor ? (
                        <div className="text-xs text-gray-500">
                          Color: {item.selectedColor}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pricing & Payments
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium">
                Coupon code
                <Input
                  value={pricingDraft.couponCode}
                  onChange={(event) => onCouponCodeChange(event.target.value)}
                  placeholder="e.g. SUMMER25"
                  onWheel={(event) => {
                    (event.currentTarget as HTMLInputElement).blur();
                    event.preventDefault();
                  }}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="btn-secondary h-10 rounded-md px-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onValidateCoupon}
                  disabled={validatingCoupon || subtotal <= 0}
                >
                  {validatingCoupon ? 'Checking…' : 'Validate coupon'}
                </button>
              </div>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Manual discount
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingDraft.couponDiscount}
                  onChange={(event) =>
                    onPricingNumberChange('couponDiscount', event.target.value)
                  }
                  onWheel={(event) => {
                    (event.currentTarget as HTMLInputElement).blur();
                    event.preventDefault();
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Delivery fee
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingDraft.deliveryFee}
                  onChange={(event) =>
                    onPricingNumberChange('deliveryFee', event.target.value)
                  }
                  onWheel={(event) => {
                    (event.currentTarget as HTMLInputElement).blur();
                    event.preventDefault();
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Amount paid
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingDraft.amountPaid}
                  onChange={(event) =>
                    onPricingNumberChange('amountPaid', event.target.value)
                  }
                  onWheel={(event) => {
                    (event.currentTarget as HTMLInputElement).blur();
                    event.preventDefault();
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Amount refunded
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingDraft.amountRefunded}
                  onChange={(event) =>
                    onPricingNumberChange('amountRefunded', event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
                Payment reference
                <Input
                  value={pricingDraft.paymentReference}
                  onChange={(event) =>
                    onPaymentReferenceChange(event.target.value)
                  }
                  placeholder="Optional reference or receipt number"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium md:col-span-2">
                Transfer proof URL
                <Input
                  value={pricingDraft.transferProofUrl}
                  onChange={(event) =>
                    onTransferProofChange(event.target.value)
                  }
                  placeholder="https://…"
                />
              </label>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Notes
            </div>
            <textarea
              value={notesDraft}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Customer or admin notes for this order."
              className="theme-border h-28 w-full rounded-md border px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
            <p className="text-xs text-neutral-500">
              If a customer leaves delivery instructions during checkout, they
              appear here. Updates are visible to all admins.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Order summary
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Discount</span>
              <span className="font-medium text-emerald-600">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Delivery</span>
              <span className="font-medium">
                {formatCurrency(deliveryFeeValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Total</span>
              <span className="text-base font-semibold">
                {formatCurrency(computedTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Amount paid</span>
              <span className="font-medium">
                {formatCurrency(amountPaidValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Amount refunded</span>
              <span className="font-medium">
                {formatCurrency(amountRefundedValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Balance due</span>
              <span
                className={`font-medium ${
                  balanceDuePreview > 0 ? 'text-orange-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(balanceDuePreview)}
              </span>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status & metadata
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Status</span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
                  statusClasses[order.status] ??
                  'theme-border text-brand-800 bg-yellow-50'
                }`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              Payment: {order.paymentMethod?.replace('_', ' ')}
            </div>
            {order.transferProofUrl && (
              <button
                type="button"
                className="text-xs underline"
                onClick={() =>
                  onShowTransferProof(order.transferProofUrl as string)
                }
              >
                View transfer proof
              </button>
            )}
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Delivery details
            </div>
            <div className="text-sm">
              <div className="text-gray-500">Location</div>
              <div className="font-medium">
                {order.deliveryLocationName || '—'}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-gray-500">Fee</div>
              <div className="font-medium">
                {formatCurrency(Number(order.deliveryFee ?? 0))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
