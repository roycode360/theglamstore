import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useSearchParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../components/ui/Toast';
import { TProduct, TReview } from 'src/types';
import { LIST_PRODUCTS_BY_CATEGORY, GET_PRODUCT } from 'src/graphql/products';
import { LIST_CATEGORIES } from '../graphql/categories';
import {
  LIST_PRODUCT_REVIEWS,
  GET_REVIEW_ELIGIBILITY,
  SUBMIT_PRODUCT_REVIEW,
} from '../graphql/reviews';
import { useAuth } from '../contexts/AuthContext';
import { useAnalyticsTracker } from '../hooks/useAnalyticsTracker';

// Import sub-components
import { ProductImageGallery } from '../components/product-details/ProductImageGallery';
import { ProductInfo } from '../components/product-details/ProductInfo';
import { ProductSelectors } from '../components/product-details/ProductSelectors';
import { ProductActions } from '../components/product-details/ProductActions';
import { ProductAccordions } from '../components/product-details/ProductAccordions';
import { ProductReviews } from '../components/product-details/ProductReviews';
import { ProductSuggestions } from '../components/product-details/ProductSuggestions';

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
  const { user, isUserAuthenticated } = useAuth();
  const { trackProductView } = useAnalyticsTracker();

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
    if (!id || !isUserAuthenticated || user?.role !== 'customer') return;
    await loadEligibility({
      variables: { productId: id },
    });
  }, [id, loadEligibility, isUserAuthenticated, user?.role]);

  useEffect(() => {
    void refreshEligibility();
  }, [refreshEligibility]);

  const productId = data?.getProduct?._id;
  useEffect(() => {
    if (productId) {
      trackProductView(productId);
    }
  }, [productId, trackProductView]);

  const eligibility = eligibilityData?.getReviewEligibility ?? null;
  const reviews = (reviewsData?.listProductReviews ?? []) as TReview[];

  const [submitProductReview, { loading: submittingReview }] = useMutation(
    SUBMIT_PRODUCT_REVIEW,
  );

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

  const suggestions = useMemo(() => {
    const items = (relatedData?.listProductsByCategory ?? []) as TProduct[];
    return items.slice(0, 3);
  }, [relatedData]);

  // Find category name from slug
  const categoryInfo = useMemo(() => {
    if (!p?.category || !categoriesData?.listCategories) return null;
    const categories = (categoriesData.listCategories as any[]) ?? [];
    const normalize = (s: string) => s?.toString().trim().toLowerCase();
    const slugify = (s: string) =>
      normalize(s)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const fromSlug = categories.find((c: any) => c.slug === p.category);
    if (fromSlug) return { name: fromSlug.name, slug: fromSlug.slug };

    const bySlugified = categories.find(
      (c: any) => normalize(c.slug) === slugify(p.category),
    );
    if (bySlugified) return { name: bySlugified.name, slug: bySlugified.slug };

    const byName = categories.find(
      (c: any) => normalize(c.name) === normalize(p.category),
    );
    if (byName) return { name: byName.name, slug: byName.slug };

    // Fallback: display raw category text with a best-effort slug
    return { name: p.category, slug: slugify(p.category) };
  }, [p?.category, categoriesData]);

  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const { addToCart, cartItems } = useCart();
  const { showToast } = useToast();
  const { items: wishlist, add: addWish, remove: removeWish } = useWishlist();

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
    const existingForProduct = (
      Array.isArray(cartItems) ? cartItems : []
    ).filter((ci: any) => {
      if (ci?.product?._id) {
        return ci.product._id === productId;
      }
      if (ci?.productId) {
        return ci.productId === productId;
      }
      return false;
    });
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

  const handleToggleWishlist = async () => {
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
  };

  const handleSubmitReview = async (formData: {
    displayName: string;
    rating: number;
    message: string;
    avatarUrl: string;
  }) => {
    try {
      await submitProductReview({
        variables: {
          input: {
            productId: p._id,
            displayName: formData.displayName,
            rating: formData.rating,
            message: formData.message,
            avatarUrl: formData.avatarUrl || undefined,
          },
        },
      });
      showToast('Review submitted for moderation', 'success');
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
        <ProductImageGallery images={p.images ?? []} productName={p.name} />

        <div className="space-y-6">
          <ProductInfo product={p} categoryInfo={categoryInfo} />

          <ProductSelectors
            colorOptions={colorOptions}
            sizes={p.sizes}
            onColorChange={setActiveColorIdx}
            onSizeChange={setActiveSize}
            selectedColorIdx={activeColorIdx}
            selectedSize={activeSize}
          />

          <ProductActions
            product={p}
            quantity={qty}
            onQuantityChange={setQty}
            onAddToCart={handleAddToCart}
            wishlistItems={wishlist}
            onToggleWishlist={handleToggleWishlist}
          />
        </div>
      </section>

      <ProductAccordions />

      <ProductReviews
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        eligibility={eligibility}
        eligibilityLoading={eligibilityLoading}
        submittingReview={submittingReview}
        onShowReviewForm={() => {}}
        onSubmitReview={handleSubmitReview}
      />

      <ProductSuggestions suggestions={suggestions} />
    </div>
  );
}
