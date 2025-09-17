import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { useQuery } from '@apollo/client';
import { GET_CART_ITEMS } from '../graphql/cart';
import { TCartItem } from 'src/types';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function CartPage() {
  const { updateCartItem, removeFromCart, clearCart } = useCart();

  const { showToast } = useToast();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: cartItemsData, loading } = useQuery<{
    getCartItems: TCartItem[];
  }>(GET_CART_ITEMS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  console.log('cartItemsData  ', cartItemsData);

  const handleQuantityChange = async (
    cartItemId: string = '',
    newQuantity: number = 0,
  ) => {
    if (newQuantity < 1) return;

    // Enforce stock across all cart lines for the same product
    const itemsAll: any[] = (cartItemsData?.getCartItems ?? []) as any[];
    const currentLine = itemsAll.find((ci) => ci?._id === cartItemId);
    const productId = currentLine?.product?._id;
    const stock = Number((currentLine?.product as any)?.stockQuantity ?? 0);
    if (productId && stock > 0) {
      const totalOther = itemsAll.reduce((sum, ci) => {
        if (ci?.product?._id !== productId) return sum;
        // exclude current line when computing other qty
        if (ci?._id === cartItemId) return sum;
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
    try {
      if (!cartItemId) return;
      await removeFromCart(cartItemId);
      showToast('Item removed from cart', 'success');
    } catch (error) {
      showToast('Failed to remove item', 'error');
    }
  };

  const handleClearCart = async () => {
    setConfirmOpen(true);
  };

  const calculateSubtotal = () => {
    return cartItemsData?.getCartItems?.reduce(
      (total, item: TCartItem | undefined) => {
        const price = item?.product?.salePrice || item?.product?.price;
        return total + (price || 0) * (item?.quantity || 0);
      },
      0,
    );
  };

  const calculateTax = (subtotal: number | undefined) => {
    return subtotal ? subtotal * 0.08 : 0; // 8% tax rate
  };

  const calculateTotal = (subtotal: number | undefined, tax: number) => {
    return subtotal ? subtotal + tax : 0;
  };

  const parsePrice = (
    salePrice: number | undefined,
    price: number | undefined,
  ) => {
    if (salePrice) {
      return salePrice;
    }
    if (price) {
      return price;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading cart..." />
      </div>
    );
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
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-2 sm:px-4">
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
            <h1 className="text-4xl font-bold">Shopping Cart</h1>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    Cart Items ({cartItemsData?.getCartItems?.length || 0})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-6">
                  {cartItemsData?.getCartItems?.map(
                    (item: TCartItem | undefined) => (
                      <div
                        key={item?._id}
                        className="flex gap-4 rounded-lg border p-4"
                      >
                        {/* Product Image */}
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
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
                            {item?.product?.name}
                          </h3>
                          <p className="text-muted mb-2 text-sm">
                            {item?.product?.brand}
                          </p>

                          {/* Size and Color Tags */}
                          <div className="mb-3 flex gap-2">
                            <span className="bg-brand-100 text-brand-800 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                              Size: {item?.selectedSize}
                            </span>
                            <span className="bg-brand-100 text-brand-800 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                              Color: {item?.selectedColor}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="text-lg font-semibold">
                            {item?.product?.salePrice ? (
                              <>
                                <span className="text-green-600">
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
                        <div className="flex flex-col items-end gap-4">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-muted text-sm">Qty:</span>
                            <div className="flex items-center rounded-md border">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item?._id,
                                    (item?.quantity || 0) - 1,
                                  )
                                }
                                disabled={updatingItems.has(item?._id || '')}
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
                                    (item?.product as any)?.stockQuantity ?? 0,
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
                                  handleQuantityChange(item?._id, current + 1);
                                }}
                                disabled={
                                  updatingItems.has(item?._id || '') ||
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
                          <div className="text-lg font-semibold">
                            {formatCurrency(
                              parsePrice(
                                item?.product.salePrice,
                                item?.product.price,
                              ) * (item?.quantity || 1),
                            )}
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item?._id)}
                            className="text-red-500 transition-colors hover:text-red-700"
                            title="Remove item"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-2xl font-semibold">Order Summary</h2>

                {/* Price Breakdown */}
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span>
                      Subtotal ({cartItemsData?.getCartItems?.length || 0}{' '}
                      items)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
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
                      🚚
                    </div>
                    <div>
                      <div className="font-medium">Free Shipping</div>
                      <div className="text-muted text-sm">
                        On orders over ₦30,000
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="bg-brand-100 flex h-8 w-8 items-center justify-center rounded-full">
                      🛡️
                    </div>
                    <div>
                      <div className="font-medium">Secure Payment</div>
                      <div className="text-muted text-sm">Bank transfer </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="bg-brand-100 flex h-8 w-8 items-center justify-center rounded-full">
                      📅
                    </div>
                    <div>
                      <div className="font-medium">Easy Returns</div>
                      <div className="text-muted text-sm">
                        7-day return policy
                      </div>
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

// Render confirmation modal at the end so it overlays the page
// Note: Placed outside the main return to avoid cluttering layout
// but within component scope for state access
