import imageCompression from 'browser-image-compression';

export type CloudinaryConfig = {
  uploadPreset: string;
  cloudName: string;
};

const WEBP_OPTIONS: Parameters<typeof imageCompression>[1] = {
  fileType: 'image/webp',
  maxSizeMB: 2,
  maxWidthOrHeight: 2000,
  useWebWorker: true,
  initialQuality: 0.85,
};

const shouldConvertToWebp = (file: File) =>
  file.type.startsWith('image/') && file.type !== 'image/webp';

async function ensureWebp(file: File): Promise<File> {
  if (!shouldConvertToWebp(file)) return file;
  try {
    return await imageCompression(file, WEBP_OPTIONS);
  } catch (error) {
    console.warn(
      '[cloudinary] Failed to convert image to WebP, uploading original file.',
      error,
    );
    return file;
  }
}

export async function uploadToCloudinary(
  file: File,
  config?: Partial<CloudinaryConfig>,
): Promise<{ secure_url: string }> {
  const cloudName =
    config?.cloudName ?? import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    config?.uploadPreset ?? import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Missing Cloudinary config');

  const payloadFile = await ensureWebp(file);

  const form = new FormData();
  form.append('file', payloadFile);
  form.append('upload_preset', String(uploadPreset));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: form,
    },
  );
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return { secure_url: data.secure_url };
}

const CLOUDINARY_HOST = 'res.cloudinary.com';
const CLOUDINARY_UPLOAD_SEGMENT = '/upload/';

const hasAutoFormat = (segment: string) =>
  segment.includes('f_auto') || segment.includes('q_auto');

export function getOptimizedImageUrl(
  url?: string | null,
  transformations = 'f_auto,q_auto',
): string | undefined | null {
  if (!url || !url.includes(CLOUDINARY_HOST)) return url ?? null;

  const [baseUrl, ...queryParts] = url.split('?');
  const query = queryParts.length ? `?${queryParts.join('?')}` : '';
  const uploadIndex = baseUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) return url;

  const prefixEnd = uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
  const prefix = baseUrl.slice(0, prefixEnd);
  const suffix = baseUrl.slice(prefixEnd);

  if (hasAutoFormat(suffix)) {
    return `${baseUrl}${query}`;
  }

  const cleanTransform = transformations.replace(/^\/|\/$/g, '');
  return `${prefix}${cleanTransform}/${suffix}${query}`;
}
