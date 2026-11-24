import React, { useState } from 'react';
import {
  Globe,
  Package,
  ShoppingBag,
  Award,
  Mail,
  Clock,
  BarChart3,
  Settings,
  HelpCircle,
  BookOpen,
  Share2,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  X,
  Copy,
  ChevronLeft,
  LogOut,
  LogIn,
  UserPlus,
  Edit3,
  Check,
  Video,
  Play,
  Heart,
  MessageCircle,
  ExternalLink,
  Plus,
  Trash2,
  UserCheck,
  Menu,
  Sparkles,
  Gift
} from 'lucide-react';
import { UserProfile, VideoPost } from '../../types';
import { UserNameWithBadges } from '../common/UserNameWithBadges';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { EditProfileModal } from './EditProfileModal';
import { VideosView } from './VideosView';
import { livoStore, SavedAccountSummary } from '../../services/livoStore';

interface HagoProfileViewProps {
  user: UserProfile | null;
  onOpenRecharge: () => void;
  onOpenStore: () => void;
  onOpenAgency: () => void;
  onOpenVerification: () => void;
  onOpenWithdrawal: () => void;
  onOpenSettings: () => void;
  onOpenAds?: () => void;
  onOpenSupport?: () => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  onOpenLevelCenter?: () => void;
  onOpenChargingAgent?: () => void;
  onOpenDistributorAgent?: () => void;
  onOpenGiftHistory?: () => void;
}

export const HagoProfileView: React.FC<HagoProfileViewProps> = ({
  user,
  onOpenRecharge,
  onOpenStore,
  onOpenAgency,
  onOpenVerification,
  onOpenWithdrawal,
  onOpenSettings,
  onOpenAds,
  onOpenSupport,
  onOpenAuth,
  onLogout,
  onOpenLevelCenter,
  onOpenChargingAgent,
  onOpenDistributorAgent,
  onOpenGiftHistory
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountSummary[]>(() => livoStore.getSavedAccounts());
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSquareModal, setShowSquareModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'services' | 'videos' | 'about'>('services');
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const refreshSavedAccounts = () => {
    setSavedAccounts(livoStore.getSavedAccounts());
  };

  const handleSwitchAccount = (uid: string) => {
    const res = livoStore.switchSavedAccount(uid);
    refreshSavedAccounts();
    setShowAccountSwitcher(false);
    if (!res.success) {
      setInfoNotice(res.message);
    }
  };

  const handleRemoveSavedAccount = (uid: string) => {
    livoStore.removeSavedAccount(uid);
    refreshSavedAccounts();
  };

  if (!user) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none overflow-y-auto pb-8 px-4 pt-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto shadow-md border-2 border-[#FFE600]">
            <img
              src="/assets/livo/customer_icon.jpg"
              alt="LIVO"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-base text-gray-900">أنت تتصفح كزائر حالياً</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              سجّل الدخول بحسابك للانضمام إلى الغرف الصوتية، شحن الكوينز، وإدارة ملفك الشخصي في LIVO.
            </p>
          </div>
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول / إنشاء حساب</span>
          </button>

          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-gray-600" />
              <span>مركز المساعدة والدعم الفني</span>
            </button>
          )}
        </div>

        {savedAccounts.length > 0 && (
          <div className="mt-4 bg-white rounded-3xl border border-gray-100 shadow-xs p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs text-gray-900">الحسابات المحفوظة على هذا الجهاز</h4>
              <span className="text-[10px] text-gray-400 font-digits">{savedAccounts.length}</span>
            </div>
            <div className="space-y-2">
              {savedAccounts.map((acc) => (
                <div
                  key={acc.uid}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#FFE600] transition-colors"
                >
                  <button
                    onClick={() => handleSwitchAccount(acc.uid)}
                    className="flex items-center gap-2.5 flex-1 text-right min-w-0"
                  >
                    <img
                      src={acc.avatar || '/assets/livo/customer_icon.jpg'}
                      alt={acc.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <UserNameWithBadges
                          displayName={acc.displayName}
                          isVerified={acc.isVerified}
                          badgeSize={13}
                          nameClassName="font-black text-xs text-gray-900"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-digits block truncate">
                        UID: {acc.uid} {acc.email ? `• ${acc.email}` : ''}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRemoveSavedAccount(acc.uid)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="إزالة من القائمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {infoNotice && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl text-gray-900">
              <h3 className="font-black text-sm mb-2">تنبيه الحساب</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">{infoNotice}</p>
              <button
                onClick={() => setInfoNotice(null)}
                className="w-full py-2.5 bg-[#FFE600] text-black font-black text-xs rounded-xl"
              >
                حسناً
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const nameGlowClass =
    user.nameGlowColor && user.nameGlowColor !== 'none' ? `name-glow-${user.nameGlowColor}` : '';

  // User's genuine videos
  const allVideos = livoStore.getVideos();
  const userVideos = allVideos.filter(v => v.authorUid === user.uid);

  const handleCopyUid = () => {
    navigator.clipboard?.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://livo.live/u/${user.uid}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none overflow-y-auto pb-8">
      {/* HAGO Dark Cover Header */}
      <div className="relative bg-gradient-to-br from-[#23103b] via-[#180a2a] to-[#0e0717] text-white px-4 pt-3.5 pb-10">
        {/* Top Action Icons (Menu with dot, Share, Edit, Likes Heart) */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title="الإعدادات"
            >
              <Menu className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title="مشاركة الحساب"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title="تعديل الملف الشخصي"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full text-xs font-digits font-black">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>{((user.followersCount || 0) + (user.diamonds || 0)).toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* Floating Gift Invite Ribbon */}
        <button
          onClick={() => setShowShareModal(true)}
          className="mb-3 w-full py-1.5 px-3 rounded-xl bg-gradient-to-l from-amber-400/20 via-purple-500/25 to-pink-500/20 border border-amber-300/30 flex items-center justify-between text-[11px] font-bold text-amber-200 hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-[#FFE600]" />
            <span>دعوة الأصدقاء والحصول على مكافآت 🎁</span>
          </span>
          <ChevronLeft className="w-3.5 h-3.5 text-amber-300" />
        </button>

        {/* User Avatar + Badges + Copyable UID + (+) Account Switcher */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setShowEditProfileModal(true)}
            className="relative cursor-pointer group shrink-0"
            title="اضغط لتغيير الصورة والاسم"
          >
            <AvatarWithFrame
              sizePx={70}
              avatarUrl={user.avatar}
              displayName={user.displayName}
              frameUrl={user.equippedFrameUrl}
              frameGlowColor={user.frameGlowColor}
              frameAnimated={user.frameAnimated}
              customIconUrl={user.customIconUrl}
              customIconGlow={user.customIconGlow}
              customIconAnimated={user.customIconAnimated}
            />
            <span className="absolute -bottom-1 -right-1 z-30 bg-[#FFE600] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#180a2a] font-digits shadow">
              Lv.{user.level || 0}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <UserNameWithBadges
                displayName={user.displayName}
                nameGlowColor={user.nameGlowColor}
                isVerified={user.isVerified}
                verifiedBadgeColor={user.verifiedBadgeColor}
                verifiedBadgeShape={user.verifiedBadgeShape}
                verifiedBadgeGlow={user.verifiedBadgeGlow}
                customIconUrl={user.customIconUrl}
                customIconGlow={user.customIconGlow}
                customIconAnimated={user.customIconAnimated}
                customIconLabel={user.customIconLabel}
                agencyLabel={livoStore.getAgencyDisplayLabel(user)}
                agencyLabelBelow={true}
                badgeSize={17}
                iconSize={21}
                nameClassName="font-black text-base text-white"
                truncate={false}
              />
            </div>

            {/* UID with Copy Button + VIP Level Chip */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-purple-200 font-digits font-bold bg-white/10 px-2 py-0.5 rounded-full">
                ID: {user.uid}
              </span>
              <button
                onClick={handleCopyUid}
                className="text-purple-200 hover:text-[#FFE600] transition-colors p-0.5"
                title="نسخ معرّف الحساب"
              >
                {copiedUid ? (
                  <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> تم
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onOpenLevelCenter}
                className="text-[10px] font-digits font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 text-black shadow-xs"
              >
                Lv.{user.level || 0}
              </button>
            </div>

            {/* Edit Profile + (+) Account Switcher Circle */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-[10px] font-black px-2.5 py-1 rounded-full transition-colors border border-white/20"
              >
                <Edit3 className="w-3 h-3 text-[#FFE600]" />
                <span>تعديل الصورة والاسم</span>
              </button>
              <button
                onClick={() => {
                  refreshSavedAccounts();
                  setShowAccountSwitcher(true);
                }}
                className="w-6 h-6 rounded-full border-2 border-amber-300 bg-[#FFE600] hover:bg-yellow-400 text-black flex items-center justify-center shadow transition-transform active:scale-95"
                title="إضافة حساب أو التبديل بين الحسابات"
                aria-label="إضافة أو تبديل الحساب"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping White Sheet (HAGO Stats + Family/Agency + Mint Wallet + Tabs) */}
      <div className="-mt-6 bg-[#FAFAFA] rounded-t-[26px] px-4 pt-4 pb-2 relative z-10 shadow-sm">
        {/* Following & Followers Bar */}
        <div className="flex items-center justify-around bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-center shadow-2xs">
          <div>
            <span className="font-digits font-black text-base text-gray-900 block">
              {(user.followersCount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">متابعين</span>
          </div>
          <div className="h-6 w-[1px] bg-gray-200" />
          <div>
            <span className="font-digits font-black text-base text-gray-900 block">
              {(user.followingCount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">متابَع</span>
          </div>
          <div className="h-6 w-[1px] bg-gray-200" />
          <div>
            <span className="font-digits font-black text-base text-gray-900 block">
              {userVideos.length}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">الفيديوهات</span>
          </div>
        </div>

        {/* Bio if exists */}
        {user.bio && (
          <p className="text-xs text-gray-600 mt-2.5 px-3 leading-relaxed bg-white p-2.5 rounded-2xl border border-gray-100">
            {user.bio}
          </p>
        )}

        {/* HAGO Agency / Family & Couple Cards Row */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={onOpenAgency}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/80 rounded-2xl p-2.5 text-right flex items-center justify-between hover:shadow-xs transition-all"
          >
            <div className="min-w-0">
              <span className="text-[11px] font-black text-amber-900 block truncate">
                {user.agencyName || 'مربع الوكالة'}
              </span>
              <span className="text-[9px] text-amber-700 block truncate">
                {user.canChargeUsers ? 'وكيل شحن معتمد ✓' : 'الانضمام لوكالة LIVO'}
              </span>
            </div>
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          </button>

          <button
            onClick={onOpenVerification}
            className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200/80 rounded-2xl p-2.5 text-right flex items-center justify-between hover:shadow-xs transition-all"
          >
            <div className="min-w-0">
              <span className="text-[11px] font-black text-rose-900 block truncate">
                {user.isVerified ? 'التوثيق الرسمي ✓' : 'باقة التوثيق'}
              </span>
              <span className="text-[9px] text-rose-700 block truncate">
                {user.isVerified ? 'حساب موثق نشط' : 'تفعيل شارة التوثيق'}
              </span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
          </button>
        </div>

        {/* Charging Agent Dedicated Center */}
        {(user.role === 'charging_agent' || user.canChargeUsers) && (
          <div className="mt-2.5 bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-amber-500/10 border border-yellow-400/60 rounded-2xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 text-purple-950 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-gray-900">مركز وكيل الشحن</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-yellow-400 text-purple-950">
                    وكيل شحن
                  </span>
                </div>
                <span className="text-[10px] text-amber-800 font-digits font-bold block">
                  رصيد الوكيل المتاح: {(user.agentBalance !== undefined ? user.agentBalance : user.coins).toLocaleString('en-US')} كوينز
                </span>
              </div>
            </div>
            <button
              onClick={onOpenChargingAgent}
              className="bg-yellow-400 hover:bg-yellow-500 text-purple-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
            >
              تحويل كوينز
            </button>
          </div>
        )}

        {/* Distributor Agent Dedicated Center */}
        {user.role === 'distributor_agent' && (
          <div className="mt-2.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/20 to-indigo-500/10 border border-purple-400/60 rounded-2xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-gray-900">مركز وكيل الموزعين</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-600 text-white">
                    وكيل موزعين
                  </span>
                </div>
                <span className="text-[10px] text-purple-800 font-bold block">
                  إدارة شبكة الموزعين المعتمدين تحت وكالتك
                </span>
              </div>
            </div>
            <button
              onClick={onOpenDistributorAgent}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
            >
              إدارة الموزعين
            </button>
          </div>
        )}

        {/* HAGO Soft Mint Wallet Card ("المحفظة") */}
        <div className="mt-2.5 bg-gradient-to-l from-[#E8FDF5] via-[#F2FBF8] to-[#FFFDF0] border border-emerald-200/70 rounded-2xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>المحفظة</span>
            </span>
            <button
              onClick={onOpenLevelCenter}
              className="text-[10px] font-black text-emerald-800 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>مركز المستوى Lv.{user.level || 0}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/90 rounded-xl p-2 flex items-center justify-between border border-amber-100">
              <div>
                <span className="text-[10px] text-gray-500 block">الكوينز</span>
                <span className="font-digits font-black text-sm text-amber-700">
                  {user.coins.toLocaleString()} 🪙
                </span>
              </div>
              <button
                onClick={onOpenRecharge}
                className="bg-[#FFE600] hover:bg-yellow-400 text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs"
              >
                شحن
              </button>
            </div>

            <div className="bg-white/90 rounded-xl p-2 flex items-center justify-between border border-emerald-100">
              <div>
                <span className="text-[10px] text-gray-500 block">الألماسات</span>
                <span className="font-digits font-black text-sm text-emerald-700">
                  {(user.diamonds || 0).toLocaleString()} 💎
                </span>
              </div>
              <button
                onClick={onOpenWithdrawal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs"
              >
                سحب
              </button>
            </div>
          </div>
        </div>

        {/* HAGO Underline Tabs */}
        <div className="flex items-center justify-around border-b border-gray-200 mt-3 pt-1 text-xs font-bold">
          {[
            { id: 'services' as const, label: 'الخدمات والمزايا' },
            { id: 'videos' as const, label: `المشاركات (${userVideos.length})` },
            { id: 'about' as const, label: 'معلومات عني' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setProfileTab(tab.id)}
              className={`pb-2.5 px-2 relative transition-colors ${
                profileTab === tab.id ? 'text-gray-900 font-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {profileTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#FFE600]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content: Videos Tab */}
      {profileTab === 'videos' && (
        <div className="px-3 pt-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                <span className="font-black text-xs text-gray-900">الفيديوهات الحقيقية</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold">{userVideos.length} فيديو</span>
            </div>

            {userVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {userVideos.map((video) => (
                  <div key={video.id} className="relative aspect-[9/12] rounded-xl overflow-hidden bg-black group shadow-sm">
                    <video src={video.videoUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                      <p className="text-[10px] line-clamp-1 font-bold">{video.caption}</p>
                      <div className="flex items-center justify-between text-[9px] mt-1 text-gray-300 font-digits">
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500" /> {video.likesCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="w-2.5 h-2.5" /> {video.commentsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Video className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-bold text-gray-500">لا توجد مقاطع فيديو منشورة بعد</p>
                <p className="text-[10px] text-gray-400 mt-0.5">شارك لحظاتك وبثوثك المميزة مع متابعيك في LIVO</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: About Me Tab */}
      {profileTab === 'about' && (
        <div className="px-3 pt-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-bold">الاسم المستعار</span>
              <span className="font-black text-gray-900">{user.displayName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-bold">المعرّف الرقمي</span>
              <span className="font-digits font-black text-gray-900">{user.uid}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-bold">المستوى</span>
              <span className="font-digits font-black text-amber-600">Lv.{user.level || 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500 font-bold">تاريخ الانضمام</span>
              <span className="font-digits font-bold text-gray-700">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : 'عضو نشط'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-bold block mb-1">النبذة الشخصية</span>
              <p className="text-gray-700 bg-gray-50 rounded-xl p-2.5 leading-relaxed">
                {user.bio || 'لا توجد نبذة مكتوبة بعد — اضغط "تعديل الصورة والاسم" لإضافة نبذتك.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Services & Menus always preserved inside Services tab */}
      {profileTab === 'services' && (
      <div className="px-3 pt-3 space-y-1">
        
        {/* Group 1: الأساسية والامتيازات */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs">
          {/* 1. الساحة */}
          <div
            onClick={() => setShowSquareModal(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <span className="font-bold text-xs text-gray-900">الساحة (الفيديوهات)</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* 2. حزمه الامتياز */}
          <div
            onClick={onOpenStore}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <span className="font-bold text-xs text-gray-900">حزمه الامتياز</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* 3. متجر الامتيازات */}
          <div
            onClick={onOpenStore}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <span className="font-bold text-xs text-gray-900">متجر الامتيازات (الإطارات والدخلات)</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* 4. مركز المستوى */}
          <div
            onClick={onOpenLevelCenter}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-amber-500 stroke-[1.8]" />
              <span className="font-bold text-xs text-gray-900">مركز المستوى (0 - 50)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-400 text-purple-950 font-digits font-black">
                Lv.{user.level || 0}
              </span>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Group 2: الأنشطة والأصدقاء */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs mt-2">
          {/* 5. دعوة أصدقاء */}
          <div
            onClick={() => setShowShareModal(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <span className="font-bold text-xs text-gray-900">دعوة أصدقاء</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* 6. سجل الهدايا الخاصة */}
          <div
            onClick={onOpenGiftHistory}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-500 stroke-[1.8]" />
              <span className="font-bold text-xs text-gray-900">سجل الهدايا الخاصة</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* 7. مركز الإعلانات */}
          <div
            onClick={onOpenAds}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <div>
                <span className="font-bold text-xs text-gray-900 block">مركز الإعلانات والعروض</span>
                <span className="text-[9px] text-gray-400">الحملات النشطة • العروض الترويجية في LIVO</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Group 3: خدمات LIVO الحقيقية (شحن، وكالات، توثيق) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs mt-2">
          {/* مركز الوكالات */}
          <div
            onClick={onOpenAgency}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 stroke-[1.8]" />
              <div>
                <span className="font-bold text-xs text-gray-900 block">مركز الوكالات</span>
                <span className="text-[9px] text-gray-400">
                  {user.agencyName ? `وكالة معتمدة: ${user.agencyName}` : 'وكيل شحن • وكيل موزعين'}
                </span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* التوثيق الأزرق */}
          <div
            onClick={onOpenVerification}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 stroke-[1.8]" />
              <div>
                <span className="font-bold text-xs text-gray-900 block">التوثيق الأزرق الرسمي</span>
                <span className="text-[9px] text-gray-400">
                  {user.isVerified ? 'حساب موثق بالعلامة الزرقاء ✓' : 'اشتراكات التوثيق من شهر إلى 12 شهراً'}
                </span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Group 4: الإعدادات والسياسات */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs mt-2">
          {/* 8. إعداد */}
          <div
            onClick={onOpenSettings}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900">إعداد</span>
                <span className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* 9. مركز المساعدة والدعم الفني */}
          <div
            onClick={onOpenSupport}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <div>
                <span className="font-bold text-xs text-gray-900 block">مركز المساعدة والدعم الفني</span>
                <span className="text-[9px] text-gray-400">تواصل مباشر ولحظي مع الإدارة والشكاوى</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-[1px] bg-gray-50 mx-4" />

          {/* 10. القواعد والسياسات */}
          <div
            onClick={() => setInfoNotice('شروط الاستخدام وسياسة الخصوصية لمنصة LIVO: احترام المستخدمين ومعايير المجتمع شرط أساسي')}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gray-700 stroke-[1.8]" />
              <span className="font-bold text-xs text-gray-900">القواعد والسياسات</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Group 5: تسجيل الخروج الآمن */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs mt-2">
          {/* تسجيل الخروج */}
          <div
            onClick={() => setShowLogoutConfirm(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors text-red-600"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-600 stroke-[1.8]" />
              <div>
                <span className="font-bold text-xs text-red-600 block">تسجيل الخروج من الحساب</span>
                <span className="text-[10px] text-gray-400">حفظ الجلسة والخروج الآمن من المنصة</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-red-400" />
          </div>
        </div>
      </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={user}
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      {/* الساحة (Videos Feed Modal) */}
      {showSquareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md relative">
            <button
              onClick={() => setShowSquareModal(false)}
              className="absolute top-2 left-2 z-50 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
            <VideosView currentUser={user} />
          </div>
        </div>
      )}

      {/* Info Notice Modal Sheet */}
      {infoNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl relative text-gray-900">
            <h3 className="font-black text-sm mb-2 text-gray-900">معلومات LIVO</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">{infoNotice}</p>
            <button
              onClick={() => setInfoNotice(null)}
              className="w-full py-2.5 bg-[#FFE600] text-black font-black text-xs rounded-xl hover:bg-yellow-400 transition-colors"
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl relative text-gray-900">
            <h3 className="font-black text-base mb-2 text-gray-900">تأكيد تسجيل الخروج</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في تسجيل الخروج من هذا الحساب؟
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-[360px] p-5 text-center shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-black text-sm text-gray-900 mb-4">
              شارك بطاقة LIVO الخاصة بك مع الأصدقاء
            </h3>

            {/* Profile Share Card Preview */}
            <div className="bg-gradient-to-br from-amber-400 via-[#FFE600] to-yellow-300 p-4 rounded-2xl shadow-md text-black mb-5 text-right relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-14 h-14 rounded-full border-2 border-black object-cover shadow"
                />
                <div>
                  <UserNameWithBadges
                    displayName={user.displayName}
                    nameGlowColor={user.nameGlowColor}
                    isVerified={user.isVerified}
                    verifiedBadgeColor={user.verifiedBadgeColor}
                    verifiedBadgeShape={user.verifiedBadgeShape}
                    verifiedBadgeGlow={user.verifiedBadgeGlow}
                    customIconUrl={user.customIconUrl}
                    customIconGlow={user.customIconGlow}
                    customIconAnimated={user.customIconAnimated}
                    customIconLabel={user.customIconLabel}
                    badgeSize={15}
                    iconSize={19}
                    nameClassName="font-black text-base text-black"
                  />
                  <p className="text-xs font-bold font-digits text-gray-800">UID: {user.uid}</p>
                  <span className="text-[10px] font-extrabold bg-black text-[#FFE600] px-2 py-0.5 rounded-full inline-block mt-1">
                    🇪🇬 LIVO Official User
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-black/20 flex items-center justify-between text-[11px] font-extrabold">
                <span>تطبيق LIVO الاجتماعي</span>
                <span className="text-xs">👑 VIP</span>
              </div>
            </div>

            {/* Share Targets */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-gray-700">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xl shadow group-hover:scale-105 transition-transform">
                  💬
                </div>
                <span>واتساب</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xl shadow group-hover:scale-105 transition-transform">
                  f
                </div>
                <span>فيسبوك</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#FFFC00] text-black flex items-center justify-center text-xl shadow group-hover:scale-105 transition-transform">
                  👻
                </div>
                <span>سناب شات</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                  <Copy className="w-5 h-5" />
                </div>
                <span>{copiedLink ? 'تم النسخ ✓' : 'نسخ الرابط'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Account Switcher Modal triggered by (+) circle */}
      {showAccountSwitcher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 text-gray-900 max-h-[82vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-sm text-gray-900">تبديل وإدارة الحسابات المسجلة</h3>
                <p className="text-[11px] text-gray-500">
                  تنقل بين حساباتك الحقيقية المسجلة على هذا الجهاز بدون اختلاط البيانات
                </p>
              </div>
              <button
                onClick={() => setShowAccountSwitcher(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {savedAccounts.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">لا توجد حسابات إضافية محفوظة بعد</p>
              ) : (
                savedAccounts.map((acc) => {
                  const isActive = acc.uid === user.uid;
                  return (
                    <div
                      key={acc.uid}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                        isActive
                          ? 'bg-[#FFFDE7] border-[#FFE600] shadow-2xs'
                          : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <button
                        onClick={() => (!isActive ? handleSwitchAccount(acc.uid) : setShowAccountSwitcher(false))}
                        className="flex items-center gap-2.5 flex-1 text-right min-w-0"
                      >
                        <img
                          src={acc.avatar || '/assets/livo/customer_icon.jpg'}
                          alt={acc.displayName}
                          className="w-11 h-11 rounded-full object-cover border border-white shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <UserNameWithBadges
                              displayName={acc.displayName}
                              isVerified={acc.isVerified}
                              badgeSize={13}
                              nameClassName="font-black text-xs text-gray-900"
                            />
                            {isActive && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5" /> نشط
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 font-digits block truncate">
                            UID: {acc.uid} {acc.email ? `• ${acc.email}` : acc.phoneNumber ? `• ${acc.phoneNumber}` : ''}
                          </span>
                        </div>
                      </button>

                      {!isActive && (
                        <button
                          onClick={() => handleRemoveSavedAccount(acc.uid)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          title="إزالة الحساب من القائمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => {
                setShowAccountSwitcher(false);
                onOpenAuth('login');
              }}
              className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة أو تسجيل دخول حساب جديد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
