import { useQuery } from '@apollo/client';
import { Link, useSearchParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../components/ui/Toast';
import { TProduct } from 'src/types';
import {
  LIST_PRODUCTS_BY_CATEGORY,
  GET_PRODUCT,
} from 'src/graphql/products';
import { GET_CART_ITEMS } from '../graphql/cart';
import ProductCard from '../components/ui/ProductCard';
import { LIST_CATEGORIES } from '../graphql/categories';

export default function ProductDetails() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';

  const { data, loading } = useQuery<{ getProduct: TProduct }>(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });

  const { data: relatedData } = useQuery<{
    listProductsByCategory: TProduct[];
  }>(LIST_PRODUCTS_BY_CATEGORY, {
    skip: !data?.getProduct?.category,
    variables: {
      category: data?.getProduct?.category || '',
      limit: 3,
      excludeId: data?.getProduct?._id,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const { data: cartData } = useQuery(GET_CART_ITEMS);
  const { data: categoriesData } = useQuery(LIST_CATEGORIES);

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
    const items = (relatedData?.listProductsByCategory ?? []) as TProduct[];
    return items.slice(0, 3);
  }, [relatedData]);

  // Find category name from slug
  const categoryInfo = useMemo(() => {
    if (!p?.category || !categoriesData?.listCategories) return null;
    const categories = (categoriesData.listCategories as any[]) ?? [];
    const category = categories.find((c: any) => c.slug === p.category);
    return category ? { name: category.name, slug: category.slug } : null;
  }, [p?.category, categoriesData]);

  const [activeImg, setActiveImg] = useState(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState<boolean[]>([]);

  // Initialize thumbnail loaded states
  useState(() => {
    setThumbnailLoaded(new Array(p?.images?.length || 0).fill(false));
  });

  // Reset image loaded state when active image changes
  const handleImageChange = (index: number) => {
    setActiveImg(index);
    setImageLoaded(false);
  };

  // Handle thumbnail load
  const handleThumbnailLoad = (index: number) => {
    setThumbnailLoaded((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

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
    <div className="space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      {/* Top section */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          {/* Mobile Continue Shopping Button */}
          <div className="mb-4 flex justify-end sm:hidden">
            <Link
              to="/products"
              className="theme-border text-brand hover:bg-brand-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition-colors"
              title="Continue Shopping"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10.72 4.22a.75.75 0 0 1 0 1.06L5.56 10.5H21a.75.75 0 0 1 0 1.5H5.56l5.16 5.22a.75.75 0 0 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
          <div className="mb-3 flex gap-2">
            {(p.images ?? []).slice(0, 4).map((src: string, i: number) => (
              <button
                key={i}
                onClick={() => handleImageChange(i)}
                className={`theme-border relative overflow-hidden rounded-md border bg-gray-50 ${i === activeImg ? 'ring-brand-400 ring-2' : ''}`}
                style={{ width: 64, height: 64 }}
                aria-label={`Image ${i + 1}`}
              >
                {/* Thumbnail loading skeleton */}
                {!thumbnailLoaded[i] && (
                  <div className="absolute inset-0 animate-pulse bg-gray-200">
                    <div className="mx-auto mt-5 h-4 w-4 animate-pulse rounded-full bg-gray-300"></div>
                  </div>
                )}
                {src && (
                  <img
                    src={src}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      thumbnailLoaded[i] ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                    decoding="async"
                    alt={`${p.name} thumbnail ${i + 1}`}
                    onLoad={() => handleThumbnailLoad(i)}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="relative h-[60vh] overflow-hidden rounded-lg bg-gray-100 md:h-[70vh]">
            {/* Enhanced loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                  <div className="h-20 w-20 animate-pulse rounded-full bg-gray-300"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-300"></div>
                    <div className="h-2 w-24 animate-pulse rounded bg-gray-300"></div>
                  </div>
                </div>
              </div>
            )}
            {p.images?.[activeImg] && (
              <img
                src={p.images[activeImg]}
                loading="lazy"
                decoding="async"
                alt={p.name}
                onLoad={() => setImageLoaded(true)}
                className={`h-full w-full object-cover transition-all duration-700 ease-out ${
                  imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                }`}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Category badge */}
          {categoryInfo && (
            <div>
              <Link
                to={`/products?category=${categoryInfo.slug}`}
                className="theme-border inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
                style={{ color: 'rgb(var(--muted))' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{categoryInfo.name}</span>
              </Link>
            </div>
          )}
          <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
            {p.brand ? p.brand.toUpperCase() : 'LUXE COLLECTION'}
          </div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight">{p.name}</h1>
            {typeof p.stockQuantity === 'number' && (
              <span
                className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${
                  p.stockQuantity > 0
                    ? 'border-gray-200 bg-gray-50 text-gray-700'
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
            <ProductCard key={s._id} product={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
