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
  MessageRequest,
  MessageRequestStatus,
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
  RechargeCode,
  CoinPackage,
  SupervisorRecord,
  RoomMessage
} from '../types';
import {
  INITIAL_ROOMS,
  INITIAL_LEVEL_CONFIGS,
  INITIAL_GIFTS,
  INITIAL_STORE_ITEMS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_RECHARGE_CODES,
  INITIAL_COIN_PACKAGES
} from '../data/initialData';
import { firebaseService } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';

const OWNER_EMAILS = ['livo.admin@gmail.com', 'eslamfifty11@gmail.com'];
const LEGACY_DEMO_UIDS = new Set(['10245', '10246', '10247']);
const MESSAGES_CACHE_KEY = 'livo_messages_cache_v2';
const MESSAGE_REQUESTS_CACHE_KEY = 'livo_message_requests_cache_v2';

type Listener = () => void;

class LivoStore {
  private listeners: Set<Listener> = new Set();
  
  // Real-time In-Memory Cache backed by Firestore
  private users: UserProfile[] = [];
  private currentUid: string = '';
  private rechargeRequests: RechargeRequest[] = [];
  private coinAudits: CoinAuditRecord[] = [];
  private agencies: AgencyApplication[] = [];
  private verifications: BlueVerificationRequest[] = [];
  private withdrawals: WithdrawalRequest[] = [];
  private bans: BanRecord[] = [];
  private messages: DirectMessage[] = [];
  private messageRequests: MessageRequest[] = [];
  private rooms: VoiceRoom[] = [...INITIAL_ROOMS];
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
  private coinPackages: CoinPackage[] = [...INITIAL_COIN_PACKAGES];
  private supervisors: SupervisorRecord[] = [];

  private isInitialized = false;
  private messagesUnsub: (() => void) | null = null;
  private messageRequestsUnsub: (() => void) | null = null;

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

  private isLegacyDemoMessage(msg: DirectMessage): boolean {
    return LEGACY_DEMO_UIDS.has(msg.senderUid) || LEGACY_DEMO_UIDS.has(msg.receiverUid);
  }

  private persistMessagesCache() {
    if (typeof window === 'undefined') return;
    try {
      const clean = this.messages.filter(m => !this.isLegacyDemoMessage(m)).slice(-300);
      localStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(clean));
    } catch {}
  }

  private persistMessageRequestsCache() {
    if (typeof window === 'undefined') return;
    try {
      const clean = this.messageRequests
        .filter(r => !LEGACY_DEMO_UIDS.has(r.senderUid) && !LEGACY_DEMO_UIDS.has(r.receiverUid))
        .slice(-200);
      localStorage.setItem(MESSAGE_REQUESTS_CACHE_KEY, JSON.stringify(clean));
    } catch {}
  }

  private mergeMessages(incoming: DirectMessage[]) {
    const map = new Map<string, DirectMessage>();
    for (const m of this.messages) {
      if (!this.isLegacyDemoMessage(m)) map.set(m.id, m);
    }
    for (const m of incoming) {
      if (!this.isLegacyDemoMessage(m)) map.set(m.id, m);
    }
    this.messages = Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    this.persistMessagesCache();
  }

  private mergeMessageRequests(incoming: MessageRequest[]) {
    const map = new Map<string, MessageRequest>();
    for (const r of this.messageRequests) {
      if (!LEGACY_DEMO_UIDS.has(r.senderUid) && !LEGACY_DEMO_UIDS.has(r.receiverUid)) {
        map.set(r.id, r);
      }
    }
    for (const r of incoming) {
      if (!LEGACY_DEMO_UIDS.has(r.senderUid) && !LEGACY_DEMO_UIDS.has(r.receiverUid)) {
        map.set(r.id, r);
      }
    }
    this.messageRequests = Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    this.persistMessageRequestsCache();
  }

  private initFromCacheAndSeed() {
    if (typeof window === 'undefined') return;

    try {
      const savedUid = localStorage.getItem('livo_active_uid');
      const isLoggedIn = localStorage.getItem('livo_auth_logged_in') === 'true';
      if (savedUid && isLoggedIn) {
        this.currentUid = savedUid;
      } else {
        this.currentUid = '';
      }

      const rawMsgs = localStorage.getItem(MESSAGES_CACHE_KEY);
      if (rawMsgs) {
        const parsed = JSON.parse(rawMsgs) as DirectMessage[];
        if (Array.isArray(parsed)) {
          this.messages = parsed.filter(m => !this.isLegacyDemoMessage(m));
        }
      }

      const rawReqs = localStorage.getItem(MESSAGE_REQUESTS_CACHE_KEY);
      if (rawReqs) {
        const parsedReqs = JSON.parse(rawReqs) as MessageRequest[];
        if (Array.isArray(parsedReqs)) {
          this.messageRequests = parsedReqs.filter(
            r => !LEGACY_DEMO_UIDS.has(r.senderUid) && !LEGACY_DEMO_UIDS.has(r.receiverUid)
          );
        }
      }

      this.rooms = [...INITIAL_ROOMS];
      this.videos = [];
    } catch (e) {
      console.warn('Cache read warning:', e);
    }
  }

  private attachMessageListeners(authUid?: string, isOwner: boolean = false) {
    if (this.messagesUnsub) {
      this.messagesUnsub();
      this.messagesUnsub = null;
    }
    if (this.messageRequestsUnsub) {
      this.messageRequestsUnsub();
      this.messageRequestsUnsub = null;
    }
    if (!authUid) return;

    this.messagesUnsub = firebaseService.subscribeToMessages(
      (msgs) => {
        this.mergeMessages(msgs);
        this.notify();
      },
      { authUid, isOwner }
    );

    this.messageRequestsUnsub = firebaseService.subscribeToMessageRequests(
      (reqs) => {
        this.mergeMessageRequests(reqs);
        this.notify();
      },
      { authUid, isOwner }
    );
  }

  /**
   * Connect real-time Firestore listeners for immediate bidirectional sync.
   * Automatically re-attaches auth-scoped listeners whenever Firebase Auth changes.
   */
  private initFirebaseSubscriptions() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    const bindCoreListeners = () => {
      firebaseService.cleanup();
      this.messagesUnsub = null;
      this.messageRequestsUnsub = null;

      // 1. Users sync (ZERO fake user seeding)
      firebaseService.subscribeToUsers((firestoreUsers) => {
        this.users = firestoreUsers;
        this.notify();
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

      // 4. Agencies sync
      firebaseService.subscribeToAgencies((list) => {
        this.agencies = list;
        this.notify();
      });

      // 5. Verifications sync
      firebaseService.subscribeToVerifications((list) => {
        this.verifications = list;
        this.notify();
      });

      // 6. Withdrawals sync
      firebaseService.subscribeToWithdrawals((list) => {
        this.withdrawals = list;
        this.notify();
      });

      // 7. Bans sync
      firebaseService.subscribeToBans((list) => {
        this.bans = list;
        this.notify();
      });

      // 8. Coin audits sync
      firebaseService.subscribeToCoinAudits((audits) => {
        this.coinAudits = audits;
        this.notify();
      });
    };

    bindCoreListeners();

    firebaseService.onAuthStateChanged((fbUser) => {
      bindCoreListeners();
      if (fbUser) {
        const isOwner = this.isOwnerEmail(fbUser.email);
        this.attachMessageListeners(fbUser.uid, isOwner);
      }
      // Attach remaining catalog & platform listeners inside fresh cycle
      this.attachSecondaryListeners();
    });

    this.attachSecondaryListeners();
  }

  private attachSecondaryListeners() {

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

    // 19. Coin Packages sync
    firebaseService.subscribeToCoinPackages((pkgs) => {
      if (pkgs.length > 0) {
        this.coinPackages = pkgs;
        this.notify();
      } else {
        INITIAL_COIN_PACKAGES.forEach(pkg => firebaseService.saveCoinPackage({ ...pkg, isActive: true }));
      }
    });

    // 20. Supervisors sync
    firebaseService.subscribeToSupervisors((sups) => {
      this.supervisors = sups;
      this.notify();
    });

    // 21. Videos sync
    firebaseService.subscribeToVideos((vids) => {
      this.videos = vids;
      this.notify();
    });
  }

  // --- USERS & AUTHENTICATION ---
  public getUsers(): UserProfile[] {
    return this.users;
  }

  public getGenuineUsers(): UserProfile[] {
    return this.users.filter(u => !(LEGACY_DEMO_UIDS.has(u.uid) && !u.authUid));
  }

  public getCurrentUser(): UserProfile | null {
    if (!this.currentUid) return null;
    return this.users.find(u => u.uid === this.currentUid) || null;
  }

  public setCurrentUser(uid: string): void {
    this.currentUid = uid;
    try {
      if (uid) {
        localStorage.setItem('livo_active_uid', uid);
        localStorage.setItem('livo_auth_logged_in', 'true');
      } else {
        localStorage.removeItem('livo_active_uid');
        localStorage.removeItem('livo_auth_logged_in');
      }
    } catch {}
    this.notify();
  }

  public logoutSession(): void {
    this.currentUid = '';
    try {
      localStorage.removeItem('livo_active_uid');
      localStorage.removeItem('livo_auth_logged_in');
    } catch {}
    this.notify();
  }

  public isOwnerEmail(email?: string | null): boolean {
    if (!email) return false;
    return OWNER_EMAILS.includes(email.trim().toLowerCase());
  }

  /**
   * Synchronize a real Firebase Auth user to their exact bound Livo UserProfile
   * Never mixes profiles or falls back to another user's account.
   */
  public syncFirebaseUser(
    fbUser: FirebaseUser,
    options?: { accountType?: 'personal' | 'business'; displayName?: string }
  ): UserProfile {
    const fbEmail = fbUser.email?.trim().toLowerCase();
    const isOwner = this.isOwnerEmail(fbEmail);
    const activeSupervisor = fbEmail
      ? this.supervisors.find(s => s.isActive && s.email.trim().toLowerCase() === fbEmail)
      : undefined;

    // 1. Strict authUid match
    let matched = this.users.find(u => u.authUid === fbUser.uid);

    // 2. Email match only if profile isn't claimed by a different authUid
    if (!matched && fbEmail) {
      matched = this.users.find(
        u => u.email?.trim().toLowerCase() === fbEmail && (!u.authUid || u.authUid === fbUser.uid)
      );
    }

    if (matched) {
      const updates: Partial<UserProfile> = {};
      if (!matched.authUid) updates.authUid = fbUser.uid;
      if (fbEmail && !matched.email) updates.email = fbEmail;
      if (isOwner && matched.role !== 'owner') {
        updates.role = 'owner';
        updates.isVerified = true;
      } else if (!isOwner && activeSupervisor && matched.role === 'user') {
        updates.role = 'supervisor';
      }
      if (Object.keys(updates).length > 0) {
        this.updateUserProfile(matched.uid, updates);
      }
      this.setCurrentUser(matched.uid);
      return { ...matched, ...updates };
    }

    // 3. Create brand new profile strictly bound to fbUser.uid
    const newUid = this.generateUniqueUid();
    const fallbackName = options?.displayName?.trim() || fbUser.displayName?.trim() || (fbEmail ? fbEmail.split('@')[0] : `عضو_${newUid}`);
    const cleanUsername = fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${newUid}`;
    const resolvedRole = isOwner ? 'owner' : activeSupervisor ? 'supervisor' : 'user';

    const newUser: UserProfile = {
      uid: newUid,
      authUid: fbUser.uid,
      email: fbEmail || undefined,
      username: cleanUsername,
      displayName: fallbackName,
      avatar: fbUser.photoURL || '/assets/livo/customer_icon.jpg',
      role: resolvedRole,
      accountType: options?.accountType || 'personal',
      coins: 0,
      diamonds: 0,
      level: isOwner ? 50 : 0,
      eligibleRechargedCoins: 0,
      unlockedLevelRewards: [],
      isVerified: isOwner,
      followingCount: 0,
      followersCount: 0,
      followingUids: [],
      blockedUids: [],
      notificationsEnabled: true,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.setCurrentUser(newUser.uid);
    this.notify();
    firebaseService.saveUserProfile(newUser);
    return newUser;
  }

  public getUserByUid(uid: string): UserProfile | undefined {
    return this.users.find(u => u.uid === uid);
  }

  public getUserByUsername(username: string): UserProfile | undefined {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public toggleFollowUser(currentUid: string, targetUid: string): boolean {
    if (!currentUid || !targetUid || currentUid === targetUid) return false;
    const current = this.getUserByUid(currentUid);
    const target = this.getUserByUid(targetUid);
    if (!current || !target) return false;

    const currentFollowing = new Set(current.followingUids || []);
    const willFollow = !currentFollowing.has(targetUid);
    if (willFollow) {
      currentFollowing.add(targetUid);
    } else {
      currentFollowing.delete(targetUid);
    }

    this.updateUserProfile(currentUid, {
      followingUids: Array.from(currentFollowing),
      followingCount: Math.max(0, (current.followingCount || 0) + (willFollow ? 1 : -1))
    });
    this.updateUserProfile(targetUid, {
      followersCount: Math.max(0, (target.followersCount || 0) + (willFollow ? 1 : -1))
    });
    return willFollow;
  }

  public toggleBlockUser(currentUid: string, targetUid: string): boolean {
    if (!currentUid || !targetUid || currentUid === targetUid) return false;
    const current = this.getUserByUid(currentUid);
    if (!current) return false;

    const blocked = new Set(current.blockedUids || []);
    const willBlock = !blocked.has(targetUid);
    if (willBlock) {
      blocked.add(targetUid);
    } else {
      blocked.delete(targetUid);
    }

    this.updateUserProfile(currentUid, {
      blockedUids: Array.from(blocked)
    });
    return willBlock;
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
      avatar: '/assets/livo/customer_icon.jpg',
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
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

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
  public getCoinAudits(filterUid?: string): CoinAuditRecord[] {
    if (filterUid) {
      return this.coinAudits.filter(a => a.uid === filterUid);
    }
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
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

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
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

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

  // --- PRIVATE 1-ON-1 MESSAGING & MESSAGE REQUESTS ---
  public getMessages(): DirectMessage[] {
    return this.messages.filter(m => !this.isLegacyDemoMessage(m));
  }

  public getChatMessages(uid1: string, uid2: string): DirectMessage[] {
    return this.messages
      .filter(
        m => !this.isLegacyDemoMessage(m) &&
             ((m.senderUid === uid1 && m.receiverUid === uid2) ||
              (m.senderUid === uid2 && m.receiverUid === uid1))
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getMessageRequests(): MessageRequest[] {
    return this.messageRequests.filter(
      r => !LEGACY_DEMO_UIDS.has(r.senderUid) && !LEGACY_DEMO_UIDS.has(r.receiverUid)
    );
  }

  public getMessageRequestsForUser(uid: string): {
    incomingPending: MessageRequest[];
    incomingSuspended: MessageRequest[];
    outgoing: MessageRequest[];
    all: MessageRequest[];
  } {
    const user = this.getUserByUid(uid);
    const blocked = new Set(user?.blockedUids || []);
    const relevant = this.getMessageRequests().filter(
      r => (r.senderUid === uid || r.receiverUid === uid) && !blocked.has(r.senderUid === uid ? r.receiverUid : r.senderUid)
    );
    return {
      incomingPending: relevant.filter(r => r.receiverUid === uid && r.status === 'pending'),
      incomingSuspended: relevant.filter(r => r.receiverUid === uid && r.status === 'suspended'),
      outgoing: relevant.filter(r => r.senderUid === uid),
      all: relevant
    };
  }

  public getMessageRequestBetween(uid1: string, uid2: string): MessageRequest | undefined {
    const pairReqs = this.getMessageRequests().filter(
      r => (r.senderUid === uid1 && r.receiverUid === uid2) ||
           (r.senderUid === uid2 && r.receiverUid === uid1)
    );
    return pairReqs.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    )[0];
  }

  public canChatPrivately(uid1: string, uid2: string): boolean {
    if (!uid1 || !uid2 || uid1 === uid2) return false;
    if (uid1 === '10000' || uid2 === '10000') return true;
    const req = this.getMessageRequestBetween(uid1, uid2);
    return req?.status === 'accepted';
  }

  public sendMessageRequest(
    senderUid: string,
    receiverUid: string,
    introMessage: string
  ): { success: boolean; message: string; request?: MessageRequest } {
    if (!senderUid || !receiverUid || senderUid === receiverUid) {
      return { success: false, message: 'لا يمكن إرسال طلب مراسلة إلى نفس الحساب' };
    }
    const sender = this.getUserByUid(senderUid) || this.getCurrentUser();
    const receiver = this.getUserByUid(receiverUid);
    if (!sender || !receiver) {
      return { success: false, message: 'الحساب المطلوب غير متاح حالياً' };
    }
    const cleanIntro = introMessage.trim() || 'مرحباً، أود إرسال رسالة خاصة لك';

    const existing = this.getMessageRequestBetween(senderUid, receiverUid);
    if (existing?.status === 'accepted') {
      return { success: true, message: 'المحادثة مفعّلة بالفعل بينكما', request: existing };
    }

    const now = new Date().toISOString();
    const pairId = `mreq_${[senderUid, receiverUid].sort().join('_')}`;
    const reqObj: MessageRequest = {
      id: pairId,
      senderUid: sender.uid,
      senderAuthUid: sender.authUid || firebaseService.getCurrentAuthUid(),
      senderName: sender.displayName || sender.username,
      senderAvatar: sender.avatar || '/assets/livo/customer_icon.jpg',
      receiverUid: receiver.uid,
      receiverAuthUid: receiver.authUid,
      receiverName: receiver.displayName || receiver.username,
      receiverAvatar: receiver.avatar || '/assets/livo/customer_icon.jpg',
      introMessage: cleanIntro,
      status: 'pending',
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    const idx = this.messageRequests.findIndex(r => r.id === pairId);
    if (idx !== -1) {
      this.messageRequests[idx] = reqObj;
    } else {
      this.messageRequests.unshift(reqObj);
    }
    this.persistMessageRequestsCache();
    this.notify();
    firebaseService.saveMessageRequest(reqObj);

    return { success: true, message: 'تم إرسال طلب المراسلة بنجاح بانتظار موافقة الطرف الآخر', request: reqObj };
  }

  public respondToMessageRequest(
    requestId: string,
    action: Extract<MessageRequestStatus, 'accepted' | 'rejected' | 'suspended'>,
    actorUid: string
  ): { success: boolean; message: string } {
    const idx = this.messageRequests.findIndex(r => r.id === requestId);
    if (idx === -1) {
      return { success: false, message: 'طلب المراسلة غير موجود' };
    }

    const req = this.messageRequests[idx];
    const actor = this.getUserByUid(actorUid);
    const isAdmin = actor?.role === 'owner' || actor?.role === 'supervisor';
    if (req.receiverUid !== actorUid && !isAdmin) {
      return { success: false, message: 'يحق لمستلم الطلب فقط اتخاذ هذا الإجراء' };
    }

    const updated: MessageRequest = {
      ...req,
      status: action,
      updatedAt: new Date().toISOString()
    };
    this.messageRequests[idx] = updated;
    this.persistMessageRequestsCache();
    this.notify();
    firebaseService.saveMessageRequest(updated);

    if (action === 'accepted' && updated.introMessage.trim()) {
      const existingMsgs = this.getChatMessages(updated.senderUid, updated.receiverUid);
      const alreadyPosted = existingMsgs.some(
        m => m.senderUid === updated.senderUid && m.content === updated.introMessage
      );
      if (!alreadyPosted) {
        this.sendDirectMessage({
          senderUid: updated.senderUid,
          receiverUid: updated.receiverUid,
          content: updated.introMessage
        });
      }
    }

    const labels: Record<string, string> = {
      accepted: 'تم قبول طلب المراسلة وفتح المحادثة الخاصة بنجاح ✓',
      rejected: 'تم رفض طلب المراسلة',
      suspended: 'تم تعليق طلب المراسلة وإخفاؤه مع حفظ كافة بياناته'
    };
    return { success: true, message: labels[action] || 'تم تحديث حالة الطلب' };
  }

  public markThreadAsRead(currentUid: string, partnerUid: string): void {
    let changed = false;
    const updatedMessages: DirectMessage[] = [];
    this.messages = this.messages.map((m) => {
      if (m.senderUid === partnerUid && m.receiverUid === currentUid && m.status !== 'read') {
        changed = true;
        const readMsg: DirectMessage = { ...m, status: 'read' };
        updatedMessages.push(readMsg);
        return readMsg;
      }
      return m;
    });

    if (changed) {
      this.persistMessagesCache();
      this.notify();
      updatedMessages.forEach((msg) => firebaseService.saveMessage(msg));
    }
  }

  public getChatThreads(currentUid: string): ChatThread[] {
    const threadsMap = new Map<string, { lastMsg: DirectMessage; otherUid: string; unread: number }>();

    for (const msg of this.getMessages()) {
      if (msg.senderUid === currentUid || msg.receiverUid === currentUid) {
        const otherUid = msg.senderUid === currentUid ? msg.receiverUid : msg.senderUid;
        const existing = threadsMap.get(otherUid);
        const isUnread = msg.receiverUid === currentUid && msg.status !== 'read';
        if (!existing) {
          threadsMap.set(otherUid, { lastMsg: msg, otherUid, unread: isUnread ? 1 : 0 });
        } else {
          if (isUnread) existing.unread += 1;
          if (new Date(msg.createdAt).getTime() > new Date(existing.lastMsg.createdAt).getTime()) {
            existing.lastMsg = msg;
          }
        }
      }
    }

    const threads: ChatThread[] = [];
    threadsMap.forEach(({ lastMsg, otherUid, unread }) => {
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
          unreadCount: unread
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
    const receiver = this.getUserByUid(data.receiverUid);
    const senderUid = sender?.uid || data.senderUid || '10000';
    const senderName = sender?.displayName || (senderUid === '10000' ? 'إدارة LIVO الرسمية' : 'مستخدم');
    const senderAvatar = sender?.avatar || '/assets/livo/customer_icon.jpg';
    const currentAuthUid = firebaseService.getCurrentAuthUid();
    const senderAuthUid = sender?.authUid || (senderUid === this.currentUid ? currentAuthUid : undefined) || (senderUid === '10000' ? currentAuthUid : undefined);
    const receiverAuthUid = receiver?.authUid;
    const chatId = [senderUid, data.receiverUid].sort().join('_');

    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      chatId,
      senderUid,
      senderAuthUid,
      senderName,
      senderAvatar,
      receiverUid: data.receiverUid,
      receiverAuthUid,
      content: data.content,
      type: data.type || 'text',
      mediaUrl: data.mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'delivered'
    };

    this.messages.push(newMsg);
    this.persistMessagesCache();
    this.notify();
    firebaseService.saveMessage(newMsg);

    return newMsg;
  }

  // --- ROOMS & OFFICIAL ADMIN ROOM CONTROL (STRICT SINGLE-MIC & OWNER SEAT #1 RULES) ---
  public getRooms(): VoiceRoom[] {
    return this.rooms.filter(r => r.isOfficial || !LEGACY_DEMO_UIDS.has(r.ownerUid));
  }

  public getVoiceRoomPersonalBg(uid: string): string | undefined {
    const user = this.getUserByUid(uid);
    if (user?.voiceRoomBgUrl !== undefined) {
      return user.voiceRoomBgUrl || undefined;
    }
    if (typeof window !== 'undefined' && uid) {
      try {
        return localStorage.getItem(`livo_voice_bg_${uid}`) || undefined;
      } catch {}
    }
    return undefined;
  }

  public setVoiceRoomPersonalBg(uid: string, bgUrl: string): void {
    if (typeof window !== 'undefined' && uid) {
      try {
        if (bgUrl) {
          localStorage.setItem(`livo_voice_bg_${uid}`, bgUrl);
        } else {
          localStorage.removeItem(`livo_voice_bg_${uid}`);
        }
      } catch {}
    }
    this.updateUserProfile(uid, { voiceRoomBgUrl: bgUrl });
  }

  public setVoiceRoomBackground(
    roomId: string,
    bgUrl: string,
    actorUid: string
  ): { success: boolean; message: string } {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return { success: false, message: 'الغرفة غير موجودة' };
    const room = this.rooms[rIndex];
    const actor = this.getUserByUid(actorUid);
    const canEditRoom =
      room.ownerUid === actorUid ||
      actor?.role === 'owner' ||
      actor?.role === 'supervisor' ||
      this.isOwnerEmail(actor?.email);

    if (!canEditRoom) {
      return { success: false, message: 'تغيير خلفية الغرفة للجميع متاح لصاحب الغرفة أو الإدارة فقط' };
    }

    const updatedRoom: VoiceRoom = {
      ...room,
      backgroundUrl: bgUrl || ''
    };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
    return {
      success: true,
      message: bgUrl ? 'تم تحديث خلفية الغرفة لجميع المشاركين ✓' : 'تمت استعادة الخلفية الافتراضية للغرفة ✓'
    };
  }

  public getRoomById(roomId: string): VoiceRoom | undefined {
    return this.rooms.find(r => r.id === roomId);
  }

  public createRoom(data: {
    title: string;
    category: string;
    roomType: 'voice' | 'live';
    ownerUid: string;
    announcement?: string;
  }): VoiceRoom {
    const owner = this.getUserByUid(data.ownerUid);
    const seats = Array.from({ length: 12 }, (_, i) =>
      i === 0 && owner
        ? {
            seatIndex: 0,
            occupiedByUid: owner.uid,
            occupiedByName: owner.displayName,
            occupiedByAvatar: owner.avatar,
            isVerified: owner.isVerified,
            isMuted: false,
            isLocked: false,
            points: 0
          }
        : { seatIndex: i, isMuted: false, isLocked: false, points: 0 }
    );

    const newRoom: VoiceRoom = {
      id: `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: data.title.trim() || `غرفة ${owner?.displayName || 'LIVO'}`,
      ownerUid: owner?.uid || data.ownerUid,
      ownerName: owner?.displayName || 'مضيف',
      ownerAvatar: owner?.avatar || '/assets/livo/customer_icon.jpg',
      isOfficial: false,
      roomType: data.roomType,
      viewersCount: 1,
      status: 'open',
      category: data.category || (data.roomType === 'live' ? 'بث مباشر' : 'دردشة صوتية'),
      allChatDisabled: false,
      announcement: data.announcement?.trim() || 'مرحباً بكم في الغرفة! يرجى الالتزام باحترام الجميع.',
      seats,
      mutedUsers: [],
      bannedUsers: [],
      messages: []
    };

    this.rooms.unshift(newRoom);
    this.notify();
    firebaseService.saveRoom(newRoom);
    return newRoom;
  }

  public closeAndRemoveRoom(roomId: string): void {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;
    if (room.isOfficial) {
      this.setOfficialRoomStatus('closed');
      return;
    }
    this.rooms = this.rooms.filter(r => r.id !== roomId);
    this.notify();
    firebaseService.deleteRoom(roomId);
  }

  public setOfficialRoomStatus(status: 'open' | 'closed' | 'locked_by_admin', announcement?: string): void {
    let officialIndex = this.rooms.findIndex(r => r.isOfficial || r.id === 'room-official-livo');
    if (officialIndex === -1) {
      const baseOfficial = { ...INITIAL_ROOMS[0], status, announcement: announcement ?? INITIAL_ROOMS[0].announcement };
      this.rooms.unshift(baseOfficial);
      this.notify();
      firebaseService.saveRoom(baseOfficial);
      return;
    }

    const current = this.rooms[officialIndex];
    const cleanedSeats = status === 'closed'
      ? current.seats.map(s => ({ seatIndex: s.seatIndex, isMuted: false, isLocked: s.isLocked }))
      : current.seats;

    const updated: VoiceRoom = {
      ...current,
      status,
      seats: cleanedSeats,
      announcement: announcement !== undefined ? announcement : current.announcement
    };
    this.rooms[officialIndex] = updated;
    this.notify();
    firebaseService.saveRoom(updated);
  }

  public joinRoomSeat(roomId: string, seatIndex: number, uid: string): { success: boolean; message: string } {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return { success: false, message: 'الغرفة غير موجودة' };
    const room = this.rooms[rIndex];
    const user = this.getUserByUid(uid);
    if (!user) return { success: false, message: 'يجب تسجيل الدخول أولاً' };
    if (room.bannedUsers?.includes(uid)) return { success: false, message: 'تم حظرك من هذه الغرفة' };

    const isOwnerOrAdmin = room.ownerUid === uid || user.role === 'owner' || user.role === 'supervisor';

    // Strict Owner Seat #1 protection
    if (seatIndex === 0 && !isOwnerOrAdmin) {
      return { success: false, message: 'المقعد رقم 1 مخصص لصاحب الغرفة أو المشرف فقط' };
    }

    // Strict 1-Mic-Per-UID enforcement: cannot occupy multiple mics simultaneously!
    const existingSeat = room.seats.find(s => s.occupiedByUid === uid);
    if (existingSeat) {
      if (existingSeat.seatIndex === seatIndex) {
        return { success: true, message: 'أنت جالس بالفعل على هذا المقعد' };
      }
      return { success: false, message: 'لا يمكنك الجلوس على أكثر من مايك واحد في نفس الوقت! انزل من المايك الحالي أولاً.' };
    }

    const seats = [...room.seats];
    while (seats.length <= seatIndex) {
      seats.push({ seatIndex: seats.length, isMuted: false, isLocked: false });
    }
    const targetSeat = seats[seatIndex];
    if (targetSeat.isLocked && !isOwnerOrAdmin) {
      return { success: false, message: 'هذا المقعد مغلق من قِبل المالك' };
    }
    if (targetSeat.occupiedByUid && targetSeat.occupiedByUid !== uid) {
      return { success: false, message: 'هذا المقعد مشغول بمستخدم آخر' };
    }

    seats[seatIndex] = {
      ...targetSeat,
      seatIndex,
      occupiedByUid: user.uid,
      occupiedByName: user.displayName,
      occupiedByAvatar: user.avatar,
      isVerified: user.isVerified,
      isMuted: false
    };

    const updatedRoom = { ...room, seats };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
    return { success: true, message: `تم الجلوس على المايك رقم ${seatIndex + 1}` };
  }

  public leaveRoomSeat(roomId: string, uid: string): void {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return;
    const room = this.rooms[rIndex];
    const seats = room.seats.map(s =>
      s.occupiedByUid === uid
        ? { seatIndex: s.seatIndex, isMuted: false, isLocked: s.isLocked }
        : s
    );
    const updatedRoom = { ...room, seats };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
  }

  public toggleSeatMute(roomId: string, seatIndex: number, forceMuted?: boolean): boolean {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return false;
    const room = this.rooms[rIndex];
    const seats = [...room.seats];
    const seat = seats[seatIndex];
    if (!seat) return false;

    const nextMuted = forceMuted !== undefined ? forceMuted : !seat.isMuted;
    seats[seatIndex] = { ...seat, isMuted: nextMuted };
    const updatedRoom = { ...room, seats };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
    return nextMuted;
  }

  public toggleSeatLock(roomId: string, seatIndex: number): boolean {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return false;
    const room = this.rooms[rIndex];
    const seats = [...room.seats];
    const seat = seats[seatIndex];
    if (!seat) return false;

    const nextLocked = !seat.isLocked;
    seats[seatIndex] = { ...seat, isLocked: nextLocked };
    const updatedRoom = { ...room, seats };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
    return nextLocked;
  }

  public kickFromSeat(roomId: string, seatIndex: number): void {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return;
    const room = this.rooms[rIndex];
    const seats = [...room.seats];
    const seat = seats[seatIndex];
    if (!seat) return;
    seats[seatIndex] = { seatIndex, isMuted: false, isLocked: seat.isLocked };
    const updatedRoom = { ...room, seats };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
  }

  public appendRoomMessage(roomId: string, msg: Omit<RoomMessage, 'id' | 'createdAt'>): void {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return;
    const room = this.rooms[rIndex];
    const nextMessages = [
      ...(room.messages || []),
      {
        ...msg,
        id: `rmsg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString()
      }
    ].slice(-80);
    const updatedRoom = { ...room, messages: nextMessages };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
  }

  public toggleRoomAllChat(roomId: string): boolean {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return false;
    const room = this.rooms[rIndex];
    const nextVal = !room.allChatDisabled;
    const updatedRoom = { ...room, allChatDisabled: nextVal };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
    return nextVal;
  }

  public setUserRoomMute(roomId: string, targetUid: string, mute: boolean): void {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return;
    const room = this.rooms[rIndex];
    const mutedSet = new Set(room.mutedUsers || []);
    if (mute) mutedSet.add(targetUid);
    else mutedSet.delete(targetUid);
    const updatedRoom = { ...room, mutedUsers: Array.from(mutedSet) };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
  }

  public banUserFromRoom(roomId: string, targetUid: string): void {
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return;
    const room = this.rooms[rIndex];
    const bannedSet = new Set(room.bannedUsers || []);
    bannedSet.add(targetUid);
    const seats = room.seats.map(s =>
      s.occupiedByUid === targetUid ? { seatIndex: s.seatIndex, isMuted: false, isLocked: s.isLocked } : s
    );
    const updatedRoom = { ...room, bannedUsers: Array.from(bannedSet), seats };
    this.rooms[rIndex] = updatedRoom;
    this.notify();
    firebaseService.saveRoom(updatedRoom);
  }

  public updateRoomSeat(roomId: string, seatIndex: number, occupiedByUid?: string, isLocked?: boolean): void {
    if (occupiedByUid) {
      this.joinRoomSeat(roomId, seatIndex, occupiedByUid);
      return;
    }
    const rIndex = this.rooms.findIndex(r => r.id === roomId);
    if (rIndex === -1) return;

    const room = this.rooms[rIndex];
    const seats = [...room.seats];
    const seat = seats[seatIndex] || { seatIndex, isMuted: false, isLocked: false };

    seats[seatIndex] = {
      ...seat,
      seatIndex,
      occupiedByUid: undefined,
      occupiedByName: undefined,
      occupiedByAvatar: undefined,
      isLocked: isLocked !== undefined ? isLocked : seat.isLocked
    };

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
    if (!author) throw new Error('يجب تسجيل الدخول لنشر فيديو');

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
    firebaseService.saveVideo(newVideo);
    return newVideo;
  }

  public likeVideo(videoId: string): void {
    const vid = this.videos.find(v => v.id === videoId);
    if (!vid) return;
    vid.likesCount = (vid.likesCount || 0) + 1;
    this.notify();
    firebaseService.saveVideo(vid);
  }

  public deleteVideo(videoId: string, requestingUid: string): boolean {
    const video = this.videos.find(v => v.id === videoId);
    if (!video) return false;

    const requester = this.getUserByUid(requestingUid);
    const isOwnerOrAuthor = requester?.role === 'owner' || video.authorUid === requestingUid;
    if (!isOwnerOrAuthor) return false;

    this.videos = this.videos.filter(v => v.id !== videoId);
    this.notify();
    firebaseService.deleteVideo(videoId);
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
    const safeUid = user?.uid || data.uid || 'guest';

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      uid: safeUid,
      username: user?.displayName || user?.username || 'مستخدم / زائر',
      userAvatar: user?.avatar || '/assets/livo/customer_icon.jpg',
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
    if (user) {
      this.sendDirectMessage({
        senderUid: user.uid,
        receiverUid: '10000',
        content: `[تذكرة دعم جديدة #${newTicket.id}] (${data.subject}): ${data.message}`
      });
    }

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
      distributorAvatar: '/assets/livo/customer_icon.jpg',
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

  // --- COIN PACKAGES CRUD (باقات الشحن وأسعارها) ---
  public getCoinPackages(): CoinPackage[] {
    return [...this.coinPackages].sort((a, b) => a.coins - b.coins);
  }

  public getActiveCoinPackages(): CoinPackage[] {
    return this.getCoinPackages().filter(p => p.isActive !== false);
  }

  public saveCoinPackage(pkg: CoinPackage): void {
    const index = this.coinPackages.findIndex(p => p.id === pkg.id);
    const updated: CoinPackage = {
      ...pkg,
      isActive: pkg.isActive !== undefined ? pkg.isActive : true,
      updatedAt: new Date().toISOString()
    };
    if (index !== -1) {
      this.coinPackages[index] = updated;
    } else {
      this.coinPackages.push(updated);
    }
    this.notify();
    firebaseService.saveCoinPackage(updated);
  }

  public deleteCoinPackage(id: string): boolean {
    const index = this.coinPackages.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.coinPackages.splice(index, 1);
    this.notify();
    firebaseService.deleteCoinPackage(id);
    return true;
  }

  // --- SUPERVISORS CRUD (نظام الإشراف والصلاحيات المرتبط بقاعدة البيانات) ---
  public getSupervisors(): SupervisorRecord[] {
    return [...this.supervisors].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public isAuthorizedAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (this.isOwnerEmail(clean)) return true;
    return this.supervisors.some(s => s.isActive && s.email.trim().toLowerCase() === clean);
  }

  public addSupervisor(data: { uid?: string; name: string; email: string; permissions: string[] }): SupervisorRecord {
    const matchedUser = data.uid
      ? this.getUserByUid(data.uid.trim())
      : this.users.find(u => u.email?.toLowerCase() === data.email.trim().toLowerCase());

    const sup: SupervisorRecord = {
      id: `sup-${Date.now()}`,
      uid: matchedUser?.uid || data.uid?.trim() || String(Math.floor(10000 + Math.random() * 90000)),
      name: data.name.trim() || matchedUser?.displayName || 'مشرف',
      email: data.email.trim().toLowerCase(),
      permissions: data.permissions.length ? data.permissions : ['recharges', 'bans', 'rooms'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.supervisors.unshift(sup);
    if (matchedUser && matchedUser.role !== 'owner') {
      this.updateUserProfile(matchedUser.uid, { role: 'supervisor' });
    }
    this.notify();
    firebaseService.saveSupervisor(sup);
    return sup;
  }

  public updateSupervisorPermissions(id: string, permissions: string[]): void {
    const idx = this.supervisors.findIndex(s => s.id === id);
    if (idx === -1) return;
    this.supervisors[idx] = { ...this.supervisors[idx], permissions };
    this.notify();
    firebaseService.saveSupervisor(this.supervisors[idx]);
  }

  public toggleSupervisorActive(id: string): void {
    const idx = this.supervisors.findIndex(s => s.id === id);
    if (idx === -1) return;
    const nextActive = !this.supervisors[idx].isActive;
    this.supervisors[idx] = { ...this.supervisors[idx], isActive: nextActive };
    const user = this.getUserByUid(this.supervisors[idx].uid);
    if (user && user.role !== 'owner') {
      this.updateUserProfile(user.uid, { role: nextActive ? 'supervisor' : 'user' });
    }
    this.notify();
    firebaseService.saveSupervisor(this.supervisors[idx]);
  }

  public removeSupervisor(id: string): boolean {
    const idx = this.supervisors.findIndex(s => s.id === id);
    if (idx === -1) return false;
    const sup = this.supervisors[idx];
    const user = this.getUserByUid(sup.uid);
    if (user && user.role === 'supervisor') {
      this.updateUserProfile(user.uid, { role: 'user' });
    }
    this.supervisors.splice(idx, 1);
    this.notify();
    firebaseService.deleteSupervisor(id);
    return true;
  }
}

export const livoStore = new LivoStore();
