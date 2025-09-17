import { gql, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import Select, { type SelectOption } from '../components/ui/Select';
import Checkbox from '../components/ui/Checkbox';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';

const LIST_PRODUCTS_PAGE = gql`
  query ListProductsPage(
    $page: Int!
    $pageSize: Int!
    $search: String
    $category: String
    $brand: String
    $minPrice: Float
    $maxPrice: Float
    $inStockOnly: Boolean
    $onSaleOnly: Boolean
  ) {
    listProductsPage(
      page: $page
      pageSize: $pageSize
      search: $search
      category: $category
      brand: $brand
      minPrice: $minPrice
      maxPrice: $maxPrice
      inStockOnly: $inStockOnly
      onSaleOnly: $onSaleOnly
    ) {
      items {
        _id
        name
        brand
        category
        price
        salePrice
        stockQuantity
        images
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;

const LIST_CATEGORIES = gql`
  query ListCategories {
    listCategories {
      _id
      name
      slug
    }
  }
`;

// Fetch all brands independently of current page/results
const LIST_ALL_BRANDS = gql`
  query ListProductsForBrands {
    listProducts {
      brand
    }
  }
`;

export default function ProductsPage() {
  const PAGE_SIZE = 12;
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [brand, setBrand] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data, loading, refetch } = useQuery(LIST_PRODUCTS_PAGE, {
    variables: {
      page,
      pageSize: PAGE_SIZE,
      search: q.trim() || undefined,
      category: cat.trim() || undefined,
      brand: brand.trim() || undefined,
      minPrice: minPrice.trim() === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice.trim() === '' ? undefined : Number(maxPrice),
      inStockOnly: inStockOnly || undefined,
      onSaleOnly: onSaleOnly || undefined,
    },
    notifyOnNetworkStatusChange: true,
  });
  const { data: catsData } = useQuery(LIST_CATEGORIES);
  const { data: allBrandsData } = useQuery(LIST_ALL_BRANDS, {
    fetchPolicy: 'cache-first',
  });

  const [items, setItems] = useState<any[]>([]);
  const totalPages = data?.listProductsPage?.totalPages ?? 1;
  const totalCount = data?.listProductsPage?.total ?? 0;

  useEffect(() => {
    const payload = data?.listProductsPage;
    setItems(payload?.items ?? []);
  }, [data]);

  // Initialize category from URL (one-time)
  useEffect(() => {
    const initial = params.get('category') || '';
    if (initial) setCat(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change (and reset to page 1); keep URL in sync
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (cat) next.set('category', cat);
    else next.delete('category');
    setParams(next, { replace: true });
    setPage(1);
    refetch({
      page: 1,
      pageSize: PAGE_SIZE,
      search: q.trim() || undefined,
      category: cat.trim() || undefined,
      brand: brand.trim() || undefined,
      minPrice: minPrice.trim() === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice.trim() === '' ? undefined : Number(maxPrice),
      inStockOnly: inStockOnly || undefined,
      onSaleOnly: onSaleOnly || undefined,
    });
  }, [q, cat, brand, minPrice, maxPrice, inStockOnly, onSaleOnly]);

  // Keep a shared slugify if needed elsewhere
  const slugify = (s: string): string =>
    (s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');

  const products = useMemo(() => items as any[], [items]);
  const allBrands = useMemo(() => {
    const s = new Set<string>();
    (allBrandsData?.listProducts ?? []).forEach((p: any) => {
      if (p?.brand) s.add(String(p.brand));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allBrandsData]);

  // Back-end filters applied for search and category via GraphQL variables above
  const filtered = useMemo(() => {
    return products; // all filtering handled server-side now
  }, [products]);

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
          {totalCount} products
        </div>
      </div>

      {/* Search */}
      <div className="max-w-xl">
        <div className="relative">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
            🔍
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters */}
        <aside className="lg:col-span-1">
          <div className="theme-border rounded-lg border bg-white p-4">
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
                      ...((catsData?.listCategories ?? []).map((c: any) => ({
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
                      ...allBrands.map((b) => ({ value: b, label: b })),
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
              className="theme-border flex items-center justify-center rounded-lg border bg-white py-16 text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              No products found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p: any) => (
                <Link
                  key={p._id}
                  to={`/ProductDetails?id=${p._id}`}
                  className="group block transform overflow-hidden rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white"
                >
                  <article className="theme-border group-hover:border-brand-300 rounded-lg border bg-white">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
                      {p.salePrice != null && (
                        <span className="absolute left-2 top-2 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Sale
                        </span>
                      )}
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <div className="font-medium">{p.name}</div>
                      <div
                        className="text-xs"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        {p.brand || 'TheGlamStore'}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="font-semibold">
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
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
          {/* Pagination controls (match admin design) */}
          {!loading && filtered.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-ghost h-9 rounded-md px-3 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn-primary h-9 rounded-md px-3 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
