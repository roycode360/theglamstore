import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils/cloudinary';

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const galleryImages = useMemo(
    () => (images ?? []).map((src) => getOptimizedImageUrl(src) ?? src),
    [images],
  );
  const [activeImg, setActiveImg] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState<boolean[]>([]);

  // Initialize thumbnail loaded states
  useState(() => {
    setThumbnailLoaded(new Array(galleryImages.length || 0).fill(false));
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
      <div className="flex justify-end mb-4 sm:hidden">
        <Link
          to="/products"
          className="inline-flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-lg theme-border text-brand hover:bg-brand-50"
          title="Continue Shopping"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M10.72 4.22a.75.75 0 0 1 0 1.06L5.56 10.5H21a.75.75 0 0 1 0 1.5H5.56l5.16 5.22a.75.75 0 0 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>

      <div className="flex gap-2 mb-3">
        {galleryImages
          .slice(0, galleryImages.length ? galleryImages.length : 4)
          .map((src, i) => (
            <button
              key={i}
              onClick={() => handleImageChange(i)}
              className={`theme-border relative overflow-hidden rounded-md border bg-gray-50 ${i === activeImg ? 'ring-brand-400 ring-2' : ''}`}
              style={{ width: 64, height: 64 }}
              aria-label={`Image ${i + 1}`}
            >
              {/* Thumbnail loading skeleton */}
              {!thumbnailLoaded[i] && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse">
                  <div className="w-4 h-4 mx-auto mt-5 bg-gray-300 rounded-full animate-pulse"></div>
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
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-20 h-20 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-32 h-3 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-24 h-2 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        {galleryImages?.[activeImg] && (
          <img
            src={galleryImages[activeImg] ?? undefined}
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
