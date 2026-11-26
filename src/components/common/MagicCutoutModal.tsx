import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Wand2,
  Eraser,
  Paintbrush,
  Undo2,
  RotateCcw,
  Check,
  Sparkles,
  Eye
} from 'lucide-react';
import { compressImageForFirestore } from '../../utils/imageCompression';

export interface MagicCutoutModalProps {
  isOpen: boolean;
  initialImage: string | File | null;
  title?: string;
  maxOutputDim?: number;
  maxBytes?: number;
  onClose: () => void;
  onApply: (transparentPngDataUrl: string) => void;
}

type ToolMode = 'wand' | 'erase' | 'restore';

export const MagicCutoutModal: React.FC<MagicCutoutModalProps> = ({
  isOpen,
  initialImage,
  title = 'أداة القص السحري وتنظيف الخلفية',
  maxOutputDim = 512,
  maxBytes = 180_000,
  onClose,
  onApply
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalDataRef = useRef<ImageData | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [toolMode, setToolMode] = useState<ToolMode>('erase');
  const [tolerance, setTolerance] = useState<number>(36);
  const [brushSize, setBrushSize] = useState<number>(22);
  const [previewBg, setPreviewBg] = useState<'checker' | 'dark' | 'light'>('checker');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current.slice(-14), snap];
    setHistoryCount(historyRef.current.length);
  };

  const runEdgeFloodCutout = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tol: number,
    sourceData?: ImageData
  ) => {
    const imgData = sourceData
      ? new ImageData(new Uint8ClampedArray(sourceData.data), w, h)
      : ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Sample all 4 corners to handle slight gradients on photo edges
    const corners = [
      [d[0], d[1], d[2], d[3]],
      [d[(w - 1) * 4], d[(w - 1) * 4 + 1], d[(w - 1) * 4 + 2], d[(w - 1) * 4 + 3]],
      [d[((h - 1) * w) * 4], d[((h - 1) * w) * 4 + 1], d[((h - 1) * w) * 4 + 2], d[((h - 1) * w) * 4 + 3]],
      [d[((h - 1) * w + (w - 1)) * 4], d[((h - 1) * w + (w - 1)) * 4 + 1], d[((h - 1) * w + (w - 1)) * 4 + 2], d[((h - 1) * w + (w - 1)) * 4 + 3]]
    ];

    const visited = new Uint8Array(w * h);
    const queue: number[] = [];

    const matchesCornerOrBg = (idx: number): boolean => {
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];
      const a = d[idx + 3];
      if (a < 25) return true;

      for (const [cr, cg, cb, ca] of corners) {
        if (ca < 25) continue;
        const dist = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
        if (dist <= tol * 2.4) return true;
      }

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      if (minC >= 255 - tol * 1.35 && maxC - minC <= 24) return true;
      return false;
    };

    const enqueue = (pos: number) => {
      if (!visited[pos] && matchesCornerOrBg(pos * 4)) {
        visited[pos] = 1;
        queue.push(pos);
      }
    };

    for (let x = 0; x < w; x++) {
      enqueue(x);
      enqueue((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      enqueue(y * w);
      enqueue(y * w + (w - 1));
    }

    let head = 0;
    while (head < queue.length) {
      const pos = queue[head++];
      const x = pos % w;
      const y = (pos - x) / w;
      if (x > 0) enqueue(pos - 1);
      if (x < w - 1) enqueue(pos + 1);
      if (y > 0) enqueue(pos - w);
      if (y < h - 1) enqueue(pos + w);
    }

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
          d[pos * 4 + 3] = Math.min(d[pos * 4 + 3], 150);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    if (!isOpen || !initialImage) return;
    let active = true;
    setErrorMsg(null);
    setIsLoading(true);
    historyRef.current = [];
    setHistoryCount(0);

    const load = async () => {
      try {
        const dataUrl =
          typeof initialImage === 'string'
            ? initialImage
            : await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
                reader.readAsDataURL(initialImage);
              });

        if (!active) return;

        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!active) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const maxDim = Math.max(256, Math.min(512, maxOutputDim));
          const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width || 1, img.naturalHeight || img.height || 1));
          const w = Math.max(1, Math.round((img.naturalWidth || img.width || 256) * scale));
          const h = Math.max(1, Math.round((img.naturalHeight || img.height || 256) * scale));
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const orig = ctx.getImageData(0, 0, w, h);
          originalDataRef.current = orig;

          // Automatically apply initial smart cutout if corners look opaque
          const d = orig.data;
          const cornersTransparent =
            d[3] < 25 &&
            d[(w - 1) * 4 + 3] < 25 &&
            d[(h - 1) * w * 4 + 3] < 25;
          if (!cornersTransparent) {
            runEdgeFloodCutout(ctx, w, h, tolerance, orig);
          }
          setIsLoading(false);
        };
        img.onerror = () => {
          if (!active) return;
          setErrorMsg('تعذر تحميل هذه الصورة للتعديل (تأكد من رفع الصورة من الجهاز مباشرة)');
          setIsLoading(false);
        };
        img.src = dataUrl;
      } catch {
        if (!active) return;
        setErrorMsg('حدث خطأ أثناء تجهيز الصورة');
        setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [isOpen, initialImage]);

  if (!isOpen) return null;

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((clientX - rect.left) / Math.max(1, rect.width)) * canvas.width);
    const y = Math.round(((clientY - rect.top) / Math.max(1, rect.height)) * canvas.height);
    return {
      x: Math.max(0, Math.min(canvas.width - 1, x)),
      y: Math.max(0, Math.min(canvas.height - 1, y))
    };
  };

  const applyWandAt = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushHistory();
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const startIdx = (startY * w + startX) * 4;
    const targetR = d[startIdx];
    const targetG = d[startIdx + 1];
    const targetB = d[startIdx + 2];
    const targetA = d[startIdx + 3];
    if (targetA < 15) return;

    const maxDiff = tolerance * 2.6;
    const visited = new Uint8Array(w * h);
    const queue: number[] = [startY * w + startX];
    visited[startY * w + startX] = 1;

    let head = 0;
    while (head < queue.length) {
      const pos = queue[head++];
      const idx = pos * 4;
      d[idx + 3] = 0;

      const x = pos % w;
      const y = (pos - x) / w;
      const neighbors = [
        x > 0 ? pos - 1 : -1,
        x < w - 1 ? pos + 1 : -1,
        y > 0 ? pos - w : -1,
        y < h - 1 ? pos + w : -1
      ];
      for (const n of neighbors) {
        if (n < 0 || visited[n]) continue;
        const nIdx = n * 4;
        if (d[nIdx + 3] < 15) continue;
        const diff =
          Math.abs(d[nIdx] - targetR) +
          Math.abs(d[nIdx + 1] - targetG) +
          Math.abs(d[nIdx + 2] - targetB);
        if (diff <= maxDiff) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const paintStroke = (x0: number, y0: number, x1: number, y1: number) => {
    const canvas = canvasRef.current;
    const orig = originalDataRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const radius = Math.max(2, Math.round(brushSize / 2));
    const rSq = radius * radius;
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));

    for (let s = 0; s <= steps; s++) {
      const cx = Math.round(x0 + ((x1 - x0) * s) / steps);
      const cy = Math.round(y0 + ((y1 - y0) * s) / steps);
      const minX = Math.max(0, cx - radius);
      const maxX = Math.min(w - 1, cx + radius);
      const minY = Math.max(0, cy - radius);
      const maxY = Math.min(h - 1, cy + radius);

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const distSq = (px - cx) * (px - cx) + (py - cy) * (py - cy);
          if (distSq > rSq) continue;
          const idx = (py * w + px) * 4;
          if (toolMode === 'erase') {
            if (distSq <= rSq * 0.65) {
              d[idx + 3] = 0;
            } else {
              d[idx + 3] = Math.min(d[idx + 3], 120);
            }
          } else if (toolMode === 'restore' && orig) {
            d[idx] = orig.data[idx];
            d[idx + 1] = orig.data[idx + 1];
            d[idx + 2] = orig.data[idx + 2];
            d[idx + 3] = orig.data[idx + 3];
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isLoading || errorMsg) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasCoords(e.clientX, e.clientY);
    if (toolMode === 'wand') {
      applyWandAt(pt.x, pt.y);
      return;
    }
    pushHistory();
    isDrawingRef.current = true;
    lastPointRef.current = pt;
    paintStroke(pt.x, pt.y, pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || toolMode === 'wand') return;
    const pt = getCanvasCoords(e.clientX, e.clientY);
    const prev = lastPointRef.current || pt;
    paintStroke(prev.x, prev.y, pt.x, pt.y);
    lastPointRef.current = pt;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleAutoMagic = () => {
    const canvas = canvasRef.current;
    const orig = originalDataRef.current;
    if (!canvas || !orig) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    pushHistory();
    runEdgeFloodCutout(ctx, canvas.width, canvas.height, tolerance, orig);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryCount(historyRef.current.length);
    ctx.putImageData(prev, 0, 0);
  };

  const handleResetOriginal = () => {
    const canvas = canvasRef.current;
    const orig = originalDataRef.current;
    if (!canvas || !orig) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    pushHistory();
    ctx.putImageData(orig, 0, 0);
  };

  const handleConfirmSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    try {
      const rawPng = canvas.toDataURL('image/png');
      const compressedPng = await compressImageForFirestore(rawPng, {
        preserveAlpha: true,
        maxDim: maxOutputDim,
        maxBytes
      });
      onApply(compressedPng);
      onClose();
    } catch {
      setErrorMsg('تعذر حفظ الصورة، حاول مرة أخرى');
    } finally {
      setIsSaving(false);
    }
  };

  const checkerStyle: React.CSSProperties =
    previewBg === 'checker'
      ? {
          backgroundImage:
            'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
          backgroundSize: '18px 18px',
          backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
          backgroundColor: '#ffffff'
        }
      : previewBg === 'dark'
      ? { backgroundColor: '#110620' }
      : { backgroundColor: '#ffffff' };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94dvh] text-gray-900">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFE600] text-black flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs text-gray-900">{title}</h3>
              <p className="text-[10px] text-gray-500">
                عزل الشخص تلقائياً + ممحاة يدوية لإزالة أي إضافات متبقية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="p-3 bg-gray-100 flex flex-col items-center justify-center relative min-h-[240px]">
          <div className="flex items-center justify-between w-full mb-2 text-[10px]">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-bold text-gray-600">خلفية المعاينة:</span>
              {(['checker', 'dark', 'light'] as const).map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setPreviewBg(bg)}
                  className={`px-2 py-0.5 rounded-full font-bold border ${
                    previewBg === bg
                      ? 'bg-[#FFE600] text-black border-amber-400'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {bg === 'checker' ? 'شفافة' : bg === 'dark' ? 'داكنة' : 'بيضاء'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyCount === 0}
                className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold flex items-center gap-1 disabled:opacity-40"
              >
                <Undo2 className="w-3 h-3" />
                <span>تراجع</span>
              </button>
              <button
                type="button"
                onClick={handleResetOriginal}
                className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>الأصل</span>
              </button>
            </div>
          </div>

          {errorMsg ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-2xl text-center">
              {errorMsg}
            </div>
          ) : (
            <div
              style={checkerStyle}
              className="rounded-2xl border-2 border-gray-200 overflow-hidden shadow-inner flex items-center justify-center max-h-[280px] w-full relative"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-bold text-gray-700 z-10">
                  جاري تحليل وعزل الخلفية...
                </div>
              )}
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="max-w-full max-h-[270px] object-contain touch-none cursor-crosshair"
              />
            </div>
          )}
        </div>

        {/* Tools Controls */}
        <div className="p-3.5 space-y-3 overflow-y-auto bg-white border-t border-gray-100">
          {/* 3 Editing Modes */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setToolMode('erase')}
              className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 border transition-all ${
                toolMode === 'erase'
                  ? 'bg-[#FFE600] text-black border-amber-400 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ممحاة الإضافات</span>
            </button>
            <button
              type="button"
              onClick={() => setToolMode('wand')}
              className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 border transition-all ${
                toolMode === 'wand'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>عصا سحرية بالنقر</span>
            </button>
            <button
              type="button"
              onClick={() => setToolMode('restore')}
              className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 border transition-all ${
                toolMode === 'restore'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>استعادة جزء</span>
            </button>
          </div>

          {/* Brush Size OR Magic Tolerance */}
          {toolMode === 'wand' ? (
            <div className="space-y-1.5 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                <span>حساسية العصا السحرية (اضغط على الخلفية لحذفها):</span>
                <span className="font-digits">{tolerance}</span>
              </div>
              <input
                type="range"
                min={10}
                max={85}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
          ) : (
            <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-800">
                <span>
                  {toolMode === 'erase'
                    ? 'حجم ممحاة الإضافات (مرّر إصبعك على أي زوائد لم تُحذف):'
                    : 'حجم فرشاة الاستعادة:'}
                </span>
                <span className="font-digits">{brushSize}px</span>
              </div>
              <input
                type="range"
                min={6}
                max={58}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAutoMagic}
              className="px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-black text-xs flex items-center gap-1.5 shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>إعادة القص التلقائي</span>
            </button>
            <button
              type="button"
              disabled={isLoading || isSaving || Boolean(errorMsg)}
              onClick={handleConfirmSave}
              className="flex-1 py-2.5 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الصورة المفرغة (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
