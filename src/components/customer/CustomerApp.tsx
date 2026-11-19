import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
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
import { livoStore } from '../../services/livoStore';
import { firebaseService } from '../../services/firebase';

interface CustomerAppProps {
  currentUser: UserProfile | null;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<HagoTab>('party');
  const [chatTargetUid, setChatTargetUid] = useState<string | null>(null);

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

  // Non-destructive Firebase Auth listener: keeps active sessions synced without kicking out users mid-session
  useEffect(() => {
    const unsubAuth = firebaseService.onAuthStateChanged((fbUser) => {
      if (fbUser && localStorage.getItem('livo_auth_logged_in') === 'true') {
        livoStore.syncFirebaseUser(fbUser);
      }
    });
    return () => unsubAuth();
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  const handleLogout = async () => {
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

  const unreadCount = currentUser
    ? livoStore.getChatThreads(currentUser?.uid).reduce((acc, t) => acc + (t.unreadCount || 0), 0)
    : 0;

  return (
    <div className="light-surface flex flex-col w-full h-[100dvh] md:h-[852px] md:max-h-[95vh] md:max-w-[430px] mx-auto bg-white text-gray-900 md:rounded-[44px] md:border-[8px] md:border-[#1c1c1e] md:shadow-[0_25px_70px_rgba(0,0,0,0.45)] overflow-hidden relative select-none">
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

      {/* Main Screen Content Area (Always mounted to prevent mid-session voice room drops) */}
      <div className="flex-1 overflow-hidden relative bg-[#FAFAFA]">
        {activeTab === 'party' && (
          <PartyView
            currentUser={currentUser}
            onOpenRecharge={() => requireAuthThen(() => setIsRechargeOpen(true))}
            onRequireAuth={() => handleOpenAuth('login')}
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
    </div>
  );
};
