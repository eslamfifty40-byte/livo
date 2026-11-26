import React from 'react';
import { LivoVerifiedBadge } from './LivoVerifiedBadge';
import { UserProfile, VerifiedBadgeColor, VerifiedBadgeShape } from '../../types';

interface UserNameWithBadgesProps {
  displayName: string;
  nameGlowColor?: UserProfile['nameGlowColor'];
  isVerified?: boolean;
  verifiedBadgeColor?: VerifiedBadgeColor;
  verifiedBadgeShape?: VerifiedBadgeShape;
  verifiedBadgeGlow?: boolean;
  customIconUrl?: string;
  customIconGlow?: string;
  customIconAnimated?: boolean;
  customIconLabel?: string;
  agencyLabel?: string;
  agencyLabelBelow?: boolean;
  badgeSize?: number;
  iconSize?: number;
  nameClassName?: string;
  className?: string;
  truncate?: boolean;
}

const getNeonIconFilter = (glow?: string) => {
  if (!glow || glow === 'none') {
    return 'drop-shadow(0 0 5px rgba(250, 204, 21, 0.72)) drop-shadow(0 0 11px rgba(250, 204, 21, 0.42))';
  }
  return `drop-shadow(0 0 4px ${glow}) drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 16px ${glow})`;
};

export const UserNameWithBadges: React.FC<UserNameWithBadgesProps> = ({
  displayName,
  nameGlowColor,
  isVerified,
  verifiedBadgeColor = 'blue',
  verifiedBadgeShape = 'rosette',
  verifiedBadgeGlow = true,
  customIconUrl,
  customIconGlow,
  customIconAnimated = true,
  customIconLabel,
  agencyLabel,
  agencyLabelBelow = false,
  badgeSize = 15,
  iconSize = 19,
  nameClassName = '',
  className = '',
  truncate = true
}) => {
  const glowClass =
    nameGlowColor && nameGlowColor !== 'none' ? `name-glow-${nameGlowColor}` : '';

  const row = (
    <span className={`inline-flex items-center gap-1 min-w-0 max-w-full align-middle ${className}`}>
      <span className={`${truncate ? 'truncate' : ''} ${glowClass} ${nameClassName}`}>
        {displayName}
      </span>

      {customIconUrl && customIconUrl.trim().length > 0 && (
        <span
          className={`inline-flex items-center justify-center shrink-0 select-none ${
            customIconAnimated ? 'livo-flutter' : 'livo-neon-icon'
          }`}
          title={customIconLabel || 'أيقونة مخصصة بإضاءة نيون'}
          style={{
            width: iconSize,
            height: iconSize,
            filter: getNeonIconFilter(customIconGlow)
          }}
        >
          <img
            src={customIconUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        </span>
      )}

      {isVerified && (
        <LivoVerifiedBadge
          size={badgeSize}
          color={verifiedBadgeColor}
          shape={verifiedBadgeShape}
          glow={verifiedBadgeGlow !== false}
        />
      )}

      {agencyLabel && !agencyLabelBelow && (
        <span
          className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-black shrink-0 border ${
            agencyLabel.includes('شحن')
              ? 'bg-amber-400/90 text-black border-amber-500'
              : 'bg-purple-700/90 text-white border-purple-400'
          }`}
        >
          {agencyLabel}
        </span>
      )}
    </span>
  );

  if (agencyLabel && agencyLabelBelow) {
    return (
      <span className="inline-flex flex-col items-start min-w-0 max-w-full">
        {row}
        <span
          className={`mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-black leading-tight border ${
            agencyLabel.includes('شحن')
              ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-amber-500/80 shadow-2xs'
              : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-purple-400/70 shadow-2xs'
          }`}
        >
          {agencyLabel.includes('شحن') ? '⚡ ' : '🎙️ '}
          {agencyLabel}
        </span>
      </span>
    );
  }

  return row;
};
