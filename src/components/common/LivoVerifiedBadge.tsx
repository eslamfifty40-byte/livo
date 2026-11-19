import React from 'react';

export type VerifiedBadgeColor = 'blue' | 'gold' | 'crimson' | 'emerald' | 'purple' | 'cyan';
export type VerifiedBadgeShape = 'rosette' | 'crown' | 'shield' | 'diamond';

const COLOR_MAP: Record<VerifiedBadgeColor, { fill: string; secondary: string; glow: string }> = {
  blue: { fill: '#1D9BF0', secondary: '#0C7ABF', glow: 'rgba(29, 155, 240, 0.85)' },
  gold: { fill: '#F59E0B', secondary: '#D97706', glow: 'rgba(245, 158, 11, 0.88)' },
  crimson: { fill: '#EF4444', secondary: '#B91C1C', glow: 'rgba(239, 68, 68, 0.88)' },
  emerald: { fill: '#10B981', secondary: '#047857', glow: 'rgba(16, 185, 129, 0.85)' },
  purple: { fill: '#9333EA', secondary: '#6B21A8', glow: 'rgba(168, 85, 247, 0.88)' },
  cyan: { fill: '#06B6D4', secondary: '#0E7490', glow: 'rgba(6, 182, 212, 0.88)' }
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
  const palette = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none align-middle ${className}`}
      title={title}
      style={{
        width: size,
        height: size,
        filter: glow ? `drop-shadow(0 0 5px ${palette.glow})` : undefined
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {shape === 'rosette' && (
          <>
            <path
              d="M12 1L14.39 3.16L17.58 2.82L18.89 5.75L21.93 6.78L21.94 10L23.95 12L21.94 14L21.93 17.22L18.89 18.25L17.58 21.18L14.39 20.84L12 23L9.61 20.84L6.42 21.18L5.11 18.25L2.07 17.22L2.06 14L0.05 12L2.06 10L2.07 6.78L5.11 5.75L6.42 2.82L9.61 3.16L12 1Z"
              fill={palette.fill}
            />
            <path
              d="M9.8 16.2L6.3 12.7L7.7 11.3L9.8 13.4L16.3 6.9L17.7 8.3L9.8 16.2Z"
              fill="white"
            />
          </>
        )}

        {shape === 'shield' && (
          <>
            <path
              d="M12 1.5L3.5 5.2V11.3C3.5 16.6 7.1 21.4 12 22.8C16.9 21.4 20.5 16.6 20.5 11.3V5.2L12 1.5Z"
              fill={palette.fill}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
            <path
              d="M10.2 15.6L6.9 12.3L8.3 10.9L10.2 12.8L15.7 7.3L17.1 8.7L10.2 15.6Z"
              fill="white"
            />
          </>
        )}

        {shape === 'crown' && (
          <>
            <path
              d="M3 18.5H21L22 7.5L17 11.5L12 4.5L7 11.5L2 7.5L3 18.5Z"
              fill={palette.fill}
              stroke={palette.secondary}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <rect x="4" y="19.5" width="16" height="2.2" rx="1.1" fill={palette.secondary} />
            <circle cx="12" cy="13.5" r="1.6" fill="white" />
          </>
        )}

        {shape === 'diamond' && (
          <>
            <path
              d="M12 1.5L22.5 12L12 22.5L1.5 12L12 1.5Z"
              fill={palette.fill}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
            <path
              d="M10.1 15.6L6.8 12.3L8.2 10.9L10.1 12.8L15.8 7.1L17.2 8.5L10.1 15.6Z"
              fill="white"
            />
          </>
        )}
      </svg>
    </span>
  );
};
