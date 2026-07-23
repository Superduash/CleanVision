import imageCompression from 'browser-image-compression';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

/** Validate that a file is an allowed image type */
export function validateImageType(file: File): boolean {
  return ALLOWED_TYPES.has(file.type.toLowerCase());
}

/** Get file size in MB */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}

/** Compress an image to ≤1MB at max 1600px dimension before upload */
export async function compressImage(file: File): Promise<File> {
  if (!validateImageType(file)) {
    throw new Error('Invalid file type. Allowed: jpg, jpeg, png, webp');
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
  });

  // Return as File (imageCompression returns a Blob)
  return new File([compressed], file.name, { type: compressed.type });
}
