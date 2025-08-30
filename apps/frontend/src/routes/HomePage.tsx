import { gql, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';

const LIST_FEATURED = gql`
  query ListProductsPage($page: Int!, $pageSize: Int!) {
    listProductsPage(
      page: $page
      pageSize: $pageSize
      sortBy: "createdAt"
      sortDir: "desc"
    ) {
      items {
        id
        name
        brand
        price
        salePrice
        images
        category
        featured
      }
    }
  }
`;

const LIST_CATEGORIES = gql`
  query ListCategories {
    listCategories {
      id
      name
      slug
      image
    }
  }
`;

export default function HomePage() {
  const { data: featData, loading: loadingP } = useQuery(LIST_FEATURED, {
    variables: { page: 1, pageSize: 8 },
  });
  const { data: catsData, loading: loadingC } = useQuery(LIST_CATEGORIES);
  const products = (featData?.listProductsPage?.items ?? []).filter(
    (p: any) => p?.featured,
  );
  const categories = (catsData?.listCategories ?? []).slice(0, 4);

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1800&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.75)',
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-24 text-center text-white">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Elevate Your
          </h1>
          <div
            className="h-10 w-80 rounded-md"
            style={{
              background:
                'linear-gradient(90deg, rgba(var(--brand-200)) 0%, rgba(var(--brand-400)) 50%, rgba(var(--brand-300)) 100%)',
            }}
          />
          <p className="max-w-2xl text-lg text-white/90">
            Discover premium fashion pieces that define modern elegance and
            timeless sophistication
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="btn-primary rounded-md px-4 py-2">
              Shop Collection
            </Link>
            <Link to="/" className="btn-ghost rounded-md px-4 py-2">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-semibold">Featured Collection</h2>
          <p className="mt-1 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Discover our handpicked selection of premium fashion pieces
          </p>
        </div>
        {loadingP ? (
          <div className="py-10">
            <Spinner label="Loading collection" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((p: any) => (
              <Link
                key={p.id}
                to={`/ProductDetails?id=${p.id}`}
                className="theme-border block rounded-lg border bg-white"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{p.name}</h3>
                    {p.salePrice != null && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        Sale
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    {p.brand || 'TheGlamStore COLLECTION'}
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
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Shop by Category */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-semibold">Shop by Category</h2>
          <p className="mt-1 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Explore our curated collections
          </p>
        </div>
        {loadingC ? (
          <div className="py-10">
            <Spinner label="Loading categories" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {categories.map((c: any) => (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                className="group relative overflow-hidden rounded-xl"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
                  {c.image && (
                    <img
                      src={c.image}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="rounded px-4 py-2 text-lg font-semibold text-white shadow-sm">
                    {c.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Value Props */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
          {[
            {
              k: 'Q',
              t: 'Premium Quality',
              d: 'Finest materials and expert craftsmanship',
            },
            {
              k: 'S',
              t: 'Sustainable',
              d: 'Ethically sourced and environmentally conscious',
            },
            { k: 'C', t: 'Curated', d: 'Handpicked by fashion experts' },
          ].map((v) => (
            <div key={v.k}>
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'rgb(var(--brand-300))',
                  color: 'rgb(var(--brand-900))',
                }}
              >
                {v.k}
              </div>
              <div className="font-semibold">{v.t}</div>
              <div
                className="mt-1 text-sm"
                style={{ color: 'rgb(var(--muted))' }}
              >
                {v.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-5xl px-4 py-10 text-center">
        <div className="mb-3 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: 'rgb(var(--brand-700))' }}>
              ★
            </span>
          ))}
        </div>
        <blockquote className="mx-auto max-w-3xl text-2xl italic leading-snug">
          "Fashion is about dressing according to what's fashionable. Style is
          more about being yourself."
        </blockquote>
        <p
          className="mx-auto mt-3 max-w-2xl text-sm"
          style={{ color: 'rgb(var(--muted))' }}
        >
          At TheGlamStore, we believe that true style comes from confidence and
          authenticity. Our carefully curated collections are designed to help
          you express your unique personality while maintaining the highest
          standards of quality and craftsmanship.
        </p>
      </section>

      {/* Footer moved to RootLayout */}
    </div>
  );
}
