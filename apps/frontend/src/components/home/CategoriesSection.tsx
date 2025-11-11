import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';

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
          <h2 className="text-2xl font-extrabold tracking-wide uppercase">
            SHOP THE LOOKS
          </h2>
          <p
            className="max-w-3xl mx-auto mt-2 text-sm"
            style={{ color: 'rgb(var(--muted))' }}
          >
            Our latest endeavour features designs from around the world with
            materials so comfortable you won't want to wear anything else every
            again.
          </p>
        </div>
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading categories" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((c: any) => (
              <Link
                key={c._id}
                to={`/products?category=${c.slug}`}
                className="block overflow-hidden group rounded-2xl"
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
                    <span className="px-4 py-2 text-sm font-medium tracking-wide text-white uppercase transition-all duration-300 rounded-full shadow-sm bg-black/40 ring-1 ring-white/30 backdrop-blur-sm group-hover:bg-black/60 group-hover:shadow-lg sm:text-base">
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
