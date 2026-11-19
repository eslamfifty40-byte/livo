import React, { useEffect } from 'react';
import { GiftItem } from '../../types';

interface GiftAnimationOverlayProps {
  gift: GiftItem | null;
  senderName: string;
  recipientName?: string;
  count?: number;
  onFinished: () => void;
}

const SPARKLES = [
  { left: '15%', delay: '0s', char: '✨' },
  { left: '30%', delay: '0.25s', char: '🌟' },
  { left: '48%', delay: '0.1s', char: '💫' },
  { left: '66%', delay: '0.35s', char: '✨' },
  { left: '82%', delay: '0.18s', char: '🔥' }
];

export const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({
  gift,
  senderName,
  recipientName,
  count = 1,
  onFinished
}) => {
  useEffect(() => {
    if (gift) {
      const timer = setTimeout(() => {
        onFinished();
      }, gift.durationMs || 3200);
      return () => clearTimeout(timer);
    }
  }, [gift, onFinished]);

  if (!gift) return null;

  const totalCoins = (gift.coins || 0) * Math.max(1, count);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden select-none">
      {/* Subtle Royal Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/35 via-amber-950/15 to-purple-950/35 animate-pulse" />

      {/* Floating Sparkle Particles */}
      {SPARKLES.map((sp, i) => (
        <span
          key={i}
          style={{ left: sp.left, bottom: '18%', animationDelay: sp.delay }}
          className="absolute text-2xl livo-gift-sparkle drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]"
        >
          {sp.char}
        </span>
      ))}

      {/* Top Gift Announcement Banner */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#180829]/95 via-amber-900/95 to-[#180829]/95 border border-amber-400/75 shadow-[0_10px_30px_rgba(245,158,11,0.45)] rounded-full px-5 py-2 flex items-center gap-3 max-w-[92%] animate-in fade-in zoom-in-95 duration-300">
        {gift.imageUrl ? (
          <img src={gift.imageUrl} alt={gift.name} className="w-8 h-8 object-contain shrink-0 drop-shadow" />
        ) : (
          <span className="text-2xl shrink-0">{gift.icon}</span>
        )}
        <div className="text-right min-w-0">
          <span className="text-[11px] text-amber-300 font-bold block truncate">
            {senderName} {recipientName ? `← ${recipientName}` : 'أرسل هدية'}
          </span>
          <span className="text-xs text-white font-black block truncate">
            {gift.name} {count > 1 ? `×${count}` : ''}
          </span>
        </div>
        <span className="font-digits font-black text-black text-[11px] bg-[#FFE600] px-2.5 py-0.5 rounded-full shrink-0 shadow">
          +{totalCoins.toLocaleString()}
        </span>
      </div>

      {/* Flying Animated Gift Trajectory Across Stage */}
      <div className="relative livo-gift-fly flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-8 rounded-full bg-amber-400/25 blur-2xl animate-pulse" />
          {gift.imageUrl ? (
            <img
              src={gift.imageUrl}
              alt={gift.name}
              className="w-36 h-36 object-contain relative z-10 filter drop-shadow-[0_18px_32px_rgba(245,158,11,0.75)]"
            />
          ) : (
            <div className="text-[108px] leading-none relative z-10 filter drop-shadow-[0_18px_28px_rgba(245,158,11,0.75)]">
              {gift.icon}
            </div>
          )}
        </div>

        {count > 1 && (
          <div className="mt-2 bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-digits font-black text-lg px-4 py-0.5 rounded-full border-2 border-white shadow-xl">
            ×{count}
          </div>
        )}
      </div>
    </div>
  );
};
