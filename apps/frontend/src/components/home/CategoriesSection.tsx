import { Link } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';

type CategoriesSectionProps = {
  categories: any[];
  loading: boolean;
};

export function CategoriesSection({
  categories,
  loading,
}: CategoriesSectionProps) {
  return (
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
            materials so comfortable you won't want to wear anything else every
            again.
          </p>
        </div>
        {loading ? (
          <CategoriesSkeleton />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((c: any) => (
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
  );
}

function CategoriesSkeleton() {
  const placeholders = Array.from({ length: 4 });
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {placeholders.map((_, idx) => (
        <div
          key={idx}
          className="block overflow-hidden rounded-2xl border border-dashed border-white/40 bg-white/50 p-1"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-gray-100">
            <Skeleton className="h-full w-full rounded-[1.75rem]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
