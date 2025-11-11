import { Link } from 'react-router-dom';
import Modal from './Modal';
import Spinner from './Spinner';
import { formatCurrency } from '../../utils/currency';
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useToast } from './Toast';

export type QuickViewProduct = {
  _id: string;
  name: string;
  brand?: string | null;
  price: number;
  salePrice?: number | null;
  images?: string[];
  description?: string | null;
  colors?: string[];
  sizes?: string[];
  stockQuantity?: number | null;
};

type ProductQuickViewModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  product?: QuickViewProduct | null;
};

function parseColorEntry(entry: string | undefined) {
  if (!entry) return null;
  if (entry.includes('|')) {
    const parts = entry.split('|');
    return {
      label: parts[0] || parts[1] || '',
      swatch: parts[1] || parts[0] || '',
    };
  }
  return { label: entry, swatch: entry };
}

export function ProductQuickViewModal({
  open,
  onClose,
  loading,
  product,
}: ProductQuickViewModalProps) {
  const colors = (product?.colors ?? [])
    .map((entry) => parseColorEntry(entry))
    .filter((c): c is { label: string; swatch: string } => Boolean(c?.label));

  const sizes = product?.sizes ?? [];

  // Basic active image state so users can peek through multiple images
  const [activeIdx, setActiveIdx] = useState(0);
  const mainImage = product?.images?.[activeIdx] || product?.images?.[0];

  // Selectors & actions
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { items: wishlist, add: addWish, remove: removeWish } = useWishlist();
  const { showToast } = useToast();

  const onAddToCart = async () => {
    if (!product) return;
    const hasSizes = sizes.length > 0;
    const hasColors = colors.length > 0;
    if (hasSizes && !selectedSize) {
      showToast('Please select a size', 'warning');
      return;
    }
    const stock = Number(product.stockQuantity ?? 0);
    if (stock > 0 && qty > stock) {
      showToast(`Only ${stock} in stock`, 'warning');
      return;
    }
    await addToCart({
      productId: product._id,
      quantity: qty,
      selectedSize: selectedSize || '',
      selectedColor: hasColors ? colors[selectedColorIdx]?.label : '',
    });
  };

  const onToggleWishlist = async () => {
    if (!product) return;
    const onList = !!wishlist.find((w: any) => w._id === product._id);
    if (onList) {
      await removeWish({ productId: product._id });
      showToast('Removed from wishlist', 'success');
    } else {
      await addWish({ productId: product._id });
      showToast('Added to wishlist', 'success');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick Product Preview"
      widthClassName="max-w-[900px]"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner label="Loading product…" />
        </div>
      ) : !product ? (
        <div
          className="py-10 text-sm text-center"
          style={{ color: 'rgb(var(--muted))' }}
        >
          Product details unavailable right now.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[360px_1fr]">
          {/* Left: Image with small thumbnails */}
          <div className="space-y-3 sm:w-[360px]">
            <div className="overflow-hidden bg-gray-100 rounded-xl">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="object-cover w-full h-56 sm:h-96"
                />
              ) : (
                <div
                  className="flex min-h-[280px] items-center justify-center text-sm"
                  style={{ color: 'rgb(var(--muted))' }}
                >
                  No image available
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto overflow-y-visible px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.images.slice(0, 8).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`overflow-hidden rounded-md border ${
                      i === activeIdx ? 'ring-2 ring-black' : 'border-gray-200'
                    }`}
                    style={{ width: 56, height: 56 }}
                    aria-label={`Preview image ${i + 1}`}
                  >
                    <img
                      src={src}
                      className="object-cover w-full h-full"
                      alt={`${product.name} preview ${i + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                {product.brand || 'Featured'}
              </p>
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                {product.name}
              </h2>
            </div>

            <div className="flex items-baseline gap-2 text-xl font-semibold">
              <span>{formatCurrency(product.salePrice ?? product.price)}</span>
              {product.salePrice != null &&
                product.salePrice !== product.price && (
                  <span className="text-sm font-normal text-gray-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
            </div>

            {product.description &&
              (() => {
                const text = product.description || '';
                const truncated =
                  text.length > 260 ? text.slice(0, 257) + '…' : text;
                return (
                  <div className="p-3 text-sm leading-relaxed text-gray-700 rounded-md bg-gray-50 ring-1 ring-gray-100">
                    {truncated}
                  </div>
                );
              })()}

            {/* Selectors */}
            <div className="space-y-3">
              {colors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Colors
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 ml-1">
                    {colors.map((color, idx) => (
                      <button
                        key={`${color.label}-${idx}`}
                        onClick={() => setSelectedColorIdx(idx)}
                        className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium shadow-sm ${
                          selectedColorIdx === idx
                            ? 'border-black ring-1 ring-black'
                            : 'border-gray-200'
                        }`}
                        title={color.label}
                      >
                        <span
                          className="inline-flex w-3 h-3 border rounded-full border-white/80"
                          style={{
                            backgroundColor: color.swatch,
                            boxShadow: '0 0 0 1px rgba(15,23,42,0.08)',
                          }}
                          aria-hidden="true"
                        />
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                  Sizes
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(sizes.length ? sizes : ['One size']).map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSize(size === 'One size' ? '' : size)
                      }
                      className={`rounded-md border px-3 py-1 text-xs ${
                        selectedSize === size
                          ? 'border-black ring-1 ring-black'
                          : 'border-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="inline-flex items-center border rounded-md theme-border w-fit">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-9 w-9"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <div className="w-10 text-sm text-center">{qty}</div>
                  <button
                    onClick={() => {
                      const stock = Number(product.stockQuantity ?? 0);
                      const next = qty + 1;
                      if (stock > 0 && next > stock) {
                        showToast(`Only ${stock} in stock`, 'warning');
                        return;
                      }
                      setQty(next);
                    }}
                    className="h-9 w-9"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  className={`theme-border inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                    wishlist.find((w: any) => w._id === product._id)
                      ? 'bg-black text-white'
                      : 'bg-white text-black'
                  }`}
                  aria-label="Wishlist"
                  onClick={onToggleWishlist}
                  title="Wishlist"
                >
                  {(() => {
                    const onList = !!wishlist.find(
                      (w: any) => w._id === product._id,
                    );
                    return (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path d="M12 21s-6.716-4.39-9.193-7.63C1.49 11.66 1 9.93 1 8.5 1 6.015 3.015 4 5.5 4c1.54 0 3.04.79 3.9 2.06C10.46 4.79 11.96 4 13.5 4 15.985 4 18 6.015 18 8.5c0 1.43-.49 3.16-1.807 4.87C18.716 16.61 12 21 12 21z" />
                      </svg>
                    );
                  })()}
                </button>
              </div>

              <button
                className="w-full px-4 py-2 text-sm rounded-md btn-primary sm:w-auto"
                onClick={onAddToCart}
              >
                Add to Cart
              </button>
            </div>

            <div className="pt-1">
              <Link
                to={`/ProductDetails?id=${product._id}`}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white transition hover:bg-gray-900"
                onClick={onClose}
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
