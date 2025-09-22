import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';

export default function WishlistPage() {
  const { items } = useWishlist();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="theme-fg text-2xl font-semibold">My Wishlist</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Save items you love for later
          </p>
        </div>
        <Link
          to="/products"
          className="theme-border text-brand hover:bg-brand-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition-colors sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
          title="Continue Shopping"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M10.72 4.22a.75.75 0 0 1 0 1.06L5.56 10.5H21a.75.75 0 0 1 0 1.5H5.56l5.16 5.22a.75.75 0 0 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p: any) => (
          <Link
            key={p._id}
            to={`/ProductDetails?id=${p._id}`}
            className="theme-border hover:border-brand-300 group transform overflow-hidden rounded-lg border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
              {p.salePrice != null && (
                <span className="absolute left-2 top-2 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Sale
                </span>
              )}
              {p.images?.[0] && (
                <img
                  src={p.images[0]}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
            <div className="space-y-1 p-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                {p.brand || 'TheGlamStore'}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="font-semibold">
                  {p.salePrice != null ? (
                    <>
                      <span>
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                        }).format(p.salePrice)}
                      </span>
                      <span
                        className="ml-2 text-sm line-through"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                        }).format(p.price)}
                      </span>
                    </>
                  ) : (
                    <span>
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(p.price)}
                    </span>
                  )}
                </div>
                {typeof p.stockQuantity === 'number' && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      p.stockQuantity > 0
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {p.stockQuantity > 0 ? 'In stock' : 'Out of stock'}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <div
            className="rounded-lg border p-6 text-center"
            style={{ color: 'rgb(var(--muted))' }}
          >
            Your wishlist is empty.
          </div>
        )}
      </div>
    </div>
  );
}
