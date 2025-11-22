import { useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/currency';
import { TProduct } from '../../types';

type ProductActionsProps = {
  product: TProduct;
  quantity: number;
  onQuantityChange: (newQty: number) => void;
  onAddToCart: () => Promise<void>;
  wishlistItems: any[];
  onToggleWishlist: () => Promise<void>;
};

export function ProductActions({
  product: p,
  quantity,
  onQuantityChange,
  onAddToCart,
  wishlistItems,
  onToggleWishlist,
}: ProductActionsProps) {
  const { showToast } = useToast();
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const stockValue =
    typeof (p as any)?.stockQuantity === 'number'
      ? Number((p as any)?.stockQuantity)
      : null;
  const isOutOfStock = stockValue !== null ? stockValue <= 0 : false;

  const handleAddToCart = async () => {
    if (addingToCart || isOutOfStock) {
      if (isOutOfStock) {
        showToast('This item is currently out of stock', 'warning');
      }
      return;
    }
    setAddingToCart(true);
    try {
      await onAddToCart();
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (togglingWishlist) return;
    setTogglingWishlist(true);
    try {
      await onToggleWishlist();
    } finally {
      setTogglingWishlist(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="theme-border inline-flex items-center rounded-md border">
        <button
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          className="h-10 w-10"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <div className="w-12 text-center">{quantity}</div>
        <button
          onClick={() => {
            if (isOutOfStock) {
              showToast('This item is currently out of stock', 'warning');
              return;
            }
            const stock = Number((p as any)?.stockQuantity ?? 0);
            const next = quantity + 1;
            if (stock > 0 && next > stock) {
              const msg = `Only ${stock} in stock`;
              showToast(msg, 'warning');
              return;
            }
            onQuantityChange(next);
          }}
          className="h-10 w-10"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 ${
          isOutOfStock
            ? 'btn-primary cursor-not-allowed opacity-60'
            : 'btn-primary'
        }`}
        onClick={handleAddToCart}
        disabled={addingToCart || isOutOfStock}
        aria-disabled={addingToCart || isOutOfStock}
      >
        {addingToCart ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Adding…</span>
          </>
        ) : isOutOfStock ? (
          'Out of stock'
        ) : (
          'Add to Cart'
        )}
      </button>
      <button
        className="theme-border inline-flex h-10 w-10 items-center justify-center rounded-md border transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Wishlist"
        title="Wishlist"
        aria-pressed={!!wishlistItems.find((w: any) => w._id === p._id)}
        onClick={handleToggleWishlist}
        disabled={togglingWishlist}
      >
        {togglingWishlist ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          (() => {
            const onList = !!wishlistItems.find((w: any) => w._id === p._id);
            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill={onList ? 'black' : 'none'}
                stroke="black"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M12 21s-6.716-4.39-9.193-7.63C1.49 11.66 1 9.93 1 8.5 1 6.015 3.015 4 5.5 4c1.54 0 3.04.79 3.9 2.06C10.46 4.79 11.96 4 13.5 4 15.985 4 18 6.015 18 8.5c0 1.43-.49 3.16-1.807 4.87C18.716 16.61 12 21 12 21z" />
              </svg>
            );
          })()
        )}
      </button>
    </div>
  );
}
