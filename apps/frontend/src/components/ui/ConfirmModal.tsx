import React from 'react';

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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="theme-border theme-card relative w-auto max-w-[90vw] rounded-lg border p-4 shadow-xl sm:max-w-md sm:p-6">
        <div className="text-brand mb-2 text-lg font-semibold">{title}</div>
        {message && (
          <div className="mb-4 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            {message}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-ghost h-9 rounded-md px-3 text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className="btn-primary h-9 rounded-md px-3 text-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
