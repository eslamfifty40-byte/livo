/**
 * Image Compression & Scaling Utilities for Firestore & Storage Safety
 * Prevents 1MB Firestore document rejection and stalled uploads across receipts, avatars,
 * chat images, support ticket screenshots, room backgrounds, ads, and cosmetics.
 */

export interface CompressImageOptions {
  maxDim?: number;
  quality?: number;
  preserveAlpha?: boolean;
  maxBytes?: number;
}

const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });

export const compressImageForFirestore = async (
  input: File | Blob | string,
  options: CompressImageOptions = {}
): Promise<string> => {
  const {
    maxDim = 900,
    quality = 0.76,
    preserveAlpha = false,
    maxBytes = 240_000
  } = options;

  let dataUrl: string;
  if (typeof input === 'string') {
    if (!input.startsWith('data:image')) return input;
    dataUrl = input;
  } else {
    dataUrl = await readBlobAsDataUrl(input);
  }

  if (!dataUrl.startsWith('data:image')) return dataUrl;
  // Already small enough and doesn't need shrinking unless over dimension budget
  const approxInitialBytes = Math.ceil((dataUrl.length * 3) / 4);

  try {
    const img = await loadImage(dataUrl);
    const width = img.naturalWidth || img.width || 1;
    const height = img.naturalHeight || img.height || 1;
    const needsResize = width > maxDim || height > maxDim;

    if (!needsResize && approxInitialBytes <= maxBytes) {
      return dataUrl;
    }

    let scale = Math.min(1, maxDim / Math.max(width, height));
    let currentQuality = quality;
    const mimeType =
      preserveAlpha || dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/webp')
        ? preserveAlpha
          ? 'image/png'
          : 'image/jpeg'
        : 'image/jpeg';

    let result = dataUrl;
    for (let attempt = 0; attempt < 4; attempt++) {
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) break;

      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
      } else {
        ctx.clearRect(0, 0, targetW, targetH);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      result =
        mimeType === 'image/png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', currentQuality);

      const estimatedBytes = Math.ceil((result.length * 3) / 4);
      if (estimatedBytes <= maxBytes) {
        return result;
      }

      // Reduce quality or scale for next pass so it fits safely under Firestore 1MB cap
      if (mimeType === 'image/jpeg' && currentQuality > 0.5) {
        currentQuality = Math.max(0.46, currentQuality - 0.14);
      } else {
        scale *= 0.72;
      }
    }

    return result;
  } catch {
    return dataUrl;
  }
};
