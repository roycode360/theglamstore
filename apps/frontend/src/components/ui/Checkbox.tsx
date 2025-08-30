import React from 'react';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  className?: string;
};

export default function Checkbox({
  checked,
  onChange,
  label,
  className = '',
}: Props) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 ${className}`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${checked ? 'bg-brand border-brand text-white' : 'theme-border border bg-white'}`}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-3 h-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      {label && <span className="select-none">{label}</span>}
    </label>
  );
}
