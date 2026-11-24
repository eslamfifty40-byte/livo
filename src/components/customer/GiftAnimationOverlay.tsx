import React, { useEffect } from 'react';
import { GiftItem } from '../../types';

interface GiftAnimationOverlayProps {
  gift: GiftItem | null;
  senderName: string;
  recipientName?: string;
  cardMessage?: string;
  count?: number;
  onFinished: () => void;
}

const SPARKLES = [
  { left: '12%', delay: '0s', char: '✨' },
  { left: '26%', delay: '0.25s', char: '🌟' },
  { left: '44%', delay: '0.1s', char: '💫' },
  { left: '62%', delay: '0.35s', char: '✨' },
  { left: '78%', delay: '0.18s', char: '🔥' },
  { left: '89%', delay: '0.4s', char: '🎉' }
];

export const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({
  gift,
  senderName,
  recipientName,
  cardMessage,
  count = 1,
  onFinished
}) => {
  useEffect(() => {
    if (!gift) return;
    const isLion = gift.animationType === 'lion';
    const isCard = Boolean(gift.isCard || gift.animationType === 'card' || cardMessage?.trim());
    const baseMs = gift.durationMs || (isLion ? 3800 : isCard ? 3800 : 3000);
    const timer = setTimeout(() => {
      onFinished();
    }, baseMs);
    return () => clearTimeout(timer);
  }, [gift, cardMessage, onFinished]);

  if (!gift) return null;

  const totalCoins = (gift.coins || 0) * Math.max(1, count);
  const isLion = gift.animationType === 'lion';
  const isCard = Boolean(gift.isCard || gift.animationType === 'card' || cardMessage?.trim());
  const isVehicle = gift.animationType === 'car' || gift.animationType === 'ship' || gift.animationType === 'rocket';
  const isRoyal = gift.animationType === 'castle' || gift.animationType === 'crown' || gift.animationType === 'dragon';

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden select-none">
      {/* Dynamic Royal Ambient Backdrop */}
      <div
        className={`absolute inset-0 animate-pulse ${
          isLion
            ? 'bg-gradient-to-t from-amber-950/55 via-amber-800/15 to-[#170b2c]/45'
            : isCard
            ? 'bg-gradient-to-t from-pink-950/45 via-purple-900/20 to-[#170b2c]/45'
            : isRoyal
            ? 'bg-gradient-to-t from-purple-950/50 via-amber-900/20 to-[#170b2c]/45'
            : 'bg-gradient-to-t from-purple-950/35 via-amber-950/15 to-purple-950/35'
        }`}
      />

      {/* Floating Sparkle Particles */}
      {SPARKLES.map((sp, i) => (
        <span
          key={i}
          style={{ left: sp.left, bottom: '18%', animationDelay: sp.delay }}
          className="absolute text-2xl livo-gift-sparkle drop-shadow-[0_0_10px_rgba(250,204,21,0.95)]"
        >
          {sp.char}
        </span>
      ))}

      {/* Top Gift Announcement Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#180829]/95 via-amber-900/95 to-[#180829]/95 border border-amber-400/80 shadow-[0_10px_30px_rgba(245,158,11,0.5)] rounded-full px-5 py-2 flex items-center gap-3 max-w-[92%] animate-in fade-in zoom-in-95 duration-300">
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

      {/* Mode 1: Walking Lion Across Screen */}
      {isLion ? (
        <div className="absolute inset-x-0 bottom-28 flex items-center justify-center overflow-hidden">
          <div className="livo-lion-walk flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-10 rounded-full bg-amber-400/35 blur-2xl animate-pulse" />
              {gift.imageUrl ? (
                <img
                  src={gift.imageUrl}
                  alt={gift.name}
                  className="w-44 h-44 object-contain relative z-10 filter drop-shadow-[0_20px_35px_rgba(245,158,11,0.85)]"
                />
              ) : (
                <div className="text-[132px] leading-none relative z-10 filter drop-shadow-[0_20px_32px_rgba(245,158,11,0.9)]">
                  {gift.icon}
                </div>
              )}
            </div>
            <div className="mt-1 bg-gradient-to-r from-[#FFE600] via-amber-400 to-[#FFE600] text-black font-black text-xs px-4 py-1 rounded-full border-2 border-white shadow-2xl">
              🦁 {gift.name} {count > 1 ? `×${count}` : ''}
            </div>
          </div>
        </div>
      ) : isCard ? (
        /* Mode 2: Writable Greeting Gift Card with Written Dedication */
        <div className="livo-gift-card-pop relative w-[86%] max-w-[330px] rounded-3xl p-[2px] bg-gradient-to-br from-[#FFE600] via-pink-500 to-purple-500 shadow-[0_20px_50px_rgba(236,72,153,0.55)]">
          <div className="rounded-[22px] bg-gradient-to-b from-[#230e3d]/95 via-[#170b2c]/95 to-[#2b1047]/95 p-5 text-center text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-[#FFE600]/20 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-pink-500/20 blur-2xl" />
            <div className="relative z-10 flex flex-col items-center">
              {gift.imageUrl ? (
                <img src={gift.imageUrl} alt={gift.name} className="w-20 h-20 object-contain mb-2 drop-shadow-xl" />
              ) : (
                <span className="text-6xl mb-2 drop-shadow-[0_10px_20px_rgba(255,230,0,0.65)]">{gift.icon}</span>
              )}
              <span className="text-[11px] font-black text-[#FFE600] tracking-wide">
                💌 {gift.name} {count > 1 ? `×${count}` : ''}
              </span>
              <p className="text-[11px] text-purple-200 mt-0.5 font-bold">
                من {senderName} {recipientName ? `إلى ${recipientName}` : ''}
              </p>

              <div className="mt-3 w-full bg-white/10 border border-[#FFE600]/45 rounded-2xl px-3.5 py-3 shadow-inner">
                <p className="text-sm font-black text-white leading-relaxed break-words">
                  “{cardMessage?.trim() || 'أجمل تحية وإهداء ملكي داخل LIVO ✨'}”
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 3: Flying Animated Gift Trajectory Across Stage */
        <div className={`relative livo-gift-fly flex flex-col items-center justify-center ${isVehicle ? 'scale-110' : ''}`}>
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
      )}
    </div>
  );
};
