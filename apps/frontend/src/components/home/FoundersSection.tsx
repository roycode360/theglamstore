import { useState } from 'react';

type Founder = {
  name: string;
  title?: string | null;
  bio?: string | null;
  imageUrl: string;
  order?: number | null;
  visible?: boolean | null;
};

type FoundersSectionProps = {
  founders: Founder[];
  loading: boolean;
};

export function FoundersSection({ founders, loading }: FoundersSectionProps) {
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});

  if (loading) {
    return (
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
    );
  }

  if (founders.length === 0) {
    return null;
  }

  return (
    <>
      {founders.map((f, i) => (
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
                  className="overflow-hidden rounded-2xl bg-zinc-100 sm:max-w-[420px] md:max-w-[1580px] xl:w-[450px] xl:max-w-[560px]"
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
      ))}
    </>
  );
}
