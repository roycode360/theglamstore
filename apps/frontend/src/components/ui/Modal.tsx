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
  const openRaf1Ref = useRef<number | null>(null);
  const openRaf2Ref = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Ensure we start from the hidden state, then transition to visible
      setVisible(false);
      openRaf1Ref.current = requestAnimationFrame(() => {
        // A second RAF guarantees layout has been flushed before toggling
        openRaf2Ref.current = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      // wait for animation before unmount (keep in sync with duration below)
      closeTimerRef.current = window.setTimeout(() => {
        setMounted(false);
      }, 300);
    }
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (openRaf1Ref.current) {
        cancelAnimationFrame(openRaf1Ref.current);
        openRaf1Ref.current = null;
      }
      if (openRaf2Ref.current) {
        cancelAnimationFrame(openRaf2Ref.current);
        openRaf2Ref.current = null;
      }
    };
  }, [open]);

  if (!mounted) return null;
  const hasHeading = Boolean(title || titleIcon);
  const easeClass = visible ? 'ease-out' : 'ease-in';
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-0">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${easeClass} ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => {
          if (canDismiss) onClose();
        }}
      />
      <div
        className={`relative w-full max-w-[94vw] sm:w-auto ${widthClassName} overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] transition-all duration-300 ${easeClass} ${visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'}`}
      >
        <div className={`px-4 py-4 sm:px-8 sm:py-6 ${footer ? 'pb-4' : ''}`}>
          {(hasHeading || canDismiss) && (
            <div
              className={`mb-3 flex items-start gap-3 sm:mb-4 ${
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
          <div className="max-h-[85vh] overflow-y-auto">{children}</div>
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
