import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import Spinner from '../ui/Spinner';
import { GET_TOP_SELLING_PRODUCTS } from '../../graphql/analytics';

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
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </div>
    );
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
      <div className="hidden md:block overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border rounded-lg theme-border">
            <table className="min-w-full divide-y theme-border">
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
              <tbody className="divide-y theme-border bg-white">
                {products.map((product: any, index: number) => (
                  <tr
                    key={product.productId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/ProductDetails?id=${product.productId}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 overflow-hidden bg-gray-100 border rounded theme-border flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="object-cover w-full h-full"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="w-5 h-5"
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
                            className="text-xs truncate"
                            style={{ color: 'rgb(var(--muted))' }}
                          >
                            #{index + 1} Top Seller
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{product.quantitySold}</span>
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
      <div className="md:hidden space-y-3">
        {products.map((product: any, index: number) => (
          <Link
            key={product.productId}
            to={`/ProductDetails?id=${product.productId}`}
            className="block p-4 border rounded-lg theme-border bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 overflow-hidden bg-gray-100 border rounded theme-border flex-shrink-0">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-6 h-6"
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
              <div className="flex-1 min-w-0">
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

