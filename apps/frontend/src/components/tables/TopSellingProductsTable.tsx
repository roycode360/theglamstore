import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { GET_TOP_SELLING_PRODUCTS } from '../../graphql/analytics';
import { Skeleton } from '../ui/Skeleton';

interface TopSellingProductsTableProps {
  limit?: number;
  className?: string;
}

export default function TopSellingProductsTable({
  limit = 10,
  className,
}: TopSellingProductsTableProps) {
  const { data, loading } = useQuery(GET_TOP_SELLING_PRODUCTS, {
    variables: { limit },
    fetchPolicy: 'cache-and-network',
  });

  const products = data?.getTopSellingProducts?.products ?? [];

  if (loading) {
    return <TopSellingProductsSkeleton className={className} />;
  }

  if (products.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            No products data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Top Selling Products</h3>
        <p className="mt-1 text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Best performing products by quantity sold
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto md:block">
        <div className="inline-block min-w-full align-middle">
          <div className="theme-border overflow-hidden rounded-lg border">
            <table className="theme-border min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Quantity Sold
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="theme-border divide-y bg-white">
                {products.map((product: any, index: number) => (
                  <tr
                    key={product.productId}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/ProductDetails?id=${product.productId}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="theme-border h-10 w-10 flex-shrink-0 overflow-hidden rounded border bg-gray-100">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="h-5 w-5"
                                style={{ color: 'rgb(var(--muted))' }}
                              >
                                <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
                                <path d="M12 12 20 8" />
                                <path d="M12 12v9" />
                                <path d="M12 12 4 8" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium group-hover:underline">
                            {product.name}
                          </div>
                          <div
                            className="truncate text-xs"
                            style={{ color: 'rgb(var(--muted))' }}
                          >
                            #{index + 1} Top Seller
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">
                        {product.quantitySold}
                      </span>
                      <span
                        className="ml-1 text-xs"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        units
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {products.map((product: any, index: number) => (
          <Link
            key={product.productId}
            to={`/ProductDetails?id=${product.productId}`}
            className="theme-border block rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <div className="theme-border h-16 w-16 flex-shrink-0 overflow-hidden rounded border bg-gray-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-6 w-6"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
                      <path d="M12 12 20 8" />
                      <path d="M12 12v9" />
                      <path d="M12 12 4 8" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{product.name}</div>
                <div
                  className="mt-1 text-xs"
                  style={{ color: 'rgb(var(--muted))' }}
                >
                  #{index + 1} Top Seller
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      {product.quantitySold}
                      <span
                        className="ml-1 text-xs font-normal"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        units sold
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(product.totalRevenue)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TopSellingProductsSkeleton({ className }: { className?: string }) {
  const rows = Array.from({ length: 5 });
  return (
    <div className={className}>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-full" />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div className="inline-block min-w-full align-middle">
          <div className="theme-border overflow-hidden rounded-lg border border-dashed">
            <table className="theme-border min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Skeleton className="h-3 w-24 rounded-full" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <Skeleton className="h-3 w-24 rounded-full" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <Skeleton className="ml-auto h-3 w-20 rounded-full" />
                  </th>
                </tr>
              </thead>
              <tbody className="theme-border divide-y bg-white">
                {rows.map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40 rounded-md" />
                          <Skeleton className="h-3 w-24 rounded-full" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-24 rounded-md" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((_, idx) => (
          <div
            key={idx}
            className="theme-border rounded-lg border border-dashed p-4"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
