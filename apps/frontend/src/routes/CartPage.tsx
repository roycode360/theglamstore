import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { TCartItem } from 'src/types';
import { LocalCartItem } from '../utils/localCart';
import ConfirmModal from '../components/ui/ConfirmModal';

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
      (total: number, item: TCartItem | LocalCartItem | undefined) => {
        if (!item) return total;
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading cart..." />
      </div>
    );
  }

  if (cartItemsData?.getCartItems?.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 text-6xl">🛒</div>
          <h1 className="mb-4 text-3xl font-bold">Your cart is empty</h1>
          <p className="mb-8 text-muted">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="px-8 py-3 text-lg rounded-lg btn-primary"
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
      <div className="min-h-screen py-6 bg-gray-50 sm:py-8">
        <div className="mx-auto max-w-7xl sm:px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                to="/products"
                className="flex items-center gap-2 transition-colors text-brand hover:text-brand-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
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
              <div className="px-2 py-4 bg-white border rounded-lg shadow-sm sm:px-4 sm:py-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">
                    Cart Items ({cartItemCount})
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
                    (item: TCartItem | LocalCartItem | undefined) => {
                      if (!item) return null;
                      const itemId = '_id' in item ? item._id : item.id;
                      return (
                        <div
                          key={itemId}
                          className="flex flex-col gap-3 px-2 py-3 border rounded-lg sm:flex-row sm:gap-4 sm:px-4 sm:py-4"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-100 rounded-lg sm:h-24 sm:w-24">
                            {item?.product?.images?.[0] && (
                              <img
                                src={item?.product.images[0]}
                                alt={item?.product?.name}
                                className="object-cover w-full h-full"
                              />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="mb-1 text-lg font-semibold">
                              {item?.product?.name}
                            </h3>
                            <p className="mb-2 text-sm text-muted">
                              {item?.product?.brand}
                            </p>

                            {/* Size and Color Tags */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="bg-brand-100 text-brand-800 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                                Size: {item?.selectedSize}
                              </span>
                              <span className="bg-brand-100 text-brand-800 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                                Color: {item?.selectedColor}
                              </span>
                            </div>

                            {/* Price */}
                            <div className="text-base font-semibold sm:text-lg">
                              {item?.product?.salePrice ? (
                                <>
                                  <span className="text-green-600">
                                    {formatCurrency(item?.product?.salePrice)}
                                  </span>
                                  <span className="ml-2 text-sm line-through text-muted">
                                    {formatCurrency(item?.product?.price)}
                                  </span>
                                </>
                              ) : (
                                formatCurrency(item?.product?.price || 0)
                              )}
                            </div>
                          </div>

                          {/* Quantity and Actions */}
                          <div className="flex flex-row flex-wrap items-center justify-between w-full gap-3 mt-1 sm:mt-0 sm:w-auto sm:flex-col sm:items-end">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2">
                              <span className="hidden text-sm text-muted sm:inline">
                                Qty:
                              </span>
                              <div className="flex items-center border rounded-md">
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
                              className="text-red-500 transition-colors hover:text-red-700"
                              title="Remove item"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="w-5 h-5"
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
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="p-4 bg-white border rounded-lg shadow-sm sm:p-6 lg:sticky lg:top-8">
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
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  to="/checkout"
                  className="block w-full px-6 py-3 mb-6 font-semibold text-center text-white transition-colors rounded-lg bg-brand hover:bg-brand-700"
                >
                  Proceed to Checkout
                </Link>

                {/* Additional Info Cards */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100">
                      🚚
                    </div>
                    <div>
                      <div className="font-medium">Free Shipping</div>
                      <div className="text-sm text-muted">
                        On orders over ₦30,000
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100">
                      🛡️
                    </div>
                    <div>
                      <div className="font-medium">Secure Payment</div>
                      <div className="text-sm text-muted">Bank transfer </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100">
                      📅
                    </div>
                    <div>
                      <div className="font-medium">Easy Returns</div>
                      <div className="text-sm text-muted">
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
