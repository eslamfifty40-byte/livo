import React, { useEffect, useState } from 'react';
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
  { left: '10%', delay: '0s', char: '✨' },
  { left: '22%', delay: '0.2s', char: '🌟' },
  { left: '38%', delay: '0.1s', char: '💫' },
  { left: '54%', delay: '0.32s', char: '✨' },
  { left: '72%', delay: '0.16s', char: '🔥' },
  { left: '88%', delay: '0.38s', char: '👑' }
];

function playLionRoarAudio() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(145, now);
    osc1.frequency.exponentialRampToValueAtTime(72, now + 0.55);
    osc1.frequency.exponentialRampToValueAtTime(52, now + 1.25);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(92, now);
    osc2.frequency.exponentialRampToValueAtTime(48, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, now);
    filter.frequency.exponentialRampToValueAtTime(210, now + 1.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.35);
    osc2.stop(now + 1.35);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Ignore autoplay restriction safely
  }
}

const RealisticRunningLionSVG: React.FC = () => (
  <svg
    viewBox="0 0 320 200"
    className="w-[290px] h-[185px] sm:w-[340px] sm:h-[210px] filter drop-shadow-[0_22px_36px_rgba(245,158,11,0.85)]"
    aria-label="الأسد الملكي"
  >
    <defs>
      <linearGradient id="lionFur" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="lionMane" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="55%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <radialGradient id="lionGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFE600" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ground golden speed aura */}
    <ellipse cx="160" cy="176" rx="118" ry="16" fill="url(#lionGlow)" />

    <g className="livo-lion-body">
      {/* Flowing Tail */}
      <g className="livo-lion-tail">
        <path
          d="M 88 102 C 55 88, 40 62, 26 70 C 18 75, 22 86, 30 82"
          fill="none"
          stroke="#d97706"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse cx="23" cy="78" rx="9" ry="7" fill="#78350f" />
      </g>

      {/* Far Back Leg */}
      <g className="livo-lion-leg-back">
        <path
          d="M 102 122 L 88 158 L 76 168"
          fill="none"
          stroke="#b45309"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="75" cy="170" rx="10" ry="5" fill="#92400e" />
      </g>

      {/* Far Front Leg */}
      <g className="livo-lion-leg-front">
        <path
          d="M 192 122 L 214 156 L 228 166"
          fill="none"
          stroke="#b45309"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="229" cy="167" rx="10" ry="5" fill="#92400e" />
      </g>

      {/* Muscular Torso */}
      <path
        d="M 86 105 C 88 80, 128 74, 175 78 C 206 81, 218 96, 212 118 C 205 134, 165 136, 125 132 C 95 129, 84 120, 86 105 Z"
        fill="url(#lionFur)"
      />
      {/* Belly highlight */}
      <path
        d="M 108 124 Q 150 135 190 123"
        fill="none"
        stroke="#fef3c7"
        strokeWidth="5"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />

      {/* Near Back Leg */}
      <g className="livo-lion-leg-front">
        <path
          d="M 104 118 L 116 154 L 106 168"
          fill="none"
          stroke="url(#lionFur)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="106" cy="170" rx="11" ry="6" fill="#d97706" />
      </g>

      {/* Near Front Leg */}
      <g className="livo-lion-leg-back">
        <path
          d="M 190 116 L 178 154 L 194 167"
          fill="none"
          stroke="url(#lionFur)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="195" cy="168" rx="11" ry="6" fill="#d97706" />
      </g>

      {/* Royal Layered Mane */}
      <path
        d="M 182 70 C 172 52, 190 36, 208 42 C 220 28, 244 32, 250 48 C 268 48, 278 66, 268 84 C 276 100, 260 118, 240 116 C 226 128, 202 126, 192 114 C 174 110, 170 86, 182 70 Z"
        fill="url(#lionMane)"
      />
      {/* Mane inner texture */}
      <circle cx="222" cy="78" r="34" fill="#92400e" opacity="0.55" />

      {/* Crown on Lion Head */}
      <path
        d="M 210 38 L 214 23 L 224 33 L 234 19 L 243 33 L 253 24 L 254 40 Z"
        fill="#FFE600"
        stroke="#fef08a"
        strokeWidth="2"
      />

      {/* Head & Face */}
      <ellipse cx="232" cy="78" rx="25" ry="22" fill="url(#lionFur)" />
      {/* Ear */}
      <circle cx="214" cy="57" r="7" fill="#d97706" />
      <circle cx="214" cy="57" r="3.5" fill="#78350f" />
      {/* Muzzle & Roaring Mouth */}
      <ellipse cx="250" cy="84" rx="14" ry="10" fill="#fef3c7" />
      <polygon points="256,77 265,80 258,85" fill="#451a03" />
      <path d="M 244 90 Q 254 96 262 88" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      {/* Fierce Golden Eye */}
      <ellipse cx="242" cy="72" rx="4" ry="3" fill="#1c1917" />
      <circle cx="243" cy="71" r="1.2" fill="#FFE600" />
    </g>
  </svg>
);

export const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({
  gift,
  senderName,
  recipientName,
  cardMessage,
  count = 1,
  onFinished
}) => {
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
    if (!gift) return;
    const isLion = gift.animationType === 'lion';
    const isCard = Boolean(gift.isCard || gift.animationType === 'card' || cardMessage?.trim());
    if (isLion) {
      playLionRoarAudio();
    }
    const baseMs = gift.durationMs || (isLion ? 4400 : isCard ? 3800 : 3000);
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
            ? 'bg-gradient-to-t from-amber-950/65 via-amber-800/20 to-[#170b2c]/55'
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

      {/* Prominent Top Sender / Recipient / Gift Banner */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#180829]/95 via-amber-900/95 to-[#180829]/95 border-2 border-[#FFE600] shadow-[0_12px_32px_rgba(245,158,11,0.55)] rounded-full px-5 py-2.5 flex items-center gap-3 max-w-[94%] animate-in fade-in zoom-in-95 duration-300">
        {gift.imageUrl && !imgBroken ? (
          <img
            src={gift.imageUrl}
            alt={gift.name}
            onError={() => setImgBroken(true)}
            className="w-9 h-9 object-contain shrink-0 drop-shadow"
          />
        ) : (
          <span className="text-2xl shrink-0">{gift.icon}</span>
        )}
        <div className="text-right min-w-0">
          <span className="text-xs text-[#FFE600] font-black block truncate">
            {senderName} {recipientName ? `← ${recipientName}` : 'أرسل هدية'}
          </span>
          <span className="text-xs text-white font-black block truncate">
            {gift.name} {count > 1 ? `×${count}` : ''}
          </span>
        </div>
        <span className="font-digits font-black text-black text-xs bg-[#FFE600] px-2.5 py-1 rounded-full shrink-0 shadow">
          +{totalCoins.toLocaleString()}
        </span>
      </div>

      {/* Mode 1: Realistic Animated Lion Running Full-Screen */}
      {isLion ? (
        <div className="absolute inset-x-0 bottom-20 flex flex-col items-center justify-center overflow-hidden">
          <div className="livo-lion-walk flex flex-col items-center">
            <RealisticRunningLionSVG />
            <div className="-mt-2 bg-gradient-to-r from-[#FFE600] via-amber-400 to-[#FFE600] text-black font-black text-xs px-5 py-1.5 rounded-full border-2 border-white shadow-2xl">
              🦁 {senderName} أهدى {gift.name} {recipientName ? `إلى ${recipientName}` : ''}{' '}
              {count > 1 ? `×${count}` : ''}
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
              {gift.imageUrl && !imgBroken ? (
                <img
                  src={gift.imageUrl}
                  alt={gift.name}
                  onError={() => setImgBroken(true)}
                  className="w-20 h-20 object-contain mb-2 drop-shadow-xl"
                />
              ) : (
                <span className="text-6xl mb-2 drop-shadow-[0_10px_20px_rgba(255,230,0,0.65)]">{gift.icon}</span>
              )}
              <span className="text-xs font-black text-[#FFE600] tracking-wide">
                💌 {gift.name} {count > 1 ? `×${count}` : ''}
              </span>
              <p className="text-xs text-purple-100 mt-0.5 font-bold">
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
        /* Mode 3: 3D Flying Animated Gift Trajectory Across Stage */
        <div
          style={{ transform: 'perspective(900px)' }}
          className={`relative livo-gift-fly flex flex-col items-center justify-center ${
            isVehicle || isRoyal ? 'scale-110' : ''
          }`}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-10 rounded-full bg-amber-400/30 blur-2xl animate-pulse" />
            {gift.imageUrl && !imgBroken ? (
              <img
                src={gift.imageUrl}
                alt={gift.name}
                onError={() => setImgBroken(true)}
                className="w-36 h-36 object-contain relative z-10 filter drop-shadow-[0_18px_32px_rgba(245,158,11,0.75)]"
              />
            ) : (
              <div className="text-[108px] leading-none relative z-10 filter drop-shadow-[0_18px_28px_rgba(245,158,11,0.75)]">
                {gift.icon}
              </div>
            )}
          </div>

          <div className="mt-2 bg-black/75 border border-[#FFE600]/60 text-white text-xs font-black px-4 py-1 rounded-full shadow-lg">
            {gift.name} {count > 1 ? `×${count}` : ''}
          </div>
        </div>
      )}
    </div>
  );
};
