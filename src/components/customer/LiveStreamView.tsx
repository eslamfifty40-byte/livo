import React, { useState, useEffect } from 'react';
import {
  Users,
  Flame,
  Gift,
  Send,
  Trophy,
  Swords,
  RotateCcw,
  Volume2,
  Heart,
  Crown
} from 'lucide-react';
import { UserProfile, GiftItem, StreamSupporter } from '../../types';
import { INITIAL_GIFTS } from '../../data/initialData';
import { livoStore } from '../../services/livoStore';
import { GiftAnimationOverlay } from './GiftAnimationOverlay';

interface LiveStreamViewProps {
  currentUser: UserProfile;
  onOpenRecharge: () => void;
}

interface PKState {
  isActive: boolean;
  challenger1Coins: number;
  challenger2Coins: number;
  secondsRemaining: number;
  winner: 'host' | 'guest' | 'draw' | null;
  roundNumber: number;
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({ currentUser, onOpenRecharge }) => {
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftItem | null>(null);
  const [lastSenderName, setLastSenderName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; isGift?: boolean }>>([
    { id: '1', user: 'أحمد شاهين', text: 'منورين يا شباب! لايف ناري الليلة 🔥' },
    { id: '2', user: 'سارة نور', text: 'يلا التحدي بدأ شدوا حيلكم يا جيش الليدر 💪' },
    { id: '3', user: 'طارق المصري', text: 'تم إرسال الدعم للطرفين بالتوفيق 🚀' },
  ]);

  // PK Challenge State (Default 5 minutes = 300 seconds)
  const [pk, setPk] = useState<PKState>({
    isActive: true,
    challenger1Coins: 4200,
    challenger2Coins: 3800,
    secondsRemaining: 215, // ongoing in countdown
    winner: null,
    roundNumber: 1
  });

  // Top 3 Real Supporters
  const [topSupporters, setTopSupporters] = useState<StreamSupporter[]>([
    {
      rank: 1,
      uid: '10247',
      username: 'tariq_agency',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      supportedCoins: 5000
    },
    {
      rank: 2,
      uid: '10245',
      username: 'ahmed_king',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      supportedCoins: 2200
    },
    {
      rank: 3,
      uid: '10246',
      username: 'sara_live',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      supportedCoins: 800
    }
  ]);

  // PK Timer Countdown
  useEffect(() => {
    let timer: any;
    if (pk.isActive && pk.secondsRemaining > 0) {
      timer = setInterval(() => {
        setPk(prev => {
          if (prev.secondsRemaining <= 1) {
            let win: 'host' | 'guest' | 'draw' = 'draw';
            if (prev.challenger1Coins > prev.challenger2Coins) win = 'host';
            else if (prev.challenger2Coins > prev.challenger1Coins) win = 'guest';

            return {
              ...prev,
              secondsRemaining: 0,
              isActive: false,
              winner: win
            };
          }
          return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pk.isActive, pk.secondsRemaining]);

  // Start New PK Challenge without leaving live stream
  const handleStartNewPK = () => {
    setPk({
      isActive: true,
      challenger1Coins: 0,
      challenger2Coins: 0,
      secondsRemaining: 300, // 5 minutes fresh round
      winner: null,
      roundNumber: pk.roundNumber + 1
    });

    setComments(prev => [
      ...prev,
      { id: String(Date.now()), user: 'نظام LIVO', text: `⚔️ انطلق التحدي الجديد الجولة #${pk.roundNumber + 1}! أظهروا دعمكم!` }
    ]);
  };

  // Calculate PK Bar percentage (starts 50/50 when both 0 or equal)
  const totalPKCoins = pk.challenger1Coins + pk.challenger2Coins;
  let challenger1Percent = 50;
  let challenger2Percent = 50;

  if (totalPKCoins > 0) {
    challenger1Percent = Math.round((pk.challenger1Coins / totalPKCoins) * 100);
    challenger2Percent = 100 - challenger1Percent;
  }

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Send Gift Handler
  const handleSendGift = (gift: GiftItem, targetChallenger: 1 | 2 = 1) => {
    if (currentUser.coins < gift.coins) {
      alert('رصيدك من الكوينز غير كافٍ. يرجى الشحن أولاً!');
      onOpenRecharge();
      return;
    }

    // Deduct coins from user
    const newCoins = currentUser.coins - gift.coins;
    livoStore.updateUserProfile(currentUser.uid, { coins: newCoins });

    // Update PK Challenge points
    setPk(prev => ({
      ...prev,
      challenger1Coins: targetChallenger === 1 ? prev.challenger1Coins + gift.coins : prev.challenger1Coins,
      challenger2Coins: targetChallenger === 2 ? prev.challenger2Coins + gift.coins : prev.challenger2Coins
    }));

    // Update Top Supporters
    setTopSupporters(prev => {
      const existing = prev.find(s => s.uid === currentUser.uid);
      let updated: StreamSupporter[];
      if (existing) {
        updated = prev.map(s => s.uid === currentUser.uid ? { ...s, supportedCoins: s.supportedCoins + gift.coins } : s);
      } else {
        updated = [...prev, {
          rank: 3,
          uid: currentUser.uid,
          username: currentUser.username,
          avatar: currentUser.avatar,
          supportedCoins: gift.coins
        }];
      }
      return updated
        .sort((a, b) => b.supportedCoins - a.supportedCoins)
        .slice(0, 3)
        .map((s, idx) => ({ ...s, rank: (idx + 1) as 1 | 2 | 3 }));
    });

    // Add live comment
    setComments(prev => [
      ...prev,
      { id: String(Date.now()), user: currentUser.displayName, text: `أرسل ${gift.name} (${gift.icon}) لدعم التحدي!`, isGift: true }
    ]);

    // Trigger Animated Overlay
    setLastSenderName(currentUser.displayName);
    setActiveGiftAnimation(gift);
    setShowGiftModal(false);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setComments(prev => [
      ...prev,
      { id: String(Date.now()), user: currentUser.displayName, text: commentText.trim() }
    ]);
    setCommentText('');
  };

  return (
    <div className="relative w-full h-[620px] bg-[#0c0517] overflow-hidden flex flex-col justify-between text-white rounded-2xl border border-purple-900/50 shadow-2xl">
      
      {/* Gift Animation Overlay */}
      <GiftAnimationOverlay
        gift={activeGiftAnimation}
        senderName={lastSenderName}
        onFinished={() => setActiveGiftAnimation(null)}
      />

      {/* Top Stream Header: Streamer Info & Top 3 Supporters */}
      <div className="relative z-20 p-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Streamer Profile Pill */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-purple-600/40">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
              alt="Host"
              className="w-8 h-8 rounded-full border border-amber-400"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border border-white flex items-center justify-center text-[8px] font-bold">
              ●
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white">LIVO Official</span>
              <span className="text-[10px] text-amber-300">★</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-purple-300">
              <Users className="w-3 h-3 text-purple-400" />
              <span className="font-digits">1,482</span>
            </div>
          </div>
        </div>

        {/* Top 3 Supporters with Ranks 1, 2, 3 */}
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-purple-800/40">
          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex items-center -space-x-1 space-x-reverse">
            {topSupporters.map(supporter => (
              <div
                key={supporter.uid}
                className="relative group cursor-pointer"
                title={`${supporter.username} (دعم: ${supporter.supportedCoins.toLocaleString()} كوينز)`}
              >
                <img
                  src={supporter.avatar}
                  alt={supporter.username}
                  className={`w-6 h-6 rounded-full border-2 ${
                    supporter.rank === 1
                      ? 'border-amber-400 ring-1 ring-amber-400/50'
                      : supporter.rank === 2
                      ? 'border-slate-300'
                      : 'border-amber-700'
                  }`}
                />
                <span
                  className={`absolute -bottom-1 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black font-digits text-black ${
                    supporter.rank === 1 ? 'bg-amber-400' : supporter.rank === 2 ? 'bg-slate-200' : 'bg-amber-600 text-white'
                  }`}
                >
                  {supporter.rank}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PK Challenge Bar at Top */}
      <div className="relative z-20 px-3 py-1">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-purple-700/40 p-2 shadow-lg">
          <div className="flex items-center justify-between text-xs mb-1">
            {/* Challenger 1 (Host) */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-blue-400 text-xs">أنا (المضيف)</span>
              <span className="font-digits font-extrabold text-amber-300 text-xs">
                {pk.challenger1Coins.toLocaleString()}
              </span>
            </div>

            {/* Timer & PK Tag */}
            <div className="flex items-center gap-1 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-600/50">
              <Swords className="w-3 h-3 text-red-400" />
              <span className="font-digits text-xs font-bold text-white tracking-widest">
                {pk.isActive ? formatTime(pk.secondsRemaining) : 'انتهى'}
              </span>
            </div>

            {/* Challenger 2 (Guest) */}
            <div className="flex items-center gap-1.5">
              <span className="font-digits font-extrabold text-amber-300 text-xs">
                {pk.challenger2Coins.toLocaleString()}
              </span>
              <span className="font-bold text-red-400 text-xs">المنافس</span>
            </div>
          </div>

          {/* Dynamic 50/50 Bar (never exceeds 100%) */}
          <div className="relative w-full h-3 bg-gray-900 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
              style={{ width: `${challenger1Percent}%` }}
            />
            <div
              className="h-full bg-gradient-to-l from-red-600 to-pink-500 transition-all duration-500"
              style={{ width: `${challenger2Percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] font-digits font-black text-white pointer-events-none drop-shadow">
              <span>{challenger1Percent}%</span>
              <span>{challenger2Percent}%</span>
            </div>
          </div>

          {/* PK End Result & New Challenge Button */}
          {!pk.isActive && (
            <div className="mt-2 pt-2 border-t border-purple-800/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-bold">
                  {pk.winner === 'host' ? '🎉 فوز المضيف في الجولة!' : pk.winner === 'guest' ? '🎉 فوز المنافس في الجولة!' : '🤝 تعادل في الجولة!'}
                </span>
              </div>
              <button
                onClick={handleStartNewPK}
                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-[11px] px-3 py-1 rounded-lg shadow transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>بدء تحدٍ جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Stream Dual-Screen (Challenger 1 & Challenger 2) */}
      <div className="relative flex-1 grid grid-cols-2 gap-1 p-2 min-h-0">
        {/* Host Side */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-purple-950/60 to-black border border-blue-500/30 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&fit=crop"
            alt="Host Stream"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-blue-300 font-bold">
            المضيف
          </div>
        </div>

        {/* Guest Side */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-purple-950/60 to-black border border-red-500/30 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&fit=crop"
            alt="Guest Stream"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-red-300 font-bold">
            المنافس (أحمد)
          </div>
        </div>
      </div>

      {/* Live Comments Stream & Action Bar */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-black via-black/90 to-transparent space-y-2">
        {/* Comments Box */}
        <div className="h-28 overflow-y-auto space-y-1.5 pr-1">
          {comments.slice(-5).map(c => (
            <div
              key={c.id}
              className={`text-xs px-2.5 py-1 rounded-xl max-w-[85%] backdrop-blur-sm ${
                c.isGift
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold'
                  : 'bg-black/40 text-white/90 border border-purple-900/40'
              }`}
            >
              <span className="font-bold text-amber-400 ml-1.5">{c.user}:</span>
              <span>{c.text}</span>
            </div>
          ))}
        </div>

        {/* Input & Gift Buttons */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSendComment} className="flex-1 flex items-center bg-[#170b2c]/90 border border-purple-800/60 rounded-full px-3 py-1.5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="اكتب تعليقاً في اللايف..."
              className="w-full bg-transparent text-xs text-white placeholder-purple-400/50 outline-none"
            />
            <button type="submit" className="text-purple-300 hover:text-amber-400 p-1">
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {/* Quick Gift Trigger Button */}
          <button
            onClick={() => setShowGiftModal(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 transition-all shrink-0"
            title="إرسال هدية"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gift Selection Modal Tray */}
      {showGiftModal && (
        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
          <div className="bg-[#170b2c] rounded-t-3xl border-t border-purple-800 p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">اختر هدية لدعم التحدي</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-300">
                  رصيدك: <strong className="font-digits text-amber-300">{currentUser.coins.toLocaleString()}</strong> كوينز
                </span>
                <button
                  onClick={onOpenRecharge}
                  className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-bold hover:bg-amber-500/30"
                >
                  شحن
                </button>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="text-purple-400 hover:text-white mr-1 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Gifts Grid */}
            <div className="grid grid-cols-4 gap-2">
              {INITIAL_GIFTS.map(gift => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift, 1)}
                  className="bg-[#120824] hover:bg-purple-900/40 border border-purple-800/50 hover:border-amber-400 p-2 rounded-xl flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">
                    {gift.icon}
                  </span>
                  <span className="text-[10px] font-bold text-white truncate w-full text-center">
                    {gift.name}
                  </span>
                  <span className="text-[9px] font-digits font-extrabold text-amber-400 mt-0.5">
                    {gift.coins.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
