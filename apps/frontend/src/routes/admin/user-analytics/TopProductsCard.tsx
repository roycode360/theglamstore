import Spinner from '../../../components/ui/Spinner';
import { formatNumber } from './utils';

type TopProductsCardProps = {
  products: Array<{
    productId: string;
    name: string;
    views: number;
    clicks: number;
    purchases: number;
  }>;
  loading: boolean;
};

export function TopProductsCard({ products, loading }: TopProductsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Top viewed products
        </h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-500">
          No product engagement data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Views</th>
                <th className="px-4 py-2">Clicks</th>
                <th className="px-4 py-2">Purchases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.productId}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.productId}</p>
                  </td>
                  <td className="px-4 py-2">{formatNumber(product.views)}</td>
                  <td className="px-4 py-2">{formatNumber(product.clicks)}</td>
                  <td className="px-4 py-2">{formatNumber(product.purchases)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

