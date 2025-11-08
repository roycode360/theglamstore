import { Link } from 'react-router-dom';
import Modal from './Modal';
import React from 'react';

export type PromoContent = {
  title: string;
  subtitle?: string;
  message: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  content: PromoContent;
  widthClassName?: string;
};

export default function PromoModal({
  open,
  onClose,
  content,
  widthClassName = 'max-w-md',
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      widthClassName={widthClassName}
      canDismiss={false}
    >
      <div className="flex flex-col gap-6 text-center">
        {content.imageUrl ? (
          <div className="relative -mx-5 -mt-6 overflow-hidden sm:-mx-8">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="h-48 w-full object-cover"
            />
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
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
          </div>
        ) : null}

        <div className="space-y-2 px-2 sm:px-4">
          {content.subtitle ? (
            <div className="text-brand text-[11px] font-semibold uppercase tracking-[0.35em]">
              {content.subtitle}
            </div>
          ) : null}
          <h2 className="!text-2xl font-bold tracking-tight text-neutral-900 sm:text-[28px]">
            {content.title}
          </h2>
          <p className="whitespace-pre-line text-[15px] leading-6 text-neutral-600">
            {content.message}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-100"
          >
            Maybe later
          </button>
          {content.ctaLabel && content.ctaLink ? (
            <Link
              to={content.ctaLink}
              onClick={onClose}
              className="bg-brand ring-brand/30 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-sm ring-1 transition hover:opacity-95"
            >
              {content.ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
