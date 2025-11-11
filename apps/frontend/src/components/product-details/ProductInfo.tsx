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
              className="w-3 h-3"
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

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight">{p.name}</h1>
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

      <p className="text-sm max-w-prose" style={{ color: 'rgb(var(--muted))' }}>
        {p.description || 'A luxurious piece crafted with attention to detail.'}
      </p>
    </div>
  );
}
