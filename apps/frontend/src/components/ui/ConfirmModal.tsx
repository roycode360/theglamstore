import React, { useState } from 'react';
import Spinner from './Spinner';

type Props = {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleConfirmClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onConfirm());
      onClose();
    } catch (error) {
      // Let callers handle errors via onConfirm; keep modal open for retry
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div className="theme-border theme-card relative w-auto max-w-[90vw] rounded-lg border p-4 shadow-xl sm:max-w-md sm:p-6">
        <div className="mb-2 text-lg font-semibold text-brand">{title}</div>
        {message && (
          <div className="mb-4 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            {message}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-3 text-sm rounded-md btn-ghost h-9"
            disabled={isSubmitting}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirmClick}
            className="px-3 text-sm rounded-md btn-primary h-9"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Spinner label="" size={16} className="w-4 h-4" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
