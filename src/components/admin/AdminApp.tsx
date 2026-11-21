import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Users,
  CreditCard,
  Coins,
  Briefcase,
  CheckCircle2,
  ArrowDownCircle,
  Radio,
  Slash,
  History,
  Settings,
  Search,
  Check,
  X,
  AlertTriangle,
  ZoomIn,
  RefreshCw,
  LogOut,
  Sparkles,
  Lock,
  Eye,
  FileText,
  UserX,
  CheckCheck,
  ShoppingBag,
  Bell,
  ShieldCheck,
  BadgePercent,
  Inbox,
  Megaphone,
  Send,
  MessageSquare,
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Filter,
  EyeOff,
  Wallet,
  QrCode,
  Gift,
  Copy,
  Edit2,
  Crown,
  Upload,
  Wand2,
  KeyRound,
  Zap,
  Mic,
  Video
} from 'lucide-react';
import {
  UserProfile,
  RechargeRequest,
  CoinAuditRecord,
  AgencyApplication,
  BlueVerificationRequest,
  WithdrawalRequest,
  BanRecord,
  Advertisement,
  SupportTicket,
  PaymentMethodConfig,
  RechargeCode,
  GiftItem,
  StoreItem,
  DirectMessage,
  CoinPackage,
  SupervisorRecord,
  VoiceRoom
} from '../../types';
import { livoStore } from '../../services/livoStore';
import { firebaseService } from '../../services/firebase';
import { LivoAdminAppIcon } from '../../assets/appIcons';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { LivoVerifiedBadge, VERIFIED_BADGE_COLORS, VerifiedBadgeColor, VerifiedBadgeShape } from '../common/LivoVerifiedBadge';
import { UserNameWithBadges } from '../common/UserNameWithBadges';
import { MagicCutoutModal } from '../common/MagicCutoutModal';
import { ROYAL_FRAME_PRESETS, GLOW_COLOR_PRESETS } from '../../data/initialData';
import { removeImageBackgroundToPng } from '../../utils/imageTransparency';
import { compressImageForFirestore } from '../../utils/imageCompression';

interface AdminAppProps {
  onLogoutAdmin?: () => void;
}

const SUPERVISOR_PERMISSIONS_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'recharges', label: 'طلبات الشحن' },
  { id: 'withdrawals', label: 'طلبات السحب' },
  { id: 'bans', label: 'الحظر والرقابة' },
  { id: 'rooms', label: 'إدارة الغرف' },
  { id: 'users', label: 'الحسابات والأعضاء' },
  { id: 'agencies', label: 'الوكالات' },
  { id: 'verifications', label: 'التوثيق الأزرق' },
  { id: 'support', label: 'الدعم والشكاوى' }
];

export const AdminApp: React.FC<AdminAppProps> = ({ onLogoutAdmin }) => {
  // Authentication State (Strictly verified via Firebase Auth)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeAdminEmail, setActiveAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Section Navigation
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'direct_support_hub' | 'inbox' | 'ads' | 'recharges' | 'payment_settings' | 'recharge_codes' | 'manual_coins' | 'pricing' | 'users' | 'cosmetics_studio' | 'agencies' | 'verifications' | 'withdrawals' | 'store_items' | 'rooms' | 'official_room' | 'bans' | 'supervisors' | 'financial_logs'
  >('dashboard');

  // Local state synced directly with livoStore & Firebase
  const [users, setUsers] = useState<UserProfile[]>(livoStore.getGenuineUsers());
  const usersRef = useRef<UserProfile[]>(users);
  usersRef.current = users;
  const lookedUpUidsRef = useRef<Set<string>>(new Set());
  const [rooms, setRooms] = useState<VoiceRoom[]>(livoStore.getAllRoomsForAdmin());
  const [roomsSearchQuery, setRoomsSearchQuery] = useState('');
  const [isPurgingFakeRooms, setIsPurgingFakeRooms] = useState(false);
  const [adminCutoutTarget, setAdminCutoutTarget] = useState<'gift' | 'frame' | 'custom_icon' | null>(null);
  const [adminCutoutSource, setAdminCutoutSource] = useState<string | File | null>(null);
  const [recharges, setRecharges] = useState<RechargeRequest[]>(livoStore.getRechargeRequests());
  const [audits, setAudits] = useState<CoinAuditRecord[]>(livoStore.getCoinAudits());
  const [agencies, setAgencies] = useState<AgencyApplication[]>(livoStore.getAgencies());
  const [verifications, setVerifications] = useState<BlueVerificationRequest[]>(livoStore.getVerificationRequests());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(livoStore.getWithdrawalRequests());
  const [bans, setBans] = useState<BanRecord[]>(livoStore.getBans());
  const [tickets, setTickets] = useState<SupportTicket[]>(livoStore.getSupportTickets());
  const [ads, setAds] = useState<Advertisement[]>(livoStore.getAdvertisements(false));
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(livoStore.getPaymentMethods());
  const [rechargeCodes, setRechargeCodes] = useState<RechargeCode[]>(livoStore.getRechargeCodes());
  const [giftsList, setGiftsList] = useState<GiftItem[]>(livoStore.getGifts());
  const [storeItemsList, setStoreItemsList] = useState<StoreItem[]>(livoStore.getStoreItems());
  const [coinPackagesList, setCoinPackagesList] = useState<CoinPackage[]>(livoStore.getCoinPackages());
  const [allMessages, setAllMessages] = useState<DirectMessage[]>(livoStore.getMessages());

  // Universal Search Queries across all Admin sections (supports UID 10000 - 100000+)
  const [usersDirectoryQuery, setUsersDirectoryQuery] = useState('');
  const [rechargesSearchQuery, setRechargesSearchQuery] = useState('');
  const [agenciesSearchQuery, setAgenciesSearchQuery] = useState('');
  const [verificationsSearchQuery, setVerificationsSearchQuery] = useState('');
  const [withdrawalsSearchQuery, setWithdrawalsSearchQuery] = useState('');
  const [inboxSearchQuery, setInboxSearchQuery] = useState('');
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [supervisorsSearchQuery, setSupervisorsSearchQuery] = useState('');
  const [blastRecipientQuery, setBlastRecipientQuery] = useState('');
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Direct Support Hub State
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [selectedSupportUser, setSelectedSupportUser] = useState<UserProfile | null>(null);
  const [supportChatInput, setSupportChatInput] = useState('');

  // Payment Settings State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentMethodConfig['type']>('vodafone_cash');
  const [paymentTitle, setPaymentTitle] = useState('');
  const [paymentAccountNum, setPaymentAccountNum] = useState('');
  const [paymentHolderName, setPaymentHolderName] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [paymentIsDefault, setPaymentIsDefault] = useState(false);

  // Coin Packages CRUD State
  const [showCoinPkgModal, setShowCoinPkgModal] = useState(false);
  const [editCoinPkgId, setEditCoinPkgId] = useState<string | null>(null);
  const [pkgCoinsInput, setPkgCoinsInput] = useState('');
  const [pkgPriceInput, setPkgPriceInput] = useState('');
  const [pkgPopularInput, setPkgPopularInput] = useState(false);
  const [pkgActiveInput, setPkgActiveInput] = useState(true);

  // Recharge Codes State
  const [showAddCodeModal, setShowAddCodeModal] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newCodeCoinsInput, setNewCodeCoinsInput] = useState('');
  const [newCodeMaxUsesInput, setNewCodeMaxUsesInput] = useState('100');

  // Gifts Management State
  const [showAddGiftModal, setShowAddGiftModal] = useState(false);
  const [editGiftId, setEditGiftId] = useState<string | null>(null);
  const [newGiftName, setNewGiftName] = useState('');
  const [newGiftPrice, setNewGiftPrice] = useState('');
  const [newGiftIcon, setNewGiftIcon] = useState('🎁');
  const [newGiftImageUrl, setNewGiftImageUrl] = useState('');
  const [isProcessingGiftImage, setIsProcessingGiftImage] = useState(false);
  const [newGiftAnimation, setNewGiftAnimation] = useState<GiftItem['animationType']>('heart');

  // Live Gift Blaster (ضرب وإرسال الهدايا للغرف)
  const [blastRoomId, setBlastRoomId] = useState('');
  const [blastGiftId, setBlastGiftId] = useState('');
  const [blastCount, setBlastCount] = useState<number>(5);
  const [blastRecipientUid, setBlastRecipientUid] = useState('');
  const [blastSenderName, setBlastSenderName] = useState('إدارة LIVO الملكية');

  // VIP Cosmetics Studio (حصري للإدارة فقط)
  const [cosmeticSearchQuery, setCosmeticSearchQuery] = useState('');
  const [cosmeticTargetUser, setCosmeticTargetUser] = useState<UserProfile | null>(null);
  const [cosIsVerified, setCosIsVerified] = useState(false);
  const [cosBadgeColor, setCosBadgeColor] = useState<VerifiedBadgeColor>('blue');
  const [cosBadgeShape, setCosBadgeShape] = useState<VerifiedBadgeShape>('rosette');
  const [cosBadgeGlow, setCosBadgeGlow] = useState(true);
  const [cosNameGlow, setCosNameGlow] = useState<NonNullable<UserProfile['nameGlowColor']>>('none');
  const [cosFrameUrl, setCosFrameUrl] = useState('');
  const [cosFrameGlow, setCosFrameGlow] = useState('rgba(250, 204, 21, 0.95)');
  const [cosFrameAnimated, setCosFrameAnimated] = useState(true);
  const [cosCustomIconUrl, setCosCustomIconUrl] = useState('');
  const [cosCustomIconGlow, setCosCustomIconGlow] = useState('rgba(250, 204, 21, 0.95)');
  const [cosCustomIconAnimated, setCosCustomIconAnimated] = useState(true);
  const [isProcessingCosmeticImg, setIsProcessingCosmeticImg] = useState(false);

  // Verifications & Withdrawals Modals
  const [zoomedVerificationReceiptUrl, setZoomedVerificationReceiptUrl] = useState<string | null>(null);
  const [rejectVerificationId, setRejectVerificationId] = useState<string | null>(null);
  const [rejectVerificationReason, setRejectVerificationReason] = useState('');
  const [rejectWithdrawalId, setRejectWithdrawalId] = useState<string | null>(null);
  const [rejectWithdrawalReason, setRejectWithdrawalReason] = useState('');

  // Central Inbox & Support Tickets State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<'all' | 'complaint' | 'inquiry' | 'report' | 'technical' | 'financial'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketReplyStatus, setTicketReplyStatus] = useState<'resolved' | 'in_progress' | 'closed'>('resolved');
  const [zoomedTicketImageUrl, setZoomedTicketImageUrl] = useState<string | null>(null);

  // Advertisements Management State
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDescription, setNewAdDescription] = useState('');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdTargetUrl, setNewAdTargetUrl] = useState('');
  const [newAdPlacement, setNewAdPlacement] = useState<'banner' | 'popup' | 'feed'>('banner');
  const [newAdStartDate, setNewAdStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAdEndDate, setNewAdEndDate] = useState(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [adDeleteConfirmId, setAdDeleteConfirmId] = useState<string | null>(null);
  const [isUploadingAdImage, setIsUploadingAdImage] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Recharge Requests Filter Tabs
  const [rechargeFilter, setRechargeFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [zoomedReceiptUrl, setZoomedReceiptUrl] = useState<string | null>(null);
  const [rejectModalReqId, setRejectModalReqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Manual Coins Adjustment Form State (Empty by default, English numbers only)
  const [searchCoinsUid, setSearchCoinsUid] = useState('');
  const [selectedUserForCoins, setSelectedUserForCoins] = useState<UserProfile | null>(null);
  const [coinActionType, setCoinActionType] = useState<'add' | 'deduct' | 'set'>('add');
  const [coinAmountInput, setCoinAmountInput] = useState('');
  const [coinReasonInput, setCoinReasonInput] = useState('');
  const [showCoinConfirmModal, setShowCoinConfirmModal] = useState(false);
  const [coinActionFeedback, setCoinActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Ban Management State
  const [banSearchUid, setBanSearchUid] = useState('');
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserProfile | null>(null);
  const [banType, setBanType] = useState<'account' | 'device' | 'both'>('account');
  const [banDuration, setBanDuration] = useState<'temporary' | 'permanent'>('temporary');
  const [banDays, setBanDays] = useState('7');
  const [banReason, setBanReason] = useState('');
  const [unbanModalRecord, setUnbanModalRecord] = useState<BanRecord | null>(null);
  const [unbanReasonText, setUnbanReasonText] = useState('');

  // Official Room Announcement State
  const [announcementText, setAnnouncementText] = useState('مرحباً بجميع رواد LIVO! مرحباً بكم في الغرفة الرسمية للإدارة.');
  const [officialRoomStatus, setOfficialRoomStatus] = useState<'open' | 'closed' | 'locked_by_admin'>('open');

  // Supervisors management state (Synced with Firestore via livoStore)
  const [supervisors, setSupervisors] = useState<SupervisorRecord[]>(livoStore.getSupervisors());
  const [newSupervisorUid, setNewSupervisorUid] = useState('');
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [newSupervisorEmail, setNewSupervisorEmail] = useState('');
  const [newSupervisorPermissions, setNewSupervisorPermissions] = useState<string[]>(['recharges', 'bans', 'rooms']);
  const [editingSupervisorId, setEditingSupervisorId] = useState<string | null>(null);
  const [editingSupervisorPerms, setEditingSupervisorPerms] = useState<string[]>([]);

  // Listen to Firebase Auth state & redirect flow to maintain verified session
  useEffect(() => {
    let latestFbUser: any = null;
    let isMounted = true;

    const evaluateAdminAuth = async (fbUser: any) => {
      if (!isMounted) return;
      if (!fbUser) {
        setIsAdminLoggedIn(false);
        setActiveAdminEmail('');
        localStorage.removeItem('livo_admin_session');
        return;
      }
      const email = fbUser.email?.trim().toLowerCase() || '';
      if (livoStore.isAuthorizedAdminEmail(email)) {
        setIsAdminLoggedIn(true);
        setActiveAdminEmail(email);
        localStorage.setItem('livo_admin_session', 'true');
        await livoStore.syncFirebaseUserAsync(fbUser);
      } else {
        setIsAdminLoggedIn(false);
        setActiveAdminEmail('');
        localStorage.removeItem('livo_admin_session');
      }
    };

    firebaseService.consumeGoogleRedirectResult().then(async (res) => {
      if (!isMounted) return;
      if (res.error) {
        setAuthError(res.error);
        return;
      }
      if (res.user) {
        const email = res.user.email?.trim().toLowerCase() || '';
        if (!livoStore.isAuthorizedAdminEmail(email)) {
          await firebaseService.logout();
          setAuthError('هذا البريد غير مصرح له بدخول لوحة الإدارة (مقصور على المالك والمشرفين المعتمدين).');
          return;
        }
        await evaluateAdminAuth(res.user);
        showToast('تم تسجيل الدخول بنجاح كمسؤول للمنظومة عبر Google 🛡️');
      }
    });

    const unsubAuth = firebaseService.onAuthStateChanged((firebaseUser) => {
      latestFbUser = firebaseUser;
      evaluateAdminAuth(firebaseUser);
    });

    const unsubscribe = livoStore.subscribe(() => {
      setUsers([...livoStore.getGenuineUsers()]);
      setRooms([...livoStore.getAllRoomsForAdmin()]);
      setRecharges([...livoStore.getRechargeRequests()]);
      setAudits([...livoStore.getCoinAudits()]);
      setAgencies([...livoStore.getAgencies()]);
      setVerifications([...livoStore.getVerificationRequests()]);
      setWithdrawals([...livoStore.getWithdrawalRequests()]);
      setBans([...livoStore.getBans()]);
      setTickets([...livoStore.getSupportTickets()]);
      setAds([...livoStore.getAdvertisements(false)]);
      setPaymentMethods([...livoStore.getPaymentMethods()]);
      setRechargeCodes([...livoStore.getRechargeCodes()]);
      setGiftsList([...livoStore.getGifts()]);
      setStoreItemsList([...livoStore.getStoreItems()]);
      setCoinPackagesList([...livoStore.getCoinPackages()]);
      setSupervisors([...livoStore.getSupervisors()]);
      setAllMessages([...livoStore.getMessages()]);
      if (latestFbUser) {
        const em = latestFbUser.email?.trim().toLowerCase() || '';
        const authorized = livoStore.isAuthorizedAdminEmail(em);
        setIsAdminLoggedIn((prev) => (prev === authorized ? prev : authorized));
        setActiveAdminEmail((prev) => {
          const next = authorized ? em : '';
          return prev === next ? prev : next;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubAuth();
      unsubscribe();
    };
  }, []);

  // Automatic server-side UID lookup across Firestore when admin types 5+ digits (10000 - 100000+)
  const triggerServerUserLookup = async (rawQuery: string): Promise<UserProfile[]> => {
    const clean = rawQuery.trim();
    if (!clean) return [];
    const local = livoStore.searchUsersByQuery(clean);
    if (local.some((u) => u.uid === clean) || (!/^\d{4,8}$/.test(clean) && local.length > 0)) {
      return local;
    }
    setIsSearchingServer(true);
    try {
      const found = await livoStore.lookupUserInFirestore(clean);
      setUsers([...livoStore.getGenuineUsers()]);
      return found;
    } finally {
      setIsSearchingServer(false);
    }
  };

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const currentUsers = usersRef.current;
    const candidates = [
      usersDirectoryQuery,
      supportSearchQuery,
      cosmeticSearchQuery,
      searchCoinsUid,
      banSearchUid,
      blastRecipientQuery,
      rechargesSearchQuery,
      agenciesSearchQuery,
      verificationsSearchQuery,
      withdrawalsSearchQuery,
      inboxSearchQuery,
      logsSearchQuery,
      supervisorsSearchQuery
    ]
      .map((q) => q.trim())
      .filter(
        (q) =>
          /^\d{5,8}$/.test(q) &&
          !currentUsers.some((u) => u.uid === q) &&
          !lookedUpUidsRef.current.has(q)
      );

    if (candidates.length === 0) return;
    const uniqueCandidates = Array.from(new Set(candidates));
    const timer = setTimeout(() => {
      uniqueCandidates.forEach((uidQuery) => {
        lookedUpUidsRef.current.add(uidQuery);
        livoStore.lookupUserInFirestore(uidQuery).then((res) => {
          if (res.length > 0) {
            setUsers([...livoStore.getGenuineUsers()]);
          }
        });
      });
    }, 320);

    return () => clearTimeout(timer);
  }, [
    isAdminLoggedIn,
    usersDirectoryQuery,
    supportSearchQuery,
    cosmeticSearchQuery,
    searchCoinsUid,
    banSearchUid,
    blastRecipientQuery,
    rechargesSearchQuery,
    agenciesSearchQuery,
    verificationsSearchQuery,
    withdrawalsSearchQuery,
    inboxSearchQuery,
    logsSearchQuery,
    supervisorsSearchQuery
  ]);

  // Admin Login with Firebase Auth and real server-side validation (Owner + Active Supervisors)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthInfo('');
    setIsLoggingIn(true);

    const cleanEmail = adminUsername.trim().toLowerCase();

    if (!livoStore.isAuthorizedAdminEmail(cleanEmail)) {
      setAuthError('حساب الإدارة غير معتمد. يرجى الدخول بحساب المالك الرسمي أو مشرف مفعّل في المنظومة.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await firebaseService.loginAdmin(cleanEmail, adminPassword);
      if (res.success && res.user) {
        setIsAdminLoggedIn(true);
        setActiveAdminEmail(cleanEmail);
        localStorage.setItem('livo_admin_session', 'true');
        await livoStore.syncFirebaseUserAsync(res.user);
        showToast('تم تسجيل الدخول بنجاح عبر Firebase Authentication 🛡️');
      } else {
        setAuthError(res.error || 'فشل التحقق من بيانات الدخول');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Login for Admin (Supports Popup + Redirect fallback for Mobile/Brave)
  const adminRedirectTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (adminRedirectTimerRef.current !== null) {
        window.clearTimeout(adminRedirectTimerRef.current);
      }
    };
  }, []);

  const handleGoogleLogin = async (preferRedirect: boolean = false) => {
    setAuthError('');
    setAuthInfo('');
    setIsLoggingIn(true);
    let redirectInitiated = false;
    try {
      const res = await firebaseService.loginAdminWithGoogle(preferRedirect);
      if (res.redirectStarted) {
        redirectInitiated = true;
        setAuthInfo('جاري التوجيه إلى صفحة Google الآمنة لتأكيد دخول الإدارة...');
        if (adminRedirectTimerRef.current !== null) {
          window.clearTimeout(adminRedirectTimerRef.current);
        }
        adminRedirectTimerRef.current = window.setTimeout(() => {
          setIsLoggingIn(false);
        }, 6000);
        return;
      }
      if (res.success && res.user) {
        const email = res.user.email?.trim().toLowerCase() || '';
        if (!livoStore.isAuthorizedAdminEmail(email)) {
          await firebaseService.logout();
          setIsAdminLoggedIn(false);
          localStorage.removeItem('livo_admin_session');
          setAuthError('هذا البريد غير مصرح له بدخول لوحة الإدارة (مقصور على المالك والمشرفين المعتمدين).');
          return;
        }
        setIsAdminLoggedIn(true);
        setActiveAdminEmail(email);
        localStorage.setItem('livo_admin_session', 'true');
        await livoStore.syncFirebaseUserAsync(res.user);
        showToast('تم تسجيل الدخول بنجاح كمسؤول للمنظومة عبر Google 🛡️');
      } else {
        setAuthError(res.error || 'فشل تسجيل الدخول عبر Google');
      }
    } catch (e: any) {
      setAuthError(e?.message || 'حدث خطأ أثناء الاتصال بـ Google');
    } finally {
      if (!redirectInitiated) {
        setIsLoggingIn(false);
      }
    }
  };

  // Safe Logout
  const handleLogout = async () => {
    await firebaseService.logout();
    livoStore.logoutSession();
    setIsAdminLoggedIn(false);
    setActiveAdminEmail('');
    localStorage.removeItem('livo_admin_session');
    setAdminPassword('');
    setAdminUsername('');
    if (onLogoutAdmin) onLogoutAdmin();
  };

  const handleAdminPasswordReset = async () => {
    setAuthError('');
    setAuthInfo('');
    const cleanEmail = adminUsername.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('اكتب بريدك الإلكتروني أولاً في الخانة ثم اضغط على استعادة كلمة المرور.');
      return;
    }
    const res = await firebaseService.resetCustomerPassword(cleanEmail);
    if (res.success) {
      setAuthInfo(res.message);
    } else {
      setAuthError(res.message);
    }
  };

  const selectUserForCosmetics = (target: UserProfile) => {
    setCosmeticTargetUser(target);
    setCosIsVerified(Boolean(target.isVerified));
    setCosBadgeColor((target.verifiedBadgeColor as VerifiedBadgeColor) || 'blue');
    setCosBadgeShape((target.verifiedBadgeShape as VerifiedBadgeShape) || 'rosette');
    setCosBadgeGlow(target.verifiedBadgeGlow !== false);
    setCosNameGlow(target.nameGlowColor || 'none');
    setCosFrameUrl(target.equippedFrameUrl || '');
    setCosFrameGlow(target.frameGlowColor || 'rgba(250, 204, 21, 0.95)');
    setCosFrameAnimated(Boolean(target.frameAnimated));
    setCosCustomIconUrl(target.customIconUrl || '');
    setCosCustomIconGlow(target.customIconGlow || 'rgba(250, 204, 21, 0.95)');
    setCosCustomIconAnimated(target.customIconAnimated !== false);
  };

  // Recharges & Actor Authority Helpers
  const actorEmail = firebaseService.getCurrentAuthEmail() || activeAdminEmail || 'livo.admin@gmail.com';
  const isOwnerSession = livoStore.isOwnerEmail(actorEmail);
  const currentSupervisorRecord = !isOwnerSession && actorEmail
    ? supervisors.find((s) => s.isActive && s.email.trim().toLowerCase() === actorEmail.trim().toLowerCase())
    : undefined;

  const canAccessSection = (sectionId: string): boolean => {
    if (isOwnerSession) return true;
    if (sectionId === 'dashboard') return true;
    if (sectionId === 'supervisors') return false;
    const permMap: Record<string, string> = {
      direct_support_hub: 'support',
      inbox: 'support',
      ads: 'support',
      recharges: 'recharges',
      payment_settings: 'recharges',
      recharge_codes: 'recharges',
      manual_coins: 'recharges',
      pricing: 'recharges',
      financial_logs: 'recharges',
      users: 'users',
      cosmetics_studio: 'users',
      agencies: 'agencies',
      verifications: 'verifications',
      withdrawals: 'withdrawals',
      store_items: 'rooms',
      rooms: 'rooms',
      official_room: 'rooms',
      bans: 'bans'
    };
    const reqPerm = permMap[sectionId];
    return reqPerm ? Boolean(currentSupervisorRecord?.permissions?.includes(reqPerm)) : false;
  };

  useEffect(() => {
    if (isAdminLoggedIn && !canAccessSection(activeSection)) {
      setActiveSection('dashboard');
    }
  }, [isAdminLoggedIn, activeSection, actorEmail, supervisors.length]);

  const handleApproveRecharge = (reqId: string) => {
    const res = livoStore.approveRechargeRequest(reqId, actorEmail);
    showToast(res.message);
  };

  const handleConfirmRejectRecharge = () => {
    if (!rejectModalReqId) return;
    const res = livoStore.rejectRechargeRequest(rejectModalReqId, rejectReason, actorEmail);
    setRejectModalReqId(null);
    setRejectReason('');
    showToast(res.message);
  };

  // Manual Coins Execution
  const handleExecuteCoinAdjustment = () => {
    if (!selectedUserForCoins) return;
    const parsedAmount = parseInt(coinAmountInput, 10);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      showToast('يرجى إدخال كمية صحيحة');
      return;
    }

    const res = livoStore.adjustUserCoins(
      selectedUserForCoins.uid,
      coinActionType,
      parsedAmount,
      coinReasonInput,
      actorEmail
    );

    setCoinActionFeedback(res);
    setShowCoinConfirmModal(false);

    if (res.success) {
      const updated = livoStore.getUserByUid(selectedUserForCoins.uid);
      if (updated) setSelectedUserForCoins(updated);
      setCoinAmountInput('');
      setCoinReasonInput('');
      showToast(res.message);
    }
  };

  // Ban Execution
  const handleExecuteBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBan) return;
    if (!banReason.trim()) {
      showToast('يرجى كتابة سبب الحظر');
      return;
    }

    const res = livoStore.banUser({
      uid: selectedUserForBan.uid,
      banType,
      duration: banDuration,
      durationDays: banDuration === 'temporary' ? parseInt(banDays, 10) || 7 : undefined,
      reason: banReason.trim(),
      bannedBy: actorEmail
    });

    showToast(res.message);
    if (res.success) {
      setBanReason('');
      setSelectedUserForBan(null);
      setBanSearchUid('');
    }
  };

  const handleExecuteUnban = () => {
    if (!unbanModalRecord) return;
    const res = livoStore.unbanUser(unbanModalRecord.id, unbanReasonText, actorEmail);
    showToast(res.message);
    setUnbanModalRecord(null);
    setUnbanReasonText('');
  };

  // Support Ticket Reply Handler
  const handleReplyToTicket = () => {
    if (!selectedTicket || !ticketReplyText.trim()) {
      showToast('يرجى كتابة نص الرد للمستخدم');
      return;
    }
    const success = livoStore.replyToSupportTicket(
      selectedTicket.id,
      ticketReplyText,
      ticketReplyStatus,
      actorEmail
    );
    if (success) {
      showToast('تم إرسال الرد للمستخدم وتحديث حالة التذكرة بنجاح ✓');
      setTicketReplyText('');
      const updated = livoStore.getSupportTickets().find(t => t.id === selectedTicket.id);
      setSelectedTicket(updated || null);
    } else {
      showToast('تعذر حفظ الرد');
    }
  };

  // Advertisement Creation Handler
  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdImageUrl.trim()) {
      showToast('يرجى إدخال عنوان الإعلان ورابط الصورة');
      return;
    }

    livoStore.createAdvertisement({
      title: newAdTitle.trim(),
      description: newAdDescription.trim(),
      imageUrl: newAdImageUrl.trim(),
      targetUrl: newAdTargetUrl.trim() || undefined,
      placement: newAdPlacement,
      startDate: newAdStartDate,
      endDate: newAdEndDate,
      createdBy: actorEmail
    });

    showToast('تم نشر وتفعيل الإعلان في منظومة LIVO بنجاح ✓');
    setShowCreateAdModal(false);
    setNewAdTitle('');
    setNewAdDescription('');
    setNewAdImageUrl('');
    setNewAdTargetUrl('');
  };

  const handleToggleAdStatus = (ad: Advertisement) => {
    const newStatus = ad.status === 'active' ? 'inactive' : 'active';
    livoStore.updateAdvertisement(ad.id, { status: newStatus });
    showToast(`تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الإعلان بنجاح`);
  };

  const handleDeleteAd = (adId: string) => {
    livoStore.deleteAdvertisement(adId);
    setAdDeleteConfirmId(null);
    showToast('تم حذف الإعلان نهائياً من قاعدة البيانات');
  };

  // Accurate Counters (Synced directly to Firestore state)
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => !u.isBanned).length;
  const pendingRechargesCount = recharges.filter(r => r.status === 'pending').length;
  const pendingTicketsCount = tickets.filter(t => t.status === 'pending').length;
  const activeAdsCount = ads.filter(a => a.status === 'active').length;
  const totalRechargedEGP = recharges
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.amountEGP, 0);
  const totalCoinsInCirculation = users.reduce((sum, u) => sum + u.coins, 0);
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedAgenciesCount = agencies.filter(a => a.status === 'approved').length;
  const unreadDirectMessagesCount = allMessages.filter(m => m.receiverUid === '10000' && m.status !== 'read').length;
  const unreadSupportCount = unreadDirectMessagesCount + pendingTicketsCount;

  // Filtered Recharges List (supports UID 10000 - 100000+ & phone/name search)
  const filteredRecharges = recharges.filter(r => {
    if (rechargeFilter !== 'all' && r.status !== rechargeFilter) return false;
    const q = rechargesSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.uid.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q) ||
      (r.payerPhone && r.payerPhone.toLowerCase().includes(q))
    );
  });

  // Filtered Support Tickets (supports UID 10000 - 100000+ search)
  const filteredTickets = tickets.filter(t => {
    if (ticketCategoryFilter !== 'all' && t.category !== ticketCategoryFilter) return false;
    if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
    const q = inboxSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.uid.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  });

  // Direct Support Hub Handlers
  const handleSendAdminDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportChatInput.trim() || !selectedSupportUser) return;
    livoStore.sendDirectMessage({
      senderUid: '10000',
      receiverUid: selectedSupportUser.uid,
      content: supportChatInput.trim()
    });
    setSupportChatInput('');
    showToast('تم إرسال الرسالة إلى المستخدم بنجاح');
  };

  // Payment Settings Handlers
  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTitle.trim() || !paymentAccountNum.trim()) {
      showToast('يرجى ملء اسم الوسيلة ورقم الحساب');
      return;
    }
    const newMethod: PaymentMethodConfig = {
      id: editPaymentId || `pay-${Date.now()}`,
      type: paymentType,
      title: paymentTitle.trim(),
      accountNumber: paymentAccountNum.trim(),
      accountHolder: paymentHolderName.trim() || 'إدارة LIVO',
      instructions: paymentInstructions.trim() || 'يرجى تحويل المبلغ وإرفاق صورة إيصال التحويل واضحة',
      isActive: true,
      isDefault: paymentIsDefault,
      updatedAt: new Date().toISOString(),
      updatedBy: activeAdminEmail || 'livo.admin@gmail.com'
    };
    livoStore.savePaymentMethod(newMethod);
    showToast(editPaymentId ? 'تم تحديث وسيلة الدفع بنجاح' : 'تم إضافة وسيلة الدفع بنجاح');
    setShowAddPaymentModal(false);
    setEditPaymentId(null);
    setPaymentTitle('');
    setPaymentAccountNum('');
    setPaymentHolderName('');
    setPaymentInstructions('');
    setPaymentIsDefault(false);
  };

  const handleTogglePaymentStatus = (method: PaymentMethodConfig) => {
    livoStore.savePaymentMethod({
      ...method,
      isActive: !method.isActive,
      updatedAt: new Date().toISOString()
    });
    showToast(`تم ${!method.isActive ? 'تفعيل' : 'تعطيل'} وسيلة الدفع`);
  };

  const handleDeletePaymentMethod = (id: string) => {
    livoStore.deletePaymentMethod(id);
    showToast('تم حذف وسيلة الدفع بنجاح');
  };

  // Coin Packages CRUD Handlers
  const handleSaveCoinPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCoins = parseInt(pkgCoinsInput, 10);
    const parsedPrice = parseFloat(pkgPriceInput);
    if (isNaN(parsedCoins) || parsedCoins <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast('يرجى إدخال عدد كوينز وسعر صالحين أكبر من الصفر');
      return;
    }
    const pkg: CoinPackage = {
      id: editCoinPkgId || `pkg-${Date.now()}`,
      coins: parsedCoins,
      priceEGP: parsedPrice,
      popular: pkgPopularInput,
      isActive: pkgActiveInput,
      updatedAt: new Date().toISOString()
    };
    livoStore.saveCoinPackage(pkg);
    showToast(editCoinPkgId ? 'تم تعديل باقة الشحن بنجاح ✓' : 'تمت إضافة باقة الشحن الجديدة بنجاح ✓');
    setShowCoinPkgModal(false);
    setEditCoinPkgId(null);
    setPkgCoinsInput('');
    setPkgPriceInput('');
    setPkgPopularInput(false);
    setPkgActiveInput(true);
  };

  const handleToggleCoinPackageActive = (pkg: CoinPackage) => {
    livoStore.saveCoinPackage({
      ...pkg,
      isActive: pkg.isActive === false ? true : false,
      updatedAt: new Date().toISOString()
    });
    showToast(`تم ${pkg.isActive === false ? 'تفعيل' : 'تعطيل'} باقة ${pkg.coins.toLocaleString()} كوينز`);
  };

  const handleDeleteCoinPackage = (id: string) => {
    livoStore.deleteCoinPackage(id);
    showToast('تم حذف باقة الشحن بنجاح');
  };

  // Recharge Codes Handlers
  const handleCreateRechargeCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCodeInput.trim().toUpperCase();
    const parsedCoins = parseInt(newCodeCoinsInput, 10);
    const parsedMaxUses = parseInt(newCodeMaxUsesInput, 10) || 100;
    if (!cleanCode || isNaN(parsedCoins) || parsedCoins <= 0) {
      showToast('يرجى إدخال كود صالح وقيمة كوينز أكبر من الصفر');
      return;
    }
    if (rechargeCodes.some(c => c.code.toUpperCase() === cleanCode)) {
      showToast('هذا الكود موجود بالفعل، يرجى اختيار كود آخر');
      return;
    }
    const created = livoStore.createRechargeCode({
      code: cleanCode,
      coins: parsedCoins,
      maxUses: parsedMaxUses,
      createdBy: activeAdminEmail || 'livo.admin@gmail.com'
    });
    showToast(`تم إنشاء كود الشحن ${created.code} بقيمة ${created.coins.toLocaleString()} كوينز ✓`);
    setShowAddCodeModal(false);
    setNewCodeInput('');
    setNewCodeCoinsInput('');
    setNewCodeMaxUsesInput('100');
  };

  const handleDeleteRechargeCode = (codeId: string) => {
    livoStore.deleteRechargeCode(codeId);
    showToast('تم حذف كود الشحن بنجاح');
  };

  // Gifts Handlers (Add + Edit + PNG upload with BG removal + Firestore-safe compression + Toggle Active + Delete)
  const handleUploadGiftImage = async (file: File) => {
    setIsProcessingGiftImage(true);
    try {
      const transparentPng = await removeImageBackgroundToPng(file, { maxSize: 320, tolerance: 34 });
      const compressedPng = await compressImageForFirestore(transparentPng, {
        preserveAlpha: true,
        maxDim: 320,
        maxBytes: 160_000
      });
      let finalUrl = compressedPng;
      try {
        finalUrl = await firebaseService.uploadImage(`gifts/gift_${Date.now()}.png`, compressedPng, {
          preserveAlpha: true,
          maxDim: 320,
          maxBytes: 160_000
        });
      } catch {
        finalUrl = compressedPng;
      }
      setNewGiftImageUrl(finalUrl);
      showToast('تم رفع صورة الهدية وتفريغ خلفيتها إلى PNG شفاف ✓');
    } catch {
      showToast('تعذر معالجة صورة الهدية');
    } finally {
      setIsProcessingGiftImage(false);
    }
  };

  const handleSaveGift = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseInt(newGiftPrice, 10);
    if (!newGiftName.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast('يرجى إدخال اسم الهدية وسعر صحيح');
      return;
    }
    const existingGift = editGiftId ? giftsList.find(g => g.id === editGiftId) : undefined;
    const savedGift: GiftItem = {
      id: editGiftId || `gift-${Date.now()}`,
      name: newGiftName.trim(),
      coins: parsedPrice,
      icon: newGiftIcon.trim() || '🎁',
      imageUrl: newGiftImageUrl.trim() || undefined,
      category: existingGift?.category || 'popular',
      animationType: newGiftAnimation,
      durationMs: existingGift?.durationMs || 3500,
      isActive: existingGift?.isActive ?? true,
      updatedAt: new Date().toISOString()
    };
    livoStore.saveGift(savedGift);
    showToast(editGiftId ? `تم تحديث الهدية ${savedGift.name} بنجاح ✓` : `تمت إضافة الهدية ${savedGift.name} للمتجر بنجاح ✓`);
    setShowAddGiftModal(false);
    setEditGiftId(null);
    setNewGiftName('');
    setNewGiftPrice('');
    setNewGiftIcon('🎁');
    setNewGiftImageUrl('');
    setNewGiftAnimation('heart');
  };

  const handleToggleGiftStatus = (gift: GiftItem) => {
    livoStore.saveGift({
      ...gift,
      isActive: gift.isActive === false ? true : false,
      updatedAt: new Date().toISOString()
    });
    showToast(`تم ${gift.isActive === false ? 'تفعيل' : 'تعطيل'} الهدية ${gift.name}`);
  };

  const handleDeleteGift = (giftId: string) => {
    livoStore.deleteGift(giftId);
    showToast('تم حذف الهدية من المتجر');
  };

  // Verifications Handlers
  const handleConfirmRejectVerification = () => {
    if (!rejectVerificationId) return;
    livoStore.reviewVerificationRequest(rejectVerificationId, 'rejected', actorEmail, rejectVerificationReason);
    showToast('تم رفض طلب التوثيق وإشعار المستخدم');
    setRejectVerificationId(null);
    setRejectVerificationReason('');
  };

  // Withdrawals Handlers
  const handleConfirmRejectWithdrawal = () => {
    if (!rejectWithdrawalId) return;
    livoStore.reviewWithdrawalRequest(rejectWithdrawalId, 'rejected', undefined, actorEmail, rejectWithdrawalReason);
    showToast('تم رفض طلب السحب واسترجاع الكوينز لحساب المستخدم تلقائياً');
    setRejectWithdrawalId(null);
    setRejectWithdrawalReason('');
  };

  // Login Screen (Unified Bright LIVO Brand Theme)
  if (!isAdminLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto my-8 bg-white rounded-3xl border border-gray-200 p-6 text-gray-900 shadow-xl light-surface">
        <div className="text-center space-y-3 mb-6">
          <div className="flex justify-center">
            <LivoAdminAppIcon size={68} />
          </div>
          <h2 className="text-xl font-black text-gray-900">تسجيل دخول إدارة LIVO</h2>
          <p className="text-xs text-gray-500 font-medium">
            التحقق الموثق لحسابات المالك والمشرفين عبر Firebase
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني للإدارة:</label>
            <input
              type="email"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="livo.admin@gmail.com أو eslamfifty11@gmail.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#FFE600] focus:ring-2 focus:ring-yellow-200 font-digits"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">كلمة المرور:</label>
              <button
                type="button"
                onClick={handleAdminPasswordReset}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>نسيت كلمة المرور؟</span>
              </button>
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="اكتب كلمة المرور"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#FFE600] focus:ring-2 focus:ring-yellow-200 font-digits"
              required
            />
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authInfo && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-xl text-xs flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authInfo}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            <span>تأكيد الدخول الآمن للوحة الإدارة</span>
          </button>

          <div className="pt-3 border-t border-gray-100 space-y-2">
            <button
              type="button"
              onClick={() => handleGoogleLogin(false)}
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>تسجيل الدخول السريع بحساب Google للمالك</span>
            </button>
            <button
              type="button"
              onClick={() => handleGoogleLogin(true)}
              disabled={isLoggingIn}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <span>تسجيل الدخول بصفحة Google كاملة (للموبايل ومتصفح Brave)</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#FAFAFA] text-gray-900 rounded-3xl border border-gray-200 shadow-xl overflow-hidden flex flex-col min-h-[720px] relative light-surface">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-2 rounded-full text-xs font-black shadow-2xl border border-yellow-300 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <LivoAdminAppIcon size={36} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-sm sm:text-base text-gray-900">منظومة LIVO — لوحة الإدارة الرسمية</h1>
              <span className="text-[10px] bg-[#FFE600] text-black px-2 py-0.5 rounded-md font-black">
                {isOwnerSession ? 'Owner Authority Active' : 'Supervisor Access Active'}
              </span>
              {actorEmail && (
                <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md font-bold font-digits" dir="ltr">
                  {actorEmail}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              متصلة بقاعدة بيانات LIVO الموحدة والمزامنة اللحظية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-3 py-1.5 rounded-xl transition-all font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Navigation Sidebar / Tabs & Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-gray-200 p-2.5 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1 shrink-0">
          
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'dashboard' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>الإحصائيات والمؤشرات</span>
          </button>

          {canAccessSection('direct_support_hub') && (
            <button
              onClick={() => setActiveSection('direct_support_hub')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'direct_support_hub' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>مركز الإدارة والدعم المباشر</span>
              </div>
              {unreadSupportCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-digits text-[10px] flex items-center justify-center font-black animate-pulse">
                  {unreadSupportCount}
                </span>
              )}
            </button>
          )}

          {canAccessSection('inbox') && (
            <button
              onClick={() => setActiveSection('inbox')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'inbox' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-600" />
                <span>صندوق الوارد والشكاوى</span>
              </div>
              {pendingTicketsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white font-digits text-[10px] flex items-center justify-center font-black animate-pulse">
                  {pendingTicketsCount}
                </span>
              )}
            </button>
          )}

          {canAccessSection('ads') && (
            <button
              onClick={() => setActiveSection('ads')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'ads' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span>مركز إدارة الإعلانات</span>
              </div>
              {activeAdsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-digits text-[10px] flex items-center justify-center font-black">
                  {activeAdsCount}
                </span>
              )}
            </button>
          )}

          {canAccessSection('recharges') && (
            <button
              onClick={() => setActiveSection('recharges')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'recharges' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>طلبات الشحن</span>
              </div>
              {pendingRechargesCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white font-digits text-[10px] flex items-center justify-center">
                  {pendingRechargesCount}
                </span>
              )}
            </button>
          )}

          {canAccessSection('payment_settings') && (
            <button
              onClick={() => setActiveSection('payment_settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'payment_settings' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>إعدادات الشحن ووسائل الدفع</span>
            </button>
          )}

          {canAccessSection('recharge_codes') && (
            <button
              onClick={() => setActiveSection('recharge_codes')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'recharge_codes' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <QrCode className="w-4 h-4 text-pink-600" />
              <span>أكواد الشحن والقسائم ({rechargeCodes.length})</span>
            </button>
          )}

          {canAccessSection('manual_coins') && (
            <button
              onClick={() => setActiveSection('manual_coins')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'manual_coins' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-600" />
              <span>شحن وتعديل رصيد UID</span>
            </button>
          )}

          {canAccessSection('pricing') && (
            <button
              onClick={() => setActiveSection('pricing')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'pricing' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BadgePercent className="w-4 h-4 text-emerald-600" />
              <span>أسعار وباقات الكوينز</span>
            </button>
          )}

          {canAccessSection('users') && (
            <button
              onClick={() => setActiveSection('users')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'users' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>الحسابات والمستخدمين ({users.length})</span>
            </button>
          )}

          {canAccessSection('cosmetics_studio') && (
            <button
              onClick={() => setActiveSection('cosmetics_studio')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'cosmetics_studio' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-600" />
              <span>استوديو الإطارات والتوثيق VIP</span>
            </button>
          )}

          {canAccessSection('agencies') && (
            <button
              onClick={() => setActiveSection('agencies')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'agencies' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>الوكالات والوكلاء</span>
              </div>
              {approvedAgenciesCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-digits text-[10px] flex items-center justify-center">
                  {approvedAgenciesCount}
                </span>
              )}
            </button>
          )}

          {canAccessSection('verifications') && (
            <button
              onClick={() => setActiveSection('verifications')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'verifications' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span>التوثيق والشارات</span>
              </div>
              {verifications.filter(v => v.status === 'pending').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-digits text-[10px] flex items-center justify-center">
                  {verifications.filter(v => v.status === 'pending').length}
                </span>
              )}
            </button>
          )}

          {canAccessSection('withdrawals') && (
            <button
              onClick={() => setActiveSection('withdrawals')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'withdrawals' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                <span>طلبات السحب</span>
              </div>
              {pendingWithdrawalsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-digits text-[10px] flex items-center justify-center">
                  {pendingWithdrawalsCount}
                </span>
              )}
            </button>
          )}

          {canAccessSection('store_items') && (
            <button
              onClick={() => setActiveSection('store_items')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'store_items' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-pink-600" />
              <span>المتجر والهدايا وضرب الغرف</span>
            </button>
          )}

          {canAccessSection('rooms') && (
            <button
              onClick={() => setActiveSection('rooms')}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'rooms' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-600" />
                <span>إدارة الغرف والبثوث</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-digits text-[10px]">
                {rooms.filter(r => !r.isOfficial && r.status === 'open').length}
              </span>
            </button>
          )}

          {canAccessSection('official_room') && (
            <button
              onClick={() => setActiveSection('official_room')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'official_room' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Radio className="w-4 h-4 text-rose-600" />
              <span>الغرفة الرسمية والإعلانات</span>
            </button>
          )}

          {canAccessSection('bans') && (
            <button
              onClick={() => setActiveSection('bans')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'bans' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Slash className="w-4 h-4 text-red-600" />
              <span>إدارة الحظر والعقوبات</span>
            </button>
          )}

          {canAccessSection('supervisors') && (
            <button
              onClick={() => setActiveSection('supervisors')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'supervisors' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>صلاحيات المشرفين</span>
            </button>
          )}

          {canAccessSection('financial_logs') && (
            <button
              onClick={() => setActiveSection('financial_logs')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'financial_logs' ? 'bg-[#FFE600] text-black font-black shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4 text-gray-600" />
              <span>السجل المالي الدائم</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#FAFAFA] p-4 sm:p-6 overflow-y-auto light-surface">
          
          {/* SECTION 1: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-gray-900">نظرة عامة على المنظومة</h2>
                <p className="text-xs text-gray-500">
                  إحصائيات حية مستمدة ومحدثة لحظياً من قاعدة بيانات Firebase
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-xs text-gray-500 font-bold block">إجمالي المستخدمين</span>
                  <span className="text-2xl font-black font-digits text-gray-900 mt-1 block">
                    {totalUsersCount}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                    {activeUsersCount} نشط • 0 وهمي
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-xs text-gray-500 font-bold block">طلبات شحن قيد الانتظار</span>
                  <span className="text-2xl font-black font-digits text-amber-600 mt-1 block">
                    {pendingRechargesCount}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    تتطلب موافقة الإدارة
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-xs text-gray-500 font-bold block">إجمالي مبيعات الشحن</span>
                  <span className="text-2xl font-black font-digits text-emerald-600 mt-1 block">
                    {totalRechargedEGP.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    مبيعات معتمدة بإيصالات
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-xs text-gray-500 font-bold block">الكوينز المتداولة</span>
                  <span className="text-2xl font-black font-digits text-amber-600 mt-1 block">
                    {totalCoinsInCirculation.toLocaleString()} 🪙
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    أرصدة حسابات فعلية
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveSection('cosmetics_studio')}
                  className="bg-white hover:border-[#FFE600] p-3.5 rounded-2xl border border-gray-200 shadow-xs text-right transition-all group"
                >
                  <Crown className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="block text-xs font-black text-gray-900">استوديو الإطارات VIP</span>
                  <span className="block text-[10px] text-gray-500">تخصيص الإطار والشارة والتوهج</span>
                </button>
                <button
                  onClick={() => setActiveSection('store_items')}
                  className="bg-white hover:border-[#FFE600] p-3.5 rounded-2xl border border-gray-200 shadow-xs text-right transition-all group"
                >
                  <Zap className="w-5 h-5 text-pink-500 mb-1.5" />
                  <span className="block text-xs font-black text-gray-900">ضرب الهدايا للغرف</span>
                  <span className="block text-[10px] text-gray-500">إرسال هدايا طائرة وإدارة المتجر</span>
                </button>
                <button
                  onClick={() => setActiveSection('recharges')}
                  className="bg-white hover:border-[#FFE600] p-3.5 rounded-2xl border border-gray-200 shadow-xs text-right transition-all group"
                >
                  <CreditCard className="w-5 h-5 text-emerald-600 mb-1.5" />
                  <span className="block text-xs font-black text-gray-900">مراجعة الشحن ({pendingRechargesCount})</span>
                  <span className="block text-[10px] text-gray-500">قبول ورفض الإيصالات</span>
                </button>
                <button
                  onClick={() => setActiveSection('manual_coins')}
                  className="bg-white hover:border-[#FFE600] p-3.5 rounded-2xl border border-gray-200 shadow-xs text-right transition-all group"
                >
                  <Coins className="w-5 h-5 text-amber-600 mb-1.5" />
                  <span className="block text-xs font-black text-gray-900">شحن فوري برقم UID</span>
                  <span className="block text-[10px] text-gray-500">تعديل رصيد أي حساب مباشرة</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION: CENTRAL ADMIN INBOX & USER TICKETS */}
          {activeSection === 'inbox' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-amber-600" />
                    <h2 className="text-base font-black text-gray-900">صندوق الوارد المركزي والرسائل والدعم</h2>
                    {pendingTicketsCount > 0 && (
                      <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-digits font-bold px-2 py-0.5 rounded-full">
                        {pendingTicketsCount} طلب بانتظار الرد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    استقبال مباشر ولحظي لرسائل المستخدمين، الشكاوى، البلاغات، والاستفسارات مع الرد الفوري الموثق
                  </p>
                </div>

                {/* Filters + Universal UID Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2" />
                    <input
                      type="text"
                      value={inboxSearchQuery}
                      onChange={(e) => setInboxSearchQuery(e.target.value)}
                      placeholder="بحث بـ UID (10000-100000+) أو الاسم..."
                      className="bg-white border border-gray-200 rounded-xl pr-8 pl-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits w-52"
                    />
                  </div>
                  <select
                    value={ticketCategoryFilter}
                    onChange={(e: any) => setTicketCategoryFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                  >
                    <option value="all">جميع التصنيفات</option>
                    <option value="complaint">شكاوى ومشاكل</option>
                    <option value="financial">مشاكل الشحن والرصيد المالي</option>
                    <option value="report">بلاغات وإساءة</option>
                    <option value="technical">مشاكل تقنية</option>
                    <option value="inquiry">استفسارات عامة</option>
                  </select>

                  <select
                    value={ticketStatusFilter}
                    onChange={(e: any) => setTicketStatusFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="in_progress">قيد المعالجة</option>
                    <option value="resolved">تم الحل والرد</option>
                    <option value="closed">مغلقة</option>
                  </select>
                </div>
              </div>

              {/* Tickets List and Detail Drawer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Tickets Column */}
                <div className="lg:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredTickets.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-400 space-y-2">
                      <Inbox className="w-8 h-8 mx-auto opacity-40 text-gray-400" />
                      <p>لا توجد رسائل أو تذاكر مطابقة لخيارات الفلترة</p>
                    </div>
                  ) : (
                    filteredTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setTicketReplyText(ticket.reply || '');
                          setTicketReplyStatus(ticket.status === 'pending' ? 'resolved' : ticket.status);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          selectedTicket?.id === ticket.id
                            ? 'bg-yellow-50 border-[#FFE600] shadow-sm'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={ticket.userAvatar}
                              alt={ticket.username}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const ticketUser = livoStore.getUserByUid(ticket.uid);
                                  return (
                                    <UserNameWithBadges
                                      displayName={ticketUser?.displayName || ticket.username}
                                      nameGlowColor={ticketUser?.nameGlowColor}
                                      isVerified={ticketUser?.isVerified}
                                      verifiedBadgeColor={ticketUser?.verifiedBadgeColor}
                                      verifiedBadgeShape={ticketUser?.verifiedBadgeShape}
                                      verifiedBadgeGlow={ticketUser?.verifiedBadgeGlow}
                                      customIconUrl={ticketUser?.customIconUrl}
                                      customIconGlow={ticketUser?.customIconGlow}
                                      customIconAnimated={ticketUser?.customIconAnimated}
                                      customIconLabel={ticketUser?.customIconLabel}
                                      badgeSize={13}
                                      iconSize={16}
                                      nameClassName="font-bold text-xs text-gray-900"
                                    />
                                  );
                                })()}
                                <span className="text-[10px] text-amber-700 font-digits font-bold shrink-0">UID: {ticket.uid}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 block font-digits">
                                {new Date(ticket.createdAt).toLocaleDateString('ar-EG')} - {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              ticket.status === 'pending'
                                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                                : ticket.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : ticket.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {ticket.status === 'pending' ? 'جديد / بالانتظار' : ticket.status === 'in_progress' ? 'قيد المتابعة' : ticket.status === 'resolved' ? 'تم الرد والحل' : 'مغلق'}
                            </span>

                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                              ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' : ticket.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {ticket.priority === 'urgent' ? 'عاجل جداً' : ticket.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{ticket.subject}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{ticket.message}</p>
                          {ticket.attachmentUrl && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded">
                              <Eye className="w-3 h-3" /> مرفق صورة
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Ticket Details & Real-Time Direct Reply Drawer */}
                <div className="lg:col-span-7">
                  {selectedTicket ? (
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                      <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedTicket.userAvatar}
                            alt={selectedTicket.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#FFE600]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-gray-900">{selectedTicket.username}</h3>
                              <span className="bg-[#FFE600] text-black text-[10px] font-black px-2 py-0.5 rounded-full font-digits">
                                UID: {selectedTicket.uid}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 font-digits">
                              تاريخ الإرسال: {new Date(selectedTicket.createdAt).toLocaleString('ar-EG')}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                          selectedTicket.category === 'complaint' ? 'bg-red-50 text-red-700' :
                          selectedTicket.category === 'financial' ? 'bg-amber-50 text-amber-800' :
                          selectedTicket.category === 'report' ? 'bg-purple-50 text-purple-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {selectedTicket.category === 'complaint' ? 'شكوى رسمية' :
                           selectedTicket.category === 'financial' ? 'مشكلة شحن ورصيد' :
                           selectedTicket.category === 'report' ? 'بلاغ مستخدم' :
                           selectedTicket.category === 'technical' ? 'مشكلة تقنية' : 'استفسار'}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                        <div className="flex items-center gap-2 text-amber-700 text-xs font-bold">
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>الموضوع: {selectedTicket.subject}</span>
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.message}
                        </p>

                        {selectedTicket.attachmentUrl && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-[10px] text-gray-500 font-bold block mb-1">المرفق / لقطة الشاشة:</span>
                            <div
                              onClick={() => setZoomedTicketImageUrl(selectedTicket.attachmentUrl || null)}
                              className="relative inline-block cursor-pointer rounded-lg overflow-hidden border border-gray-300 max-w-[200px] group"
                            >
                              <img
                                src={selectedTicket.attachmentUrl}
                                alt="مرفق التذكرة"
                                className="w-full max-h-36 object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">
                                تكبير
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedTicket.reply && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              الرد الحالي من الإدارة ({selectedTicket.repliedBy || actorEmail})
                            </span>
                            {selectedTicket.repliedAt && (
                              <span className="font-digits text-[10px] text-emerald-600">
                                {new Date(selectedTicket.repliedAt).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-wrap">
                            {selectedTicket.reply}
                          </p>
                        </div>
                      )}

                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-amber-600" />
                            <span>كتابة رد مباشر وموثق للمستخدم:</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">الحالة بعد الرد:</span>
                            <select
                              value={ticketReplyStatus}
                              onChange={(e: any) => setTicketReplyStatus(e.target.value)}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-900 outline-none"
                            >
                              <option value="resolved">تم الحل (Resolved)</option>
                              <option value="in_progress">قيد المتابعة (In Progress)</option>
                              <option value="closed">مغلقة (Closed)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('مرحباً بك في LIVO، تم فحص طلبك ومعالجة المشكلة بنجاح. نتمنى لك تجربة ممتعة.')}
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200"
                          >
                            + تم حل المشكلة بنجاح
                          </button>
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('مرحباً بك، يرجى تزويدنا برقم العملية وصورة إيصال التحويل لإتمام طلب الشحن فوراً.')}
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200"
                          >
                            + طلب إيصال الشحن
                          </button>
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('نشكرك على تواصلك، تم تحويل البلاغ للقسم المختص وسيتم اتخاذ الإجراء اللازم.')}
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200"
                          >
                            + تحويل للقسم المختص
                          </button>
                        </div>

                        <textarea
                          value={ticketReplyText}
                          onChange={(e) => setTicketReplyText(e.target.value)}
                          placeholder="اكتب رد الإدارة الرسمي هنا... سيصل مباشرة لحساب المستخدم في LIVO ويظهر في محادثات الدعم"
                          rows={4}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#FFE600]"
                        />

                        <button
                          type="button"
                          onClick={handleReplyToTicket}
                          className="w-full py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>إرسال الرد للمستخدم وتحديث التذكرة في Firebase</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-xs text-gray-400 space-y-2">
                      <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-gray-400" />
                      <p className="font-bold text-sm text-gray-700">اختر رسالة أو تذكرة من القائمة لمعاينتها والرد عليها</p>
                      <p className="text-[11px] text-gray-500">أي رد سيصل مباشرة للمستخدم ويُحفظ في سجل الدعم الفني المشترك</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ADVERTISEMENT MANAGEMENT CENTER */}
          {activeSection === 'ads' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-amber-600" />
                    <h2 className="text-base font-black text-gray-900">مركز إدارة الإعلانات والعروض الترويجية</h2>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-digits font-bold px-2 py-0.5 rounded-full">
                      {ads.length} حملة إعلانية
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    إدارة الحملات الترويجية، البانرات، النوافذ المنبثقة، وتتبع النقرات والمشاهدات الحقيقية
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateAdModal(true)}
                  className="px-3.5 py-2 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء إعلان جديد</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] text-gray-500 block">إجمالي الإعلانات</span>
                  <span className="font-digits font-black text-lg text-gray-900">{ads.length}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] text-gray-500 block">الإعلانات النشطة</span>
                  <span className="font-digits font-black text-lg text-amber-600">{activeAdsCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] text-gray-500 block">إجمالي المشاهدات</span>
                  <span className="font-digits font-black text-lg text-blue-600">
                    {ads.reduce((sum, a) => sum + (a.viewsCount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] text-gray-500 block">إجمالي النقرات</span>
                  <span className="font-digits font-black text-lg text-emerald-600">
                    {ads.reduce((sum, a) => sum + (a.clicksCount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-2xl border border-gray-200 text-center text-xs text-gray-500 space-y-2">
                    <Megaphone className="w-10 h-10 mx-auto opacity-30 text-gray-400" />
                    <p className="font-bold text-sm text-gray-800">لا توجد إعلانات منشأة حتى الآن</p>
                    <p className="text-[11px] text-gray-500">اضغط على "إنشاء إعلان جديد" لإطلاق حملة ترويجية تظهر لمستخدمي LIVO</p>
                  </div>
                ) : (
                  ads.map(ad => (
                    <div
                      key={ad.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[16/8] bg-gray-100 overflow-hidden border-b border-gray-200">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ad.status === 'active'
                                ? 'bg-emerald-500 text-white font-black'
                                : 'bg-red-500 text-white'
                            }`}>
                              {ad.status === 'active' ? 'نشط ويعمل ✓' : 'متوقف'}
                            </span>
                            <span className="bg-black/70 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-md">
                              {ad.placement === 'banner' ? 'بانر رئيسي' : ad.placement === 'popup' ? 'نافذة منبثقة' : 'خلاصة'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 space-y-2">
                          <h3 className="font-bold text-sm text-gray-900">{ad.title}</h3>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {ad.description}
                          </p>

                          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-xl text-center font-digits border border-gray-100">
                            <div>
                              <span className="text-[10px] text-gray-500 block">المشاهدات</span>
                              <span className="font-bold text-xs text-blue-600">{(ad.viewsCount || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block">النقرات</span>
                              <span className="font-bold text-xs text-emerald-600">{(ad.clicksCount || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-gray-400 font-digits flex items-center justify-between pt-1">
                            <span>البداية: {ad.startDate}</span>
                            <span>النهاية: {ad.endDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleAdStatus(ad)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            ad.status === 'active'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {ad.status === 'active' ? (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              <span>إيقاف الإعلان</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              <span>تفعيل الإعلان</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setAdDeleteConfirmId(ad.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl"
                          title="حذف الإعلان نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: RECHARGE REQUESTS */}
          {activeSection === 'recharges' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">إدارة طلبات شحن الكوينز</h2>
                  <p className="text-xs text-gray-500">
                    الطلبات محفوظة بصورة دائمة في Firestore ولن تختفي عند تحديث الصفحة أو تسجيل الدخول
                  </p>
                </div>

                {/* Filter Tabs + UID Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2" />
                    <input
                      type="text"
                      value={rechargesSearchQuery}
                      onChange={(e) => setRechargesSearchQuery(e.target.value)}
                      placeholder="بحث بـ UID (10000-100000+) أو الهاتف..."
                      className="bg-white border border-gray-200 rounded-xl pr-8 pl-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits w-56"
                    />
                  </div>
                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setRechargeFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'pending' ? 'bg-[#FFE600] text-black font-black' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    المعلقة ({recharges.filter(r => r.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setRechargeFilter('approved')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'approved' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    المقبولة ({recharges.filter(r => r.status === 'approved').length})
                  </button>
                  <button
                    onClick={() => setRechargeFilter('rejected')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'rejected' ? 'bg-red-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    المرفوضة ({recharges.filter(r => r.status === 'rejected').length})
                  </button>
                  <button
                    onClick={() => setRechargeFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    الكل ({recharges.length})
                  </button>
                </div>
                </div>
              </div>

              {filteredRecharges.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500 text-xs">
                  لا توجد طلبات شحن في هذا القسم حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecharges.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        req.status === 'pending'
                          ? 'bg-white border-amber-300 shadow-xs'
                          : req.status === 'approved'
                          ? 'bg-white border-emerald-200'
                          : 'bg-gray-50 border-red-200 opacity-85'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={req.userAvatar}
                          alt={req.username}
                          className="w-12 h-12 rounded-full border border-gray-200 object-cover shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{req.username}</span>
                            <span className="font-digits font-bold text-amber-800 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              UID: {req.uid}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              req.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span>الطلب: <strong className="font-digits text-gray-900">{req.orderNumber}</strong></span>
                            <span>الباقة: <strong className="font-digits text-amber-700">{req.packageCoins.toLocaleString()} كوينز</strong></span>
                            <span>المبلغ: <strong className="font-digits text-emerald-600">{req.amountEGP} ج.م</strong></span>
                            <span>هاتف الدافع: <strong className="font-digits text-gray-900">{req.payerPhone}</strong></span>
                          </div>

                          {req.rejectReason && (
                            <p className="text-[11px] text-red-600 mt-1">
                              سبب الرفض: {req.rejectReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {req.receiptUrl && (
                          <button
                            onClick={() => setZoomedReceiptUrl(req.receiptUrl)}
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs px-3 py-2 rounded-xl transition-all font-bold"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>معاينة الإيصال</span>
                          </button>
                        )}

                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRecharge(req.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>موافقة وإضافة الرصيد</span>
                            </button>
                            <button
                              onClick={() => setRejectModalReqId(req.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-2 rounded-xl border border-red-200 font-bold"
                            >
                              رفض الطلب
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: MANUAL COINS RECHARGE & ADJUSTMENT */}
          {activeSection === 'manual_coins' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-lg font-black text-gray-900">الشحن اليدوي وضبط أرصدة UID</h2>
                <p className="text-xs text-gray-500">
                  صلاحية خاصة بالمالك لتعديل الأرصدة مع تسجيل فوري في السجل المالي
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <label className="block text-xs font-bold text-gray-700">
                  ابحث عن المستخدم بالـ Public ID (من 10000 إلى 100000+) أو الاسم أو البريد:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchCoinsUid}
                    onChange={(e) => setSearchCoinsUid(e.target.value)}
                    placeholder="أدخل معرّف Public ID (مثال 10000 - 100000) أو الاسم..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-digits text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={async () => {
                      const matches = await triggerServerUserLookup(searchCoinsUid);
                      if (matches.length > 0) {
                        setSelectedUserForCoins(matches[0]);
                      } else {
                        showToast(`لم يتم العثور على أي مستخدم بالمعرف "${searchCoinsUid}"`);
                      }
                    }}
                    disabled={isSearchingServer}
                    className="bg-[#FFE600] hover:bg-yellow-400 text-black text-xs px-4 py-2 rounded-xl font-black shadow-sm flex items-center gap-1"
                  >
                    {isSearchingServer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>بحث شامل</span>
                  </button>
                </div>

                {searchCoinsUid.trim().length > 0 && (
                  <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl bg-gray-50/70">
                    {livoStore.searchUsersByQuery(searchCoinsUid).slice(0, 8).map((matchUser) => (
                      <button
                        key={matchUser.uid}
                        type="button"
                        onClick={() => setSelectedUserForCoins(matchUser)}
                        className="w-full px-3 py-2 flex items-center justify-between text-right hover:bg-amber-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AvatarWithFrame
                            avatarUrl={matchUser.avatar}
                            displayName={matchUser.displayName}
                            frameUrl={matchUser.equippedFrameUrl}
                            frameGlowColor={matchUser.frameGlowColor}
                            frameAnimated={matchUser.frameAnimated}
                            customIconUrl={matchUser.customIconUrl}
                            customIconGlow={matchUser.customIconGlow}
                            customIconAnimated={matchUser.customIconAnimated}
                            sizePx={36}
                          />
                          <div className="min-w-0">
                            <UserNameWithBadges
                              displayName={matchUser.displayName}
                              nameGlowColor={matchUser.nameGlowColor}
                              isVerified={matchUser.isVerified}
                              verifiedBadgeColor={matchUser.verifiedBadgeColor}
                              verifiedBadgeShape={matchUser.verifiedBadgeShape}
                              verifiedBadgeGlow={matchUser.verifiedBadgeGlow}
                              customIconUrl={matchUser.customIconUrl}
                              customIconGlow={matchUser.customIconGlow}
                              customIconAnimated={matchUser.customIconAnimated}
                              customIconLabel={matchUser.customIconLabel}
                              badgeSize={13}
                              iconSize={16}
                              nameClassName="font-bold text-xs text-gray-900"
                            />
                            <span className="text-[10px] font-digits text-gray-500">UID: {matchUser.uid} • @{matchUser.username}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-digits font-black text-amber-700">{matchUser.coins.toLocaleString('en-US')} 🪙</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedUserForCoins && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <AvatarWithFrame
                        avatarUrl={selectedUserForCoins.avatar}
                        displayName={selectedUserForCoins.displayName}
                        frameUrl={selectedUserForCoins.equippedFrameUrl}
                        frameGlowColor={selectedUserForCoins.frameGlowColor}
                        frameAnimated={selectedUserForCoins.frameAnimated}
                        customIconUrl={selectedUserForCoins.customIconUrl}
                        customIconGlow={selectedUserForCoins.customIconGlow}
                        customIconAnimated={selectedUserForCoins.customIconAnimated}
                        sizePx={52}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <UserNameWithBadges
                            displayName={selectedUserForCoins.displayName}
                            nameGlowColor={selectedUserForCoins.nameGlowColor}
                            isVerified={selectedUserForCoins.isVerified}
                            verifiedBadgeColor={selectedUserForCoins.verifiedBadgeColor}
                            verifiedBadgeShape={selectedUserForCoins.verifiedBadgeShape}
                            verifiedBadgeGlow={selectedUserForCoins.verifiedBadgeGlow}
                            customIconUrl={selectedUserForCoins.customIconUrl}
                            customIconGlow={selectedUserForCoins.customIconGlow}
                            customIconAnimated={selectedUserForCoins.customIconAnimated}
                            customIconLabel={selectedUserForCoins.customIconLabel}
                            badgeSize={14}
                            iconSize={18}
                            nameClassName="font-bold text-sm text-gray-900"
                          />
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFE600] text-black font-digits font-black shrink-0">
                            Lv.{selectedUserForCoins.level || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs font-digits text-gray-500">
                          <span className="text-amber-700 font-bold">Public ID: {selectedUserForCoins.uid}</span>
                          <span>•</span>
                          <span className="text-cyan-700 font-bold">💎 {(selectedUserForCoins.diamonds || 0).toLocaleString('en-US')} ألماسة</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-gray-500 block">رصيد الكوينز الحالي:</span>
                      <span className="text-lg font-black font-digits text-amber-600">
                        {selectedUserForCoins.coins.toLocaleString('en-US')} 🪙
                      </span>
                    </div>
                  </div>

                  {/* Operation Type */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCoinActionType('add')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        coinActionType === 'add' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      + إضافة كوينز
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoinActionType('deduct')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        coinActionType === 'deduct' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      - خصم كوينز
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoinActionType('set')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        coinActionType === 'set' ? 'bg-[#FFE600] text-black font-black shadow-sm' : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      ضبط الرصيد مباشرة
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      الكمية (أرقام إنجليزية فقط):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={coinAmountInput}
                      onChange={(e) => setCoinAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="أدخل عدد الكوينز (مثال: 5000)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-digits text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      سبب العملية الإدارية (مطلوب للتدقيق المالي):
                    </label>
                    <input
                      type="text"
                      value={coinReasonInput}
                      onChange={(e) => setCoinReasonInput(e.target.value)}
                      placeholder="مثال: تصحيح خطأ شحن، مكافأة مسابقة رسمية، تعويض"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!coinAmountInput || !coinReasonInput.trim()) {
                        showToast('يرجى إدخال الكمية والسبب معاً');
                        return;
                      }
                      setShowCoinConfirmModal(true);
                    }}
                    className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm transition-all"
                  >
                    مراجعة وتأكيد العملية
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: PRICING & COIN PACKAGES (FULL CRUD SYNCED LIVE) */}
          {activeSection === 'pricing' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">أسعار وباقات الكوينز المعتمدة</h2>
                  <p className="text-xs text-gray-500">
                    إدارة كاملة للباقات (إضافة، تعديل، تفعيل/تعطيل، حذف) مع مزامنة فورية في شاشة الشحن للعملاء
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditCoinPkgId(null);
                    setPkgCoinsInput('');
                    setPkgPriceInput('');
                    setPkgPopularInput(false);
                    setPkgActiveInput(true);
                    setShowCoinPkgModal(true);
                  }}
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة باقة شحن جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {coinPackagesList.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white p-3.5 rounded-2xl border shadow-sm transition-all flex flex-col justify-between gap-3 ${
                      pkg.isActive !== false ? 'border-gray-200' : 'border-red-200 opacity-65'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-digits font-black text-amber-600 text-base">
                            {pkg.coins.toLocaleString()} كوينز
                          </span>
                          {pkg.popular && (
                            <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-bold">
                              الأكثر طلباً
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-emerald-700 font-digits font-bold block mt-0.5">
                          {pkg.priceEGP.toLocaleString()} جنيه مصري
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                        pkg.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {pkg.isActive !== false ? 'مفعلة' : 'معطلة'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleCoinPackageActive(pkg)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                          pkg.isActive !== false ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {pkg.isActive !== false ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        <span>{pkg.isActive !== false ? 'تعطيل' : 'تفعيل'}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditCoinPkgId(pkg.id);
                            setPkgCoinsInput(String(pkg.coins));
                            setPkgPriceInput(String(pkg.priceEGP));
                            setPkgPopularInput(Boolean(pkg.popular));
                            setPkgActiveInput(pkg.isActive !== false);
                            setShowCoinPkgModal(true);
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-lg"
                          title="تعديل الباقة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoinPackage(pkg.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-lg"
                          title="حذف الباقة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: USERS MANAGEMENT */}
          {activeSection === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">إدارة الحسابات وسلامة معرّفات UID</h2>
                  <p className="text-xs text-gray-500">
                    كل مستخدم يمتلك UID فريد ثابت • حسابات حقيقية موثقة عبر Firebase بدون أي حسابات وهمية
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={usersDirectoryQuery}
                      onChange={(e) => setUsersDirectoryQuery(e.target.value)}
                      placeholder="ابحث بـ UID (10000 - 100000+) أو الاسم أو البريد..."
                      className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const found = await triggerServerUserLookup(usersDirectoryQuery);
                      if (found.length === 0 && usersDirectoryQuery.trim()) {
                        showToast(`لم يتم العثور على حساب مطابق لـ "${usersDirectoryQuery}"`);
                      }
                    }}
                    disabled={isSearchingServer}
                    className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs px-3 py-2 rounded-xl shrink-0 flex items-center gap-1"
                  >
                    {isSearchingServer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>بحث الخادم</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(usersDirectoryQuery.trim() ? livoStore.searchUsersByQuery(usersDirectoryQuery) : users).map(u => (
                  <div
                    key={u.uid}
                    className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarWithFrame
                        avatarUrl={u.avatar}
                        displayName={u.displayName}
                        frameUrl={u.equippedFrameUrl}
                        frameGlowColor={u.frameGlowColor}
                        frameAnimated={u.frameAnimated}
                        customIconUrl={u.customIconUrl}
                        customIconGlow={u.customIconGlow}
                        customIconAnimated={u.customIconAnimated}
                        sizePx={48}
                      />
                      <div className="min-w-0">
                        <UserNameWithBadges
                          displayName={u.displayName}
                          nameGlowColor={u.nameGlowColor}
                          isVerified={u.isVerified}
                          verifiedBadgeColor={u.verifiedBadgeColor}
                          verifiedBadgeShape={u.verifiedBadgeShape}
                          verifiedBadgeGlow={u.verifiedBadgeGlow}
                          customIconUrl={u.customIconUrl}
                          customIconGlow={u.customIconGlow}
                          customIconAnimated={u.customIconAnimated}
                          customIconLabel={u.customIconLabel}
                          badgeSize={14}
                          iconSize={17}
                          nameClassName="font-bold text-xs text-gray-900"
                        />
                        <span className="text-[11px] text-gray-500 font-digits block truncate">
                          UID: <strong className="text-amber-700">{u.uid}</strong> • @{u.username}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            u.role === 'owner'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'supervisor'
                              ? 'bg-cyan-100 text-cyan-800'
                              : (u.role === 'charging_agent' || u.role === 'distributor_agent' || u.role === 'agent')
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role === 'owner'
                              ? 'المالك الرسمي'
                              : u.role === 'supervisor'
                              ? 'مشرف نظام'
                              : u.role === 'charging_agent'
                              ? 'وكيل شحن'
                              : u.role === 'distributor_agent'
                              ? 'وكيل موزعين'
                              : u.role === 'agent'
                              ? 'وكيل معتمد'
                              : 'مستخدم عادي'}
                          </span>
                          <span className="text-[10px] text-gray-600 font-digits font-bold">
                            الرصيد: {u.coins.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          selectUserForCosmetics(u);
                          setActiveSection('cosmetics_studio');
                        }}
                        className="text-[11px] font-bold text-purple-700 hover:bg-purple-100 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1"
                        title="تخصيص الإطارات وتوثيق VIP"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>VIP والتوثيق</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUserForCoins(u);
                          setSearchCoinsUid(u.uid);
                          setActiveSection('manual_coins');
                        }}
                        className="text-[11px] font-black text-black hover:bg-yellow-400 bg-[#FFE600] px-2.5 py-1.5 rounded-xl shadow-sm"
                      >
                        تعديل الرصيد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5B: ADMIN-ONLY VIP COSMETICS & BADGE STUDIO */}
          {activeSection === 'cosmetics_studio' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span>استوديو VIP والإطارات الملكية والتوثيق المخصص (حصري للإدارة)</span>
                </h2>
                <p className="text-xs text-gray-500">
                  منح وتعديل الإطارات المتوهجة، الأيقونات المرفرفة PNG، توهج الاسم، وشارات التوثيق الملونة للأعضاء — محمي بقواعد الأمان ولا يمكن للمستخدمين تعديله ذاتياً
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* User Picker Column */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5 flex flex-col space-y-3">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={cosmeticSearchQuery}
                        onChange={(e) => setCosmeticSearchQuery(e.target.value)}
                        placeholder="ابحث بالـ UID (10000-100000+) أو الاسم..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerServerUserLookup(cosmeticSearchQuery)}
                      className="px-2.5 py-2 bg-[#FFE600] hover:bg-yellow-400 text-black text-[11px] font-black rounded-xl shrink-0"
                    >
                      بحث
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[540px] space-y-1.5">
                    {livoStore.searchUsersByQuery(cosmeticSearchQuery).map((u) => {
                      const active = cosmeticTargetUser?.uid === u.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => selectUserForCosmetics(u)}
                          className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between gap-2 transition-all ${
                            active
                              ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300'
                              : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <AvatarWithFrame
                              avatarUrl={u.avatar}
                              displayName={u.displayName}
                              frameUrl={u.equippedFrameUrl}
                              frameGlowColor={u.frameGlowColor}
                              frameAnimated={u.frameAnimated}
                              customIconUrl={u.customIconUrl}
                              customIconGlow={u.customIconGlow}
                              customIconAnimated={u.customIconAnimated}
                              sizePx={40}
                            />
                            <div className="min-w-0">
                              <UserNameWithBadges
                                displayName={u.displayName}
                                nameGlowColor={u.nameGlowColor}
                                isVerified={u.isVerified}
                                verifiedBadgeColor={u.verifiedBadgeColor}
                                verifiedBadgeShape={u.verifiedBadgeShape}
                                verifiedBadgeGlow={u.verifiedBadgeGlow}
                                customIconUrl={u.customIconUrl}
                                customIconGlow={u.customIconGlow}
                                customIconAnimated={u.customIconAnimated}
                                customIconLabel={u.customIconLabel}
                                badgeSize={13}
                                iconSize={16}
                                nameClassName="font-bold text-xs text-gray-900"
                              />
                              <span className="text-[10px] font-digits text-gray-500">UID: {u.uid}</span>
                            </div>
                          </div>
                          {u.equippedFrameUrl && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Editor + Live Preview Column */}
                <div className="lg:col-span-2 space-y-4">
                  {cosmeticTargetUser ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-5">
                      {/* Dual Live Previews (Dark Voice Room + Light Profile) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#180829] rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-purple-900/60">
                          <span className="text-[10px] text-purple-300 font-bold mb-2">معاينة داخل الغرفة الصوتية</span>
                          <AvatarWithFrame
                            avatarUrl={cosmeticTargetUser.avatar}
                            displayName={cosmeticTargetUser.displayName}
                            frameUrl={cosFrameUrl}
                            frameGlowColor={cosFrameGlow}
                            frameAnimated={cosFrameAnimated}
                            customIconUrl={cosCustomIconUrl}
                            customIconGlow={cosCustomIconGlow}
                            customIconAnimated={cosCustomIconAnimated}
                            sizePx={96}
                          />
                          <div className="mt-2.5 max-w-full">
                            <UserNameWithBadges
                              displayName={cosmeticTargetUser.displayName}
                              nameGlowColor={cosNameGlow}
                              isVerified={cosIsVerified}
                              verifiedBadgeColor={cosBadgeColor}
                              verifiedBadgeShape={cosBadgeShape}
                              verifiedBadgeGlow={cosBadgeGlow}
                              customIconUrl={cosCustomIconUrl}
                              customIconGlow={cosCustomIconGlow}
                              customIconAnimated={cosCustomIconAnimated}
                              badgeSize={16}
                              iconSize={20}
                              nameClassName="font-black text-sm text-white"
                            />
                          </div>
                          <span className="text-[10px] text-amber-300 font-digits mt-0.5">UID: {cosmeticTargetUser.uid}</span>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-gray-200">
                          <span className="text-[10px] text-gray-500 font-bold mb-2">معاينة في الملف الشخصي</span>
                          <AvatarWithFrame
                            avatarUrl={cosmeticTargetUser.avatar}
                            displayName={cosmeticTargetUser.displayName}
                            frameUrl={cosFrameUrl}
                            frameGlowColor={cosFrameGlow}
                            frameAnimated={cosFrameAnimated}
                            customIconUrl={cosCustomIconUrl}
                            customIconGlow={cosCustomIconGlow}
                            customIconAnimated={cosCustomIconAnimated}
                            sizePx={96}
                          />
                          <div className="mt-2.5 max-w-full">
                            <UserNameWithBadges
                              displayName={cosmeticTargetUser.displayName}
                              nameGlowColor={cosNameGlow}
                              isVerified={cosIsVerified}
                              verifiedBadgeColor={cosBadgeColor}
                              verifiedBadgeShape={cosBadgeShape}
                              verifiedBadgeGlow={cosBadgeGlow}
                              customIconUrl={cosCustomIconUrl}
                              customIconGlow={cosCustomIconGlow}
                              customIconAnimated={cosCustomIconAnimated}
                              badgeSize={16}
                              iconSize={20}
                              nameClassName="font-black text-sm text-gray-900"
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 font-digits mt-0.5">UID: {cosmeticTargetUser.uid}</span>
                        </div>
                      </div>

                      {/* 1. Royal Frame Presets + Custom Frame PNG */}
                      <div className="space-y-2.5 pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-gray-900">1. الإطار الملكي (14 إطار مفرغ شفاف + رفع مخصص)</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isProcessingCosmeticImg ? 'جاري تفريغ الخلفية...' : 'رفع إطار وتفريغ تلقائي'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  setIsProcessingCosmeticImg(true);
                                  try {
                                    const png = await removeImageBackgroundToPng(file, { maxSize: 384, tolerance: 34 });
                                    const compressed = await compressImageForFirestore(png, {
                                      preserveAlpha: true,
                                      maxDim: 384,
                                      maxBytes: 180_000
                                    });
                                    let url = compressed;
                                    try {
                                      url = await firebaseService.uploadImage(`frames/frame_${Date.now()}.png`, compressed, {
                                        preserveAlpha: true,
                                        maxDim: 384,
                                        maxBytes: 180_000
                                      });
                                    } catch {
                                      url = compressed;
                                    }
                                    setCosFrameUrl(url);
                                    showToast('تم تفريغ خلفية الإطار ورفعه بنجاح ✓');
                                  } finally {
                                    setIsProcessingCosmeticImg(false);
                                  }
                                }}
                              />
                            </label>
                            <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>قص سحري + ممحاة يدوية</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = '';
                                  if (f) {
                                    setAdminCutoutTarget('frame');
                                    setAdminCutoutSource(f);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          <button
                            type="button"
                            onClick={() => setCosFrameUrl('')}
                            className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center h-16 ${
                              !cosFrameUrl ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-gray-500'
                            }`}
                          >
                            <X className="w-4 h-4 mb-0.5" />
                            <span>بدون إطار</span>
                          </button>
                          {ROYAL_FRAME_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setCosFrameUrl(preset.url);
                                setCosFrameGlow(preset.defaultGlow);
                                setCosFrameAnimated(preset.recommendedAnimated);
                              }}
                              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center h-16 transition-all ${
                                cosFrameUrl === preset.url
                                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300'
                                  : 'border-gray-200 bg-[#180829]/90 hover:border-amber-400'
                              }`}
                              title={preset.name}
                            >
                              <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain" />
                            </button>
                          ))}
                        </div>

                        {/* Frame Glow & Flutter Animation */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-gray-700">توهج الإطار:</span>
                            {GLOW_COLOR_PRESETS.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => setCosFrameGlow(g.value)}
                                title={g.label}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                  cosFrameGlow === g.value ? 'border-gray-900 scale-110' : 'border-white shadow'
                                }`}
                                style={{ backgroundColor: g.swatch }}
                              />
                            ))}
                          </div>
                          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cosFrameAnimated}
                              onChange={(e) => setCosFrameAnimated(e.target.checked)}
                              className="w-4 h-4 accent-amber-500 rounded"
                            />
                            <span>تفعيل رفرفة وتنفس الإطار</span>
                          </label>
                        </div>
                      </div>

                      {/* 2. Custom Corner + Name Neon Icon */}
                      <div className="space-y-2.5 pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-gray-900">2. أيقونة VIP مرفرفة على الاسم وبجانب الصورة (إضاءة نيون PNG شفاف)</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {cosCustomIconUrl && (
                              <button
                                type="button"
                                onClick={() => setCosCustomIconUrl('')}
                                className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl font-bold"
                              >
                                إزالة الأيقونة
                              </button>
                            )}
                            <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>رفع وتفريغ تلقائي</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  setIsProcessingCosmeticImg(true);
                                  try {
                                    const png = await removeImageBackgroundToPng(file, { maxSize: 220, tolerance: 34 });
                                    const compressed = await compressImageForFirestore(png, {
                                      preserveAlpha: true,
                                      maxDim: 220,
                                      maxBytes: 140_000
                                    });
                                    let url = compressed;
                                    try {
                                      url = await firebaseService.uploadImage(`icons/icon_${Date.now()}.png`, compressed, {
                                        preserveAlpha: true,
                                        maxDim: 220,
                                        maxBytes: 140_000
                                      });
                                    } catch {
                                      url = compressed;
                                    }
                                    setCosCustomIconUrl(url);
                                    showToast('تم تفريغ خلفية الأيقونة وتفعيل إضاءة النيون بنجاح ✓');
                                  } finally {
                                    setIsProcessingCosmeticImg(false);
                                  }
                                }}
                              />
                            </label>
                            <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>قص سحري + ممحاة يدوية</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = '';
                                  if (f) {
                                    setAdminCutoutTarget('custom_icon');
                                    setAdminCutoutSource(f);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-gray-700">توهج الأيقونة:</span>
                            {GLOW_COLOR_PRESETS.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => setCosCustomIconGlow(g.value)}
                                title={g.label}
                                className={`w-6 h-6 rounded-full border-2 ${
                                  cosCustomIconGlow === g.value ? 'border-gray-900 scale-110' : 'border-white shadow'
                                }`}
                                style={{ backgroundColor: g.swatch }}
                              />
                            ))}
                          </div>
                          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cosCustomIconAnimated}
                              onChange={(e) => setCosCustomIconAnimated(e.target.checked)}
                              className="w-4 h-4 accent-purple-600 rounded"
                            />
                            <span>حركة رفرفة الأيقونة</span>
                          </label>
                        </div>
                      </div>

                      {/* 3. Verified Badge & Name Glow */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-900">3. شارة التوثيق المخصصة</h4>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-blue-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cosIsVerified}
                                onChange={(e) => setCosIsVerified(e.target.checked)}
                                className="w-4 h-4 accent-blue-600 rounded"
                              />
                              <span>الحساب موثق</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">لون الشارة (12 لوناً متوهجاً):</label>
                              <select
                                value={cosBadgeColor}
                                onChange={(e) => setCosBadgeColor(e.target.value as VerifiedBadgeColor)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900"
                              >
                                {VERIFIED_BADGE_COLORS.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">شكل الشارة:</label>
                              <select
                                value={cosBadgeShape}
                                onChange={(e) => setCosBadgeShape(e.target.value as VerifiedBadgeShape)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900"
                              >
                                <option value="rosette">علامة صح نجمية</option>
                                <option value="crown">تاج ملكي</option>
                                <option value="shield">درع رسمي</option>
                                <option value="diamond">ماسة VIP</option>
                              </select>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={cosBadgeGlow}
                              onChange={(e) => setCosBadgeGlow(e.target.checked)}
                              className="w-4 h-4 accent-amber-500 rounded"
                            />
                            <span>توهج ساطع خلف شارة التوثيق</span>
                          </label>
                        </div>

                        <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <h4 className="text-xs font-black text-gray-900">4. إضاءة وتوهج الاسم في الغرف (12 خيار نيون)</h4>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'none', label: 'عادي' },
                              { id: 'gold', label: 'ذهبي' },
                              { id: 'cyan', label: 'سماوي' },
                              { id: 'crimson', label: 'قرمزي' },
                              { id: 'purple', label: 'أرجواني' },
                              { id: 'emerald', label: 'زمردي' },
                              { id: 'pink', label: 'وردي نيون' },
                              { id: 'orange', label: 'برتقالي ناري' },
                              { id: 'lime', label: 'أخضر نيون' },
                              { id: 'indigo', label: 'نيلي ساطع' },
                              { id: 'silver', label: 'فضي بلاتيني' },
                              { id: 'rainbow', label: 'قوس قزح' }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCosNameGlow(opt.id as any)}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                                  cosNameGlow === opt.id
                                    ? 'bg-[#FFE600] border-amber-500 text-black'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const res = livoStore.adminAssignUserCosmetics(
                            cosmeticTargetUser.uid,
                            {
                              isVerified: cosIsVerified,
                              verifiedBadgeColor: cosBadgeColor,
                              verifiedBadgeShape: cosBadgeShape,
                              verifiedBadgeGlow: cosBadgeGlow,
                              nameGlowColor: cosNameGlow,
                              equippedFrameUrl: cosFrameUrl,
                              frameGlowColor: cosFrameGlow,
                              frameAnimated: cosFrameAnimated,
                              customIconUrl: cosCustomIconUrl,
                              customIconGlow: cosCustomIconGlow,
                              customIconAnimated: cosCustomIconAnimated
                            },
                            actorEmail
                          );
                          showToast(res.message);
                        }}
                        className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>حفظ واعتماد التخصيصات الملكية لـ {cosmeticTargetUser.displayName}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
                      <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                      <h4 className="font-bold text-sm text-gray-900">اختر عضواً من القائمة لتخصيص إطار VIP وشارة التوثيق</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        جميع الإطارات والتوهجات والأيقونات المرفرفة يتم تفعيلها فوراً داخل الغرف والملف الشخصي
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: AGENCIES */}
          {activeSection === 'agencies' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">إدارة الوكالات والوكلاء المعتمدين</h2>
                  <p className="text-xs text-gray-500">
                    اعتماد طلبات الوكالات ومنح صلاحية الشحن المباشر للمستخدمين
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={agenciesSearchQuery}
                    onChange={(e) => setAgenciesSearchQuery(e.target.value)}
                    placeholder="بحث بـ UID (10000-100000+) أو اسم الوكالة..."
                    className="w-full bg-white border border-gray-200 rounded-xl pr-8 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                  />
                </div>
              </div>

              {(() => {
                const q = agenciesSearchQuery.trim().toLowerCase();
                const filteredAgencies = q
                  ? agencies.filter(
                      (a) =>
                        a.uid.toLowerCase().includes(q) ||
                        a.agencyName.toLowerCase().includes(q) ||
                        a.username.toLowerCase().includes(q) ||
                        (a.phone && a.phone.toLowerCase().includes(q))
                    )
                  : agencies;
                if (filteredAgencies.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
                      لا توجد طلبات وكالات مطابقة حالياً
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {filteredAgencies.map((agency) => {
                      const agencyUser = livoStore.getUserByUid(agency.uid);
                      return (
                        <div
                          key={agency.id}
                          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <img src={agency.userAvatar} alt="" className="w-12 h-12 rounded-full border border-gray-200 object-cover" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <UserNameWithBadges
                                  displayName={agency.agencyName}
                                  nameGlowColor={agencyUser?.nameGlowColor}
                                  isVerified={agencyUser?.isVerified}
                                  verifiedBadgeColor={agencyUser?.verifiedBadgeColor}
                                  verifiedBadgeShape={agencyUser?.verifiedBadgeShape}
                                  verifiedBadgeGlow={agencyUser?.verifiedBadgeGlow}
                                  customIconUrl={agencyUser?.customIconUrl}
                                  customIconGlow={agencyUser?.customIconGlow}
                                  customIconAnimated={agencyUser?.customIconAnimated}
                                  badgeSize={14}
                                  iconSize={17}
                                  nameClassName="font-bold text-sm text-gray-900"
                                />
                                <span className="text-xs font-digits text-amber-700 font-bold">UID: {agency.uid}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  agency.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : agency.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {agency.status === 'approved' ? 'وكالة معتمدة' : agency.status === 'pending' ? 'قيد المراجعة' : 'مرفوضة'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                النوع: {agency.agencyType === 'charging_agent' ? 'وكيل شحن' : 'وكيل موزعين'} • هاتف: {agency.phone}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-1">{agency.experienceNotes}</p>
                            </div>
                          </div>

                      <div className="flex items-center gap-2">
                        {agency.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => {
                                livoStore.reviewAgencyApplication(agency.id, 'approved', true, actorEmail);
                                showToast(`تمت الموافقة على وكالة ${agency.agencyName} وتفعيل الشحن`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold"
                            >
                              موافقة وتفعيل الشحن
                            </button>
                            <button
                              onClick={() => {
                                livoStore.reviewAgencyApplication(agency.id, 'rejected', false, actorEmail);
                                showToast('تم رفض طلب الوكالة');
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-1.5 rounded-xl font-bold"
                            >
                              رفض
                            </button>
                          </>
                        ) : agency.status === 'approved' ? (
                          <button
                            onClick={() => {
                              livoStore.toggleAgentChargingPermission(agency.id, !agency.canChargeUsers);
                              showToast(`تم ${!agency.canChargeUsers ? 'تفعيل' : 'إيقاف'} صلاحية شحن الأعضاء`);
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                              agency.canChargeUsers ? 'bg-[#FFE600] text-black font-black shadow-sm' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {agency.canChargeUsers ? 'صلاحية الشحن مفعلة ✓' : 'تفعيل صلاحية الشحن'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    );
                  })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SECTION: DIRECT SUPPORT & ADMIN HUB */}
          {activeSection === 'direct_support_hub' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">مركز الإدارة والدعم المباشر للأعضاء</h2>
                <p className="text-xs text-gray-500">
                  مراسلة فورية في الوقت الفعلي مع أي مستخدم عبر معرّف UID أو الاسم، مع متابعة الإشعارات والرسائل غير المقروءة
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[520px]">
                {/* Left Panel: Search & Users / Threads List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col space-y-3">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={supportSearchQuery}
                        onChange={(e) => setSupportSearchQuery(e.target.value)}
                        placeholder="ابحث بالـ UID (10000-100000+) أو الاسم..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerServerUserLookup(supportSearchQuery)}
                      className="px-2.5 py-2 bg-[#FFE600] hover:bg-yellow-400 text-black text-[11px] font-black rounded-xl shrink-0"
                    >
                      بحث
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-700 font-bold px-1 flex items-center justify-between">
                    <span>قائمة المستخدمين والمحادثات</span>
                    <span className="text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-digits text-amber-800">
                      {users.length} مستخدم
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[440px] pr-1">
                    {livoStore.searchUsersByQuery(supportSearchQuery)
                      .map((u) => {
                        const isSelected = selectedSupportUser?.uid === u.uid;
                        const userMsgs = allMessages.filter(
                          m => (m.senderUid === u.uid && m.receiverUid === '10000') ||
                               (m.senderUid === '10000' && m.receiverUid === u.uid)
                        );
                        const unreadUserCount = userMsgs.filter(m => m.receiverUid === '10000' && m.status !== 'read').length;
                        const lastMsg = userMsgs[userMsgs.length - 1];

                        return (
                          <button
                            key={u.uid}
                            onClick={() => setSelectedSupportUser(u)}
                            className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-amber-50 border-amber-400 text-gray-900'
                                : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AvatarWithFrame
                                avatarUrl={u.avatar}
                                displayName={u.displayName}
                                frameUrl={u.equippedFrameUrl}
                                frameGlowColor={u.frameGlowColor}
                                frameAnimated={u.frameAnimated}
                                customIconUrl={u.customIconUrl}
                                customIconGlow={u.customIconGlow}
                                customIconAnimated={u.customIconAnimated}
                                sizePx={36}
                              />
                              <div className="min-w-0">
                                <UserNameWithBadges
                                  displayName={u.displayName}
                                  nameGlowColor={u.nameGlowColor}
                                  isVerified={u.isVerified}
                                  verifiedBadgeColor={u.verifiedBadgeColor}
                                  verifiedBadgeShape={u.verifiedBadgeShape}
                                  verifiedBadgeGlow={u.verifiedBadgeGlow}
                                  customIconUrl={u.customIconUrl}
                                  customIconGlow={u.customIconGlow}
                                  customIconAnimated={u.customIconAnimated}
                                  customIconLabel={u.customIconLabel}
                                  badgeSize={13}
                                  iconSize={16}
                                  nameClassName="font-bold text-xs text-gray-900"
                                />
                                <span className="text-[10px] font-digits text-amber-700 block">UID: {u.uid}</span>
                                {lastMsg && (
                                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                    {lastMsg.content}
                                  </p>
                                )}
                              </div>
                            </div>

                            {unreadUserCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-digits text-[10px] flex items-center justify-center font-black shrink-0">
                                {unreadUserCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Right Panel: Active Direct Conversation */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
                  {selectedSupportUser ? (
                    <>
                      {/* Chat Header */}
                      <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarWithFrame
                            avatarUrl={selectedSupportUser.avatar}
                            displayName={selectedSupportUser.displayName}
                            frameUrl={selectedSupportUser.equippedFrameUrl}
                            frameGlowColor={selectedSupportUser.frameGlowColor}
                            frameAnimated={selectedSupportUser.frameAnimated}
                            customIconUrl={selectedSupportUser.customIconUrl}
                            customIconGlow={selectedSupportUser.customIconGlow}
                            customIconAnimated={selectedSupportUser.customIconAnimated}
                            sizePx={42}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <UserNameWithBadges
                                displayName={selectedSupportUser.displayName}
                                nameGlowColor={selectedSupportUser.nameGlowColor}
                                isVerified={selectedSupportUser.isVerified}
                                verifiedBadgeColor={selectedSupportUser.verifiedBadgeColor}
                                verifiedBadgeShape={selectedSupportUser.verifiedBadgeShape}
                                verifiedBadgeGlow={selectedSupportUser.verifiedBadgeGlow}
                                customIconUrl={selectedSupportUser.customIconUrl}
                                customIconGlow={selectedSupportUser.customIconGlow}
                                customIconAnimated={selectedSupportUser.customIconAnimated}
                                customIconLabel={selectedSupportUser.customIconLabel}
                                badgeSize={14}
                                iconSize={18}
                                nameClassName="font-black text-sm text-gray-900"
                              />
                              {(selectedSupportUser.role === 'charging_agent' || selectedSupportUser.agencyType === 'charging_agent') && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold shrink-0">⚡ وكيل شحن</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 font-digits">
                              UID: {selectedSupportUser.uid} • رصيد: {selectedSupportUser.coins.toLocaleString()} كوينز • هاتف: {selectedSupportUser.phoneNumber || 'غير مسجل'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedUserForCoins(selectedSupportUser);
                            setSearchCoinsUid(selectedSupportUser.uid);
                            setActiveSection('manual_coins');
                          }}
                          className="bg-[#FFE600] hover:bg-yellow-400 text-black text-xs px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>تعديل الرصيد</span>
                        </button>
                      </div>

                      {/* Messages Stream */}
                      <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[380px] my-2 pr-1">
                        {allMessages
                          .filter(
                            m => (m.senderUid === selectedSupportUser.uid && m.receiverUid === '10000') ||
                                 (m.senderUid === '10000' && m.receiverUid === selectedSupportUser.uid)
                          )
                          .map((msg) => {
                            const isAdminMsg = msg.senderUid === '10000';
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${
                                    isAdminMsg
                                      ? 'bg-[#FFE600] text-black rounded-tl-sm'
                                      : 'bg-gray-100 border border-gray-200 text-gray-900 rounded-tr-sm'
                                  }`}
                                >
                                  {msg.mediaUrl && (
                                    <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                                      <img
                                        src={msg.mediaUrl}
                                        alt="مرفق"
                                        className="max-h-48 w-full object-cover cursor-pointer hover:opacity-90"
                                        onClick={() => setZoomedReceiptUrl(msg.mediaUrl || null)}
                                      />
                                    </div>
                                  )}
                                  <p>{msg.content}</p>
                                </div>
                                <span className="text-[9px] text-gray-400 font-digits mt-1 px-1">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                      </div>

                      {/* Reply Input Bar */}
                      <form onSubmit={handleSendAdminDirectMessage} className="pt-2 border-t border-gray-100 flex items-center gap-2">
                        <input
                          type="text"
                          value={supportChatInput}
                          onChange={(e) => setSupportChatInput(e.target.value)}
                          placeholder="اكتب رد الإدارة الرسمي..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          disabled={!supportChatInput.trim()}
                          className="bg-[#FFE600] hover:bg-yellow-400 disabled:opacity-40 text-black px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال</span>
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                      <h4 className="font-bold text-sm text-gray-900">اختر مستخدماً من القائمة للبدء بالمراسلة الفورية</h4>
                      <p className="text-xs text-gray-500 mt-1">تصل رسائلك فوراً إلى صندوق رسائل المستخدم في حسابه وتظهر مباشرة</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PAYMENT METHODS SETTINGS */}
          {activeSection === 'payment_settings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">إعدادات وسائل الدفع والشحن المعتمدة</h2>
                  <p className="text-xs text-gray-500">
                    إدارة محافظ فودافون كاش، إنستاباي، والوسائل الإلكترونية لتلقي مدفوعات المستخدمين (تظهر فوراً في نافذة شحن الأعضاء)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditPaymentId(null);
                    setPaymentTitle('');
                    setPaymentAccountNum('');
                    setPaymentHolderName('');
                    setPaymentInstructions('');
                    setPaymentIsDefault(false);
                    setShowAddPaymentModal(true);
                  }}
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة وسيلة دفع جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className={`bg-white p-4 rounded-2xl border shadow-sm transition-all flex flex-col justify-between ${
                      pm.isActive ? 'border-gray-200' : 'border-red-200 opacity-65'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            {pm.type === 'vodafone_cash' ? 'فودافون كاش' : pm.type === 'instapay' ? 'InstaPay' : pm.type === 'orange_cash' ? 'أورنج كاش' : pm.type === 'etisalat_cash' ? 'اتصالات كاش' : 'محفظة إلكترونية'}
                          </span>
                          {pm.isDefault && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                              الأساسية
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          pm.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {pm.isActive ? 'مفعلة' : 'معطلة'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-gray-900 mb-1">{pm.title}</h4>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 my-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">رقم المحفظة / الحساب:</span>
                          <span className="text-xs font-digits font-black text-amber-700">{pm.accountNumber}</span>
                        </div>
                        {pm.accountHolder && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">اسم صاحب الحساب:</span>
                            <span className="text-xs font-bold text-gray-900">{pm.accountHolder}</span>
                          </div>
                        )}
                      </div>

                      {pm.instructions && (
                        <p className="text-[11px] text-gray-500 mb-3">{pm.instructions}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTogglePaymentStatus(pm)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                          pm.isActive ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {pm.isActive ? <ToggleRight className="w-4 h-4 text-amber-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                        <span>{pm.isActive ? 'تعطيل' : 'تفعيل'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditPaymentId(pm.id);
                            setPaymentType(pm.type);
                            setPaymentTitle(pm.title);
                            setPaymentAccountNum(pm.accountNumber);
                            setPaymentHolderName(pm.accountHolder || '');
                            setPaymentInstructions(pm.instructions || '');
                            setPaymentIsDefault(pm.isDefault || false);
                            setShowAddPaymentModal(true);
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-xl"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-1.5 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: RECHARGE CODES & VOUCHERS */}
          {activeSection === 'recharge_codes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">أكواد وقسائم الشحن الفورية (Vouchers)</h2>
                  <p className="text-xs text-gray-500">
                    إنشاء وتوليد قسائم شحن بأرصدة كوينز محددة • نظام مانع التكرار يضمن شحن الكود مرة واحدة فقط لكل حساب UID
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCodeModal(true)}
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>توليد كود شحن جديد</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="p-3">كود القسيمة</th>
                      <th className="p-3">الكوينز الممنوحة</th>
                      <th className="p-3">مرات الاستخدام</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">المستخدمون المستفيدون</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-900">
                    {rechargeCodes.map((code) => {
                      const isMaxReached = code.usedCount >= code.maxUses;
                      return (
                        <tr key={code.id} className="hover:bg-gray-50">
                          <td className="p-3 font-mono font-black text-amber-700 text-sm">
                            {code.code}
                          </td>
                          <td className="p-3 font-digits font-bold text-amber-600">
                            {code.coins.toLocaleString()} كوينز
                          </td>
                          <td className="p-3 font-digits">
                            {code.usedCount} / {code.maxUses}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              !isMaxReached ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {!isMaxReached ? 'صالح للاستخدام' : 'مكتمل الاستخدام'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500 text-[11px] font-digits">
                            {code.usedByUids?.length ? `${code.usedByUids.length} حساب` : 'لم يُستخدم بعد'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteRechargeCode(code.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-lg font-bold"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: BLUE VERIFICATIONS */}
          {activeSection === 'verifications' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">طلبات التوثيق بالعلامة الزرقاء الرسمية</h2>
                  <p className="text-xs text-gray-500">
                    مراجعة طلبات وإيصالات توثيق الحسابات بالعلامة الزرقاء الرسمية في الغرف والملف الشخصي
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={verificationsSearchQuery}
                    onChange={(e) => setVerificationsSearchQuery(e.target.value)}
                    placeholder="بحث بـ UID (10000-100000+) أو اسم الحساب..."
                    className="w-full bg-white border border-gray-200 rounded-xl pr-8 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                  />
                </div>
              </div>

              {(() => {
                const q = verificationsSearchQuery.trim().toLowerCase();
                const filteredVerifications = q
                  ? verifications.filter(
                      (v) =>
                        v.uid.toLowerCase().includes(q) ||
                        v.username.toLowerCase().includes(q) ||
                        (v.paymentPhone && v.paymentPhone.toLowerCase().includes(q))
                    )
                  : verifications;
                if (filteredVerifications.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
                      لا توجد طلبات توثيق مطابقة حالياً
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {filteredVerifications.map((req) => {
                      const reqUser = livoStore.getUserByUid(req.uid);
                      return (
                        <div
                          key={req.id}
                          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <img src={req.userAvatar} alt="" className="w-12 h-12 rounded-full border border-gray-200 object-cover" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <UserNameWithBadges
                                  displayName={reqUser?.displayName || `@${req.username}`}
                                  nameGlowColor={reqUser?.nameGlowColor}
                                  isVerified={reqUser?.isVerified}
                                  verifiedBadgeColor={reqUser?.verifiedBadgeColor}
                                  verifiedBadgeShape={reqUser?.verifiedBadgeShape}
                                  verifiedBadgeGlow={reqUser?.verifiedBadgeGlow}
                                  customIconUrl={reqUser?.customIconUrl}
                                  customIconGlow={reqUser?.customIconGlow}
                                  customIconAnimated={reqUser?.customIconAnimated}
                                  badgeSize={14}
                                  iconSize={17}
                                  nameClassName="font-bold text-sm text-gray-900"
                                />
                                <span className="text-xs font-digits text-amber-700 font-bold">UID: {req.uid}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {req.status === 'approved' ? 'موثق رسمياً' : req.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                المدة: <strong className="text-gray-900">{req.monthsCount} شهر</strong> • الرسوم: <strong className="text-amber-700 font-digits">{req.priceEGP?.toLocaleString()} ج.م</strong> • هاتف التحويل: {req.paymentPhone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {req.receiptUrl && (
                              <button
                                onClick={() => setZoomedVerificationReceiptUrl(req.receiptUrl)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                                <span>معاينة الإيصال</span>
                              </button>
                            )}

                            {req.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    livoStore.reviewVerificationRequest(req.id, 'approved', actorEmail);
                                    showToast(`تم توثيق حساب @${req.username} بالعلامة الزرقاء بنجاح ✓`);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>موافقة وتوثيق</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectVerificationId(req.id);
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-1.5 rounded-xl font-bold"
                                >
                                  رفض
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SECTION: WITHDRAWALS */}
          {activeSection === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">طلبات سحب الأرباح والتحويل النقدي</h2>
                  <p className="text-xs text-gray-500">
                    مراجعة طلبات تحويل الكوينز إلى نقد عبر فودافون كاش أو إنستاباي (عند الرفض يسترجع المستخدم كوينزاته تلقائياً)
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={withdrawalsSearchQuery}
                    onChange={(e) => setWithdrawalsSearchQuery(e.target.value)}
                    placeholder="بحث بـ UID (10000-100000+) أو رقم الحساب..."
                    className="w-full bg-white border border-gray-200 rounded-xl pr-8 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                  />
                </div>
              </div>

              {(() => {
                const q = withdrawalsSearchQuery.trim().toLowerCase();
                const filteredWithdrawals = q
                  ? withdrawals.filter(
                      (w) =>
                        w.uid.toLowerCase().includes(q) ||
                        w.username.toLowerCase().includes(q) ||
                        w.id.toLowerCase().includes(q) ||
                        w.paymentDetails.toLowerCase().includes(q)
                    )
                  : withdrawals;
                if (filteredWithdrawals.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
                      لا توجد طلبات سحب مطابقة حالياً
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {filteredWithdrawals.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900">طلب سحب #{req.id}</h4>
                            <span className="text-xs font-digits text-amber-700 font-bold">UID: {req.uid}</span>
                            <span className="text-xs text-gray-500">(@{req.username})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {req.status === 'approved' ? 'تم الصرف والتحويل' : req.status === 'pending' ? 'قيد المراجعة' : 'مرفوض وتم استرجاع الكوينز'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 mt-1">
                            المبلغ: <strong className="text-emerald-700 font-digits">{req.netPayoutEGP.toFixed(2)} ج.م</strong> مقابل ({req.totalCoins.toLocaleString()} كوينز)
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            الوسيلة: {req.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : req.paymentMethod === 'instapay' ? 'InstaPay' : 'تحويل بنكي'} • التفاصيل: {req.paymentDetails}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  livoStore.reviewWithdrawalRequest(req.id, 'approved', undefined, actorEmail);
                                  showToast(`تمت الموافقة على طلب سحب ${req.netPayoutEGP} ج.م بنجاح ✓`);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>اعتماد التحويل</span>
                              </button>
                              <button
                                onClick={() => setRejectWithdrawalId(req.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-1.5 rounded-xl font-bold"
                              >
                                رفض وإرجاع الكوينز
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SECTION: STORE, GIFTS CRUD & LIVE ROOM GIFT BLASTER */}
          {activeSection === 'store_items' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">المتجر وعناصر الإطارات والهدايا وضرب الهدايا</h2>
                  <p className="text-xs text-gray-500">
                    إضافة وتعديل أسعار الهدايا وصور PNG الشفافة + منصة ضرب وإرسال الهدايا الطائرة مباشرة للغرف
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditGiftId(null);
                    setNewGiftName('');
                    setNewGiftPrice('');
                    setNewGiftIcon('🎁');
                    setNewGiftImageUrl('');
                    setNewGiftAnimation('heart');
                    setShowAddGiftModal(true);
                  }}
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة هدية جديدة للمتجر</span>
                </button>
              </div>

              {/* Live Room Gift Blaster (ضرب وإرسال الهدايا للغرف) */}
              <div className="bg-white rounded-2xl border border-amber-300 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>منصة ضرب وإرسال الهدايا للغرف (Live Room Gift Blaster)</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">تأثير فوري بالصوت والطيران</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">الغرفة المستهدفة:</label>
                    <select
                      value={blastRoomId || rooms[0]?.id || ''}
                      onChange={(e) => setBlastRoomId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900"
                    >
                      {rooms.length === 0 ? (
                        <option value="">لا توجد غرف حالياً</option>
                      ) : (
                        rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.status === 'open' ? 'مفتوحة' : 'مغلقة'})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">الهدية:</label>
                    <select
                      value={blastGiftId || giftsList[0]?.id || ''}
                      onChange={(e) => setBlastGiftId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900"
                    >
                      {giftsList.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.icon} {g.name} ({g.coins} 🪙)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">عدد الضربات (Combo):</label>
                    <select
                      value={blastCount}
                      onChange={(e) => setBlastCount(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-digits text-gray-900"
                    >
                      <option value={1}>× 1</option>
                      <option value={5}>× 5 طيران متتالي</option>
                      <option value={10}>× 10 مهرجان هدايا</option>
                      <option value={25}>× 25 عاصفة ملكية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">المستلم UID (بحث 10000 - 100000+):</label>
                    <input
                      type="text"
                      value={blastRecipientQuery}
                      onChange={(e) => setBlastRecipientQuery(e.target.value)}
                      placeholder="ابحث بالـ UID أو الاسم..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] font-digits text-gray-900 mb-1"
                    />
                    <select
                      value={blastRecipientUid}
                      onChange={(e) => setBlastRecipientUid(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900"
                    >
                      <option value="">كافة الحضور / مالك الغرفة</option>
                      {(blastRecipientQuery.trim() ? livoStore.searchUsersByQuery(blastRecipientQuery) : users).map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} (UID: {u.uid})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم المرسل الظاهر:</label>
                    <input
                      type="text"
                      value={blastSenderName}
                      onChange={(e) => setBlastSenderName(e.target.value)}
                      placeholder="إدارة LIVO الملكية"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const targetRoomId = blastRoomId || rooms[0]?.id;
                    const targetGiftId = blastGiftId || giftsList[0]?.id;
                    if (!targetRoomId || !targetGiftId) {
                      showToast('يرجى اختيار غرفة وهدية صالحة أولاً');
                      return;
                    }
                    const res = livoStore.adminSendGiftToTarget({
                      roomId: targetRoomId,
                      giftId: targetGiftId,
                      count: blastCount,
                      recipientUid: blastRecipientUid || undefined,
                      senderName: blastSenderName.trim() || 'إدارة LIVO الملكية',
                      adminEmail: actorEmail
                    });
                    showToast(res.message);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>إطلاق الهدية الطائرة داخل الغرفة الآن</span>
                </button>
              </div>

              {/* Gifts Grid */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <span>هدايا الغرف والمحادثات ({giftsList.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {giftsList.map((gift) => (
                    <div
                      key={gift.id}
                      className={`bg-white p-3 rounded-2xl border shadow-sm flex flex-col items-center text-center justify-between relative ${
                        gift.isActive !== false ? 'border-gray-200' : 'border-red-200 opacity-60'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between mb-1">
                        <button
                          onClick={() => handleToggleGiftStatus(gift)}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            gift.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                          title={gift.isActive !== false ? 'تعطيل' : 'تفعيل'}
                        >
                          {gift.isActive !== false ? 'نشط' : 'معطل'}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditGiftId(gift.id);
                              setNewGiftName(gift.name);
                              setNewGiftPrice(String(gift.coins));
                              setNewGiftIcon(gift.icon);
                              setNewGiftImageUrl(gift.imageUrl || '');
                              setNewGiftAnimation(gift.animationType);
                              setShowAddGiftModal(true);
                            }}
                            className="text-gray-500 hover:text-amber-600 p-1"
                            title="تعديل الهدية"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGift(gift.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="حذف الهدية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {gift.imageUrl ? (
                        <img src={gift.imageUrl} alt={gift.name} className="w-14 h-14 object-contain my-1 livo-flutter" />
                      ) : (
                        <span className="text-4xl filter drop-shadow my-1">{gift.icon}</span>
                      )}
                      <h4 className="font-bold text-xs text-gray-900 mt-1">{gift.name}</h4>
                      <span className="text-xs font-digits font-black text-amber-600 mt-0.5">
                        {gift.coins.toLocaleString()} كوينز
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        تأثير: {gift.animationType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Items (Frames & Entrances) */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>إطارات ودخلات المتجر الحصرية ({storeItemsList.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {storeItemsList.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-11 h-11 object-contain shrink-0" />
                      ) : (
                        <span className="text-3xl filter drop-shadow shrink-0">{item.image}</span>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-gray-900">{item.name}</h4>
                        <span className="text-[10px] text-gray-500 block">{item.description}</span>
                        <span className="text-xs font-digits font-black text-amber-600">{item.priceCoins.toLocaleString()} كوينز</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7.5: GENUINE ROOMS & STREAMS MANAGEMENT */}
          {activeSection === 'rooms' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">إدارة الغرف والبثوث الحقيقية</h2>
                  <p className="text-xs text-gray-500">
                    متابعة جميع الغرف الصوتية وبثوث الفيديو الحية، مع التنظيف التلقائي لأي غرف وهمية
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPurgingFakeRooms}
                    onClick={async () => {
                      setIsPurgingFakeRooms(true);
                      try {
                        const removed = await livoStore.purgeFakeRoomsFromFirestore();
                        showToast(
                          removed > 0
                            ? `تم حذف ${removed} غرفة وهمية من قاعدة البيانات ✓`
                            : 'قاعدة البيانات نظيفة تماماً — لا توجد غرف وهمية ✓'
                        );
                      } finally {
                        setIsPurgingFakeRooms(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-black text-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isPurgingFakeRooms ? 'جاري الفحص...' : 'تنظيف الغرف الوهمية من Firebase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection('official_room')}
                    className="px-3.5 py-2 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs"
                  >
                    إعدادات الغرفة الرسمية
                  </button>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roomsSearchQuery}
                  onChange={(e) => setRoomsSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الغرفة أو المالك أو UID..."
                  className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs text-gray-900 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rooms
                  .filter((r) => {
                    if (!roomsSearchQuery.trim()) return true;
                    const q = roomsSearchQuery.trim().toLowerCase();
                    return (
                      r.title.toLowerCase().includes(q) ||
                      r.ownerName.toLowerCase().includes(q) ||
                      r.ownerUid.toLowerCase().includes(q) ||
                      r.id.toLowerCase().includes(q)
                    );
                  })
                  .map((r) => {
                    const activeSpeakers = (r.seats || []).filter((s) => Boolean(s.occupiedByUid)).length;
                    return (
                      <div
                        key={r.id}
                        className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-purple-950 border border-gray-200 shrink-0 relative">
                            <img
                              src={r.ownerAvatar || '/assets/livo/customer_icon.jpg'}
                              alt={r.ownerName}
                              className="w-full h-full object-cover"
                            />
                            <span
                              className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                                r.status === 'open' ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-black text-xs text-gray-900 truncate max-w-[180px]">{r.title}</h4>
                              {r.isOfficial && (
                                <span className="bg-[#FFE600] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                  رسمية
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  r.roomType === 'live'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {r.roomType === 'live' ? 'بث فيديو' : 'غرفة صوتية'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                              المالك: <strong>{r.ownerName}</strong> (<span className="font-digits">{r.ownerUid}</span>)
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                              <span>
                                الحالة:{' '}
                                <strong className={r.status === 'open' ? 'text-emerald-600' : 'text-gray-500'}>
                                  {r.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                                </strong>
                              </span>
                              <span>المتحدثون: {activeSpeakers} / {r.seatCount || 12}</span>
                              <span>الدردشة: {r.allChatDisabled ? 'مقفلة' : 'مفتوحة'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              livoStore.toggleRoomAllChat(r.id);
                              showToast(r.allChatDisabled ? 'تم فتح شات الغرفة 💬' : 'تم قفل شات الغرفة 🔒');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[10px]"
                          >
                            {r.allChatDisabled ? 'فتح الشات' : 'قفل الشات'}
                          </button>

                          {r.isOfficial ? (
                            <button
                              type="button"
                              onClick={() => {
                                const nextSt = r.status === 'open' ? 'closed' : 'open';
                                livoStore.setOfficialRoomStatus(nextSt, r.announcement);
                                showToast(nextSt === 'open' ? 'تم فتح الغرفة الرسمية ✓' : 'تم إغلاق الغرفة الرسمية ✓');
                              }}
                              className={`px-3 py-1.5 rounded-xl font-black text-[10px] ${
                                r.status === 'open'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {r.status === 'open' ? 'إغلاق الرسمية' : 'فتح الرسمية'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                livoStore.closeAndRemoveRoom(r.id);
                                showToast(`تم إغلاق وحذف غرفة (${r.title}) ✓`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] flex items-center gap-1 justify-center"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>إغلاق وحذف</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SECTION 8: OFFICIAL ROOM & BROADCASTS */}
          {activeSection === 'official_room' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-lg font-black text-gray-900">الغرفة الرسمية LIVO Admin والإعلانات</h2>
                <p className="text-xs text-gray-500">
                  تظهر في صدارة قائمة الرسائل والغرف لجميع المستخدمين ولا يمكن حذفها
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    حالة الغرفة الرسمية:
                  </label>
                  <select
                    value={officialRoomStatus}
                    onChange={(e) => {
                      const st = e.target.value as any;
                      setOfficialRoomStatus(st);
                      livoStore.setOfficialRoomStatus(st, announcementText);
                      showToast(`تم تغيير حالة الغرفة الرسمية إلى: ${st}`);
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none"
                  >
                    <option value="open">مفتوحة ومتاحة لجميع المستخدمين (Open)</option>
                    <option value="closed">مغلقة مؤقتاً (Closed)</option>
                    <option value="locked_by_admin">مقفلة بكلمة مرور إدارية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    نص الإعلان الرسمي المعروض في الغرفة:
                  </label>
                  <textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => {
                    livoStore.setOfficialRoomStatus(officialRoomStatus, announcementText);
                    showToast('تم تحديث إعلان الغرفة الرسمية والمزامنة فوراً ✓');
                  }}
                  className="w-full py-2.5 bg-[#FFE600] text-black font-black text-xs rounded-xl shadow-sm hover:bg-yellow-400"
                >
                  نشر الإعلان لجميع المستخدمين
                </button>
              </div>
            </div>
          )}

          {/* SECTION 9: BANS & SANCTIONS */}
          {activeSection === 'bans' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">إدارة الحظر والعقوبات</h2>
                <p className="text-xs text-gray-500">
                  حظر الحساب أو الجهاز مع الاحتفاظ بالسجل وعدم حذف البيانات المالية
                </p>
              </div>

              <form onSubmit={handleExecuteBan} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ابحث عن المستخدم بالـ UID (10000 - 100000+) أو الاسم:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={banSearchUid}
                        onChange={(e) => setBanSearchUid(e.target.value)}
                        placeholder="أدخل معرّف UID أو الاسم"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-digits text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const matches = await triggerServerUserLookup(banSearchUid);
                          if (matches.length > 0) setSelectedUserForBan(matches[0]);
                          else showToast('المستخدم غير موجود');
                        }}
                        disabled={isSearchingServer}
                        className="bg-[#FFE600] hover:bg-yellow-400 text-black px-3 py-1.5 text-xs rounded-xl font-black"
                      >
                        تحديد
                      </button>
                    </div>
                    {banSearchUid.trim().length > 0 && (
                      <div className="mt-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50">
                        {livoStore.searchUsersByQuery(banSearchUid).slice(0, 6).map((u) => (
                          <button
                            key={u.uid}
                            type="button"
                            onClick={() => setSelectedUserForBan(u)}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-right hover:bg-amber-50 text-xs"
                          >
                            <UserNameWithBadges
                              displayName={u.displayName}
                              nameGlowColor={u.nameGlowColor}
                              isVerified={u.isVerified}
                              verifiedBadgeColor={u.verifiedBadgeColor}
                              verifiedBadgeShape={u.verifiedBadgeShape}
                              verifiedBadgeGlow={u.verifiedBadgeGlow}
                              customIconUrl={u.customIconUrl}
                              customIconGlow={u.customIconGlow}
                              customIconAnimated={u.customIconAnimated}
                              badgeSize={13}
                              iconSize={16}
                              nameClassName="font-bold text-gray-900"
                            />
                            <span className="font-digits text-amber-700 shrink-0">UID: {u.uid}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedUserForBan && (
                    <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200 self-start">
                      <AvatarWithFrame
                        avatarUrl={selectedUserForBan.avatar}
                        displayName={selectedUserForBan.displayName}
                        frameUrl={selectedUserForBan.equippedFrameUrl}
                        frameGlowColor={selectedUserForBan.frameGlowColor}
                        frameAnimated={selectedUserForBan.frameAnimated}
                        customIconUrl={selectedUserForBan.customIconUrl}
                        customIconGlow={selectedUserForBan.customIconGlow}
                        customIconAnimated={selectedUserForBan.customIconAnimated}
                        sizePx={36}
                      />
                      <div className="min-w-0">
                        <UserNameWithBadges
                          displayName={selectedUserForBan.displayName}
                          nameGlowColor={selectedUserForBan.nameGlowColor}
                          isVerified={selectedUserForBan.isVerified}
                          verifiedBadgeColor={selectedUserForBan.verifiedBadgeColor}
                          verifiedBadgeShape={selectedUserForBan.verifiedBadgeShape}
                          verifiedBadgeGlow={selectedUserForBan.verifiedBadgeGlow}
                          customIconUrl={selectedUserForBan.customIconUrl}
                          customIconGlow={selectedUserForBan.customIconGlow}
                          customIconAnimated={selectedUserForBan.customIconAnimated}
                          badgeSize={13}
                          iconSize={16}
                          nameClassName="text-xs font-bold text-gray-900"
                        />
                        <span className="text-[10px] font-digits text-amber-700 font-bold block">UID: {selectedUserForBan.uid}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">نوع الحظر:</label>
                    <select
                      value={banType}
                      onChange={(e) => setBanType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                    >
                      <option value="account">حظر الحساب فقط</option>
                      <option value="device">حظر الجهاز فقط</option>
                      <option value="both">حظر الحساب والجهاز معاً</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">المدة:</label>
                      <select
                        value={banDuration}
                        onChange={(e) => setBanDuration(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                      >
                        <option value="temporary">مؤقت (أيام محددة)</option>
                        <option value="permanent">دائم نهائي</option>
                      </select>
                    </div>
                    {banDuration === 'temporary' && (
                      <div className="w-24">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">عدد الأيام:</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={banDays}
                          onChange={(e) => setBanDays(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-digits text-gray-900"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">سبب الحظر:</label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="مخالفة معايير المجتمع، سب وقذف، محاولة احتيال"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
                >
                  تأكيد فرض الحظر
                </button>
              </form>

              {/* Bans List */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-gray-900">قائمة المحظورين وسجل العقوبات</h3>
                {bans.length === 0 ? (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 text-center text-xs text-gray-400">
                    لا يوجد مستخدمون محظورون حالياً
                  </div>
                ) : (
                  bans.map(b => {
                    const banTypeLabel =
                      b.banType === 'device' ? 'حظر الجهاز' : b.banType === 'both' ? 'الحساب والجهاز' : 'حظر الحساب';
                    const durationLabel =
                      b.duration === 'permanent'
                        ? 'دائم نهائي'
                        : `مؤقت (${b.durationDays || 7} يوم)`;
                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between gap-2 ${
                          b.status === 'active' ? 'bg-red-50/70 border-red-200' : 'bg-white border-gray-200 opacity-80'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-gray-900">{b.username}</span>
                            <span className="font-digits text-xs text-amber-700 font-bold">UID: {b.uid}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              b.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {b.status === 'active' ? 'حظر نشط' : 'تم رفع الحظر'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1">
                            النوع: {banTypeLabel} • المدة: {durationLabel} • السبب: {b.reason}
                          </p>
                          {b.status === 'unbanned' && b.unbanReason && (
                            <p className="text-[10px] text-emerald-700 mt-0.5">
                              سبب فك الحظر: {b.unbanReason}
                            </p>
                          )}
                        </div>

                        {b.status === 'active' && (
                          <button
                            onClick={() => setUnbanModalRecord(b)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shrink-0"
                          >
                            فك الحظر
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SECTION 10: SUPERVISORS (REAL FIRESTORE CRUD VIA LIVOSTORE) */}
          {activeSection === 'supervisors' && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h2 className="text-lg font-black text-gray-900">إدارة صلاحيات المشرفين الحقيقية</h2>
                <p className="text-xs text-gray-500">
                  تتم المزامنة مباشرة مع Firebase • المشرف المفعّل يستطيع دخول لوحة الإدارة بحسابه المعتمد
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newSupervisorUid}
                      onChange={(e) => setNewSupervisorUid(e.target.value)}
                      placeholder="UID (10000-100000+)"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const found = await triggerServerUserLookup(newSupervisorUid);
                        if (found[0]) {
                          setNewSupervisorName(found[0].displayName);
                          if (found[0].email) setNewSupervisorEmail(found[0].email);
                          showToast(`تم جلب بيانات ${found[0].displayName} ✓`);
                        } else {
                          showToast('لم يتم العثور على المستخدم بهذا المعرّف');
                        }
                      }}
                      className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-bold shrink-0"
                    >
                      جلب
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newSupervisorName}
                    onChange={(e) => setNewSupervisorName(e.target.value)}
                    placeholder="الاسم الكامل للمشرف"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-amber-500"
                  />
                  <input
                    type="email"
                    value={newSupervisorEmail}
                    onChange={(e) => setNewSupervisorEmail(e.target.value)}
                    placeholder="البريد الإلكتروني (Gmail) *"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-gray-700 block mb-1.5">الصلاحيات الممنوحة:</span>
                  <div className="flex flex-wrap gap-2">
                    {SUPERVISOR_PERMISSIONS_OPTIONS.map((perm) => {
                      const checked = newSupervisorPermissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() =>
                            setNewSupervisorPermissions(prev =>
                              checked ? prev.filter(p => p !== perm.id) : [...prev, perm.id]
                            )
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                            checked
                              ? 'bg-[#FFE600] border-amber-500 text-black'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          {checked ? '✓ ' : '+ '}{perm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const cleanEmail = newSupervisorEmail.trim().toLowerCase();
                    if (!cleanEmail || !cleanEmail.includes('@')) {
                      showToast('يرجى إدخال بريد إلكتروني صحيح للمشرف');
                      return;
                    }
                    livoStore.addSupervisor({
                      uid: newSupervisorUid.trim() || undefined,
                      name: newSupervisorName.trim() || cleanEmail.split('@')[0],
                      email: cleanEmail,
                      permissions: newSupervisorPermissions
                    });
                    setNewSupervisorUid('');
                    setNewSupervisorName('');
                    setNewSupervisorEmail('');
                    setNewSupervisorPermissions(['recharges', 'bans', 'rooms']);
                    showToast('تمت إضافة المشرف وحفظ صلاحياته في قاعدة البيانات ✓');
                  }}
                  className="w-full py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm"
                >
                  إضافة وتفعيل المشرف في قاعدة البيانات
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={supervisorsSearchQuery}
                  onChange={(e) => setSupervisorsSearchQuery(e.target.value)}
                  placeholder="بحث في المشرفين بالـ UID (10000-100000+) أو الاسم أو البريد..."
                  className="w-full bg-white border border-gray-200 rounded-xl pr-8 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                />
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const q = supervisorsSearchQuery.trim().toLowerCase();
                  const filteredSups = q
                    ? supervisors.filter(
                        (s) =>
                          (s.uid && s.uid.toLowerCase().includes(q)) ||
                          s.name.toLowerCase().includes(q) ||
                          s.email.toLowerCase().includes(q)
                      )
                    : supervisors;
                  if (filteredSups.length === 0) {
                    return (
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                        لا يوجد مشرفون مطابقون حالياً
                      </div>
                    );
                  }
                  return filteredSups.map((s) => (
                    <div key={s.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900">{s.name}</span>
                            <span className="text-[11px] text-amber-700 font-digits font-bold">UID: {s.uid}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              s.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {s.isActive ? 'نشط ومفعّل' : 'موقوف'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-digits block mt-0.5">{s.email}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (editingSupervisorId === s.id) {
                                setEditingSupervisorId(null);
                              } else {
                                setEditingSupervisorId(s.id);
                                setEditingSupervisorPerms([...s.permissions]);
                              }
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                          >
                            الصلاحيات
                          </button>
                          <button
                            onClick={() => {
                              livoStore.toggleSupervisorActive(s.id);
                              showToast(`تم ${s.isActive ? 'تعطيل' : 'تفعيل'} المشرف ${s.name}`);
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded-xl font-bold ${
                              s.isActive ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {s.isActive ? 'تعطيل' : 'تفعيل'}
                          </button>
                          <button
                            onClick={() => {
                              livoStore.removeSupervisor(s.id);
                              showToast('تم إزالة المشرف وسحب صلاحياته من النظام');
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600"
                            title="حذف المشرف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {editingSupervisorId === s.id ? (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {SUPERVISOR_PERMISSIONS_OPTIONS.map((perm) => {
                              const checked = editingSupervisorPerms.includes(perm.id);
                              return (
                                <button
                                  key={perm.id}
                                  type="button"
                                  onClick={() =>
                                    setEditingSupervisorPerms(prev =>
                                      checked ? prev.filter(p => p !== perm.id) : [...prev, perm.id]
                                    )
                                  }
                                  className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${
                                    checked
                                      ? 'bg-[#FFE600] border-amber-500 text-black'
                                      : 'bg-gray-50 border-gray-200 text-gray-600'
                                  }`}
                                >
                                  {checked ? '✓ ' : '+ '}{perm.label}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => {
                              livoStore.updateSupervisorPermissions(s.id, editingSupervisorPerms);
                              setEditingSupervisorId(null);
                              showToast('تم حفظ تعديلات الصلاحيات ✓');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                          >
                            حفظ الصلاحيات
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.permissions.map((pId) => {
                            const found = SUPERVISOR_PERMISSIONS_OPTIONS.find(o => o.id === pId);
                            return (
                              <span key={pId} className="text-[10px] bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-md font-bold">
                                {found?.label || pId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* SECTION 11: FINANCIAL AUDIT LOGS */}
          {activeSection === 'financial_logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">السجل المالي الدائم</h2>
                  <p className="text-xs text-gray-500">
                    سجل غير قابل للتعديل أو الحذف لجميع عمليات الشحن والخصم والإدارة
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={logsSearchQuery}
                    onChange={(e) => setLogsSearchQuery(e.target.value)}
                    placeholder="بحث بـ UID (10000-100000+) أو السبب..."
                    className="w-full bg-white border border-gray-200 rounded-xl pr-8 pl-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 font-digits"
                  />
                </div>
              </div>

              {(() => {
                const q = logsSearchQuery.trim().toLowerCase();
                const filteredAudits = q
                  ? audits.filter(
                      (item) =>
                        item.uid.toLowerCase().includes(q) ||
                        item.username.toLowerCase().includes(q) ||
                        item.reason.toLowerCase().includes(q) ||
                        item.performedBy.toLowerCase().includes(q)
                    )
                  : audits;
                if (filteredAudits.length === 0) {
                  return (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                      لا توجد عمليات مطابقة حالياً
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {filteredAudits.map(item => (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{item.username}</span>
                          <span className="font-digits text-amber-700 font-bold">UID: {item.uid}</span>
                          <span className={`font-digits font-bold px-1.5 py-0.5 rounded ${
                            item.coinsChange > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {item.coinsChange > 0 ? `+${item.coinsChange.toLocaleString()}` : item.coinsChange.toLocaleString()} كوينز
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          {item.reason} • المنفذ: {item.performedBy}
                        </p>
                      </div>

                      <div className="text-left font-digits text-[10px] text-gray-500">
                        <span>الرصيد: {item.balanceBefore.toLocaleString()} ➔ {item.balanceAfter.toLocaleString()}</span>
                        <span className="block">{new Date(item.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {/* MODAL: ZOOM RECEIPT */}
      {zoomedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">معاينة إيصال السداد بدقة عالية</span>
              <button
                onClick={() => setZoomedReceiptUrl(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[80vh] bg-gray-50">
              <img
                src={zoomedReceiptUrl}
                alt="Zoomed Receipt"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT RECHARGE REASON */}
      {rejectModalReqId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl p-4 space-y-3 text-gray-900">
            <h3 className="font-bold text-sm text-red-600">سبب رفض طلب الشحن:</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثال: الإيصال غير مطابق، المبلغ لم يصل للحساب..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-red-400"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmRejectRecharge}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => setRejectModalReqId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM COIN ADJUSTMENT */}
      {showCoinConfirmModal && selectedUserForCoins && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-amber-300 shadow-2xl p-5 space-y-3 text-gray-900 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-sm text-gray-900">تأكيد تعديل رصيد المستخدم</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              هل أنت متأكد من تنفيذ عملية ({coinActionType === 'add' ? 'إضافة' : coinActionType === 'deduct' ? 'خصم' : 'ضبط'}) كمية <strong className="font-digits text-amber-700">{parseInt(coinAmountInput, 10).toLocaleString()}</strong> كوينز للمستخدم <strong className="text-gray-900">{selectedUserForCoins.displayName}</strong> (UID: {selectedUserForCoins.uid})؟
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExecuteCoinAdjustment}
                className="flex-1 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm"
              >
                نعم، تنفيذ الآن
              </button>
              <button
                onClick={() => setShowCoinConfirmModal(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNBAN REASON */}
      {unbanModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-emerald-300 shadow-2xl p-4 space-y-3 text-gray-900">
            <h3 className="font-bold text-sm text-emerald-700">فك الحظر عن المستخدم:</h3>
            <input
              type="text"
              value={unbanReasonText}
              onChange={(e) => setUnbanReasonText(e.target.value)}
              placeholder="سبب فك الحظر (مثال: انتهاء فترة العقوبة، قبول التماس)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-900"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteUnban}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                تأكيد فك الحظر
              </button>
              <button
                onClick={() => setUnbanModalRecord(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ADVERTISEMENT */}
      {showCreateAdModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl p-5 space-y-4 text-gray-900">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-gray-900">إنشاء ونشر إعلان جديد في LIVO</h3>
              </div>
              <button
                onClick={() => setShowCreateAdModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">عنوان الإعلان:</label>
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="مثال: خصم 50% على باقة الكوينز الذهبية"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">وصف الإعلان:</label>
                <textarea
                  value={newAdDescription}
                  onChange={(e) => setNewAdDescription(e.target.value)}
                  placeholder="اكتب تفاصيل العرض الترويجي..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">رابط أو رفع صورة البانر:</label>
                  <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingAdImage ? 'جاري الضغط والرفع...' : 'رفع من الجهاز'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingAdImage(true);
                        try {
                          const url = await firebaseService.uploadImage(`ads/ad_${Date.now()}.jpg`, file, {
                            maxDim: 1200,
                            quality: 0.78,
                            maxBytes: 240_000
                          });
                          setNewAdImageUrl(url);
                          showToast('تم رفع وضغط صورة الإعلان بنجاح ✓');
                        } catch {
                          const compressed = await compressImageForFirestore(file, {
                            maxDim: 1200,
                            quality: 0.78,
                            maxBytes: 240_000
                          });
                          setNewAdImageUrl(compressed);
                          showToast('تم تجهيز صورة الإعلان بنجاح ✓');
                        } finally {
                          setIsUploadingAdImage(false);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={newAdImageUrl}
                  onChange={(e) => setNewAdImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-... أو ارفع صورة من الجهاز"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  required
                />
                {/* Quick Presets */}
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setNewAdImageUrl('https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80')}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-0.5 rounded text-gray-700 font-bold"
                  >
                    نموذج ألعاب وبث
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAdImageUrl('https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80')}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-0.5 rounded text-gray-700 font-bold"
                  >
                    نموذج شحن وجوائز
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">رابط التوجيه (اختياري):</label>
                <input
                  type="text"
                  value={newAdTargetUrl}
                  onChange={(e) => setNewAdTargetUrl(e.target.value)}
                  placeholder="https://livo.live/offers أو اتركها فارغة"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">مكان العرض:</label>
                  <select
                    value={newAdPlacement}
                    onChange={(e: any) => setNewAdPlacement(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-900 outline-none"
                  >
                    <option value="banner">بانر رئيسي (Banner)</option>
                    <option value="popup">نافذة منبثقة (Popup)</option>
                    <option value="feed">الخلاصة والساحة (Feed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={newAdEndDate}
                    onChange={(e) => setNewAdEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-900 font-digits outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm"
                >
                  نشر وتفعيل الإعلان
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAdModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ZOOM TICKET ATTACHMENT */}
      {zoomedTicketImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">معاينة مرفق التذكرة</span>
              <button
                onClick={() => setZoomedTicketImageUrl(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[80vh] bg-gray-50">
              <img
                src={zoomedTicketImageUrl}
                alt="Zoomed Attachment"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE AD */}
      {adDeleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-red-200 shadow-2xl p-4 space-y-3 text-gray-900 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="font-bold text-sm text-gray-900">تأكيد حذف الإعلان</h3>
            <p className="text-xs text-gray-600">
              هل أنت متأكد من حذف هذا الإعلان نهائياً من قاعدة البيانات والتطبيق؟
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleDeleteAd(adDeleteConfirmId)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                نعم، احذف الإعلان
              </button>
              <button
                onClick={() => setAdDeleteConfirmId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PAYMENT METHOD */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-2xl p-5 space-y-4 text-gray-900">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">
                {editPaymentId ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع جديدة'}
              </h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">نوع الوسيلة:</label>
                <select
                  value={paymentType}
                  onChange={(e: any) => {
                    setPaymentType(e.target.value);
                    if (!paymentTitle) {
                      const titles: any = {
                        vodafone_cash: 'فودافون كاش - الحساب الرسمي',
                        instapay: 'InstaPay - التحويل اللحظي',
                        orange_cash: 'أورنج كاش',
                        etisalat_cash: 'اتصالات كاش',
                        we_pay: 'وي باي WE Pay'
                      };
                      setPaymentTitle(titles[e.target.value] || '');
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none"
                >
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="orange_cash">أورنج كاش (Orange Cash)</option>
                  <option value="etisalat_cash">اتصالات كاش (Etisalat Cash)</option>
                  <option value="we_pay">محفظة وي باي (WE Pay)</option>
                  <option value="bank_transfer">حساب بنكي رسمي</option>
                  <option value="other">وسيلة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم وسيلة الدفع للعرض:</label>
                <input
                  type="text"
                  value={paymentTitle}
                  onChange={(e) => setPaymentTitle(e.target.value)}
                  placeholder="مثال: فودافون كاش - الحساب المعتمد"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">رقم المحفظة أو المعرف:</label>
                <input
                  type="text"
                  value={paymentAccountNum}
                  onChange={(e) => setPaymentAccountNum(e.target.value)}
                  placeholder="010XXXXXXXX أو username@instapay"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم صاحب الحساب (اختياري):</label>
                <input
                  type="text"
                  value={paymentHolderName}
                  onChange={(e) => setPaymentHolderName(e.target.value)}
                  placeholder="اسم الشخص أو اسم الشركة"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">تعليمات التحويل للأعضاء (اختياري):</label>
                <textarea
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="يرجى تحويل المبلغ وتصوير إيصال التحويل كاملاً..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="payDefault"
                  checked={paymentIsDefault}
                  onChange={(e) => setPaymentIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="payDefault" className="text-xs text-gray-700 cursor-pointer font-medium">
                  تعيين كوسيلة دفع أساسية ومفضلة
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm"
                >
                  حفظ وتفعيل وسيلة الدفع
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE RECHARGE VOUCHER CODE */}
      {showAddCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl p-5 space-y-4 text-gray-900">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">توليد كود شحن فوري (Voucher)</h3>
              <button
                onClick={() => setShowAddCodeModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRechargeCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">كود القسيمة (حروف وأرقام):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCodeInput}
                    onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
                    placeholder="مثال: LIVO-VIP-500"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono uppercase outline-none focus:border-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewCodeInput(`LIVO-${Math.floor(1000 + Math.random() * 9000)}-GOLD`)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2.5 rounded-xl font-bold"
                  >
                    عشوائي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">عدد الكوينز الممنوحة:</label>
                <input
                  type="number"
                  value={newCodeCoinsInput}
                  onChange={(e) => setNewCodeCoinsInput(e.target.value)}
                  placeholder="مثال: 500 أو 1000 أو 5000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">الحد الأقصى لعدد المستفيدين:</label>
                <input
                  type="number"
                  value={newCodeMaxUsesInput}
                  onChange={(e) => setNewCodeMaxUsesInput(e.target.value)}
                  placeholder="100"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm"
                >
                  إنشاء وتفعيل الكود
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCodeModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STORE GIFT */}
      {showAddGiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl p-5 space-y-4 text-gray-900">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">
                {editGiftId ? 'تعديل بيانات الهدية' : 'إضافة هدية جديدة للمتجر'}
              </h3>
              <button
                onClick={() => {
                  setShowAddGiftModal(false);
                  setEditGiftId(null);
                  setNewGiftImageUrl('');
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGift} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم الهدية:</label>
                <input
                  type="text"
                  value={newGiftName}
                  onChange={(e) => setNewGiftName(e.target.value)}
                  placeholder="مثال: تاج ذهبي، قصر ملكي، أسد ذهبي"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">صورة الهدية PNG (تفريغ تلقائي أو قص سحري يدوي):</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 flex-wrap">
                  {newGiftImageUrl ? (
                    <div className="relative w-12 h-12 rounded-xl bg-[#180829] flex items-center justify-center shrink-0 p-1">
                      <img src={newGiftImageUrl} alt="Gift" className="w-10 h-10 object-contain" />
                      <button
                        type="button"
                        onClick={() => setNewGiftImageUrl('')}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                  <label className="flex-1 cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingGiftImage ? 'جاري التفريغ...' : 'رفع وتفريغ تلقائي'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) handleUploadGiftImage(f);
                      }}
                    />
                  </label>
                  <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>قص يدوي</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) {
                          setAdminCutoutTarget('gift');
                          setAdminCutoutSource(f);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">أيقونة الهدية الاحتياطية (إيموجي):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGiftIcon}
                    onChange={(e) => setNewGiftIcon(e.target.value)}
                    placeholder="👑 أو 🦁 أو 🏎️"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-lg text-center outline-none focus:border-amber-500"
                    required
                  />
                  <div className="flex gap-1">
                    {['👑', '🦁', '🏎️', '🏰', '💎', '🚀'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewGiftIcon(em)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-amber-100 text-sm flex items-center justify-center"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">سعر الهدية بالكوينز:</label>
                <input
                  type="number"
                  value={newGiftPrice}
                  onChange={(e) => setNewGiftPrice(e.target.value)}
                  placeholder="مثال: 500"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">نوع التأثير في الغرفة:</label>
                <select
                  value={newGiftAnimation}
                  onChange={(e) => setNewGiftAnimation(e.target.value as GiftItem['animationType'])}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none"
                >
                  <option value="heart">قلب متوهج (Heart)</option>
                  <option value="rose">وردة (Rose)</option>
                  <option value="diamond">ألماسة متلألئة (Diamond)</option>
                  <option value="rocket">صاروخ ناري (Rocket)</option>
                  <option value="lion">أسد ذهبي يزأر (Lion Roar)</option>
                  <option value="car">سيارة رياضية فاخرة (Supercar)</option>
                  <option value="dragon">تنين أسطوري (Dragon Flight)</option>
                  <option value="castle">قصر ملكي (Castle)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm"
                >
                  {editGiftId ? 'حفظ التعديلات' : 'إضافة للمتجر'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGiftModal(false);
                    setEditGiftId(null);
                    setNewGiftImageUrl('');
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COIN PACKAGE */}
      {showCoinPkgModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl p-5 space-y-4 text-gray-900">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">
                {editCoinPkgId ? 'تعديل باقة الشحن' : 'إضافة باقة شحن جديدة'}
              </h3>
              <button
                onClick={() => {
                  setShowCoinPkgModal(false);
                  setEditCoinPkgId(null);
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCoinPackage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">عدد الكوينز:</label>
                <input
                  type="number"
                  min={1}
                  value={pkgCoinsInput}
                  onChange={(e) => setPkgCoinsInput(e.target.value)}
                  placeholder="مثال: 1000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">السعر بالجنيه المصري (EGP):</label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={pkgPriceInput}
                  onChange={(e) => setPkgPriceInput(e.target.value)}
                  placeholder="مثال: 350"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-digits outline-none focus:border-amber-500"
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={pkgPopularInput}
                  onChange={(e) => setPkgPopularInput(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>تمييز كباقة شائعة (الأكثر طلباً)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={pkgActiveInput}
                  onChange={(e) => setPkgActiveInput(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>متاحة ومفعلة في شاشة الشحن للعملاء</span>
              </label>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-sm"
                >
                  {editCoinPkgId ? 'حفظ التعديلات' : 'إضافة الباقة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCoinPkgModal(false);
                    setEditCoinPkgId(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ZOOM BLUE VERIFICATION RECEIPT */}
      {zoomedVerificationReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">إيصال تحويل التوثيق الأزرق</span>
              <button
                onClick={() => setZoomedVerificationReceiptUrl(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[80vh] bg-gray-50">
              <img
                src={zoomedVerificationReceiptUrl}
                alt="Verification Receipt"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT VERIFICATION */}
      {rejectVerificationId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-red-200 shadow-2xl p-4 space-y-3 text-gray-900">
            <h3 className="font-bold text-sm text-red-600">رفض طلب التوثيق الأزرق</h3>
            <p className="text-xs text-gray-600">
              يرجى توضيح سبب الرفض لإشعار المستخدم عبر الرسائل المباشرة:
            </p>
            <input
              type="text"
              value={rejectVerificationReason}
              onChange={(e) => setRejectVerificationReason(e.target.value)}
              placeholder="مثال: الإيصال غير واضح أو المبلغ المحول غير مطابق"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-red-400"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmRejectVerification}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => setRejectVerificationId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT WITHDRAWAL */}
      {rejectWithdrawalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-red-200 shadow-2xl p-4 space-y-3 text-gray-900">
            <h3 className="font-bold text-sm text-red-600">رفض طلب السحب واسترجاع الكوينز</h3>
            <p className="text-xs text-gray-600">
              سيتم إرجاع كمية الكوينز إلى رصيد حساب المستخدم تلقائياً وتحديث حالة الطلب إلى مرفوض.
            </p>
            <input
              type="text"
              value={rejectWithdrawalReason}
              onChange={(e) => setRejectWithdrawalReason(e.target.value)}
              placeholder="سبب الرفض (مثال: رقم المحفظة غير مسجل باسم صاحب الحساب)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-red-400"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmRejectWithdrawal}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                تأكيد الرفض واسترجاع الكوينز
              </button>
              <button
                onClick={() => setRejectWithdrawalId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <MagicCutoutModal
        isOpen={Boolean(adminCutoutTarget && adminCutoutSource)}
        initialImage={adminCutoutSource}
        title={
          adminCutoutTarget === 'frame'
            ? 'قص وتنظيف الإطار الملكي (PNG شفاف)'
            : adminCutoutTarget === 'gift'
            ? 'قص وتنظيف صورة الهدية (PNG شفاف)'
            : 'قص وتنظيف أيقونة الاسم والملف (PNG شفاف)'
        }
        maxOutputDim={adminCutoutTarget === 'custom_icon' ? 220 : 384}
        maxBytes={adminCutoutTarget === 'custom_icon' ? 140_000 : 180_000}
        onClose={() => {
          setAdminCutoutTarget(null);
          setAdminCutoutSource(null);
        }}
        onApply={async (transparentPng) => {
          const target = adminCutoutTarget;
          if (!target) return;
          try {
            let finalUrl = transparentPng;
            try {
              const pathPrefix = target === 'frame' ? 'frames/frame' : target === 'gift' ? 'gifts/gift' : 'icons/icon';
              finalUrl = await firebaseService.uploadImage(`${pathPrefix}_${Date.now()}.png`, transparentPng, {
                preserveAlpha: true,
                maxDim: target === 'custom_icon' ? 220 : 384,
                maxBytes: target === 'custom_icon' ? 140_000 : 180_000
              });
            } catch {
              finalUrl = transparentPng;
            }
            if (target === 'frame') {
              setCosFrameUrl(finalUrl);
              showToast('تم تفريغ خلفية الإطار وتجهيزه للحفظ ✓');
            } else if (target === 'custom_icon') {
              setCosCustomIconUrl(finalUrl);
              showToast('تم تفريغ خلفية الأيقونة — اضغط اعتماد التخصيصات للحفظ ✓');
            } else if (target === 'gift') {
              setNewGiftImageUrl(finalUrl);
              showToast('تم تفريغ صورة الهدية بنجاح ✓');
            }
          } catch {
            showToast('تعذر حفظ الصورة المفرغة');
          }
        }}
      />
    </div>
  );
};
