import React, { useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  Lock,
  Unlock,
  Gift,
  Send,
  Users,
  Volume2,
  Crown,
  Sparkles,
  Share2,
  Smile,
  Grid,
  Mail,
  Flame,
  ArrowRight,
  ShieldAlert,
  UserX,
  VolumeX,
  ChevronDown,
  Gamepad2,
  Dices,
  Ban,
  MessageSquareOff,
  Radio
} from 'lucide-react';
import { UserProfile, GiftItem } from '../../types';
import { INITIAL_GIFTS } from '../../data/initialData';
import { livoStore } from '../../services/livoStore';
import { GiftAnimationOverlay } from './GiftAnimationOverlay';
import { LivoVerifiedBadge } from '../common/LivoVerifiedBadge';

interface RoyalVoiceRoomModalProps {
  room: {
    id: string;
    title: string;
    ownerName: string;
    ownerAvatar: string;
    viewersCount: number;
    category?: string;
  };
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecharge: () => void;
  onAdminLeaveRoom?: () => void;
}

export const RoyalVoiceRoomModal: React.FC<RoyalVoiceRoomModalProps> = ({
  room,
  currentUser,
  isOpen,
  onClose,
  onOpenRecharge,
  onAdminLeaveRoom
}) => {
  // Drawers & Modals
  const [showGiftsTray, setShowGiftsTray] = useState(false);
  const [showGamesDrawer, setShowGamesDrawer] = useState(false);
  const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState<GiftItem | null>(null);
  const [giftSender, setGiftSender] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRoomChatDisabled, setIsRoomChatDisabled] = useState(false);
  const [myMicActive, setMyMicActive] = useState(false);

  // Selected Seat for Moderation
  const [moderationSeat, setModerationSeat] = useState<{
    index: number;
    seatNum: number;
    occupantName?: string;
    occupantAvatar?: string;
    isMuted?: boolean;
    isLocked?: boolean;
    isMicBlocked?: boolean;
    isChatBlocked?: boolean;
  } | null>(null);

  const [messages, setMessages] = useState<Array<{ id: string; user: string; text: string; isVip?: boolean; isVerified?: boolean }>>([
    { id: 'sys-1', user: 'نظام LIVO', text: `أهلاً بكم في ${room.title}. نتمنى لكم وقتاً ممتعاً 🌟`, isVip: true, isVerified: true }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Is current user room owner or admin
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.email === 'livo.admin@gmail.com' || room.ownerName === currentUser.displayName;

  // STRICT REQUIREMENT: Exactly 12 visible seats in the room! (3 rows of 4 thrones)
  const [seats, setSeats] = useState<Array<{
    seatNum: number;
    occupantName?: string;
    occupantAvatar?: string;
    isLocked?: boolean;
    isMuted?: boolean;
    isMicBlocked?: boolean;
    isChatBlocked?: boolean;
    points?: number;
    isVerified?: boolean;
  }>>([
    {
      seatNum: 1,
      occupantName: room.ownerName,
      occupantAvatar: room.ownerAvatar,
      points: 2450,
      isVerified: true
    },
    ...Array.from({ length: 11 }, (_, i) => ({
      seatNum: i + 2,
      occupantName: undefined,
      occupantAvatar: undefined,
      isLocked: false,
      isMuted: false,
      isMicBlocked: false,
      isChatBlocked: false
    }))
  ]);

  if (!isOpen) return null;

  const handleExitRoom = () => {
    if (room.id === 'room-official-livo' && (currentUser.email === 'livo.admin@gmail.com' || currentUser.role === 'owner')) {
      showToast('⚠️ مغادرتك للغرفة الرسمية بصفتك المالك');
      if (onAdminLeaveRoom) {
        onAdminLeaveRoom();
      }
    }
    onClose();
  };

  const handleSeatClick = (index: number) => {
    const targetSeat = seats[index];

    // If occupied and current user is owner or admin -> open moderation controls
    if (targetSeat.occupantName && isOwnerOrAdmin) {
      setModerationSeat({
        index,
        seatNum: targetSeat.seatNum,
        occupantName: targetSeat.occupantName,
        occupantAvatar: targetSeat.occupantAvatar,
        isMuted: targetSeat.isMuted,
        isLocked: targetSeat.isLocked,
        isMicBlocked: targetSeat.isMicBlocked,
        isChatBlocked: targetSeat.isChatBlocked
      });
      return;
    }

    if (targetSeat.isLocked) {
      showToast('هذا المقعد مقفل بواسطة المالك 🔒');
      return;
    }

    if (targetSeat.isMicBlocked && targetSeat.occupantName === currentUser.displayName) {
      showToast('المايك محظور عليك في هذه الغرفة');
      return;
    }

    if (targetSeat.occupantName === currentUser.displayName) {
      // Leave seat
      setSeats(prev => prev.map((s, idx) => idx === index ? { ...s, occupantName: undefined, occupantAvatar: undefined, points: undefined } : s));
      livoStore.updateRoomSeat(room.id, index, undefined);
      setMyMicActive(false);
      showToast('غادرت مقعد المايك');
    } else if (!targetSeat.occupantName) {
      // Take seat
      setSeats(prev => prev.map((s, idx) => idx === index ? {
        ...s,
        occupantName: currentUser.displayName,
        occupantAvatar: currentUser.avatar,
        points: 350,
        isVerified: currentUser.isVerified
      } : s));
      livoStore.updateRoomSeat(room.id, index, currentUser.uid);
      setMyMicActive(true);
      showToast(`صعدت إلى المقعد رقم ${targetSeat.seatNum} 🎙️`);
    }
  };

  // Moderation Controls
  const handleRemoveFromMic = (index: number) => {
    const seat = seats[index];
    const occupant = seat.occupantName;
    setSeats(prev => prev.map((s, idx) => idx === index ? { ...s, occupantName: undefined, occupantAvatar: undefined, isMuted: false } : s));
    livoStore.updateRoomSeat(room.id, index, undefined);
    setMessages(prev => [...prev, { id: String(Date.now()), user: 'نظام الروم', text: `تم سحب المايك من ${occupant} 🎙️` }]);
    setModerationSeat(null);
    showToast(`تم تنزيل ${occupant} من المايك`);
  };

  const handleToggleMute = (index: number) => {
    const seat = seats[index];
    const newMuted = !seat.isMuted;
    setSeats(prev => prev.map((s, idx) => idx === index ? { ...s, isMuted: newMuted } : s));
    setMessages(prev => [...prev, { id: String(Date.now()), user: 'نظام الروم', text: `${newMuted ? 'تم كتم مايك' : 'تم فك كتم'} ${seat.occupantName}` }]);
    setModerationSeat(null);
    showToast(`${newMuted ? 'تم كتم' : 'تم فك كتم'} المستخدم`);
  };

  const handleToggleLockSeat = (index: number) => {
    const seat = seats[index];
    const newLocked = !seat.isLocked;
    setSeats(prev => prev.map((s, idx) => idx === index ? { ...s, isLocked: newLocked } : s));
    livoStore.updateRoomSeat(room.id, index, seat.occupantName ? currentUser.uid : undefined, newLocked);
    setModerationSeat(null);
    showToast(newLocked ? 'تم قفل الكرسي 🔒' : 'تم فتح الكرسي 🔓');
  };

  const handleBlockUserMic = (index: number) => {
    const seat = seats[index];
    setSeats(prev => prev.map((s, idx) => idx === index ? { ...s, isMicBlocked: true, occupantName: undefined, occupantAvatar: undefined } : s));
    setMessages(prev => [...prev, { id: String(Date.now()), user: 'نظام الروم', text: `تم منع ${seat.occupantName} من فتح المايك نهائياً` }]);
    setModerationSeat(null);
    showToast(`تم منع ${seat.occupantName} من فتح المايك`);
  };

  const handleBlockUserChat = (index: number) => {
    const seat = seats[index];
    setSeats(prev => prev.map((s, idx) => idx === index ? { ...s, isChatBlocked: true } : s));
    setMessages(prev => [...prev, { id: String(Date.now()), user: 'نظام الروم', text: `تم منع ${seat.occupantName} من الكتابة في الشات` }]);
    setModerationSeat(null);
    showToast(`تم منع ${seat.occupantName} من الكتابة`);
  };

  const handleKickUser = (index: number) => {
    const seat = seats[index];
    const occupant = seat.occupantName;
    handleRemoveFromMic(index);
    setMessages(prev => [...prev, { id: String(Date.now()), user: 'نظام الروم', text: `تم طرد ${occupant} من الغرفة بواسطة المشرف` }]);
    showToast(`تم طرد ${occupant} من الغرفة`);
  };

  const handleToggleRoomAllChat = () => {
    const nextState = !isRoomChatDisabled;
    setIsRoomChatDisabled(nextState);
    setMessages(prev => [...prev, {
      id: String(Date.now()),
      user: 'إدارة الروم',
      text: nextState ? 'تم قفل الشات للجميع مؤقتاً عدا المشرفين 🔒' : 'تم فتح الشات لجميع المستخدمين 💬'
    }]);
    showToast(nextState ? 'تم قفل شات الغرفة' : 'تم فتح شات الغرفة');
  };

  const handleSendGift = (gift: GiftItem) => {
    if (currentUser.coins < gift.coins) {
      showToast(`رصيد الكوينز غير كافٍ لإرسال ${gift.name}`);
      onOpenRecharge();
      return;
    }

    // Deduct coins via livoStore
    livoStore.adjustUserCoins(
      currentUser.uid,
      'deduct',
      gift.coins,
      `إرسال هدية ${gift.name} في غرفة ${room.title}`,
      currentUser.displayName
    );

    setActiveGiftAnim(gift);
    setGiftSender(currentUser.displayName);
    setShowGiftsTray(false);

    setMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        user: currentUser.displayName,
        text: `أرسل هدية ${gift.name} ${gift.icon} بقيمة ${gift.coins} كوينز! 🔥`,
        isVip: true,
        isVerified: currentUser.isVerified
      }
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (isRoomChatDisabled && !isOwnerOrAdmin) {
      showToast('الكتابة في الشات مقفلة حالياً بواسطة الإدارة');
      return;
    }

    setMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        user: currentUser.displayName,
        text: chatInput.trim(),
        isVip: currentUser.role === 'owner' || (currentUser.coins > 5000),
        isVerified: currentUser.isVerified
      }
    ]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 select-none animate-in fade-in">
      
      {/* Gift Animation Full-Screen Overlay */}
      <GiftAnimationOverlay
        gift={activeGiftAnim}
        senderName={giftSender}
        onFinished={() => setActiveGiftAnim(null)}
      />

      <div className="relative w-full max-w-[440px] h-[100dvh] bg-gradient-to-b from-[#180a2b] via-[#210927] to-[#0c0414] text-white flex flex-col justify-between overflow-hidden shadow-2xl">
        
        {/* Toast feedback */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Top Room Bar */}
        <div className="p-3 pt-5 flex items-center justify-between border-b border-purple-900/40 bg-black/40 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExitRoom}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              title="خروج من الغرفة"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-amber-500 text-black font-extrabold px-1 rounded">12 مقعد</span>
                <h3 className="font-bold text-xs text-white truncate max-w-[150px]">{room.title}</h3>
              </div>
              <div className="text-[10px] text-purple-300 flex items-center gap-1">
                <span>عائلة</span> • <span className="text-amber-400 font-semibold">{room.ownerName}</span>
                <LivoVerifiedBadge size={12} />
              </div>
            </div>
          </div>

          {/* Tools & Viewers */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full border border-purple-800/40 text-xs text-purple-200">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-digits font-extrabold">{room.viewersCount || 14}</span>
            </div>

            {/* Admin toggle chat button */}
            {isOwnerOrAdmin && (
              <button
                onClick={handleToggleRoomAllChat}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isRoomChatDisabled ? 'bg-red-600 text-white' : 'bg-black/40 text-purple-300 hover:text-white'
                }`}
                title={isRoomChatDisabled ? 'فك قفل شات الغرفة' : 'قفل الشات للجميع'}
              >
                <MessageSquareOff className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                navigator.clipboard?.writeText(`https://livo.live/room/${room.id}`);
                showToast('تم نسخ رابط الغرفة بنجاح 📋');
              }}
              className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-purple-300 hover:text-white"
              title="مشاركة الغرفة"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 12 Luxury Throne Seats Stage (Exact 12 Seats: 4 columns x 3 rows) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col justify-around">
          
          <div className="grid grid-cols-4 gap-3 text-center">
            {seats.map((seat, index) => {
              const isOccupied = !!seat.occupantName;

              return (
                <div
                  key={index}
                  onClick={() => handleSeatClick(index)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  {/* Throne / Avatar Icon */}
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {isOccupied ? (
                      <div className="relative">
                        <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-lg shadow-amber-500/20">
                          <img
                            src={seat.occupantAvatar}
                            alt={seat.occupantName}
                            className="w-full h-full rounded-full object-cover border border-black"
                          />
                        </div>

                        {/* Mic Icon or Mute Icon */}
                        {seat.isMuted ? (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-black flex items-center justify-center text-[8px]">
                            <MicOff className="w-2.5 h-2.5 text-white" />
                          </span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border border-black flex items-center justify-center text-[8px] animate-pulse">
                            <Mic className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}

                        {/* Points Badge */}
                        {seat.points ? (
                          <span className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[8px] font-digits font-black px-1 rounded-full whitespace-nowrap shadow">
                            ★ {seat.points}
                          </span>
                        ) : null}
                      </div>
                    ) : seat.isLocked ? (
                      <div className="w-12 h-12 rounded-full border border-dashed border-red-500/60 bg-black/40 flex items-center justify-center text-red-400">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      /* Golden Throne Chair */
                      <div className="w-12 h-12 rounded-full bg-black/40 border border-purple-800/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform filter drop-shadow">
                        👑
                      </div>
                    )}
                  </div>

                  {/* Seat Label */}
                  <div className="flex items-center justify-center gap-0.5 mt-1 max-w-[64px] truncate">
                    <span className="text-[10px] text-purple-200 truncate font-semibold">
                      {isOccupied ? seat.occupantName : `مقعد ${seat.seatNum}`}
                    </span>
                    {seat.isVerified && <LivoVerifiedBadge size={10} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* In-Room Live Chat Messages */}
          <div className="h-32 overflow-y-auto px-2 space-y-1.5 my-2 text-xs flex flex-col justify-end">
            {messages.slice(-5).map((m) => (
              <div
                key={m.id}
                className={`p-1.5 rounded-xl flex items-center gap-1.5 w-fit max-w-[90%] text-[11px] ${
                  m.isVip
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    : 'bg-black/50 text-white border border-purple-900/40'
                }`}
              >
                <span className="font-bold text-amber-400 shrink-0">{m.user}:</span>
                {m.isVerified && <LivoVerifiedBadge size={11} />}
                <span className="truncate">{m.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Interactive Toolbar */}
        <div className="p-3 bg-black/80 backdrop-blur-lg border-t border-purple-900/50 flex items-center justify-between gap-2 z-20">
          
          {/* Gift Trigger Button */}
          <button
            onClick={() => setShowGiftsTray(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 transition-all shrink-0"
            title="إرسال هدية"
          >
            <Gift className="w-5 h-5" />
          </button>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="flex-1 flex items-center bg-[#1b0825] border border-purple-800/60 rounded-full px-3 py-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={isRoomChatDisabled ? 'الكتابة مقفلة في الروم' : 'اكتب رسالة في الروم...'}
              disabled={isRoomChatDisabled && !isOwnerOrAdmin}
              className="w-full bg-transparent text-xs text-white placeholder-purple-400/50 outline-none"
            />
            <button type="submit" className="text-purple-300 hover:text-amber-400 p-1">
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {/* Mic Toggle Button */}
          <button
            onClick={() => {
              setMyMicActive(!myMicActive);
              showToast(myMicActive ? 'تم كتم المايك الخاص بك 🎙️' : 'تم تشغيل المايك الخاص بك 🎙️');
            }}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
              myMicActive ? 'bg-green-600 border-green-500 text-white' : 'bg-purple-900/60 border-purple-700/60 text-purple-200'
            }`}
            title="تشغيل / كتم المايك"
          >
            {myMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>

        {/* SEAT MODERATION MODAL (صلاحيات الإدارة على المايك والمقعد) */}
        {moderationSeat && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#1a0a2a] rounded-t-3xl border-t border-purple-600 p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-black text-white">
                      إدارة المقعد {moderationSeat.seatNum} — {moderationSeat.occupantName}
                    </h4>
                    <span className="text-[10px] text-purple-300">تحكم المالك والمشرفين بالمايك والصلاحيات</span>
                  </div>
                </div>
                <button
                  onClick={() => setModerationSeat(null)}
                  className="w-7 h-7 rounded-full bg-purple-900/40 text-purple-300 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Core Moderation Actions */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                {/* 1. سحب المايك */}
                <button
                  onClick={() => handleRemoveFromMic(moderationSeat.index)}
                  className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2 text-purple-100 hover:text-white transition-all"
                >
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>سحب المايك (تنزيل)</span>
                </button>

                {/* 2. كتم المايك */}
                <button
                  onClick={() => handleToggleMute(moderationSeat.index)}
                  className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2 text-purple-100 hover:text-white transition-all"
                >
                  <VolumeX className="w-4 h-4 text-orange-400" />
                  <span>{moderationSeat.isMuted ? 'إلغاء كتم المايك' : 'كتم المايك'}</span>
                </button>

                {/* 3. منع فتح المايك */}
                <button
                  onClick={() => handleBlockUserMic(moderationSeat.index)}
                  className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2 text-purple-100 hover:text-white transition-all"
                >
                  <MicOff className="w-4 h-4 text-red-400" />
                  <span>منع فتح المايك</span>
                </button>

                {/* 4. منع الكتابة */}
                <button
                  onClick={() => handleBlockUserChat(moderationSeat.index)}
                  className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2 text-purple-100 hover:text-white transition-all"
                >
                  <MessageSquareOff className="w-4 h-4 text-yellow-400" />
                  <span>منع الكتابة بالشات</span>
                </button>

                {/* 5. قفل / فتح الكرسي */}
                <button
                  onClick={() => handleToggleLockSeat(moderationSeat.index)}
                  className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2 text-purple-100 hover:text-white transition-all"
                >
                  {moderationSeat.isLocked ? <Unlock className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-blue-400" />}
                  <span>{moderationSeat.isLocked ? 'فتح الكرسي' : 'قفل الكرسي'}</span>
                </button>

                {/* 6. طرد من الغرفة */}
                <button
                  onClick={() => handleKickUser(moderationSeat.index)}
                  className="bg-red-950/60 hover:bg-red-900 border border-red-800/60 p-2.5 rounded-xl flex items-center gap-2 text-red-300 hover:text-white transition-all"
                >
                  <Ban className="w-4 h-4 text-red-400" />
                  <span>طرد من الغرفة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GIFTS TRAY DRAWER */}
        {showGiftsTray && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#1a0a2a] rounded-t-3xl border-t border-purple-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-900/50 pb-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-white">متجر الهدايا التفاعلية للغرف</span>
                </div>
                <button
                  onClick={() => setShowGiftsTray(false)}
                  className="w-7 h-7 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto">
                {INITIAL_GIFTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSendGift(g)}
                    className="p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 hover:border-amber-400 flex flex-col items-center gap-1 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-125 transition-transform">{g.icon}</span>
                    <span className="text-[10px] font-bold text-white truncate max-w-full">{g.name}</span>
                    <span className="text-[9px] font-digits text-amber-300 font-bold">{g.coins} 🪙</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
