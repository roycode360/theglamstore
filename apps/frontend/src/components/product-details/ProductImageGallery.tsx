import { useState } from 'react';
import { Link } from 'react-router-dom';

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState<boolean[]>([]);

  // Initialize thumbnail loaded states
  useState(() => {
    setThumbnailLoaded(new Array(images?.length || 0).fill(false));
  });

  // Reset image loaded state when active image changes
  const handleImageChange = (index: number) => {
    setActiveImg(index);
    setImageLoaded(false);
  };

  // Handle thumbnail load
  const handleThumbnailLoad = (index: number) => {
    setThumbnailLoaded((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  return (
    <div>
      {/* Mobile Continue Shopping Button */}
      <div className="mb-4 flex justify-end sm:hidden">
        <Link
          to="/products"
          className="theme-border text-brand hover:bg-brand-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition-colors"
          title="Continue Shopping"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M10.72 4.22a.75.75 0 0 1 0 1.06L5.56 10.5H21a.75.75 0 0 1 0 1.5H5.56l5.16 5.22a.75.75 0 0 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>

      <div className="mb-3 flex gap-2">
        {(images ?? []).slice(0, 4).map((src: string, i: number) => (
          <button
            key={i}
            onClick={() => handleImageChange(i)}
            className={`theme-border relative overflow-hidden rounded-md border bg-gray-50 ${i === activeImg ? 'ring-brand-400 ring-2' : ''}`}
            style={{ width: 64, height: 64 }}
            aria-label={`Image ${i + 1}`}
          >
            {/* Thumbnail loading skeleton */}
            {!thumbnailLoaded[i] && (
              <div className="absolute inset-0 animate-pulse bg-gray-200">
                <div className="mx-auto mt-5 h-4 w-4 animate-pulse rounded-full bg-gray-300"></div>
              </div>
            )}
            {src && (
              <img
                src={src}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  thumbnailLoaded[i] ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                decoding="async"
                alt={`${productName} thumbnail ${i + 1}`}
                onLoad={() => handleThumbnailLoad(i)}
              />
            )}
          </button>
        ))}
      </div>

      <div className="relative h-[60vh] overflow-hidden rounded-lg bg-gray-100 md:h-[70vh]">
        {/* Enhanced loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="flex h-full flex-col items-center justify-center space-y-4">
              <div className="h-20 w-20 animate-pulse rounded-full bg-gray-300"></div>
              <div className="space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-gray-300"></div>
                <div className="h-2 w-24 animate-pulse rounded bg-gray-300"></div>
              </div>
            </div>
          </div>
        )}
        {images?.[activeImg] && (
          <img
            src={images[activeImg]}
            loading="lazy"
            decoding="async"
            alt={productName}
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-700 ease-out ${
              imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          />
        )}
      </div>
    </div>
  );
}
