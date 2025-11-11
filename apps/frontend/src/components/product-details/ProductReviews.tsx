import { useRef, useState } from 'react';
import { formatDateOnly } from '../../utils/date';
import { TReview } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ProductReviewForm } from './ProductReviewForm';

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

type ProductReviewsProps = {
  reviews: TReview[];
  reviewsLoading: boolean;
  eligibility: ReviewEligibilityState | null;
  eligibilityLoading: boolean;
  submittingReview: boolean;
  onShowReviewForm: () => void;
  onSubmitReview: (formData: {
    displayName: string;
    rating: number;
    message: string;
    avatarUrl: string;
  }) => Promise<void>;
};

function renderStaticStars(value: number) {
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
}

export function ProductReviews({
  reviews,
  reviewsLoading,
  eligibility,
  eligibilityLoading,
  submittingReview,
  onShowReviewForm,
  onSubmitReview,
}: ProductReviewsProps) {
  const { user, login } = useAuth();
  const reviewFormRef = useRef<HTMLDivElement | null>(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [displayName, setDisplayName] = useState(user?.fullName ?? '');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);

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
  const hasExistingReview = Boolean(eligibility?.existingReview);
  const pendingReviewForViewer =
    eligibility?.existingReview && eligibility.existingReview.status.toLowerCase() === 'pending'
      ? {
          _id: eligibility.existingReview._id,
          customerName: user?.fullName || user?.email || 'You',
          customerAvatarUrl: avatarUrl || undefined,
          rating: eligibility.existingReview.rating,
          message: eligibility.existingReview.message,
          createdAt: eligibility.existingReview.createdAt,
        }
      : null;

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmitReview({
      displayName: displayName.trim(),
      rating,
      message: message.trim(),
      avatarUrl,
    });
    setMessage('');
    setRating(5);
    setShowReviewForm(false);
  };

  const handleShowForm = () => {
    setShowReviewForm(true);
    setTimeout(() => {
      reviewFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleCancelForm = () => {
    setShowReviewForm(false);
  };

  return (
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
          onClick={handleShowForm}
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
          <ProductReviewForm
            displayName={displayName}
            rating={rating}
            message={message}
            avatarUrl={avatarUrl}
            submittingReview={submittingReview}
            avatarUploading={avatarUploading}
            onDisplayNameChange={setDisplayName}
            onRatingChange={setRating}
            onMessageChange={setMessage}
            onAvatarUrlChange={(url) => setAvatarUrl(url)}
            onSubmit={handleSubmitReview}
            onCancel={handleCancelForm}
          />
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
                  (pendingReviewForViewer.customerName?.[0] || 'Y').toUpperCase()
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
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
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
  );
}
