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

  const handleAddToCart = async () => {
    if (addingToCart) return;
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
      <div className="inline-flex items-center border rounded-md theme-border">
        <button
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          className="w-10 h-10"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <div className="w-12 text-center">{quantity}</div>
        <button
          onClick={() => {
            const stock = Number((p as any)?.stockQuantity ?? 0);
            const next = quantity + 1;
            if (stock > 0 && next > stock) {
              const msg = `Only ${stock} in stock`;
              showToast(msg, 'warning');
              return;
            }
            onQuantityChange(next);
          }}
          className="w-10 h-10"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        className="btn-primary inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5"
        onClick={handleAddToCart}
        disabled={addingToCart}
      >
        {addingToCart ? (
          <>
            <span className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
            <span>Adding…</span>
          </>
        ) : (
          'Add to Cart'
        )}
      </button>
      <button
        className="inline-flex items-center justify-center w-10 h-10 transition-opacity border rounded-md theme-border hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Wishlist"
        title="Wishlist"
        aria-pressed={!!wishlistItems.find((w: any) => w._id === p._id)}
        onClick={handleToggleWishlist}
        disabled={togglingWishlist}
      >
        {togglingWishlist ? (
          <span className="w-4 h-4 border-2 border-current rounded-full animate-spin border-t-transparent" />
        ) : (
          (() => {
            const onList = !!wishlistItems.find((w: any) => w._id === p._id);
            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
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
