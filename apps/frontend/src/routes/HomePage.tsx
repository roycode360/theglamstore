import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ui/ProductCard';
import { LIST_FEATURED } from '../graphql/products';
import { LIST_CATEGORIES } from '../graphql/categories';
import { GET_COMPANY_SETTINGS } from '../graphql/settings';

export default function HomePage() {
  const { data: featData, loading: loadingP } = useQuery(LIST_FEATURED);
  const { data: catsData, loading: loadingC } = useQuery(LIST_CATEGORIES);
  const { data: settingsData, loading: loadingSettings } =
    useQuery(GET_COMPANY_SETTINGS);
  const products = featData?.listFeaturedProducts ?? [];
  const categories = (catsData?.listCategories ?? []).slice(0, 8);
  const [reveal, setReveal] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const founders = useMemo(() => {
    const raws = settingsData?.companySettings?.founders ?? [];
    return raws
      .filter((f: any) => f && (f.visible ?? true))
      .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)) as Array<{
      name: string;
      title?: string | null;
      bio?: string | null;
      imageUrl: string;
      order?: number | null;
      visible?: boolean | null;
    }>;
  }, [settingsData?.companySettings?.founders]);

  // Mock reviews data for testimonials section
  const reviews = [
    {
      id: 1,
      name: 'Christina M.',
      location: 'Canada',
      rating: 5,
      quote:
        "Best purchase I’ve made this winter! The color and knitting are exquisite and it's so comfy!",
      image:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1600&auto=format&fit=crop',
    },
    {
      id: 2,
      name: 'Aisha B.',
      location: 'Nigeria',
      rating: 4,
      quote:
        'Quality is top-notch and delivery was fast. Got so many compliments already!',
      image:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1600&auto=format&fit=crop',
    },
    {
      id: 3,
      name: 'Laura P.',
      location: 'United Kingdom',
      rating: 5,
      quote:
        'Fit is perfect and the fabric feels premium. Will definitely buy again.',
      image:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1600&auto=format&fit=crop',
    },
    {
      id: 4,
      name: 'Zainab K.',
      location: 'UAE',
      rating: 5,
      quote:
        'Love the attention to detail. The styling tips on the site were so helpful!',
      image:
        'https://images.unsplash.com/photo-1544005316-04ce1f3b5a57?q=80&w=1600&auto=format&fit=crop',
    },
    {
      id: 5,
      name: 'Sophia R.',
      location: 'USA',
      rating: 4,
      quote:
        'Great value for the price. Packaging was beautiful and eco-friendly too.',
      image:
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1600&auto=format&fit=crop',
    },
  ];

  const [reviewIndex, setReviewIndex] = useState(0);
  const currentReview = reviews[reviewIndex];
  const goPrevReview = () =>
    setReviewIndex((i) => (i - 1 + reviews.length) % reviews.length);
  const goNextReview = () => setReviewIndex((i) => (i + 1) % reviews.length);

  // Dual-column hero slides (left/right images + messaging). Include fallbacks with light backgrounds
  const HERO_PAIRS: Array<{
    left: string[];
    right: string[];
    title: string;
    desc: string;
  }> = [
    {
      left: [
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2940',
      ],
      right: [
        'https://images.unsplash.com/photo-1512201078372-9c6b2a0d528a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2073',
      ],
      title: 'DENIM JACKET WITH DECORATIVE EMBROIDERY',
      desc: 'Relaxed design, classic denim jacket made from rich cotton fabric with elastic blend.',
    },
    {
      left: [
        'https://plus.unsplash.com/premium_photo-1712844068865-4e44f800f5c6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2816',
      ],
      right: [
        'https://images.unsplash.com/photo-1582142407894-ec85a1260a46?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070',
      ],
      title: 'ELEVATED ESSENTIALS FOR EVERYDAY',
      desc: 'Timeless silhouettes in premium fabrics designed for modern versatility.',
    },
    {
      left: [
        'https://images.unsplash.com/photo-1646083774155-2a40b675641d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070',
      ],
      right: [
        'https://images.unsplash.com/photo-1727991053349-7985a6155ff4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070',
      ],
      title: 'NEW SEASON, NEW TEXTURES',
      desc: 'Discover refined layers handpicked by our editors for the season ahead.',
    },
  ];

  useEffect(() => {
    const id = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-rotate hero slides with vertical opposing motion
  useEffect(() => {
    const id = setInterval(() => {
      setIsSliding(true);
      const commit = setTimeout(() => {
        setHeroIndex((i) => (i + 1) % HERO_PAIRS.length);
        setIsSliding(false);
      }, 750);
      return () => clearTimeout(commit);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Hero - dual column vertical slider - FULL WIDTH */}
      <section className="relative w-full overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Left image - vertical slider */}
          <div className="relative -mr-px h-[42vh] overflow-hidden md:h-[70vh]">
            {(() => {
              const cur = heroIndex;
              const next = (heroIndex + 1) % HERO_PAIRS.length;
              return (
                <>
                  <img
                    key={`left-cur-${cur}`}
                    src={HERO_PAIRS[cur].left[0]}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out ${
                      isSliding ? '-translate-y-full' : 'translate-y-0'
                    }`}
                  />
                  <img
                    key={`left-next-${next}`}
                    src={HERO_PAIRS[next].left[0]}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out ${
                      isSliding ? 'translate-y-0' : 'translate-y-full'
                    }`}
                  />
                </>
              );
            })()}
          </div>
          {/* Right image - opposite vertical slider */}
          <div className="relative -ml-px h-[42vh] overflow-hidden md:h-[70vh]">
            {(() => {
              const cur = heroIndex;
              const next = (heroIndex + 1) % HERO_PAIRS.length;
              return (
                <>
                  <img
                    key={`right-cur-${cur}`}
                    src={HERO_PAIRS[cur].right[0]}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out ${
                      isSliding ? 'translate-y-full' : 'translate-y-0'
                    }`}
                  />
                  <img
                    key={`right-next-${next}`}
                    src={HERO_PAIRS[next].right[0]}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out ${
                      isSliding ? 'translate-y-0' : '-translate-y-full'
                    }`}
                  />
                </>
              );
            })()}
          </div>

          {/* Single unified overlay to avoid center seam */}
          <div className="pointer-events-none absolute inset-0 bg-black/10" />
        </div>

        {/* Centered messaging (desktop/tablet) */}
        <div className="pointer-events-none absolute inset-0 mx-auto hidden max-w-5xl items-center justify-center px-4 md:flex">
          <div
            className={`pointer-events-auto rounded bg-none p-6 text-center text-black shadow-sm backdrop-blur-sm transition-opacity duration-500 md:p-8 ${
              isSliding ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="text-xs tracking-widest text-black/70">
              OVERSIZED
            </div>
            <h1 className="mt-2 text-xl font-extrabold leading-tight md:text-3xl">
              {HERO_PAIRS[heroIndex].title}
            </h1>
            <p className="mt-2 text-sm text-black/70 md:text-base">
              {HERO_PAIRS[heroIndex].desc}
            </p>
            <div className="mt-4 flex items-center justify-center">
              <Link
                to={`/products`}
                className="group inline-flex items-center justify-center border border-black bg-white px-8 py-3 font-extrabold tracking-wide text-black transition-colors duration-300 hover:bg-black hover:text-white"
              >
                <span className="text-sm transition-transform duration-300 group-hover:-translate-x-0.5">
                  SHOP NOW
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-3 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero controls */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <button
            aria-label="Previous"
            onClick={() => {
              setIsSliding(true);
              setTimeout(() => {
                setHeroIndex(
                  (i) => (i - 1 + HERO_PAIRS.length) % HERO_PAIRS.length,
                );
                setIsSliding(false);
              }, 750);
            }}
            className="rounded-full bg-black/60 px-3 py-1 text-white backdrop-blur-sm hover:bg-black"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => {
              setIsSliding(true);
              setTimeout(() => {
                setHeroIndex((i) => (i + 1) % HERO_PAIRS.length);
                setIsSliding(false);
              }, 750);
            }}
            className="rounded-full bg-black/60 px-3 py-1 text-white backdrop-blur-sm hover:bg-black"
          >
            ›
          </button>
        </div>
      </section>

      {/* Mobile hero messaging (stacked below images) */}
      <section className="block px-4 py-6 md:hidden">
        <div
          className={`mx-auto max-w-2xl text-center transition-opacity duration-300 ${isSliding ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="text-[10px] tracking-widest text-black/70">
            OVERSIZED
          </div>
          <h1 className="mt-2 text-xl font-extrabold leading-tight">
            {HERO_PAIRS[heroIndex].title}
          </h1>
          <p className="mt-2 text-sm text-black/70">
            {HERO_PAIRS[heroIndex].desc}
          </p>
          <div className="mt-4 flex items-center justify-center">
            <Link
              to={`/products`}
              className="group inline-flex items-center justify-center border border-black px-6 py-2 font-extrabold tracking-wide text-black transition-colors duration-300 hover:bg-black hover:text-white"
            >
              <span className="text-xs transition-transform duration-300 group-hover:-translate-x-0.5">
                SHOP NOW
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="mx-auto hidden w-full px-2 sm:px-4 md:block">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 md:grid-cols-3 md:divide-x">
            <div className="flex items-center gap-3 px-4 py-4 md:py-6">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-black md:mt-0" />
              <div className="text-left">
                <div className="font-semibold text-zinc-900">
                  Delivery available across Nigeria
                </div>
                <div className="text-zinc-500">Fees start as low as ₦3,000</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-4 md:py-6">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-black md:mt-0" />
              <div className="text-left">
                <div className="font-semibold text-zinc-900">Support 24/7</div>
                <div className="text-zinc-500">Contact us 24 hours a day</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-4 md:py-6">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-black md:mt-0" />
              <div className="text-left">
                <div className="font-semibold text-zinc-900">
                  30 Days Return
                </div>
                <div className="text-zinc-500">Exchange within 30 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR HER Section - Full Width */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1600px] px-4">
          {/* Tabs, Title, and View All on the same line */}
          <div className="mb-8 hidden grid-cols-3 items-center gap-4 py-2 md:grid">
            <div className="flex items-center gap-10 pl-2 text-xs uppercase tracking-[0.18em]">
              {['Outerwear', 'Sweaters', 'Sweatshirts', 'Dresses'].map(
                (t, i) => (
                  <button
                    key={t}
                    className={`relative pb-2 ${i === 0 ? 'font-semibold text-black' : 'text-zinc-400 hover:text-zinc-700'}`}
                  >
                    {t}
                    {i === 0 && (
                      <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-16 bg-black" />
                    )}
                  </button>
                ),
              )}
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
          </div>
        </div>

        {/* Products Grid - full bleed edge to edge */}
        {loadingP ? (
          <div className="py-10">
            <Spinner label="Loading collection" />
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-x divide-y divide-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p: any) => (
              <div key={p._id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Inspirational Quote - Full Width */}
      <section className="w-full px-4 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1000px] text-center">
          <p className="text-2xl font-extralight leading-relaxed tracking-wide text-[#494949] md:text-4xl lg:text-2xl">
            "Style is something each of us already has; all we need to do is
            find it. When you wear confidence, everything else looks beautiful."
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 text-xs tracking-widest text-zinc-600">
            <span className="h-px w-10 bg-zinc-300"></span>
            <span>Diane von Fürstenberg</span>
          </div>
        </div>
      </section>

      {/* SHOP THE LOOKS - Categories styled section */}
      <section className="w-full py-20" style={{ backgroundColor: '#f5f3ee' }}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold uppercase tracking-wide">
              SHOP THE LOOKS
            </h2>
            <p
              className="mx-auto mt-2 max-w-3xl text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              Our latest endeavour features designs from around the world with
              materials so comfortable you won't want to wear anything else
              every again.
            </p>
          </div>
          {loadingC ? (
            <div className="py-10">
              <Spinner label="Loading categories" />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c: any) => (
                <Link
                  key={c._id}
                  to={`/products?category=${c.slug}`}
                  className="group block overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100">
                    {c.image && (
                      <img
                        src={c.image}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.25]"
                      />
                    )}
                    {/* Centered category name overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/40 px-4 py-2 text-sm font-medium uppercase tracking-wide text-white shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition-all duration-300 group-hover:bg-black/60 group-hover:shadow-lg sm:text-base">
                        {c.name}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What customers say - Full Width (mocked carousel) */}
      {/* <section className="w-full px-4 py-36 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid items-center grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="text-xs tracking-widest text-zinc-600">
                WHAT CUSTOMER SAY ABOUT US
              </div>
              <div className="flex items-center gap-1 mt-2 text-black">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < (currentReview?.rating ?? 0)
                        ? 'text-black'
                        : 'text-gray-300'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="mt-4 text-2xl leading-snug text-zinc-900">
                {currentReview?.quote}
              </p>
              <p className="mt-4 text-sm text-zinc-500">
                — {currentReview?.name} / From {currentReview?.location}
              </p>
              <div className="flex items-center gap-3 mt-6">
                <button
                  aria-label="Previous testimonial"
                  className="px-3 py-1 border rounded-full border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  onClick={goPrevReview}
                >
                  ‹
                </button>
                <button
                  aria-label="Next testimonial"
                  className="px-3 py-1 border rounded-full border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  onClick={goNextReview}
                >
                  ›
                </button>
              </div>
            </div>
            <div className="h-64 overflow-hidden rounded-lg bg-zinc-100 md:h-96">
              <img
                src={currentReview?.image}
                className="object-cover object-center w-full h-full"
              />
            </div>
          </div>
        </div>
      </section> */}

      {/* Founders section - Full Width */}
      {loadingSettings ? (
        <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl bg-zinc-100">
                <div className="h-64 animate-pulse bg-neutral-200 md:h-96" />
              </div>
              <div className="space-y-3">
                <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />
                <div className="h-6 w-64 animate-pulse rounded bg-neutral-200" />
                <div className="h-24 w-full animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          </div>
        </section>
      ) : founders.length > 0 ? (
        founders.map((f, i) => (
          <section
            key={`founder-section-${i}`}
            className="w-full px-4 py-40 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-[1100px]">
              <div
                className={`flex flex-col items-center gap-6 md:flex-row md:gap-10 ${
                  i % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="flex justify-center md:justify-start">
                  <div
                    className="w-[450px] max-w-[560px] overflow-hidden rounded-2xl bg-zinc-100 sm:max-w-[420px] md:max-w-[1580px]"
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    <img
                      src={f.imageUrl}
                      alt={f.name || 'Founder'}
                      className={`h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${
                        imageLoaded[i] ? 'opacity-100' : 'opacity-0'
                      }`}
                      loading="lazy"
                      decoding="async"
                      onLoad={() =>
                        setImageLoaded((prev) => ({ ...prev, [i]: true }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <div
                    className="text-[11px] tracking-widest"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    {f.title ? f.title.toUpperCase() : 'THE FOUNDER'}
                  </div>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-tight">
                    {f.name}
                  </h3>
                  {f.bio ? (
                    <p
                      className="mt-4 text-sm leading-6"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      {f.bio}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ))
      ) : null}
    </>
  );
}
