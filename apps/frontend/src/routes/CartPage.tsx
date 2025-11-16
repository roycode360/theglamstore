import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../utils/currency';
import { TCartItem } from 'src/types';
import { LocalCartItem } from '../utils/localCart';
import ConfirmModal from '../components/ui/ConfirmModal';
import Spinner from '../components/ui/Spinner';
import { Skeleton } from '../components/ui/Skeleton';

export default function CartPage() {
  const {
    updateCartItem,
    removeFromCart,
    clearCart,
    cartItems,
    cartItemCount,
    isLoading,
  } = useCart();

  const { showToast } = useToast();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Convert cart items to a consistent format
  const cartItemsData = {
    getCartItems: cartItems as (TCartItem | LocalCartItem)[],
  };
  const loading = isLoading;

  const handleQuantityChange = async (
    cartItemId: string = '',
    newQuantity: number = 0,
  ) => {
    if (newQuantity < 1) return;

    // Enforce stock across all cart lines for the same product
    const itemsAll: (TCartItem | LocalCartItem)[] =
      cartItemsData?.getCartItems ?? [];
    const currentLine = itemsAll.find((ci) => {
      // Handle both TCartItem and LocalCartItem formats
      const id = '_id' in ci ? ci._id : ci.id;
      return id === cartItemId;
    });

    const productId = currentLine?.product?._id;
    const stock = Number((currentLine?.product as any)?.stockQuantity ?? 0);
    if (productId && stock > 0) {
      const totalOther = itemsAll.reduce((sum, ci) => {
        if (ci?.product?._id !== productId) return sum;
        // exclude current line when computing other qty
        const id = '_id' in ci ? ci._id : ci.id;
        if (id === cartItemId) return sum;
        return sum + (ci?.quantity || 0);
      }, 0);
      const wouldBeTotal = totalOther + newQuantity;
      if (wouldBeTotal > stock) {
        const remaining = Math.max(
          0,
          stock - (totalOther + (currentLine?.quantity || 0)),
        );
        showToast(
          totalOther === 0 && (currentLine?.quantity || 0) === 0
            ? `Only ${stock} in stock`
            : remaining > 0
              ? `Only ${remaining} more in stock`
              : `Only ${stock} in stock`,
          'warning',
        );
        return;
      }
    }

    setUpdatingItems((prev) => new Set(prev).add(cartItemId || ''));
    try {
      await updateCartItem({ cartItemId, quantity: newQuantity });
      showToast('Quantity updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update quantity', 'error');
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (cartItemId: string | undefined) => {
    if (!cartItemId) return;
    setRemovingItems((prev) => new Set(prev).add(cartItemId));
    try {
      await removeFromCart(cartItemId);
      showToast('Item removed from cart', 'success');
    } catch (error) {
      showToast('Failed to remove item', 'error');
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    setConfirmOpen(true);
  };

  const calculateSubtotal = () => {
    return cartItemsData?.getCartItems?.reduce(
      (total: number, item: TCartItem | LocalCartItem | undefined) => {
        if (!item) return total;
        const price = item?.product?.salePrice || item?.product?.price;
        return total + (price || 0) * (item?.quantity || 0);
      },
      0,
    );
  };

  const calculateTotal = (subtotal: number | undefined) => {
    return subtotal ? subtotal : 0;
  };

  const parsePrice = (
    salePrice: number | undefined,
    price: number | undefined,
  ): number => {
    if (salePrice) {
      return salePrice;
    }
    if (price) {
      return price;
    }
    return 0;
  };

  if (loading) {
    return <CartPageSkeleton />;
  }

  if (cartItemsData?.getCartItems?.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🛒</div>
          <h1 className="mb-4 text-3xl font-bold">Your cart is empty</h1>
          <p className="text-muted mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="btn-primary rounded-lg px-8 py-3 text-lg"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = 0;
  const total = calculateTotal(subtotal);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-4">
              <Link
                to="/products"
                className="text-brand hover:text-brand-700 flex items-center gap-2 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Continue Shopping
              </Link>
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Shopping Cart</h1>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-white px-2 py-4 shadow-sm sm:px-4 sm:py-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    Cart Items ({cartItemCount})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-sm font-medium text-gray-700 hover:text-gray-800"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-6">
                  {cartItemsData?.getCartItems?.map(
                    (item: TCartItem | LocalCartItem | undefined) => {
                      if (!item) return null;
                      const itemId = '_id' in item ? item._id : item.id;
                      return (
                        <div
                          key={itemId}
                          className="flex flex-col gap-3 rounded-lg border px-2 py-3 sm:flex-row sm:gap-4 sm:px-4 sm:py-4"
                        >
                          {/* Product Image */}
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                            {item?.product?.images?.[0] && (
                              <img
                                src={item?.product.images[0]}
                                alt={item?.product?.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-lg font-semibold">
                              <Link
                                to={`/ProductDetails?id=${item?.product?._id ?? ''}`}
                                className="hover:text-brand-700 transition-colors"
                              >
                                {item?.product?.name}
                              </Link>
                            </h3>
                            <p className="text-muted mb-2 text-sm">
                              {item?.product?.brand}
                            </p>

                            {/* Size and Color Tags */}
                            <div className="mb-3 flex flex-wrap gap-2">
                              <span className="bg-brand-100 text-brand-800 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                                Size: {item?.selectedSize}
                              </span>
                              <span className="bg-brand-100 text-brand-800 inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  Color:
                                  {(() => {
                                    const selected = item?.selectedColor || '';
                                    let swatch = '';
                                    let label = selected;
                                    if (selected.includes('|')) {
                                      const parts = selected.split('|');
                                      label = parts[0] || parts[1] || '';
                                      swatch = parts[1] || parts[0] || '';
                                    } else {
                                      swatch = selected;
                                    }
                                    return (
                                      <>
                                        {swatch && (
                                          <span
                                            className="ml-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full border border-white/70 shadow-sm"
                                            style={{
                                              backgroundColor: swatch,
                                              boxShadow:
                                                '0 0 0 1px rgba(0,0,0,0.08)',
                                            }}
                                            aria-hidden="true"
                                          />
                                        )}
                                        <span>{label}</span>
                                      </>
                                    );
                                  })()}
                                </span>
                              </span>
                            </div>

                            {/* Price */}
                            <div className="text-base font-semibold sm:text-lg">
                              {item?.product?.salePrice ? (
                                <>
                                  <span className="text-gray-700">
                                    {formatCurrency(item?.product?.salePrice)}
                                  </span>
                                  <span className="text-muted ml-2 text-sm line-through">
                                    {formatCurrency(item?.product?.price)}
                                  </span>
                                </>
                              ) : (
                                formatCurrency(item?.product?.price || 0)
                              )}
                            </div>
                          </div>

                          {/* Quantity and Actions */}
                          <div className="mt-1 flex w-full flex-row flex-wrap items-center justify-between gap-3 sm:mt-0 sm:w-auto sm:flex-col sm:items-end">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-muted hidden text-sm sm:inline">
                                Qty:
                              </span>
                              <div className="flex items-center rounded-md border">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      itemId,
                                      (item?.quantity || 0) - 1,
                                    )
                                  }
                                  disabled={updatingItems.has(itemId || '')}
                                  className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  −
                                </button>
                                <span className="min-w-[2rem] px-3 py-1 text-center">
                                  {item?.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    console.log('item', item);
                                    const current = item?.quantity || 0;
                                    console.log('current', current);
                                    const stock = Number(
                                      (item?.product as any)?.stockQuantity ??
                                        0,
                                    );
                                    console.log('stock', stock, item?.product);
                                    const productId = item?.product?._id;
                                    const totalForProduct = (
                                      cartItemsData?.getCartItems ?? []
                                    ).reduce(
                                      (sum: number, ci: any) =>
                                        sum +
                                        (ci?.product?._id === productId
                                          ? ci?.quantity || 0
                                          : 0),
                                      0,
                                    );
                                    const wouldBeTotal = totalForProduct + 1;
                                    if (stock > 0 && wouldBeTotal > stock) {
                                      const remaining = Math.max(
                                        0,
                                        stock - totalForProduct,
                                      );
                                      showToast(
                                        totalForProduct === 0
                                          ? `Only ${stock} in stock`
                                          : remaining > 0
                                            ? `Only ${remaining} more in stock`
                                            : `Only ${stock} in stock`,
                                        'warning',
                                      );
                                      return;
                                    }
                                    handleQuantityChange(itemId, current + 1);
                                  }}
                                  disabled={
                                    updatingItems.has(itemId || '') ||
                                    (() => {
                                      const stock = Number(
                                        (item?.product as any)?.stockQuantity ??
                                          0,
                                      );
                                      if (!(stock > 0)) return false;
                                      const productId = item?.product?._id;
                                      const totalForProduct = (
                                        cartItemsData?.getCartItems ?? []
                                      ).reduce(
                                        (sum: number, ci: any) =>
                                          sum +
                                          (ci?.product?._id === productId
                                            ? ci?.quantity || 0
                                            : 0),
                                        0,
                                      );
                                      return totalForProduct >= stock;
                                    })()
                                  }
                                  className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Total Price */}
                            <div className="text-base font-semibold sm:text-lg">
                              {formatCurrency(
                                parsePrice(
                                  item?.product.salePrice,
                                  item?.product.price,
                                ) * (item?.quantity || 1),
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(itemId)}
                              className="flex items-center justify-center text-gray-700 transition-colors hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Remove item"
                              disabled={removingItems.has(itemId || '')}
                            >
                              {removingItems.has(itemId || '') ? (
                                <Spinner
                                  label=""
                                  size={16}
                                  className="h-5 w-5"
                                />
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="h-5 w-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-8">
                <h2 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
                  Order Summary
                </h2>

                {/* Price Breakdown */}
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItemCount} items)</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal || 0)}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  to="/checkout"
                  className="bg-brand hover:bg-brand-700 mb-6 block w-full rounded-lg px-6 py-3 text-center font-semibold text-white transition-colors"
                >
                  Proceed to Checkout
                </Link>

                {/* Additional Info Cards */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="bg-brand-100 flex h-8 w-8 items-center justify-center rounded-full">
                      🛡️
                    </div>
                    <div>
                      <div className="font-medium">Secure Payment</div>
                      <div className="text-muted text-sm">Bank transfer </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Clear cart?"
        message="This will remove all items from your shopping cart."
        confirmText="Clear cart"
        cancelText="Cancel"
        onConfirm={async () => {
          try {
            await clearCart();
            showToast('Cart cleared successfully', 'success');
          } catch (error) {
            showToast('Failed to clear cart', 'error');
          }
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

function CartPageSkeleton() {
  const itemPlaceholders = Array.from({ length: 3 });
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <Skeleton className="mb-4 h-5 w-36 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white px-4 py-6 shadow-sm sm:px-6">
              <div className="mb-6 flex items-center justify-between">
                <Skeleton className="h-7 w-48 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>

              <div className="space-y-6">
                {itemPlaceholders.map((_, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-4 rounded-lg border px-4 py-4 sm:flex-row sm:items-center"
                  >
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4 rounded-md" />
                      <Skeleton className="h-4 w-1/3 rounded-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-5 w-32 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-md" />
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <Skeleton className="h-10 w-28 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <Skeleton className="mb-4 h-5 w-24 rounded-md" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="mt-5 h-11 w-full rounded-md" />
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="mt-3 h-10 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render confirmation modal at the end so it overlays the page
// Note: Placed outside the main return to avoid cluttering layout
// but within component scope for state access
