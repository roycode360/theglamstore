import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { LIST_CATEGORIES } from '../graphql/categories';

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
          className="max-w-2xl mx-auto mt-2 text-sm"
          style={{ color: 'rgb(var(--muted))' }}
        >
          Find your style within our curated categories, each with its own story
          and inspiration.
        </p>
      </section>

      {loading ? (
        <div className="py-16">
          <Spinner label="Loading categories" />
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-x divide-y divide-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/products?category=${c.slug}`}
              className="block overflow-hidden bg-white group"
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
              <div className="px-4 pt-4 pb-4 bg-white border-t border-gray-200 sm:px-5">
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
