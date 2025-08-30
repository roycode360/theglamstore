import React from 'react';

export default function Spinner({
  label = 'Loading... ',
  className = '',
  size = 24,
}: {
  label?: string;
  className?: string;
  size?: number;
}) {
  const dim = `${size}px`;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${className}`}
    >
      <div className="relative" style={{ width: dim, height: dim }}>
        <div
          className="absolute inset-0 animate-spin rounded-full border-2"
          style={{
            borderColor: 'rgba(var(--brand-300))',
            borderTopColor: 'rgb(var(--brand-700))',
          }}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm" style={{ color: 'rgb(var(--muted))' }}>
          {label}
        </span>
      )}
    </div>
  );
}
