import { useQuery } from '@apollo/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import Select, { type SelectOption } from '../components/ui/Select';
import Checkbox from '../components/ui/Checkbox';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import ProductCard from '../components/ui/ProductCard';
import { LIST_PRODUCTS_PAGE } from '../graphql/products';
import { LIST_CATEGORIES, LIST_SUBCATEGORIES } from '../graphql/categories';

export default function ProductsPage() {
  const PAGE_SIZE = 12;
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [subcat, setSubcat] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const prevCatRef = useRef<string>('');

  const { data, loading, refetch } = useQuery(LIST_PRODUCTS_PAGE, {
    variables: {
      page,
      pageSize: PAGE_SIZE,
      search: q.trim() || undefined,
      category: cat.trim() || undefined,
      brand: undefined,
      minPrice: minPrice.trim() === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice.trim() === '' ? undefined : Number(maxPrice),
      inStockOnly: inStockOnly || undefined,
      onSaleOnly: onSaleOnly || undefined,
    },
    notifyOnNetworkStatusChange: true,
  });
  const { data: catsData } = useQuery(LIST_CATEGORIES);
  // Find parent category ID from slug
  const parentCategory = (catsData?.listCategories ?? []).find(
    (c: any) => c.slug === cat,
  );
  const { data: subcatsData } = useQuery(LIST_SUBCATEGORIES, {
    variables: { parentId: parentCategory?._id || '' },
    skip: !parentCategory?._id,
    fetchPolicy: 'cache-and-network',
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

  // Reset subcategory whenever category changes
  useEffect(() => {
    const categoryChanged = prevCatRef.current !== cat;
    if (categoryChanged) {
      setSubcat('');
      prevCatRef.current = cat;
    }
  }, [cat]);

  // Refetch when filters change (and reset to page 1); keep URL in sync
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (cat) next.set('category', cat);
    else next.delete('category');
    setParams(next, { replace: true });
    setPage(1);

    // Use subcategory if selected, otherwise use category
    // When category changes, subcat is reset to '', so use cat directly
    const categoryFilter = subcat.trim() || cat.trim() || undefined;

    refetch({
      page: 1,
      pageSize: PAGE_SIZE,
      search: q.trim() || undefined,
      category: categoryFilter,
      brand: undefined,
      minPrice: minPrice.trim() === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice.trim() === '' ? undefined : Number(maxPrice),
      inStockOnly: inStockOnly || undefined,
      onSaleOnly: onSaleOnly || undefined,
    });
  }, [
    q,
    cat,
    subcat,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    refetch,
    params,
  ]);

  // Scroll to top when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  // Keep a shared slugify if needed elsewhere
  const slugify = (s: string): string =>
    (s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');

  const products = useMemo(() => items as any[], [items]);
  // compute subcategory options from backend API (already sorted by name)
  const subcategoryOptions: Array<SelectOption> = useMemo(() => {
    const subs = (subcatsData?.listSubcategories ?? []) as Array<any>;
    const opts = [{ value: '', label: 'All subcategories' } as SelectOption];
    subs.forEach((s) =>
      opts.push({ value: s.slug as string, label: s.name }),
    );
    return opts as any;
  }, [subcatsData]);

  // Back-end filters applied for search and category via GraphQL variables above
  const filtered = useMemo(() => {
    return products; // all filtering handled server-side now
  }, [products]);

  return (
    <div className="px-4 py-10 space-y-8 sm:px-6 lg:px-8">
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
                        .filter((c: any) => !c.parentId) // Only show top-level categories
                        .map((c: any) => ({
                          value: c.slug as string,
                          label: c.name as string,
                        })) as SelectOption[]),
                    ] as SelectOption[]
                  }
                />
              </div>

              <div>
                <div className="mb-1 font-medium">Subcategory</div>
                <Select
                  value={subcat}
                  onChange={setSubcat}
                  options={subcategoryOptions as any}
                  disabled={subcategoryOptions.length <= 1}
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
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
          {/* Pagination controls (match admin design) */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 text-sm rounded-md btn-ghost h-9 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 text-sm rounded-md btn-primary h-9 disabled:cursor-not-allowed disabled:opacity-50"
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
