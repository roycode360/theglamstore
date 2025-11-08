import React, { useEffect, useRef, useState } from 'react';
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
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // next frame ensure transitions run
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      // wait for animation before unmount
      closeTimerRef.current = window.setTimeout(() => {
        setMounted(false);
      }, 200);
    }
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  if (!mounted) return null;
  const hasHeading = Boolean(title || titleIcon);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-0">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => {
          if (canDismiss) onClose();
        }}
      />
      <div
        className={`relative w-full max-w-[94vw] sm:w-auto ${widthClassName} overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] transition-all duration-200 ${visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
      >
        <div className={`px-5 py-6 sm:px-8 ${footer ? 'pb-4' : ''}`}>
          {(hasHeading || canDismiss) && (
            <div
              className={`mb-4 flex items-start gap-3 ${
                hasHeading ? 'justify-between' : 'justify-end'
              }`}
            >
              {(title || titleIcon) && (
                <div className="flex items-center gap-3">
                  {titleIcon && (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                      {titleIcon}
                    </span>
                  )}
                  {title && (
                    <div className="text-xl font-semibold text-gray-900">
                      {title}
                    </div>
                  )}
                </div>
              )}
              {canDismiss && (
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
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
        </div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 pb-6 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
