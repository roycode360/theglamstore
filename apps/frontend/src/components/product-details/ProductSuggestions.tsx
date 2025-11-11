import { TProduct } from '../../types';
import ProductCard from '../../components/ui/ProductCard';

type ProductSuggestionsProps = {
  suggestions: TProduct[];
};

export function ProductSuggestions({ suggestions }: ProductSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <section>
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold tracking-tight">
          You Might Also Like
        </h2>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Discover other pieces from this collection
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s: TProduct, i: number) => (
          <ProductCard key={s._id} product={s} />
        ))}
      </div>
    </section>
  );
}
