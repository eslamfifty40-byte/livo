import React, { useId } from 'react';
import { VerifiedBadgeColor, VerifiedBadgeShape } from '../../types';

export type { VerifiedBadgeColor, VerifiedBadgeShape };

export const VERIFIED_BADGE_COLORS: {
  id: VerifiedBadgeColor;
  label: string;
  hex: string;
  glow: string;
}[] = [
  { id: 'blue', label: 'أزرق ملكي', hex: '#1D9BF0', glow: 'rgba(29, 155, 240, 0.92)' },
  { id: 'gold', label: 'ذهبي VIP', hex: '#F59E0B', glow: 'rgba(245, 158, 11, 0.92)' },
  { id: 'crimson', label: 'أحمر قرمزي', hex: '#EF4444', glow: 'rgba(239, 68, 68, 0.92)' },
  { id: 'emerald', label: 'زمردي', hex: '#10B981', glow: 'rgba(16, 185, 129, 0.92)' },
  { id: 'purple', label: 'أرجواني ملكي', hex: '#9333EA', glow: 'rgba(168, 85, 247, 0.92)' },
  { id: 'cyan', label: 'سماوي نيون', hex: '#06B6D4', glow: 'rgba(6, 182, 212, 0.94)' },
  { id: 'pink', label: 'وردي نيون', hex: '#EC4899', glow: 'rgba(236, 72, 153, 0.94)' },
  { id: 'orange', label: 'برتقالي ناري', hex: '#F97316', glow: 'rgba(249, 115, 22, 0.92)' },
  { id: 'lime', label: 'أخضر نيون', hex: '#84CC16', glow: 'rgba(132, 204, 22, 0.92)' },
  { id: 'indigo', label: 'نيلي ساطع', hex: '#6366F1', glow: 'rgba(99, 102, 241, 0.94)' },
  { id: 'silver', label: 'فضي بلاتيني', hex: '#CBD5E1', glow: 'rgba(226, 232, 240, 0.95)' },
  { id: 'rainbow', label: 'طيف نيون', hex: '#F472B6', glow: 'rgba(244, 114, 182, 0.95)' }
];

const COLOR_MAP: Record<VerifiedBadgeColor, { fill: string; secondary: string; glow: string }> = {
  blue: { fill: '#1D9BF0', secondary: '#0C7ABF', glow: 'rgba(29, 155, 240, 0.92)' },
  gold: { fill: '#F59E0B', secondary: '#D97706', glow: 'rgba(245, 158, 11, 0.94)' },
  crimson: { fill: '#EF4444', secondary: '#B91C1C', glow: 'rgba(239, 68, 68, 0.92)' },
  emerald: { fill: '#10B981', secondary: '#047857', glow: 'rgba(16, 185, 129, 0.92)' },
  purple: { fill: '#9333EA', secondary: '#6B21A8', glow: 'rgba(168, 85, 247, 0.94)' },
  cyan: { fill: '#06B6D4', secondary: '#0E7490', glow: 'rgba(6, 182, 212, 0.94)' },
  pink: { fill: '#EC4899', secondary: '#BE185D', glow: 'rgba(236, 72, 153, 0.94)' },
  orange: { fill: '#F97316', secondary: '#C2410C', glow: 'rgba(249, 115, 22, 0.92)' },
  lime: { fill: '#84CC16', secondary: '#4D7C0F', glow: 'rgba(132, 204, 22, 0.92)' },
  indigo: { fill: '#6366F1', secondary: '#4338CA', glow: 'rgba(99, 102, 241, 0.94)' },
  silver: { fill: '#E2E8F0', secondary: '#64748B', glow: 'rgba(226, 232, 240, 0.96)' },
  rainbow: { fill: '#F472B6', secondary: '#7C3AED', glow: 'rgba(244, 114, 182, 0.95)' }
};

interface LivoVerifiedBadgeProps {
  size?: number;
  className?: string;
  title?: string;
  color?: VerifiedBadgeColor;
  shape?: VerifiedBadgeShape;
  glow?: boolean;
}

export const LivoVerifiedBadge: React.FC<LivoVerifiedBadgeProps> = ({
  size = 16,
  className = '',
  title = 'حساب موثق رسمياً',
  color = 'blue',
  shape = 'rosette',
  glow = true
}) => {
  const uid = useId().replace(/:/g, '');
  const palette = COLOR_MAP[color] || COLOR_MAP.blue;
  const isRainbow = color === 'rainbow';
  const isSilver = color === 'silver';
  const fillVal = isRainbow
    ? `url(#livoRainbow_${uid})`
    : isSilver
    ? `url(#livoSilver_${uid})`
    : palette.fill;

  const filterValue = glow
    ? `drop-shadow(0 0 4px ${palette.glow}) drop-shadow(0 0 9px ${palette.glow})`
    : undefined;

  const checkColor = isSilver ? '#0F172A' : '#FFFFFF';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none align-middle ${className}`}
      title={title}
      style={{
        width: size,
        height: size,
        filter: filterValue
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`livoRainbow_${uid}`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="35%" stopColor="#EC4899" />
            <stop offset="70%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id={`livoSilver_${uid}`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        {shape === 'rosette' && (
          <>
            <path
              d="M12 1L14.39 3.16L17.58 2.82L18.89 5.75L21.93 6.78L21.94 10L23.95 12L21.94 14L21.93 17.22L18.89 18.25L17.58 21.18L14.39 20.84L12 23L9.61 20.84L6.42 21.18L5.11 18.25L2.07 17.22L2.06 14L0.05 12L2.06 10L2.07 6.78L5.11 5.75L6.42 2.82L9.61 3.16L12 1Z"
              fill={fillVal}
            />
            <path
              d="M9.8 16.2L6.3 12.7L7.7 11.3L9.8 13.4L16.3 6.9L17.7 8.3L9.8 16.2Z"
              fill={checkColor}
            />
          </>
        )}

        {shape === 'shield' && (
          <>
            <path
              d="M12 1.5L3.5 5.2V11.3C3.5 16.6 7.1 21.4 12 22.8C16.9 21.4 20.5 16.6 20.5 11.3V5.2L12 1.5Z"
              fill={fillVal}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
            <path
              d="M10.2 15.6L6.9 12.3L8.3 10.9L10.2 12.8L15.7 7.3L17.1 8.7L10.2 15.6Z"
              fill={checkColor}
            />
          </>
        )}

        {shape === 'crown' && (
          <>
            <path
              d="M3 18.5H21L22 7.5L17 11.5L12 4.5L7 11.5L2 7.5L3 18.5Z"
              fill={fillVal}
              stroke={palette.secondary}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <rect x="4" y="19.5" width="16" height="2.2" rx="1.1" fill={palette.secondary} />
            <circle cx="12" cy="13.5" r="1.6" fill={checkColor} />
          </>
        )}

        {shape === 'diamond' && (
          <>
            <path
              d="M12 1.5L22.5 12L12 22.5L1.5 12L12 1.5Z"
              fill={fillVal}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
            <path
              d="M10.1 15.6L6.8 12.3L8.2 10.9L10.1 12.8L15.8 7.1L17.2 8.5L10.1 15.6Z"
              fill={checkColor}
            />
          </>
        )}
      </svg>
    </span>
  );
};
