import { Link } from 'react-router-dom';
import ProductCard from '../../components/ui/ProductCard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Skeleton } from '../ui/Skeleton';

type FeaturedProductsSectionProps = {
  products: any[];
  loading: boolean;
};

export function FeaturedProductsSection({
  products,
  loading,
}: FeaturedProductsSectionProps) {
  // Build non-repetitive list of categories for products marked featured
  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p: any) => {
      if (p?.featured && p?.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!active && categories.length) setActive(categories[0]);
  }, [categories, active]);

  // Filter products by active category
  const shown = useMemo(() => {
    if (!active) return [] as any[];
    return (products || []).filter(
      (p: any) => p?.featured && p?.category === active,
    );
  }, [products, active]);

  // Sliding underline indicator
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    width: 0,
    transform: 'translateX(0px)',
  });

  const recalcIndicator = () => {
    if (!active) return;
    const btn = tabRefs.current[active];
    const wrap = tabsContainerRef.current;
    if (btn && wrap) {
      const wRect = wrap.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      const left = bRect.left - wRect.left;
      setIndicatorStyle({
        width: bRect.width,
        transform: `translateX(${left}px)`,
      });
    }
  };

  useEffect(() => {
    recalcIndicator();
    const onResize = () => recalcIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, categories]);

  // Simple fade transition on list change
  const [fadeIn, setFadeIn] = useState(true);
  useEffect(() => {
    setFadeIn(false);
    const t = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(t);
  }, [active]);

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-[1600px] px-4">
        {/* Tabs */}
        <div className="mb-8 hidden grid-cols-3 items-center gap-4 py-2 md:grid">
          <div className="flex items-center gap-10 pl-2 text-xs uppercase tracking-[0.18em]">
            <div
              ref={tabsContainerRef}
              className="relative flex items-center gap-10"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  ref={(el) => (tabRefs.current[c] = el)}
                  onClick={() => setActive(c)}
                  className={`relative pb-2 capitalize transition-colors ${
                    active === c
                      ? 'font-semibold text-black'
                      : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  {c}
                </button>
              ))}
              {/* indicator */}
              <span
                className="pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-black transition-transform duration-300"
                style={{
                  width: indicatorStyle.width as number,
                  transform: indicatorStyle.transform,
                }}
              />
            </div>
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-black">
            FEATURED PRODUCTS
          </h2>
          <div className="flex items-center justify-end pr-2">
            <Link
              to={`/products`}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] hover:underline"
            >
              <span className="h-[1px] w-8 bg-black"></span>
              <span className="pb-0.5">VIEW ALL PRODUCTS</span>
            </Link>
          </div>
        </div>
        {/* Mobile title */}
        <div className="mb-6 px-2 md:hidden">
          <h2 className="text-2xl font-bold tracking-tight text-black">
            FEATURED PRODUCTS
          </h2>
          {/* Simple pill tabs on mobile */}
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition ${
                  active === c
                    ? 'bg-black text-white'
                    : 'bg-white text-zinc-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <FeaturedProductsSkeleton />
      ) : (
        <div className="mx-auto max-w-[1600px]">
          <div
            className={`grid grid-cols-1 divide-x divide-y divide-gray-200 transition-all duration-300 sm:grid-cols-2 lg:grid-cols-4 ${
              fadeIn ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            {shown.map((p: any) => (
              <div key={p._id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FeaturedProductsSkeleton() {
  const placeholders = Array.from({ length: 4 });
  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="grid grid-cols-1 divide-x divide-y divide-gray-100 sm:grid-cols-2 lg:grid-cols-4">
        {placeholders.map((_, idx) => (
          <div
            key={idx}
            className="group relative border border-transparent bg-white"
          >
            <div className="overflow-hidden bg-white p-6">
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Skeleton className="h-full w-full" />
                <Skeleton className="absolute left-4 top-4 h-7 w-16 rounded-full opacity-80" />
                <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                  <Skeleton className="h-11 w-11 rounded-full opacity-90" />
                  <Skeleton className="h-11 w-11 rounded-full opacity-80" />
                  <Skeleton className="h-11 w-11 rounded-full opacity-70" />
                </div>
              </div>
            </div>
            <div className="space-y-3 px-6 pb-8">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
