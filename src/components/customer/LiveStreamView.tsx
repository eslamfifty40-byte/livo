import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Gift,
  Send,
  Trophy,
  Swords,
  RotateCcw,
  Crown,
  X,
  Video,
  VideoOff,
  Mic,
  MicOff,
  RefreshCw,
  Minimize2
} from 'lucide-react';
import { UserProfile, GiftItem, StreamSupporter, VoiceRoom } from '../../types';
import { livoStore } from '../../services/livoStore';
import { GiftAnimationOverlay } from './GiftAnimationOverlay';
import { UserNameWithBadges } from '../common/UserNameWithBadges';

interface LiveStreamViewProps {
  currentUser: UserProfile;
  room?: VoiceRoom;
  isHost?: boolean;
  onOpenRecharge: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
}

interface PKState {
  isActive: boolean;
  challenger1Coins: number;
  challenger2Coins: number;
  secondsRemaining: number;
  winner: 'host' | 'guest' | 'draw' | null;
  roundNumber: number;
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({
  currentUser,
  room,
  isHost = false,
  onOpenRecharge,
  onClose,
  onMinimize
}) => {
  const [gifts, setGifts] = useState<GiftItem[]>(livoStore.getActiveGifts());
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftItem | null>(null);
  const [lastSenderName, setLastSenderName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [comments, setComments] = useState<Array<{ id: string; uid?: string; user: string; text: string; isGift?: boolean }>>([]);
  const [topSupporters, setTopSupporters] = useState<StreamSupporter[]>([]);

  // Real Camera & Mic state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(isHost);
  const [isMicOn, setIsMicOn] = useState(isHost);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const [pk, setPk] = useState<PKState>({
    isActive: false,
    challenger1Coins: 0,
    challenger2Coins: 0,
    secondsRemaining: 300,
    winner: null,
    roundNumber: 1
  });

  useEffect(() => {
    const unsub = livoStore.subscribe(() => {
      setGifts(livoStore.getActiveGifts());
      if (room?.id) {
        const latestRoom = livoStore.getRoomById(room.id);
        if (latestRoom?.messages) {
          setComments(
            latestRoom.messages.map(m => ({
              id: m.id,
              uid: m.uid,
              user: m.user,
              text: m.text,
              isGift: m.isVip
            }))
          );
        }
      }
    });
    return () => unsub();
  }, [room?.id]);

  // Activate real WebRTC camera & mic for host
  useEffect(() => {
    if (!isHost) return;

    const startMedia = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true
        });
        streamRef.current = mediaStream;
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        mediaStream.getVideoTracks().forEach(t => {
          t.enabled = isCameraOn;
        });
        mediaStream.getAudioTracks().forEach(t => {
          t.enabled = isMicOn;
        });
      } catch {
        setCameraError('يرجى السماح بصلاحية الكاميرا والميكروفون من المتصفح لبدء البث المباشر.');
      }
    };

    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [isHost, facingMode]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => {
        t.enabled = isCameraOn;
      });
      streamRef.current.getAudioTracks().forEach(t => {
        t.enabled = isMicOn;
      });
    }
  }, [isCameraOn, isMicOn]);

  // PK Countdown
  useEffect(() => {
    if (!pk.isActive || pk.secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setPk(prev => {
        if (prev.secondsRemaining <= 1) {
          let win: 'host' | 'guest' | 'draw' = 'draw';
          if (prev.challenger1Coins > prev.challenger2Coins) win = 'host';
          else if (prev.challenger2Coins > prev.challenger1Coins) win = 'guest';
          return { ...prev, secondsRemaining: 0, isActive: false, winner: win };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pk.isActive, pk.secondsRemaining]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleStartNewPK = () => {
    setPk(prev => ({
      isActive: true,
      challenger1Coins: 0,
      challenger2Coins: 0,
      secondsRemaining: 300,
      winner: null,
      roundNumber: prev.roundNumber + 1
    }));
    if (room?.id) {
      livoStore.appendRoomMessage(room.id, {
        uid: currentUser.uid,
        user: 'نظام البث',
        text: '⚔️ بدأت جولة تحدي PK جديدة!'
      });
    }
  };

  const totalPKCoins = pk.challenger1Coins + pk.challenger2Coins;
  const challenger1Percent = totalPKCoins > 0 ? Math.round((pk.challenger1Coins / totalPKCoins) * 100) : 50;
  const challenger2Percent = 100 - challenger1Percent;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendGift = (gift: GiftItem, targetChallenger: 1 | 2 = 1) => {
    if (currentUser.coins < gift.coins) {
      showToast('رصيد الكوينز غير كافٍ، يرجى الشحن');
      onOpenRecharge();
      return;
    }

    livoStore.adjustUserCoins(
      currentUser.uid,
      'deduct',
      gift.coins,
      `إرسال هدية ${gift.name} في البث المباشر`,
      currentUser.displayName
    );

    if (pk.isActive) {
      setPk(prev => ({
        ...prev,
        challenger1Coins: targetChallenger === 1 ? prev.challenger1Coins + gift.coins : prev.challenger1Coins,
        challenger2Coins: targetChallenger === 2 ? prev.challenger2Coins + gift.coins : prev.challenger2Coins
      }));
    }

    setTopSupporters(prev => {
      const existing = prev.find(s => s.uid === currentUser.uid);
      const updated = existing
        ? prev.map(s => s.uid === currentUser.uid ? { ...s, supportedCoins: s.supportedCoins + gift.coins } : s)
        : [
            ...prev,
            {
              rank: 3 as 1 | 2 | 3,
              uid: currentUser.uid,
              username: currentUser.displayName,
              avatar: currentUser.avatar,
              supportedCoins: gift.coins
            }
          ];
      return updated
        .sort((a, b) => b.supportedCoins - a.supportedCoins)
        .slice(0, 3)
        .map((s, idx) => ({ ...s, rank: (idx + 1) as 1 | 2 | 3 }));
    });

    if (room?.id) {
      livoStore.appendRoomMessage(room.id, {
        uid: currentUser.uid,
        user: currentUser.displayName,
        text: `أرسل هدية ${gift.name} ${gift.icon}!`,
        isVip: true
      });
    } else {
      setComments(prev => [
        ...prev,
        { id: String(Date.now()), user: currentUser.displayName, text: `أرسل ${gift.name} (${gift.icon})!`, isGift: true }
      ]);
    }

    setLastSenderName(currentUser.displayName);
    setActiveGiftAnimation(gift);
    setShowGiftModal(false);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (room?.id) {
      livoStore.appendRoomMessage(room.id, {
        uid: currentUser.uid,
        user: currentUser.displayName,
        text: commentText.trim(),
        isVerified: currentUser.isVerified
      });
    } else {
      setComments(prev => [
        ...prev,
        { id: String(Date.now()), user: currentUser.displayName, text: commentText.trim() }
      ]);
    }
    setCommentText('');
  };

  const hostUser = room?.ownerUid ? livoStore.getUserByUid(room.ownerUid) : currentUser;
  const hostName = hostUser?.displayName || room?.ownerName || currentUser.displayName;
  const hostAvatar = hostUser?.avatar || room?.ownerAvatar || currentUser.avatar;

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black overflow-hidden flex flex-col justify-between text-white">
      <GiftAnimationOverlay
        gift={activeGiftAnimation}
        senderName={lastSenderName}
        onFinished={() => setActiveGiftAnimation(null)}
      />

      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Real Video Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#160b2c] to-black flex items-center justify-center">
        {isHost && isCameraOn && !cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <img
              src={hostAvatar}
              alt={hostName}
              className="w-28 h-28 rounded-full border-4 border-[#FFE600] object-cover shadow-2xl"
            />
            {cameraError && (
              <p className="text-xs text-amber-300 bg-black/70 px-4 py-2 rounded-2xl max-w-xs">
                {cameraError}
              </p>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none" />
      </div>

      {/* Top Stream Header */}
      <div className="relative z-20 p-3 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
          <img
            src={hostAvatar}
            alt={hostName}
            className="w-8 h-8 rounded-full border border-[#FFE600] object-cover"
          />
          <div>
            <div className="flex items-center gap-1 min-w-0">
              <UserNameWithBadges
                displayName={hostName}
                nameGlowColor={hostUser?.nameGlowColor}
                isVerified={hostUser?.isVerified}
                verifiedBadgeColor={hostUser?.verifiedBadgeColor}
                verifiedBadgeShape={hostUser?.verifiedBadgeShape}
                verifiedBadgeGlow={hostUser?.verifiedBadgeGlow}
                customIconUrl={hostUser?.customIconUrl}
                customIconGlow={hostUser?.customIconGlow}
                customIconAnimated={hostUser?.customIconAnimated}
                badgeSize={12}
                iconSize={15}
                nameClassName="text-xs font-bold text-white max-w-[110px]"
              />
              <span className="bg-red-600 text-white text-[8px] font-black px-1.5 rounded-full animate-pulse shrink-0">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-300">
              <Users className="w-3 h-3 text-[#FFE600]" />
              <span className="font-digits">{room?.viewersCount || 1}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {topSupporters.length > 0 && (
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/15">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              {topSupporters.map(s => (
                <img
                  key={s.uid}
                  src={s.avatar}
                  alt={s.username}
                  className="w-5 h-5 rounded-full border border-amber-400 object-cover"
                />
              ))}
            </div>
          )}

          {isHost && (
            <button
              onClick={handleStartNewPK}
              className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center gap-1"
            >
              <Swords className="w-3 h-3" />
              <span>تحدي PK</span>
            </button>
          )}

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="w-8 h-8 rounded-full bg-amber-500/90 hover:bg-amber-400 flex items-center justify-center text-black"
              title="لايف مصغر"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={() => (isHost ? setShowEndConfirm(true) : onClose())}
              className="w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Optional PK Bar when started */}
      {(pk.isActive || pk.winner) && (
        <div className="relative z-20 px-3">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-purple-700/40 p-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-blue-400">{pk.challenger1Coins.toLocaleString()}</span>
              <span className="font-digits text-[11px] font-black text-white">
                {pk.isActive ? formatTime(pk.secondsRemaining) : 'انتهى'}
              </span>
              <span className="font-bold text-red-400">{pk.challenger2Coins.toLocaleString()}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${challenger1Percent}%` }} />
              <div className="h-full bg-pink-500 transition-all" style={{ width: `${challenger2Percent}%` }} />
            </div>
            {!pk.isActive && pk.winner && (
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-bold text-amber-300">
                  <Trophy className="w-3.5 h-3.5" />
                  انتهى التحدي
                </span>
                <button
                  onClick={handleStartNewPK}
                  className="bg-amber-400 text-black font-black px-2.5 py-0.5 rounded-full flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>جولة جديدة</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Live Comments & Controls */}
      <div className="relative z-20 p-3 space-y-2.5 mt-auto">
        <div className="h-28 overflow-y-auto space-y-1.5 pr-1 flex flex-col justify-end">
          {comments.slice(-6).map(c => {
            const commenter = c.uid ? livoStore.getUserByUid(c.uid) : undefined;
            return (
              <div
                key={c.id}
                className={`text-xs px-3 py-1 rounded-2xl w-fit max-w-[85%] backdrop-blur-sm flex items-center gap-1.5 flex-wrap ${
                  c.isGift
                    ? 'bg-amber-500/25 border border-amber-400/50 text-amber-200 font-bold'
                    : 'bg-black/45 text-white border border-white/10'
                }`}
              >
                <UserNameWithBadges
                  displayName={`${c.user}:`}
                  nameGlowColor={commenter?.nameGlowColor}
                  isVerified={commenter?.isVerified}
                  verifiedBadgeColor={commenter?.verifiedBadgeColor}
                  verifiedBadgeShape={commenter?.verifiedBadgeShape}
                  verifiedBadgeGlow={commenter?.verifiedBadgeGlow}
                  customIconUrl={commenter?.customIconUrl}
                  customIconGlow={commenter?.customIconGlow}
                  customIconAnimated={commenter?.customIconAnimated}
                  badgeSize={11}
                  iconSize={14}
                  nameClassName="font-bold text-amber-400"
                  truncate={false}
                />
                <span>{c.text}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSendComment} className="flex-1 flex items-center bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="اكتب تعليقاً في اللايف..."
              className="w-full bg-transparent text-xs text-white placeholder-gray-300 outline-none"
            />
            <button type="submit" className="text-amber-400 p-1">
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {isHost && (
            <>
              <button
                onClick={() => setFacingMode(f => (f === 'user' ? 'environment' : 'user'))}
                className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white"
                title="تبديل الكاميرا"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCameraOn(v => !v)}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isCameraOn ? 'bg-white/15 text-white' : 'bg-red-600 text-white'
                }`}
                title="تشغيل/إيقاف الكاميرا"
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMicOn(m => !m)}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isMicOn ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
                title="تشغيل/كتم المايك"
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            </>
          )}

          <button
            onClick={() => setShowGiftModal(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shrink-0"
            title="إرسال هدية"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* End Live Confirm Modal */}
      {showEndConfirm && onClose && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a0a2a] border border-purple-700/60 rounded-3xl p-5 w-full max-w-xs text-center space-y-3">
            <h4 className="font-black text-sm text-white">إنهاء البث المباشر؟</h4>
            <p className="text-xs text-purple-200">سيتم إغلاق الكاميرا وإنهاء البث لجميع المشاهدين.</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs"
              >
                إنهاء البث
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
              >
                استمرار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Gifts Modal */}
      {showGiftModal && (
        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
          <div className="bg-[#170b2c] rounded-t-3xl border-t border-purple-800 p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">إرسال هدية للبث المباشر</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-digits text-amber-300 font-bold">
                  {currentUser.coins.toLocaleString()} 🪙
                </span>
                <button
                  onClick={onOpenRecharge}
                  className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-bold"
                >
                  شحن
                </button>
                <button onClick={() => setShowGiftModal(false)} className="text-purple-300 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {gifts.map(gift => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift, 1)}
                  className="bg-[#120824] hover:bg-purple-900/40 border border-purple-800/50 hover:border-amber-400 p-2 rounded-xl flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">{gift.icon}</span>
                  <span className="text-[10px] font-bold text-white truncate w-full text-center">{gift.name}</span>
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
