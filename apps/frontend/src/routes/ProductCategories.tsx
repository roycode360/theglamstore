import { gql, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';

const LIST_CATEGORIES = gql`
  query ListCategoriesPage {
    listCategories {
      _id
      name
      slug
      image
      description
    }
  }
`;

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
        <div className="py-16">
          <Spinner label="Loading categories" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/products?category=${c.slug}`}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
                {c.image && (
                  <img
                    src={c.image}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="px-4 py-2 text-lg font-semibold text-white drop-shadow-md">
                  {c.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
