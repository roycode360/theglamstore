import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useToast } from '../../components/ui/Toast';
import {
  LIST_PENDING_REVIEWS,
  MODERATE_REVIEW,
} from '../../graphql/reviews';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { formatDate } from '../../utils/date';
import { Skeleton } from '../../components/ui/Skeleton';

type PendingReview = {
  _id: string;
  productId: string;
  productName: string;
  productSlug?: string | null;
  productImage?: string | null;
  orderNumber?: string | null;
  customerName: string;
  customerEmail: string;
  customerAvatarUrl?: string | null;
  rating: number;
  message: string;
  createdAt: string;
};

type ModerateAction = 'approve' | 'reject';

export default function AdminReviewsPage() {
  const [limit, setLimit] = useState<number>(50);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data, loading, refetch } = useQuery<{
    listPendingReviews: PendingReview[];
  }>(LIST_PENDING_REVIEWS, {
    variables: { limit },
    fetchPolicy: 'network-only',
  });

  const [moderateReview] = useMutation(MODERATE_REVIEW);

  const reviews = useMemo(
    () => (data?.listPendingReviews ?? []) as PendingReview[],
    [data],
  );

  const handleModerate = async (
    id: string,
    action: ModerateAction,
    reason?: string,
  ) => {
    setActionId(id);
    try {
      await moderateReview({
        variables: {
          input: {
            reviewId: id,
            action,
            reason: reason?.trim() || undefined,
          },
        },
      });
      showToast(
        action === 'approve'
          ? 'Review approved successfully'
          : 'Review rejected',
        'success',
      );
      await refetch();
    } catch (error: any) {
      const message =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        'Failed to update review status';
      showToast(message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = reviews.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500">
            Moderate customer feedback before it appears in the store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="limit"
            className="text-sm font-medium text-gray-600"
          >
            Show
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(event) => {
              const value = Number(event.target.value);
              setLimit(value);
              void refetch({ limit: value });
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            {[10, 25, 50, 100, 200].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
          <span>Pending reviews</span>
          <span className="font-medium text-gray-900">{pendingCount}</span>
        </div>

        {loading ? (
          <PendingReviewsSkeleton />
        ) : reviews.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No reviews are waiting for moderation right now.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <li key={review._id} className="flex flex-col gap-4 px-6 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-1 gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-gray-100">
                      {review.productImage ? (
                        <img
                          src={review.productImage}
                          alt={review.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {review.productName}
                        </h3>
                        {review.orderNumber && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Order {review.orderNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{review.customerName}</span>
                        <span>•</span>
                        <span>{review.customerEmail}</span>
                        <span>•</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="inline-flex h-7 items-center rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
                          {review.rating} / 5
                        </span>
                        <span className="text-sm text-gray-500">
                          “{review.message.slice(0, 120)}
                          {review.message.length > 120 ? '…' : ''}”
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleModerate(review._id, 'approve')}
                      disabled={actionId === review._id}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionId === review._id ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectTarget(review._id);
                        setRejectReason('');
                        setRejectModalOpen(true);
                      }}
                      disabled={actionId === review._id}
                      className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {review.message}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={rejectModalOpen}
        onClose={() => {
          if (actionId) return;
          setRejectModalOpen(false);
          setRejectTarget(null);
        }}
        title="Reject review"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Optionally share a short note to help the team understand why this
            review is being rejected.
          </p>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Reason for rejection (optional)"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (actionId) return;
                setRejectModalOpen(false);
                setRejectTarget(null);
                setRejectReason('');
              }}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!rejectTarget) return;
                await handleModerate(rejectTarget, 'reject', rejectReason);
                setRejectModalOpen(false);
                setRejectTarget(null);
                setRejectReason('');
              }}
              disabled={actionId === rejectTarget}
              className="rounded-md border border-rose-200 bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionId === rejectTarget ? 'Rejecting…' : 'Reject review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PendingReviewsSkeleton() {
  const rows = Array.from({ length: 3 });
  return (
    <div className="divide-y divide-gray-100">
      {rows.map((_, idx) => (
        <div key={idx} className="space-y-4 px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 gap-4">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-48 rounded-md" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-4 w-48 rounded-md" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

