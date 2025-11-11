import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { useState } from 'react';
import { useAnalyticsTracker } from '../../hooks/useAnalyticsTracker';
import { useCart } from '../../contexts/CartContext';
import { useLazyQuery } from '@apollo/client';
import { GET_PRODUCT } from '../../graphql/products';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import { useWishlist } from '../../contexts/WishlistContext';
import { useToast } from './Toast';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    brand?: string;
    price: number;
    salePrice?: number | null;
    images?: string[];
    colors?: string[];
    reviewAverage?: number | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { trackProductClick } = useAnalyticsTracker();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const rawColor = product.colors?.[0] ?? '';
  const defaultColor = rawColor
    ? rawColor.includes('|')
      ? rawColor.split('|')[0] || rawColor.split('|')[1]
      : rawColor
    : '';

  const [quickOpen, setQuickOpen] = useState(false);
  const [loadQuick, { data: quickData, loading: quickLoading }] = useLazyQuery(
    GET_PRODUCT,
    { fetchPolicy: 'cache-first' },
  );

  const { items: wishlist, add: addWish, remove: removeWish } = useWishlist();
  const { showToast } = useToast();
  const onWishlist = !!wishlist.find((w: any) => w._id === product._id);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/ProductDetails?id=${product._id}`}
        className="block overflow-hidden bg-white"
        onClick={() => trackProductClick(product._id)}
      >
        {/* Product Image with loading skeleton and progressive hover */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-white">
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-2 bg-gray-300 rounded w-28 animate-pulse"></div>
              </div>
            </div>
          )}
          {product.images?.[0] && (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${
                  isHovered || !imageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
              />
              <img
                src={product.images?.[1] || product.images[0]}
                alt={product.name}
                className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-out will-change-transform ${
                  isHovered
                    ? 'scale-[1.25] opacity-100 duration-700'
                    : 'scale-100 opacity-0 duration-700'
                }`}
                loading="lazy"
                decoding="async"
              />
            </>
          )}

          {/* Action icons on hover - positioned on right side */}
          {isHovered && (
            <div className="absolute z-10 flex flex-col items-center gap-4 bottom-3 right-3">
              {/* Heart icon */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    if (onWishlist) {
                      await removeWish({ productId: product._id });
                      showToast('Removed from wishlist', 'success');
                    } else {
                      await addWish({ productId: product._id });
                      showToast('Added to wishlist', 'success');
                    }
                  } catch (err) {
                    showToast('Unable to update wishlist', 'error');
                  }
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ease-out hover:shadow-lg ${
                  onWishlist
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-black hover:text-white'
                }`}
                aria-label="Add to wishlist"
                aria-pressed={onWishlist}
                title={onWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="lucide lucide-heart-icon lucide-heart"
                >
                  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                </svg>
              </button>

              {/* Quick view icon */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setQuickOpen(true);
                  void loadQuick({ variables: { id: product._id } });
                }}
                className="flex items-center justify-center w-12 h-12 text-black transition-all duration-1000 ease-out bg-white rounded-full hover:bg-black hover:text-white hover:shadow-lg"
                aria-label="Quick view"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="lucide lucide-eye-icon lucide-eye"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>

              {/* Cart icon */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (addingToCart) return;
                  try {
                    setAddingToCart(true);
                    await addToCart({
                      productId: product._id,
                      quantity: 1,
                      selectedSize: '',
                      selectedColor: defaultColor,
                    });
                  } finally {
                    setAddingToCart(false);
                  }
                }}
                className="flex items-center justify-center w-12 h-12 text-black transition-all duration-1000 ease-out bg-white rounded-full hover:bg-black hover:text-white hover:shadow-lg"
                aria-disabled={addingToCart}
                aria-label="Add to cart"
              >
                {addingToCart ? (
                  <span className="w-5 h-5 border-2 border-black rounded-full animate-spin border-t-transparent" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-shopping-cart-icon lucide-shopping-cart"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="px-4 pt-4 pb-4 bg-white border-t border-gray-200 sm:px-5">
          {/* Product name */}
          <h3 className="text-sm font-medium leading-tight text-gray-900">
            {product.name}
          </h3>

          {/* Star rating */}
          <div className="mb-1 mt-2 flex items-center gap-0.5">
            {(() => {
              const rating = Math.round(Number(product.reviewAverage ?? 0));
              return Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`h-3.5 w-3.5 ${i < rating ? 'fill-black text-black' : 'fill-gray-300 text-gray-300'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={'0'}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ));
            })()}
          </div>

          {/* Price */}
          <div className="text-sm font-semibold text-gray-900">
            {product.salePrice != null ? (
              <>
                <span>{formatCurrency(product.salePrice)}</span>
                <span className="ml-2 text-xs font-normal text-gray-500 line-through">
                  {formatCurrency(product.price)}
                </span>
              </>
            ) : (
              <span>{formatCurrency(product.price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        loading={quickLoading}
        product={quickData?.getProduct}
      />
    </div>
  );
}
