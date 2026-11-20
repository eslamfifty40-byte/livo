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
  deleteDoc,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  getDocFromServer,
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
  SupervisorRecord
} from '../types';

/**
 * Recursively strips undefined keys so Firestore setDoc never fails on optional fields.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        clean[k] = stripUndefined(v);
      }
    }
    return clean as T;
  }
  return value;
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
  SUPERVISORS: 'supervisors'
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
   * Write or update user profile in Firestore
   */
  public async saveUserProfile(user: UserProfile): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), stripUndefined(user), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving user profile to Firestore:', e);
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
    try {
      await setDoc(doc(db, COLLECTIONS.ROOMS, room.id), stripUndefined(room), { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving room to Firestore:', e);
      return false;
    }
  }

  public async deleteRoom(roomId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ROOMS, roomId));
      return true;
    } catch (e) {
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

  private redirectResultPromise: Promise<{ user?: FirebaseUser; error?: string }> | null = null;

  /**
   * Checks and consumes any completed Google signInWithRedirect result (runs safely once per page load)
   */
  public async consumeGoogleRedirectResult(): Promise<{ user?: FirebaseUser; error?: string }> {
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
      })();
    }
    return this.redirectResultPromise;
  }

  private formatFirebaseAuthError(err: any, fallback: string): string {
    const code = err?.code || '';
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (code === 'auth/unauthorized-domain') {
      return `النطاق الحالي (${host || 'هذا الرابط'}) غير مضاف في Authorized Domains في Firebase Authentication. يمكنك الدخول بالبريد وكلمة المرور أو رقم الهاتف الآن.`;
    }
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'تم إغلاق أو حجب نافذة Google (أو ظهرت صفحة فارغة بسبب إعدادات Brave / حظر النوافذ). يمكنك إيقاف Brave Shields لهذا الموقع أو الضغط على "تسجيل الدخول بصفحة كاملة" أو الدخول برقم الهاتف / البريد.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'طريقة الدخول هذه غير مفعّلة في إعدادات مشروع Firebase Authentication.';
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
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

  private async runGoogleAuthFlow(
    preferRedirect = false
  ): Promise<{ success: boolean; user?: FirebaseUser; redirectStarted?: boolean; error?: string }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (preferRedirect && !this.isInsideIframe()) {
      try {
        await signInWithRedirect(auth, provider);
        return { success: false, redirectStarted: true };
      } catch (err: any) {
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
        !this.isInsideIframe()
      ) {
        try {
          await signInWithRedirect(auth, provider);
          return { success: false, redirectStarted: true };
        } catch (redirectErr: any) {
          return { success: false, error: this.formatFirebaseAuthError(redirectErr, 'تعذر فتح تسجيل الدخول عبر Google') };
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
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
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' };
    } catch {
      return { success: false, message: 'تأكد من كتابة البريد الإلكتروني المسجل بشكل صحيح' };
    }
  }

  public getCurrentAuthUid(): string | undefined {
    return auth.currentUser?.uid;
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
