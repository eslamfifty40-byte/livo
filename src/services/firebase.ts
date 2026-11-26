/**
 * LIVO Firebase Architecture & Real-Time Sync Engine
 * Connects Customer App and Admin App to a unified Firestore & Auth project
 * Real-time bidirectional listeners (onSnapshot) propagate instant changes
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  getDocFromServer,
  deleteField,
  FieldValue,
  Unsubscribe
} from 'firebase/firestore';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { compressImageForFirestore, CompressImageOptions } from '../utils/imageCompression';
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
  GiftSupportLog,
  SplashBannerConfig,
  InAppNotification,
  RoomRtcSignal
} from '../types';

/**
 * Recursively strips undefined keys safely (cycle & depth guarded, preserves FieldValue/Date)
 * so Firestore setDoc never throws "Maximum call stack size exceeded" or fails on optional fields.
 */
function stripUndefined<T>(value: T, depth = 0, seen = new WeakSet<object>()): T {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date || value instanceof FieldValue) {
    return value;
  }
  if (depth > 25) {
    return value;
  }
  if (seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item, depth + 1, seen)) as unknown as T;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) {
      clean[k] = stripUndefined(v, depth + 1, seen);
    }
  }
  return clean as T;
}

// 1. Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Connect directly to the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Keep session persisted reliably across reloads & mobile redirect flows
setPersistence(auth, browserLocalPersistence).catch(() => {});

// 2. Strict Error Handling conforming to FirestoreErrorInfo (SKILL.md)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection on Boot (SKILL.md)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is offline or checking connection.');
    }
    return false;
  }
}
testConnection();

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  RECHARGE_REQUESTS: 'recharge_requests',
  COIN_AUDITS: 'coin_audits',
  MESSAGES: 'messages',
  MESSAGE_REQUESTS: 'message_requests',
  ROOMS: 'rooms',
  AGENCIES: 'agencies',
  VERIFICATIONS: 'verifications',
  WITHDRAWALS: 'withdrawals',
  BANS: 'bans',
  VIDEOS: 'videos',
  ADVERTISEMENTS: 'advertisements',
  SUPPORT_TICKETS: 'support_tickets',
  LEVEL_CONFIGS: 'level_configs',
  DISTRIBUTORS: 'distributors',
  AGENT_TRANSFERS: 'agent_transfers',
  LEVEL_PROMOTIONS: 'level_promotions',
  PAYMENT_METHODS: 'payment_methods',
  GIFTS: 'gifts',
  STORE_ITEMS: 'store_items',
  RECHARGE_CODES: 'recharge_codes',
  COIN_PACKAGES: 'coin_packages',
  SUPERVISORS: 'supervisors',
  STAFF_AUTH: 'staff_auth',
  GIFT_LOGS: 'gift_logs',
  SPLASH_BANNERS: 'splash_banners',
  NOTIFICATIONS: 'notifications',
  ROOM_RTC_SIGNALS: 'room_rtc_signals'
};

// 4. Firebase Service Implementation
export class FirebaseService {
  private activeListeners: Unsubscribe[] = [];

  /**
   * Real-time subscription to Users collection
   */
  public subscribeToUsers(onUpdate: (users: UserProfile[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.USERS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as UserProfile);
        });
        onUpdate(users);
      },
      (error) => {
        console.warn('Error listening to users collection:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Recharge Requests
   */
  public subscribeToRechargeRequests(onUpdate: (requests: RechargeRequest[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.RECHARGE_REQUESTS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const requests: RechargeRequest[] = [];
        snapshot.forEach((docSnap) => {
          requests.push(docSnap.data() as RechargeRequest);
        });
        // Sort latest first
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(requests);
      },
      (error) => {
        console.warn('Error listening to recharge requests:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Voice Rooms
   */
  public subscribeToRooms(onUpdate: (rooms: VoiceRoom[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.ROOMS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rooms: VoiceRoom[] = [];
        snapshot.forEach((docSnap) => {
          rooms.push(docSnap.data() as VoiceRoom);
        });
        onUpdate(rooms);
      },
      (error) => {
        console.warn('Error listening to rooms:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Messages.
   * Uses targeted queries for authenticated participants (and full collection for owner/admin)
   * so Firestore Security Rules never reject the query with PERMISSION_DENIED.
   */
  public subscribeToMessages(
    onUpdate: (messages: DirectMessage[]) => void,
    options?: { authUid?: string; isOwner?: boolean }
  ): Unsubscribe {
    const authUid = options?.authUid || auth.currentUser?.uid;
    const isOwner = Boolean(options?.isOwner);

    if (!authUid) {
      return () => {};
    }

    if (isOwner) {
      const q = collection(db, COLLECTIONS.MESSAGES);
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const msgs: DirectMessage[] = [];
          snapshot.forEach((docSnap) => {
            msgs.push(docSnap.data() as DirectMessage);
          });
          msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          onUpdate(msgs);
        },
        (error) => {
          console.warn('Error listening to messages:', error.message);
        }
      );
      this.activeListeners.push(unsub);
      return unsub;
    }

    const merged = new Map<string, DirectMessage>();
    const emit = () => {
      const list = Array.from(merged.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      onUpdate(list);
    };

    const qSent = query(collection(db, COLLECTIONS.MESSAGES), where('senderAuthUid', '==', authUid));
    const qRecv = query(collection(db, COLLECTIONS.MESSAGES), where('receiverAuthUid', '==', authUid));

    const unsubSent = onSnapshot(
      qSent,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as DirectMessage;
          merged.set(item.id, item);
        });
        emit();
      },
      (error) => {
        console.warn('Error listening to sent messages:', error.message);
      }
    );

    const unsubRecv = onSnapshot(
      qRecv,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as DirectMessage;
          merged.set(item.id, item);
        });
        emit();
      },
      (error) => {
        console.warn('Error listening to received messages:', error.message);
      }
    );

    const combinedUnsub = () => {
      unsubSent();
      unsubRecv();
    };
    this.activeListeners.push(combinedUnsub);
    return combinedUnsub;
  }

  /**
   * Real-time subscription to Message Requests (pending / accepted / rejected / suspended)
   */
  public subscribeToMessageRequests(
    onUpdate: (requests: MessageRequest[]) => void,
    options?: { authUid?: string; isOwner?: boolean }
  ): Unsubscribe {
    const authUid = options?.authUid || auth.currentUser?.uid;
    const isOwner = Boolean(options?.isOwner);

    if (!authUid) {
      return () => {};
    }

    if (isOwner) {
      const q = collection(db, COLLECTIONS.MESSAGE_REQUESTS);
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const reqs: MessageRequest[] = [];
          snapshot.forEach((docSnap) => {
            reqs.push(docSnap.data() as MessageRequest);
          });
          reqs.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
          onUpdate(reqs);
        },
        (error) => {
          console.warn('Error listening to message requests:', error.message);
        }
      );
      this.activeListeners.push(unsub);
      return unsub;
    }

    const merged = new Map<string, MessageRequest>();
    const emit = () => {
      const list = Array.from(merged.values()).sort(
        (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
      onUpdate(list);
    };

    const qSent = query(collection(db, COLLECTIONS.MESSAGE_REQUESTS), where('senderAuthUid', '==', authUid));
    const qRecv = query(collection(db, COLLECTIONS.MESSAGE_REQUESTS), where('receiverAuthUid', '==', authUid));

    const unsubSent = onSnapshot(
      qSent,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as MessageRequest;
          merged.set(item.id, item);
        });
        emit();
      },
      (error) => {
        console.warn('Error listening to sent message requests:', error.message);
      }
    );

    const unsubRecv = onSnapshot(
      qRecv,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as MessageRequest;
          merged.set(item.id, item);
        });
        emit();
      },
      (error) => {
        console.warn('Error listening to incoming message requests:', error.message);
      }
    );

    const combinedUnsub = () => {
      unsubSent();
      unsubRecv();
    };
    this.activeListeners.push(combinedUnsub);
    return combinedUnsub;
  }

  /**
   * Real-time subscription to Agencies
   */
  public subscribeToAgencies(onUpdate: (agencies: AgencyApplication[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.AGENCIES);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: AgencyApplication[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as AgencyApplication);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to agencies:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Verifications
   */
  public subscribeToVerifications(onUpdate: (vers: BlueVerificationRequest[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.VERIFICATIONS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: BlueVerificationRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as BlueVerificationRequest);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to verifications:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Withdrawals
   */
  public subscribeToWithdrawals(onUpdate: (wths: WithdrawalRequest[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.WITHDRAWALS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: WithdrawalRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as WithdrawalRequest);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to withdrawals:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Bans
   */
  public subscribeToBans(onUpdate: (bans: BanRecord[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.BANS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: BanRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as BanRecord);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to bans:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Coin Audits
   */
  public subscribeToCoinAudits(onUpdate: (audits: CoinAuditRecord[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.COIN_AUDITS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: CoinAuditRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CoinAuditRecord);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to coin audits:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Advertisements
   */
  public subscribeToAdvertisements(onUpdate: (ads: Advertisement[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.ADVERTISEMENTS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Advertisement[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Advertisement);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to advertisements:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Real-time subscription to Support Tickets
   */
  public subscribeToSupportTickets(onUpdate: (tickets: SupportTicket[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.SUPPORT_TICKETS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: SupportTicket[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SupportTicket);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to support tickets:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Lookup user directly from Firestore by UID (handles 10000-100000+ server lookup)
   */
  public async findUserByUid(uid: string): Promise<UserProfile | null> {
    const cleanUid = uid.trim();
    if (!cleanUid) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, cleanUid));
      if (snap.exists()) return snap.data() as UserProfile;
      const q = query(collection(db, COLLECTIONS.USERS), where('uid', '==', cleanUid), limit(1));
      const qs = await getDocs(q);
      if (!qs.empty) return qs.docs[0].data() as UserProfile;
      return null;
    } catch (e) {
      console.warn('findUserByUid error:', e);
      return null;
    }
  }

  /**
   * Lookup user directly from Firestore by Firebase Auth UID or verified email
   */
  public async findUserByAuthUidOrEmail(authUid: string, email?: string | null): Promise<UserProfile | null> {
    try {
      if (authUid) {
        const qAuth = query(collection(db, COLLECTIONS.USERS), where('authUid', '==', authUid), limit(1));
        const snapAuth = await getDocs(qAuth);
        if (!snapAuth.empty) {
          return snapAuth.docs[0].data() as UserProfile;
        }
      }
      const cleanEmail = email?.trim().toLowerCase();
      if (cleanEmail) {
        const qEmail = query(collection(db, COLLECTIONS.USERS), where('email', '==', cleanEmail), limit(5));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          const allMatches = snapEmail.docs.map((d) => d.data() as UserProfile);
          return allMatches.find((u) => !u.isBanned) || allMatches[0];
        }
      }
      return null;
    } catch (e) {
      console.warn('findUserByAuthUidOrEmail error:', e);
      return null;
    }
  }

  /**
   * Lookup active ban records directly from Firestore by UID or deviceId
   */
  public async findActiveBanForUser(uid?: string, deviceId?: string): Promise<BanRecord | null> {
    try {
      const checks: Promise<BanRecord | null>[] = [];
      if (uid?.trim()) {
        const qUid = query(collection(db, COLLECTIONS.BANS), where('uid', '==', uid.trim()), limit(10));
        checks.push(
          getDocs(qUid).then((snap) => {
            const matches = snap.docs
              .map((d) => d.data() as BanRecord)
              .filter((b) => b.status === 'active');
            return matches[0] || null;
          })
        );
      }
      if (deviceId?.trim()) {
        const qDev = query(collection(db, COLLECTIONS.BANS), where('deviceId', '==', deviceId.trim()), limit(10));
        checks.push(
          getDocs(qDev).then((snap) => {
            const matches = snap.docs
              .map((d) => d.data() as BanRecord)
              .filter((b) => b.status === 'active' && (b.banType === 'device' || b.banType === 'both'));
            return matches[0] || null;
          })
        );
      }
      if (checks.length === 0) return null;
      const results = await Promise.all(checks);
      return results.find(Boolean) || null;
    } catch (e) {
      console.warn('findActiveBanForUser error:', e);
      return null;
    }
  }

  /**
   * Write or update user profile in Firestore
   */
  public async saveUserProfile(user: UserProfile): Promise<boolean> {
    try {
      const payload: Record<string, unknown> = {
        ...(stripUndefined(user) as unknown as Record<string, unknown>),
      };
      if (user.isBanned === false && !user.banDetails) {
        payload.banDetails = deleteField();
      }
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), payload, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving user profile to Firestore:', e);
      return false;
    }
  }

  /**
   * Rule-compliant partial field update (e.g. cross-user followersCount / diamonds / coins)
   */
  public async patchUserFields(uid: string, fields: Partial<UserProfile>): Promise<boolean> {
    if (!uid?.trim()) return false;
    try {
      const payload = stripUndefined(fields) as unknown as Record<string, unknown>;
      if (Object.keys(payload).length === 0) return true;
      await updateDoc(doc(db, COLLECTIONS.USERS, uid.trim()), payload);
      return true;
    } catch (e) {
      console.error('Error patching user fields in Firestore:', e);
      return false;
    }
  }

  public async deleteUserByUid(uid: string): Promise<boolean> {
    if (!auth.currentUser || !uid?.trim()) return false;
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, uid.trim()));
      return true;
    } catch (e) {
      console.error('Error deleting user profile from Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update recharge request
   */
  public async saveRechargeRequest(req: RechargeRequest): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.RECHARGE_REQUESTS, req.id), stripUndefined(req), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving recharge request to Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update coin audit log
   */
  public async saveCoinAudit(audit: CoinAuditRecord): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.COIN_AUDITS, audit.id), stripUndefined(audit));
      return true;
    } catch (e) {
      console.error('Error saving coin audit to Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update message
   */
  public async saveMessage(msg: DirectMessage): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.MESSAGES, msg.id), stripUndefined(msg), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving message to Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update message request
   */
  public async saveMessageRequest(req: MessageRequest): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.MESSAGE_REQUESTS, req.id), stripUndefined(req), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving message request to Firestore:', e);
      return false;
    }
  }

  public async deleteMessageRequest(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MESSAGE_REQUESTS, id));
      return true;
    } catch (e) {
      console.error('Error deleting message request from Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update room
   */
  public async saveRoom(room: VoiceRoom): Promise<boolean> {
    if (!auth.currentUser) {
      return false;
    }
    const cleanId = (room.id || '').trim().slice(0, 64);
    if (!cleanId || !/^[a-zA-Z0-9_\-.@]+$/.test(cleanId)) {
      return false;
    }
    const cleanTitle = (room.title || 'غرفة LIVO').trim().slice(0, 180) || 'غرفة LIVO';
    const cleanOwnerUid = (room.ownerUid || '10000').trim().slice(0, 64) || '10000';
    const validStatuses: Array<VoiceRoom['status']> = ['open', 'closed', 'locked_by_admin'];
    const cleanStatus: VoiceRoom['status'] = validStatuses.includes(room.status) ? room.status : 'open';
    const normalizedRoom: VoiceRoom = {
      ...room,
      id: cleanId,
      title: cleanTitle,
      ownerUid: cleanOwnerUid,
      isOfficial: Boolean(room.isOfficial || cleanId === 'room-official-livo'),
      status: cleanStatus
    };
    try {
      await setDoc(doc(db, COLLECTIONS.ROOMS, cleanId), stripUndefined(normalizedRoom), { merge: true });
      return true;
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        console.warn('Firestore saveRoom permission-denied:', {
          roomId: cleanId,
          authUid: auth.currentUser?.uid,
          ownerUid: cleanOwnerUid,
          isOfficial: normalizedRoom.isOfficial
        });
      } else {
        console.error('Error saving room to Firestore:', e);
      }
      return false;
    }
  }

  public async deleteRoom(roomId: string): Promise<boolean> {
    if (!auth.currentUser) {
      return false;
    }
    try {
      await deleteDoc(doc(db, COLLECTIONS.ROOMS, roomId));
      return true;
    } catch (e: any) {
      console.error('Error deleting room from Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update agency
   */
  public async saveAgency(agency: AgencyApplication): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.AGENCIES, agency.id), stripUndefined(agency), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving agency to Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update verification
   */
  public async saveVerification(ver: BlueVerificationRequest): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.VERIFICATIONS, ver.id), stripUndefined(ver), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving verification to Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update withdrawal
   */
  public async saveWithdrawal(wth: WithdrawalRequest): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.WITHDRAWALS, wth.id), stripUndefined(wth), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving withdrawal to Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update ban
   */
  public async saveBan(ban: BanRecord): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.BANS, ban.id), stripUndefined(ban), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving ban to Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update advertisement
   */
  public async saveAdvertisement(ad: Advertisement): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, ad.id), stripUndefined(ad), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving advertisement to Firestore:', e);
      return false;
    }
  }

  /**
   * Delete advertisement
   */
  public async deleteAdvertisement(adId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, adId));
      return true;
    } catch (e) {
      console.error('Error deleting advertisement from Firestore:', e);
      return false;
    }
  }

  /**
   * Write or update support ticket
   */
  public async saveSupportTicket(ticket: SupportTicket): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticket.id), stripUndefined(ticket), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving support ticket to Firestore:', e);
      return false;
    }
  }

  /**
   * Delete support ticket
   */
  public async deleteSupportTicket(ticketId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId));
      return true;
    } catch (e) {
      console.error('Error deleting support ticket from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Level Configurations (0 to 50)
   */
  public subscribeToLevelConfigs(onUpdate: (configs: LevelConfig[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.LEVEL_CONFIGS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: LevelConfig[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as LevelConfig);
        });
        list.sort((a, b) => a.level - b.level);
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to level configs:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Save or update individual level configuration in Firestore
   */
  public async saveLevelConfig(config: LevelConfig): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.LEVEL_CONFIGS, `lvl_${config.level}`), stripUndefined(config), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving level config to Firestore:', e);
      return false;
    }
  }

  /**
   * Batch seed or save all 0-50 levels
   */
  public async saveLevelConfigs(configs: LevelConfig[]): Promise<boolean> {
    try {
      for (const cfg of configs) {
        await setDoc(doc(db, COLLECTIONS.LEVEL_CONFIGS, `lvl_${cfg.level}`), stripUndefined(cfg), { merge: true });
      }
      return true;
    } catch (e) {
      console.error('Error saving batch level configs to Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Distributors under a specific distributor agent
   */
  public subscribeToDistributors(onUpdate: (distributors: DistributorRecord[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.DISTRIBUTORS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: DistributorRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as DistributorRecord);
        });
        list.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to distributors:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Save distributor record
   */
  public async saveDistributor(distributor: DistributorRecord): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.DISTRIBUTORS, distributor.id), stripUndefined(distributor), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving distributor to Firestore:', e);
      return false;
    }
  }

  /**
   * Delete distributor record
   */
  public async deleteDistributor(distributorId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.DISTRIBUTORS, distributorId));
      return true;
    } catch (e) {
      console.error('Error deleting distributor from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Agent Transfers
   */
  public subscribeToAgentTransfers(onUpdate: (transfers: AgentTransferRecord[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.AGENT_TRANSFERS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: AgentTransferRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as AgentTransferRecord);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to agent transfers:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  /**
   * Save agent transfer record
   */
  public async saveAgentTransfer(transfer: AgentTransferRecord): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.AGENT_TRANSFERS, transfer.id), stripUndefined(transfer));
      return true;
    } catch (e) {
      console.error('Error saving agent transfer to Firestore:', e);
      return false;
    }
  }

  /**
   * Save level promotion audit
   */
  public async saveLevelPromotion(record: LevelPromotionRecord): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.LEVEL_PROMOTIONS, record.id), stripUndefined(record));
      return true;
    } catch (e) {
      console.error('Error saving level promotion audit to Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Payment Methods (Vodafone Cash, InstaPay, Electronic Wallets)
   */
  public subscribeToPaymentMethods(onUpdate: (methods: PaymentMethodConfig[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.PAYMENT_METHODS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: PaymentMethodConfig[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as PaymentMethodConfig);
        });
        list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to payment methods:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async savePaymentMethod(method: PaymentMethodConfig): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, method.id), stripUndefined(method), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving payment method to Firestore:', e);
      return false;
    }
  }

  public async deletePaymentMethod(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, id));
      return true;
    } catch (e) {
      console.error('Error deleting payment method from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Animated Gifts
   */
  public subscribeToGifts(onUpdate: (gifts: GiftItem[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.GIFTS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: GiftItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as GiftItem);
        });
        list.sort((a, b) => b.coins - a.coins);
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to gifts:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveGift(gift: GiftItem): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.GIFTS, gift.id), stripUndefined(gift), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving gift to Firestore:', e);
      return false;
    }
  }

  public async deleteGift(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.GIFTS, id));
      return true;
    } catch (e) {
      console.error('Error deleting gift from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Store Items (Frames and Entrances)
   */
  public subscribeToStoreItems(onUpdate: (items: StoreItem[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.STORE_ITEMS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: StoreItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as StoreItem);
        });
        list.sort((a, b) => b.priceCoins - a.priceCoins);
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to store items:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveStoreItem(item: StoreItem): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.STORE_ITEMS, item.id), stripUndefined(item), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving store item to Firestore:', e);
      return false;
    }
  }

  public async deleteStoreItem(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.STORE_ITEMS, id));
      return true;
    } catch (e) {
      console.error('Error deleting store item from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Recharge Voucher Codes
   */
  public subscribeToRechargeCodes(onUpdate: (codes: RechargeCode[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.RECHARGE_CODES);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: RechargeCode[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as RechargeCode);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to recharge codes:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveRechargeCode(code: RechargeCode): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.RECHARGE_CODES, code.id), stripUndefined(code), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving recharge code to Firestore:', e);
      return false;
    }
  }

  public async deleteRechargeCode(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.RECHARGE_CODES, id));
      return true;
    } catch (e) {
      console.error('Error deleting recharge code from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Coin Packages
   */
  public subscribeToCoinPackages(onUpdate: (packages: CoinPackage[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.COIN_PACKAGES);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: CoinPackage[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CoinPackage);
        });
        list.sort((a, b) => a.coins - b.coins);
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to coin packages:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveCoinPackage(pkg: CoinPackage): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.COIN_PACKAGES, pkg.id), stripUndefined(pkg), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving coin package to Firestore:', e);
      return false;
    }
  }

  public async deleteCoinPackage(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.COIN_PACKAGES, id));
      return true;
    } catch (e) {
      console.error('Error deleting coin package from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Supervisors
   */
  public subscribeToSupervisors(onUpdate: (supervisors: SupervisorRecord[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.SUPERVISORS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: SupervisorRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SupervisorRecord);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to supervisors:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveSupervisor(sup: SupervisorRecord): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.SUPERVISORS, sup.id), stripUndefined(sup), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving supervisor to Firestore:', e);
      return false;
    }
  }

  public async deleteSupervisor(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SUPERVISORS, id));
      return true;
    } catch (e) {
      console.error('Error deleting supervisor from Firestore:', e);
      return false;
    }
  }

  public async saveStaffAuth(
    authUid: string,
    data: { authUid: string; role: 'owner' | 'supervisor'; email?: string; isActive: boolean; updatedAt: string }
  ): Promise<boolean> {
    if (!authUid || !auth.currentUser) return false;
    try {
      await setDoc(doc(db, COLLECTIONS.STAFF_AUTH, authUid), stripUndefined(data), { merge: true });
      return true;
    } catch (e) {
      console.warn('Could not sync staff_auth doc:', e);
      return false;
    }
  }

  public async deleteStaffAuth(authUid: string): Promise<boolean> {
    if (!authUid || !auth.currentUser) return false;
    try {
      await deleteDoc(doc(db, COLLECTIONS.STAFF_AUTH, authUid));
      return true;
    } catch (e) {
      console.warn('Could not delete staff_auth doc:', e);
      return false;
    }
  }

  public sanitizeEmail(email?: string | null): string {
    if (!email) return '';
    return email
      .replace(/[\s\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00A0]/g, '')
      .toLowerCase();
  }

  public async checkStaffAuthorization(
    email?: string | null,
    authUid?: string | null
  ): Promise<{ isAuthorized: boolean; role?: 'owner' | 'supervisor' }> {
    const cleanEmail = this.sanitizeEmail(email);
    try {
      if (authUid) {
        const uidSnap = await getDoc(doc(db, COLLECTIONS.STAFF_AUTH, authUid));
        if (uidSnap.exists()) {
          const d = uidSnap.data() as { role?: string; isActive?: boolean };
          if (d?.isActive && (d.role === 'owner' || d.role === 'supervisor')) {
            return { isAuthorized: true, role: d.role };
          }
        }
      }
      if (cleanEmail) {
        const emailSnap = await getDoc(doc(db, COLLECTIONS.STAFF_AUTH, cleanEmail));
        if (emailSnap.exists()) {
          const d = emailSnap.data() as { role?: string; isActive?: boolean };
          if (d?.isActive && (d.role === 'owner' || d.role === 'supervisor')) {
            return { isAuthorized: true, role: d.role };
          }
        }
        const supQ = query(
          collection(db, COLLECTIONS.SUPERVISORS),
          where('email', '==', cleanEmail),
          limit(5)
        );
        const supDocs = await getDocs(supQ);
        for (const sDoc of supDocs.docs) {
          const sup = sDoc.data() as SupervisorRecord;
          if (sup?.isActive && this.sanitizeEmail(sup.email) === cleanEmail) {
            return { isAuthorized: true, role: 'supervisor' };
          }
        }
      }
    } catch (e) {
      console.warn('Staff authorization check fallback:', e);
    }
    return { isAuthorized: false };
  }

  /**
   * Real-time subscription to genuine User Videos
   */
  public subscribeToVideos(onUpdate: (videos: VideoPost[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.VIDEOS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: VideoPost[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as VideoPost);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to videos:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveVideo(video: VideoPost): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.VIDEOS, video.id), stripUndefined(video), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving video to Firestore:', e);
      return false;
    }
  }

  public async patchVideoStats(
    videoId: string,
    stats: Partial<Pick<VideoPost, 'likesCount' | 'commentsCount'>>
  ): Promise<boolean> {
    if (!videoId?.trim()) return false;
    try {
      await updateDoc(doc(db, COLLECTIONS.VIDEOS, videoId.trim()), stripUndefined(stats));
      return true;
    } catch (e) {
      console.error('Error patching video stats in Firestore:', e);
      return false;
    }
  }

  public async deleteVideo(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.VIDEOS, id));
      return true;
    } catch (e) {
      console.error('Error deleting video from Firestore:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Gift Support Logs (Supporters cup & leaderboard)
   */
  public subscribeToGiftLogs(onUpdate: (logs: GiftSupportLog[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.GIFT_LOGS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: GiftSupportLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as GiftSupportLog);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to gift logs:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveGiftLog(log: GiftSupportLog): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.GIFT_LOGS, log.id), stripUndefined(log));
      return true;
    } catch (e) {
      console.error('Error saving gift log:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to Admin Splash Greeting/Gift Banners
   */
  public subscribeToSplashBanners(onUpdate: (banners: SplashBannerConfig[]) => void): Unsubscribe {
    const q = collection(db, COLLECTIONS.SPLASH_BANNERS);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: SplashBannerConfig[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SplashBannerConfig);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to splash banners:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveSplashBanner(banner: SplashBannerConfig): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.SPLASH_BANNERS, banner.id), stripUndefined(banner), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving splash banner:', e);
      return false;
    }
  }

  public async deleteSplashBanner(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SPLASH_BANNERS, id));
      return true;
    } catch (e) {
      console.error('Error deleting splash banner:', e);
      return false;
    }
  }

  /**
   * Real-time subscription to In-App Notifications for a user
   */
  public subscribeToNotifications(uid: string, onUpdate: (items: InAppNotification[]) => void): Unsubscribe {
    if (!uid?.trim()) return () => {};
    const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('uid', '==', uid.trim()));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: InAppNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as InAppNotification);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Error listening to notifications:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveNotification(notif: InAppNotification): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notif.id), stripUndefined(notif), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving notification:', e);
      return false;
    }
  }

  /**
   * Real-time WebRTC signaling listener for a specific room & target user
   */
  public subscribeToRoomRtcSignals(
    roomId: string,
    toUid: string,
    onSignals: (signals: RoomRtcSignal[]) => void
  ): Unsubscribe {
    if (!roomId || !toUid) return () => {};
    const q = query(
      collection(db, COLLECTIONS.ROOM_RTC_SIGNALS),
      where('roomId', '==', roomId),
      where('toUid', '==', toUid)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: RoomRtcSignal[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as RoomRtcSignal);
        });
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        onSignals(list);
      },
      (error) => {
        console.warn('Error listening to RTC signals:', error.message);
      }
    );
    this.activeListeners.push(unsub);
    return unsub;
  }

  public async saveRoomRtcSignal(signal: RoomRtcSignal): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.ROOM_RTC_SIGNALS, signal.id), stripUndefined(signal));
      return true;
    } catch (e) {
      console.warn('Error saving RTC signal:', e);
      return false;
    }
  }

  public async deleteRoomRtcSignal(signalId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ROOM_RTC_SIGNALS, signalId));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload image file to Firebase Storage with automatic Firestore-safe compression + 4s timeout fallback
   */
  public async uploadImage(
    path: string,
    fileOrDataUrl: File | string,
    compressionOptions: CompressImageOptions = { maxDim: 900, quality: 0.76, maxBytes: 240_000 }
  ): Promise<string> {
    const preparedDataUrl =
      typeof fileOrDataUrl === 'string' && !fileOrDataUrl.startsWith('data:image')
        ? fileOrDataUrl
        : await compressImageForFirestore(fileOrDataUrl, compressionOptions);

    if (typeof fileOrDataUrl === 'string' && !fileOrDataUrl.startsWith('data:')) {
      return fileOrDataUrl;
    }

    try {
      const storageRef = ref(storage, path);
      const uploadTask =
        typeof fileOrDataUrl === 'string'
          ? uploadString(storageRef, preparedDataUrl, 'data_url')
          : preparedDataUrl.startsWith('data:')
          ? uploadString(storageRef, preparedDataUrl, 'data_url')
          : uploadBytes(storageRef, fileOrDataUrl);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timeout')), 4000)
      );

      await Promise.race([uploadTask, timeoutPromise]);
      const url = await Promise.race([getDownloadURL(storageRef), timeoutPromise]);
      return url;
    } catch (e) {
      console.warn('Storage upload fallback to compressed DataURL:', e);
      return preparedDataUrl;
    }
  }

  private isInsideIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  public isWebViewOrCapacitor(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
      if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return true;
      if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') return true;
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
      if (/\bwv\b|; wv\)/i.test(ua)) return true;
      if (/Android/i.test(ua) && /Version\/\d+\.\d+/i.test(ua) && !/Chrome\/\d+.*Mobile Safari/i.test(ua)) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  private isBraveOrRestrictedBrowser(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const hasBraveApi = Boolean((navigator as unknown as { brave?: unknown }).brave);
    return hasBraveApi || /Brave|wv\)|WebView/i.test(ua);
  }

  private redirectResultPromise: Promise<{ user?: FirebaseUser; error?: string }> | null = null;

  /**
   * Checks and consumes any completed Google signInWithRedirect result
   */
  public async consumeGoogleRedirectResult(): Promise<{ user?: FirebaseUser; error?: string }> {
    let hadPendingRedirect = false;
    const isSameAuthDomain =
      typeof window !== 'undefined' &&
      Boolean(firebaseConfig.authDomain) &&
      window.location.hostname === firebaseConfig.authDomain;
    if (typeof window !== 'undefined') {
      try {
        hadPendingRedirect = Boolean(window.sessionStorage.getItem('livo_google_redirect_pending'));
        window.sessionStorage.removeItem('livo_google_redirect_pending');
      } catch {
        // ignore storage restrictions
      }
    }
    if (!hadPendingRedirect && !isSameAuthDomain) {
      return {};
    }
    if (!this.redirectResultPromise) {
      this.redirectResultPromise = (async () => {
        try {
          const res = await getRedirectResult(auth);
          if (res?.user) {
            return { user: res.user };
          }
          return {};
        } catch (err: any) {
          console.warn('Google Redirect Result error:', err);
          return { error: this.formatFirebaseAuthError(err, 'تعذر إكمال تسجيل الدخول عبر Google') };
        }
      })().finally(() => {
        // Allow future redirect attempts in the same SPA session if needed
        this.redirectResultPromise = null;
      });
    }
    return this.redirectResultPromise;
  }

  private formatFirebaseAuthError(err: any, fallback: string): string {
    const code = err?.code || '';
    const msg = String(err?.message || '');
    const lowerMsg = msg.toLowerCase();
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      return `النطاق الحالي (${host || 'هذا الرابط'}) غير مضاف في Authorized Domains داخل Firebase Authentication. أضف "${host}" من Firebase Console > Authentication > Settings > Authorized domains، أو سجّل الدخول الآن بالبريد الإلكتروني / رقم الهاتف.`;
    }
    if (
      code === 'auth/missing-initial-state' ||
      lowerMsg.includes('missing initial state') ||
      code === 'auth/invalid-action-code' ||
      lowerMsg.includes('requested action is invalid') ||
      code === 'auth/missing-continue-uri' ||
      code === 'auth/invalid-continue-uri'
    ) {
      return 'تعذر إكمال التحويل التلقائي بسبب قيود تخزين المتصفح. استخدم زر تسجيل الدخول السريع عبر Google (النافذة المنبثقة) مع السماح بالنوافذ المنبثقة، أو سجّل الدخول بالبريد الإلكتروني وكلمة المرور.';
    }
    if (code === 'auth/web-storage-unsupported') {
      return 'المتصفح يمنع تخزين الجلسة (Cookies / IndexedDB). فعّل الكوكيز أو أوقف حظر التخزين في المتصفح، أو استخدم البريد الإلكتروني / رقم الهاتف.';
    }
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      return this.isBraveOrRestrictedBrowser()
        ? 'تم حجب أو إغلاق نافذة Google في هذا المتصفح/التطبيق. اسمح بالنوافذ المنبثقة (Popups) وأعد المحاولة، أو سجّل الدخول بالبريد الإلكتروني وكلمة المرور.'
        : 'تم إغلاق أو حجب نافذة تسجيل الدخول عبر Google. اسمح بالنوافذ المنبثقة لهذا الموقع وأعد المحاولة، أو سجّل الدخول بالبريد الإلكتروني وكلمة المرور.';
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return 'هذا البريد مسجل بالفعل بطريقة دخول أخرى. سجّل الدخول بالبريد الإلكتروني وكلمة المرور.';
    }
    if (code === 'auth/network-request-failed') {
      return 'تعذر الاتصال بخوادم Google. تحقق من اتصال الإنترنت وأعد المحاولة.';
    }
    if (code === 'auth/internal-error') {
      return 'حدث خطأ مؤقت أثناء المصادقة مع Google. يرجى المحاولة بالنافذة المنبثقة أو البريد الإلكتروني.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'طريقة الدخول بالبريد وكلمة المرور غير مفعّلة في Firebase Console حالياً. استخدم زر "تسجيل الدخول السريع بحساب Google" أو فعّل Email/Password في Firebase Authentication.';
    }
    if (code === 'auth/missing-password') {
      return 'يرجى كتابة كلمة المرور للمتابعة.';
    }
    if (code === 'auth/missing-email') {
      return 'يرجى كتابة البريد الإلكتروني للمتابعة.';
    }
    if (
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials'
    ) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن الحساب مسجل عبر Google فقط (جرّب الدخول بحساب Google أو اضغط نسيت كلمة المرور لتعيين كلمة مرور).';
    }
    if (code === 'auth/user-disabled') {
      return 'تم تعطيل هذا الحساب في نظام المصادقة.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
    }
    if (code === 'auth/weak-password') {
      return 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل).';
    }
    if (code === 'auth/invalid-email') {
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    if (code === 'auth/too-many-requests') {
      return 'تم تعطيل المحاولات مؤقتاً بسبب كثرة المحاولات. يرجى الانتظار قليلاً.';
    }
    return err?.message || fallback;
  }

  private gsiScriptPromise: Promise<boolean> | null = null;

  private ensureGoogleIdentityScript(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.resolve(false);
    }
    const win = window as unknown as { google?: { accounts?: { id?: unknown } } };
    if (win.google?.accounts?.id) {
      return Promise.resolve(true);
    }
    if (this.gsiScriptPromise) {
      return this.gsiScriptPromise;
    }
    this.gsiScriptPromise = new Promise<boolean>((resolve) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(Boolean(win.google?.accounts?.id)), 3000);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(Boolean(win.google?.accounts?.id));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
    return this.gsiScriptPromise;
  }

  private async tryGoogleIdentityServicesSignIn(): Promise<{ user?: FirebaseUser; error?: string } | null> {
    const clientId = (firebaseConfig as { oAuthClientId?: string }).oAuthClientId;
    if (!clientId || typeof window === 'undefined') return null;

    const loaded = await this.ensureGoogleIdentityScript();
    const gsi = (window as unknown as {
      google?: {
        accounts?: {
          id?: {
            initialize: (cfg: { client_id: string; callback: (res: { credential?: string }) => void; ux_mode?: string; use_fedcm_for_prompt?: boolean }) => void;
            prompt: (cb?: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean; isDismissedMoment?: () => boolean }) => void) => void;
          };
        };
      };
    }).google?.accounts?.id;

    if (!loaded || !gsi) return null;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (val: { user?: FirebaseUser; error?: string } | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(val);
      };

      const timer = window.setTimeout(() => finish(null), 8000);

      try {
        gsi.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          use_fedcm_for_prompt: true,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) {
              finish(null);
              return;
            }
            try {
              const credential = GoogleAuthProvider.credential(response.credential);
              const userCred = await signInWithCredential(auth, credential);
              finish({ user: userCred.user });
            } catch (credErr: any) {
              finish({ error: this.formatFirebaseAuthError(credErr, 'تعذر إكمال الدخول عبر Google') });
            }
          }
        });

        gsi.prompt((notification) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            finish(null);
          }
        });
      } catch {
        finish(null);
      }
    });
  }

  private async runGoogleAuthFlow(
    preferRedirect = false
  ): Promise<{ success: boolean; user?: FirebaseUser; redirectStarted?: boolean; error?: string }> {
    void this.ensureGoogleIdentityScript();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // livo_native_google: inside the APK use the native Google account picker
    const capNative = typeof window !== 'undefined' ? (window as any).Capacitor : undefined;
    if (capNative?.isNativePlatform?.()) {
      try {
        const FA = capNative.registerPlugin('FirebaseAuthentication');
        const res = await FA.signInWithGoogle({ skipNativeAuth: true });
        const idToken = res?.credential?.idToken;
        if (!idToken) return { success: false, error: 'لم يتم الحصول على بيانات حساب Google' };
        const { signInWithCredential } = await import('firebase/auth');
        const nativeCred = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        return { success: true, user: nativeCred.user };
      } catch (err: any) {
        return { success: false, error: this.formatFirebaseAuthError(err, 'تم إلغاء تسجيل الدخول عبر Google') };
      }
    }

    // Cross-origin signInWithRedirect (e.g. run.app / localhost APK -> firebaseapp.com/__/auth/handler)
    // fails in storage-partitioned browsers with "missing initial state".
    // Only allow redirect when hosted directly on authDomain outside iframes & restricted browsers.
    const isSameAuthDomain =
      typeof window !== 'undefined' &&
      Boolean(firebaseConfig.authDomain) &&
      window.location.hostname === firebaseConfig.authDomain;
    const canUseRedirect = isSameAuthDomain && !this.isInsideIframe() && !this.isBraveOrRestrictedBrowser();

    if (preferRedirect && canUseRedirect) {
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('livo_google_redirect_pending', String(Date.now()));
        }
        await signInWithRedirect(auth, provider);
        return { success: false, redirectStarted: true };
      } catch (err: any) {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('livo_google_redirect_pending');
        }
        return { success: false, error: this.formatFirebaseAuthError(err, 'تعذر بدء تسجيل الدخول عبر Google') };
      }
    }

    try {
      const cred = await signInWithPopup(auth, provider);
      return { success: true, user: cred.user };
    } catch (err: any) {
      const code = err?.code || '';
      if (
        (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') &&
        canUseRedirect
      ) {
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('livo_google_redirect_pending', String(Date.now()));
          }
          await signInWithRedirect(auth, provider);
          return { success: false, redirectStarted: true };
        } catch (redirectErr: any) {
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem('livo_google_redirect_pending');
          }
          return { success: false, error: this.formatFirebaseAuthError(redirectErr, 'تعذر فتح تسجيل الدخول عبر Google') };
        }
      }
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/internal-error'
      ) {
        const gsiRes = await this.tryGoogleIdentityServicesSignIn();
        if (gsiRes?.user) {
          return { success: true, user: gsiRes.user };
        }
        if (gsiRes?.error) {
          return { success: false, error: gsiRes.error };
        }
      }
      console.warn('Google Auth error:', err);
      return { success: false, error: this.formatFirebaseAuthError(err, 'تم إلغاء نافذة اختيار حساب Google') };
    }
  }

  /**
   * Admin Authentication with Firebase Auth
   */
  public async loginAdmin(email: string, pass: string): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    const cleanEmail = this.sanitizeEmail(email);
    const rawPass = typeof pass === 'string' ? pass : '';
    const cleanPass = rawPass.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني بشكل صحيح.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'يرجى كتابة كلمة المرور للمتابعة.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      return { success: true, user: cred.user };
    } catch (err: any) {
      console.warn('Firebase signInWithEmailAndPassword error:', err.code, err.message);
      return { success: false, error: this.formatFirebaseAuthError(err, 'خطأ في المصادقة مع Firebase Authentication') };
    }
  }

  /**
   * Direct Google Sign-In for Admin / Owner
   */
  public async loginAdminWithGoogle(preferRedirect = false): Promise<{ success: boolean; user?: FirebaseUser; redirectStarted?: boolean; error?: string }> {
    return this.runGoogleAuthFlow(preferRedirect);
  }

  /**
   * Direct Google Sign-In for Customer with mandatory Account Picker
   */
  public async loginCustomerWithGoogle(preferRedirect = false): Promise<{ success: boolean; user?: FirebaseUser; redirectStarted?: boolean; error?: string }> {
    return this.runGoogleAuthFlow(preferRedirect);
  }

  /**
   * Customer Sign-In via Email/Password in Firebase Auth
   */
  public async loginCustomerWithEmail(email: string, pass: string): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    const cleanEmail = this.sanitizeEmail(email);
    const rawPass = typeof pass === 'string' ? pass : '';
    const cleanPass = rawPass.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'يرجى كتابة البريد الإلكتروني بشكل صحيح.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'يرجى كتابة كلمة المرور للمتابعة.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      return { success: true, user: cred.user };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err, 'تعذر تسجيل الدخول عبر البريد الإلكتروني') };
    }
  }

  /**
   * Customer Registration via Email/Password in Firebase Auth
   */
  public async registerCustomerWithEmail(email: string, pass: string, displayName?: string): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    const cleanEmail = this.sanitizeEmail(email);
    const rawPass = typeof pass === 'string' ? pass : '';
    const cleanPass = rawPass.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'يرجى كتابة البريد الإلكتروني بشكل صحيح.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'يرجى كتابة كلمة المرور للمتابعة.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName: displayName.trim() }).catch(() => {});
      }
      return { success: true, user: cred.user };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err, 'تعذر إنشاء الحساب عبر Firebase') };
    }
  }

  /**
   * Phone OTP Session Bridge: creates/signs into a deterministic Firebase Auth identity
   * so Firestore Security Rules (request.auth != null) succeed reliably for Phone accounts.
   */
  public async authenticateWithPhoneSession(
    cleanPhone: string,
    displayName?: string
  ): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    const digits = cleanPhone.replace(/[^0-9]/g, '');
    if (digits.length < 7) {
      return { success: false, error: 'رقم الهاتف غير صالح' };
    }
    const syntheticEmail = `p${digits}@phone.livo.live`;
    const deterministicPass = `LivoPhone#${digits}_Auth99`;

    try {
      const cred = await signInWithEmailAndPassword(auth, syntheticEmail, deterministicPass);
      return { success: true, user: cred.user };
    } catch (signInErr: any) {
      try {
        const reg = await createUserWithEmailAndPassword(auth, syntheticEmail, deterministicPass);
        if (displayName && reg.user) {
          await updateProfile(reg.user, { displayName: displayName.trim() }).catch(() => {});
        }
        return { success: true, user: reg.user };
      } catch (regErr: any) {
        // If email/password provider is restricted, fall back to Anonymous Firebase session so Firestore works
        try {
          const anon = await signInAnonymously(auth);
          return { success: true, user: anon.user };
        } catch {
          console.warn('Phone Auth fallback failed:', signInErr?.code, regErr?.code);
          return { success: false, error: 'تعذر تأسيس جلسة Firebase للهاتف' };
        }
      }
    }
  }

  /**
   * Send Password Reset Email
   */
  public async resetCustomerPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = this.sanitizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'تأكد من كتابة البريد الإلكتروني المسجل بشكل صحيح' };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' };
    } catch (err: any) {
      return { success: false, message: this.formatFirebaseAuthError(err, 'تأكد من كتابة البريد الإلكتروني المسجل بشكل صحيح') };
    }
  }

  public getCurrentAuthUid(): string | undefined {
    return auth.currentUser?.uid;
  }

  public getCurrentAuthEmail(): string | undefined {
    return auth.currentUser?.email?.trim().toLowerCase() || undefined;
  }

  public onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  }

  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }
  }

  public cleanup() {
    this.activeListeners.forEach((unsub) => unsub());
    this.activeListeners = [];
  }
}

export const firebaseService = new FirebaseService();
