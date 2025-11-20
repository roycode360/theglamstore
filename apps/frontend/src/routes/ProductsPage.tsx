import { NetworkStatus, useApolloClient, useQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Select, { type SelectOption } from '../components/ui/Select';
import Checkbox from '../components/ui/Checkbox';
import Input from '../components/ui/Input';
import ProductCard from '../components/ui/ProductCard';
import { LIST_PRODUCTS_PAGE } from '../graphql/products';
import { LIST_CATEGORIES, LIST_SUBCATEGORIES } from '../graphql/categories';
import { Skeleton } from '../components/ui/Skeleton';

export default function ProductsPage() {
  const PAGE_SIZE = 12;
  const [params, setParams] = useSearchParams();
  const apollo = useApolloClient();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [subcat, setSubcat] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const prevCatRef = useRef<string>('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadMoreLockRef = useRef(false);
  const [initialized, setInitialized] = useState(false);

  const categoryFilter = useMemo(() => {
    const selected = (subcat || cat).trim();
    return selected ? selected : undefined;
  }, [cat, subcat]);

  const baseFilters = useMemo(
    () => ({
      pageSize: PAGE_SIZE,
      search: q.trim() || undefined,
      category: categoryFilter,
      brand: undefined,
      minPrice: minPrice.trim() === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice.trim() === '' ? undefined : Number(maxPrice),
      inStockOnly: inStockOnly || undefined,
      onSaleOnly: onSaleOnly || undefined,
    }),
    [PAGE_SIZE, q, categoryFilter, minPrice, maxPrice, inStockOnly, onSaleOnly],
  );

  const queryVariables = useMemo(
    () => ({
      ...baseFilters,
      page: 1,
    }),
    [baseFilters],
  );

  const { data, loading, fetchMore, networkStatus } = useQuery(
    LIST_PRODUCTS_PAGE,
    {
      variables: queryVariables,
      notifyOnNetworkStatusChange: true,
    },
  );
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

  const totalPages = data?.listProductsPage?.totalPages ?? 1;
  const totalCount = data?.listProductsPage?.total ?? 0;
  const currentPage = data?.listProductsPage?.page ?? 1;
  const hasMore = !!data?.listProductsPage && currentPage < totalPages;
  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isInitialLoading = !data?.listProductsPage && loading;

  const loadNextPage = useCallback(async () => {
    if (!hasMore || isFetchingMore || loadMoreLockRef.current) return;
    loadMoreLockRef.current = true;
    try {
      await fetchMore({
        variables: {
          ...baseFilters,
          page: currentPage + 1,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.listProductsPage) {
            return previousResult ?? fetchMoreResult;
          }
          if (!previousResult?.listProductsPage) {
            return fetchMoreResult;
          }

          const prevItems = previousResult.listProductsPage.items ?? [];
          const nextItems = fetchMoreResult.listProductsPage.items ?? [];
          const mergedItems = [...prevItems];

          nextItems.forEach((item: any) => {
            if (
              !mergedItems.some((existing: any) => existing?._id === item?._id)
            ) {
              mergedItems.push(item);
            }
          });

          return {
            listProductsPage: {
              ...fetchMoreResult.listProductsPage,
              items: mergedItems,
            },
          };
        },
      });
    } finally {
      loadMoreLockRef.current = false;
    }
  }, [hasMore, isFetchingMore, fetchMore, baseFilters, currentPage]);

  // Initialize filters from URL (handle both category and subcategory)
  useEffect(() => {
    if (initialized) return;
    const parents = (catsData?.listCategories ?? []).filter(
      (c: any) => !c.parentId,
    );
    const parentSlugs = new Set(parents.map((c: any) => c.slug));

    const urlCat = params.get('category') || '';
    const urlSub = params.get('subcategory') || '';

    const setFromSub = async (subSlug: string) => {
      // Try to find parent by scanning categories' subcategories
      for (const parent of parents) {
        try {
          const res = await apollo.query({
            query: LIST_SUBCATEGORIES,
            variables: { parentId: parent._id },
            fetchPolicy: 'cache-first',
          });
          const match = (res?.data?.listSubcategories ?? []).find(
            (s: any) => s.slug === subSlug,
          );
          if (match) {
            setCat(parent.slug);
            setSubcat(subSlug);
            break;
          }
        } catch (e) {
          // ignore and continue
        }
      }
    };

    (async () => {
      if (urlSub) {
        // explicit subcategory param wins; set parent if present or resolve
        if (urlCat && parentSlugs.has(urlCat)) setCat(urlCat);
        await setFromSub(urlSub);
        setInitialized(true);
        return;
      }
      if (urlCat) {
        if (parentSlugs.has(urlCat)) {
          setCat(urlCat);
          setInitialized(true);
          return;
        }
        // Treat as subcategory slug and resolve parent
        await setFromSub(urlCat);
        setInitialized(true);
        return;
      }
      setInitialized(true);
    })();
  }, [catsData, params, apollo, initialized]);

  // Reset subcategory whenever category changes
  useEffect(() => {
    const categoryChanged = prevCatRef.current !== cat;
    if (categoryChanged) {
      if (initialized) setSubcat('');
      prevCatRef.current = cat;
    }
  }, [cat, initialized]);

  // Keep URL in sync with current filters
  useEffect(() => {
    if (!initialized) return;
    const next = new URLSearchParams();
    if (cat) next.set('category', cat);
    if (subcat) next.set('subcategory', subcat);
    if (q.trim()) next.set('q', q.trim());
    if (minPrice.trim()) next.set('minPrice', minPrice.trim());
    if (maxPrice.trim()) next.set('maxPrice', maxPrice.trim());
    if (!inStockOnly) next.set('inStockOnly', 'false');
    if (onSaleOnly) next.set('onSaleOnly', 'true');
    setParams(next, { replace: true });
  }, [
    cat,
    subcat,
    q,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    initialized,
    setParams,
  ]);

  // Keep a shared slugify if needed elsewhere
  const slugify = (s: string): string =>
    (s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');

  const products = useMemo(
    () => (data?.listProductsPage?.items ?? []) as any[],
    [data],
  );
  // compute subcategory options from backend API (already sorted by name)
  const subcategoryOptions: Array<SelectOption> = useMemo(() => {
    const subs = (subcatsData?.listSubcategories ?? []) as Array<any>;
    const opts = [{ value: '', label: 'All subcategories' } as SelectOption];
    subs.forEach((s) => opts.push({ value: s.slug as string, label: s.name }));
    return opts as any;
  }, [subcatsData]);

  // Back-end filters applied for search and category via GraphQL variables above
  const filtered = useMemo(() => {
    return products; // all filtering handled server-side now
  }, [products]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [loadNextPage, hasMore, filtered.length]);

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
          {isInitialLoading ? (
            <ProductsGridSkeleton />
          ) : filtered.length === 0 ? (
            <div
              className="flex items-center justify-center py-16 text-sm bg-white border rounded-lg theme-border"
              style={{ color: 'rgb(var(--muted))' }}
            >
              No products found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p: any) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {isFetchingMore && <LoadingMoreSkeletonRow />}
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center mt-6 text-xs"
                style={{ color: 'rgb(var(--muted))' }}
              >
                {hasMore
                  ? isFetchingMore
                    ? 'Loading more products...'
                    : 'Scroll to load more'
                  : 'You have reached the end'}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductsGridSkeleton() {
  const placeholders = Array.from({ length: 6 });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholders.map((_, idx) => (
          <SkeletonProductCard key={idx} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-20 rounded-md h-9" />
          <Skeleton className="w-20 rounded-md h-9" />
        </div>
      </div>
    </div>
  );
}

function LoadingMoreSkeletonRow() {
  const placeholders = Array.from({ length: 3 });
  return (
    <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
      {placeholders.map((_, idx) => (
        <SkeletonProductCard key={idx} />
      ))}
    </div>
  );
}

function SkeletonProductCard() {
  return (
    <div className="relative group">
      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-100/70">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
        <div className="px-5 pt-4 pb-5 space-y-3">
          <Skeleton className="w-16 h-3 rounded-full" />
          <Skeleton className="w-3/4 h-5 rounded-lg" />
          <Skeleton className="w-1/3 h-4 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
