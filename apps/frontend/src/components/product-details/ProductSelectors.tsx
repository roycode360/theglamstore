import { useMemo, useState } from 'react';

type ColorOption = {
  label: string;
  swatch: string;
};

type ProductSelectorsProps = {
  colorOptions: ColorOption[];
  sizes: string[] | undefined;
  onColorChange: (index: number) => void;
  onSizeChange: (size: string) => void;
  selectedColorIdx: number;
  selectedSize: string | null;
};

export function ProductSelectors({
  colorOptions,
  sizes,
  onColorChange,
  onSizeChange,
  selectedColorIdx,
  selectedSize,
}: ProductSelectorsProps) {
  return (
    <>
      {/* Color */}
      {colorOptions.length > 0 ? (
        <div>
          <div className="mb-1 text-sm font-medium">
            Color: {colorOptions[selectedColorIdx]?.label}
          </div>
          <div className="flex gap-2">
            {colorOptions.map((opt, i) => (
              <button
                key={`${opt.label}-${i}`}
                onClick={() => onColorChange(i)}
                className={`h-8 w-8 rounded-full border ${
                  i === selectedColorIdx
                    ? 'border-black ring-2 ring-black ring-offset-2 ring-offset-white'
                    : 'theme-border'
                }`}
                style={{ backgroundColor: opt.swatch }}
                aria-label={opt.label}
                title={opt.label}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">Available in default color</div>
      )}

      {/* Size */}
      {sizes?.length ? (
        <div>
          <div className="mb-1 text-sm font-medium">Size</div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s: string, i: number) => (
              <button
                key={i}
                onClick={() => onSizeChange(s)}
                className={`theme-border rounded-md border px-3 py-1.5 text-sm ${selectedSize === s ? 'btn-primary' : ''}`}
                aria-label={s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">One size fits all</div>
      )}
    </>
  );
}
