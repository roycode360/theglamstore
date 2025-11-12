import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { TProduct } from '../../types';

type CategoryInfo = {
  name: string;
  slug: string;
} | null;

type ProductInfoProps = {
  product: TProduct;
  categoryInfo: CategoryInfo;
};

export function ProductInfo({ product: p, categoryInfo }: ProductInfoProps) {
  console.log('categoryInfo', categoryInfo);
  // If product.category is different from the resolved parent slug, treat it as subcategory slug
  const subcategorySlug =
    categoryInfo && p?.category && p.category !== categoryInfo.slug
      ? p.category
      : '';
  const categoryHref = categoryInfo
    ? `/products?category=${encodeURIComponent(categoryInfo.slug)}${
        subcategorySlug
          ? `&subcategory=${encodeURIComponent(subcategorySlug)}`
          : ''
      }`
    : '#';

  return (
    <div className="space-y-6">
      {/* Category badge */}
      {categoryInfo && (
        <div>
          <Link
            to={categoryHref}
            className="theme-border inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
            style={{ color: 'rgb(var(--muted))' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{categoryInfo.name}</span>
          </Link>
        </div>
      )}

      <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
        {p.brand ? p.brand.toUpperCase() : 'LUXE COLLECTION'}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{p.name}</h1>
          {p.salePrice != null && p.salePrice < p.price ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white shadow-md shadow-rose-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3"
                aria-hidden="true"
              >
                <path d="M12 2c2.5 2.4 3.76 4.8 3.76 7.2 0 1.62-.64 2.7-1.91 3.3 2.04-.18 3.64-1.86 3.64-4.38 0-1.44-.56-2.82-1.68-4.14 2.7 1.5 4.05 3.72 4.05 6.66 0 4.2-3.12 7.86-9.36 10.98C4.44 17.52 1.32 13.86 1.32 9.66c0-2.94 1.35-5.16 4.05-6.66C4.26 5.1 3.7 6.48 3.7 7.92c0 2.52 1.6 4.2 3.62 4.38C6.06 11.1 5.42 10.02 5.42 8.4 5.42 6 6.68 4.4 9.2 2c.28-.26.58-.39.9-.39s.62.13.9.39Z" />
              </svg>
              Sale
            </span>
          ) : null}
        </div>
        {typeof p.stockQuantity === 'number' && (
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${
              p.stockQuantity > 0
                ? 'border-gray-200 bg-gray-50 text-gray-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {p.stockQuantity > 0 ? 'In stock' : 'Out of stock'}
          </span>
        )}
      </div>

      <div className="text-2xl font-bold">
        {p.salePrice != null ? (
          <>
            <span>{formatCurrency(p.salePrice)}</span>
            <span
              className="ml-2 text-base line-through"
              style={{ color: 'rgb(var(--muted))' }}
            >
              {formatCurrency(p.price)}
            </span>
          </>
        ) : (
          <span>{formatCurrency(p.price)}</span>
        )}
      </div>

      <p className="max-w-prose text-sm" style={{ color: 'rgb(var(--muted))' }}>
        {p.description || 'A luxurious piece crafted with attention to detail.'}
      </p>
    </div>
  );
}
