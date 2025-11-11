import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
      'https://images.unsplash.com/photo-1512201078372-9c6b2a0d528a?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=2073',
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

export function HeroSection() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

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

  const goToPrevious = () => {
    setIsSliding(true);
    setTimeout(() => {
      setHeroIndex((i) => (i - 1 + HERO_PAIRS.length) % HERO_PAIRS.length);
      setIsSliding(false);
    }, 750);
  };

  const goToNext = () => {
    setIsSliding(true);
    setTimeout(() => {
      setHeroIndex((i) => (i + 1) % HERO_PAIRS.length);
      setIsSliding(false);
    }, 750);
  };

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
            onClick={goToPrevious}
            className="rounded-full bg-black/60 px-3 py-1 text-white backdrop-blur-sm hover:bg-black"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={goToNext}
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
    </>
  );
}
