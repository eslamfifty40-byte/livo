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
  Check,
  Settings,
  Smile,
  ShieldCheck,
  UserCheck,
  Music,
  Play,
  Pause,
  Volume2,
  Minimize2,
  Trophy,
  EyeOff,
  Eye,
  Gamepad2,
  Dices,
  Heart,
  Search
} from 'lucide-react';
import { UserProfile, GiftItem, VoiceRoom, RoomSeat, RoomGameEvent } from '../../types';
import { livoStore } from '../../services/livoStore';
import { roomRtcAudio } from '../../services/roomRtcAudio';
import { GiftAnimationOverlay } from './GiftAnimationOverlay';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { UserNameWithBadges } from '../common/UserNameWithBadges';
import { compressImageForFirestore } from '../../utils/imageCompression';

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

const SMALL_EMOJIS = ['😂', '❤️', '🔥', '👏', '😍', '👑', '🎉', '🌹', '🥳', '💎', '✨', '😎', '🤩', '🫶', '🎵', '🥂'];
const BIG_EMOJIS = ['😂', '❤️‍🔥', '👑', '🎉', '🌹', '💎', '🔥', '🦁', '🦋', '🥂', '🫶', '✨'];

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

interface AmbientTrack {
  id: string;
  label: string;
  bpm: number;
  notes: number[];
}

const AMBIENT_TRACKS: AmbientTrack[] = [
  { id: 'lofi', label: 'إيقاع LIVO هادئ 🌙', bpm: 84, notes: [261.63, 329.63, 392.0, 493.88, 392.0, 329.63] },
  { id: 'oud', label: 'نغمة شرقية دافئة 🎶', bpm: 92, notes: [293.66, 349.23, 440.0, 523.25, 440.0, 369.99] },
  { id: 'party', label: 'إيقاع حفلات خفيف ⚡', bpm: 112, notes: [329.63, 392.0, 493.88, 587.33, 493.88, 392.0] }
];

interface RoyalVoiceRoomModalProps {
  room: VoiceRoom;
  currentUser: UserProfile | null;
  isOpen: boolean;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onClose: () => void;
  onOpenRecharge: () => void;
  onRequireAuth?: () => void;
  onAdminLeaveRoom?: () => void;
}

export const RoyalVoiceRoomModal: React.FC<RoyalVoiceRoomModalProps> = ({
  room,
  currentUser,
  isOpen,
  isMinimized = false,
  onMinimize,
  onClose,
  onOpenRecharge,
  onRequireAuth,
  onAdminLeaveRoom
}) => {
  const [liveRoom, setLiveRoom] = useState<VoiceRoom>(room);
  const [gifts, setGifts] = useState<GiftItem[]>(livoStore.getActiveGifts());
  const [showGiftsTray, setShowGiftsTray] = useState(false);
  const [giftCount, setGiftCount] = useState<number>(1);
  const [giftRecipientUids, setGiftRecipientUids] = useState<string[]>([]);
  const [giftTargetAll, setGiftTargetAll] = useState<boolean>(false);
  const [giftCategory, setGiftCategory] = useState<string>('الكل');
  const [giftSearch, setGiftSearch] = useState<string>('');
  const [pendingCardGift, setPendingCardGift] = useState<GiftItem | null>(null);
  const [cardMessageText, setCardMessageText] = useState<string>('');
  const [giftAnimQueue, setGiftAnimQueue] = useState<Array<{
    gift: GiftItem;
    senderName: string;
    recipientName?: string;
    cardMessage?: string;
    count: number;
  }>>([]);
  const lastSeenBlastIdRef = useRef<string | null>(room.latestGiftBlast?.id || null);
  const lastSeenGameIdRef = useRef<string | null>(room.latestGameEvent?.id || null);

  // Room Cup, Stealth, Mini Games & Speaking Detection
  const [showSupportersModal, setShowSupportersModal] = useState(false);
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [couplePartner1, setCouplePartner1] = useState<string>('');
  const [couplePartner2, setCouplePartner2] = useState<string>('');
  const [activeGameOverlay, setActiveGameOverlay] = useState<RoomGameEvent | null>(null);
  const [speakingUids, setSpeakingUids] = useState<Record<string, boolean>>({});
  const [isStealth, setIsStealth] = useState<boolean>(() =>
    Boolean(currentUser && room.stealthUids?.includes(currentUser.uid))
  );

  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiMode, setEmojiMode] = useState<'small' | 'large'>('small');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [newModUidInput, setNewModUidInput] = useState('');

  // In-Room Music Player state (Local Audio File OR Built-in WebAudio Ambient Synthesizer)
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.45);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('lofi');
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');
  const localAudioElRef = useRef<HTMLAudioElement | null>(null);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const webAudioTimerRef = useRef<number | null>(null);
  const webAudioGainRef = useRef<GainNode | null>(null);

  // Voice Room Background Customization State
  const [personalBg, setPersonalBg] = useState<string | undefined>(() =>
    currentUser ? livoStore.getVoiceRoomPersonalBg(currentUser?.uid) : undefined
  );
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgPreviewValue, setBgPreviewValue] = useState<string>(ROOM_BG_PRESETS[0].value);
  const [bgScope, setBgScope] = useState<'personal' | 'room'>('personal');

  // Selected Seat for Moderation (ONLY for moderating OTHER users or locked/empty seats)
  const [moderationSeat, setModerationSeat] = useState<RoomSeat | null>(null);

  useEffect(() => {
    const sync = () => {
      const latest = livoStore.getRoomById(room.id);
      if (latest) {
        setLiveRoom(latest);
        if (latest.latestGiftBlast && latest.latestGiftBlast.id !== lastSeenBlastIdRef.current) {
          lastSeenBlastIdRef.current = latest.latestGiftBlast.id;
          const ageMs = Date.now() - new Date(latest.latestGiftBlast.createdAt).getTime();
          if (ageMs < 12000) {
            const b = latest.latestGiftBlast;
            setGiftAnimQueue((prev) => [
              ...prev,
              {
                gift: {
                  id: b.giftId,
                  name: b.giftName,
                  coins: b.coinsEach,
                  icon: b.giftIcon,
                  imageUrl: b.giftImageUrl,
                  animationType: b.animationType,
                  isCard: Boolean(b.cardMessage || b.animationType === 'card'),
                  durationMs: b.animationType === 'lion' ? 3800 : b.cardMessage ? 3800 : 3000
                },
                senderName: b.senderName,
                recipientName: b.recipientName,
                cardMessage: b.cardMessage,
                count: b.count
              }
            ]);
          }
        }
        if (latest.latestGameEvent && latest.latestGameEvent.id !== lastSeenGameIdRef.current) {
          lastSeenGameIdRef.current = latest.latestGameEvent.id;
          const ageMs = Date.now() - new Date(latest.latestGameEvent.createdAt).getTime();
          if (ageMs < 9000) {
            setActiveGameOverlay(latest.latestGameEvent);
          }
        }
      }
      if (currentUser) {
        setPersonalBg(livoStore.getVoiceRoomPersonalBg(currentUser?.uid));
      }
      setGifts(livoStore.getActiveGifts());
    };
    sync();
    const unsub = livoStore.subscribe(sync);
    return () => unsub();
  }, [room.id, currentUser?.uid]);

  // Auto-dismiss Mini-Game overlay (3 seconds for couple heart / dice)
  useEffect(() => {
    if (!activeGameOverlay) return;
    const ms = activeGameOverlay.type === 'couple_heart' ? 3000 : 2800;
    const timer = setTimeout(() => setActiveGameOverlay(null), ms);
    return () => clearTimeout(timer);
  }, [activeGameOverlay]);

  const targetSeatCount: 6 | 12 = liveRoom.seatCount === 6 ? 6 : 12;

  // Build active seat array (6 or 12)
  const seats: RoomSeat[] = Array.from({ length: targetSeatCount }, (_, idx) => {
    const existing = liveRoom.seats?.find(s => s.seatIndex === idx);
    return existing || { seatIndex: idx, isMuted: false, isLocked: false };
  });

  const mySeat = currentUser ? seats.find(s => s.occupiedByUid === currentUser?.uid) || null : null;
  const isMyMicBlocked = Boolean(
    mySeat?.isMicBlocked || (currentUser && liveRoom.micBlockedUsers?.includes(currentUser.uid))
  );
  const isMyMicMuted = mySeat ? Boolean(mySeat.isMuted || isMyMicBlocked) : true;

  // Manage real WebRTC multi-peer audio mesh & speaking detection
  useEffect(() => {
    if (!isOpen || !currentUser) {
      roomRtcAudio.stop();
      return;
    }
    roomRtcAudio.start({
      roomId: liveRoom.id,
      myUid: currentUser.uid,
      onSpeakingChange: setSpeakingUids,
      onMicError: (errMsg) => setToastMessage(errMsg)
    });
  }, [isOpen, liveRoom.id, currentUser?.uid]);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const peerUids = new Set<string>();
    if (liveRoom.ownerUid && liveRoom.ownerUid !== currentUser.uid) {
      peerUids.add(liveRoom.ownerUid);
    }
    seats.forEach((s) => {
      if (s.occupiedByUid && s.occupiedByUid !== currentUser.uid) {
        peerUids.add(s.occupiedByUid);
      }
    });
    roomRtcAudio.syncPeers(Array.from(peerUids));
  }, [isOpen, currentUser?.uid, liveRoom.ownerUid, liveRoom.seats]);

  useEffect(() => {
    if (!isOpen) return;
    const shouldSpeak = Boolean(mySeat && !mySeat.isMuted && !isMyMicBlocked);
    roomRtcAudio.setMicEnabled(shouldSpeak);
  }, [isOpen, mySeat?.seatIndex, mySeat?.isMuted, isMyMicBlocked]);

  // Sync room music playback (Local File OR Built-in WebAudio Synth)
  const stopAmbientSynth = () => {
    if (webAudioTimerRef.current !== null) {
      window.clearInterval(webAudioTimerRef.current);
      webAudioTimerRef.current = null;
    }
    if (webAudioCtxRef.current && webAudioCtxRef.current.state === 'running') {
      webAudioCtxRef.current.suspend().catch(() => {});
    }
  };

  useEffect(() => {
    if (localAudioElRef.current) {
      localAudioElRef.current.volume = musicVolume;
    }
    if (webAudioGainRef.current) {
      webAudioGainRef.current.gain.value = musicVolume * 0.16;
    }
  }, [musicVolume]);

  useEffect(() => {
    if (!musicPlaying || !isOpen) {
      stopAmbientSynth();
      if (localAudioElRef.current && !localAudioElRef.current.paused) {
        localAudioElRef.current.pause();
      }
      return;
    }

    if (customAudioUrl && localAudioElRef.current) {
      stopAmbientSynth();
      localAudioElRef.current.volume = musicVolume;
      localAudioElRef.current.play().catch(() => {});
      return;
    }

    // Play synthesized ambient preset safely
    if (localAudioElRef.current && !localAudioElRef.current.paused) {
      localAudioElRef.current.pause();
    }
    const preset = AMBIENT_TRACKS.find(t => t.id === selectedPresetId) || AMBIENT_TRACKS[0];
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!webAudioCtxRef.current) {
      webAudioCtxRef.current = new AudioCtx();
    }
    const ctx = webAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!webAudioGainRef.current) {
      webAudioGainRef.current = ctx.createGain();
      webAudioGainRef.current.connect(ctx.destination);
    }
    webAudioGainRef.current.gain.value = musicVolume * 0.16;

    let step = 0;
    const playStep = () => {
      if (!webAudioCtxRef.current || !webAudioGainRef.current) return;
      const now = webAudioCtxRef.current.currentTime;
      const osc = webAudioCtxRef.current.createOscillator();
      const noteGain = webAudioCtxRef.current.createGain();
      osc.type = 'sine';
      const freq = preset.notes[step % preset.notes.length];
      osc.frequency.setValueAtTime(freq, now);
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.9, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(noteGain);
      noteGain.connect(webAudioGainRef.current);
      osc.start(now);
      osc.stop(now + 0.6);
      step += 1;
    };
    playStep();
    const stepMs = Math.round((60 / preset.bpm) * 1000);
    webAudioTimerRef.current = window.setInterval(playStep, stepMs);

    return () => {
      stopAmbientSynth();
    };
  }, [musicPlaying, isOpen, customAudioUrl, selectedPresetId]);

  useEffect(() => {
    return () => {
      stopAmbientSynth();
      if (webAudioCtxRef.current) {
        webAudioCtxRef.current.close().catch(() => {});
        webAudioCtxRef.current = null;
      }
      if (customAudioUrl) {
        URL.revokeObjectURL(customAudioUrl);
      }
      roomRtcAudio.stop();
    };
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const isTopOwner = Boolean(
    currentUser &&
      (currentUser?.role === 'owner' ||
        currentUser?.role === 'supervisor' ||
        livoStore.isOwnerEmail(currentUser?.email) ||
        liveRoom.ownerUid === currentUser?.uid)
  );

  const isOwnerOrMod = Boolean(
    currentUser && livoStore.isRoomModerator(liveRoom, currentUser?.uid, currentUser)
  );

  const canUseStealth = Boolean(currentUser && livoStore.canUserStealth(currentUser));

  const isUserMutedInRoom = Boolean(
    currentUser && liveRoom.mutedUsers?.includes(currentUser?.uid)
  );

  const ensureAuthenticated = (): UserProfile | null => {
    if (!currentUser) {
      showToast('سجّل الدخول أولاً للمشاركة بالمايك والدردشة');
      onRequireAuth?.();
      return null;
    }
    return currentUser;
  };

  const handleCloseAndLeave = (closeRoomForAll: boolean = false) => {
    setMusicPlaying(false);
    stopAmbientSynth();
    if (localAudioElRef.current) {
      localAudioElRef.current.pause();
    }
    roomRtcAudio.stop();

    if (currentUser && isStealth) {
      livoStore.toggleRoomStealth(liveRoom.id, currentUser.uid, false);
    }

    if (closeRoomForAll && isTopOwner) {
      if (onAdminLeaveRoom) {
        onAdminLeaveRoom();
      } else {
        livoStore.closeAndRemoveRoom(liveRoom.id);
      }
    } else if (currentUser) {
      livoStore.leaveRoomSeat(liveRoom.id, currentUser?.uid);
    }
    onClose();
  };

  const handleExitButtonTap = () => {
    if (isTopOwner) {
      setShowExitConfirm(true);
    } else {
      handleCloseAndLeave(false);
    }
  };

  /**
   * Seat Click Logic:
   * 1. Clicking YOUR OWN occupied seat (including Owner on Seat #1): toggles mute/unmute IN PLACE.
   * 2. Clicking ANOTHER user's occupied seat as Owner/Mod: opens Moderation Menu.
   * 3. Clicking ANY unlocked EMPTY seat (even while seated elsewhere): smoothly vacates old seat and moves to target seat without duplication!
   */
  const handleSeatClick = (index: number) => {
    const actor = ensureAuthenticated();
    if (!actor) return;

    const targetSeat = seats[index];

    if (targetSeat.occupiedByUid === actor.uid) {
      if (isMyMicBlocked && !isOwnerOrMod && (targetSeat.isMuted || isMyMicBlocked)) {
        showToast('تم قفل المايكروفون الخاص بك بواسطة الإدارة 🔒');
        return;
      }
      const nextMuted = livoStore.toggleSeatMute(liveRoom.id, index, undefined, actor.uid);
      showToast(nextMuted ? 'تم كتم المايك الخاص بك 🔇' : 'تم فتح المايك الخاص بك 🎙️');
      return;
    }

    if (targetSeat.occupiedByUid) {
      if (isOwnerOrMod) {
        setModerationSeat(targetSeat);
      } else {
        showToast(`المستخدم ${targetSeat.occupiedByName} على المايك`);
      }
      return;
    }

    if (targetSeat.isLocked && !isOwnerOrMod) {
      showToast('هذا المقعد مقفل بواسطة المالك 🔒');
      return;
    }

    if (targetSeat.isLocked && isOwnerOrMod) {
      setModerationSeat(targetSeat);
      return;
    }

    const res = livoStore.joinRoomSeat(liveRoom.id, index, actor.uid);
    showToast(res.message);
  };

  const handleBottomMicToggle = () => {
    const actor = ensureAuthenticated();
    if (!actor) return;

    if (!mySeat) {
      const startIdx = isOwnerOrMod ? 0 : 1;
      const freeSeat = seats.find(s => s.seatIndex >= startIdx && !s.occupiedByUid && !s.isLocked);
      if (!freeSeat) {
        showToast('لا توجد مقاعد شاغرة حالياً');
        return;
      }
      const res = livoStore.joinRoomSeat(liveRoom.id, freeSeat.seatIndex, actor.uid);
      showToast(res.message);
      return;
    }
    if (isMyMicBlocked && !isOwnerOrMod) {
      showToast('تم قفل المايكروفون الخاص بك بواسطة الإدارة 🔒');
      return;
    }
    const nextMuted = livoStore.toggleSeatMute(liveRoom.id, mySeat.seatIndex, undefined, actor.uid);
    showToast(nextMuted ? 'تم كتم المايك 🔇' : 'تم فتح المايك 🎙️');
  };

  const handleToggleRecipientUid = (uid: string) => {
    setGiftTargetAll(false);
    setGiftRecipientUids((prev) =>
      prev.includes(uid) ? prev.filter((item) => item !== uid) : [...prev, uid]
    );
  };

  const executeGiftSend = (gift: GiftItem, customCardMsg?: string) => {
    const actor = ensureAuthenticated();
    if (!actor) return;

    const occupiedCount = Math.max(1, occupiedUsersForGifts.length);
    const recipientsLen = giftTargetAll
      ? occupiedCount
      : Math.max(1, giftRecipientUids.length);
    const totalCost = gift.coins * giftCount * recipientsLen;

    if (actor.coins < totalCost) {
      showToast(`رصيد الكوينز غير كافٍ (${totalCost.toLocaleString()} كوينز مطلوب)`);
      onOpenRecharge();
      return;
    }

    const res = livoStore.sendGiftInRoom({
      roomId: liveRoom.id,
      senderUid: actor.uid,
      giftId: gift.id,
      recipientUids: giftTargetAll ? undefined : giftRecipientUids,
      targetAll: giftTargetAll,
      cardMessage: customCardMsg?.trim() || undefined,
      count: giftCount
    });
    if (!res.success) {
      showToast(res.message);
      return;
    }

    if (res.blast) {
      lastSeenBlastIdRef.current = res.blast.id;
      setGiftAnimQueue((prev) => [
        ...prev,
        {
          gift,
          senderName: actor.displayName,
          recipientName: res.blast!.recipientName,
          cardMessage: res.blast!.cardMessage,
          count: giftCount
        }
      ]);
    }
    setPendingCardGift(null);
    setCardMessageText('');
    setShowGiftsTray(false);
  };

  const handleGiftCardOrTap = (gift: GiftItem) => {
    if (gift.isCard || gift.animationType === 'card') {
      setPendingCardGift(gift);
      return;
    }
    executeGiftSend(gift);
  };

  const handleToggleStealth = () => {
    if (!currentUser || !canUseStealth) return;
    const next = !isStealth;
    setIsStealth(next);
    livoStore.toggleRoomStealth(liveRoom.id, currentUser.uid, next);
    showToast(
      next
        ? 'تم تفعيل وضع التخفي 👻 — أنت غير مرئي الآن'
        : 'تم تفعيل الظهور الآن 👁️'
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const actor = ensureAuthenticated();
    if (!actor) return;
    if (!chatInput.trim()) return;

    if ((liveRoom.allChatDisabled || isUserMutedInRoom) && !isOwnerOrMod) {
      showToast('الكتابة في الدردشة مقفلة حالياً بواسطة الإدارة');
      return;
    }

    livoStore.appendRoomMessage(liveRoom.id, {
      uid: actor.uid,
      user: actor.displayName,
      text: chatInput.trim(),
      isVip: actor.role === 'owner' || actor.coins > 5000,
      isVerified: actor.isVerified,
      verifiedBadgeColor: actor.verifiedBadgeColor,
      verifiedBadgeShape: actor.verifiedBadgeShape,
      verifiedBadgeGlow: actor.verifiedBadgeGlow,
      nameGlowColor: actor.nameGlowColor,
      customIconUrl: actor.customIconUrl,
      customIconGlow: actor.customIconGlow,
      customIconAnimated: actor.customIconAnimated,
      emojiSize: 'small'
    });
    setChatInput('');
  };

  const handlePickEmoji = (emojiChar: string) => {
    if (emojiMode === 'small') {
      setChatInput(prev => `${prev}${emojiChar}`);
      return;
    }
    const actor = ensureAuthenticated();
    if (!actor) return;
    if ((liveRoom.allChatDisabled || isUserMutedInRoom) && !isOwnerOrMod) {
      showToast('الكتابة في الدردشة مقفلة حالياً بواسطة الإدارة');
      return;
    }
    livoStore.appendRoomMessage(liveRoom.id, {
      uid: actor.uid,
      user: actor.displayName,
      text: emojiChar,
      isVip: actor.role === 'owner' || actor.coins > 5000,
      isVerified: actor.isVerified,
      verifiedBadgeColor: actor.verifiedBadgeColor,
      verifiedBadgeShape: actor.verifiedBadgeShape,
      verifiedBadgeGlow: actor.verifiedBadgeGlow,
      nameGlowColor: actor.nameGlowColor,
      customIconUrl: actor.customIconUrl,
      customIconGlow: actor.customIconGlow,
      customIconAnimated: actor.customIconAnimated,
      emojiSize: 'large'
    });
    setShowEmojiPicker(false);
  };

  const roomMessages = liveRoom.messages || [];
  const effectiveBackground = personalBg || liveRoom.backgroundUrl || ROOM_BG_PRESETS[0].value;
  const occupiedUsersForGifts = seats.filter(s => Boolean(s.occupiedByUid));

  const openBackgroundPicker = () => {
    setBgPreviewValue(effectiveBackground);
    setBgScope(isOwnerOrMod && liveRoom.backgroundUrl && !personalBg ? 'room' : 'personal');
    setShowBgPicker(true);
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageForFirestore(file, {
        maxDim: 960,
        quality: 0.78,
        maxBytes: 220_000
      });
      setBgPreviewValue(compressed);
    } catch {
      showToast('تعذر قراءة الصورة المختارة');
    }
  };

  const handleApplyBackground = () => {
    const actor = ensureAuthenticated();
    if (!actor) return;
    if (bgScope === 'room') {
      if (!isOwnerOrMod) {
        showToast('تغيير خلفية الغرفة للجميع متاح لصاحب الغرفة أو الإدارة فقط');
        return;
      }
      const res = livoStore.setVoiceRoomBackground(liveRoom.id, bgPreviewValue, actor.uid);
      showToast(res.message);
    } else {
      livoStore.setVoiceRoomPersonalBg(actor.uid, bgPreviewValue);
      setPersonalBg(bgPreviewValue);
      showToast('تم حفظ الخلفية الشخصية لك بنجاح ✓');
    }
    setShowBgPicker(false);
  };

  const handleResetDefaultBackground = () => {
    const actor = ensureAuthenticated();
    if (!actor) return;
    if (bgScope === 'room' && isOwnerOrMod) {
      const res = livoStore.setVoiceRoomBackground(liveRoom.id, '', actor.uid);
      showToast(res.message);
    } else {
      livoStore.setVoiceRoomPersonalBg(actor.uid, '');
      setPersonalBg(undefined);
      if (isOwnerOrMod && liveRoom.backgroundUrl) {
        livoStore.setVoiceRoomBackground(liveRoom.id, '', actor.uid);
      }
      showToast('تمت استعادة الخلفية الافتراضية ✓');
    }
    setBgPreviewValue(ROOM_BG_PRESETS[0].value);
    setShowBgPicker(false);
  };

  const handleLocalAudioPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (customAudioUrl) {
      URL.revokeObjectURL(customAudioUrl);
    }
    const nextUrl = URL.createObjectURL(file);
    setCustomAudioUrl(nextUrl);
    setCustomAudioName(file.name);
    setMusicPlaying(true);
    showToast(`تم تشغيل: ${file.name} 🎵`);
  };

  return (
    <div
      className={
        isMinimized
          ? 'hidden'
          : 'fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 select-none animate-in fade-in'
      }
    >
      {customAudioUrl && (
        <audio ref={localAudioElRef} src={customAudioUrl} loop playsInline className="hidden" />
      )}
      <GiftAnimationOverlay
        gift={giftAnimQueue[0]?.gift || null}
        senderName={giftAnimQueue[0]?.senderName || ''}
        recipientName={giftAnimQueue[0]?.recipientName}
        cardMessage={giftAnimQueue[0]?.cardMessage}
        count={giftAnimQueue[0]?.count || 1}
        onFinished={() => setGiftAnimQueue((prev) => prev.slice(1))}
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

        {/* Active Mini-Game Centerpiece Overlay (3s Couple Big Heart / Dice Roll) */}
        {activeGameOverlay && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
            {activeGameOverlay.type === 'couple_heart' ? (
              <div className="livo-couple-heart relative flex flex-col items-center justify-center">
                <div className="relative w-64 h-56 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center text-[190px] leading-none drop-shadow-[0_0_35px_rgba(236,72,153,0.9)]">
                    ❤️
                  </div>
                  <div className="relative z-10 flex items-center gap-3 -mt-3">
                    <div className="flex flex-col items-center">
                      <img
                        src={activeGameOverlay.partner1Avatar || '/assets/livo/customer_icon.jpg'}
                        alt={activeGameOverlay.partner1Name}
                        className="w-16 h-16 rounded-full object-cover border-[3px] border-[#FFE600] shadow-xl"
                      />
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-black/70 text-[#FFE600] text-[10px] font-black max-w-[78px] truncate">
                        {activeGameOverlay.partner1Name}
                      </span>
                    </div>
                    <span className="text-2xl animate-pulse">💘</span>
                    <div className="flex flex-col items-center">
                      <img
                        src={activeGameOverlay.partner2Avatar || '/assets/livo/customer_icon.jpg'}
                        alt={activeGameOverlay.partner2Name}
                        className="w-16 h-16 rounded-full object-cover border-[3px] border-[#FFE600] shadow-xl"
                      />
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-black/70 text-[#FFE600] text-[10px] font-black max-w-[78px] truncate">
                        {activeGameOverlay.partner2Name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-1 px-4 py-1 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white text-xs font-black border border-white/60 shadow-2xl">
                  💖 قلب الثنائي الملكي
                </div>
              </div>
            ) : (
              <div className="livo-dice-roll bg-[#170b2c]/95 border-2 border-[#FFE600] rounded-3xl px-7 py-5 text-center shadow-[0_20px_50px_rgba(255,230,0,0.45)]">
                <div className="text-6xl leading-none mb-2">🎲</div>
                <p className="text-xs text-purple-200 font-bold">{activeGameOverlay.actorName} رمى النرد</p>
                <div className="mt-1 text-3xl font-digits font-black text-[#FFE600]">
                  {activeGameOverlay.diceValue}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Room Bar */}
        <div className="p-2.5 pt-3.5 flex items-center justify-between border-b border-purple-900/40 bg-black/55 backdrop-blur-md z-20 gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={handleExitButtonTap}
              className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors shrink-0"
              title="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[9px] bg-[#FFE600] text-black font-black px-1.5 py-0.5 rounded shrink-0">
                  {targetSeatCount} مايك
                </span>
                <h3 className="font-bold text-xs text-white truncate max-w-[85px]">{liveRoom.title}</h3>
              </div>
              {(() => {
                const roomOwner = livoStore.getUserByUid(liveRoom.ownerUid);
                return (
                  <div className="text-[10px] text-purple-300 flex items-center gap-1 mt-0.5 max-w-[115px]">
                    <UserNameWithBadges
                      displayName={roomOwner?.displayName || liveRoom.ownerName}
                      nameGlowColor={roomOwner?.nameGlowColor}
                      isVerified={roomOwner?.isVerified ?? liveRoom.isOfficial}
                      verifiedBadgeColor={roomOwner?.verifiedBadgeColor || 'gold'}
                      verifiedBadgeShape={roomOwner?.verifiedBadgeShape || 'rosette'}
                      verifiedBadgeGlow={roomOwner?.verifiedBadgeGlow}
                      customIconUrl={roomOwner?.customIconUrl}
                      customIconGlow={roomOwner?.customIconGlow}
                      customIconAnimated={roomOwner?.customIconAnimated}
                      badgeSize={11}
                      iconSize={14}
                      nameClassName="text-amber-400 font-semibold text-[10px]"
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canUseStealth && (
              <button
                onClick={handleToggleStealth}
                className={`px-2 h-7 rounded-full text-[9px] font-black flex items-center gap-1 border transition-colors ${
                  isStealth
                    ? 'bg-emerald-500 text-black border-emerald-300 shadow'
                    : 'bg-purple-950/80 text-purple-200 border-purple-600/50'
                }`}
                title={isStealth ? 'أنت متخفي الآن — اضغط لتفعيل الظهور' : 'تفعيل الدخول المتخفي'}
              >
                {isStealth ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{isStealth ? 'تفعيل الظهور' : 'تخفي'}</span>
              </button>
            )}

            {/* Room Supporters Cup 🏆 Button (next to Settings) */}
            {(() => {
              const topSup = livoStore.getRoomSupporters(liveRoom.id)[0];
              return (
                <button
                  onClick={() => setShowSupportersModal(true)}
                  className="h-7 px-2 rounded-full bg-gradient-to-r from-amber-500/90 to-yellow-400/90 text-black flex items-center gap-1 text-[10px] font-black shadow border border-amber-200/70 hover:scale-105 transition-transform"
                  title="كأس الداعمين في الغرفة"
                >
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[52px] truncate hidden sm:inline">
                    {topSup ? topSup.displayName : 'الكأس'}
                  </span>
                </button>
              );
            })()}

            {isOwnerOrMod && (
              <button
                onClick={() => setShowSettingsDrawer(true)}
                className="w-7 h-7 rounded-full bg-[#FFE600] hover:bg-yellow-400 text-black flex items-center justify-center shadow transition-colors"
                title="إعدادات الغرفة والمشرفين"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowMusicPanel(v => !v)}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                musicPlaying
                  ? 'bg-emerald-600/80 border-emerald-400 text-white animate-pulse'
                  : 'bg-purple-900/70 hover:bg-purple-800 border-purple-500/40 text-purple-200'
              }`}
              title="تشغيل موسيقى داخل الغرفة"
            >
              <Music className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={openBackgroundPicker}
              className="w-7 h-7 rounded-full bg-purple-900/70 hover:bg-purple-800 border border-purple-500/40 flex items-center justify-center text-amber-300 transition-colors"
              title="تغيير الخلفية من ملفاتي"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(`https://livo.live/room/${liveRoom.id}`);
                showToast('تم نسخ رابط الغرفة 📋');
              }}
              className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-purple-300 hover:text-white"
              title="مشاركة الغرفة"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {onMinimize && (
              <button
                onClick={onMinimize}
                className="w-7 h-7 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center"
                title="لايف مصغر (تصغير الغرفة)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleExitButtonTap}
              className="w-7 h-7 rounded-full bg-red-600/80 hover:bg-red-600 flex items-center justify-center text-white"
              title="إغلاق / خروج"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* In-Room Music Player Panel */}
        {showMusicPanel && (
          <div className="relative z-30 mx-3 mt-2 bg-[#160826]/95 border border-purple-600/60 rounded-2xl p-3 space-y-2.5 shadow-2xl text-right animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#FFE600] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                مشغل موسيقى الغرفة
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMusicPlaying(p => !p)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
                    musicPlaying ? 'bg-emerald-500 text-white' : 'bg-[#FFE600] text-black'
                  }`}
                >
                  {musicPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{musicPlaying ? 'إيقاف' : 'تشغيل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMusicPanel(false)}
                  className="w-6 h-6 rounded-full bg-purple-900/60 text-purple-200 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AMBIENT_TRACKS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (customAudioUrl) {
                      URL.revokeObjectURL(customAudioUrl);
                      setCustomAudioUrl(null);
                      setCustomAudioName('');
                    }
                    setSelectedPresetId(t.id);
                    setMusicPlaying(true);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                    !customAudioUrl && selectedPresetId === t.id
                      ? 'bg-purple-600 border-amber-400 text-white'
                      : 'bg-black/40 border-purple-800/60 text-purple-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <label className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-[#FFE600]/90 hover:bg-[#FFE600] text-black cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>{customAudioName ? `ملف: ${customAudioName.slice(0, 14)}` : 'اختر صوت من ملفاتي'}</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleLocalAudioPick} />
              </label>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-purple-200">
              <Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="shrink-0">مستوى الصوت:</span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="flex-1 accent-[#FFE600]"
              />
              <span className="font-digits font-bold w-8 text-left">{Math.round(musicVolume * 100)}%</span>
            </div>
          </div>
        )}

        {/* 6 or 12 Seats Stage */}
        <div className="relative z-10 flex-1 overflow-y-auto px-3 py-2 flex flex-col justify-between min-h-0">
          {liveRoom.announcement && (
            <div className="bg-purple-950/60 border border-amber-500/30 rounded-xl px-3 py-1 text-[11px] text-amber-200 text-center truncate mb-2 shrink-0">
              {liveRoom.announcement}
            </div>
          )}

          <div
            className={`grid gap-2.5 text-center my-auto ${
              targetSeatCount === 6 ? 'grid-cols-3 py-2' : 'grid-cols-4'
            }`}
          >
            {seats.map((seat, index) => {
              const isOccupied = Boolean(seat.occupiedByUid);
              const isMe = Boolean(currentUser && seat.occupiedByUid === currentUser?.uid);
              const seatNumber = index + 1;
              const avatarFrameSize = targetSeatCount === 6 ? 62 : 54;
              const isSeatMod = Boolean(
                seat.occupiedByUid && liveRoom.moderatorUids?.includes(seat.occupiedByUid)
              );

              const seatIsBlocked = Boolean(
                seat.isMicBlocked ||
                  (seat.occupiedByUid && liveRoom.micBlockedUsers?.includes(seat.occupiedByUid))
              );
              const seatIsSpeaking = Boolean(
                seat.occupiedByUid &&
                  !seat.isMuted &&
                  !seatIsBlocked &&
                  speakingUids[seat.occupiedByUid]
              );
              const seatUserProf = seat.occupiedByUid ? livoStore.getUserByUid(seat.occupiedByUid) : undefined;
              const seatAgencyLabel = seat.agencyBadgeLabel || livoStore.getAgencyDisplayLabel(seatUserProf);

              return (
                <div
                  key={index}
                  onClick={() => handleSeatClick(index)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="relative flex items-center justify-center" style={{ width: avatarFrameSize, height: avatarFrameSize }}>
                    {isOccupied ? (
                      <div
                        className={`relative flex items-center justify-center rounded-full ${
                          seatIsSpeaking ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#170b2c] shadow-[0_0_16px_rgba(16,185,129,0.75)]' : ''
                        }`}
                      >
                        <AvatarWithFrame
                          sizePx={avatarFrameSize}
                          avatarUrl={seat.occupiedByAvatar}
                          displayName={seat.occupiedByName}
                          frameUrl={seat.equippedFrameUrl}
                          frameGlowColor={seat.frameGlowColor || (index === 0 ? '#F59E0B' : isMe ? '#10B981' : undefined)}
                          frameAnimated={seat.frameAnimated}
                          customIconUrl={seat.customIconUrl}
                          customIconGlow={seat.customIconGlow}
                          customIconAnimated={seat.customIconAnimated}
                        />

                        {index === 0 && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#FFE600] text-black text-[8px] font-black px-1.5 rounded-full shadow z-20 whitespace-nowrap">
                            المالك 1
                          </span>
                        )}

                        {index !== 0 && isSeatMod && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[8px] font-black px-1.5 rounded-full shadow z-20 whitespace-nowrap">
                            مشرف
                          </span>
                        )}

                        {seatIsBlocked ? (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 px-1 h-4 rounded-full bg-red-700 border border-[#FFE600] flex items-center justify-center text-[8px] font-black text-white z-20"
                            title="المايك مقفل بواسطة الإدارة"
                          >
                            🔒
                          </span>
                        ) : seat.isMuted ? (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 border border-black flex items-center justify-center z-20">
                            <MicOff className="w-2.5 h-2.5 text-white" />
                          </span>
                        ) : (
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border border-black flex items-center justify-center z-20 ${
                              seatIsSpeaking ? 'animate-ping' : 'animate-pulse'
                            }`}
                          >
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

                  <div className="flex flex-col items-center justify-center mt-1 max-w-[88px]">
                    {isOccupied ? (
                      <>
                        <UserNameWithBadges
                          displayName={seat.occupiedByName || ''}
                          nameGlowColor={seat.nameGlowColor}
                          isVerified={seat.isVerified}
                          verifiedBadgeColor={seat.verifiedBadgeColor}
                          verifiedBadgeShape={seat.verifiedBadgeShape}
                          verifiedBadgeGlow={seat.verifiedBadgeGlow}
                          customIconUrl={seat.customIconUrl}
                          customIconGlow={seat.customIconGlow}
                          customIconAnimated={seat.customIconAnimated}
                          badgeSize={10}
                          iconSize={13}
                          nameClassName="text-[10px] font-bold text-purple-100"
                        />
                        {seatAgencyLabel && (
                          <span className="text-[8px] font-black text-[#FFE600] leading-none mt-0.5">
                            {seatAgencyLabel}
                          </span>
                        )}
                        <span className="mt-0.5 px-1.5 py-[1px] rounded-full bg-black/55 border border-amber-400/40 text-[9px] font-digits font-black text-amber-300 leading-none">
                          {(seat.giftsCount || seat.points || 0).toLocaleString()} 🎁
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] truncate font-bold text-purple-100">
                        {seatNumber === 1 ? 'مقعد المالك' : `مايك ${seatNumber}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Room Chat Messages */}
          <div className="h-32 overflow-y-auto px-1 space-y-1.5 my-1 text-xs flex flex-col justify-end shrink-0">
            {roomMessages.length === 0 ? (
              <div className="text-[11px] text-purple-200/75 text-center py-3">
                أهلاً بك في الغرفة — اكتب رسالة أو أرسل إيموشن لبدء الدردشة
              </div>
            ) : (
              roomMessages.slice(-14).map((m) => {
                const senderUser = m.uid ? livoStore.getUserByUid(m.uid) : undefined;
                return (
                <div
                  key={m.id}
                  className={`p-1.5 px-2.5 rounded-xl flex items-center gap-1.5 w-fit max-w-[94%] text-[11px] ${
                    m.isVip
                      ? 'bg-amber-500/20 text-amber-100 border border-amber-500/35'
                      : 'bg-black/55 text-white border border-purple-900/40'
                  }`}
                >
                  <UserNameWithBadges
                    displayName={`${m.user}:`}
                    nameGlowColor={senderUser?.nameGlowColor ?? m.nameGlowColor}
                    isVerified={senderUser?.isVerified ?? m.isVerified}
                    verifiedBadgeColor={senderUser?.verifiedBadgeColor ?? m.verifiedBadgeColor}
                    verifiedBadgeShape={senderUser?.verifiedBadgeShape ?? m.verifiedBadgeShape}
                    verifiedBadgeGlow={senderUser?.verifiedBadgeGlow ?? m.verifiedBadgeGlow}
                    customIconUrl={senderUser?.customIconUrl ?? m.customIconUrl}
                    customIconGlow={senderUser?.customIconGlow ?? m.customIconGlow}
                    customIconAnimated={senderUser?.customIconAnimated ?? m.customIconAnimated}
                    badgeSize={11}
                    iconSize={14}
                    nameClassName="font-bold text-amber-400"
                    className="shrink-0"
                    truncate={false}
                  />
                  <span
                    className={`break-words ${
                      m.emojiSize === 'large' ? 'text-3xl leading-none py-0.5 drop-shadow-md animate-bounce' : ''
                    }`}
                  >
                    {m.text}
                  </span>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Floating Emoji Picker (Small inline vs Large animated emoji) */}
        {showEmojiPicker && (
          <div className="relative z-30 mx-3 mb-2 bg-[#170926]/95 border border-purple-600/60 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center bg-black/50 p-1 rounded-xl border border-purple-800/50 gap-1">
                <button
                  type="button"
                  onClick={() => setEmojiMode('small')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                    emojiMode === 'small' ? 'bg-[#FFE600] text-black' : 'text-purple-200'
                  }`}
                >
                  إيموشن صغير
                </button>
                <button
                  type="button"
                  onClick={() => setEmojiMode('large')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                    emojiMode === 'large' ? 'bg-[#FFE600] text-black' : 'text-purple-200'
                  }`}
                >
                  إيموشن كبير (فوري)
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="w-6 h-6 rounded-full bg-purple-900/60 text-purple-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {(emojiMode === 'small' ? SMALL_EMOJIS : BIG_EMOJIS).map((em, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickEmoji(em)}
                  className={`rounded-xl bg-black/40 hover:bg-purple-800/60 flex items-center justify-center transition-transform active:scale-90 ${
                    emojiMode === 'large' ? 'h-11 text-3xl' : 'h-9 text-xl'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sticky Bottom Toolbar (Visible Chat Input + Games + Emoji + Gift + Mic) */}
        <div className="p-2.5 px-3 bg-black/85 backdrop-blur-lg border-t border-purple-900/50 flex items-center justify-between gap-1.5 z-20 shrink-0">
          <button
            onClick={() => setShowGiftsTray(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 transition-all shrink-0"
            title="إرسال هدية"
          >
            <Gift className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowGamesModal(true)}
            className="w-9 h-9 rounded-full bg-purple-900/80 hover:bg-purple-800 border border-purple-500/50 text-[#FFE600] flex items-center justify-center shrink-0 transition-transform active:scale-95"
            title="ألعاب الغرفة (نرد / قلب الثنائي)"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          <form onSubmit={handleSendMessage} className="flex-1 flex items-center bg-[#1b0825] border border-purple-700/60 rounded-full px-2.5 py-1.5 gap-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(v => !v)}
              className={`p-1 rounded-full transition-colors shrink-0 ${
                showEmojiPicker ? 'text-[#FFE600]' : 'text-purple-300 hover:text-white'
              }`}
              title="إيموشن صغير / كبير"
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                !currentUser
                  ? 'سجّل الدخول للكتابة...'
                  : liveRoom.allChatDisabled && !isOwnerOrMod
                  ? 'الكتابة مقفلة حالياً'
                  : 'اكتب رسالة في الروم...'
              }
              disabled={Boolean(currentUser && (liveRoom.allChatDisabled || isUserMutedInRoom) && !isOwnerOrMod)}
              className="w-full bg-transparent text-xs text-white placeholder-purple-300/60 outline-none"
            />
            <button type="submit" className="text-[#FFE600] hover:text-amber-300 p-1 shrink-0">
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {mySeat && currentUser && (
            <button
              onClick={() => {
                livoStore.leaveRoomSeat(liveRoom.id, currentUser?.uid);
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
              isMyMicBlocked && !isOwnerOrMod
                ? 'bg-red-800 border-red-400 text-white'
                : mySeat && !isMyMicMuted
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-purple-900/60 border-purple-700/60 text-purple-200'
            }`}
            title={
              isMyMicBlocked && !isOwnerOrMod
                ? 'المايك مقفل بواسطة الإدارة'
                : mySeat
                ? isMyMicMuted
                  ? 'فتح المايك'
                  : 'كتم المايك'
                : 'الصعود على المايك'
            }
          >
            {mySeat && !isMyMicMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Room Settings Drawer (6/12 Seats, Room Moderators, Chat Lock, Banned Users) */}
        {showSettingsDrawer && isOwnerOrMod && currentUser && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#180a28] rounded-t-3xl border-t border-purple-500/60 p-4 space-y-4 max-h-[88dvh] overflow-y-auto text-right">
              <div className="flex items-center justify-between border-b border-purple-800/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#FFE600]" />
                  <div>
                    <h4 className="text-sm font-black text-white">إعدادات الغرفة والإشراف</h4>
                    <p className="text-[10px] text-purple-300">تحكم في المقاعد والمشرفين والمحظورين</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="w-8 h-8 rounded-full bg-purple-900/50 text-purple-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 6 vs 12 Seats Toggle */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-amber-300 block">عدد مايكات الغرفة</span>
                <div className="grid grid-cols-2 gap-2">
                  {[6, 12].map((countVal) => (
                    <button
                      key={countVal}
                      type="button"
                      onClick={() => {
                        const res = livoStore.setRoomSeatCount(liveRoom.id, countVal as 6 | 12, currentUser?.uid);
                        showToast(res.message);
                      }}
                      className={`py-2.5 rounded-xl font-black text-xs border transition-all ${
                        targetSeatCount === countVal
                          ? 'bg-[#FFE600] text-black border-amber-300 shadow'
                          : 'bg-black/40 text-purple-200 border-purple-800/60'
                      }`}
                    >
                      {countVal} مقاعد صوتية
                    </button>
                  ))}
                </div>
              </div>

              {/* Global Room Chat Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = livoStore.toggleRoomAllChat(liveRoom.id);
                  showToast(next ? 'تم قفل الشات للجميع 🔒' : 'تم فتح الشات للجميع 💬');
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-between border ${
                  liveRoom.allChatDisabled
                    ? 'bg-red-950/70 border-red-600/60 text-red-200'
                    : 'bg-emerald-950/50 border-emerald-700/50 text-emerald-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MessageSquareOff className="w-4 h-4" />
                  {liveRoom.allChatDisabled ? 'الشات العام مقفول حالياً' : 'الشات العام مفتوح للجميع'}
                </span>
                <span className="bg-black/40 px-2 py-0.5 rounded-lg text-[10px]">
                  {liveRoom.allChatDisabled ? 'اضغط للفتح' : 'اضغط للقفل'}
                </span>
              </button>

              {/* Assign / Remove Room Moderators */}
              {isTopOwner && (
                <div className="space-y-2 border-t border-purple-800/50 pt-3">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    مشرفو الغرفة ({liveRoom.moderatorUids?.length || 0})
                  </span>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newModUidInput}
                      onChange={(e) => setNewModUidInput(e.target.value)}
                      placeholder="أدخل UID العضو لتعيينه مشرفاً..."
                      className="flex-1 bg-black/50 border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white font-digits outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const res = livoStore.toggleRoomModerator(liveRoom.id, newModUidInput, currentUser?.uid);
                        showToast(res.message);
                        if (res.success) setNewModUidInput('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs shrink-0"
                    >
                      تعيين
                    </button>
                  </div>

                  {/* Seated members quick promote */}
                  {seats.some(s => s.occupiedByUid && s.occupiedByUid !== liveRoom.ownerUid) && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-purple-300 block">الأعضاء على المايك حالياً:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {seats
                          .filter(s => s.occupiedByUid && s.occupiedByUid !== liveRoom.ownerUid)
                          .map(s => {
                            const isMod = liveRoom.moderatorUids?.includes(s.occupiedByUid!);
                            return (
                              <button
                                key={s.occupiedByUid}
                                type="button"
                                onClick={() => {
                                  const res = livoStore.toggleRoomModerator(liveRoom.id, s.occupiedByUid!, currentUser?.uid);
                                  showToast(res.message);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                                  isMod
                                    ? 'bg-purple-600 text-white border-purple-400'
                                    : 'bg-black/40 text-purple-200 border-purple-800/50'
                                }`}
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>{s.occupiedByName}</span>
                                <span>{isMod ? '✕ إزالة' : '+ مشرف'}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Active Moderator list */}
                  {(liveRoom.moderatorUids || []).length > 0 && (
                    <div className="space-y-1">
                      {(liveRoom.moderatorUids || []).map((modUid) => {
                        const modUser = livoStore.getUserByUid(modUid);
                        return (
                          <div
                            key={modUid}
                            className="flex items-center justify-between bg-black/40 border border-purple-800/50 rounded-xl px-3 py-1.5 text-xs"
                          >
                            <span>
                              {modUser?.displayName || modUid}{' '}
                              <span className="text-[10px] text-purple-300 font-digits">({modUid})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const res = livoStore.toggleRoomModerator(liveRoom.id, modUid, currentUser?.uid);
                                showToast(res.message);
                              }}
                              className="text-[10px] text-red-400 font-bold hover:underline"
                            >
                              إزالة الإشراف
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Banned Users List */}
              {(liveRoom.bannedUsers || []).length > 0 && (
                <div className="space-y-1.5 border-t border-purple-800/50 pt-3">
                  <span className="text-xs font-black text-red-300 block">
                    المحظورون من الغرفة ({liveRoom.bannedUsers.length})
                  </span>
                  {liveRoom.bannedUsers.map((bUid) => {
                    const bu = livoStore.getUserByUid(bUid);
                    return (
                      <div
                        key={bUid}
                        className="flex items-center justify-between bg-red-950/30 border border-red-800/50 rounded-xl px-3 py-1.5 text-xs"
                      >
                        <span>
                          {bu?.displayName || bUid}{' '}
                          <span className="text-[10px] text-red-200 font-digits">({bUid})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const res = livoStore.unbanUserFromRoom(liveRoom.id, bUid, currentUser?.uid);
                            showToast(res.message);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]"
                        >
                          فك الحظر
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

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
        {moderationSeat && currentUser && (
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
                        const next = livoStore.toggleSeatMute(liveRoom.id, moderationSeat.seatIndex, undefined, currentUser.uid);
                        setModerationSeat(null);
                        showToast(next ? 'تم كتم المايك' : 'تم إلغاء كتم المايك');
                      }}
                      className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700/50 p-2.5 rounded-xl flex items-center gap-2"
                    >
                      <VolumeX className="w-4 h-4 text-orange-400" />
                      <span>{moderationSeat.isMuted ? 'إلغاء الكتم' : 'كتم المايك'}</span>
                    </button>

                    {(() => {
                      const isTargetMicBlocked = Boolean(
                        moderationSeat.isMicBlocked ||
                          (moderationSeat.occupiedByUid && liveRoom.micBlockedUsers?.includes(moderationSeat.occupiedByUid))
                      );
                      return (
                        <button
                          onClick={() => {
                            const res = livoStore.setSeatMicBlocked(
                              liveRoom.id,
                              moderationSeat.seatIndex,
                              !isTargetMicBlocked,
                              currentUser.uid
                            );
                            setModerationSeat(null);
                            showToast(res.message);
                          }}
                          className={`col-span-2 p-2.5 rounded-xl flex items-center justify-center gap-2 border ${
                            isTargetMicBlocked
                              ? 'bg-emerald-900/60 hover:bg-emerald-800 border-emerald-500/60 text-emerald-200'
                              : 'bg-red-900/50 hover:bg-red-800 border-red-500/60 text-red-200'
                          }`}
                        >
                          {isTargetMicBlocked ? (
                            <Unlock className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <Lock className="w-4 h-4 text-red-300" />
                          )}
                          <span>
                            {isTargetMicBlocked
                              ? 'فك قفل المايك عن العضو'
                              : 'قفل المايك نهائياً عن العضو'}
                          </span>
                        </button>
                      );
                    })()}

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

                    {isTopOwner && moderationSeat.occupiedByUid !== liveRoom.ownerUid && (
                      <button
                        onClick={() => {
                          const res = livoStore.toggleRoomModerator(liveRoom.id, moderationSeat.occupiedByUid!, currentUser?.uid);
                          setModerationSeat(null);
                          showToast(res.message);
                        }}
                        className="col-span-2 bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-600/50 p-2.5 rounded-xl flex items-center justify-center gap-2 text-indigo-200"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#FFE600]" />
                        <span>
                          {liveRoom.moderatorUids?.includes(moderationSeat.occupiedByUid)
                            ? 'إزالة صلاحية الإشراف داخل الغرفة'
                            : 'تعيين كمشرف داخل الغرفة'}
                        </span>
                      </button>
                    )}
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

        {/* Room Supporters Cup Modal (🏆) */}
        {showSupportersModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#180a28] rounded-t-3xl border-t border-amber-400/70 p-4 space-y-3 max-h-[80dvh] overflow-y-auto text-right">
              <div className="flex items-center justify-between border-b border-purple-800/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FFE600]" />
                  <div>
                    <h4 className="text-sm font-black text-white">كأس الداعمين في الغرفة</h4>
                    <p className="text-[10px] text-purple-300">ترتيب أعلى المهدين في {liveRoom.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSupportersModal(false)}
                  className="w-7 h-7 rounded-full bg-purple-900/50 text-purple-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(() => {
                const list = livoStore.getRoomSupporters(liveRoom.id);
                if (list.length === 0) {
                  return (
                    <div className="py-10 text-center text-xs text-purple-300">
                      لا يوجد دعم مسجل داخل هذه الغرفة حتى الآن — كن أول الداعمين! 🎁
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {list.map((entry, idx) => (
                      <div
                        key={entry.uid}
                        className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                          idx === 0
                            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-400/70'
                            : 'bg-black/40 border-purple-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-digits font-black shrink-0 ${
                              idx === 0
                                ? 'bg-[#FFE600] text-black'
                                : idx === 1
                                ? 'bg-gray-300 text-black'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-purple-900 text-purple-200'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <img
                            src={entry.avatar}
                            alt={entry.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shrink-0"
                          />
                          <div className="min-w-0">
                            <UserNameWithBadges
                              displayName={entry.displayName}
                              isVerified={entry.isVerified}
                              verifiedBadgeColor={entry.verifiedBadgeColor}
                              agencyLabel={entry.agencyBadgeLabel}
                              badgeSize={12}
                              nameClassName="text-xs font-black text-white"
                            />
                            <span className="text-[10px] text-purple-300 font-digits block">
                              UID: {entry.uid} • {entry.giftsCount} هدية
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-digits font-black text-[#FFE600] shrink-0">
                          {entry.totalCoins.toLocaleString()} 🪙
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* HAGO In-Room Mini Games Modal (🎲 Dice & 💖 Couple Heart) */}
        {showGamesModal && currentUser && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#180a28] rounded-t-3xl border-t border-purple-500/70 p-4 space-y-4 max-h-[82dvh] overflow-y-auto text-right">
              <div className="flex items-center justify-between border-b border-purple-800/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-[#FFE600]" />
                  <div>
                    <h4 className="text-sm font-black text-white">ألعاب التفاعل (HAGO Games)</h4>
                    <p className="text-[10px] text-purple-300">تحديات جماعية تظهر مباشرة لجميع أعضاء الغرفة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGamesModal(false)}
                  className="w-7 h-7 rounded-full bg-purple-900/50 text-purple-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Game 1: Roll Dice */}
              <button
                type="button"
                onClick={() => {
                  const res = livoStore.rollRoomDice(liveRoom.id, currentUser.uid);
                  setShowGamesModal(false);
                  if (!res.success) showToast(res.message);
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900/70 to-purple-900/70 border border-indigo-400/50 hover:border-[#FFE600] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFE600] text-black flex items-center justify-center shadow">
                    <Dices className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <h5 className="text-xs font-black text-white">🎲 لف النرد العشوائي</h5>
                    <p className="text-[10px] text-purple-200">ارمِ النرد وأظهر الرقم للجميع في الشات والغرفة</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#FFE600] text-black text-[11px] font-black">
                  ارمِ الآن
                </span>
              </button>

              {/* Game 2: Couple Big Heart (Select 2 members -> 3s Centerpiece) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-950/70 to-purple-950/70 border border-pink-500/50 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">💖 لعبة قلب الثنائي (3 ثواني)</h5>
                    <p className="text-[10px] text-pink-200">اختر شخصين ليظهرا معاً داخل قلب مضيء في منتصف الغرفة</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <select
                    value={couplePartner1}
                    onChange={(e) => setCouplePartner1(e.target.value)}
                    className="bg-black/55 border border-pink-500/40 rounded-xl px-2.5 py-2 text-white font-bold outline-none"
                  >
                    <option value="">اختر الشخص الأول</option>
                    {occupiedUsersForGifts.map((s) => (
                      <option key={`p1-${s.occupiedByUid}`} value={s.occupiedByUid}>
                        {s.occupiedByName} (مايك {s.seatIndex + 1})
                      </option>
                    ))}
                  </select>

                  <select
                    value={couplePartner2}
                    onChange={(e) => setCouplePartner2(e.target.value)}
                    className="bg-black/55 border border-pink-500/40 rounded-xl px-2.5 py-2 text-white font-bold outline-none"
                  >
                    <option value="">اختر الشخص الثاني</option>
                    {occupiedUsersForGifts.map((s) => (
                      <option key={`p2-${s.occupiedByUid}`} value={s.occupiedByUid}>
                        {s.occupiedByName} (مايك {s.seatIndex + 1})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const res = livoStore.triggerCoupleHeartGame(
                      liveRoom.id,
                      currentUser.uid,
                      couplePartner1,
                      couplePartner2
                    );
                    if (res.success) {
                      setShowGamesModal(false);
                    } else {
                      showToast(res.message);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs shadow-lg"
                >
                  عرض قلب الثنائي للجميع 💖
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Gifts Tray (208+ Gifts, Search, Category Filter, Multi-Seat & All-Seats, Writable Gift Cards) */}
        {showGiftsTray && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
            <div className="bg-[#1a0a2a] rounded-t-3xl border-t border-purple-800/80 p-4 space-y-2.5 max-h-[85dvh] flex flex-col">
              <div className="flex items-center justify-between border-b border-purple-900/50 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-white">متجر الهدايا ({gifts.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-digits text-amber-300 font-bold">
                    {currentUser ? `${currentUser?.coins.toLocaleString()} 🪙` : 'سجّل الدخول للإرسال'}
                  </span>
                  <button
                    onClick={() => {
                      setPendingCardGift(null);
                      setShowGiftsTray(false);
                    }}
                    className="w-7 h-7 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recipient Multi-Select Chips + "All Seats" Toggle + Combo Count */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-purple-200 font-bold">إرسال إلى:</span>
                  <div className="flex items-center gap-1 bg-black/50 border border-purple-800/60 rounded-xl p-0.5">
                    {[1, 5, 10, 20].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setGiftCount(c)}
                        className={`px-2 py-0.5 rounded-lg font-digits font-black transition-all ${
                          giftCount === c ? 'bg-[#FFE600] text-black' : 'text-purple-200'
                        }`}
                      >
                        ×{c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setGiftTargetAll((v) => !v);
                      setGiftRecipientUids([]);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 border transition-all ${
                      giftTargetAll
                        ? 'bg-[#FFE600] text-black border-amber-300'
                        : 'bg-black/45 text-purple-200 border-purple-700/60'
                    }`}
                  >
                    ✨ الكل ({occupiedUsersForGifts.length || 1} مقاعد)
                  </button>
                  {occupiedUsersForGifts.map((s) => {
                    const uid = s.occupiedByUid!;
                    const selected = !giftTargetAll && giftRecipientUids.includes(uid);
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => handleToggleRecipientUid(uid)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 border transition-all ${
                          selected
                            ? 'bg-purple-600 text-white border-[#FFE600]'
                            : 'bg-black/45 text-purple-200 border-purple-800/60'
                        }`}
                      >
                        <img
                          src={s.occupiedByAvatar || '/assets/livo/customer_icon.jpg'}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="max-w-[70px] truncate">{s.occupiedByName}</span>
                        <span className="text-[9px] text-amber-300 font-digits">#{s.seatIndex + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="space-y-1.5 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-purple-300 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={giftSearch}
                    onChange={(e) => setGiftSearch(e.target.value)}
                    placeholder="ابحث بين 200+ هدية وكارت إهداء..."
                    className="w-full bg-black/50 border border-purple-800/60 rounded-xl pr-8 pl-3 py-1.5 text-[11px] text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {['الكل', 'كروت إهداء', 'ملكي', 'حيوانات', 'سيارات وطائرات', 'حب', 'ألماس', 'حفلات'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGiftCategory(cat)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 border ${
                        giftCategory === cat
                          ? 'bg-[#FFE600] text-black border-amber-300'
                          : 'bg-black/40 text-purple-200 border-purple-800/60'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Writable Gift Card Text Prompt when a Card Gift is tapped */}
              {pendingCardGift && (
                <div className="bg-gradient-to-r from-purple-900/90 to-pink-900/80 border border-[#FFE600] rounded-2xl p-3 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#FFE600]">
                      {pendingCardGift.icon} اكتب رسالتك على "{pendingCardGift.name}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingCardGift(null)}
                      className="text-[10px] text-purple-200 underline"
                    >
                      تغيير الهدية
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={90}
                      value={cardMessageText}
                      onChange={(e) => setCardMessageText(e.target.value)}
                      placeholder="اكتب إهداءك هنا ليظهر على الكارت لجميع الأعضاء..."
                      className="flex-1 bg-black/55 border border-pink-400/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => executeGiftSend(pendingCardGift, cardMessageText)}
                      className="px-3.5 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs shrink-0"
                    >
                      إرسال 💌
                    </button>
                  </div>
                </div>
              )}

              {/* Gifts Grid */}
              <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-1 min-h-[190px] max-h-[260px] pr-0.5">
                {gifts
                  .filter((g) => {
                    if (giftCategory !== 'الكل') {
                      if (giftCategory === 'كروت إهداء') {
                        if (!g.isCard && g.category !== 'كروت إهداء') return false;
                      } else if (g.category !== giftCategory) {
                        return false;
                      }
                    }
                    if (giftSearch.trim()) {
                      return g.name.toLowerCase().includes(giftSearch.trim().toLowerCase());
                    }
                    return true;
                  })
                  .map((g) => {
                    const recipientMultiplier = giftTargetAll
                      ? Math.max(1, occupiedUsersForGifts.length)
                      : Math.max(1, giftRecipientUids.length);
                    return (
                      <button
                        key={g.id}
                        onClick={() => handleGiftCardOrTap(g)}
                        className={`p-2 rounded-2xl border flex flex-col items-center gap-1 transition-all group relative ${
                          pendingCardGift?.id === g.id
                            ? 'bg-pink-900/60 border-[#FFE600]'
                            : 'bg-purple-950/40 hover:bg-purple-900/60 border-purple-800/40 hover:border-amber-400'
                        }`}
                      >
                        {g.isCard && (
                          <span className="absolute top-1 left-1 text-[8px] px-1 rounded bg-pink-500 text-white font-black">
                            كارت
                          </span>
                        )}
                        {g.imageUrl ? (
                          <img src={g.imageUrl} alt={g.name} className="w-9 h-9 object-contain group-hover:scale-125 transition-transform" />
                        ) : (
                          <span className="text-3xl group-hover:scale-125 transition-transform">{g.icon}</span>
                        )}
                        <span className="text-[10px] font-bold text-white truncate max-w-full">{g.name}</span>
                        <span className="text-[9px] font-digits text-amber-300 font-bold">
                          {(g.coins * giftCount * recipientMultiplier).toLocaleString()} 🪙
                        </span>
                      </button>
                    );
                  })}
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
                    disabled={!isOwnerOrMod}
                    onClick={() => isOwnerOrMod && setBgScope('room')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-black border transition-all ${
                      !isOwnerOrMod
                        ? 'bg-black/30 text-purple-400/50 border-purple-900/40 cursor-not-allowed'
                        : bgScope === 'room'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-[#120824] text-purple-200 border-purple-800/60'
                    }`}
                  >
                    {isOwnerOrMod ? 'خلفية للغرفة (للجميع)' : 'خلفية للغرفة (للمالك فقط 🔒)'}
                  </button>
                </div>
              </div>

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

              <label className="w-full py-2.5 px-3 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-dashed border-purple-500/60 text-purple-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>اختيار خلفية من ملفاتي / معرض الهاتف 📁</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGalleryImageUpload}
                />
              </label>

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
