import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Lock,
  Unlock,
  Gift,
  Send,
  Users,
  Share2,
  ArrowRight,
  ShieldAlert,
  UserX,
  VolumeX,
  Ban,
  MessageSquareOff,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Check
} from 'lucide-react';
import { UserProfile, GiftItem, VoiceRoom, RoomSeat } from '../../types';
import { livoStore } from '../../services/livoStore';
import { GiftAnimationOverlay } from './GiftAnimationOverlay';
import { LivoVerifiedBadge } from '../common/LivoVerifiedBadge';

interface BgPreset {
  id: string;
  label: string;
  value: string;
}

const ROOM_BG_PRESETS: BgPreset[] = [
  {
    id: 'royal-purple',
    label: 'ليلي ملكي (الافتراضي)',
    value: 'linear-gradient(180deg, #180a2b 0%, #210927 50%, #0c0414 100%)'
  },
  {
    id: 'gold-lounge',
    label: 'صالون ذهبي فاخر',
    value: 'radial-gradient(circle at top, #5b3a08 0%, #241205 45%, #0c0502 100%)'
  },
  {
    id: 'emerald-night',
    label: 'زمردي هادئ',
    value: 'linear-gradient(160deg, #06372f 0%, #0d1f2d 55%, #060b14 100%)'
  },
  {
    id: 'crimson-stage',
    label: 'مسرح الحفلات',
    value: 'linear-gradient(180deg, #4b0b28 0%, #24071d 55%, #0d0311 100%)'
  },
  {
    id: 'ocean-nebula',
    label: 'سديم أزرق',
    value: 'linear-gradient(165deg, #0b2545 0%, #1d1145 55%, #090617 100%)'
  },
  {
    id: 'livo-party-art',
    label: 'خلفية حفلة LIVO',
    value: '/assets/livo/login_party_banner.jpg'
  }
];

function getBgStyle(bgValue?: string): React.CSSProperties {
  if (!bgValue) {
    return { background: ROOM_BG_PRESETS[0].value };
  }
  if (bgValue.startsWith('linear-gradient') || bgValue.startsWith('radial-gradient')) {
    return { background: bgValue };
  }
  return {
    backgroundImage: `url("${bgValue}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}

interface RoyalVoiceRoomModalProps {
  room: VoiceRoom;
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
  const [liveRoom, setLiveRoom] = useState<VoiceRoom>(room);
  const [gifts, setGifts] = useState<GiftItem[]>(livoStore.getActiveGifts());
  const [showGiftsTray, setShowGiftsTray] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState<GiftItem | null>(null);
  const [giftSender, setGiftSender] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Voice Room Background Customization State
  const [personalBg, setPersonalBg] = useState<string | undefined>(() =>
    livoStore.getVoiceRoomPersonalBg(currentUser.uid)
  );
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgPreviewValue, setBgPreviewValue] = useState<string>(ROOM_BG_PRESETS[0].value);
  const [bgScope, setBgScope] = useState<'personal' | 'room'>('personal');

  // Real microphone audio stream reference
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Selected Seat for Moderation (ONLY for moderating OTHER users or locked/empty seats)
  const [moderationSeat, setModerationSeat] = useState<RoomSeat | null>(null);

  useEffect(() => {
    const sync = () => {
      const latest = livoStore.getRoomById(room.id);
      if (latest) {
        setLiveRoom(latest);
      }
      setPersonalBg(livoStore.getVoiceRoomPersonalBg(currentUser.uid));
      setGifts(livoStore.getActiveGifts());
    };
    sync();
    const unsub = livoStore.subscribe(sync);
    return () => unsub();
  }, [room.id, currentUser.uid]);

  // Ensure exact 12 seats array
  const seats: RoomSeat[] = Array.from({ length: 12 }, (_, idx) => {
    const existing = liveRoom.seats?.find(s => s.seatIndex === idx);
    return existing || { seatIndex: idx, isMuted: false, isLocked: false };
  });

  const mySeat = seats.find(s => s.occupiedByUid === currentUser.uid) || null;
  const isMyMicMuted = mySeat ? mySeat.isMuted : true;

  // Manage real WebRTC microphone hardware based on current user's seat & mute state
  useEffect(() => {
    const syncAudioHardware = async () => {
      if (!mySeat || mySeat.isMuted) {
        if (audioStreamRef.current) {
          audioStreamRef.current.getAudioTracks().forEach(t => {
            t.enabled = false;
          });
        }
        return;
      }
      try {
        if (!audioStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = stream;
        }
        audioStreamRef.current.getAudioTracks().forEach(t => {
          t.enabled = true;
        });
      } catch {
        // User denied microphone permission or device unavailable
      }
    };
    syncAudioHardware();
  }, [mySeat?.seatIndex, mySeat?.isMuted]);

  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const isOwnerOrAdmin =
    currentUser.role === 'owner' ||
    currentUser.role === 'supervisor' ||
    livoStore.isOwnerEmail(currentUser.email) ||
    liveRoom.ownerUid === currentUser.uid;

  const isUserMutedInRoom = liveRoom.mutedUsers?.includes(currentUser.uid);

  const handleCloseAndLeave = (closeRoomForAll: boolean = false) => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }

    if (closeRoomForAll && isOwnerOrAdmin) {
      if (onAdminLeaveRoom) {
        onAdminLeaveRoom();
      } else {
        livoStore.closeAndRemoveRoom(liveRoom.id);
      }
    } else {
      livoStore.leaveRoomSeat(liveRoom.id, currentUser.uid);
    }
    onClose();
  };

  const handleExitButtonTap = () => {
    if (isOwnerOrAdmin) {
      setShowExitConfirm(true);
    } else {
      handleCloseAndLeave(false);
    }
  };

  /**
   * Seat Click Logic:
   * 1. Clicking YOUR OWN occupied seat (including Owner on Seat #1): toggles mute/unmute IN PLACE!
   * 2. Clicking ANOTHER user's occupied seat as Owner/Admin: opens Moderation Menu.
   * 3. Clicking an EMPTY seat: calls strict single-mic joinRoomSeat (blocks multiple mics!).
   */
  const handleSeatClick = (index: number) => {
    const targetSeat = seats[index];

    // 1. Clicking MY OWN seat -> toggle mute/unmute in-place without leaving or jumping
    if (targetSeat.occupiedByUid === currentUser.uid) {
      const nextMuted = livoStore.toggleSeatMute(liveRoom.id, index);
      showToast(nextMuted ? 'تم كتم المايك الخاص بك 🔇' : 'تم فتح المايك الخاص بك 🎙️');
      return;
    }

    // 2. Clicking ANOTHER user's occupied seat as Owner/Admin -> Moderation Sheet
    if (targetSeat.occupiedByUid) {
      if (isOwnerOrAdmin) {
        setModerationSeat(targetSeat);
      } else {
        showToast(`المستخدم ${targetSeat.occupiedByName} على المايك`);
      }
      return;
    }

    // 3. Clicking an EMPTY seat while ALREADY seated on another seat -> Block multi-mic!
    if (mySeat) {
      showToast('أنت تجلس بالفعل على مايك! اضغط على مايكك الحالي لكتمه أو انزل منه أولاً.');
      return;
    }

    // 4. Empty seat -> attempt join
    if (targetSeat.isLocked && !isOwnerOrAdmin) {
      showToast('هذا المقعد مقفل بواسطة المالك 🔒');
      return;
    }

    // If Owner clicks locked empty seat (not seat #1), let them unlock or sit
    if (targetSeat.isLocked && isOwnerOrAdmin) {
      setModerationSeat(targetSeat);
      return;
    }

    const res = livoStore.joinRoomSeat(liveRoom.id, index, currentUser.uid);
    showToast(res.message);
  };

  const handleBottomMicToggle = () => {
    if (!mySeat) {
      // Find first available seat (Seat #1 for owner, or Seat #2+ for guest)
      const startIdx = isOwnerOrAdmin ? 0 : 1;
      const freeSeat = seats.find(s => s.seatIndex >= startIdx && !s.occupiedByUid && !s.isLocked);
      if (!freeSeat) {
        showToast('لا توجد مقاعد شاغرة حالياً');
        return;
      }
      const res = livoStore.joinRoomSeat(liveRoom.id, freeSeat.seatIndex, currentUser.uid);
      showToast(res.message);
      return;
    }
    const nextMuted = livoStore.toggleSeatMute(liveRoom.id, mySeat.seatIndex);
    showToast(nextMuted ? 'تم كتم المايك 🔇' : 'تم فتح المايك 🎙️');
  };

  const handleSendGift = (gift: GiftItem) => {
    if (currentUser.coins < gift.coins) {
      showToast(`رصيد الكوينز غير كافٍ لإرسال ${gift.name}`);
      onOpenRecharge();
      return;
    }

    livoStore.adjustUserCoins(
      currentUser.uid,
      'deduct',
      gift.coins,
      `إرسال هدية ${gift.name} في غرفة ${liveRoom.title}`,
      currentUser.displayName
    );

    setActiveGiftAnim(gift);
    setGiftSender(currentUser.displayName);
    setShowGiftsTray(false);

    livoStore.appendRoomMessage(liveRoom.id, {
      uid: currentUser.uid,
      user: currentUser.displayName,
      text: `أرسل هدية ${gift.name} ${gift.icon} (${gift.coins.toLocaleString()} كوينز)! 🔥`,
      isVip: true,
      isVerified: currentUser.isVerified
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if ((liveRoom.allChatDisabled || isUserMutedInRoom) && !isOwnerOrAdmin) {
      showToast('الكتابة في الدردشة مقفلة حالياً بواسطة الإدارة');
      return;
    }

    livoStore.appendRoomMessage(liveRoom.id, {
      uid: currentUser.uid,
      user: currentUser.displayName,
      text: chatInput.trim(),
      isVip: currentUser.role === 'owner' || currentUser.coins > 5000,
      isVerified: currentUser.isVerified
    });
    setChatInput('');
  };

  const roomMessages = liveRoom.messages || [];
  const effectiveBackground = personalBg || liveRoom.backgroundUrl || ROOM_BG_PRESETS[0].value;

  const openBackgroundPicker = () => {
    setBgPreviewValue(effectiveBackground);
    setBgScope(isOwnerOrAdmin && liveRoom.backgroundUrl && !personalBg ? 'room' : 'personal');
    setShowBgPicker(true);
  };

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          setBgPreviewValue(compressed);
        } else {
          setBgPreviewValue(rawUrl);
        }
      };
      img.onerror = () => setBgPreviewValue(rawUrl);
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyBackground = () => {
    if (bgScope === 'room') {
      if (!isOwnerOrAdmin) {
        showToast('تغيير خلفية الغرفة للجميع متاح لصاحب الغرفة أو الإدارة فقط');
        return;
      }
      const res = livoStore.setVoiceRoomBackground(liveRoom.id, bgPreviewValue, currentUser.uid);
      showToast(res.message);
    } else {
      livoStore.setVoiceRoomPersonalBg(currentUser.uid, bgPreviewValue);
      setPersonalBg(bgPreviewValue);
      showToast('تم حفظ الخلفية الشخصية لك بنجاح ✓');
    }
    setShowBgPicker(false);
  };

  const handleResetDefaultBackground = () => {
    if (bgScope === 'room' && isOwnerOrAdmin) {
      const res = livoStore.setVoiceRoomBackground(liveRoom.id, '', currentUser.uid);
      showToast(res.message);
    } else {
      livoStore.setVoiceRoomPersonalBg(currentUser.uid, '');
      setPersonalBg(undefined);
      if (isOwnerOrAdmin && liveRoom.backgroundUrl) {
        livoStore.setVoiceRoomBackground(liveRoom.id, '', currentUser.uid);
      }
      showToast('تمت استعادة الخلفية الافتراضية ✓');
    }
    setBgPreviewValue(ROOM_BG_PRESETS[0].value);
    setShowBgPicker(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 select-none animate-in fade-in">
      <GiftAnimationOverlay
        gift={activeGiftAnim}
        senderName={giftSender}
        onFinished={() => setActiveGiftAnim(null)}
      />

      <div
        style={getBgStyle(effectiveBackground)}
        className="relative w-full max-w-[440px] h-[100dvh] text-white flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300"
      >
        {/* Contrast Scrim so mics, seats, usernames & buttons stay crystal clear on any background */}
        <div className="pointer-events-none absolute inset-0 bg-black/45 z-0" />

        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg text-center max-w-[90%] animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Top Room Bar */}
        <div className="p-3 pt-5 flex items-center justify-between border-b border-purple-900/40 bg-black/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleExitButtonTap}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors shrink-0"
              title="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded shrink-0">
                  12 مايك
                </span>
                <h3 className="font-bold text-xs text-white truncate max-w-[140px]">{liveRoom.title}</h3>
              </div>
              <div className="text-[10px] text-purple-300 flex items-center gap-1 mt-0.5">
                <span className="text-amber-400 font-semibold truncate">{liveRoom.ownerName}</span>
                <LivoVerifiedBadge size={11} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-purple-800/40 text-[11px] text-purple-200">
              <Users className="w-3 h-3 text-amber-400" />
              <span className="font-digits font-extrabold">
                {seats.filter(s => s.occupiedByUid).length || 1}
              </span>
            </div>

            {isOwnerOrAdmin && (
              <button
                onClick={() => {
                  const next = livoStore.toggleRoomAllChat(liveRoom.id);
                  showToast(next ? 'تم قفل الشات للجميع 🔒' : 'تم فتح الشات للجميع 💬');
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  liveRoom.allChatDisabled ? 'bg-red-600 text-white' : 'bg-black/40 text-purple-300 hover:text-white'
                }`}
                title="قفل/فتح شات الغرفة"
              >
                <MessageSquareOff className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={openBackgroundPicker}
              className="px-2.5 h-8 rounded-full bg-purple-900/70 hover:bg-purple-800 border border-purple-500/40 flex items-center gap-1 text-amber-300 text-[10px] font-black transition-colors"
              title="تغيير الخلفية"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>تغيير الخلفية</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(`https://livo.live/room/${liveRoom.id}`);
                showToast('تم نسخ رابط الغرفة 📋');
              }}
              className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-purple-300 hover:text-white"
              title="مشاركة الغرفة"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleExitButtonTap}
              className="w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 flex items-center justify-center text-white"
              title="إغلاق / خروج"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 12 Seats Stage (4 x 3) */}
        <div className="relative z-10 flex-1 overflow-y-auto px-3 py-3 flex flex-col justify-between">
          {liveRoom.announcement && (
            <div className="bg-purple-950/60 border border-amber-500/30 rounded-xl px-3 py-1.5 text-[11px] text-amber-200 text-center truncate mb-2">
              {liveRoom.announcement}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 text-center my-auto">
            {seats.map((seat, index) => {
              const isOccupied = Boolean(seat.occupiedByUid);
              const isMe = seat.occupiedByUid === currentUser.uid;
              const seatNumber = index + 1;

              return (
                <div
                  key={index}
                  onClick={() => handleSeatClick(index)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {isOccupied ? (
                      <div className="relative">
                        <div
                          className={`w-13 h-13 rounded-full p-0.5 shadow-lg ${
                            index === 0
                              ? 'bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-amber-500/30'
                              : isMe
                              ? 'bg-gradient-to-tr from-emerald-400 to-cyan-400'
                              : 'bg-gradient-to-tr from-purple-400 to-pink-500'
                          }`}
                        >
                          <img
                            src={seat.occupiedByAvatar || '/assets/livo/customer_icon.jpg'}
                            alt={seat.occupiedByName}
                            className="w-full h-full rounded-full object-cover border border-black"
                          />
                        </div>

                        {/* Seat #1 Owner Crown */}
                        {index === 0 && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[8px] font-black px-1.5 rounded-full shadow">
                            المالك 1
                          </span>
                        )}

                        {/* Mic Mute Status Badge */}
                        {seat.isMuted ? (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 border border-black flex items-center justify-center">
                            <MicOff className="w-2.5 h-2.5 text-white" />
                          </span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border border-black flex items-center justify-center animate-pulse">
                            <Mic className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </div>
                    ) : seat.isLocked ? (
                      <div className="w-12 h-12 rounded-full border border-dashed border-red-500/60 bg-black/40 flex items-center justify-center text-red-400">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-black/40 border border-purple-800/40 flex flex-col items-center justify-center text-purple-300 group-hover:border-amber-400 group-hover:scale-105 transition-all">
                        <Mic className="w-4 h-4 text-amber-300/80" />
                        <span className="text-[8px] font-digits font-bold text-purple-300">{seatNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-0.5 mt-1 max-w-[68px] truncate">
                    <span className="text-[10px] text-purple-200 truncate font-semibold">
                      {isOccupied ? seat.occupiedByName : seatNumber === 1 ? 'مقعد المالك' : `مايك ${seatNumber}`}
                    </span>
                    {seat.isVerified && <LivoVerifiedBadge size={10} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Room Chat Messages */}
          <div className="h-32 overflow-y-auto px-1 space-y-1.5 my-2 text-xs flex flex-col justify-end">
            {roomMessages.length === 0 ? (
              <div className="text-[11px] text-purple-300/60 text-center py-4">
                أهلاً بك في الغرفة — اكتب رسالة لبدء المحادثة
              </div>
            ) : (
              roomMessages.slice(-8).map((m) => (
                <div
                  key={m.id}
                  className={`p-1.5 px-2.5 rounded-xl flex items-center gap-1.5 w-fit max-w-[92%] text-[11px] ${
                    m.isVip
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : 'bg-black/50 text-white border border-purple-900/40'
                  }`}
                >
                  <span className="font-bold text-amber-400 shrink-0">{m.user}:</span>
                  {m.isVerified && <LivoVerifiedBadge size={11} />}
                  <span className="break-words">{m.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="p-3 bg-black/80 backdrop-blur-lg border-t border-purple-900/50 flex items-center justify-between gap-2 z-20">
          <button
            onClick={() => setShowGiftsTray(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 transition-all shrink-0"
            title="إرسال هدية"
          >
            <Gift className="w-5 h-5" />
          </button>

          <form onSubmit={handleSendMessage} className="flex-1 flex items-center bg-[#1b0825] border border-purple-800/60 rounded-full px-3 py-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={liveRoom.allChatDisabled && !isOwnerOrAdmin ? 'الكتابة مقفلة حالياً' : 'اكتب رسالة في الروم...'}
              disabled={(liveRoom.allChatDisabled || isUserMutedInRoom) && !isOwnerOrAdmin}
              className="w-full bg-transparent text-xs text-white placeholder-purple-400/50 outline-none"
            />
            <button type="submit" className="text-purple-300 hover:text-amber-400 p-1">
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {mySeat && (
            <button
              onClick={() => {
                livoStore.leaveRoomSeat(liveRoom.id, currentUser.uid);
                showToast('نزلت من المايك');
              }}
              className="px-2.5 h-9 rounded-full bg-red-950/70 border border-red-700/60 text-red-200 text-[10px] font-bold shrink-0"
              title="النزول من المايك"
            >
              نزول
            </button>
          )}

          <button
            onClick={handleBottomMicToggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
              mySeat && !isMyMicMuted
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-purple-900/60 border-purple-700/60 text-purple-200'
            }`}
            title={mySeat ? (isMyMicMuted ? 'فتح المايك' : 'كتم المايك') : 'الصعود على المايك'}
          >
            {mySeat && !isMyMicMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Exit Confirm Modal for Owner/Admin */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#1a0a2a] border border-purple-700/60 rounded-3xl p-5 w-full max-w-xs text-center space-y-3 shadow-2xl">
              <h4 className="font-black text-sm text-white">مغادرة الغرفة</h4>
              <p className="text-xs text-purple-200">
                هل تريد إغلاق الغرفة للجميع أم الخروج مع بقاء الغرفة مفتوحة؟
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleCloseAndLeave(true)}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black"
                >
                  إغلاق الغرفة نهائياً للجميع
                </button>
                <button
                  onClick={() => handleCloseAndLeave(false)}
                  className="w-full py-2.5 rounded-xl bg-purple-800/70 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  خروج فقط (إبقاء الغرفة مفتوحة)
                </button>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-2 rounded-xl bg-black/40 text-purple-300 text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seat Moderation Modal */}
        {moderationSeat && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#1a0a2a] rounded-t-3xl border-t border-purple-600 p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-black text-white">
                      إدارة المقعد {moderationSeat.seatIndex + 1}
                      {moderationSeat.occupiedByName ? ` — ${moderationSeat.occupiedByName}` : ''}
                    </h4>
                    <span className="text-[10px] text-purple-300">تحكم المالك والمشرفين</span>
                  </div>
                </div>
                <button
                  onClick={() => setModerationSeat(null)}
                  className="w-7 h-7 rounded-full bg-purple-900/40 text-purple-300 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                {moderationSeat.occupiedByUid && (
                  <>
                    <button
                      onClick={() => {
                        livoStore.kickFromSeat(liveRoom.id, moderationSeat.seatIndex);
                        setModerationSeat(null);
                        showToast('تم تنزيل المستخدم من المايك');
                      }}
                      className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2"
                    >
                      <UserX className="w-4 h-4 text-amber-400" />
                      <span>تنزيل من المايك</span>
                    </button>

                    <button
                      onClick={() => {
                        const next = livoStore.toggleSeatMute(liveRoom.id, moderationSeat.seatIndex);
                        setModerationSeat(null);
                        showToast(next ? 'تم كتم المايك' : 'تم إلغاء كتم المايك');
                      }}
                      className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2"
                    >
                      <VolumeX className="w-4 h-4 text-orange-400" />
                      <span>{moderationSeat.isMuted ? 'إلغاء الكتم' : 'كتم المايك'}</span>
                    </button>

                    <button
                      onClick={() => {
                        livoStore.setUserRoomMute(liveRoom.id, moderationSeat.occupiedByUid!, true);
                        setModerationSeat(null);
                        showToast('تم منع المستخدم من الكتابة');
                      }}
                      className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2"
                    >
                      <MessageSquareOff className="w-4 h-4 text-yellow-400" />
                      <span>منع الكتابة</span>
                    </button>

                    <button
                      onClick={() => {
                        livoStore.banUserFromRoom(liveRoom.id, moderationSeat.occupiedByUid!);
                        setModerationSeat(null);
                        showToast('تم طرد المستخدم وحظره من الغرفة');
                      }}
                      className="bg-red-950/60 hover:bg-red-900 border border-red-800/60 p-2.5 rounded-xl flex items-center gap-2 text-red-300"
                    >
                      <Ban className="w-4 h-4 text-red-400" />
                      <span>طرد من الغرفة</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    const nextLocked = livoStore.toggleSeatLock(liveRoom.id, moderationSeat.seatIndex);
                    setModerationSeat(null);
                    showToast(nextLocked ? 'تم قفل المقعد 🔒' : 'تم فتح المقعد 🔓');
                  }}
                  className="col-span-2 bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  {moderationSeat.isLocked ? (
                    <Unlock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-blue-400" />
                  )}
                  <span>{moderationSeat.isLocked ? 'فتح المقعد' : 'قفل المقعد'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Gifts Tray */}
        {showGiftsTray && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#1a0a2a] rounded-t-3xl border-t border-purple-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-900/50 pb-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-white">متجر الهدايا</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-digits text-amber-300 font-bold">
                    {currentUser.coins.toLocaleString()} 🪙
                  </span>
                  <button
                    onClick={() => setShowGiftsTray(false)}
                    className="w-7 h-7 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto">
                {gifts.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSendGift(g)}
                    className="p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 hover:border-amber-400 flex flex-col items-center gap-1 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-125 transition-transform">{g.icon}</span>
                    <span className="text-[10px] font-bold text-white truncate max-w-full">{g.name}</span>
                    <span className="text-[9px] font-digits text-amber-300 font-bold">{g.coins.toLocaleString()} 🪙</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voice Room Background Customization Modal */}
        {showBgPicker && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#170b2c] rounded-t-3xl border-t border-purple-600/70 p-4 space-y-3.5 max-h-[90dvh] overflow-y-auto text-right">
              <div className="flex items-center justify-between border-b border-purple-800/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-black text-white">تغيير خلفية الغرفة الصوتية</h4>
                    <p className="text-[10px] text-purple-300">اختر من الخلفيات الجاهزة أو ارفع صورة من جهازك</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBgPicker(false)}
                  className="w-8 h-8 rounded-full bg-purple-900/50 text-purple-200 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Room Background Preview */}
              <div>
                <span className="text-[11px] font-bold text-purple-200 block mb-1.5">معاينة مباشرة قبل التطبيق:</span>
                <div
                  style={getBgStyle(bgPreviewValue)}
                  className="relative h-28 rounded-2xl border border-amber-400/50 overflow-hidden flex items-center justify-center shadow-lg"
                >
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative z-10 flex items-center gap-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-full bg-black/50 border border-amber-400/70 flex items-center justify-center">
                          <Mic className="w-3.5 h-3.5 text-amber-300" />
                        </div>
                        <span className="text-[9px] font-bold text-white drop-shadow">مايك {n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scope Selection: Personal vs Entire Room */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-purple-200 block">نطاق الخلفية:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBgScope('personal')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-black border transition-all ${
                      bgScope === 'personal'
                        ? 'bg-[#FFE600] text-black border-amber-400'
                        : 'bg-[#120824] text-purple-200 border-purple-800/60'
                    }`}
                  >
                    خلفية شخصية لي فقط
                  </button>
                  <button
                    type="button"
                    disabled={!isOwnerOrAdmin}
                    onClick={() => isOwnerOrAdmin && setBgScope('room')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-black border transition-all ${
                      !isOwnerOrAdmin
                        ? 'bg-black/30 text-purple-400/50 border-purple-900/40 cursor-not-allowed'
                        : bgScope === 'room'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-[#120824] text-purple-200 border-purple-800/60'
                    }`}
                  >
                    {isOwnerOrAdmin ? 'خلفية للغرفة (للجميع)' : 'خلفية للغرفة (للمالك فقط 🔒)'}
                  </button>
                </div>
              </div>

              {/* Built-in Curated Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-purple-200 block">الخلفيات الجاهزة:</span>
                <div className="grid grid-cols-3 gap-2">
                  {ROOM_BG_PRESETS.map((preset) => {
                    const isSelected = bgPreviewValue === preset.value;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBgPreviewValue(preset.value)}
                        className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all text-right ${
                          isSelected ? 'border-[#FFE600] scale-[1.02]' : 'border-purple-800/50 opacity-85 hover:opacity-100'
                        }`}
                        style={getBgStyle(preset.value)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {isSelected && (
                          <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#FFE600] text-black flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <span className="absolute bottom-1 right-1.5 left-1.5 text-[9px] font-bold text-white truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Custom Background from Phone Gallery */}
              <label className="w-full py-2.5 px-3 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-dashed border-purple-500/60 text-purple-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>اختيار صورة من معرض الهاتف</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGalleryImageUpload}
                />
              </label>

              {/* Apply & Reset Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyBackground}
                  className="col-span-2 py-2.5 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs shadow-lg"
                >
                  تطبيق الخلفية الآن
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultBackground}
                  className="py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-[11px] flex items-center justify-center gap-1"
                  title="استعادة الخلفية الافتراضية"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>الافتراضية</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
