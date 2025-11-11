import { formatCurrency } from '../../../utils/currency';
import { ItemDraft, ProductSearchResult } from './types';

type OrderItemsPanelProps = {
  productSearchTerm: string;
  onProductSearchTermChange: (value: string) => void;
  productSearchLoading: boolean;
  productResults: ProductSearchResult[];
  onAddProduct: (product: ProductSearchResult) => void;
  items: ItemDraft[];
  onQuantityChange: (index: number, value: string) => void;
  onPriceChange: (index: number, value: string) => void;
  onOptionChange: (
    index: number,
    field: 'selectedSize' | 'selectedColor',
    value: string,
  ) => void;
  onRemoveItem: (index: number) => void;
  subtotal: number;
};

export function OrderItemsPanel({
  productSearchTerm,
  onProductSearchTermChange,
  productSearchLoading,
  productResults,
  onAddProduct,
  items,
  onQuantityChange,
  onPriceChange,
  onOptionChange,
  onRemoveItem,
  subtotal,
}: OrderItemsPanelProps) {
  return (
    <div
      id="order-items-anchor"
      className="p-6 text-sm border rounded-lg theme-card theme-border text-neutral-900"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Order items</h2>
          <p className="text-xs text-neutral-500">
            Search products, choose variants, and adjust quantities.
          </p>
        </div>
        <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
          Subtotal: <strong>{formatCurrency(subtotal)}</strong>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,_1fr]">
        <div className="space-y-3">
          <div className="p-4 border rounded-lg theme-border">
            <label className="block text-xs font-medium tracking-wide text-gray-500 uppercase">
              Search products
            </label>
            <input
              value={productSearchTerm}
              onChange={(event) =>
                onProductSearchTermChange(event.target.value)
              }
              placeholder="Search by name, SKU, or category"
              className="w-full px-3 py-2 mt-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
            <p className="mt-2 text-xs" style={{ color: 'rgb(var(--muted))' }}>
              Select a product to add it to this order. Adding the same product
              again increases its quantity.
            </p>
          </div>

          <div className="p-4 border rounded-lg theme-border">
            <div className="flex items-center justify-between mb-2 text-sm font-medium">
              <span>Results</span>
              {productSearchLoading ? (
                <span className="text-xs text-gray-500">Searching…</span>
              ) : null}
            </div>
            <div className="space-y-2">
              {productResults.length === 0 && !productSearchLoading ? (
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  {productSearchTerm
                    ? 'No products match your search.'
                    : 'Start typing to find products to add.'}
                </div>
              ) : null}
              {productResults.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => onAddProduct(product)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left border rounded-md theme-border hover:bg-brand-50"
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{product.name}</div>
                    <div
                      className="flex flex-wrap items-center gap-2 text-xs"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      {product.sku ? <span>SKU: {product.sku}</span> : null}
                      {product.stockQuantity != null ? (
                        <span>Stock: {product.stockQuantity}</span>
                      ) : null}
                      {product.stockQuantity === 0 ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-600">
                          Out of stock
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(product.salePrice ?? product.price ?? 0)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg theme-border">
          {items.length === 0 ? (
            <div
              className="py-8 text-sm text-center"
              style={{ color: 'rgb(var(--muted))' }}
            >
              No items added yet. Search for a product to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="p-4 border border-dashed rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {item.name ?? 'Untitled product'}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        {item.sku
                          ? `SKU: ${item.sku}`
                          : `ID: ${item.productId}`}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatCurrency((item.price ?? 0) * (item.quantity ?? 0))}
                    </div>
                  </div>

                  <div className="grid gap-3 mt-4 md:grid-cols-4">
                    <label className="flex flex-col gap-1 text-xs font-medium">
                      Quantity
                      <input
                        type="number"
                        min={1}
                        max={
                          item.maxQuantity != null && item.maxQuantity > 0
                            ? item.maxQuantity
                            : undefined
                        }
                        value={
                          item.quantity == null || Number.isNaN(item.quantity)
                            ? ''
                            : item.quantity
                        }
                        onChange={(event) =>
                          onQuantityChange(index, event.target.value)
                        }
                        onWheel={(event) => {
                          (event.currentTarget as HTMLInputElement).blur();
                          event.preventDefault();
                        }}
                        className="px-3 py-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium">
                      Unit price
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.price ?? ''}
                        onChange={(event) =>
                          onPriceChange(index, event.target.value)
                        }
                        onWheel={(event) => {
                          (event.currentTarget as HTMLInputElement).blur();
                          event.preventDefault();
                        }}
                        placeholder="Unit price"
                        className="px-3 py-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      />
                    </label>
                    {item.availableSizes?.length ? (
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Size
                        <select
                          value={item.selectedSize ?? ''}
                          onChange={(event) =>
                            onOptionChange(
                              index,
                              'selectedSize',
                              event.target.value,
                            )
                          }
                          className="px-3 py-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        >
                          <option value="">Select</option>
                          {item.availableSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {item.availableColors?.length ? (
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Color
                        <select
                          value={item.selectedColor ?? ''}
                          onChange={(event) =>
                            onOptionChange(
                              index,
                              'selectedColor',
                              event.target.value,
                            )
                          }
                          className="px-3 py-2 text-sm border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        >
                          <option value="">Select</option>
                          {item.availableColors.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    {item.maxQuantity != null && item.maxQuantity > 0 ? (
                      <span>In stock: {item.maxQuantity}</span>
                    ) : (
                      <span>Stock quantity not tracked</span>
                    )}
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => onRemoveItem(index)}
                    >
                      Remove item
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 text-sm border-t">
                <div className="text-xs text-neutral-500">Subtotal</div>
                <div className="text-base font-semibold">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
