import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Link, useSearchParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/currency';
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../components/ui/Toast';
import { TProduct, TReview } from 'src/types';
import { LIST_PRODUCTS_BY_CATEGORY, GET_PRODUCT } from 'src/graphql/products';
import { GET_CART_ITEMS } from '../graphql/cart';
import ProductCard from '../components/ui/ProductCard';
import { LIST_CATEGORIES } from '../graphql/categories';
import {
  LIST_PRODUCT_REVIEWS,
  GET_REVIEW_ELIGIBILITY,
  SUBMIT_PRODUCT_REVIEW,
} from '../graphql/reviews';
import { useAuth } from '../contexts/AuthContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import { formatDateOnly } from '../utils/date';

type ReviewEligibilityState = {
  hasPurchased: boolean;
  canReview: boolean;
  existingReview?: {
    _id: string;
    rating: number;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  } | null;
};

export default function ProductDetails() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const { user, login } = useAuth();

  const { data, loading } = useQuery<{ getProduct: TProduct }>(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });

  const { data: relatedData } = useQuery<{
    listProductsByCategory: TProduct[];
  }>(LIST_PRODUCTS_BY_CATEGORY, {
    skip: !data?.getProduct?.category,
    variables: {
      category: data?.getProduct?.category || '',
      limit: 3,
      excludeId: data?.getProduct?._id,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const { data: cartData } = useQuery(GET_CART_ITEMS);
  const { data: categoriesData } = useQuery(LIST_CATEGORIES);
  const {
    data: reviewsData,
    loading: reviewsLoading,
    refetch: refetchReviews,
  } = useQuery<{ listProductReviews: TReview[] }>(LIST_PRODUCT_REVIEWS, {
    variables: { productId: id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [
    loadEligibility,
    { data: eligibilityData, loading: eligibilityLoading },
  ] = useLazyQuery<{ getReviewEligibility: ReviewEligibilityState }>(
    GET_REVIEW_ELIGIBILITY,
    {
      fetchPolicy: 'network-only',
    },
  );
  const refreshEligibility = useCallback(async () => {
    if (!id || !user?.email) return;
    await loadEligibility({
      variables: { productId: id },
    });
  }, [id, loadEligibility, user?.email]);

  useEffect(() => {
    void refreshEligibility();
  }, [refreshEligibility]);
  const eligibility = eligibilityData?.getReviewEligibility ?? null;
  const existingReview = eligibility?.existingReview ?? null;
  const reviews = (reviewsData?.listProductReviews ?? []) as TReview[];

  const [submitProductReview, { loading: submittingReview }] = useMutation(
    SUBMIT_PRODUCT_REVIEW,
  );
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [displayName, setDisplayName] = useState(user?.fullName ?? '');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reviewFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user?.fullName) {
      setDisplayName((prev) => (prev ? prev : user.fullName));
    }
    if (user?.avatar) {
      setAvatarUrl((prev) => (prev ? prev : user.avatar || ''));
    }
  }, [user]);

  useEffect(() => {
    if (!eligibility?.canReview) {
      setShowReviewForm(false);
    }
  }, [eligibility?.canReview]);

  useEffect(() => {
    if (showReviewForm && reviewFormRef.current) {
      reviewFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [showReviewForm]);

  // Compute color options from raw data unconditionally to keep hook order stable
  const colorOptions = useMemo(() => {
    const raw = ((data as any)?.getProduct?.colors ?? []) as string[];
    return raw.map((c) => {
      const parts = c.split('|');
      if (parts.length === 2) {
        return { label: parts[0] || parts[1], swatch: parts[1] };
      }
      return { label: c, swatch: c };
    });
  }, [data]);

  const p = data?.getProduct ?? null;
  const reviewsCount = reviews.length;
  const averageRating =
    reviewsCount > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
        reviewsCount
      : null;
  const roundedAverage =
    typeof averageRating === 'number'
      ? Math.round(averageRating * 10) / 10
      : null;
  const canShowPrompt = Boolean(
    user && eligibility?.hasPurchased && eligibility?.canReview,
  );
  const hasExistingReview = Boolean(existingReview);
  const reviewStatus = existingReview?.status ?? null;
  const pendingReviewForViewer =
    existingReview && existingReview.status.toLowerCase() === 'pending'
      ? {
          _id: existingReview._id,
          customerName: user?.fullName || user?.email || 'You',
          customerAvatarUrl: avatarUrl || undefined,
          rating: existingReview.rating,
          message: existingReview.message,
          createdAt: existingReview.createdAt,
        }
      : null;

  const suggestions = useMemo(() => {
    const items = (relatedData?.listProductsByCategory ?? []) as TProduct[];
    return items.slice(0, 3);
  }, [relatedData]);

  // Find category name from slug
  const categoryInfo = useMemo(() => {
    if (!p?.category || !categoriesData?.listCategories) return null;
    const categories = (categoriesData.listCategories as any[]) ?? [];
    const category = categories.find((c: any) => c.slug === p.category);
    return category ? { name: category.name, slug: category.slug } : null;
  }, [p?.category, categoriesData]);

  const [activeImg, setActiveImg] = useState(0);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState<boolean[]>([]);

  // Initialize thumbnail loaded states
  useState(() => {
    setThumbnailLoaded(new Array(p?.images?.length || 0).fill(false));
  });

  // Reset image loaded state when active image changes
  const handleImageChange = (index: number) => {
    setActiveImg(index);
    setImageLoaded(false);
  };

  // Handle thumbnail load
  const handleThumbnailLoad = (index: number) => {
    setThumbnailLoaded((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { items: wishlist, add: addWish, remove: removeWish } = useWishlist();

  // console.log(cartItemCount, 'cartItemCount');

  if (loading) {
    return (
      <div className="py-16">
        <Spinner label="Loading product" />
      </div>
    );
  }
  if (!p) {
    return (
      <div
        className="flex items-center justify-center py-16 text-sm bg-white border rounded-lg theme-border"
        style={{ color: 'rgb(var(--muted))' }}
      >
        Product not found
      </div>
    );
  }

  const handleAddToCart = async () => {
    // Validate required selections based on what the product actually has
    const hasSizes = p.sizes && p.sizes.length > 0;
    const hasColors = colorOptions.length > 0;

    if (hasSizes && !activeSize) {
      showToast('Please select a size', 'warning');
      return;
    }

    if (hasColors && activeColorIdx === null) {
      showToast('Please select a color', 'warning');
      return;
    }

    // If product has no size or color options, we can proceed without selection

    const stock = Number((p as any)?.stockQuantity ?? 0);
    const productId = p._id;
    const existingForProduct = (cartData?.getCartItems ?? []).filter(
      (ci: any) => ci?.product?._id === productId,
    );
    const totalInCart = existingForProduct.reduce(
      (sum: number, ci: any) => sum + (ci?.quantity || 0),
      0,
    );
    if (stock > 0 && totalInCart + qty > stock) {
      const remaining = Math.max(0, stock - totalInCart);
      const msg =
        totalInCart === 0
          ? `Only ${stock} in stock`
          : remaining > 0
            ? `Only ${remaining} more in stock`
            : `Only ${stock} in stock`;
      showToast(msg, 'warning');
      return;
    }

    await addToCart({
      productId: p._id,
      quantity: qty,
      selectedSize: activeSize || '',
      selectedColor: hasColors ? colorOptions[activeColorIdx]?.label : '',
    });
  };

  const renderStaticStars = (value: number) => {
    const normalized = Math.max(0, Math.min(5, value));
    return (
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, idx) => {
          const active = idx + 1 <= Math.round(normalized);
          return (
            <svg
              key={idx}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              className="w-4 h-4"
              fill={active ? '#facc15' : 'none'}
              stroke="#facc15"
              strokeWidth="1.5"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.13 3.466a1 1 0 00.95.69h3.641c.969 0 1.371 1.24.588 1.81l-2.945 2.14a1 1 0 00-.364 1.118l1.13 3.466c.3.92-.755 1.688-1.54 1.118l-2.945-2.14a1 1 0 00-1.176 0l-2.945 2.14c-.784.57-1.838-.198-1.539-1.118l1.13-3.466a1 1 0 00-.364-1.118l-2.945-2.14c-.783-.57-.38-1.81.588-1.81h3.642a1 1 0 00.95-.69l1.13-3.466z" />
            </svg>
          );
        })}
      </div>
    );
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const { secure_url } = await uploadToCloudinary(file);
      setAvatarUrl(secure_url);
      showToast('Avatar uploaded', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to upload avatar', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!p) return;

    const trimmedName = displayName.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      showToast('Please enter your name', 'warning');
      return;
    }
    if (trimmedMessage.length < 10) {
      showToast(
        'Share a few words about your experience (min 10 characters)',
        'warning',
      );
      return;
    }

    try {
      await submitProductReview({
        variables: {
          input: {
            productId: p._id,
            displayName: trimmedName,
            rating,
            message: trimmedMessage,
            avatarUrl: avatarUrl || undefined,
          },
        },
      });
      showToast('Review submitted for moderation', 'success');
      setMessage('');
      setRating(5);
      setShowReviewForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await Promise.allSettled([refetchReviews(), refreshEligibility()]);
    } catch (error: any) {
      const message =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        'Unable to submit review. Please try again.';
      showToast(message, 'error');
    }
  };

  return (
    <div className="px-4 py-10 space-y-12 sm:px-6 lg:px-8">
      {/* Top section */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          {/* Mobile Continue Shopping Button */}
          <div className="flex justify-end mb-4 sm:hidden">
            <Link
              to="/products"
              className="inline-flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-lg theme-border text-brand hover:bg-brand-50"
              title="Continue Shopping"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10.72 4.22a.75.75 0 0 1 0 1.06L5.56 10.5H21a.75.75 0 0 1 0 1.5H5.56l5.16 5.22a.75.75 0 0 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
          <div className="flex gap-2 mb-3">
            {(p.images ?? []).slice(0, 4).map((src: string, i: number) => (
              <button
                key={i}
                onClick={() => handleImageChange(i)}
                className={`theme-border relative overflow-hidden rounded-md border bg-gray-50 ${i === activeImg ? 'ring-brand-400 ring-2' : ''}`}
                style={{ width: 64, height: 64 }}
                aria-label={`Image ${i + 1}`}
              >
                {/* Thumbnail loading skeleton */}
                {!thumbnailLoaded[i] && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse">
                    <div className="w-4 h-4 mx-auto mt-5 bg-gray-300 rounded-full animate-pulse"></div>
                  </div>
                )}
                {src && (
                  <img
                    src={src}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      thumbnailLoaded[i] ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                    decoding="async"
                    alt={`${p.name} thumbnail ${i + 1}`}
                    onLoad={() => handleThumbnailLoad(i)}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="relative h-[60vh] overflow-hidden rounded-lg bg-gray-100 md:h-[70vh]">
            {/* Enhanced loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-20 h-20 bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-3 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-24 h-2 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            {p.images?.[activeImg] && (
              <img
                src={p.images[activeImg]}
                loading="lazy"
                decoding="async"
                alt={p.name}
                onLoad={() => setImageLoaded(true)}
                className={`h-full w-full object-cover transition-all duration-700 ease-out ${
                  imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                }`}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Category badge */}
          {categoryInfo && (
            <div>
              <Link
                to={`/products?category=${categoryInfo.slug}`}
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
          <p
            className="text-sm max-w-prose"
            style={{ color: 'rgb(var(--muted))' }}
          >
            {p.description ||
              'A luxurious piece crafted with attention to detail.'}
          </p>

          {/* Color */}
          {colorOptions.length > 0 ? (
            <div>
              <div className="mb-1 text-sm font-medium">
                Color: {colorOptions[activeColorIdx]?.label}
              </div>
              <div className="flex gap-2">
                {colorOptions.map((opt, i) => (
                  <button
                    key={`${opt.label}-${i}`}
                    onClick={() => setActiveColorIdx(i)}
                    className={`h-8 w-8 rounded-full border ${
                      i === activeColorIdx
                        ? 'border-black ring-2 ring-black ring-offset-2 ring-offset-white'
                        : 'theme-border'
                    }`}
                    style={{ backgroundColor: opt.swatch }}
                    aria-label={opt.label}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Available in default color
            </div>
          )}

          {/* Size */}
          {p.sizes?.length > 0 ? (
            <div>
              <div className="mb-1 text-sm font-medium">Size</div>
              <div className="flex flex-wrap gap-2">
                {(p.sizes || []).map((s: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveSize(s)}
                    className={`theme-border rounded-md border px-3 py-1.5 text-sm ${activeSize === s ? 'btn-primary' : ''}`}
                    aria-label={s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">One size fits all</div>
          )}

          {/* Quantity + CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center border rounded-md theme-border">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="w-10 h-10"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <div className="w-12 text-center">{qty}</div>
              <button
                onClick={() => {
                  const stock = Number((p as any)?.stockQuantity ?? 0);
                  const productId = p._id;
                  const existingForProduct = (
                    cartData?.getCartItems ?? []
                  ).filter((ci: any) => ci?.product?._id === productId);
                  const totalInCart = existingForProduct.reduce(
                    (sum: number, ci: any) => sum + (ci?.quantity || 0),
                    0,
                  );
                  const next = qty + 1;
                  if (stock > 0 && totalInCart + next > stock) {
                    const msg = `Only ${stock} in stock`;
                    showToast(msg, 'warning');
                    return;
                  }
                  setQty(next);
                }}
                className="w-10 h-10"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              className="btn-primary rounded-md px-5 py-2.5"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
            <button
              className="inline-flex items-center justify-center w-10 h-10 transition-opacity border rounded-md theme-border hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="Wishlist"
              title="Wishlist"
              aria-pressed={!!wishlist.find((w: any) => w._id === p._id)}
              onClick={async () => {
                try {
                  const onList = !!wishlist.find((w: any) => w._id === p._id);
                  if (onList) {
                    await removeWish({ productId: p._id });
                    showToast('Removed from wishlist', 'success');
                  } else {
                    await addWish({ productId: p._id });
                    showToast('Added to wishlist', 'success');
                  }
                } catch (e) {
                  showToast('Failed to update wishlist', 'error');
                }
              }}
            >
              {(() => {
                const onList = !!wishlist.find((w: any) => w._id === p._id);
                return (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill={onList ? 'black' : 'none'}
                    stroke="black"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M12 21s-6.716-4.39-9.193-7.63C1.49 11.66 1 9.93 1 8.5 1 6.015 3.015 4 5.5 4c1.54 0 3.04.79 3.9 2.06C10.46 4.79 11.96 4 13.5 4 15.985 4 18 6.015 18 8.5c0 1.43-.49 3.16-1.807 4.87C18.716 16.61 12 21 12 21z" />
                  </svg>
                );
              })()}
            </button>
          </div>
        </div>
      </section>

      {/* Accordions */}
      <section className="bg-white border divide-y rounded-md theme-border">
        {[
          {
            k: 'Full Description',
            d: p.description || 'No description available.',
          },
          {
            k: 'Materials & Care',
            d: 'Premium materials. Dry clean recommended.',
          },
          { k: 'Shipping', d: 'Ships within 3-5 business days.' },
          { k: 'Returns', d: '30-day return policy.' },
        ].map((item, i) => (
          <details key={i} className="group">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer">
              <span className="font-medium">{item.k}</span>
              <span className="opacity-60">▾</span>
            </summary>
            <div
              className="px-4 pb-4 text-sm"
              style={{ color: 'rgb(var(--muted))' }}
            >
              {item.d}
            </div>
          </details>
        ))}
      </section>

      {/* Reviews */}
      <section className="p-6 space-y-6 bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Customer Reviews
            </h2>
            <p className="text-sm text-gray-500">
              Hear from shoppers who purchased this item
            </p>
          </div>
          <div className="flex items-center gap-3">
            {typeof averageRating === 'number' ? (
              <>
                {renderStaticStars(averageRating)}
                <span className="text-sm font-semibold text-gray-700">
                  {roundedAverage?.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Not yet rated</span>
            )}
            <span className="text-sm text-gray-500">
              ({reviewsCount} review{reviewsCount === 1 ? '' : 's'})
            </span>
          </div>
        </div>

        {canShowPrompt && !showReviewForm && !hasExistingReview && (
          <button
            type="button"
            onClick={() => setShowReviewForm(true)}
            disabled={eligibilityLoading}
            className="w-full px-4 py-3 text-sm font-medium text-left text-gray-700 transition border border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-black sm:w-auto"
          >
            You purchased this item — write a review
          </button>
        )}

        {!user && reviewsCount === 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-gray-600 border border-gray-200 rounded-md bg-gray-50">
            <span>
              Purchase this item and sign in to share your experience with
              others.
            </span>
            <button
              type="button"
              onClick={login}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-white"
            >
              Sign in
            </button>
          </div>
        )}

        {showReviewForm && (
          <div ref={reviewFormRef}>
            <form
              onSubmit={handleSubmitReview}
              className="p-4 space-y-4 bg-white border border-gray-200 rounded-md shadow-sm"
            >
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  Rating
                </span>
                <div className="flex items-center gap-2 mt-2">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const value = idx + 1;
                    const active = value <= rating;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setRating(value)}
                        className="rounded focus:outline-none focus:ring-2 focus:ring-black"
                        aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          className="w-6 h-6 transition-colors"
                          fill={active ? '#facc15' : 'none'}
                          stroke="#facc15"
                          strokeWidth="1.5"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.13 3.466a1 1 0 00.95.69h3.641c.969 0 1.371 1.24.588 1.81l-2.945 2.14a1 1 0 00-.364 1.118l1.13 3.466c.3.92-.755 1.688-1.54 1.118l-2.945-2.14a1 1 0 00-1.176 0l-2.945 2.14c-.784.57-1.838-.198-1.539-1.118l1.13-3.466a1 1 0 00-.364-1.118l-2.945-2.14c-.783-.57-.38-1.81.588-1.81h3.642a1 1 0 00.95-.69l1.13-3.466z" />
                        </svg>
                      </button>
                    );
                  })}
                  <span className="text-sm text-gray-500">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Share your experience
                </label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Tell us how the product fit, the quality, and anything future shoppers should know."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Avatar (optional)
                </label>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 transition border border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <span>Upload image</span>
                  </label>
                  {avatarUploading && (
                    <span className="text-xs text-gray-500">
                      Uploading avatar…
                    </span>
                  )}
                  {avatarUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="object-cover w-12 h-12 rounded-full"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-sm text-gray-500 transition hover:text-gray-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submittingReview || avatarUploading}
                  className="btn-primary rounded-md px-5 py-2.5 disabled:opacity-60"
                >
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 transition border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {pendingReviewForViewer && (
            <div className="p-4 bg-white border rounded-md shadow-sm border-amber-100">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 text-sm font-semibold rounded-full shrink-0 bg-amber-100 text-amber-700">
                  {pendingReviewForViewer.customerAvatarUrl ? (
                    <img
                      src={pendingReviewForViewer.customerAvatarUrl}
                      alt={`${pendingReviewForViewer.customerName} avatar`}
                      className="object-cover w-full h-full rounded-full"
                    />
                  ) : (
                    (
                      pendingReviewForViewer.customerName?.[0] || 'Y'
                    ).toUpperCase()
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {pendingReviewForViewer.customerName}
                    </span>
                    {renderStaticStars(pendingReviewForViewer.rating)}
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Awaiting moderation
                    </span>
                    {pendingReviewForViewer.createdAt && (
                      <span className="text-xs text-gray-500">
                        {formatDateOnly(pendingReviewForViewer.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {pendingReviewForViewer.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          {reviewsLoading ? (
            <div className="py-6">
              <Spinner label="Loading reviews" />
            </div>
          ) : reviews.length === 0 ? (
            pendingReviewForViewer ? null : (
              <p className="text-sm text-gray-500">
                {user && eligibility?.hasPurchased
                  ? 'No reviews yet — be the first to share your thoughts.'
                  : 'No reviews yet. Only verified purchasers can leave reviews.'}
              </p>
            )
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li
                  key={review._id}
                  className="p-4 bg-white border border-gray-100 rounded-md shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 text-sm font-semibold text-gray-600 bg-gray-100 rounded-full shrink-0">
                      {review.customerAvatarUrl ? (
                        <img
                          src={review.customerAvatarUrl}
                          alt={`${review.customerName} avatar`}
                          className="object-cover w-full h-full rounded-full"
                        />
                      ) : (
                        (review.customerName?.[0] || '?').toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {review.customerName}
                        </span>
                        {renderStaticStars(review.rating)}
                        <span className="text-xs text-gray-500">
                          {formatDateOnly(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {review.message}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Suggestions */}
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
    </div>
  );
}
