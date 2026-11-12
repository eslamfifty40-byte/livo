import React, { useState, useEffect } from 'react';
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
  Edit2
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
  DirectMessage
} from '../../types';
import { livoStore } from '../../services/livoStore';
import { firebaseService } from '../../services/firebase';
import { INITIAL_STORE_ITEMS, INITIAL_GIFTS, INITIAL_COIN_PACKAGES } from '../../data/initialData';
import { LivoAdminAppIcon } from '../../assets/appIcons';

interface AdminAppProps {
  onLogoutAdmin?: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onLogoutAdmin }) => {
  // Authentication State (Empty by default per prompt requirement, checks localStorage for persistent session)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('livo_admin_session') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Section Navigation
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'direct_support_hub' | 'inbox' | 'ads' | 'recharges' | 'payment_settings' | 'recharge_codes' | 'manual_coins' | 'pricing' | 'users' | 'agencies' | 'verifications' | 'withdrawals' | 'store_items' | 'official_room' | 'bans' | 'supervisors' | 'financial_logs'
  >('dashboard');

  // Local state synced directly with livoStore & Firebase
  const [users, setUsers] = useState<UserProfile[]>(livoStore.getUsers());
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
  const [allMessages, setAllMessages] = useState<DirectMessage[]>(livoStore.getMessages());

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

  // Recharge Codes State
  const [showAddCodeModal, setShowAddCodeModal] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newCodeCoinsInput, setNewCodeCoinsInput] = useState('');
  const [newCodeMaxUsesInput, setNewCodeMaxUsesInput] = useState('100');

  // Gifts Management State
  const [showAddGiftModal, setShowAddGiftModal] = useState(false);
  const [newGiftName, setNewGiftName] = useState('');
  const [newGiftPrice, setNewGiftPrice] = useState('');
  const [newGiftIcon, setNewGiftIcon] = useState('🎁');
  const [newGiftAnimation, setNewGiftAnimation] = useState<'lion' | 'car' | 'dragon' | 'fireworks' | 'standard'>('standard');

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

  // Supervisors management state
  const [supervisors, setSupervisors] = useState<Array<{ uid: string; name: string; email: string; permissions: string[] }>>([
    { uid: '10001', name: 'مشرف العمليات المالية', email: 'finance.supervisor@livo.live', permissions: ['recharges', 'withdrawals'] },
    { uid: '10002', name: 'مشرف الدعم والرقابة', email: 'moderation.supervisor@livo.live', permissions: ['bans', 'rooms', 'users'] }
  ]);
  const [newSupervisorUid, setNewSupervisorUid] = useState('');
  const [newSupervisorEmail, setNewSupervisorEmail] = useState('');

  // Listen to Firebase Auth state to maintain verified session
  useEffect(() => {
    const unsubAuth = firebaseService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase();
        // Check if authenticated user is the designated owner
        if (email === 'livo.admin@gmail.com' || email === 'eslamfifty11@gmail.com') {
          setIsAdminLoggedIn(true);
          // Sync with profile in store or create/update with real Firebase UID
          const existing = livoStore.getUserByUid(firebaseUser.uid) || livoStore.getUsers().find(u => u.email?.toLowerCase() === email);
          if (existing) {
            livoStore.setCurrentUser(existing.uid);
          } else {
            const ownerProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: email,
              username: 'livoadmin',
              displayName: firebaseUser.displayName || 'LIVO Official Admin',
              avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
              role: 'owner',
              coins: 500000,
              diamonds: 50000,
              level: 50,
              eligibleRechargedCoins: 5000000,
              unlockedLevelRewards: Array.from({ length: 51 }, (_, i) => i),
              isVerified: true,
              followingCount: 142,
              followersCount: 12500,
              createdAt: new Date().toISOString()
            };
            livoStore.registerUser(ownerProfile);
            firebaseService.saveUserProfile(ownerProfile);
            livoStore.setCurrentUser(firebaseUser.uid);
          }
        }
      } else {
        setIsAdminLoggedIn(false);
      }
    });

    const unsubscribe = livoStore.subscribe(() => {
      setUsers([...livoStore.getUsers()]);
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
      setAllMessages([...livoStore.getMessages()]);
    });

    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, []);

  // Admin Login with Firebase Auth and real server-side validation
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    const cleanEmail = adminUsername.trim().toLowerCase();
    
    // Check owner email format
    if (cleanEmail !== 'livo.admin@gmail.com') {
      setAuthError('حساب الإدارة غير معتمد. المالك الوحيد المعتمد هو livo.admin@gmail.com');
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await firebaseService.loginAdmin(cleanEmail, adminPassword);
      if (res.success && res.user) {
        setIsAdminLoggedIn(true);
        localStorage.setItem('livo_admin_session', 'true');
        livoStore.setCurrentUser(res.user.uid);
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

  // Google Login for Admin
  const handleGoogleLogin = async () => {
    setAuthError('');
    setIsLoggingIn(true);
    try {
      const res = await firebaseService.loginAdminWithGoogle();
      if (res.success && res.user) {
        setIsAdminLoggedIn(true);
        localStorage.setItem('livo_admin_session', 'true');
        livoStore.setCurrentUser(res.user.uid);
        showToast('تم تسجيل الدخول بنجاح كمالك للمنظومة عبر Google 🛡️');
      } else {
        setAuthError(res.error || 'فشل تسجيل الدخول عبر Google');
      }
    } catch (e: any) {
      setAuthError(e?.message || 'حدث خطأ أثناء الاتصال بـ Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Safe Logout
  const handleLogout = async () => {
    await firebaseService.logout();
    setIsAdminLoggedIn(false);
    localStorage.removeItem('livo_admin_session');
    setAdminPassword('');
    setAdminUsername('');
    if (onLogoutAdmin) onLogoutAdmin();
  };

  // Recharges Handlers
  const handleApproveRecharge = (reqId: string) => {
    const res = livoStore.approveRechargeRequest(reqId, 'livo.admin@gmail.com');
    showToast(res.message);
  };

  const handleConfirmRejectRecharge = () => {
    if (!rejectModalReqId) return;
    const res = livoStore.rejectRechargeRequest(rejectModalReqId, rejectReason, 'livo.admin@gmail.com');
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
      'livo.admin@gmail.com'
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
      bannedBy: 'livo.admin@gmail.com'
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
    const res = livoStore.unbanUser(unbanModalRecord.id, unbanReasonText, 'livo.admin@gmail.com');
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
      'livo.admin@gmail.com'
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
      createdBy: 'livo.admin@gmail.com'
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

  // Filtered Recharges List
  const filteredRecharges = recharges.filter(r => {
    if (rechargeFilter === 'all') return true;
    return r.status === rechargeFilter;
  });

  // Filtered Support Tickets
  const filteredTickets = tickets.filter(t => {
    if (ticketCategoryFilter !== 'all' && t.category !== ticketCategoryFilter) return false;
    if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
    return true;
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
      accountHolderName: paymentHolderName.trim() || undefined,
      instructions: paymentInstructions.trim() || undefined,
      isActive: true,
      isDefault: paymentIsDefault,
      updatedAt: new Date().toISOString()
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
    const res = livoStore.createRechargeCode({
      code: cleanCode,
      coinsAmount: parsedCoins,
      maxUses: parsedMaxUses,
      createdBy: 'livo.admin@gmail.com'
    });
    showToast(res.message);
    if (res.success) {
      setShowAddCodeModal(false);
      setNewCodeInput('');
      setNewCodeCoinsInput('');
      setNewCodeMaxUsesInput('100');
    }
  };

  const handleDeleteRechargeCode = (codeId: string) => {
    livoStore.deleteRechargeCode(codeId);
    showToast('تم حذف كود الشحن بنجاح');
  };

  // Gifts Handlers
  const handleSaveGift = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseInt(newGiftPrice, 10);
    if (!newGiftName.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast('يرجى إدخال اسم الهدية وسعر صحيح');
      return;
    }
    const newGift: GiftItem = {
      id: `gift-${Date.now()}`,
      name: newGiftName.trim(),
      priceCoins: parsedPrice,
      icon: newGiftIcon.trim(),
      category: 'popular',
      animationType: newGiftAnimation,
      isActive: true,
      updatedAt: new Date().toISOString()
    };
    livoStore.saveGift(newGift);
    showToast(`تمت إضافة الهدية ${newGift.name} للمتجر بنجاح`);
    setShowAddGiftModal(false);
    setNewGiftName('');
    setNewGiftPrice('');
    setNewGiftIcon('🎁');
  };

  const handleToggleGiftStatus = (gift: GiftItem) => {
    livoStore.saveGift({
      ...gift,
      isActive: gift.isActive === false ? true : false,
      updatedAt: new Date().toISOString()
    });
    showToast('تم تحديث حالة الهدية');
  };

  const handleDeleteGift = (giftId: string) => {
    livoStore.deleteGift(giftId);
    showToast('تم حذف الهدية من المتجر');
  };

  // Verifications Handlers
  const handleConfirmRejectVerification = () => {
    if (!rejectVerificationId) return;
    livoStore.reviewVerificationRequest(rejectVerificationId, 'rejected', 'livo.admin@gmail.com');
    showToast('تم رفض طلب التوثيق وإشعار المستخدم');
    setRejectVerificationId(null);
    setRejectVerificationReason('');
  };

  // Withdrawals Handlers
  const handleConfirmRejectWithdrawal = () => {
    if (!rejectWithdrawalId) return;
    livoStore.reviewWithdrawalRequest(rejectWithdrawalId, 'rejected', undefined, 'livo.admin@gmail.com');
    showToast('تم رفض طلب السحب واسترجاع الكوينز لحساب المستخدم تلقائياً');
    setRejectWithdrawalId(null);
    setRejectWithdrawalReason('');
  };

  // Login Screen
  if (!isAdminLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto my-8 bg-[#120824] rounded-3xl border border-purple-800/80 p-6 text-white shadow-2xl">
        <div className="text-center space-y-3 mb-6">
          <div className="flex justify-center">
            <LivoAdminAppIcon size={68} />
          </div>
          <h2 className="text-xl font-black text-white">تسجيل دخول تطبيق الإدارة (LIVO Admin)</h2>
          <p className="text-xs text-purple-300">
            التحقق المشفر من صلاحيات المالك عبر Firebase Authentication
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">البريد الإلكتروني للمالك:</label>
            <input
              type="email"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="اكتب البريد الإلكتروني للمالك"
              className="w-full bg-[#170b2c] border border-purple-800/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400 font-digits"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">كلمة المرور:</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="اكتب كلمة المرور"
              className="w-full bg-[#170b2c] border border-purple-800/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400 font-digits"
              required
            />
          </div>

          {authError && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-2.5 rounded-xl text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            <span>تأكيد الدخول الآمن للوحة الإدارة</span>
          </button>

          <div className="pt-2 border-t border-purple-800/40 space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-gray-900 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>تسجيل الدخول السريع بحساب Google للمالك</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#0d051a] text-white rounded-3xl border border-purple-800/60 shadow-2xl overflow-hidden flex flex-col min-h-[720px] relative">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-2 rounded-full text-xs font-black shadow-2xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header (STRICT: NO EMAIL DISPLAYED HERE per item 2) */}
      <div className="bg-[#170b2c] border-b border-purple-800/50 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LivoAdminAppIcon size={34} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white">منظومة LIVO — لوحة المالك الرسمية</h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold">
                Owner Authority Active
              </span>
            </div>
            <p className="text-[11px] text-purple-300">
              قاعدة بيانات موحدة متصلة بـ Firebase ومزامنة لحظية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs px-3 py-1.5 rounded-xl transition-all font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Navigation Sidebar / Tabs & Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-[#120824] border-b md:border-b-0 md:border-l border-purple-800/40 p-2.5 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1 shrink-0">
          
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'dashboard' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>الإحصائيات والمؤشرات</span>
          </button>

          <button
            onClick={() => setActiveSection('direct_support_hub')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'direct_support_hub' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>مركز الإدارة والدعم المباشر</span>
            </div>
            {unreadSupportCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-digits text-[10px] flex items-center justify-center font-black animate-pulse">
                {unreadSupportCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('inbox')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'inbox' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-400" />
              <span>صندوق الوارد والشكاوى</span>
            </div>
            {pendingTicketsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white font-digits text-[10px] flex items-center justify-center font-black animate-pulse">
                {pendingTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('ads')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'ads' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-yellow-300" />
              <span>مركز إدارة الإعلانات</span>
            </div>
            {activeAdsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 font-digits text-[10px] flex items-center justify-center font-black">
                {activeAdsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('recharges')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'recharges' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
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

          <button
            onClick={() => setActiveSection('payment_settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'payment_settings' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <span>إعدادات الشحن ووسائل الدفع</span>
          </button>

          <button
            onClick={() => setActiveSection('recharge_codes')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'recharge_codes' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <QrCode className="w-4 h-4 text-pink-400" />
            <span>أكواد الشحن والقسائم ({rechargeCodes.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('manual_coins')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'manual_coins' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>شحن وتعديل رصيد UID</span>
          </button>

          <button
            onClick={() => setActiveSection('pricing')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'pricing' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <BadgePercent className="w-4 h-4" />
            <span>أسعار وباقات الكوينز</span>
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'users' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الحسابات والمستخدمين ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('agencies')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'agencies' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>الوكالات والوكلاء</span>
            </div>
            {approvedAgenciesCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-digits text-[10px] flex items-center justify-center">
                {approvedAgenciesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('verifications')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'verifications' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>التوثيق الأزرق</span>
            </div>
            {verifications.filter(v => v.status === 'pending').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-digits text-[10px] flex items-center justify-center">
                {verifications.filter(v => v.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('withdrawals')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'withdrawals' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              <span>طلبات السحب</span>
            </div>
            {pendingWithdrawalsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-digits text-[10px] flex items-center justify-center">
                {pendingWithdrawalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('store_items')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'store_items' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>المتجر والهدايا والإطارات</span>
          </button>

          <button
            onClick={() => setActiveSection('official_room')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'official_room' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>الغرفة الرسمية والإعلانات</span>
          </button>

          <button
            onClick={() => setActiveSection('bans')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'bans' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Slash className="w-4 h-4" />
            <span>إدارة الحظر والعقوبات</span>
          </button>

          <button
            onClick={() => setActiveSection('supervisors')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'supervisors' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>صلاحيات المشرفين</span>
          </button>

          <button
            onClick={() => setActiveSection('financial_logs')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'financial_logs' ? 'bg-amber-500 text-black shadow-md' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <History className="w-4 h-4" />
            <span>السجل المالي الدائم</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0d051a] p-4 sm:p-6 overflow-y-auto">
          
          {/* SECTION 1: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-white">نظرة عامة على المنظومة</h2>
                <p className="text-xs text-purple-300">
                  إحصائيات حية مستمدة ومحدثة لحظياً من قاعدة بيانات Firebase
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50">
                  <span className="text-xs text-purple-300 block">إجمالي المستخدمين</span>
                  <span className="text-2xl font-black font-digits text-white mt-1 block">
                    {totalUsersCount}
                  </span>
                  <span className="text-[10px] text-green-400 font-bold mt-1 block">
                    {activeUsersCount} نشط • 0 وهمي
                  </span>
                </div>

                <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50">
                  <span className="text-xs text-purple-300 block">طلبات شحن قيد الانتظار</span>
                  <span className="text-2xl font-black font-digits text-amber-400 mt-1 block">
                    {pendingRechargesCount}
                  </span>
                  <span className="text-[10px] text-purple-400 mt-1 block">
                    تتطلب موافقة المالك
                  </span>
                </div>

                <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50">
                  <span className="text-xs text-purple-300 block">إجمالي مبيعات الشحن</span>
                  <span className="text-2xl font-black font-digits text-green-400 mt-1 block">
                    {totalRechargedEGP.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-purple-400 mt-1 block">
                    مبيعات معتمدة بإيصالات
                  </span>
                </div>

                <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50">
                  <span className="text-xs text-purple-300 block">الكوينز المتداولة</span>
                  <span className="text-2xl font-black font-digits text-yellow-300 mt-1 block">
                    {totalCoinsInCirculation.toLocaleString()} 🪙
                  </span>
                  <span className="text-[10px] text-purple-400 mt-1 block">
                    أرصدة حسابات فعلية
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CENTRAL ADMIN INBOX & USER TICKETS */}
          {activeSection === 'inbox' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-black text-white">صندوق الوارد المركزي والرسائل والدعم</h2>
                    {pendingTicketsCount > 0 && (
                      <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-digits font-bold px-2 py-0.5 rounded-full">
                        {pendingTicketsCount} طلب بانتظار الرد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    استقبال مباشر ولحظي لرسائل المستخدمين، الشكاوى، البلاغات، والاستفسارات مع الرد الفوري الموثق
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={ticketCategoryFilter}
                    onChange={(e: any) => setTicketCategoryFilter(e.target.value)}
                    className="bg-[#170b2c] border border-purple-800/60 rounded-xl px-2.5 py-1.5 text-xs text-purple-200 outline-none"
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
                    className="bg-[#170b2c] border border-purple-800/60 rounded-xl px-2.5 py-1.5 text-xs text-purple-200 outline-none"
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
                {/* Tickets Column (5 cols on lg) */}
                <div className="lg:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredTickets.length === 0 ? (
                    <div className="bg-[#170b2c] p-8 rounded-2xl border border-purple-800/40 text-center text-xs text-purple-400 space-y-2">
                      <Inbox className="w-8 h-8 mx-auto opacity-40 text-purple-300" />
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
                            ? 'bg-purple-900/50 border-amber-400 shadow-lg'
                            : 'bg-[#170b2c] hover:bg-purple-950/40 border-purple-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={ticket.userAvatar}
                              alt={ticket.username}
                              className="w-8 h-8 rounded-full object-cover border border-purple-700"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white">{ticket.username}</span>
                                <span className="text-[10px] text-amber-300 font-digits font-bold">UID: {ticket.uid}</span>
                              </div>
                              <span className="text-[10px] text-purple-300 block font-digits">
                                {new Date(ticket.createdAt).toLocaleDateString('ar-EG')} - {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              ticket.status === 'pending'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                                : ticket.status === 'in_progress'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : ticket.status === 'resolved'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                                : 'bg-gray-700/40 text-gray-400'
                            }`}>
                              {ticket.status === 'pending' ? 'جديد / بالانتظار' : ticket.status === 'in_progress' ? 'قيد المتابعة' : ticket.status === 'resolved' ? 'تم الرد والحل' : 'مغلق'}
                            </span>

                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                              ticket.priority === 'urgent' ? 'bg-red-950 text-red-400 border border-red-800' : ticket.priority === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-purple-950 text-purple-300'
                            }`}>
                              {ticket.priority === 'urgent' ? 'عاجل جداً' : ticket.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-purple-800/30">
                          <h4 className="text-xs font-bold text-amber-200 line-clamp-1">{ticket.subject}</h4>
                          <p className="text-[11px] text-purple-200 line-clamp-2 mt-0.5">{ticket.message}</p>
                          {ticket.attachmentUrl && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-blue-300 mt-1 bg-blue-950/40 px-2 py-0.5 rounded">
                              <Eye className="w-3 h-3" /> مرفق صورة
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Ticket Details & Real-Time Direct Reply Drawer (7 cols on lg) */}
                <div className="lg:col-span-7">
                  {selectedTicket ? (
                    <div className="bg-[#170b2c] p-4 sm:p-5 rounded-2xl border border-purple-800/60 shadow-xl space-y-4">
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between pb-3 border-b border-purple-800/40">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedTicket.userAvatar}
                            alt={selectedTicket.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-white">{selectedTicket.username}</h3>
                              <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full font-digits">
                                UID: {selectedTicket.uid}
                              </span>
                            </div>
                            <span className="text-xs text-purple-300 font-digits">
                              تاريخ الإرسال: {new Date(selectedTicket.createdAt).toLocaleString('ar-EG')}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                          selectedTicket.category === 'complaint' ? 'bg-red-500/20 text-red-300' :
                          selectedTicket.category === 'financial' ? 'bg-amber-500/20 text-amber-300' :
                          selectedTicket.category === 'report' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {selectedTicket.category === 'complaint' ? 'شكوى رسمية' :
                           selectedTicket.category === 'financial' ? 'مشكلة شحن ورصيد' :
                           selectedTicket.category === 'report' ? 'بلاغ مستخدم' :
                           selectedTicket.category === 'technical' ? 'مشكلة تقنية' : 'استفسار'}
                        </span>
                      </div>

                      {/* Subject & User Message */}
                      <div className="bg-[#120824] p-3.5 rounded-xl border border-purple-800/40 space-y-2">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>الموضوع: {selectedTicket.subject}</span>
                        </div>
                        <p className="text-xs text-purple-100 leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.message}
                        </p>

                        {/* Attachment if present */}
                        {selectedTicket.attachmentUrl && (
                          <div className="pt-2 border-t border-purple-800/30">
                            <span className="text-[10px] text-purple-300 font-bold block mb-1">المرفق / لقطة الشاشة:</span>
                            <div
                              onClick={() => setZoomedTicketImageUrl(selectedTicket.attachmentUrl || null)}
                              className="relative inline-block cursor-pointer rounded-lg overflow-hidden border border-purple-700/60 max-w-[200px] group"
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

                      {/* Previous Admin Reply if present */}
                      {selectedTicket.reply && (
                        <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              الرد الحالي من الإدارة ({selectedTicket.repliedBy || 'livo.admin@gmail.com'})
                            </span>
                            {selectedTicket.repliedAt && (
                              <span className="font-digits text-[10px] text-emerald-300">
                                {new Date(selectedTicket.repliedAt).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-100 leading-relaxed whitespace-pre-wrap">
                            {selectedTicket.reply}
                          </p>
                        </div>
                      )}

                      {/* Reply Form */}
                      <div className="space-y-3 pt-2 border-t border-purple-800/40">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5" />
                            <span>كتابة رد مباشر وموثق للمستخدم:</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-purple-300">الحالة بعد الرد:</span>
                            <select
                              value={ticketReplyStatus}
                              onChange={(e: any) => setTicketReplyStatus(e.target.value)}
                              className="bg-[#120824] border border-purple-800/60 rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                            >
                              <option value="resolved">تم الحل (Resolved)</option>
                              <option value="in_progress">قيد المتابعة (In Progress)</option>
                              <option value="closed">مغلقة (Closed)</option>
                            </select>
                          </div>
                        </div>

                        {/* Quick responses */}
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('مرحباً بك في LIVO، تم فحص طلبك ومعالجة المشكلة بنجاح. نتمنى لك تجربة ممتعة.')}
                            className="text-[10px] bg-purple-900/60 hover:bg-purple-800 text-purple-200 px-2 py-0.5 rounded-md border border-purple-700/40"
                          >
                            + تم حل المشكلة بنجاح
                          </button>
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('مرحباً بك، يرجى تزويدنا برقم العملية وصورة إيصال التحويل لإتمام طلب الشحن فوراً.')}
                            className="text-[10px] bg-purple-900/60 hover:bg-purple-800 text-purple-200 px-2 py-0.5 rounded-md border border-purple-700/40"
                          >
                            + طلب إيصال الشحن
                          </button>
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('نشكرك على تواصلك، تم تحويل البلاغ للقسم المختص وسيتم اتخاذ الإجراء اللازم.')}
                            className="text-[10px] bg-purple-900/60 hover:bg-purple-800 text-purple-200 px-2 py-0.5 rounded-md border border-purple-700/40"
                          >
                            + تحويل للقسم المختص
                          </button>
                        </div>

                        <textarea
                          value={ticketReplyText}
                          onChange={(e) => setTicketReplyText(e.target.value)}
                          placeholder="اكتب رد الإدارة الرسمي هنا... سيصل مباشرة لحساب المستخدم في LIVO ويظهر في محادثات الدعم"
                          rows={4}
                          className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-3 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400"
                        />

                        <button
                          type="button"
                          onClick={handleReplyToTicket}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>إرسال الرد للمستخدم وتحديث التذكرة في Firebase</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#170b2c] p-12 rounded-2xl border border-purple-800/40 text-center text-xs text-purple-400 space-y-2">
                      <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-purple-300" />
                      <p className="font-bold text-sm text-purple-200">اختر رسالة أو تذكرة من القائمة لمعاينتها والرد عليها</p>
                      <p className="text-[11px] text-purple-400">أي رد سيصل مباشرة للمستخدم ويُحفظ في سجل الدعم الفني المشترك</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ADVERTISEMENT MANAGEMENT CENTER */}
          {activeSection === 'ads' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-black text-white">مركز إدارة الإعلانات والعروض الترويجية</h2>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-digits font-bold px-2 py-0.5 rounded-full">
                      {ads.length} حملة إعلانية
                    </span>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    إدارة الحملات الترويجية، البانرات، النوافذ المنبثقة، وتتبع النقرات والمشاهدات الحقيقية
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateAdModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء إعلان جديد</span>
                </button>
              </div>

              {/* Performance Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#170b2c] p-3 rounded-xl border border-purple-800/40">
                  <span className="text-[10px] text-purple-300 block">إجمالي الإعلانات</span>
                  <span className="font-digits font-black text-lg text-white">{ads.length}</span>
                </div>
                <div className="bg-[#170b2c] p-3 rounded-xl border border-purple-800/40">
                  <span className="text-[10px] text-purple-300 block">الإعلانات النشطة</span>
                  <span className="font-digits font-black text-lg text-amber-400">{activeAdsCount}</span>
                </div>
                <div className="bg-[#170b2c] p-3 rounded-xl border border-purple-800/40">
                  <span className="text-[10px] text-purple-300 block">إجمالي المشاهدات</span>
                  <span className="font-digits font-black text-lg text-blue-400">
                    {ads.reduce((sum, a) => sum + (a.viewsCount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#170b2c] p-3 rounded-xl border border-purple-800/40">
                  <span className="text-[10px] text-purple-300 block">إجمالي النقرات</span>
                  <span className="font-digits font-black text-lg text-emerald-400">
                    {ads.reduce((sum, a) => sum + (a.clicksCount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Advertisements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.length === 0 ? (
                  <div className="col-span-full bg-[#170b2c] p-12 rounded-2xl border border-purple-800/40 text-center text-xs text-purple-400 space-y-2">
                    <Megaphone className="w-10 h-10 mx-auto opacity-30 text-purple-300" />
                    <p className="font-bold text-sm text-purple-200">لا توجد إعلانات منشأة حتى الآن</p>
                    <p className="text-[11px] text-purple-400">اضغط على "إنشاء إعلان جديد" لإطلاق حملة ترويجية تظهر لمستخدمي LIVO</p>
                  </div>
                ) : (
                  ads.map(ad => (
                    <div
                      key={ad.id}
                      className="bg-[#170b2c] rounded-2xl border border-purple-800/50 overflow-hidden shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        {/* Ad Banner Image Preview */}
                        <div className="relative aspect-[16/8] bg-black/40 overflow-hidden border-b border-purple-800/40">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ad.status === 'active'
                                ? 'bg-green-500 text-black font-black'
                                : 'bg-red-500/80 text-white'
                            }`}>
                              {ad.status === 'active' ? 'نشط ويعمل ✓' : 'متوقف'}
                            </span>
                            <span className="bg-black/70 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-md">
                              {ad.placement === 'banner' ? 'بانر رئيسي' : ad.placement === 'popup' ? 'نافذة منبثقة' : 'خلاصة'}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-3.5 space-y-2">
                          <h3 className="font-bold text-sm text-white">{ad.title}</h3>
                          <p className="text-xs text-purple-200 line-clamp-2 leading-relaxed">
                            {ad.description}
                          </p>

                          {/* Stats Bar */}
                          <div className="grid grid-cols-2 gap-2 bg-[#120824] p-2 rounded-xl text-center font-digits">
                            <div>
                              <span className="text-[10px] text-purple-400 block">المشاهدات</span>
                              <span className="font-bold text-xs text-blue-300">{(ad.viewsCount || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-purple-400 block">النقرات</span>
                              <span className="font-bold text-xs text-emerald-300">{(ad.clicksCount || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="text-[10px] text-purple-400 font-digits flex items-center justify-between pt-1">
                            <span>البداية: {ad.startDate}</span>
                            <span>النهاية: {ad.endDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="p-3 bg-[#120824] border-t border-purple-800/40 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleAdStatus(ad)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            ad.status === 'active'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60 hover:bg-amber-900/70'
                              : 'bg-green-950/70 text-green-300 border border-green-800/60 hover:bg-green-900/70'
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
                          className="p-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-xl"
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
                  <h2 className="text-lg font-black text-white">إدارة طلبات شحن الكوينز</h2>
                  <p className="text-xs text-purple-300">
                    الطلبات محفوظة بصورة دائمة في Firestore ولن تختفي عند تحديث الصفحة أو تسجيل الدخول
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-[#170b2c] p-1 rounded-xl border border-purple-800/40">
                  <button
                    onClick={() => setRechargeFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'pending' ? 'bg-amber-500 text-black' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    المعلقة ({recharges.filter(r => r.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setRechargeFilter('approved')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'approved' ? 'bg-green-600 text-white' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    المقبولة ({recharges.filter(r => r.status === 'approved').length})
                  </button>
                  <button
                    onClick={() => setRechargeFilter('rejected')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'rejected' ? 'bg-red-600 text-white' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    المرفوضة ({recharges.filter(r => r.status === 'rejected').length})
                  </button>
                  <button
                    onClick={() => setRechargeFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      rechargeFilter === 'all' ? 'bg-purple-700 text-white' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    الكل ({recharges.length})
                  </button>
                </div>
              </div>

              {/* Requests List */}
              {filteredRecharges.length === 0 ? (
                <div className="bg-[#170b2c] p-8 rounded-2xl border border-purple-800/40 text-center text-purple-400 text-xs">
                  لا توجد طلبات شحن في هذا القسم حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecharges.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        req.status === 'pending'
                          ? 'bg-[#170b2c] border-amber-500/40'
                          : req.status === 'approved'
                          ? 'bg-[#120824] border-green-800/40 opacity-90'
                          : 'bg-[#120824] border-red-900/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={req.userAvatar}
                          alt={req.username}
                          className="w-12 h-12 rounded-full border border-purple-500 object-cover shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{req.username}</span>
                            <span className="font-digits font-bold text-amber-300 text-xs bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                              UID: {req.uid}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              req.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : req.status === 'approved'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-purple-300">
                            <span>الطلب: <strong className="font-digits text-white">{req.orderNumber}</strong></span>
                            <span>الباقة: <strong className="font-digits text-amber-400">{req.packageCoins.toLocaleString()} كوينز</strong></span>
                            <span>المبلغ: <strong className="font-digits text-green-400">{req.amountEGP} ج.م</strong></span>
                            <span>هاتف الدافع: <strong className="font-digits text-white">{req.payerPhone}</strong></span>
                          </div>

                          {req.rejectReason && (
                            <p className="text-[11px] text-red-300 mt-1">
                              سبب الرفض: {req.rejectReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {req.receiptUrl && (
                          <button
                            onClick={() => setZoomedReceiptUrl(req.receiptUrl)}
                            className="flex items-center gap-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 text-xs px-3 py-2 rounded-xl transition-all"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>معاينة الإيصال</span>
                          </button>
                        )}

                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRecharge(req.id)}
                              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>موافقة وإضافة الرصيد</span>
                            </button>
                            <button
                              onClick={() => setRejectModalReqId(req.id)}
                              className="bg-red-900/60 hover:bg-red-800 text-red-200 text-xs px-3 py-2 rounded-xl border border-red-800"
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
                <h2 className="text-lg font-black text-white">الشحن اليدوي وضبط أرصدة UID</h2>
                <p className="text-xs text-purple-300">
                  صلاحية خاصة بالمالك لتعديل الأرصدة مع تسجيل فوري في السجل المالي
                </p>
              </div>

              <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50 space-y-3">
                <label className="block text-xs font-bold text-purple-200">
                  ابحث عن المستخدم بالـ Public ID (5 أرقام) أو UID أو اسم المستخدم:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchCoinsUid}
                    onChange={(e) => setSearchCoinsUid(e.target.value)}
                    placeholder="أدخل معرّف Public ID (مثال: 10245)"
                    className="flex-1 bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs font-digits text-white placeholder-purple-400/50 outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => {
                      const clean = searchCoinsUid.trim().toLowerCase();
                      const found = users.find(u =>
                        u.uid.toLowerCase() === clean ||
                        u.authUid?.toLowerCase() === clean ||
                        u.username.toLowerCase() === clean ||
                        u.displayName.toLowerCase() === clean ||
                        u.email?.toLowerCase() === clean
                      );
                      if (found) {
                        setSelectedUserForCoins(found);
                      } else {
                        showToast(`لم يتم العثور على أي مستخدم بالمعرف "${searchCoinsUid}"`);
                      }
                    }}
                    className="bg-purple-900 hover:bg-purple-800 text-white text-xs px-4 py-2 rounded-xl font-bold"
                  >
                    بحث
                  </button>
                </div>
              </div>

              {selectedUserForCoins && (
                <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/60 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-800/40">
                    <div className="flex items-center gap-3">
                      <img src={selectedUserForCoins.avatar} alt="" className="w-12 h-12 rounded-full border border-purple-500 object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{selectedUserForCoins.displayName}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-purple-950 font-digits font-black">
                            Lv.{selectedUserForCoins.level || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs font-digits text-purple-300">
                          <span className="text-amber-400 font-bold">Public ID: {selectedUserForCoins.uid}</span>
                          <span>•</span>
                          <span className="text-cyan-300 font-bold">💎 {(selectedUserForCoins.diamonds || 0).toLocaleString('en-US')} ألماسة</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-purple-300 block">رصيد الكوينز الحالي:</span>
                      <span className="text-lg font-black font-digits text-yellow-300">
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
                        coinActionType === 'add' ? 'bg-green-600 text-white' : 'bg-[#120824] text-purple-300 border border-purple-800/40'
                      }`}
                    >
                      + إضافة كوينز
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoinActionType('deduct')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        coinActionType === 'deduct' ? 'bg-red-600 text-white' : 'bg-[#120824] text-purple-300 border border-purple-800/40'
                      }`}
                    >
                      - خصم كوينز
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoinActionType('set')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        coinActionType === 'set' ? 'bg-amber-500 text-black' : 'bg-[#120824] text-purple-300 border border-purple-800/40'
                      }`}
                    >
                      ضبط الرصيد مباشرة
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      الكمية (أرقام إنجليزية فقط):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={coinAmountInput}
                      onChange={(e) => setCoinAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="أدخل عدد الكوينز (مثال: 5000)"
                      className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs font-digits text-white placeholder-purple-400/50 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      سبب العملية الإدارية (مطلوب للتدقيق المالي):
                    </label>
                    <input
                      type="text"
                      value={coinReasonInput}
                      onChange={(e) => setCoinReasonInput(e.target.value)}
                      placeholder="مثال: تصحيح خطأ شحن، مكافأة مسابقة رسمية، تعويض"
                      className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400"
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
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all"
                  >
                    مراجعة وتأكيد العملية
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: PRICING & COIN PACKAGES */}
          {activeSection === 'pricing' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">أسعار وباقات الكوينز المعتمدة</h2>
                <p className="text-xs text-purple-300">
                  السعر الأساسي المعتمد: 1000 كوينز = 350 جنيه مصري (تناسب طردي، بدون بونص خادع)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {INITIAL_COIN_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-[#170b2c] p-3.5 rounded-2xl border border-purple-800/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-digits font-black text-amber-400 text-sm">
                          {pkg.coins.toLocaleString()} كوينز
                        </span>
                        {pkg.popular && (
                          <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-bold">
                            شائع
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-green-400 font-digits font-bold block mt-0.5">
                        {pkg.priceEGP} جنيه مصري
                      </span>
                    </div>
                    <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-1 rounded-lg">
                      معتمد رسمياً
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: USERS MANAGEMENT */}
          {activeSection === 'users' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">إدارة الحسابات وسلامة معرّفات UID</h2>
                <p className="text-xs text-purple-300">
                  كل مستخدم يمتلك UID فريد ثابت • الحسابات الجديدة تحصل على رتبة User فقط بدون كوينز تلقائية
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map(u => (
                  <div
                    key={u.uid}
                    className="bg-[#170b2c] p-3.5 rounded-2xl border border-purple-800/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.displayName} className="w-10 h-10 rounded-full border border-purple-500 object-cover" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{u.displayName}</span>
                          {u.isVerified && <span className="text-[10px] text-blue-400">✓</span>}
                        </div>
                        <span className="text-[11px] text-purple-300 font-digits">
                          UID: <strong className="text-amber-400">{u.uid}</strong> • @{u.username}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            u.role === 'owner' ? 'bg-amber-500/20 text-amber-300' : u.role === 'agent' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-800 text-gray-300'
                          }`}>
                            {u.role === 'owner' ? 'المالك الرسمي' : u.role === 'agent' ? 'وكيل معتمد' : 'مستخدم عادي'}
                          </span>
                          <span className="text-[10px] text-purple-300 font-digits">
                            الرصيد: {u.coins.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedUserForCoins(u);
                        setSearchCoinsUid(u.uid);
                        setActiveSection('manual_coins');
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 bg-purple-950 px-2.5 py-1.5 rounded-xl border border-purple-800"
                    >
                      تعديل الرصيد
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: AGENCIES */}
          {activeSection === 'agencies' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">إدارة الوكالات والوكلاء المعتمدين</h2>
                <p className="text-xs text-purple-300">
                  اعتماد طلبات الوكالات ومنح صلاحية الشحن المباشر للمستخدمين
                </p>
              </div>

              {agencies.length === 0 ? (
                <div className="bg-[#170b2c] p-8 rounded-2xl border border-purple-800/40 text-center text-purple-400 text-xs">
                  لا توجد طلبات وكالات حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {agencies.map((agency) => (
                    <div
                      key={agency.id}
                      className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <img src={agency.userAvatar} alt="" className="w-12 h-12 rounded-full border border-purple-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{agency.agencyName}</h4>
                            <span className="text-xs font-digits text-amber-400">UID: {agency.uid}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              agency.status === 'approved' ? 'bg-green-500/20 text-green-300' : agency.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {agency.status === 'approved' ? 'وكالة معتمدة' : agency.status === 'pending' ? 'قيد المراجعة' : 'مرفوضة'}
                            </span>
                          </div>
                          <p className="text-xs text-purple-300 mt-0.5">
                            النوع: {agency.agencyType === 'charging_agent' ? 'وكيل شحن' : 'وكيل موزعين'} • هاتف: {agency.phone}
                          </p>
                          <p className="text-[11px] text-purple-400 mt-1">{agency.experienceNotes}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {agency.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => {
                                livoStore.reviewAgencyApplication(agency.id, 'approved', true, 'livo.admin@gmail.com');
                                showToast(`تمت الموافقة على وكالة ${agency.agencyName} وتفعيل الشحن`);
                              }}
                              className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold"
                            >
                              موافقة وتفعيل الشحن
                            </button>
                            <button
                              onClick={() => {
                                livoStore.reviewAgencyApplication(agency.id, 'rejected', false, 'livo.admin@gmail.com');
                                showToast('تم رفض طلب الوكالة');
                              }}
                              className="bg-red-900/60 hover:bg-red-800 text-red-200 text-xs px-3 py-1.5 rounded-xl"
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
                              agency.canChargeUsers ? 'bg-amber-500 text-black' : 'bg-purple-900 text-purple-300'
                            }`}
                          >
                            {agency.canChargeUsers ? 'صلاحية الشحن مفعلة ✓' : 'تفعيل صلاحية الشحن'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION: DIRECT SUPPORT & ADMIN HUB */}
          {activeSection === 'direct_support_hub' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">مركز الإدارة والدعم المباشر للأعضاء</h2>
                <p className="text-xs text-purple-300">
                  مراسلة فورية مشفرة في الوقت الفعلي مع أي مستخدم عبر معرّف UID أو الاسم، مع متابعة الإشعارات والرسائل غير المقروءة
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[520px]">
                {/* Left Panel: Search & Users / Threads List */}
                <div className="bg-[#170b2c] rounded-2xl border border-purple-800/50 p-3 flex flex-col space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-purple-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={supportSearchQuery}
                      onChange={(e) => setSupportSearchQuery(e.target.value)}
                      placeholder="ابحث بالـ UID أو الاسم أو الحساب..."
                      className="w-full bg-[#120824] border border-purple-800/50 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="text-[11px] text-purple-300 font-bold px-1 flex items-center justify-between">
                    <span>قائمة المستخدمين والمحادثات</span>
                    <span className="text-[10px] bg-purple-900/60 px-2 py-0.5 rounded font-digits text-amber-300">
                      {users.length} مستخدم
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[440px] pr-1">
                    {users
                      .filter(u => {
                        if (!supportSearchQuery.trim()) return true;
                        const q = supportSearchQuery.toLowerCase();
                        return (
                          u.uid.toLowerCase().includes(q) ||
                          u.displayName.toLowerCase().includes(q) ||
                          u.username.toLowerCase().includes(q)
                        );
                      })
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
                                ? 'bg-amber-500/20 border-amber-400/80 text-white'
                                : 'bg-[#120824]/60 border-purple-800/30 hover:border-purple-600 text-purple-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-purple-600 shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs truncate text-white">{u.displayName}</span>
                                  {u.isVerified && <span className="text-blue-400 text-[10px]">✓</span>}
                                </div>
                                <span className="text-[10px] font-digits text-amber-400 block">UID: {u.uid}</span>
                                {lastMsg && (
                                  <p className="text-[10px] text-purple-300/80 truncate mt-0.5">
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
                <div className="md:col-span-2 bg-[#170b2c] rounded-2xl border border-purple-800/50 p-4 flex flex-col justify-between">
                  {selectedSupportUser ? (
                    <>
                      {/* Chat Header */}
                      <div className="pb-3 border-b border-purple-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={selectedSupportUser.avatar} alt="" className="w-10 h-10 rounded-full border border-purple-500 object-cover" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-sm text-white">{selectedSupportUser.displayName}</h3>
                              {selectedSupportUser.isVerified && <span className="text-xs text-blue-400">✓ موثق</span>}
                              {selectedSupportUser.agencyRole === 'charging_agent' && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">⚡ وكيل شحن</span>
                              )}
                            </div>
                            <span className="text-xs text-purple-300 font-digits">
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
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1"
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
                                  className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-md ${
                                    isAdminMsg
                                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-tl-sm'
                                      : 'bg-[#120824] border border-purple-800/60 text-white rounded-tr-sm'
                                  }`}
                                >
                                  {msg.mediaUrl && (
                                    <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                                      <img
                                        src={msg.mediaUrl}
                                        alt="مرفق"
                                        className="max-h-48 w-full object-cover cursor-pointer hover:opacity-90"
                                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                                      />
                                    </div>
                                  )}
                                  <p>{msg.content}</p>
                                </div>
                                <span className="text-[9px] text-purple-400 font-digits mt-1 px-1">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                      </div>

                      {/* Reply Input Bar */}
                      <form onSubmit={handleSendAdminDirectMessage} className="pt-2 border-t border-purple-800/50 flex items-center gap-2">
                        <input
                          type="text"
                          value={supportChatInput}
                          onChange={(e) => setSupportChatInput(e.target.value)}
                          placeholder="اكتب رد الإدارة الرسمي..."
                          className="flex-1 bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400"
                        />
                        <button
                          type="submit"
                          disabled={!supportChatInput.trim()}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال</span>
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-purple-400">
                      <MessageSquare className="w-12 h-12 mb-3 text-purple-600" />
                      <h4 className="font-bold text-sm text-white">اختر مستخدماً من القائمة للبدء بالمراسلة الفورية</h4>
                      <p className="text-xs text-purple-300 mt-1">تصل رسائلك فوراً إلى صندوق رسائل المستخدم في حسابه وتظهر مباشرة</p>
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
                  <h2 className="text-lg font-black text-white">إعدادات وسائل الدفع والشحن المعتمدة</h2>
                  <p className="text-xs text-purple-300">
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
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة وسيلة دفع جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className={`bg-[#170b2c] p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      pm.isActive ? 'border-purple-800/60' : 'border-red-900/40 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {pm.type === 'vodafone_cash' ? 'فودافون كاش' : pm.type === 'instapay' ? 'InstaPay' : pm.type === 'orange_cash' ? 'أورنج كاش' : pm.type === 'etisalat_cash' ? 'اتصالات كاش' : 'محفظة إلكترونية'}
                          </span>
                          {pm.isDefault && (
                            <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-1.5 py-0.2 rounded font-bold">
                              الأساسية
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          pm.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {pm.isActive ? 'مفعلة' : 'معطلة'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-white mb-1">{pm.title}</h4>
                      
                      <div className="bg-[#120824] p-2.5 rounded-xl border border-purple-800/40 my-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-purple-300">رقم المحفظة / الحساب:</span>
                          <span className="text-xs font-digits font-black text-amber-400">{pm.accountNumber}</span>
                        </div>
                        {pm.accountHolderName && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-purple-300">اسم صاحب الحساب:</span>
                            <span className="text-xs font-bold text-white">{pm.accountHolderName}</span>
                          </div>
                        )}
                      </div>

                      {pm.instructions && (
                        <p className="text-[11px] text-purple-300/80 mb-3">{pm.instructions}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-purple-800/40 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTogglePaymentStatus(pm)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                          pm.isActive ? 'bg-amber-900/40 text-amber-300' : 'bg-green-900/40 text-green-300'
                        }`}
                      >
                        {pm.isActive ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                        <span>{pm.isActive ? 'تعطيل' : 'تفعيل'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditPaymentId(pm.id);
                            setPaymentType(pm.type);
                            setPaymentTitle(pm.title);
                            setPaymentAccountNum(pm.accountNumber);
                            setPaymentHolderName(pm.accountHolderName || '');
                            setPaymentInstructions(pm.instructions || '');
                            setPaymentIsDefault(pm.isDefault || false);
                            setShowAddPaymentModal(true);
                          }}
                          className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs px-2.5 py-1.5 rounded-xl"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="bg-red-950/60 hover:bg-red-900 text-red-300 text-xs px-2.5 py-1.5 rounded-xl"
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
                  <h2 className="text-lg font-black text-white">أكواد وقسائم الشحن الفورية (Vouchers)</h2>
                  <p className="text-xs text-purple-300">
                    إنشاء وتوليد قسائم شحن بأرصدة كوينز محددة • نظام مانع التكرار يضمن شحن الكود مرة واحدة فقط لكل حساب UID
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCodeModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>توليد كود شحن جديد</span>
                </button>
              </div>

              <div className="bg-[#170b2c] rounded-2xl border border-purple-800/50 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#120824] text-purple-300 border-b border-purple-800/50">
                    <tr>
                      <th className="p-3">كود القسيمة</th>
                      <th className="p-3">الكوينز الممنوحة</th>
                      <th className="p-3">مرات الاستخدام</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">المستخدمون المستفيدون</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-800/30 text-white">
                    {rechargeCodes.map((code) => {
                      const isMaxReached = code.usedCount >= code.maxUses;
                      return (
                        <tr key={code.id} className="hover:bg-purple-950/20">
                          <td className="p-3 font-mono font-black text-amber-400 text-sm">
                            {code.code}
                          </td>
                          <td className="p-3 font-digits font-bold text-yellow-300">
                            {code.coinsAmount.toLocaleString()} كوينز
                          </td>
                          <td className="p-3 font-digits">
                            {code.usedCount} / {code.maxUses}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              !isMaxReached ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {!isMaxReached ? 'صالح للاستخدام' : 'مكتمل الاستخدام'}
                            </span>
                          </td>
                          <td className="p-3 text-purple-300 text-[11px] font-digits">
                            {code.redeemedByUids?.length ? `${code.redeemedByUids.length} حساب` : 'لم يُستخدم بعد'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteRechargeCode(code.id)}
                              className="bg-red-950/60 hover:bg-red-900 text-red-300 text-xs px-2.5 py-1 rounded-lg"
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
              <div>
                <h2 className="text-lg font-black text-white">طلبات التوثيق بالعلامة الزرقاء الرسمية</h2>
                <p className="text-xs text-purple-300">
                  مراجعة طلبات وإيصالات توثيق الحسابات بالعلامة الزرقاء الرسمية في الغرف والملف الشخصي
                </p>
              </div>

              {verifications.length === 0 ? (
                <div className="bg-[#170b2c] p-8 rounded-2xl border border-purple-800/40 text-center text-purple-400 text-xs">
                  لا توجد طلبات توثيق حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {verifications.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <img src={req.userAvatar} alt="" className="w-12 h-12 rounded-full border border-purple-500 object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{req.displayName}</h4>
                            <span className="text-xs font-digits text-amber-400">UID: {req.uid}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              req.status === 'approved' ? 'bg-green-500/20 text-green-300' : req.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {req.status === 'approved' ? 'موثق رسمياً' : req.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                            </span>
                          </div>
                          <p className="text-xs text-purple-300 mt-1">
                            المدة: <strong className="text-white">{req.monthsCount} شهر</strong> • الرسوم: <strong className="text-amber-400 font-digits">{req.priceCoins?.toLocaleString()} كوينز</strong> • هاتف التحويل: {req.paymentPhone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.receiptImageUrl && (
                          <button
                            onClick={() => setZoomedVerificationReceiptUrl(req.receiptImageUrl!)}
                            className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>معاينة الإيصال</span>
                          </button>
                        )}

                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                livoStore.reviewVerificationRequest(req.id, 'approved', 'livo.admin@gmail.com');
                                showToast(`تم توثيق حساب ${req.displayName} بالعلامة الزرقاء بنجاح ✓`);
                              }}
                              className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>موافقة وتوثيق</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectVerificationId(req.id);
                              }}
                              className="bg-red-900/60 hover:bg-red-800 text-red-200 text-xs px-3 py-1.5 rounded-xl"
                            >
                              رفض
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

          {/* SECTION: WITHDRAWALS */}
          {activeSection === 'withdrawals' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">طلبات سحب الأرباح والتحويل النقدي</h2>
                <p className="text-xs text-purple-300">
                  مراجعة طلبات تحويل الكوينز إلى نقد عبر فودافون كاش أو إنستاباي (عند الرفض يسترجع المستخدم كوينزاته تلقائياً)
                </p>
              </div>

              {withdrawals.length === 0 ? (
                <div className="bg-[#170b2c] p-8 rounded-2xl border border-purple-800/40 text-center text-purple-400 text-xs">
                  لا توجد طلبات سحب حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">طلب سحب #{req.id}</h4>
                          <span className="text-xs font-digits text-amber-400">UID: {req.uid}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            req.status === 'approved' ? 'bg-green-500/20 text-green-300' : req.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {req.status === 'approved' ? 'تم الصرف والتحويل' : req.status === 'pending' ? 'قيد المراجعة' : 'مرفوض وتم استرجاع الكوينز'}
                          </span>
                        </div>
                        <p className="text-xs text-purple-200 mt-1">
                          المبلغ: <strong className="text-emerald-400 font-digits">{req.netPayoutEGP.toFixed(2)} ج.م</strong> مقابل ({req.totalCoins.toLocaleString()} كوينز)
                        </p>
                        <p className="text-[11px] text-purple-300 mt-0.5">
                          الوسيلة: {req.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : req.paymentMethod === 'instapay' ? 'InstaPay' : 'تحويل بنكي'} • التفاصيل: {req.paymentDetails}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                livoStore.reviewWithdrawalRequest(req.id, 'approved', undefined, 'livo.admin@gmail.com');
                                showToast(`تمت الموافقة على طلب سحب ${req.netPayoutEGP} ج.م بنجاح ✓`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>اعتماد التحويل</span>
                            </button>
                            <button
                              onClick={() => setRejectWithdrawalId(req.id)}
                              className="bg-red-900/60 hover:bg-red-800 text-red-200 text-xs px-3 py-1.5 rounded-xl"
                            >
                              رفض وإرجاع الكوينز
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

          {/* SECTION: STORE & GIFTS CRUD */}
          {activeSection === 'store_items' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">المتجر وعناصر الإطارات والدخلات والهدايا</h2>
                  <p className="text-xs text-purple-300">
                    العناصر المتاحة للمستخدمين للشراء بالكوينز في المتجر والغرف مع إمكانية إضافة هدايا وإدارتها لحظياً
                  </p>
                </div>
                <button
                  onClick={() => setShowAddGiftModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة هدية جديدة للمتجر</span>
                </button>
              </div>

              {/* Gifts Grid */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span>هدايا الغرف والمحادثات ({giftsList.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {giftsList.map((gift) => (
                    <div
                      key={gift.id}
                      className="bg-[#170b2c] p-3 rounded-2xl border border-purple-800/40 flex flex-col items-center text-center justify-between relative group"
                    >
                      <button
                        onClick={() => handleDeleteGift(gift.id)}
                        className="absolute top-2 left-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-300"
                        title="حذف الهدية"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-4xl filter drop-shadow my-1">{gift.icon}</span>
                      <h4 className="font-bold text-xs text-white mt-1">{gift.name}</h4>
                      <span className="text-xs font-digits font-bold text-amber-300 mt-0.5">
                        {gift.priceCoins.toLocaleString()} كوينز
                      </span>
                      <span className="text-[9px] text-purple-400 mt-0.5">
                        تأثير: {gift.animationType || 'قياسي'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Items (Frames & Entrances) */}
              <div className="space-y-2 pt-4 border-t border-purple-800/50">
                <h3 className="font-bold text-sm text-yellow-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>إطارات ودخلات المتجر الحصرية ({storeItemsList.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {storeItemsList.map((item) => (
                    <div key={item.id} className="bg-[#170b2c] p-3 rounded-2xl border border-purple-800/40 flex items-center gap-3">
                      <span className="text-3xl filter drop-shadow">{item.image}</span>
                      <div>
                        <h4 className="font-bold text-xs text-white">{item.name}</h4>
                        <span className="text-[10px] text-purple-300 block">{item.description}</span>
                        <span className="text-xs font-digits font-bold text-amber-300">{item.priceCoins.toLocaleString()} كوينز</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: OFFICIAL ROOM & BROADCASTS */}
          {activeSection === 'official_room' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-lg font-black text-white">الغرفة الرسمية LIVO Admin والإعلانات</h2>
                <p className="text-xs text-purple-300">
                  تظهر في صدارة قائمة الرسائل والغرف لجميع المستخدمين ولا يمكن حذفها
                </p>
              </div>

              <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
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
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="open">مفتوحة ومتاحة لجميع المستخدمين (Open)</option>
                    <option value="closed">مغلقة مؤقتاً (Closed)</option>
                    <option value="locked_by_admin">مقفلة بكلمة مرور إدارية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    نص الإعلان الرسمي المعروض في الغرفة:
                  </label>
                  <textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={3}
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    livoStore.setOfficialRoomStatus(officialRoomStatus, announcementText);
                    showToast('تم تحديث إعلان الغرفة الرسمية والمزامنة فوراً ✓');
                  }}
                  className="w-full py-2.5 bg-[#FFE600] text-black font-black text-xs rounded-xl shadow-md hover:bg-yellow-400"
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
                <h2 className="text-lg font-black text-white">إدارة الحظر والعقوبات</h2>
                <p className="text-xs text-purple-300">
                  حظر الحساب أو الجهاز مع الاحتفاظ بالسجل وعدم حذف البيانات المالية
                </p>
              </div>

              <form onSubmit={handleExecuteBan} className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1">ابحث عن المستخدم:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={banSearchUid}
                        onChange={(e) => setBanSearchUid(e.target.value)}
                        placeholder="أدخل معرّف UID"
                        className="flex-1 bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const found = users.find(u => u.uid === banSearchUid.trim());
                          if (found) setSelectedUserForBan(found);
                          else showToast('المستخدم غير موجود');
                        }}
                        className="bg-purple-900 px-3 py-1.5 text-xs rounded-xl font-bold"
                      >
                        تحديد
                      </button>
                    </div>
                  </div>

                  {selectedUserForBan && (
                    <div className="flex items-center gap-2 bg-[#120824] p-2 rounded-xl border border-purple-800/40">
                      <img src={selectedUserForBan.avatar} alt="" className="w-8 h-8 rounded-full" />
                      <span className="text-xs font-bold text-white">{selectedUserForBan.displayName} (UID: {selectedUserForBan.uid})</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1">نوع الحظر:</label>
                    <select
                      value={banType}
                      onChange={(e) => setBanType(e.target.value as any)}
                      className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="account">حظر الحساب فقط</option>
                      <option value="device">حظر الجهاز فقط</option>
                      <option value="both">حظر الحساب والجهاز معاً</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1">المدة:</label>
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value as any)}
                      className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="temporary">مؤقت (7 أيام)</option>
                      <option value="permanent">دائم نهائي</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">سبب الحظر:</label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="مخالفة معايير المجتمع، سب وقذف، محاولة احتيال"
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white"
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
                <h3 className="font-bold text-xs text-white">قائمة المحظورين وسجل العقوبات</h3>
                {bans.length === 0 ? (
                  <div className="bg-[#170b2c] p-4 rounded-xl border border-purple-800/40 text-center text-xs text-purple-400">
                    لا يوجد مستخدمون محظورون حالياً
                  </div>
                ) : (
                  bans.map(b => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        b.status === 'active' ? 'bg-red-950/30 border-red-800/50' : 'bg-[#170b2c] border-purple-800/40 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{b.username}</span>
                          <span className="font-digits text-xs text-amber-300">UID: {b.uid}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            b.status === 'active' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                          }`}>
                            {b.status === 'active' ? 'حظر نشط' : 'تم رفع الحظر'}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-300 mt-1">
                          نوع: {b.banType} • المدة: {b.duration} • السبب: {b.reason}
                        </p>
                      </div>

                      {b.status === 'active' && (
                        <button
                          onClick={() => setUnbanModalRecord(b)}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl"
                        >
                          فك الحظر
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SECTION 10: SUPERVISORS */}
          {activeSection === 'supervisors' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-lg font-black text-white">إدارة صلاحيات المشرفين</h2>
                <p className="text-xs text-purple-300">
                  صلاحيات يحددها المالك حصراً • المشرف لا يمتلك صلاحية تغيير المالك
                </p>
              </div>

              <div className="bg-[#170b2c] p-4 rounded-2xl border border-purple-800/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newSupervisorUid}
                    onChange={(e) => setNewSupervisorUid(e.target.value)}
                    placeholder="UID المشرف (مثال: 10245)"
                    className="bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <input
                    type="email"
                    value={newSupervisorEmail}
                    onChange={(e) => setNewSupervisorEmail(e.target.value)}
                    placeholder="البريد الإلكتروني للمشرف"
                    className="bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!newSupervisorUid.trim()) return;
                    setSupervisors(prev => [
                      ...prev,
                      {
                        uid: newSupervisorUid.trim(),
                        name: `مشرف ${newSupervisorUid}`,
                        email: newSupervisorEmail || 'supervisor@livo.live',
                        permissions: ['recharges', 'moderation']
                      }
                    ]);
                    setNewSupervisorUid('');
                    setNewSupervisorEmail('');
                    showToast('تمت إضافة المشرف بنجاح');
                  }}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl"
                >
                  إضافة مشرف جديد
                </button>
              </div>

              <div className="space-y-2">
                {supervisors.map(s => (
                  <div key={s.uid} className="bg-[#170b2c] p-3 rounded-xl border border-purple-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-white block">{s.name} (UID: {s.uid})</span>
                      <span className="text-[10px] text-purple-400">{s.email} • الصلاحيات: {s.permissions.join(', ')}</span>
                    </div>
                    <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded font-bold">نشط</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 11: FINANCIAL AUDIT LOGS */}
          {activeSection === 'financial_logs' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">السجل المالي الدائم</h2>
                <p className="text-xs text-purple-300">
                  سجل غير قابل للتعديل أو الحذف لجميع عمليات الشحن والخصم والإدارة
                </p>
              </div>

              {audits.length === 0 ? (
                <div className="bg-[#170b2c] p-6 rounded-2xl border border-purple-800/40 text-center text-xs text-purple-400">
                  لا توجد عمليات مسجلة حتى الآن
                </div>
              ) : (
                <div className="space-y-2">
                  {audits.map(item => (
                    <div
                      key={item.id}
                      className="bg-[#170b2c] p-3 rounded-xl border border-purple-800/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.username}</span>
                          <span className="font-digits text-amber-300">UID: {item.uid}</span>
                          <span className={`font-digits font-bold px-1.5 py-0.5 rounded ${
                            item.coinsChange > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {item.coinsChange > 0 ? `+${item.coinsChange.toLocaleString()}` : item.coinsChange.toLocaleString()} كوينز
                          </span>
                        </div>
                        <p className="text-purple-300 text-[11px] mt-0.5">
                          {item.reason} • المنفذ: {item.performedBy}
                        </p>
                      </div>

                      <div className="text-left font-digits text-[10px] text-purple-400">
                        <span>الرصيد: {item.balanceBefore.toLocaleString()} ➔ {item.balanceAfter.toLocaleString()}</span>
                        <span className="block">{new Date(item.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL: ZOOM RECEIPT */}
      {zoomedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-[#170b2c] rounded-2xl border border-purple-800 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-purple-800/50 flex items-center justify-between">
              <span className="text-xs font-bold text-white">معاينة إيصال السداد بدقة عالية</span>
              <button
                onClick={() => setZoomedReceiptUrl(null)}
                className="text-purple-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[80vh]">
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-purple-800 p-4 space-y-3 text-white">
            <h3 className="font-bold text-sm text-red-400">سبب رفض طلب الشحن:</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثال: الإيصال غير مطابق، المبلغ لم يصل للحساب..."
              rows={3}
              className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none"
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
                className="px-4 py-2 bg-purple-900 text-purple-200 text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM COIN ADJUSTMENT */}
      {showCoinConfirmModal && selectedUserForCoins && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-amber-500/60 p-5 space-y-3 text-white text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">تأكيد تعديل رصيد المستخدم</h3>
            <p className="text-xs text-purple-200 leading-relaxed">
              هل أنت متأكد من تنفيذ عملية ({coinActionType === 'add' ? 'إضافة' : coinActionType === 'deduct' ? 'خصم' : 'ضبط'}) كمية <strong className="font-digits text-amber-300">{parseInt(coinAmountInput, 10).toLocaleString()}</strong> كوينز للمستخدم <strong className="text-white">{selectedUserForCoins.displayName}</strong> (UID: {selectedUserForCoins.uid})؟
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExecuteCoinAdjustment}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs rounded-xl"
              >
                نعم، تنفيذ الآن
              </button>
              <button
                onClick={() => setShowCoinConfirmModal(false)}
                className="px-4 py-2.5 bg-purple-900 text-white text-xs rounded-xl"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNBAN REASON */}
      {unbanModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-green-500/60 p-4 space-y-3 text-white">
            <h3 className="font-bold text-sm text-green-400">فك الحظر عن المستخدم:</h3>
            <input
              type="text"
              value={unbanReasonText}
              onChange={(e) => setUnbanReasonText(e.target.value)}
              placeholder="سبب فك الحظر (مثال: انتهاء فترة العقوبة، قبول التماس)"
              className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2 text-xs text-white"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteUnban}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl"
              >
                تأكيد فك الحظر
              </button>
              <button
                onClick={() => setUnbanModalRecord(null)}
                className="px-4 py-2 bg-purple-900 text-white text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ADVERTISEMENT */}
      {showCreateAdModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-lg rounded-2xl border border-amber-500/60 p-5 space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-purple-800/50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">إنشاء ونشر إعلان جديد في LIVO</h3>
              </div>
              <button
                onClick={() => setShowCreateAdModal(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">عنوان الإعلان:</label>
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="مثال: خصم 50% على باقة الكوينز الذهبية"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">وصف الإعلان:</label>
                <textarea
                  value={newAdDescription}
                  onChange={(e) => setNewAdDescription(e.target.value)}
                  placeholder="اكتب تفاصيل العرض الترويجي..."
                  rows={2}
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">رابط صورة البانر (URL):</label>
                <input
                  type="url"
                  value={newAdImageUrl}
                  onChange={(e) => setNewAdImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white font-digits outline-none focus:border-amber-400"
                  required
                />
                {/* Quick Presets */}
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setNewAdImageUrl('https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80')}
                    className="text-[10px] bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded text-purple-300"
                  >
                    نموذج ألعاب وبث
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAdImageUrl('https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80')}
                    className="text-[10px] bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded text-purple-300"
                  >
                    نموذج شحن وجوائز
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">رابط التوجيه (اختياري):</label>
                <input
                  type="text"
                  value={newAdTargetUrl}
                  onChange={(e) => setNewAdTargetUrl(e.target.value)}
                  placeholder="https://livo.live/offers أو اتركها فارغة"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white font-digits outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">مكان العرض:</label>
                  <select
                    value={newAdPlacement}
                    onChange={(e: any) => setNewAdPlacement(e.target.value)}
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2 text-xs text-white outline-none"
                  >
                    <option value="banner">بانر رئيسي (Banner)</option>
                    <option value="popup">نافذة منبثقة (Popup)</option>
                    <option value="feed">الخلاصة والساحة (Feed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={newAdEndDate}
                    onChange={(e) => setNewAdEndDate(e.target.value)}
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2 text-xs text-white font-digits outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg"
                >
                  نشر وتفعيل الإعلان
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAdModal(false)}
                  className="px-4 py-2.5 bg-purple-900 text-white text-xs rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-[#170b2c] rounded-2xl border border-purple-800 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-purple-800/50 flex items-center justify-between">
              <span className="text-xs font-bold text-white">معاينة مرفق التذكرة</span>
              <button
                onClick={() => setZoomedTicketImageUrl(null)}
                className="text-purple-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[80vh]">
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-red-500/60 p-4 space-y-3 text-white text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">تأكيد حذف الإعلان</h3>
            <p className="text-xs text-purple-200">
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
                className="px-4 py-2 bg-purple-900 text-white text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PAYMENT METHOD */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-md rounded-2xl border border-amber-500/60 p-5 space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-purple-800/50">
              <h3 className="font-bold text-sm text-white">
                {editPaymentId ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع جديدة'}
              </h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">نوع الوسيلة:</label>
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
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="orange_cash">أورنج كاش (Orange Cash)</option>
                  <option value="etisalat_cash">اتصالات كاش (Etisalat Cash)</option>
                  <option value="we_pay">محفظة وي باي (WE Pay)</option>
                  <option value="bank_account">حساب بنكي رسمي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">اسم وسيلة الدفع للعرض:</label>
                <input
                  type="text"
                  value={paymentTitle}
                  onChange={(e) => setPaymentTitle(e.target.value)}
                  placeholder="مثال: فودافون كاش - الحساب المعتمد"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">رقم المحفظة أو المعرف:</label>
                <input
                  type="text"
                  value={paymentAccountNum}
                  onChange={(e) => setPaymentAccountNum(e.target.value)}
                  placeholder="010XXXXXXXX أو username@instapay"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white font-digits outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">اسم صاحب الحساب (اختياري):</label>
                <input
                  type="text"
                  value={paymentHolderName}
                  onChange={(e) => setPaymentHolderName(e.target.value)}
                  placeholder="اسم الشخص أو اسم الشركة"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">تعليمات التحويل للأعضاء (اختياري):</label>
                <textarea
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="يرجى تحويل المبلغ وتصوير إيصال التحويل كاملاً..."
                  rows={2}
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
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
                <label htmlFor="payDefault" className="text-xs text-purple-200 cursor-pointer">
                  تعيين كوسيلة دفع أساسية ومفضلة
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow"
                >
                  حفظ وتفعيل وسيلة الدفع
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2.5 bg-purple-900 text-white text-xs rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-pink-500/60 p-5 space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-purple-800/50">
              <h3 className="font-bold text-sm text-white">توليد كود شحن فوري (Voucher)</h3>
              <button
                onClick={() => setShowAddCodeModal(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRechargeCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">كود القسيمة (حروف وأرقام):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCodeInput}
                    onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
                    placeholder="مثال: LIVO-VIP-500"
                    className="flex-1 bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white font-mono uppercase outline-none focus:border-amber-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewCodeInput(`LIVO-${Math.floor(1000 + Math.random() * 9000)}-GOLD`)}
                    className="bg-purple-900 text-purple-200 text-xs px-2.5 rounded-xl font-bold"
                  >
                    عشوائي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">عدد الكوينز الممنوحة:</label>
                <input
                  type="number"
                  value={newCodeCoinsInput}
                  onChange={(e) => setNewCodeCoinsInput(e.target.value)}
                  placeholder="مثال: 500 أو 1000 أو 5000"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white font-digits outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">الحد الأقصى لعدد المستفيدين:</label>
                <input
                  type="number"
                  value={newCodeMaxUsesInput}
                  onChange={(e) => setNewCodeMaxUsesInput(e.target.value)}
                  placeholder="100"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white font-digits outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow"
                >
                  إنشاء وتفعيل الكود
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCodeModal(false)}
                  className="px-4 py-2.5 bg-purple-900 text-white text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STORE GIFT */}
      {showAddGiftModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-amber-500/60 p-5 space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-purple-800/50">
              <h3 className="font-bold text-sm text-white">إضافة هدية جديدة للمتجر</h3>
              <button
                onClick={() => setShowAddGiftModal(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGift} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">اسم الهدية:</label>
                <input
                  type="text"
                  value={newGiftName}
                  onChange={(e) => setNewGiftName(e.target.value)}
                  placeholder="مثال: تاج ذهبي، قصر ملكي، أسد ذهبي"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">أيقونة الهدية (إيموجي أو رمز):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGiftIcon}
                    onChange={(e) => setNewGiftIcon(e.target.value)}
                    placeholder="👑 أو 🦁 أو 🏎️"
                    className="flex-1 bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-lg text-center outline-none focus:border-amber-400"
                    required
                  />
                  <div className="flex gap-1">
                    {['👑', '🦁', '🏎️', '🏰', '💎', '🚀'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewGiftIcon(em)}
                        className="w-8 h-8 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-sm flex items-center justify-center"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">سعر الهدية بالكوينز:</label>
                <input
                  type="number"
                  value={newGiftPrice}
                  onChange={(e) => setNewGiftPrice(e.target.value)}
                  placeholder="مثال: 500"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white font-digits outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">نوع التأثير في الغرفة:</label>
                <select
                  value={newGiftAnimation}
                  onChange={(e: any) => setNewGiftAnimation(e.target.value)}
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="standard">قياسي (Standard)</option>
                  <option value="lion">أسد ذهبي يزأر (Lion Roar)</option>
                  <option value="car">سيارة رياضية فاخرة (Supercar)</option>
                  <option value="dragon">تنين أسطوري (Dragon Flight)</option>
                  <option value="fireworks">ألعاب نارية متفجرة (Fireworks)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow"
                >
                  إضافة للمتجر
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddGiftModal(false)}
                  className="px-4 py-2.5 bg-purple-900 text-white text-xs rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-[#170b2c] rounded-2xl border border-purple-800 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-purple-800/50 flex items-center justify-between">
              <span className="text-xs font-bold text-white">إيصال تحويل التوثيق الأزرق</span>
              <button
                onClick={() => setZoomedVerificationReceiptUrl(null)}
                className="text-purple-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[80vh]">
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-red-500/60 p-4 space-y-3 text-white">
            <h3 className="font-bold text-sm text-red-400">رفض طلب التوثيق الأزرق</h3>
            <p className="text-xs text-purple-200">
              يرجى توضيح سبب الرفض لإشعار المستخدم عبر الرسائل المباشرة:
            </p>
            <input
              type="text"
              value={rejectVerificationReason}
              onChange={(e) => setRejectVerificationReason(e.target.value)}
              placeholder="مثال: الإيصال غير واضح أو المبلغ المحول غير مطابق"
              className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
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
                className="px-4 py-2 bg-purple-900 text-white text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT WITHDRAWAL */}
      {rejectWithdrawalId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-red-500/60 p-4 space-y-3 text-white">
            <h3 className="font-bold text-sm text-red-400">رفض طلب السحب واسترجاع الكوينز</h3>
            <p className="text-xs text-purple-200">
              سيتم إرجاع كمية الكوينز إلى رصيد حساب المستخدم تلقائياً وتحديث حالة الطلب إلى مرفوض.
            </p>
            <input
              type="text"
              value={rejectWithdrawalReason}
              onChange={(e) => setRejectWithdrawalReason(e.target.value)}
              placeholder="سبب الرفض (مثال: رقم المحفظة غير مسجل باسم صاحب الحساب)"
              className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
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
                className="px-4 py-2 bg-purple-900 text-white text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
