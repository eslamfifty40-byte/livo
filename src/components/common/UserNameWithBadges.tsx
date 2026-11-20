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
  badgeSize = 15,
  iconSize = 19,
  nameClassName = '',
  className = '',
  truncate = true
}) => {
  const glowClass =
    nameGlowColor && nameGlowColor !== 'none' ? `name-glow-${nameGlowColor}` : '';

  return (
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
    </span>
  );
};
