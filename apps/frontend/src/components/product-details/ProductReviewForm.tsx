import { FormEvent, ChangeEvent, useRef, useState } from 'react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useToast } from '../../components/ui/Toast';

type ProductReviewFormProps = {
  displayName: string;
  rating: number;
  message: string;
  avatarUrl: string;
  submittingReview: boolean;
  avatarUploading: boolean;
  onDisplayNameChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onMessageChange: (value: string) => void;
  onAvatarUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
};

export function ProductReviewForm({
  displayName,
  rating,
  message,
  avatarUrl,
  submittingReview,
  avatarUploading,
  onDisplayNameChange,
  onRatingChange,
  onMessageChange,
  onAvatarUrlChange,
  onSubmit,
  onCancel,
}: ProductReviewFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { secure_url } = await uploadToCloudinary(file);
      onAvatarUrlChange(secure_url);
      showToast('Avatar uploaded', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to upload avatar', 'error');
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarUrlChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="p-4 space-y-4 bg-white border border-gray-200 rounded-md shadow-sm"
    >
      <div>
        <label className="text-sm font-medium text-gray-700">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(event) => onDisplayNameChange(event.target.value)}
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
                onClick={() => onRatingChange(value)}
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
          onChange={(event) => onMessageChange(event.target.value)}
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
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 transition border border-gray-200 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
