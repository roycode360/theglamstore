import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { LIST_CATEGORIES } from '../graphql/categories';
import { Skeleton } from '../components/ui/Skeleton';

export default function ProductCategories() {
  const { data, loading } = useQuery(LIST_CATEGORIES);
  const categories = (data?.listCategories ?? []) as Array<{
    _id: string;
    name: string;
    slug: string;
    image?: string | null;
    description?: string | null;
  }>;

  return (
    <div className="space-y-20 md:space-y-28">
      <section className="text-center">
        <h1 className="mt-10 text-4xl font-extrabold tracking-tight">
          Explore Our Collections
        </h1>
        <p
          className="mx-auto mt-2 max-w-2xl text-sm"
          style={{ color: 'rgb(var(--muted))' }}
        >
          Find your style within our curated categories, each with its own story
          and inspiration.
        </p>
      </section>

      {loading ? (
        <CategoriesGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 divide-x divide-y divide-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/products?category=${c.slug}`}
              className="group block overflow-hidden bg-white"
            >
              {/* Image area matches product card aspect and hover scale */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-white">
                {c.image && (
                  <img
                    src={c.image}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.25]"
                  />
                )}
              </div>
              {/* Details section to mirror product card footer */}
              <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-4 sm:px-5">
                <h3 className="text-sm font-medium leading-tight text-gray-900">
                  {c.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500">Shop now</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesGridSkeleton() {
  const placeholders = Array.from({ length: 8 });
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {placeholders.map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-3xl border border-dashed border-gray-200 bg-white"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <Skeleton className="h-full w-full" />
            <Skeleton className="absolute left-4 top-4 h-6 w-20 rounded-full opacity-80" />
          </div>
          <div className="space-y-2 border-t border-gray-200 px-4 py-4">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
