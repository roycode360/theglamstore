import { useEffect, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string };

export default function Select({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select',
  buttonClassName = '',
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
  buttonClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHighlight(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
  }, [value, options]);

  // Close on outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, options.length - 1));
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.max(h - 1, 0));
          }
          if (e.key === 'Enter' && open) {
            e.preventDefault();
            const o = options[highlight];
            if (o) {
              onChange(o.value);
              setOpen(false);
            }
          }
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        className={`theme-border w-full rounded border px-3 py-2 pr-10 text-left focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${buttonClassName} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <span className="capitalize">
          {options.find((o) => o.value === value)?.label ?? placeholder}
        </span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
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
              d="M6 9l6 6 6-6"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          className="theme-border absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow-lg"
        >
          {options.map((o, idx) => (
            <div
              key={o.value}
              role="option"
              aria-selected={value === o.value}
              className={`m-1 cursor-pointer rounded-md px-3 py-2 ${idx === highlight ? 'bg-gray-50' : ''}`}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
