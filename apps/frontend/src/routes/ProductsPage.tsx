import { gql, useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import Select, { type SelectOption } from '../components/ui/Select';
import Checkbox from '../components/ui/Checkbox';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';

const LIST_PRODUCTS = gql`
  query ListProducts {
    listProducts {
      id
      name
      brand
      category
      price
      salePrice
      stockQuantity
      images
    }
  }
`;

const LIST_CATEGORIES = gql`
  query ListCategories {
    listCategories {
      id
      name
      slug
      active
    }
  }
`;

export default function ProductsPage() {
  const { data, loading } = useQuery(LIST_PRODUCTS);
  const { data: catsData } = useQuery(LIST_CATEGORIES);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [brand, setBrand] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const products = useMemo(() => (data?.listProducts ?? []) as any[], [data]);
  const brands = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.brand && s.add(p.brand));
    return Array.from(s).sort();
  }, [products]);

  // TODO: Wire up the filters to the backend
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const min = minPrice.trim() === '' ? -Infinity : Number(minPrice);
    const max = maxPrice.trim() === '' ? Infinity : Number(maxPrice);
    return products.filter((p) => {
      if (
        term &&
        ![p.name, p.brand, p.category].join(' ').toLowerCase().includes(term)
      ) {
        return false;
      }
      if (cat && p.category !== cat?.split('-').join(' ')) return false;
      if (brand && p.brand !== brand) return false;
      if (inStockOnly && !(Number(p.stockQuantity ?? 0) > 0)) return false;
      if (onSaleOnly && p.salePrice == null) return false;
      const effectivePrice = Number(p.salePrice ?? p.price);
      if (!Number.isNaN(min) && effectivePrice < min) return false;
      if (!Number.isNaN(max) && effectivePrice > max) return false;
      return true;
    });
  }, [products, q, cat, brand, inStockOnly, onSaleOnly, minPrice, maxPrice]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            All Products
          </h1>
        </div>
        <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          {filtered.length} products
        </div>
      </div>

      {/* Search */}
      <div className="max-w-xl">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full px-10 py-2 border rounded-md theme-border"
          />
          <span className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 opacity-60">
            🔍
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters */}
        <aside className="lg:col-span-1">
          <div className="p-4 bg-white border rounded-lg theme-border">
            <div className="mb-3 text-base font-semibold">Filters</div>

            <div className="space-y-5 text-sm">
              <div>
                <div className="mb-1 font-medium">Category</div>
                <Select
                  value={cat}
                  onChange={setCat}
                  options={
                    [
                      { value: '', label: 'All categories' },
                      ...((catsData?.listCategories ?? [])
                        .filter((c: any) => c.active)
                        .map((c: any) => ({
                          value: c.slug as string,
                          label: c.name as string,
                        })) as SelectOption[]),
                    ] as SelectOption[]
                  }
                />
              </div>

              <div>
                <div className="mb-1 font-medium">Brand</div>
                <Select
                  value={brand}
                  onChange={setBrand}
                  options={
                    [
                      { value: '', label: 'All brands' },
                      ...brands.map((b) => ({ value: b, label: b })),
                    ] as SelectOption[]
                  }
                />
              </div>

              <div>
                <div className="mb-1 font-medium">Price Range (₦)</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 font-medium">Availability</div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={inStockOnly}
                    onChange={setInStockOnly}
                    label="In stock"
                  />
                  <Checkbox
                    checked={onSaleOnly}
                    onChange={setOnSaleOnly}
                    label="On sale"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Results grid */}
        <section className="lg:col-span-3">
          {loading ? (
            <div className="py-16">
              <Spinner label="Loading products" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex items-center justify-center py-16 text-sm bg-white border rounded-lg theme-border"
              style={{ color: 'rgb(var(--muted))' }}
            >
              No products found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p: any) => (
                <article
                  key={p.id}
                  className="bg-white border rounded-lg theme-border"
                >
                  <a href={`/ProductDetails?id=${p.id}`} className="block">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
                      {p.salePrice != null && (
                        <span className="absolute left-2 top-2 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Sale
                        </span>
                      )}
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                  </a>
                  <div className="p-3 space-y-1">
                    <div className="font-medium">{p.name}</div>
                    <div
                      className="text-xs"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      {p.brand || 'TheGlamStore'}
                    </div>
                    <div className="pt-1 font-semibold">
                      {p.salePrice != null ? (
                        <>
                          <span>{formatCurrency(p.salePrice)}</span>
                          <span
                            className="ml-2 text-sm line-through"
                            style={{ color: 'rgb(var(--muted))' }}
                          >
                            {formatCurrency(p.price)}
                          </span>
                        </>
                      ) : (
                        <span>{formatCurrency(p.price)}</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
