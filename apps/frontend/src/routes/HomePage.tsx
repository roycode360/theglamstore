import { gql, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import { useEffect, useState } from 'react';

const LIST_FEATURED = gql`
  query ListFeaturedProducts {
    listFeaturedProducts {
      _id
      name
      brand
      price
      salePrice
      images
      category
      featured
    }
  }
`;

const LIST_CATEGORIES = gql`
  query ListCategories {
    listCategories {
      _id
      name
      slug
      image
    }
  }
`;

export default function HomePage() {
  const { data: featData, loading: loadingP } = useQuery(LIST_FEATURED);
  const { data: catsData, loading: loadingC } = useQuery(LIST_CATEGORIES);
  const products = featData?.listFeaturedProducts ?? [];
  const categories = (catsData?.listCategories ?? []).slice(0, 4);
  const [reveal, setReveal] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const words = ['Confidence', 'Elegance', 'Style'];
  const [typed, setTyped] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY || 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Typewriter effect for the accent bar text (with organic pauses)
  useEffect(() => {
    const current = words[wordIdx % words.length];
    const isComplete = typed === current;
    const isEmpty = typed.length === 0;

    // Base speeds
    let delay =
      (deleting ? 55 : 95) + Math.floor(Math.random() * (deleting ? 40 : 120));
    // Natural stutter mid-word
    if (!deleting && typed.length > 0 && Math.random() < 0.07) delay += 220;
    // Pause at full word
    if (!deleting && isComplete) delay = 900 + Math.floor(Math.random() * 900);
    // Pause before moving to next word
    if (deleting && isEmpty) delay = 250 + Math.floor(Math.random() * 300);

    const id = setTimeout(() => {
      if (!deleting) {
        if (!isComplete) {
          setTyped(current.slice(0, typed.length + 1));
        } else {
          setDeleting(true);
        }
      } else {
        if (!isEmpty) {
          setTyped(current.slice(0, typed.length - 1));
        } else {
          setDeleting(false);
          setWordIdx((i) => (i + 1) % words.length);
        }
      }
    }, delay);

    return () => clearTimeout(id);
  }, [typed, deleting, wordIdx]);

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg">
        {/* Background Image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1200&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)',
            transform: `translateY(${scrollY * 0.2}px) scale(${1 + Math.min(scrollY / 3000, 0.03)})`,
            willChange: 'transform',
          }}
        />
        {/* Overlay gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"
          style={{ willChange: 'transform' }}
        />
        {/* Decorative brand blobs */}
        <div
          className="absolute rounded-full pointer-events-none -left-20 -top-20 h-72 w-72 opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(var(--brand-300),0.9) 0%, rgba(var(--brand-500),0.5) 60%, transparent 100%)',
            animation: 'floatY 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none -right-24 top-24 h-80 w-80 opacity-30 blur-3xl"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(var(--brand-200),0.8) 0%, rgba(var(--brand-400),0.5) 60%, transparent 100%)',
            animation: 'floatX 14s ease-in-out infinite',
          }}
        />

        {/* Content */}
        <div
          className={`relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-24 text-center text-white transition-all duration-700 ease-out ${
            reveal ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
          style={
            reveal
              ? {
                  transform: `translateY(${Math.max(-scrollY * 0.05, -40)}px)`,
                  willChange: 'transform',
                }
              : undefined
          }
        >
          <h1
            className={`text-4xl font-extrabold tracking-tight transition-all duration-700 md:text-6xl ${
              reveal ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Elevate Your
          </h1>

          {/* Animated gradient accent */}
          <div className="relative h-12 w-80 overflow-hidden rounded-md ring-1 ring-white/20 md:h-14 md:w-[28rem]">
            <div
              className="absolute inset-0 z-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(var(--brand-200),0.9) 0%, rgba(var(--brand-400),0.95) 50%, rgba(var(--brand-300),0.9) 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradientMove 12s linear infinite',
              }}
            />
            <div
              className="absolute inset-0 z-0"
              style={{
                background:
                  'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.35) 40%, transparent 60%)',
                backgroundSize: '300% 100%',
                animation: 'shine 3s linear infinite',
              }}
            />
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="whitespace-nowrap px-4 text-xl font-semibold uppercase tracking-[0.35em] text-white md:text-3xl md:tracking-[0.45em]">
                {typed}
                <span
                  className="ml-2 inline-block h-[1.2em] w-[3px] bg-white/90"
                  style={{
                    animation: 'cursorBlink 1.1s steps(2, start) infinite',
                  }}
                />
              </span>
            </div>
          </div>

          <p
            className={`max-w-2xl text-lg text-white/90 transition-all delay-100 duration-700 ${
              reveal ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            Discover premium fashion pieces that define modern elegance and
            timeless sophistication
          </p>
          <div
            className={`flex flex-wrap items-center justify-center gap-3 transition-all delay-150 duration-700 ${
              reveal ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            <Link
              to={`/categories`}
              className="btn-primary rounded-md px-4 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Shop Collection
            </Link>
            <Link
              to={`/products`}
              className="btn-ghost rounded-md px-4 py-2 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            >
              View All Products →
            </Link>
          </div>
        </div>

        {/* Local keyframes for subtle animations */}
        <style>{`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes shine {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes floatY {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(18px); }
          }
          @keyframes floatX {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-18px); }
          }
          @keyframes cursorBlink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>
      </section>

      {/* Featured Collection */}
      <section className="px-2 mx-auto max-w-7xl sm:px-4">
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
                key={p._id}
                to={`/ProductDetails?id=${p._id}`}
                className="block bg-white border rounded-lg theme-border"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div className="p-3 space-y-1">
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
      <section className="px-2 mx-auto max-w-7xl sm:px-4">
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
                key={c._id}
                to={`/products?category=${c.slug}`}
                className="relative overflow-hidden group rounded-xl"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
                  {c.image && (
                    <img
                      src={c.image}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="px-4 py-2 text-lg font-semibold text-white rounded shadow-sm">
                    {c.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Value Props */}
      <section className="px-2 py-10 mx-auto max-w-7xl sm:px-4">
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
                className="flex items-center justify-center mx-auto mb-3 rounded-full h-14 w-14"
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
      <section className="max-w-5xl px-4 py-10 mx-auto text-center">
        <div className="flex items-center justify-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: 'rgb(var(--brand-700))' }}>
              ★
            </span>
          ))}
        </div>
        <blockquote className="max-w-3xl mx-auto text-2xl italic leading-snug">
          "Fashion is about dressing according to what's fashionable. Style is
          more about being yourself."
        </blockquote>
        <p
          className="max-w-2xl mx-auto mt-3 text-sm"
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
