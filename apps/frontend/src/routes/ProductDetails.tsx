import { gql, useQuery } from '@apollo/client';
import { Link, useSearchParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../components/ui/Toast';
import { TProduct } from 'src/types';
import { LIST_PRODUCTS } from 'src/graphql/products';
import { GET_CART_ITEMS } from '../graphql/cart';

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      _id
      name
      brand
      category
      price
      salePrice
      stockQuantity
      description
      images
      sizes
      colors
    }
  }
`;

export default function ProductDetails() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';

  const { data, loading } = useQuery<{ getProduct: TProduct }>(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });

  const { data: all } = useQuery<{ listProducts: TProduct[] }>(LIST_PRODUCTS);
  const { data: cartData } = useQuery(GET_CART_ITEMS);

  // Compute color options from raw data unconditionally to keep hook order stable
  const colorOptions = useMemo(() => {
    const raw = ((data as any)?.getProduct?.colors ?? []) as string[];
    return raw.map((c) => {
      const parts = c.split('|');
      if (parts.length === 2) {
        return { label: parts[0] || parts[1], swatch: parts[1] };
      }
      return { label: c, swatch: c };
    });
  }, [data]);

  const p = data?.getProduct ?? null;
  const suggestions = useMemo(() => {
    const items = (all?.listProducts ?? []) as any[];
    if (!p) return items.slice(0, 3);
    return items
      .filter((x) => x.id !== p._id && x.category === p.category)
      .slice(0, 3);
  }, [all, p]);

  const [activeImg, setActiveImg] = useState(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { items: wishlist, add: addWish, remove: removeWish } = useWishlist();

  // console.log(cartItemCount, 'cartItemCount');

  if (loading) {
    return (
      <div className="py-16">
        <Spinner label="Loading product" />
      </div>
    );
  }
  if (!p) {
    return (
      <div
        className="theme-border flex items-center justify-center rounded-lg border bg-white py-16 text-sm"
        style={{ color: 'rgb(var(--muted))' }}
      >
        Product not found
      </div>
    );
  }

  const handleAddToCart = async () => {
    // Validate required selections based on what the product actually has
    const hasSizes = p.sizes && p.sizes.length > 0;
    const hasColors = colorOptions.length > 0;

    if (hasSizes && !activeSize) {
      showToast('Please select a size', 'warning');
      return;
    }

    if (hasColors && activeColorIdx === null) {
      showToast('Please select a color', 'warning');
      return;
    }

    // If product has no size or color options, we can proceed without selection

    const stock = Number((p as any)?.stockQuantity ?? 0);
    const productId = p._id;
    const existingForProduct = (cartData?.getCartItems ?? []).filter(
      (ci: any) => ci?.product?._id === productId,
    );
    const totalInCart = existingForProduct.reduce(
      (sum: number, ci: any) => sum + (ci?.quantity || 0),
      0,
    );
    if (stock > 0 && totalInCart + qty > stock) {
      const remaining = Math.max(0, stock - totalInCart);
      const msg =
        totalInCart === 0
          ? `Only ${stock} in stock`
          : remaining > 0
            ? `Only ${remaining} more in stock`
            : `Only ${stock} in stock`;
      showToast(msg, 'warning');
      return;
    }

    await addToCart({
      productId: p._id,
      quantity: qty,
      selectedSize: activeSize || '',
      selectedColor: hasColors ? colorOptions[activeColorIdx]?.label : '',
    });
  };

  return (
    <div className="space-y-12">
      {/* Top section */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          <div className="mb-3 flex gap-2">
            {(p.images ?? []).slice(0, 4).map((src: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`theme-border overflow-hidden rounded-md border bg-gray-50 ${i === activeImg ? 'ring-brand-400 ring-2' : ''}`}
                style={{ width: 64, height: 64 }}
                aria-label={`Image ${i + 1}`}
              >
                {src && (
                  <img src={src} className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
          <div className="relative h-[60vh] overflow-hidden rounded-lg bg-gray-100 md:h-[70vh]">
            {p.images?.[activeImg] && (
              <img
                src={p.images[activeImg]}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
            {p.brand ? p.brand.toUpperCase() : 'LUXE COLLECTION'}
          </div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight">{p.name}</h1>
            {typeof p.stockQuantity === 'number' && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                  p.stockQuantity > 0
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {p.stockQuantity > 0 ? 'In stock' : 'Out of stock'}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold">
            {p.salePrice != null ? (
              <>
                <span>{formatCurrency(p.salePrice)}</span>
                <span
                  className="ml-2 text-base line-through"
                  style={{ color: 'rgb(var(--muted))' }}
                >
                  {formatCurrency(p.price)}
                </span>
              </>
            ) : (
              <span>{formatCurrency(p.price)}</span>
            )}
          </div>
          <p
            className="max-w-prose text-sm"
            style={{ color: 'rgb(var(--muted))' }}
          >
            {p.description ||
              'A luxurious piece crafted with attention to detail.'}
          </p>

          {/* Color */}
          {colorOptions.length > 0 ? (
            <div>
              <div className="mb-1 text-sm font-medium">
                Color: {colorOptions[activeColorIdx]?.label}
              </div>
              <div className="flex gap-2">
                {colorOptions.map((opt, i) => (
                  <button
                    key={`${opt.label}-${i}`}
                    onClick={() => setActiveColorIdx(i)}
                    className={`h-8 w-8 rounded-full border ${
                      i === activeColorIdx
                        ? 'border-black ring-2 ring-black ring-offset-2 ring-offset-white'
                        : 'theme-border'
                    }`}
                    style={{ backgroundColor: opt.swatch }}
                    aria-label={opt.label}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Available in default color
            </div>
          )}

          {/* Size */}
          {p.sizes?.length > 0 ? (
            <div>
              <div className="mb-1 text-sm font-medium">Size</div>
              <div className="flex flex-wrap gap-2">
                {(p.sizes || []).map((s: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveSize(s)}
                    className={`theme-border rounded-md border px-3 py-1.5 text-sm ${activeSize === s ? 'btn-primary' : ''}`}
                    aria-label={s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">One size fits all</div>
          )}

          {/* Quantity + CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="theme-border inline-flex items-center rounded-md border">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="h-10 w-10"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <div className="w-12 text-center">{qty}</div>
              <button
                onClick={() => {
                  const stock = Number((p as any)?.stockQuantity ?? 0);
                  const productId = p._id;
                  const existingForProduct = (
                    cartData?.getCartItems ?? []
                  ).filter((ci: any) => ci?.product?._id === productId);
                  const totalInCart = existingForProduct.reduce(
                    (sum: number, ci: any) => sum + (ci?.quantity || 0),
                    0,
                  );
                  const next = qty + 1;
                  if (stock > 0 && totalInCart + next > stock) {
                    const msg = `Only ${stock} in stock`;
                    showToast(msg, 'warning');
                    return;
                  }
                  setQty(next);
                }}
                className="h-10 w-10"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              className="btn-primary rounded-md px-5 py-2.5"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
            <button
              className="theme-border inline-flex h-10 w-10 items-center justify-center rounded-md border transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="Wishlist"
              title="Wishlist"
              aria-pressed={!!wishlist.find((w: any) => w._id === p._id)}
              onClick={async () => {
                try {
                  const onList = !!wishlist.find((w: any) => w._id === p._id);
                  if (onList) {
                    await removeWish({ productId: p._id });
                    showToast('Removed from wishlist', 'success');
                  } else {
                    await addWish({ productId: p._id });
                    showToast('Added to wishlist', 'success');
                  }
                } catch (e) {
                  showToast('Failed to update wishlist', 'error');
                }
              }}
            >
              {(() => {
                const onList = !!wishlist.find((w: any) => w._id === p._id);
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
              })()}
            </button>
          </div>
        </div>
      </section>

      {/* Accordions */}
      <section className="theme-border divide-y rounded-md border bg-white">
        {[
          {
            k: 'Full Description',
            d: p.description || 'No description available.',
          },
          {
            k: 'Materials & Care',
            d: 'Premium materials. Dry clean recommended.',
          },
          { k: 'Shipping', d: 'Ships within 3-5 business days.' },
          { k: 'Returns', d: '30-day return policy.' },
        ].map((item, i) => (
          <details key={i} className="group">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
              <span className="font-medium">{item.k}</span>
              <span className="opacity-60">▾</span>
            </summary>
            <div
              className="px-4 pb-4 text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              {item.d}
            </div>
          </details>
        ))}
      </section>

      {/* Suggestions */}
      <section>
        <div className="mb-2">
          <h2 className="text-2xl font-extrabold tracking-tight">
            You Might Also Like
          </h2>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Discover other pieces from this collection
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((s: TProduct, i: number) => (
            <Link
              key={i}
              to={`/ProductDetails?id=${s._id}`}
              className="theme-border hover:border-brand-300 group transform overflow-hidden rounded-lg border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
                {s.images?.[0] && (
                  <img
                    src={s.images[0]}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="space-y-1 p-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  {s.brand || 'LUXE COLLECTION'}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="font-semibold">
                    {s.salePrice != null ? (
                      <>
                        <span>{formatCurrency(s.salePrice)}</span>
                        <span
                          className="ml-2 text-sm line-through"
                          style={{ color: 'rgb(var(--muted))' }}
                        >
                          {formatCurrency(s.price)}
                        </span>
                      </>
                    ) : (
                      <span>{formatCurrency(s.price)}</span>
                    )}
                  </div>
                  {typeof (s as any).stockQuantity === 'number' && (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                        (s as any).stockQuantity > 0
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      {(s as any).stockQuantity > 0
                        ? 'In stock'
                        : 'Out of stock'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
