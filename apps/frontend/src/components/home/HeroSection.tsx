import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hero1, hero2, hero3, hero4, hero5, hero6 } from 'src/assets/images';

const HERO_PAIRS: Array<{
  left: string[];
  right: string[];
  title: string;
  desc: string;
  category: string;
  buttonText: string;
}> = [
  {
    left: [hero1],
    right: [hero2],
    title: 'SEE STYLE DIFFERENTLY',
    desc: 'Modern frames that speak confidence. Crafted for every face and every moment.',
    category: 'glasses',
    buttonText: 'Shop Glasses',
  },
  {
    left: [hero3],
    right: [hero4],
    title: 'EVERY DETAIL TELLS A STORY',
    desc: 'Classic jewelry reimagined for today’s muse — simple, sophisticated, unforgettable.',
    category: 'jewelries',
    buttonText: 'Shop Jewelries',
  },
  {
    left: [hero5],
    right: [hero6],
    title: 'MODERN ESSENTIALS FOR EVERY OCCASION',
    desc: 'Designed for versatility and confidence. Elevate your daily style with thoughtful finishing touches.',
    category: 'others',
    buttonText: 'Shop Accessories',
  },
];

const slugify = (value: string): string =>
  (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');

export function HeroSection() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const selectedCategory = HERO_PAIRS[heroIndex].category;
  const selectedCategorySlug = slugify(selectedCategory);
  const categoryQuery = selectedCategorySlug
    ? `?category=${encodeURIComponent(selectedCategorySlug)}`
    : '';

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
          <div className="absolute inset-0 pointer-events-none bg-black/10" />
        </div>

        {/* Centered messaging (desktop/tablet) */}
        <div className="absolute inset-0 items-center justify-center hidden max-w-5xl px-4 mx-auto pointer-events-none md:flex">
          <div
            className={`pointer-events-auto rounded bg-none p-6 text-center text-black shadow-sm backdrop-blur-sm transition-opacity duration-500 md:p-8 ${
              isSliding ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="text-xs tracking-widest uppercase text-black/70">
              {HERO_PAIRS[heroIndex].category}
            </div>
            <h1 className="mt-2 text-xl font-extrabold leading-tight md:text-3xl">
              {HERO_PAIRS[heroIndex].title}
            </h1>
            <p className="mt-2 text-sm text-black/70 md:text-base">
              {HERO_PAIRS[heroIndex].desc}
            </p>
            <div className="flex items-center justify-center mt-4">
              <Link
                to={`/products${categoryQuery}`}
                className="inline-flex items-center justify-center px-8 py-3 font-extrabold tracking-wide text-black transition-colors duration-300 bg-white border border-black group hover:bg-black hover:text-white"
              >
                <span className="text-sm uppercase transition-transform duration-300 group-hover:-translate-x-0.5">
                  {HERO_PAIRS[heroIndex].buttonText}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 ml-3 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero controls */}
        <div className="absolute flex items-center gap-3 bottom-4 left-4">
          <button
            aria-label="Previous"
            onClick={goToPrevious}
            className="px-3 py-1 text-white rounded-full bg-black/60 backdrop-blur-sm hover:bg-black"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={goToNext}
            className="px-3 py-1 text-white rounded-full bg-black/60 backdrop-blur-sm hover:bg-black"
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
            {selectedCategory}
          </div>
          <h1 className="mt-2 text-xl font-extrabold leading-tight">
            {HERO_PAIRS[heroIndex].title}
          </h1>
          <p className="mt-2 text-sm text-black/70">
            {HERO_PAIRS[heroIndex].desc}
          </p>
          <div className="flex items-center justify-center mt-4">
            <Link
              to={`/products${categoryQuery}`}
              className="inline-flex items-center justify-center px-6 py-2 font-extrabold tracking-wide text-black transition-colors duration-300 border border-black group hover:bg-black hover:text-white"
            >
              <span className="text-xs transition-transform duration-300 group-hover:-translate-x-0.5">
                {HERO_PAIRS[heroIndex].buttonText.toUpperCase()}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1"
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
