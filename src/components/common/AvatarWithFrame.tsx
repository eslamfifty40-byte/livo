import React from 'react';

interface AvatarWithFrameProps {
  avatarUrl?: string;
  displayName?: string;
  frameUrl?: string;
  frameGlowColor?: string;
  frameAnimated?: boolean;
  customIconUrl?: string;
  customIconGlow?: string;
  customIconAnimated?: boolean;
  sizePx?: number;
  className?: string;
  showOnlineDot?: boolean;
  onClick?: () => void;
}

/**
 * Shared Avatar + Royal Transparent PNG Frame + Outer Glow + Fan-Flutter Animation
 * Centers the circular user avatar precisely inside the frame's inner ring without clipping.
 */
export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  displayName = 'LIVO',
  frameUrl,
  frameGlowColor,
  frameAnimated = false,
  customIconUrl,
  customIconGlow,
  customIconAnimated = true,
  sizePx = 64,
  className = '',
  showOnlineDot = false,
  onClick
}) => {
  const hasFrame = Boolean(frameUrl && frameUrl.trim().length > 0);
  // Inner avatar occupies ~64% of the frame canvas so crowns, wings, and side lions surround cleanly
  const innerSize = hasFrame ? Math.round(sizePx * 0.64) : sizePx;
  const glowStyle =
    frameGlowColor && frameGlowColor !== 'none'
      ? `drop-shadow(0 0 ${Math.max(5, Math.round(sizePx * 0.11))}px ${frameGlowColor}) drop-shadow(0 0 ${Math.max(10, Math.round(sizePx * 0.18))}px ${frameGlowColor})`
      : undefined;

  const iconGlowStyle =
    customIconGlow && customIconGlow !== 'none'
      ? `drop-shadow(0 0 5px ${customIconGlow}) drop-shadow(0 0 11px ${customIconGlow})`
      : 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))';

  const iconBadgeSize = Math.max(20, Math.round(sizePx * 0.36));

  return (
    <div
      onClick={onClick}
      style={{ width: sizePx, height: sizePx }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Centered Circular Avatar */}
      <img
        src={avatarUrl || '/assets/livo/customer_icon.jpg'}
        alt={displayName}
        referrerPolicy="no-referrer"
        style={{ width: innerSize, height: innerSize }}
        className={`rounded-full object-cover ${
          hasFrame ? 'ring-1 ring-white/40' : 'border-2 border-white shadow-sm'
        }`}
      />

      {/* Transparent Royal Frame Overlay with Outer Glow & Optional Fan-Flutter */}
      {hasFrame && (
        <img
          src={frameUrl}
          alt=""
          referrerPolicy="no-referrer"
          style={glowStyle ? { filter: glowStyle } : undefined}
          className={`pointer-events-none absolute inset-0 w-full h-full object-contain z-10 ${
            frameAnimated ? 'livo-flutter' : ''
          }`}
        />
      )}

      {/* Optional Admin-Assigned Custom Fluttering Transparent Icon */}
      {customIconUrl && (
        <img
          src={customIconUrl}
          alt=""
          referrerPolicy="no-referrer"
          style={{
            width: iconBadgeSize,
            height: iconBadgeSize,
            filter: iconGlowStyle
          }}
          className={`pointer-events-none absolute -bottom-1 -left-1 object-contain z-20 ${
            customIconAnimated ? 'livo-flutter' : ''
          }`}
        />
      )}

      {showOnlineDot && (
        <span className="absolute bottom-0.5 right-0.5 z-20 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
      )}
    </div>
  );
};
