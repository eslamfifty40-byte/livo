/**
 * Client-side Canvas Background Remover -> True Transparent RGBA PNG
 * Uses edge & center flood-fill so metallic highlights inside frames remain intact
 * while solid white, dark studio, or checkerboard backgrounds become transparent.
 */

export interface BgRemovalOptions {
  tolerance?: number; // 15..65 (default 32)
  stripCheckerboard?: boolean;
  maxSize?: number; // max width/height px (default 512)
}

export async function removeImageBackgroundToPng(
  fileOrDataUrl: File | string,
  options: BgRemovalOptions = {}
): Promise<string> {
  const { tolerance = 32, stripCheckerboard = true, maxSize = 512 } = options;

  const dataUrl =
    typeof fileOrDataUrl === 'string'
      ? fileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
          reader.readAsDataURL(fileOrDataUrl);
        });

  return new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;

        // Sample top-left corner color as primary background color
        const bgR = d[0];
        const bgG = d[1];
        const bgB = d[2];
        const bgA = d[3];

        // If already mostly transparent around corners and center, return crisp resized PNG as-is
        const centerIdx = (Math.floor(h / 2) * w + Math.floor(w / 2)) * 4;
        if (bgA < 15 && d[centerIdx + 3] < 15) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        const isBackgroundPixel = (idx: number): boolean => {
          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          const a = d[idx + 3];
          if (a < 25) return true;

          // Match near corner sample
          const distCorner = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          if (distCorner <= tolerance * 2.2) return true;

          // Match pure white / neutral bright backdrop
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          if (minC >= 255 - tolerance * 1.4 && maxC - minC <= 22) return true;

          // Match checkerboard light-grey / white grid
          if (stripCheckerboard && minC >= 186 && maxC - minC <= 18) return true;

          return false;
        };

        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        const enqueueIfBg = (pos: number) => {
          if (!visited[pos] && isBackgroundPixel(pos * 4)) {
            visited[pos] = 1;
            queue.push(pos);
          }
        };

        // Seed outer perimeter
        for (let x = 0; x < w; x++) {
          enqueueIfBg(x);
          enqueueIfBg((h - 1) * w + x);
        }
        for (let y = 0; y < h; y++) {
          enqueueIfBg(y * w);
          enqueueIfBg(y * w + (w - 1));
        }

        // Seed inner circle center void (so circular frames become hollow!)
        const cx = Math.floor(w / 2);
        const cy = Math.floor(h / 2);
        const seedRadius = Math.max(8, Math.floor(Math.min(w, h) * 0.08));
        for (let dy = -seedRadius; dy <= seedRadius; dy++) {
          for (let dx = -seedRadius; dx <= seedRadius; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              enqueueIfBg(ny * w + nx);
            }
          }
        }

        // Also seed enclosed flat neutral checkerboard tiles surrounded by bg pixels
        if (stripCheckerboard) {
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const pos = y * w + x;
              if (visited[pos]) continue;
              const idx = pos * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
              if (minC >= 194 && maxC <= 232 && maxC - minC <= 8) {
                if (
                  isBackgroundPixel((pos - 1) * 4) &&
                  isBackgroundPixel((pos + 1) * 4) &&
                  isBackgroundPixel((pos - w) * 4) &&
                  isBackgroundPixel((pos + w) * 4)
                ) {
                  visited[pos] = 1;
                  queue.push(pos);
                }
              }
            }
          }
        }

        // BFS flood fill
        let head = 0;
        while (head < queue.length) {
          const pos = queue[head++];
          const x = pos % w;
          const y = (pos - x) / w;
          if (x > 0) enqueueIfBg(pos - 1);
          if (x < w - 1) enqueueIfBg(pos + 1);
          if (y > 0) enqueueIfBg(pos - w);
          if (y < h - 1) enqueueIfBg(pos + w);
        }

        // Clear alpha on background + feather 1px edge halo
        for (let pos = 0; pos < w * h; pos++) {
          if (visited[pos]) {
            d[pos * 4 + 3] = 0;
          } else {
            const x = pos % w;
            const y = (pos - x) / w;
            const nearBg =
              (x > 0 && visited[pos - 1]) ||
              (x < w - 1 && visited[pos + 1]) ||
              (y > 0 && visited[pos - w]) ||
              (y < h - 1 && visited[pos + w]);
            if (nearBg) {
              const idx = pos * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
              if (minC >= 170 && maxC - minC <= 24) {
                d[idx + 3] = Math.min(d[idx + 3], 95);
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('تعذر تحميل الصورة للمعالجة'));
    img.src = dataUrl;
  });
}
