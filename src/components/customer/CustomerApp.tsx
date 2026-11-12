import React, { useState } from 'react';
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

interface CustomerAppProps {
  currentUser: UserProfile;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ currentUser }) => {
  // Tabs: party (الحفلة), discover (اكتشف), messages (الرسائل), me (حسابي)
  const [activeTab, setActiveTab] = useState<HagoTab>('party');

  // Customer Modals (Zero Admin - purely customer social experience)
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

  // Authentication Modals (Login, Signup, Social, Phone OTP)
  // Requirement 1 & 9: Show login screen on start unless already authenticated, and prevent reappearing once logged in until logout
  const [isAuthOpen, setIsAuthOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('livo_auth_logged_in') !== 'true';
  });
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('livo_auth_logged_in');
      await firebaseService.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    // Switch to first regular user or clear and open auth modal
    const users = livoStore.getUsers();
    const guestUser = users.find(u => u.role === 'user' && u.email !== 'livo.admin@gmail.com') || users[1];
    if (guestUser) {
      livoStore.setCurrentUser(guestUser.uid);
    }
    handleOpenAuth('login');
  };

  const threads = livoStore.getChatThreads(currentUser.uid);
  const unreadCount = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

  return (
    <div className="flex flex-col w-full h-[100dvh] md:h-[840px] md:max-h-[95vh] md:max-w-[430px] mx-auto bg-white text-gray-900 md:rounded-[40px] md:border-[7px] md:border-gray-900 md:shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden relative select-none">
      
      {/* Mobile Status Bar */}
      <div className="bg-white px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-digits font-bold text-gray-900 z-30 select-none border-b border-gray-50">
        <span>7:55</span>
        <div className="hidden md:block w-20 h-4 bg-gray-900 rounded-full mx-auto" />
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>LTE</span>
          <span>72%</span>
        </div>
      </div>

      {/* Main Screen Content Area */}
      <div className="flex-1 overflow-hidden relative bg-[#FAFAFA]">
        {activeTab === 'party' && (
          <PartyView
            currentUser={currentUser}
            onOpenRecharge={() => setIsRechargeOpen(true)}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'messages' && (
          <HagoMessagesView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'me' && (
          <HagoProfileView
            user={currentUser}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenStore={() => setIsStoreOpen(true)}
            onOpenAgency={() => setIsAgencyOpen(true)}
            onOpenVerification={() => setIsVerificationOpen(true)}
            onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAds={() => setIsAdCenterOpen(true)}
            onOpenSupport={() => setIsSupportOpen(true)}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onOpenLevelCenter={() => setIsLevelCenterOpen(true)}
            onOpenChargingAgent={() => setIsChargingAgentOpen(true)}
            onOpenDistributorAgent={() => setIsDistributorAgentOpen(true)}
            onOpenGiftHistory={() => setIsGiftHistoryOpen(true)}
          />
        )}
      </div>

      {/* 4-Tab Bottom Navigation Bar (party, discover, messages, me) */}
      <HagoBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* Global Customer Modals */}
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
        }}
      />

      {/* Real Advertisement Center Modal */}
      <AdCenterModal
        isOpen={isAdCenterOpen}
        onClose={() => setIsAdCenterOpen(false)}
        currentUser={currentUser}
      />

      {/* Real Support Tickets & Complaints Modal */}
      <SupportTicketsModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        currentUser={currentUser}
      />

      {/* Level Center Modal (0 - 50) */}
      <LevelCenterModal
        user={currentUser}
        isOpen={isLevelCenterOpen}
        onClose={() => setIsLevelCenterOpen(false)}
        onOpenRecharge={() => {
          setIsLevelCenterOpen(false);
          setIsRechargeOpen(true);
        }}
      />

      {/* Charging Agent Modal */}
      <ChargingAgentModal
        agent={currentUser}
        isOpen={isChargingAgentOpen}
        onClose={() => setIsChargingAgentOpen(false)}
      />

      {/* Distributor Agent Modal */}
      <DistributorAgentModal
        agent={currentUser}
        isOpen={isDistributorAgentOpen}
        onClose={() => setIsDistributorAgentOpen(false)}
      />

      {/* Gift History Modal */}
      <GiftHistoryModal
        user={currentUser}
        isOpen={isGiftHistoryOpen}
        onClose={() => setIsGiftHistoryOpen(false)}
      />
    </div>
  );
};
