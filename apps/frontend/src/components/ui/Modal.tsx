import React from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
  canDismiss?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  widthClassName = 'max-w-lg',
  canDismiss = true,
}: ModalProps) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={() => {
          if (canDismiss) onClose();
        }}
      />
      <div
        className={`relative w-full ${widthClassName} theme-border theme-card rounded-lg border p-5 shadow-xl`}
      >
        {(title || canDismiss) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            {title && (
              <div className="flex items-center gap-2">
                {titleIcon && (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 text-gray-700 ring-1 ring-gray-200">
                    {titleIcon}
                  </span>
                )}
                <div className="text-lg font-semibold">{title}</div>
              </div>
            )}
            {canDismiss && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="theme-border rounded-md border p-2 text-gray-600 transition-colors hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
