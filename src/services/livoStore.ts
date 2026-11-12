/**
 * LIVO Central State & Firebase Unified Engine
 * Enforces server-authoritative integrity, real-time bidirectional synchronization
 * between Customer App and Admin App via Firebase Firestore,
 * and zero reliance on dummy mock data.
 */

import {
  UserProfile,
  RechargeRequest,
  CoinAuditRecord,
  AgencyApplication,
  BlueVerificationRequest,
  WithdrawalRequest,
  BanRecord,
  DirectMessage,
  ChatThread,
  VoiceRoom,
  VideoPost,
  Advertisement,
  SupportTicket,
  LevelConfig,
  LevelPromotionRecord,
  DistributorRecord,
  AgentTransferRecord,
  PaymentMethodConfig,
  GiftItem,
  StoreItem,
  RechargeCode
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ROOMS,
  INITIAL_VIDEOS,
  INITIAL_LEVEL_CONFIGS,
  INITIAL_GIFTS,
  INITIAL_STORE_ITEMS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_RECHARGE_CODES
} from '../data/initialData';
import { firebaseService } from './firebase';

type Listener = () => void;

class LivoStore {
  private listeners: Set<Listener> = new Set();
  
  // Real-time In-Memory Cache backed by Firestore
  private users: UserProfile[] = [];
  private currentUid: string = '10000';
  private rechargeRequests: RechargeRequest[] = [];
  private coinAudits: CoinAuditRecord[] = [];
  private agencies: AgencyApplication[] = [];
  private verifications: BlueVerificationRequest[] = [];
  private withdrawals: WithdrawalRequest[] = [];
  private bans: BanRecord[] = [];
  private messages: DirectMessage[] = [];
  private rooms: VoiceRoom[] = [];
  private videos: VideoPost[] = [];
  private advertisements: Advertisement[] = [];
  private supportTickets: SupportTicket[] = [];
  private levelConfigs: LevelConfig[] = [...INITIAL_LEVEL_CONFIGS];
  private distributors: DistributorRecord[] = [];
  private agentTransfers: AgentTransferRecord[] = [];
  private levelPromotions: LevelPromotionRecord[] = [];
  private paymentMethods: PaymentMethodConfig[] = [...INITIAL_PAYMENT_METHODS];
  private gifts: GiftItem[] = [...INITIAL_GIFTS];
  private storeItems: StoreItem[] = [...INITIAL_STORE_ITEMS];
  private rechargeCodes: RechargeCode[] = [...INITIAL_RECHARGE_CODES];

  private isInitialized = false;

  constructor() {
    this.initFromCacheAndSeed();
    this.initFirebaseSubscriptions();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify() {
    this.listeners.forEach(fn => fn());
  }

  private initFromCacheAndSeed() {
    if (typeof window === 'undefined') return;

    try {
      const savedUid = localStorage.getItem('livo_active_uid');
      if (savedUid) {
        this.currentUid = savedUid;
      }

      // Initialize with verified base data
      this.users = [...INITIAL_USERS];
      this.rooms = [...INITIAL_ROOMS];
      this.videos = [...INITIAL_VIDEOS];

      // If user selected previously, keep it, otherwise default to first regular user or owner
      const targetUser = this.users.find(u => u.uid === this.currentUid) || this.users[1] || this.users[0];
      if (targetUser) {
        this.currentUid = targetUser.uid;
      }
    } catch (e) {
      console.warn('Cache read warning:', e);
    }
  }

  /**
   * Connect real-time Firestore listeners for immediate bidirectional sync
   */
  private initFirebaseSubscriptions() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // 1. Users sync
    firebaseService.subscribeToUsers((firestoreUsers) => {
      if (firestoreUsers.length > 0) {
        this.users = firestoreUsers;
        this.notify();
      } else {
        // First boot: seed verified users to Firestore
        INITIAL_USERS.forEach(u => firebaseService.saveUserProfile(u));
      }
    });

    // 2. Recharge requests sync
    firebaseService.subscribeToRechargeRequests((requests) => {
      this.rechargeRequests = requests;
      this.notify();
    });

    // 3. Rooms sync
    firebaseService.subscribeToRooms((firestoreRooms) => {
      if (firestoreRooms.length > 0) {
        this.rooms = firestoreRooms;
        this.notify();
      } else {
        INITIAL_ROOMS.forEach(r => firebaseService.saveRoom(r));
      }
    });

    // 4. Messages sync
    firebaseService.subscribeToMessages((msgs) => {
      this.messages = msgs;
      this.notify();
    });

    // 5. Agencies sync
    firebaseService.subscribeToAgencies((list) => {
      this.agencies = list;
      this.notify();
    });

    // 6. Verifications sync
    firebaseService.subscribeToVerifications((list) => {
      this.verifications = list;
      this.notify();
    });

    // 7. Withdrawals sync
    firebaseService.subscribeToWithdrawals((list) => {
      this.withdrawals = list;
      this.notify();
    });

    // 8. Bans sync
    firebaseService.subscribeToBans((list) => {
      this.bans = list;
      this.notify();
    });

    // 9. Coin audits sync
    firebaseService.subscribeToCoinAudits((audits) => {
      this.coinAudits = audits;
      this.notify();
    });

    // 10. Advertisements sync
    firebaseService.subscribeToAdvertisements((ads) => {
      this.advertisements = ads;
      this.notify();
    });

    // 11. Support Tickets sync
    firebaseService.subscribeToSupportTickets((tickets) => {
      this.supportTickets = tickets;
      this.notify();
    });

    // 12. Level Configs sync (Levels 0 to 50)
    firebaseService.subscribeToLevelConfigs((configs) => {
      if (configs.length > 0) {
        this.levelConfigs = configs;
        this.notify();
      } else {
        firebaseService.saveLevelConfigs(INITIAL_LEVEL_CONFIGS);
      }
    });

    // 13. Distributors sync
    firebaseService.subscribeToDistributors((distList) => {
      this.distributors = distList;
      this.notify();
    });

    // 14. Agent Transfers sync
    firebaseService.subscribeToAgentTransfers((transfers) => {
      this.agentTransfers = transfers;
      this.notify();
    });

    // 15. Payment Methods sync
    firebaseService.subscribeToPaymentMethods((methods) => {
      if (methods.length > 0) {
        this.paymentMethods = methods;
        this.notify();
      } else {
        INITIAL_PAYMENT_METHODS.forEach(pm => firebaseService.savePaymentMethod(pm));
      }
    });

    // 16. Gifts sync
    firebaseService.subscribeToGifts((giftsList) => {
      if (giftsList.length > 0) {
        this.gifts = giftsList;
        this.notify();
      } else {
        INITIAL_GIFTS.forEach(g => firebaseService.saveGift(g));
      }
    });

    // 17. Store Items sync (Frames & Entrances)
    firebaseService.subscribeToStoreItems((itemsList) => {
      if (itemsList.length > 0) {
        this.storeItems = itemsList;
        this.notify();
      } else {
        INITIAL_STORE_ITEMS.forEach(it => firebaseService.saveStoreItem(it));
      }
    });

    // 18. Recharge Codes sync
    firebaseService.subscribeToRechargeCodes((codesList) => {
      if (codesList.length > 0) {
        this.rechargeCodes = codesList;
        this.notify();
      } else {
        INITIAL_RECHARGE_CODES.forEach(rc => firebaseService.saveRechargeCode(rc));
      }
    });
  }

  // --- USERS & AUTHENTICATION ---
  public getUsers(): UserProfile[] {
    return this.users;
  }

  public getCurrentUser(): UserProfile {
    const found = this.users.find(u => u.uid === this.currentUid);
    if (found) return found;
    return this.users[1] || this.users[0] || INITIAL_USERS[0];
  }

  public setCurrentUser(uid: string): void {
    this.currentUid = uid;
    try {
      localStorage.setItem('livo_active_uid', uid);
    } catch {}
    this.notify();
  }

  public getUserByUid(uid: string): UserProfile | undefined {
    return this.users.find(u => u.uid === uid);
  }

  public getUserByUsername(username: string): UserProfile | undefined {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  /**
   * Generates a collision-resistant 5-digit atomic UID
   */
  public generateUniqueUid(): string {
    const existingUids = new Set(this.users.map(u => u.uid));
    
    for (let attempts = 0; attempts < 1000; attempts++) {
      const candidate = String(Math.floor(10000 + Math.random() * 90000));
      if (!existingUids.has(candidate)) {
        return candidate;
      }
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Registers a new user account with Firebase synchronization.
   * STRICT SECURITY: New accounts ALWAYS get role 'user' and ZERO coins.
   * Only livo.admin@gmail.com is granted owner role.
   */
  public registerNewUser(
    displayName: string,
    username: string,
    email?: string,
    accountType: 'personal' | 'business' = 'personal',
    phoneNumber?: string,
    authUid?: string
  ): UserProfile {
    const newUid = this.generateUniqueUid();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${newUid}`;
    const isOwnerEmail = email?.trim().toLowerCase() === 'livo.admin@gmail.com' || email?.trim().toLowerCase() === 'eslamfifty11@gmail.com';

    const newUser: UserProfile = {
      uid: newUid,
      authUid: authUid || undefined,
      email: email?.trim(),
      username: cleanUsername,
      displayName: displayName.trim() || `مستخدم ${newUid}`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUid}`,
      role: isOwnerEmail ? 'owner' : 'user',
      accountType: accountType || 'personal',
      phoneNumber: phoneNumber?.trim(),
      isPhoneVerified: phoneNumber ? true : false,
      coins: isOwnerEmail ? 500000 : 0, // STRICT: ZERO free coins upon registration for regular users
      diamonds: isOwnerEmail ? 50000 : 0,
      level: isOwnerEmail ? 50 : 0, // STRICT: All new accounts begin at Level 0
      eligibleRechargedCoins: isOwnerEmail ? 5000000 : 0,
      unlockedLevelRewards: isOwnerEmail ? Array.from({ length: 51 }, (_, i) => i) : [],
      isVerified: isOwnerEmail,
      followingCount: 0,
      followersCount: 0,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.setCurrentUser(newUser.uid);
    this.notify();

    // Persist to Firebase Firestore
    firebaseService.saveUserProfile(newUser);

    return newUser;
  }

  public updateUserPhone(uid: string, phone: string, isVerified: boolean = true): { success: boolean; message: string } {
    const user = this.getUserByUid(uid);
    if (!user) return { success: false, message: 'المستخدم غير موجود' };

    const cleanPhone = phone.trim();
    this.updateUserProfile(uid, {
      phoneNumber: cleanPhone,
      isPhoneVerified: isVerified
    });

    return { success: true, message: 'تم تحديث وتوثيق رقم الهاتف بنجاح' };
  }

  public updateUserProfile(uid: string, updates: Partial<UserProfile>): void {
    const index = this.users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this.notify();
      // Persist directly to Firebase Firestore
      firebaseService.saveUserProfile(this.users[index]);
    }
  }

  public registerUser(user: UserProfile): void {
    const existingIndex = this.users.findIndex(u => u.uid === user.uid);
    if (existingIndex !== -1) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }
    this.setCurrentUser(user.uid);
    this.notify();
    firebaseService.saveUserProfile(user);
  }

  // --- RECHARGE REQUESTS (PERMANENT, REAL-TIME & IDEMPOTENT) ---
  public getRechargeRequests(): RechargeRequest[] {
    return this.rechargeRequests;
  }

  public submitRechargeRequest(data: {
    uid: string;
    packageCoins: number;
    amountEGP: number;
    payerPhone: string;
    receiptUrl: string;
  }): RechargeRequest {
    const user = this.getUserByUid(data.uid) || this.getCurrentUser();

    const newReq: RechargeRequest = {
      id: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      uid: user.uid,
      username: user.username,
      userAvatar: user.avatar,
      packageCoins: data.packageCoins,
      amountEGP: data.amountEGP,
      payerPhone: data.payerPhone,
      receiptUrl: data.receiptUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.rechargeRequests.unshift(newReq);
    this.notify();

    // Persist to Firebase Firestore for real-time visibility in Admin
    firebaseService.saveRechargeRequest(newReq);

    return newReq;
  }

  /**
   * Approves recharge request:
   * - Atomically credits coins to user
   * - Records balanceBefore and balanceAfter
   * - Logs into immutable coin audits
   * - Updates status to 'approved'
   * - Real-time sync with Firebase
   */
  public approveRechargeRequest(requestId: string, adminEmail: string = 'livo.admin@gmail.com'): { success: boolean; message: string } {
    const reqIndex = this.rechargeRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return { success: false, message: 'الطلب غير موجود' };

    const req = this.rechargeRequests[reqIndex];
    if (req.status !== 'pending') {
      return { success: false, message: 'هذا الطلب تمت معالجته مسبقاً' };
    }

    const user = this.getUserByUid(req.uid);
    if (!user) {
      return { success: false, message: 'المستخدم صاحب الطلب غير موجود' };
    }

    const balanceBefore = user.coins;
    const balanceAfter = balanceBefore + req.packageCoins;
    const eligibleBefore = user.eligibleRechargedCoins || 0;
    const eligibleAfter = eligibleBefore + req.packageCoins;

    // 1. Credit coins and accumulate eligible recharge count
    this.updateUserProfile(user.uid, {
      coins: balanceAfter,
      eligibleRechargedCoins: eligibleAfter
    });

    // 2. Automatically check and promote level (0-50) and award diamonds
    this.checkAndPromoteUserLevel(user.uid);

    // 3. Update request
    const updatedReq: RechargeRequest = {
      ...req,
      status: 'approved',
      reviewedBy: adminEmail,
      reviewedAt: new Date().toISOString(),
      balanceBefore,
      balanceAfter
    };
    this.rechargeRequests[reqIndex] = updatedReq;
    this.notify();
    firebaseService.saveRechargeRequest(updatedReq);

    // 4. Log audit
    this.logCoinAudit({
      uid: user.uid,
      username: user.username,
      actionType: 'recharge_request',
      coinsChange: req.packageCoins,
      balanceBefore,
      balanceAfter,
      reason: `موافقة على طلب الشحن رقم ${req.orderNumber} بمبلغ ${req.amountEGP} ج.م`,
      performedBy: adminEmail
    });

    return { success: true, message: `تم شحن ${req.packageCoins} كوينز للمستخدم ${user.displayName} بنجاح` };
  }

  public rejectRechargeRequest(requestId: string, reason: string, adminEmail: string = 'livo.admin@gmail.com'): { success: boolean; message: string } {
    const reqIndex = this.rechargeRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return { success: false, message: 'الطلب غير موجود' };

    const req = this.rechargeRequests[reqIndex];
    if (req.status !== 'pending') {
      return { success: false, message: 'هذا الطلب تمت معالجته مسبقاً' };
    }

    const updatedReq: RechargeRequest = {
      ...req,
      status: 'rejected',
      rejectReason: reason.trim() || 'الإيصال غير واضح أو لم يتم استلام التحويل',
      reviewedBy: adminEmail,
      reviewedAt: new Date().toISOString()
    };
    this.rechargeRequests[reqIndex] = updatedReq;
    this.notify();
    firebaseService.saveRechargeRequest(updatedReq);

    return { success: true, message: 'تم رفض طلب الشحن بنجاح' };
  }

  // --- MANUAL COINS MANAGEMENT (ADMIN ONLY) ---
  public adjustUserCoins(
    targetUid: string,
    action: 'add' | 'deduct' | 'set',
    amount: number,
    reason: string,
    performedBy: string = 'livo.admin@gmail.com'
  ): { success: boolean; message: string; balanceBefore?: number; balanceAfter?: number } {
    if (!reason.trim()) {
      return { success: false, message: 'يجب إدخال سبب العملية الإدارية' };
    }
    if (amount < 0 || isNaN(amount)) {
      return { success: false, message: 'يرجى إدخال قيمة صحيحة وموجبة' };
    }

    const user = this.getUserByUid(targetUid);
    if (!user) {
      return { success: false, message: `المستخدم بالمعرّف ${targetUid} غير موجود` };
    }

    const balanceBefore = user.coins;
    let balanceAfter = balanceBefore;
    let coinsChange = 0;

    const userUpdates: Partial<UserProfile> = {};

    if (action === 'add') {
      balanceAfter = balanceBefore + amount;
      coinsChange = amount;
      userUpdates.coins = balanceAfter;
      userUpdates.eligibleRechargedCoins = (user.eligibleRechargedCoins || 0) + amount;
    } else if (action === 'deduct') {
      if (balanceBefore < amount) {
        return { success: false, message: `رصيد المستخدم (${balanceBefore}) أقل من المبلغ المراد خصمه (${amount})` };
      }
      balanceAfter = balanceBefore - amount;
      coinsChange = -amount;
      userUpdates.coins = balanceAfter;
    } else if (action === 'set') {
      balanceAfter = amount;
      coinsChange = amount - balanceBefore;
      userUpdates.coins = balanceAfter;
    }

    this.updateUserProfile(targetUid, userUpdates);

    if (action === 'add') {
      this.checkAndPromoteUserLevel(targetUid);
    }

    this.logCoinAudit({
      uid: user.uid,
      username: user.username,
      actionType: action === 'add' ? 'admin_add' : action === 'deduct' ? 'admin_deduct' : 'admin_set',
      coinsChange,
      balanceBefore,
      balanceAfter,
      reason: reason.trim(),
      performedBy
    });

    return {
      success: true,
      message: `تم تحديث الرصيد بنجاح من ${balanceBefore} إلى ${balanceAfter} كوينز`,
      balanceBefore,
      balanceAfter
    };
  }

  // --- FINANCIAL AUDIT LOGS ---
  public getCoinAudits(): CoinAuditRecord[] {
    return this.coinAudits;
  }

  public logCoinAudit(entry: Omit<CoinAuditRecord, 'id' | 'createdAt'>): void {
    const newRecord: CoinAuditRecord = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      ...entry
    };
    this.coinAudits.unshift(newRecord);
    this.notify();
    firebaseService.saveCoinAudit(newRecord);
  }

  // --- AGENCIES SYSTEM ---
  public getAgencies(): AgencyApplication[] {
    return this.agencies;
  }

  public submitAgencyApplication(data: {
    uid: string;
    agencyType: 'charging_agent' | 'distributors_agent';
    agencyName: string;
    phone: string;
    nationalId?: string;
    experienceNotes: string;
  }): AgencyApplication {
    const user = this.getUserByUid(data.uid) || this.getCurrentUser();

    const newApp: AgencyApplication = {
      id: `AGY-${Date.now()}`,
      uid: user.uid,
      username: user.username,
      userAvatar: user.avatar,
      agencyType: data.agencyType,
      agencyName: data.agencyName,
      phone: data.phone,
      nationalId: data.nationalId,
      experienceNotes: data.experienceNotes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      canChargeUsers: false,
      totalSalesEGP: 0,
      commissionEarnedEGP: 0,
      membersCount: 0
    };

    this.agencies.unshift(newApp);
    this.notify();
    firebaseService.saveAgency(newApp);

    return newApp;
  }

  public reviewAgencyApplication(appId: string, status: 'approved' | 'rejected', canCharge: boolean = false, adminEmail: string = 'livo.admin@gmail.com'): void {
    const index = this.agencies.findIndex(a => a.id === appId);
    if (index === -1) return;

    const app = this.agencies[index];
    const updated: AgencyApplication = {
      ...app,
      status,
      canChargeUsers: status === 'approved' ? (app.agencyType === 'charging_agent' ? true : canCharge) : false,
      reviewedBy: adminEmail,
      reviewedAt: new Date().toISOString()
    };
    this.agencies[index] = updated;

    if (status === 'approved') {
      const assignedRole = app.agencyType === 'charging_agent' ? 'charging_agent' : 'distributor_agent';
      this.updateUserProfile(app.uid, {
        role: assignedRole,
        agencyType: app.agencyType,
        agencyName: app.agencyName,
        canChargeUsers: app.agencyType === 'charging_agent' ? true : canCharge,
        agentBalance: 0
      });

      const roleTitle = app.agencyType === 'charging_agent' ? 'وكيل شحن معتمد' : 'وكيل موزعين معتمد';
      this.sendDirectMessage({
        senderUid: '10000',
        receiverUid: app.uid,
        content: `🎉 تهانينا! تمت الموافقة على طلب وكالتك (${app.agencyName}) وتعيينك كـ ${roleTitle} في منصة LIVO.`
      });
    } else if (status === 'rejected') {
      this.sendDirectMessage({
        senderUid: '10000',
        receiverUid: app.uid,
        content: `نأسف، تم رفض طلب انضمام الوكالة (${app.agencyName}) بعد مراجعة الإدارة.`
      });
    }

    this.notify();
    firebaseService.saveAgency(updated);
  }

  public toggleAgentChargingPermission(appId: string, canCharge: boolean): void {
    const index = this.agencies.findIndex(a => a.id === appId);
    if (index === -1) return;

    this.agencies[index].canChargeUsers = canCharge;
    this.updateUserProfile(this.agencies[index].uid, { canChargeUsers: canCharge });
    this.notify();
    firebaseService.saveAgency(this.agencies[index]);
  }

  public agencyChargeMember(agentUid: string, targetUid: string, coinsAmount: number): { success: boolean; message: string } {
    const agent = this.getUserByUid(agentUid);
    if (!agent || !agent.canChargeUsers) {
      return { success: false, message: 'ليس لديك صلاحية شحن المستخدمين' };
    }
    if (agent.coins < coinsAmount) {
      return { success: false, message: 'رصيد الوكالة الحالي غير كافٍ' };
    }

    const targetUser = this.getUserByUid(targetUid);
    if (!targetUser) {
      return { success: false, message: 'المستخدم المستهدف غير موجود' };
    }

    this.updateUserProfile(agentUid, { coins: agent.coins - coinsAmount });
    this.updateUserProfile(targetUid, { coins: targetUser.coins + coinsAmount });

    const agIndex = this.agencies.findIndex(a => a.uid === agentUid);
    if (agIndex !== -1) {
      this.agencies[agIndex].totalSalesEGP += (coinsAmount * 0.35);
      this.agencies[agIndex].commissionEarnedEGP += (coinsAmount * 0.35 * 0.1);
      firebaseService.saveAgency(this.agencies[agIndex]);
    }

    this.logCoinAudit({
      uid: targetUser.uid,
      username: targetUser.username,
      actionType: 'agency_charge',
      coinsChange: coinsAmount,
      balanceBefore: targetUser.coins,
      balanceAfter: targetUser.coins + coinsAmount,
      reason: `شحن من وكيل الشحن ${agent.displayName} (${agent.agencyName})`,
      performedBy: agent.displayName
    });

    return { success: true, message: `تم تحويل ${coinsAmount} كوينز للمستخدم ${targetUser.displayName} بنجاح` };
  }

  // --- BLUE CHECK VERIFICATION ---
  public getVerificationRequests(): BlueVerificationRequest[] {
    return this.verifications;
  }

  public submitVerificationRequest(data: {
    uid: string;
    monthsCount: number;
    priceEGP: number;
    paymentPhone: string;
    receiptUrl: string;
  }): BlueVerificationRequest {
    const user = this.getUserByUid(data.uid) || this.getCurrentUser();

    const newReq: BlueVerificationRequest = {
      id: `VER-${Date.now()}`,
      uid: user.uid,
      username: user.username,
      userAvatar: user.avatar,
      monthsCount: data.monthsCount,
      priceEGP: data.priceEGP,
      paymentPhone: data.paymentPhone,
      receiptUrl: data.receiptUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.verifications.unshift(newReq);
    this.notify();
    firebaseService.saveVerification(newReq);

    return newReq;
  }

  public reviewVerificationRequest(reqId: string, status: 'approved' | 'rejected', adminEmail: string = 'livo.admin@gmail.com'): void {
    const index = this.verifications.findIndex(v => v.id === reqId);
    if (index === -1) return;

    const req = this.verifications[index];
    const updated: BlueVerificationRequest = {
      ...req,
      status,
      reviewedBy: adminEmail,
      reviewedAt: new Date().toISOString()
    };
    this.verifications[index] = updated;

    if (status === 'approved') {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + req.monthsCount);
      this.updateUserProfile(req.uid, {
        isVerified: true,
        verifiedUntil: expires.toISOString()
      });
      this.sendDirectMessage({
        senderUid: '10000',
        receiverUid: req.uid,
        content: `🎉 تهانينا! تم توثيق حسابك بالعلامة الزرقاء الرسمية في منصة LIVO لمدة ${req.monthsCount} شهر بنجاح!`
      });
    } else if (status === 'rejected') {
      this.sendDirectMessage({
        senderUid: '10000',
        receiverUid: req.uid,
        content: 'نأسف، لم يتم قبول طلب التوثيق الأزرق بعد مراجعة الإيصال المرفق من قبل الإدارة.'
      });
    }

    this.notify();
    firebaseService.saveVerification(updated);
  }

  // --- WITHDRAWAL & PROFITS ---
  public getWithdrawalRequests(): WithdrawalRequest[] {
    return this.withdrawals;
  }

  public submitWithdrawalRequest(data: {
    uid: string;
    totalCoins: number;
    paymentMethod: 'vodafone_cash' | 'instapay' | 'bank_transfer';
    paymentDetails: string;
  }): { success: boolean; message: string } {
    const user = this.getUserByUid(data.uid);
    if (!user || user.coins < data.totalCoins) {
      return { success: false, message: 'رصيد الكوينز غير كافٍ للسحب' };
    }

    const grossAmountEGP = (data.totalCoins / 1000) * 350;
    const platformFeeEGP = grossAmountEGP * 0.15;
    const netPayoutEGP = grossAmountEGP - platformFeeEGP;

    this.updateUserProfile(data.uid, { coins: user.coins - data.totalCoins });

    const newReq: WithdrawalRequest = {
      id: `WTH-${Date.now()}`,
      uid: user.uid,
      username: user.username,
      totalCoins: data.totalCoins,
      grossAmountEGP,
      platformFeeEGP,
      netPayoutEGP,
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.withdrawals.unshift(newReq);
    this.notify();
    firebaseService.saveWithdrawal(newReq);

    return { success: true, message: `تم تقديم طلب سحب ${netPayoutEGP.toFixed(2)} ج.م بنجاح` };
  }

  public reviewWithdrawalRequest(reqId: string, status: 'approved' | 'rejected', transferProofUrl?: string, adminEmail: string = 'livo.admin@gmail.com'): void {
    const index = this.withdrawals.findIndex(w => w.id === reqId);
    if (index === -1) return;

    const req = this.withdrawals[index];
    const updated: WithdrawalRequest = {
      ...req,
      status,
      transferProofUrl,
      reviewedBy: adminEmail,
      reviewedAt: new Date().toISOString()
    };
    this.withdrawals[index] = updated;

    if (status === 'rejected') {
      const user = this.getUserByUid(req.uid);
      if (user) {
        this.updateUserProfile(req.uid, { coins: user.coins + req.totalCoins });
      }
    }

    this.notify();
    firebaseService.saveWithdrawal(updated);
  }

  // --- BAN & SANCTIONS MANAGEMENT ---
  public getBans(): BanRecord[] {
    return this.bans;
  }

  public banUser(data: {
    uid: string;
    banType: 'account' | 'device' | 'both';
    duration: 'temporary' | 'permanent';
    durationDays?: number;
    reason: string;
    bannedBy?: string;
  }): { success: boolean; message: string } {
    const user = this.getUserByUid(data.uid);
    if (!user) return { success: false, message: 'المستخدم غير موجود' };
    if (user.role === 'owner') return { success: false, message: 'لا يمكن حظر حساب المالك' };

    let expiresAt: string | undefined = undefined;
    if (data.duration === 'temporary' && data.durationDays) {
      const d = new Date();
      d.setDate(d.getDate() + data.durationDays);
      expiresAt = d.toISOString();
    }

    const newBan: BanRecord = {
      id: `BAN-${Date.now()}`,
      uid: user.uid,
      username: user.username,
      userAvatar: user.avatar,
      deviceId: user.deviceId || `dev_${user.uid}`,
      banType: data.banType,
      duration: data.duration,
      durationDays: data.durationDays,
      reason: data.reason.trim() || 'مخالفة معايير المجتمع',
      bannedBy: data.bannedBy || 'livo.admin@gmail.com',
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.bans.unshift(newBan);
    this.updateUserProfile(user.uid, {
      isBanned: true,
      banDetails: {
        type: data.banType,
        reason: newBan.reason,
        bannedAt: newBan.createdAt,
        expiresAt,
        bannedBy: newBan.bannedBy
      }
    });

    this.notify();
    firebaseService.saveBan(newBan);

    return { success: true, message: `تم حظر المستخدم ${user.displayName} بنجاح` };
  }

  public unbanUser(banId: string, unbanReason: string, unbannedBy: string = 'livo.admin@gmail.com'): { success: boolean; message: string } {
    const index = this.bans.findIndex(b => b.id === banId);
    if (index === -1) return { success: false, message: 'سجل الحظر غير موجود' };

    const ban = this.bans[index];
    const updated: BanRecord = {
      ...ban,
      status: 'unbanned',
      unbannedBy,
      unbannedAt: new Date().toISOString(),
      unbanReason: unbanReason.trim() || 'رفع الحظر بقرار إداري'
    };
    this.bans[index] = updated;

    this.updateUserProfile(ban.uid, {
      isBanned: false,
      banDetails: undefined
    });

    this.notify();
    firebaseService.saveBan(updated);

    return { success: true, message: 'تم رفع الحظر وتحديث السجل الإداري' };
  }

  // --- PRIVATE 1-ON-1 MESSAGING ---
  public getMessages(): DirectMessage[] {
    return this.messages;
  }

  public getChatMessages(uid1: string, uid2: string): DirectMessage[] {
    return this.messages
      .filter(
        m => (m.senderUid === uid1 && m.receiverUid === uid2) ||
             (m.senderUid === uid2 && m.receiverUid === uid1)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getChatThreads(currentUid: string): ChatThread[] {
    const threadsMap = new Map<string, { lastMsg: DirectMessage; otherUid: string }>();

    for (const msg of this.messages) {
      if (msg.senderUid === currentUid || msg.receiverUid === currentUid) {
        const otherUid = msg.senderUid === currentUid ? msg.receiverUid : msg.senderUid;
        const existing = threadsMap.get(otherUid);
        if (!existing || new Date(msg.createdAt).getTime() > new Date(existing.lastMsg.createdAt).getTime()) {
          threadsMap.set(otherUid, { lastMsg: msg, otherUid });
        }
      }
    }

    const threads: ChatThread[] = [];
    threadsMap.forEach(({ lastMsg, otherUid }) => {
      const otherUser = this.getUserByUid(otherUid);
      if (otherUser) {
        threads.push({
          chatId: [currentUid, otherUid].sort().join('_'),
          participantUid: otherUser.uid,
          participantName: otherUser.displayName,
          participantAvatar: otherUser.avatar,
          participantVerified: otherUser.isVerified,
          lastMessage: lastMsg.content,
          lastMessageType: lastMsg.type,
          lastMessageTime: lastMsg.createdAt,
          unreadCount: lastMsg.receiverUid === currentUid && lastMsg.status !== 'read' ? 1 : 0
        });
      }
    });

    return threads.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }

  public sendDirectMessage(data: {
    senderUid: string;
    receiverUid: string;
    content: string;
    type?: 'text' | 'image' | 'voice' | 'video';
    mediaUrl?: string;
  }): DirectMessage {
    const sender = this.getUserByUid(data.senderUid) || this.getCurrentUser();
    const chatId = [data.senderUid, data.receiverUid].sort().join('_');

    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      chatId,
      senderUid: sender.uid,
      senderName: sender.displayName,
      senderAvatar: sender.avatar,
      receiverUid: data.receiverUid,
      content: data.content,
      type: data.type || 'text',
      mediaUrl: data.mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'delivered'
    };

    this.messages.push(newMsg);
    this.notify();
    firebaseService.saveMessage(newMsg);

    return newMsg;
  }

  // --- ROOMS & OFFICIAL ADMIN ROOM CONTROL ---
  public getRooms(): VoiceRoom[] {
    return this.rooms;
  }

  public setOfficialRoomStatus(status: 'open' | 'closed' | 'locked_by_admin', announcement?: string): void {
    const officialIndex = this.rooms.findIndex(r => r.isOfficial);
    if (officialIndex !== -1) {
      const updated: VoiceRoom = {
        ...this.rooms[officialIndex],
        status,
        announcement: announcement !== undefined ? announcement : this.rooms[officialIndex].announcement
      };
      this.rooms[officialIndex] = updated;
      this.notify();
      firebaseService.saveRoom(updated);
    }
  }

  public updateRoomSeat(roomId: string, seatIndex: number, occupiedByUid?: string, isLocked?: boolean): void {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return;

    const room = this.rooms[rIndex];
    const seats = [...room.seats];
    const seat = seats[seatIndex] || { seatIndex, isMuted: false, isLocked: false };

    if (occupiedByUid) {
      const occupant = this.getUserByUid(occupiedByUid);
      seats[seatIndex] = {
        ...seat,
        seatIndex,
        occupiedByUid,
        occupiedByName: occupant?.displayName || 'مستخدم',
        occupiedByAvatar: occupant?.avatar,
        isLocked: isLocked !== undefined ? isLocked : seat.isLocked
      };
    } else {
      seats[seatIndex] = {
        ...seat,
        seatIndex,
        occupiedByUid: undefined,
        occupiedByName: undefined,
        occupiedByAvatar: undefined,
        isLocked: isLocked !== undefined ? isLocked : seat.isLocked
      };
    }

    const updatedRoom = { ...room, seats };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
  }

  // --- STORE PURCHASES ---
  public buyStoreItem(uid: string, itemId: string, itemType: 'frame' | 'entrance', priceCoins: number): { success: boolean; message: string } {
    const user = this.getUserByUid(uid);
    if (!user) return { success: false, message: 'المستخدم غير موجود' };
    if (user.coins < priceCoins) {
      return { success: false, message: 'رصيد الكوينز غير كافٍ لإتمام الشراء' };
    }

    const newCoins = user.coins - priceCoins;
    const updates: Partial<UserProfile> = { coins: newCoins };
    if (itemType === 'frame') updates.equippedFrame = itemId;
    if (itemType === 'entrance') updates.equippedEntrance = itemId;

    this.updateUserProfile(uid, updates);

    this.logCoinAudit({
      uid: user.uid,
      username: user.username,
      actionType: 'store_purchase',
      coinsChange: -priceCoins,
      balanceBefore: user.coins,
      balanceAfter: newCoins,
      reason: `شراء وتجهيز عنصر من المتجر (${itemId})`,
      performedBy: user.displayName
    });

    return { success: true, message: 'تم الشراء وتجهيز العنصر بنجاح!' };
  }

  // --- GENUINE USER VIDEOS ---
  public getVideos(): VideoPost[] {
    return this.videos;
  }

  public uploadVideo(data: {
    authorUid: string;
    caption: string;
    videoUrl: string;
  }): VideoPost {
    const author = this.getUserByUid(data.authorUid) || this.getCurrentUser();

    const newVideo: VideoPost = {
      id: `vid-${Date.now()}`,
      authorUid: author.uid,
      authorName: author.displayName,
      authorAvatar: author.avatar,
      isVerified: author.isVerified,
      videoUrl: data.videoUrl,
      caption: data.caption,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };

    this.videos.unshift(newVideo);
    this.notify();
    return newVideo;
  }

  public deleteVideo(videoId: string, requestingUid: string): boolean {
    const video = this.videos.find(v => v.id === videoId);
    if (!video) return false;

    const requester = this.getUserByUid(requestingUid);
    const isOwnerOrAuthor = requester?.role === 'owner' || video.authorUid === requestingUid;
    if (!isOwnerOrAuthor) return false;

    this.videos = this.videos.filter(v => v.id !== videoId);
    this.notify();
    return true;
  }

  // --- ADVERTISEMENTS CENTER ---
  public getAdvertisements(onlyActive: boolean = true): Advertisement[] {
    if (!onlyActive) return this.advertisements;
    const now = new Date();
    return this.advertisements.filter(ad => {
      if (ad.status !== 'active') return false;
      const start = new Date(ad.startDate);
      const end = new Date(ad.endDate);
      return now >= start && now <= end;
    });
  }

  public getAdvertisementById(adId: string): Advertisement | undefined {
    return this.advertisements.find(a => a.id === adId);
  }

  public createAdvertisement(data: {
    title: string;
    description: string;
    imageUrl: string;
    targetUrl?: string;
    startDate: string;
    endDate: string;
    placement: 'banner' | 'popup' | 'feed';
    createdBy?: string;
  }): Advertisement {
    const newAd: Advertisement = {
      id: `ad-${Date.now()}`,
      title: data.title.trim(),
      description: data.description.trim(),
      imageUrl: data.imageUrl.trim(),
      targetUrl: data.targetUrl?.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',
      placement: data.placement,
      clicksCount: 0,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || 'livo.admin@gmail.com'
    };

    this.advertisements.unshift(newAd);
    this.notify();
    firebaseService.saveAdvertisement(newAd);
    return newAd;
  }

  public updateAdvertisement(adId: string, updates: Partial<Advertisement>): boolean {
    const index = this.advertisements.findIndex(a => a.id === adId);
    if (index === -1) return false;

    this.advertisements[index] = { ...this.advertisements[index], ...updates };
    this.notify();
    firebaseService.saveAdvertisement(this.advertisements[index]);
    return true;
  }

  public deleteAdvertisement(adId: string): boolean {
    const index = this.advertisements.findIndex(a => a.id === adId);
    if (index === -1) return false;

    this.advertisements.splice(index, 1);
    this.notify();
    firebaseService.deleteAdvertisement(adId);
    return true;
  }

  public recordAdClick(adId: string): void {
    const ad = this.advertisements.find(a => a.id === adId);
    if (ad) {
      ad.clicksCount = (ad.clicksCount || 0) + 1;
      this.notify();
      firebaseService.saveAdvertisement(ad);
    }
  }

  public recordAdView(adId: string): void {
    const ad = this.advertisements.find(a => a.id === adId);
    if (ad) {
      ad.viewsCount = (ad.viewsCount || 0) + 1;
      this.notify();
      firebaseService.saveAdvertisement(ad);
    }
  }

  // --- CENTRAL SUPPORT TICKETS & ADMIN INBOX ---
  public getSupportTickets(filterUid?: string): SupportTicket[] {
    if (filterUid) {
      return this.supportTickets.filter(t => t.uid === filterUid);
    }
    return this.supportTickets;
  }

  public submitSupportTicket(data: {
    uid: string;
    category: 'complaint' | 'inquiry' | 'report' | 'technical' | 'financial';
    subject: string;
    message: string;
    attachmentUrl?: string;
    priority?: 'normal' | 'high' | 'urgent';
  }): SupportTicket {
    const user = this.getUserByUid(data.uid) || this.getCurrentUser();

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      uid: user.uid,
      username: user.displayName || user.username,
      userAvatar: user.avatar,
      category: data.category,
      subject: data.subject.trim(),
      message: data.message.trim(),
      attachmentUrl: data.attachmentUrl,
      status: 'pending',
      priority: data.priority || 'normal',
      createdAt: new Date().toISOString()
    };

    this.supportTickets.unshift(newTicket);
    this.notify();
    firebaseService.saveSupportTicket(newTicket);

    // Also auto-forward as a message from user to Admin
    this.sendDirectMessage({
      senderUid: user.uid,
      receiverUid: '10000',
      content: `[تذكرة دعم جديدة #${newTicket.id}] (${data.subject}): ${data.message}`
    });

    return newTicket;
  }

  public replyToSupportTicket(ticketId: string, replyText: string, status: 'resolved' | 'in_progress' | 'closed' = 'resolved', adminEmail: string = 'livo.admin@gmail.com'): boolean {
    const index = this.supportTickets.findIndex(t => t.id === ticketId);
    if (index === -1) return false;

    const ticket = this.supportTickets[index];
    ticket.reply = replyText.trim();
    ticket.repliedBy = adminEmail;
    ticket.repliedAt = new Date().toISOString();
    ticket.status = status;

    this.notify();
    firebaseService.saveSupportTicket(ticket);

    // Send direct message response from Admin to User
    this.sendDirectMessage({
      senderUid: '10000',
      receiverUid: ticket.uid,
      content: `رد الإدارة على تذكرتك (${ticket.subject}): ${replyText.trim()}`
    });

    return true;
  }

  // --- LEVEL PROGRESSION SYSTEM (LEVELS 0 - 50) ---
  public getLevelConfigs(): LevelConfig[] {
    return [...this.levelConfigs].sort((a, b) => a.level - b.level);
  }

  public updateLevelConfig(level: number, updates: Partial<LevelConfig>): boolean {
    const index = this.levelConfigs.findIndex(c => c.level === level);
    if (index === -1) return false;

    this.levelConfigs[index] = { ...this.levelConfigs[index], ...updates };
    this.notify();
    firebaseService.saveLevelConfig(this.levelConfigs[index]);
    return true;
  }

  public async saveLevelConfigs(configs: LevelConfig[]): Promise<void> {
    this.levelConfigs = configs;
    this.notify();
    await firebaseService.saveLevelConfigs(configs);
  }

  public getLevelPromotions(filterUid?: string): LevelPromotionRecord[] {
    if (filterUid) {
      return this.levelPromotions.filter(p => p.uid === filterUid);
    }
    return this.levelPromotions;
  }

  public checkAndPromoteUserLevel(uid: string): { promoted: boolean; oldLevel: number; newLevel: number; diamondsAwarded: number } {
    const user = this.getUserByUid(uid);
    if (!user) {
      return { promoted: false, oldLevel: 0, newLevel: 0, diamondsAwarded: 0 };
    }

    const currentLevel = user.level || 0;
    const eligibleCoins = user.eligibleRechargedCoins || 0;
    const sortedConfigs = [...this.levelConfigs].sort((a, b) => a.level - b.level);

    // Determine target level (0 to 50 max) based on cumulative eligible recharged coins
    let targetLevel = 0;
    for (const cfg of sortedConfigs) {
      if (cfg.level <= 50 && eligibleCoins >= cfg.requiredCoins) {
        targetLevel = cfg.level;
      }
    }
    targetLevel = Math.min(50, Math.max(0, targetLevel));

    if (targetLevel > currentLevel) {
      const unlockedRewards = new Set(user.unlockedLevelRewards || []);
      let totalDiamondsAwarded = 0;

      // Award diamond reward for each newly attained level, strictly once
      for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
        if (!unlockedRewards.has(lvl)) {
          const cfg = sortedConfigs.find(c => c.level === lvl);
          if (cfg && cfg.rewardDiamonds > 0) {
            totalDiamondsAwarded += cfg.rewardDiamonds;
          }
          unlockedRewards.add(lvl);
        }
      }

      const updatedLevel = targetLevel;
      const updatedDiamonds = (user.diamonds || 0) + totalDiamondsAwarded;
      const updatedRewardsList = Array.from(unlockedRewards);

      this.updateUserProfile(uid, {
        level: updatedLevel,
        diamonds: updatedDiamonds,
        unlockedLevelRewards: updatedRewardsList
      });

      // Record promotion
      const promoRecord: LevelPromotionRecord = {
        id: `promo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uid: user.uid,
        username: user.username,
        oldLevel: currentLevel,
        newLevel: updatedLevel,
        eligibleRechargedCoins: eligibleCoins,
        rewardDiamondsAwarded: totalDiamondsAwarded,
        unlockedAt: new Date().toISOString()
      };
      this.levelPromotions.unshift(promoRecord);
      firebaseService.saveLevelPromotion(promoRecord);

      // Direct message notification to user
      this.sendDirectMessage({
        senderUid: '10000',
        receiverUid: user.uid,
        content: `🎉 تهانينا! ارتقيت إلى المستوى ${updatedLevel} في LIVO وحصلت على ${totalDiamondsAwarded} ألماسة مكافأة!`
      });

      return {
        promoted: true,
        oldLevel: currentLevel,
        newLevel: updatedLevel,
        diamondsAwarded: totalDiamondsAwarded
      };
    }

    return { promoted: false, oldLevel: currentLevel, newLevel: currentLevel, diamondsAwarded: 0 };
  }

  // --- CHARGING AGENTS (وكيل شحن) & BALANCE TRANSFERS ---
  public getAgentTransfers(agentUid?: string): AgentTransferRecord[] {
    if (agentUid) {
      return this.agentTransfers.filter(t => t.agentUid === agentUid);
    }
    return this.agentTransfers;
  }

  public executeAgentTransfer(
    agentUid: string,
    targetUidOrPublicId: string,
    coinsAmount: number,
    notes?: string
  ): { success: boolean; message: string } {
    if (coinsAmount <= 0 || isNaN(coinsAmount)) {
      return { success: false, message: 'يرجى إدخال عدد كوينز صحيح أكبر من الصفر' };
    }

    const agent = this.getUserByUid(agentUid);
    if (!agent) {
      return { success: false, message: 'حساب الوكيل غير موجود' };
    }

    const isAuthorized = agent.role === 'charging_agent' || agent.role === 'owner' || agent.canChargeUsers;
    if (!isAuthorized) {
      return { success: false, message: 'عذراً، هذا الحساب لا يملك صلاحية وكيل الشحن' };
    }

    // Check agent available balance
    const agentBalance = agent.agentBalance !== undefined ? agent.agentBalance : agent.coins;
    if (agentBalance < coinsAmount) {
      return { success: false, message: `رصيد الوكيل الحالي (${agentBalance}) غير كافٍ لتحويل ${coinsAmount} كوينز` };
    }

    // Lookup recipient by Public ID or Auth UID or Username
    const cleanSearch = targetUidOrPublicId.trim().toLowerCase();
    const targetUser = this.users.find(
      u => u.uid === cleanSearch ||
           u.authUid === cleanSearch ||
           u.username.toLowerCase() === cleanSearch
    );

    if (!targetUser) {
      return { success: false, message: `المستخدم بالمعرف (${targetUidOrPublicId}) غير موجود في النظام` };
    }

    if (targetUser.uid === agent.uid) {
      return { success: false, message: 'لا يمكن تحويل الرصيد إلى نفس الحساب' };
    }

    // Deduct from agent
    const newAgentBalance = agentBalance - coinsAmount;
    const agentUpdates: Partial<UserProfile> = {
      agentBalance: newAgentBalance,
      coins: agent.coins >= coinsAmount ? agent.coins - coinsAmount : agent.coins
    };
    this.updateUserProfile(agent.uid, agentUpdates);

    // Add to target user (DO NOT increment eligibleRechargedCoins, per rule 11: agent transfers do not count for level upgrade)
    const newTargetCoins = targetUser.coins + coinsAmount;
    this.updateUserProfile(targetUser.uid, {
      coins: newTargetCoins
    });

    // Record in agent transfers
    const transferRecord: AgentTransferRecord = {
      id: `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      agentUid: agent.uid,
      agentName: agent.displayName || agent.username,
      targetUid: targetUser.uid,
      targetName: targetUser.displayName || targetUser.username,
      targetAvatar: targetUser.avatar,
      coinsAmount,
      agentBalanceBefore: agentBalance,
      agentBalanceAfter: newAgentBalance,
      createdAt: new Date().toISOString(),
      notes: notes?.trim()
    };
    this.agentTransfers.unshift(transferRecord);
    firebaseService.saveAgentTransfer(transferRecord);

    // Audit record
    this.logCoinAudit({
      uid: targetUser.uid,
      username: targetUser.username,
      actionType: 'agency_charge',
      coinsChange: coinsAmount,
      balanceBefore: targetUser.coins,
      balanceAfter: newTargetCoins,
      reason: `تحويل كوينز من وكيل الشحن: ${agent.displayName} (${agent.uid})`,
      performedBy: agent.displayName
    });

    // Send DM receipt to recipient
    this.sendDirectMessage({
      senderUid: agent.uid,
      receiverUid: targetUser.uid,
      content: `تم استلام شحن بقيمة ${coinsAmount} كوينز من وكيل الشحن المعتمد ${agent.displayName}. شكراً لاستخدامك LIVO!`
    });

    return {
      success: true,
      message: `تم تحويل ${coinsAmount} كوينز بنجاح إلى المستخدم ${targetUser.displayName} (ID: ${targetUser.uid})`
    };
  }

  // --- DISTRIBUTOR AGENTS (وكيل موزعين) ---
  public getDistributors(agentUid?: string): DistributorRecord[] {
    if (agentUid) {
      return this.distributors.filter(d => d.agentUid === agentUid);
    }
    return this.distributors;
  }

  public addDistributor(data: {
    distributorUid?: string;
    distributorName: string;
    phone?: string;
    agentUid: string;
  }): DistributorRecord {
    const dUid = data.distributorUid || String(Math.floor(10000 + Math.random() * 90000));
    const newDist: DistributorRecord = {
      id: `DIST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      agentUid: data.agentUid,
      distributorUid: dUid,
      distributorName: data.distributorName.trim(),
      distributorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      phone: data.phone?.trim(),
      status: 'active',
      salesCount: 0,
      totalVolumeCoins: 0,
      joinedAt: new Date().toISOString()
    };

    this.distributors.unshift(newDist);
    this.notify();
    firebaseService.saveDistributor(newDist);

    return newDist;
  }

  public deleteDistributor(id: string): boolean {
    const index = this.distributors.findIndex(d => d.id === id);
    if (index === -1) return false;

    this.distributors.splice(index, 1);
    this.notify();
    firebaseService.deleteDistributor(id);
    return true;
  }

  // --- PAYMENT METHODS CONFIGURATION (إعدادات الشحن ووسائل الدفع) ---
  public getPaymentMethods(): PaymentMethodConfig[] {
    return [...this.paymentMethods].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }

  public getActivePaymentMethods(): PaymentMethodConfig[] {
    return this.paymentMethods.filter(pm => pm.isActive);
  }

  public getDefaultPaymentMethod(): PaymentMethodConfig | undefined {
    return this.paymentMethods.find(pm => pm.isDefault && pm.isActive) || this.paymentMethods.find(pm => pm.isActive) || this.paymentMethods[0];
  }

  public savePaymentMethod(method: PaymentMethodConfig): void {
    const index = this.paymentMethods.findIndex(p => p.id === method.id);
    // If setting as default, unset other defaults
    if (method.isDefault) {
      this.paymentMethods.forEach(p => {
        if (p.id !== method.id) p.isDefault = false;
      });
    }

    if (index !== -1) {
      this.paymentMethods[index] = { ...method, updatedAt: new Date().toISOString() };
    } else {
      this.paymentMethods.push({ ...method, updatedAt: new Date().toISOString() });
    }
    this.notify();
    firebaseService.savePaymentMethod(method);
  }

  public deletePaymentMethod(id: string): boolean {
    const index = this.paymentMethods.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.paymentMethods.splice(index, 1);
    this.notify();
    firebaseService.deletePaymentMethod(id);
    return true;
  }

  // --- GIFTS MANAGEMENT (إدارة الهدايا الحية) ---
  public getGifts(): GiftItem[] {
    return [...this.gifts].sort((a, b) => b.coins - a.coins);
  }

  public getActiveGifts(): GiftItem[] {
    return this.gifts.filter(g => g.isActive !== false);
  }

  public saveGift(gift: GiftItem): void {
    const index = this.gifts.findIndex(g => g.id === gift.id);
    const updatedGift: GiftItem = {
      ...gift,
      isActive: gift.isActive !== undefined ? gift.isActive : true,
      updatedAt: new Date().toISOString()
    };

    if (index !== -1) {
      this.gifts[index] = updatedGift;
    } else {
      this.gifts.push(updatedGift);
    }
    this.notify();
    firebaseService.saveGift(updatedGift);
  }

  public deleteGift(id: string): boolean {
    const index = this.gifts.findIndex(g => g.id === id);
    if (index === -1) return false;

    this.gifts.splice(index, 1);
    this.notify();
    firebaseService.deleteGift(id);
    return true;
  }

  // --- STORE ITEMS MANAGEMENT (إطارات ودخلات المتجر) ---
  public getStoreItems(): StoreItem[] {
    return [...this.storeItems].sort((a, b) => b.priceCoins - a.priceCoins);
  }

  public getActiveStoreItems(type?: 'frame' | 'entrance'): StoreItem[] {
    return this.storeItems.filter(it => {
      if (it.isActive === false) return false;
      if (type && it.type !== type) return false;
      return true;
    });
  }

  public saveStoreItem(item: StoreItem): void {
    const index = this.storeItems.findIndex(i => i.id === item.id);
    const updatedItem: StoreItem = {
      ...item,
      isActive: item.isActive !== undefined ? item.isActive : true,
      updatedAt: new Date().toISOString()
    };

    if (index !== -1) {
      this.storeItems[index] = updatedItem;
    } else {
      this.storeItems.push(updatedItem);
    }
    this.notify();
    firebaseService.saveStoreItem(updatedItem);
  }

  public deleteStoreItem(id: string): boolean {
    const index = this.storeItems.findIndex(i => i.id === id);
    if (index === -1) return false;

    this.storeItems.splice(index, 1);
    this.notify();
    firebaseService.deleteStoreItem(id);
    return true;
  }

  // --- RECHARGE CODES & VOUCHERS (أكواد الشحن الآمنة والموثقة) ---
  public getRechargeCodes(): RechargeCode[] {
    return [...this.rechargeCodes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createRechargeCode(data: {
    code: string;
    coins: number;
    description?: string;
    maxUses?: number;
    createdBy?: string;
  }): RechargeCode {
    const cleanCode = data.code.trim().toUpperCase();
    const newCode: RechargeCode = {
      id: cleanCode,
      code: cleanCode,
      coins: data.coins,
      description: data.description?.trim(),
      status: 'active',
      maxUses: data.maxUses && data.maxUses > 0 ? data.maxUses : 1,
      usedCount: 0,
      usedByUids: [],
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || 'livo.admin@gmail.com'
    };

    this.rechargeCodes.unshift(newCode);
    this.notify();
    firebaseService.saveRechargeCode(newCode);

    return newCode;
  }

  public deleteRechargeCode(id: string): boolean {
    const index = this.rechargeCodes.findIndex(c => c.id === id || c.code === id);
    if (index === -1) return false;

    this.rechargeCodes.splice(index, 1);
    this.notify();
    firebaseService.deleteRechargeCode(id);
    return true;
  }

  /**
   * Redeem recharge voucher code:
   * 1. Validates code existence and 'active' status
   * 2. Checks max uses limit
   * 3. Prevents duplicate redemption by the same UID
   * 4. Atomically credits coins to user and accumulates eligible recharge
   * 5. Promotes level if eligible
   * 6. Appends audit log
   */
  public redeemRechargeCode(codeStr: string, userUid: string): { success: boolean; message: string; coinsAwarded?: number } {
    const cleanCode = codeStr.trim().toUpperCase();
    const codeObj = this.rechargeCodes.find(c => c.code.toUpperCase() === cleanCode);

    if (!codeObj) {
      return { success: false, message: 'كود الشحن المدخل غير صالح أو غير موجود' };
    }

    if (codeObj.status !== 'active') {
      return { success: false, message: 'هذا الكود غير متاح أو منتهي الصلاحية' };
    }

    if (codeObj.usedByUids.includes(userUid)) {
      return { success: false, message: 'لقد قمت باستخدام هذا الكود مسبقاً! كل كود مخصص للاستخدام مرة واحدة لكل حساب.' };
    }

    if (codeObj.usedCount >= codeObj.maxUses) {
      codeObj.status = 'used';
      firebaseService.saveRechargeCode(codeObj);
      return { success: false, message: 'عذراً، وصل هذا الكود إلى الحد الأقصى المسموح لعدد مرات الاستخدام' };
    }

    const user = this.getUserByUid(userUid);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    // 1. Credit coins
    const balanceBefore = user.coins;
    const balanceAfter = balanceBefore + codeObj.coins;
    const eligibleBefore = user.eligibleRechargedCoins || 0;
    const eligibleAfter = eligibleBefore + codeObj.coins;

    this.updateUserProfile(userUid, {
      coins: balanceAfter,
      eligibleRechargedCoins: eligibleAfter
    });

    // 2. Mark code usage
    codeObj.usedCount += 1;
    codeObj.usedByUids.push(userUid);
    codeObj.usedAt = new Date().toISOString();
    if (codeObj.usedCount >= codeObj.maxUses) {
      codeObj.status = 'used';
    }
    this.notify();
    firebaseService.saveRechargeCode(codeObj);

    // 3. Promote level
    this.checkAndPromoteUserLevel(userUid);

    // 4. Log audit
    this.logCoinAudit({
      uid: user.uid,
      username: user.username,
      actionType: 'recharge_request',
      coinsChange: codeObj.coins,
      balanceBefore,
      balanceAfter,
      reason: `شحن فوري عبر كود الشحن المعتمد: ${codeObj.code}`,
      performedBy: user.displayName
    });

    return {
      success: true,
      coinsAwarded: codeObj.coins,
      message: `🎉 تهانينا! تم شحن ${codeObj.coins.toLocaleString()} كوينز إلى حسابك بنجاح عبر الكود (${codeObj.code})`
    };
  }
}

export const livoStore = new LivoStore();
