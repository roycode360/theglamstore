import { gql, useQuery } from '@apollo/client';
import { Link, useSearchParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/Toast';

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      id
      name
      brand
      category
      price
      salePrice
      description
      images
      sizes
      colors
    }
  }
`;

const LIST_PRODUCTS = gql`
  query ListProducts {
    listProducts {
      id
      name
      brand
      category
      price
      salePrice
      images
    }
  }
`;

export default function ProductDetails() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';

  const { data, loading } = useQuery(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });
  const { data: all } = useQuery(LIST_PRODUCTS);

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
      .filter((x) => x.id !== p.id && x.category === p.category)
      .slice(0, 3);
  }, [all, p]);

  const [activeImg, setActiveImg] = useState(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const { addToCart } = useCart();
  const { showToast } = useToast();

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

  // colorOptions already computed above



  const handleAddToCart = async () => {
    if (!activeSize || activeColorIdx === null) {
      showToast('Please select a size and color', 'error');
      return;
    }

    try {
      await addToCart({
        productId: p.id,
        quantity: qty,
        selectedSize: activeSize,
        selectedColor: colorOptions[activeColorIdx].label,
      });

      showToast('Item added to cart successfully!', 'success');
    } catch (error) {
      showToast('Failed to add item to cart', 'error');
    }
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
          <h1 className="text-4xl font-extrabold tracking-tight">{p.name}</h1>
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
          {colorOptions.length > 0 && (
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
          )}

          {/* Size */}
          {p.sizes?.length > 0 && (
            <div>
              <div className="mb-1 text-sm font-medium">Size</div>
              <div className="flex flex-wrap gap-2">
                {(p.sizes || []).map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setActiveSize(s)}
                    className={`theme-border rounded-md border px-3 py-1.5 text-sm ${activeSize === s ? 'btn-primary' : ''}`}
                    aria-label={s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
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
                onClick={() => setQty((n) => n + 1)}
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
              className="theme-border rounded-md border px-3 py-2"
              aria-label="Wishlist"
              title="Wishlist"
            >
              ♥
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
        ].map((item) => (
          <details key={item.k} className="group">
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
          {suggestions.map((s: any) => (
            <Link
              key={s.id}
              to={`/ProductDetails?id=${s.id}`}
              className="theme-border rounded-lg border bg-white"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
                {s.images?.[0] && (
                  <img
                    src={s.images[0]}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="space-y-1 p-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                  {s.brand || 'LUXE COLLECTION'}
                </div>
                <div className="pt-1 font-semibold">
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
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
