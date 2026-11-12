import React, { useEffect } from 'react';
import { GiftItem } from '../../types';

interface GiftAnimationOverlayProps {
  gift: GiftItem | null;
  senderName: string;
  onFinished: () => void;
}

export const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({
  gift,
  senderName,
  onFinished
}) => {
  useEffect(() => {
    if (gift) {
      const timer = setTimeout(() => {
        onFinished();
      }, gift.durationMs || 3000);
      return () => clearTimeout(timer);
    }
  }, [gift, onFinished]);

  if (!gift) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* Background Dim & Glow */}
      <div className="absolute inset-0 bg-purple-950/20 backdrop-blur-[1px] animate-pulse" />

      {/* Gift Card Banner */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-900/90 via-amber-900/90 to-purple-900/90 border border-amber-400/60 shadow-2xl rounded-full px-6 py-2 flex items-center gap-3 animate-bounce">
        <span className="text-2xl">{gift.icon}</span>
        <div className="text-center">
          <span className="text-xs text-amber-300 font-bold block">{senderName} أرسل هدية</span>
          <span className="text-sm text-white font-extrabold">{gift.name}</span>
        </div>
        <span className="font-digits font-black text-amber-400 text-xs bg-black/40 px-2 py-0.5 rounded-full">
          +{gift.coins.toLocaleString()}
        </span>
      </div>

      {/* Main Animated Creature / Object */}
      <div className="relative transform transition-all animate-in zoom-in-50 duration-500 scale-125">
        <div className="text-9xl filter drop-shadow-[0_15px_25px_rgba(245,158,11,0.6)] animate-pulse">
          {gift.icon}
        </div>
      </div>
    </div>
  );
};
