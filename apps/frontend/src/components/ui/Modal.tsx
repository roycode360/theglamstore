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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-0">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={() => {
          if (canDismiss) onClose();
        }}
      />
      <div
        className={`relative w-auto max-w-[92vw] sm:w-full ${widthClassName} theme-border theme-card overflow-hidden rounded-xl border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-[rgb(var(--brand-300))]/20`}
      >
        <div
          className="h-1.5 w-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(var(--brand-200),0.9) 0%, rgba(var(--brand-400),0.95) 50%, rgba(var(--brand-300),0.9) 100%)',
          }}
        />
        {(title || canDismiss) && (
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b theme-border sm:px-5">
            {title && (
              <div className="flex items-center gap-2">
                {titleIcon && (
                  <span className="inline-flex items-center justify-center w-8 h-8 text-gray-700 rounded-md bg-gray-50 ring-1 ring-gray-200">
                    {titleIcon}
                  </span>
                )}
                <div
                  className="text-lg font-semibold"
                  style={{ color: 'rgb(var(--brand-900))' }}
                >
                  {title}
                </div>
              </div>
            )}
            {canDismiss && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="p-2 text-gray-600 transition-colors border rounded-md theme-border hover:bg-gray-50 hover:text-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
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
        <div className="px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t theme-border sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
