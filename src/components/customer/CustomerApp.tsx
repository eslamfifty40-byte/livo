import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Mic, MicOff, Radio, ShieldAlert, Video, X, Coins, Sparkles, PhoneCall, PhoneOff } from 'lucide-react';
import { InAppNotification, SplashBannerConfig, UserProfile, VoiceRoom } from '../../types';
import { HagoBottomNav, HagoTab } from './HagoBottomNav';
import { PartyView } from './PartyView';
import { DiscoverView } from './DiscoverView';
import { HagoMessagesView } from './HagoMessagesView';
import { HagoProfileView } from './HagoProfileView';
import { RechargeModal } from './RechargeModal';
import { StoreModal } from './StoreModal';
import { AgencyModal } from './AgencyModal';
import { VerificationModal } from './VerificationModal';
import { WithdrawalModal } from './WithdrawalModal';
import { SettingsModal } from './SettingsModal';
import { AuthModal } from './AuthModal';
import { AdCenterModal } from './AdCenterModal';
import { SupportTicketsModal } from './SupportTicketsModal';
import { LevelCenterModal } from './LevelCenterModal';
import { ChargingAgentModal } from './ChargingAgentModal';
import { DistributorAgentModal } from './DistributorAgentModal';
import { GiftHistoryModal } from './GiftHistoryModal';
import { RoyalVoiceRoomModal } from './RoyalVoiceRoomModal';
import { LiveStreamView } from './LiveStreamView';
import { livoStore } from '../../services/livoStore';
import { firebaseService } from '../../services/firebase';
import { directCallAudio, DirectCallSnapshot } from '../../services/directCallAudio';

interface CustomerAppProps {
  currentUser: UserProfile | null;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<HagoTab>('party');
  const [chatTargetUid, setChatTargetUid] = useState<string | null>(null);
  const [rooms, setRooms] = useState<VoiceRoom[]>(() => livoStore.getRooms());

  // Lifted active Voice Room & Video Live state for seamless Mini-Live PiP
  const [activeVoiceRoomId, setActiveVoiceRoomId] = useState<string | null>(null);
  const [voiceRoomMinimized, setVoiceRoomMinimized] = useState(false);
  const [activeLiveRoomId, setActiveLiveRoomId] = useState<string | null>(null);
  const [liveMinimized, setLiveMinimized] = useState(false);
  const lastVoiceRoomRef = useRef<VoiceRoom | null>(null);

  // Customer Modals
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isAgencyOpen, setIsAgencyOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdCenterOpen, setIsAdCenterOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isLevelCenterOpen, setIsLevelCenterOpen] = useState(false);
  const [isChargingAgentOpen, setIsChargingAgentOpen] = useState(false);
  const [isDistributorAgentOpen, setIsDistributorAgentOpen] = useState(false);
  const [isGiftHistoryOpen, setIsGiftHistoryOpen] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Anti-Screenshot Privacy Shield state
  const [privacyVeilActive, setPrivacyVeilActive] = useState(false);
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);

  const [banRefreshTick, setBanRefreshTick] = useState(0);
  const [activeSplash, setActiveSplash] = useState<SplashBannerConfig | null>(null);
  const [shownSplashIds, setShownSplashIds] = useState<Set<string>>(() => new Set());
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => livoStore.getInAppNotifications());
  const [directCallSnap, setDirectCallSnap] = useState<DirectCallSnapshot>(() => directCallAudio.getSnapshot());
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    const checkSplash = () => {
      const candidate = livoStore.getActiveSplashBanner();
      if (candidate && !shownSplashIds.has(candidate.id)) {
        setShownSplashIds((prev) => new Set(prev).add(candidate.id));
        setActiveSplash(candidate);
      }
    };
    checkSplash();
    const unsub = livoStore.subscribe(() => {
      setRooms([...livoStore.getRooms()]);
      setNotifications([...livoStore.getInAppNotifications()]);
      setBanRefreshTick((t) => t + 1);
      checkSplash();
    });
    return () => unsub();
  }, [shownSplashIds]);

  // Auto-dismiss fullscreen Admin splash banner after configured 3 seconds
  useEffect(() => {
    if (!activeSplash) return;
    const ms = activeSplash.durationMs || 3000;
    const timer = setTimeout(() => {
      setActiveSplash(null);
    }, ms);
    return () => clearTimeout(timer);
  }, [activeSplash]);

  // Sync Firebase Auth sessions & redirect logins cleanly without requiring localStorage pre-flag
  useEffect(() => {
    let active = true;
    firebaseService.consumeGoogleRedirectResult().then(async (res) => {
      if (!active) return;
      if (res.user) {
        await livoStore.syncFirebaseUserAsync(res.user);
        setIsAuthOpen(false);
        setAuthNotice(null);
      } else if (res.error) {
        setAuthNotice(res.error);
      }
    });

    const unsubAuth = firebaseService.onAuthStateChanged(async (fbUser) => {
      if (!active) return;
      if (fbUser) {
        await livoStore.syncFirebaseUserAsync(fbUser);
      }
    });
    return () => {
      active = false;
      unsubAuth();
    };
  }, []);

  // Bind Global 1-on-1 Direct Voice Call WebRTC Signaling Manager
  useEffect(() => {
    const unsubCall = directCallAudio.subscribe((snap) => setDirectCallSnap(snap));
    if (currentUser) {
      directCallAudio.bindUser(currentUser.uid, currentUser.displayName, currentUser.avatar);
    } else {
      directCallAudio.unbindUser();
    }
    return () => {
      unsubCall();
    };
  }, [currentUser?.uid, currentUser?.displayName, currentUser?.avatar]);

  useEffect(() => {
    if (directCallSnap.status !== 'connected' || !directCallSnap.connectedAt) {
      setCallSeconds(0);
      return;
    }
    const updateElapsed = () => {
      setCallSeconds(Math.max(0, Math.floor((Date.now() - (directCallSnap.connectedAt || Date.now())) / 1000)));
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [directCallSnap.status, directCallSnap.connectedAt]);

  // Anti-Screenshot shield is OFF only when viewing user's own personal profile ("me") with no active room/live/modals
  const isOwnProfileOnly =
    activeTab === 'me' &&
    !activeVoiceRoomId &&
    !activeLiveRoomId &&
    !isAuthOpen &&
    !isRechargeOpen &&
    !isStoreOpen &&
    !isAgencyOpen &&
    !isVerificationOpen &&
    !isWithdrawalOpen &&
    !isSettingsOpen &&
    !isAdCenterOpen &&
    !isSupportOpen &&
    !isLevelCenterOpen &&
    !isChargingAgentOpen &&
    !isDistributorAgentOpen &&
    !isGiftHistoryOpen;

  const isPrivacyProtected = !isOwnProfileOnly;

  useEffect(() => {
    document.body.dataset.livoPrivacyShield = isPrivacyProtected ? 'protected' : 'self-profile';
    if (!isPrivacyProtected) {
      setPrivacyVeilActive(false);
      return;
    }

    const triggerShieldNotice = () => {
      setPrivacyVeilActive(true);
      setPrivacyToast('🔒 لقطات الشاشة محمية داخل التطبيق — متاحة في حسابك الشخصي فقط');
      setTimeout(() => {
        setPrivacyVeilActive(false);
      }, 1400);
      setTimeout(() => {
        setPrivacyToast(null);
      }, 2800);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = (e.key || '').toLowerCase();
      const isPrintScreen = e.key === 'PrintScreen';
      const isCaptureShortcut =
        (e.ctrlKey || e.metaKey) && e.shiftKey && ['s', '3', '4', '5', '6'].includes(k);
      const isPrintShortcut = (e.ctrlKey || e.metaKey) && k === 'p';
      if (isPrintScreen || isCaptureShortcut || isPrintShortcut) {
        e.preventDefault();
        try {
          navigator.clipboard?.writeText('');
        } catch {
          // ignore
        }
        triggerShieldNotice();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO')) {
        e.preventDefault();
      }
    };

    const handleWindowBlur = () => {
      if (isPrivacyProtected) setPrivacyVeilActive(true);
    };

    const handleWindowFocus = () => {
      setPrivacyVeilActive(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPrivacyProtected) {
        setPrivacyVeilActive(true);
      } else {
        setPrivacyVeilActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPrivacyProtected]);

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  const handleLogout = async () => {
    setActiveVoiceRoomId(null);
    setVoiceRoomMinimized(false);
    setActiveLiveRoomId(null);
    setLiveMinimized(false);
    try {
      livoStore.logoutSession();
      await firebaseService.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setActiveTab('party');
    setChatTargetUid(null);
    handleOpenAuth('login');
  };

  const handleStartChatWithUser = (uid: string) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setChatTargetUid(uid);
    setActiveTab('messages');
  };

  const requireAuthThen = (action: () => void) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    action();
  };

  const handleOpenVoiceRoom = (roomId: string) => {
    setActiveVoiceRoomId(roomId);
    setVoiceRoomMinimized(false);
    setActiveLiveRoomId(null);
    setLiveMinimized(false);
  };

  const handleOpenLiveRoom = (roomId: string) => {
    setActiveLiveRoomId(roomId);
    setLiveMinimized(false);
    setActiveVoiceRoomId(null);
    setVoiceRoomMinimized(false);
  };

  const foundVoiceRoom = activeVoiceRoomId
    ? rooms.find(r => r.id === activeVoiceRoomId) || null
    : null;
  if (foundVoiceRoom) {
    lastVoiceRoomRef.current = foundVoiceRoom;
  } else if (!activeVoiceRoomId) {
    lastVoiceRoomRef.current = null;
  }
  const activeVoiceRoom =
    foundVoiceRoom || (activeVoiceRoomId ? lastVoiceRoomRef.current : null);

  const activeLiveRoom = activeLiveRoomId
    ? rooms.find(r => r.id === activeLiveRoomId) || null
    : null;

  const myMiniSeat =
    activeVoiceRoom && currentUser
      ? activeVoiceRoom.seats.find(s => s.occupiedByUid === currentUser.uid) || null
      : null;

  const unreadCount = currentUser
    ? livoStore.getChatThreads(currentUser?.uid).reduce((acc, t) => acc + (t.unreadCount || 0), 0)
    : 0;

  const activeBan = React.useMemo(
    () => (currentUser ? livoStore.getActiveBanForUser(currentUser) : null),
    [currentUser, banRefreshTick]
  );

  return (
    <div
      className={`light-surface flex flex-col w-full h-[100dvh] md:h-[852px] md:max-h-[95vh] md:max-w-[430px] mx-auto bg-white text-gray-900 md:rounded-[44px] md:border-[8px] md:border-[#1c1c1e] md:shadow-[0_25px_70px_rgba(0,0,0,0.45)] overflow-hidden relative select-none ${
        isPrivacyProtected ? 'livo-privacy-protected' : ''
      }`}
    >
      {/* Active Ban Enforcement Lock Screen */}
      {activeBan && (
        <div className="absolute inset-0 z-[85] bg-[#170b2c]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-black text-white">تم تقييد الوصول لهذا الحساب</h3>
          <p className="text-xs text-purple-200 mt-1.5 max-w-xs leading-relaxed">
            نوع العقوبة:{' '}
            <span className="font-bold text-[#FFE600]">
              {activeBan.banType === 'device' ? 'حظر الجهاز' : activeBan.banType === 'both' ? 'حظر الحساب والجهاز' : 'حظر الحساب'}
            </span>
          </p>
          <div className="mt-3 w-full max-w-xs bg-white/10 border border-white/15 rounded-2xl p-3.5 text-right space-y-1.5">
            <p className="text-xs text-gray-100 leading-relaxed">
              <span className="font-bold text-[#FFE600]">السبب: </span>
              {activeBan.reason}
            </p>
            <p className="text-[11px] text-purple-200 font-digits">
              {activeBan.expiresAt
                ? `ينتهي الحظر في: ${new Date(activeBan.expiresAt).toLocaleDateString('ar-EG')}`
                : 'المدة: حظر دائم'}
            </p>
          </div>
          <div className="mt-5 flex flex-col w-full max-w-xs gap-2">
            <button
              onClick={() => setIsSupportOpen(true)}
              className="w-full py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl transition-all"
            >
              تواصل مع الدعم الفني للالتماس
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition-all"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      {/* Privacy Capture Curtain when PrintScreen / blur triggers inside protected pages */}
      {isPrivacyProtected && privacyVeilActive && (
        <div className="absolute inset-0 z-[90] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-[#FFE600]/20 border border-[#FFE600] flex items-center justify-center mb-3">
            <ShieldAlert className="w-8 h-8 text-[#FFE600]" />
          </div>
          <h3 className="font-black text-sm text-[#FFE600]">حماية الخصوصية مفعّلة</h3>
          <p className="text-xs text-gray-300 mt-1 max-w-xs leading-relaxed">
            التقاط الشاشة وتسجيل محتوى الغرف والمحادثات محمي داخل LIVO. يمكنك التصوير فقط داخل صفحة حسابك الشخصي.
          </p>
        </div>
      )}

      {privacyToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[95] bg-gray-950 text-[#FFE600] border border-[#FFE600]/40 px-4 py-2 rounded-full text-[11px] font-black shadow-2xl whitespace-nowrap max-w-[92%] truncate">
          {privacyToast}
        </div>
      )}

      {/* Real-time Unread Recharge / Agency Notification Popup Banner */}
      {(() => {
        const unreadNotif = notifications.find((n) => !n.isRead);
        if (!unreadNotif) return null;
        return (
          <div className="absolute top-12 left-3 right-3 z-[88] bg-gradient-to-r from-[#170b2c] via-[#2b1250] to-[#170b2c] text-white border-2 border-[#FFE600] rounded-2xl p-3 shadow-[0_14px_35px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-3 duration-300">
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFE600] text-black flex items-center justify-center shrink-0 shadow">
                <Coins className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-xs text-[#FFE600] flex items-center gap-1 truncate">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    {unreadNotif.title}
                  </span>
                  <button
                    onClick={() => livoStore.markNotificationRead(unreadNotif.id)}
                    className="text-gray-300 hover:text-white p-0.5 shrink-0"
                    title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-purple-100 mt-0.5 leading-snug">{unreadNotif.body}</p>
                {unreadNotif.type === 'recharge_approved' && (
                  <button
                    onClick={() => {
                      livoStore.markNotificationRead(unreadNotif.id);
                      setActiveTab('me');
                    }}
                    className="mt-1.5 text-[10px] font-black bg-[#FFE600] text-black px-2.5 py-0.5 rounded-lg"
                  >
                    عرض المحفظة ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fullscreen Admin Splash Greeting / Gift Banner (3 Seconds on Launch) */}
      {activeSplash && (
        <div className="absolute inset-0 z-[99] bg-[#140826] flex flex-col items-center justify-center text-white overflow-hidden animate-in fade-in duration-300">
          <img
            src={activeSplash.imageUrl}
            alt={activeSplash.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50" />

          <button
            onClick={() => setActiveSplash(null)}
            className="absolute top-10 left-4 z-20 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/25 text-white text-[11px] font-black hover:bg-black/80"
          >
            تخطي ✕
          </button>

          <div className="relative z-10 mt-auto w-full p-6 pb-10 text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FFE600] text-black text-[10px] font-black shadow-lg">
              ✨ إهداء خاص من إدارة LIVO ✨
            </span>
            <h2 className="text-xl font-black text-white drop-shadow-lg">{activeSplash.title}</h2>
            {(activeSplash.senderName || activeSplash.recipientName) && (
              <p className="text-xs font-black text-[#FFE600]">
                {activeSplash.senderName ? `من: ${activeSplash.senderName}` : ''}{' '}
                {activeSplash.recipientName ? `← إلى: ${activeSplash.recipientName}` : ''}
              </p>
            )}
            {activeSplash.dedicationMessage && (
              <p className="text-xs text-gray-100 bg-black/45 border border-white/15 rounded-2xl px-4 py-2.5 max-w-xs mx-auto leading-relaxed">
                “{activeSplash.dedicationMessage}”
              </p>
            )}
          </div>
        </div>
      )}

      {/* iOS-Style Status Bar & Dynamic Island */}
      <div className="bg-white/95 backdrop-blur-md px-6 pt-2.5 pb-1.5 flex items-center justify-between text-[11px] font-digits font-bold text-gray-900 z-30 select-none border-b border-gray-100/80 shrink-0">
        <span>9:41</span>
        <div className="hidden md:flex w-24 h-[18px] bg-black rounded-full mx-auto items-center justify-end px-2">
          <span className="w-2 h-2 rounded-full bg-[#1a1a2e] border border-gray-800" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-800">
          <span>5G</span>
          <span className="w-4 h-2.5 border border-gray-800 rounded-[3px] p-[1px] flex items-center">
            <span className="w-full h-full bg-gray-900 rounded-[1px]" />
          </span>
        </div>
      </div>

      {/* Guest Quick Sign-In Bar when browsing without an active account */}
      {!currentUser && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] shrink-0">
          <span className="font-bold text-amber-900 truncate">تصفح كزائر • سجّل للدخول للمايك والدردشة</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleOpenAuth('login')}
              className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black px-2.5 py-1 rounded-lg text-[10px] shadow-xs"
            >
              دخول
            </button>
            <button
              onClick={() => handleOpenAuth('signup')}
              className="bg-white border border-amber-300 text-gray-800 font-bold px-2 py-1 rounded-lg text-[10px]"
            >
              حساب جديد
            </button>
          </div>
        </div>
      )}

      {/* Redirect Auth Error Notice (if any) */}
      {authNotice && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] text-red-700 font-bold shrink-0">
          <span className="truncate">{authNotice}</span>
          <button onClick={() => setAuthNotice(null)} className="text-red-900 px-1.5 font-black">×</button>
        </div>
      )}

      {/* Main Screen Content Area (Always mounted to prevent mid-session voice room drops) */}
      <div className="flex-1 overflow-hidden relative bg-[#FAFAFA]">
        {activeTab === 'party' && (
          <PartyView
            currentUser={currentUser}
            onOpenRecharge={() => requireAuthThen(() => setIsRechargeOpen(true))}
            onRequireAuth={() => handleOpenAuth('login')}
            onOpenVoiceRoom={handleOpenVoiceRoom}
            onOpenLiveRoom={handleOpenLiveRoom}
            onStartChat={handleStartChatWithUser}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            currentUser={currentUser}
            onStartChat={handleStartChatWithUser}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {activeTab === 'messages' && (
          <HagoMessagesView
            currentUser={currentUser}
            initialChatPartnerUid={chatTargetUid}
            onClearInitialPartner={() => setChatTargetUid(null)}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {activeTab === 'me' && (
          <HagoProfileView
            user={currentUser}
            onOpenRecharge={() => requireAuthThen(() => setIsRechargeOpen(true))}
            onOpenStore={() => requireAuthThen(() => setIsStoreOpen(true))}
            onOpenAgency={() => requireAuthThen(() => setIsAgencyOpen(true))}
            onOpenVerification={() => requireAuthThen(() => setIsVerificationOpen(true))}
            onOpenWithdrawal={() => requireAuthThen(() => setIsWithdrawalOpen(true))}
            onOpenSettings={() => requireAuthThen(() => setIsSettingsOpen(true))}
            onOpenAds={() => requireAuthThen(() => setIsAdCenterOpen(true))}
            onOpenSupport={() => setIsSupportOpen(true)}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onOpenLevelCenter={() => requireAuthThen(() => setIsLevelCenterOpen(true))}
            onOpenChargingAgent={() => requireAuthThen(() => setIsChargingAgentOpen(true))}
            onOpenDistributorAgent={() => requireAuthThen(() => setIsDistributorAgentOpen(true))}
            onOpenGiftHistory={() => requireAuthThen(() => setIsGiftHistoryOpen(true))}
          />
        )}
      </div>

      {/* Floating Mini-Live / Room PiP Dock ("لايف مصغر") */}
      {activeVoiceRoom && voiceRoomMinimized && (
        <div className="absolute bottom-20 left-3 right-3 z-40 bg-[#180a2b]/95 backdrop-blur-md border border-[#FFE600]/60 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-2xl text-white">
          <div
            onClick={() => setVoiceRoomMinimized(false)}
            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#FFE600] shrink-0">
              <img
                src={activeVoiceRoom.ownerAvatar || '/assets/livo/customer_icon.jpg'}
                alt={activeVoiceRoom.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border border-black animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#FFE600] animate-pulse shrink-0" />
                <span className="truncate">{activeVoiceRoom.title}</span>
              </p>
              <span className="text-[10px] text-purple-200 truncate block">
                لايف مصغر • اضغط للعودة للغرفة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {myMiniSeat && (
              <button
                onClick={() => {
                  const isBlocked = Boolean(
                    myMiniSeat.isMicBlocked ||
                      (currentUser && activeVoiceRoom.micBlockedUsers?.includes(currentUser.uid))
                  );
                  if (isBlocked && currentUser?.role !== 'owner' && currentUser?.role !== 'supervisor') {
                    setPrivacyToast('🔒 تم قفل المايكروفون الخاص بك بواسطة الإدارة');
                    setTimeout(() => setPrivacyToast(null), 2400);
                    return;
                  }
                  livoStore.toggleSeatMute(activeVoiceRoom.id, myMiniSeat.seatIndex, undefined, currentUser?.uid);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  myMiniSeat.isMuted ? 'bg-red-600/80 text-white' : 'bg-emerald-600 text-white'
                }`}
                title={myMiniSeat.isMuted ? 'فتح المايك' : 'كتم المايك'}
              >
                {myMiniSeat.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={() => setVoiceRoomMinimized(false)}
              className="w-8 h-8 rounded-full bg-[#FFE600] text-black flex items-center justify-center"
              title="تكبير الغرفة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (currentUser) livoStore.leaveRoomSeat(activeVoiceRoom.id, currentUser.uid);
                setActiveVoiceRoomId(null);
                setVoiceRoomMinimized(false);
              }}
              className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center"
              title="مغادرة الغرفة"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeLiveRoom && liveMinimized && currentUser && (
        <div className="absolute bottom-20 left-3 right-3 z-40 bg-gray-950/95 backdrop-blur-md border border-rose-500/70 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-2xl text-white">
          <div
            onClick={() => setLiveMinimized(false)}
            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-rose-500 shrink-0">
              <img
                src={activeLiveRoom.ownerAvatar || '/assets/livo/customer_icon.jpg'}
                alt={activeLiveRoom.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 bg-red-600 text-[7px] font-black px-1 rounded">LIVE</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate flex items-center gap-1">
                <Video className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">{activeLiveRoom.title}</span>
              </p>
              <span className="text-[10px] text-rose-200 truncate block">
                بث مباشر مصغر • اضغط للعودة للبث
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setLiveMinimized(false)}
              className="w-8 h-8 rounded-full bg-[#FFE600] text-black flex items-center justify-center"
              title="تكبير البث"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (activeLiveRoom.ownerUid === currentUser.uid) {
                  livoStore.closeAndRemoveRoom(activeLiveRoom.id);
                }
                setActiveLiveRoomId(null);
                setLiveMinimized(false);
              }}
              className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center"
              title="إنهاء البث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4-Tab Bottom Navigation Bar */}
      <HagoBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* iOS Home Indicator */}
      <div className="bg-white pb-1.5 pt-0.5 flex justify-center shrink-0">
        <div className="w-32 h-1 bg-gray-900/80 rounded-full" />
      </div>

      {/* Kept-alive Lifted Royal Voice Room Modal (supports Mini-Live PiP) */}
      {activeVoiceRoom && (
        <RoyalVoiceRoomModal
          room={activeVoiceRoom}
          currentUser={currentUser}
          isOpen={true}
          isMinimized={voiceRoomMinimized}
          onMinimize={() => setVoiceRoomMinimized(true)}
          onClose={() => {
            setActiveVoiceRoomId(null);
            setVoiceRoomMinimized(false);
          }}
          onOpenRecharge={() => requireAuthThen(() => setIsRechargeOpen(true))}
          onRequireAuth={() => handleOpenAuth('login')}
          onStartChat={(uid) => {
            setVoiceRoomMinimized(true);
            handleStartChatWithUser(uid);
          }}
          onAdminLeaveRoom={() => {
            livoStore.closeAndRemoveRoom(activeVoiceRoom.id);
            setActiveVoiceRoomId(null);
            setVoiceRoomMinimized(false);
          }}
        />
      )}

      {/* Kept-alive Lifted Video Live Stream Modal (supports Mini-Live PiP) */}
      {activeLiveRoom && currentUser && (
        <div className={liveMinimized ? 'hidden' : 'fixed inset-0 z-50 bg-black flex items-center justify-center'}>
          <div className="w-full max-w-[430px] h-[100dvh]">
            <LiveStreamView
              currentUser={currentUser}
              room={activeLiveRoom}
              isHost={activeLiveRoom.ownerUid === currentUser.uid}
              onOpenRecharge={() => requireAuthThen(() => setIsRechargeOpen(true))}
              onMinimize={() => setLiveMinimized(true)}
              onClose={() => {
                if (activeLiveRoom.ownerUid === currentUser.uid) {
                  livoStore.closeAndRemoveRoom(activeLiveRoom.id);
                }
                setActiveLiveRoomId(null);
                setLiveMinimized(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Dismissible Auth Overlay (never blocks or unmounts main app shell) */}
      {isAuthOpen && (
        <div className="absolute inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center md:p-2 animate-in fade-in">
          <div className="w-full h-full md:h-auto md:max-h-[92%] bg-white md:rounded-3xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            <AuthModal
              isOpen={isAuthOpen}
              canClose={true}
              initialMode={authInitialMode}
              onClose={() => setIsAuthOpen(false)}
              onSuccess={() => setIsAuthOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Global Customer Modals */}
      {currentUser && (
        <>
          <RechargeModal
            user={currentUser}
            isOpen={isRechargeOpen}
            onClose={() => setIsRechargeOpen(false)}
          />

          <StoreModal
            user={currentUser}
            isOpen={isStoreOpen}
            onClose={() => setIsStoreOpen(false)}
            onOpenRecharge={() => {
              setIsStoreOpen(false);
              setIsRechargeOpen(true);
            }}
          />

          <AgencyModal
            user={currentUser}
            isOpen={isAgencyOpen}
            onClose={() => setIsAgencyOpen(false)}
          />

          <VerificationModal
            user={currentUser}
            isOpen={isVerificationOpen}
            onClose={() => setIsVerificationOpen(false)}
          />

          <WithdrawalModal
            user={currentUser}
            isOpen={isWithdrawalOpen}
            onClose={() => setIsWithdrawalOpen(false)}
          />

          <SettingsModal
            user={currentUser}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSwitchAccount={() => handleOpenAuth('login')}
            onLogout={handleLogout}
          />

          <AdCenterModal
            isOpen={isAdCenterOpen}
            onClose={() => setIsAdCenterOpen(false)}
            currentUser={currentUser}
          />

          <LevelCenterModal
            user={currentUser}
            isOpen={isLevelCenterOpen}
            onClose={() => setIsLevelCenterOpen(false)}
            onOpenRecharge={() => {
              setIsLevelCenterOpen(false);
              setIsRechargeOpen(true);
            }}
          />

          <ChargingAgentModal
            agent={currentUser}
            isOpen={isChargingAgentOpen}
            onClose={() => setIsChargingAgentOpen(false)}
          />

          <DistributorAgentModal
            agent={currentUser}
            isOpen={isDistributorAgentOpen}
            onClose={() => setIsDistributorAgentOpen(false)}
          />

          <GiftHistoryModal
            user={currentUser}
            isOpen={isGiftHistoryOpen}
            onClose={() => setIsGiftHistoryOpen(false)}
          />
        </>
      )}

      <SupportTicketsModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        currentUser={currentUser}
      />

      {/* Global Real-Time 1-on-1 WebRTC Voice Call Overlay */}
      {directCallSnap.status !== 'idle' && (
        <div className="absolute inset-0 z-[92] bg-[#140826]/95 backdrop-blur-xl text-white flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-[#FFE600]/25 blur-xl animate-pulse" />
            <img
              src={directCallSnap.peerAvatar || '/assets/livo/customer_icon.jpg'}
              alt={directCallSnap.peerName}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#FFE600] shadow-2xl relative z-10"
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">{directCallSnap.peerName || `UID ${directCallSnap.peerUid}`}</h3>
            <p className="text-xs font-bold text-amber-300 font-digits">
              {directCallSnap.status === 'ringing_in'
                ? '📞 مكالمة صوتية واردة...'
                : directCallSnap.status === 'ringing_out'
                ? 'جاري الاتصال والرن...'
                : directCallSnap.status === 'connecting'
                ? 'جاري تأمين الصوت المباشر...'
                : directCallSnap.status === 'connected'
                ? `متصل صوتياً الآن • ${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`
                : 'تم إنهاء المكالمة'}
            </p>
            {directCallSnap.error && (
              <p className="text-xs text-red-400 font-bold mt-2">{directCallSnap.error}</p>
            )}
          </div>

          {directCallSnap.status === 'ringing_in' ? (
            <div className="flex items-center gap-6 pt-4">
              <button
                type="button"
                onClick={() => void directCallAudio.declineIncomingCall()}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl"
                title="رفض المكالمة"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={() => void directCallAudio.acceptIncomingCall()}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl animate-bounce"
                title="قبول المكالمة"
              >
                <PhoneCall className="w-7 h-7" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5 pt-4">
              <button
                type="button"
                onClick={() => directCallAudio.toggleMute()}
                className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-lg ${
                  directCallSnap.isMuted
                    ? 'bg-red-500/20 border-red-400 text-red-300'
                    : 'bg-white/15 border-white/25 text-white'
                }`}
                title={directCallSnap.isMuted ? 'فتح المايكروفون' : 'كتم المايكروفون'}
              >
                {directCallSnap.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button
                type="button"
                onClick={() => void directCallAudio.hangup()}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl"
                title="إنهاء المكالمة"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

