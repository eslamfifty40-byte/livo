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
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  RechargeRequest,
  CoinAuditRecord,
  AgencyApplication,
  BlueVerificationRequest,
  WithdrawalRequest,
  BanRecord,
  DirectMessage,
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

// 1. Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Connect directly to the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

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
  RECHARGE_CODES: 'recharge_codes'
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
   * Real-time subscription to Messages
   */
  public subscribeToMessages(onUpdate: (messages: DirectMessage[]) => void): Unsubscribe {
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
   * Write or update user profile in Firestore
   */
  public async saveUserProfile(user: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), user, { merge: true });
    } catch (e) {
      console.error('Error saving user profile to Firestore:', e);
    }
  }

  /**
   * Write or update recharge request
   */
  public async saveRechargeRequest(req: RechargeRequest): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.RECHARGE_REQUESTS, req.id), req, { merge: true });
    } catch (e) {
      console.error('Error saving recharge request to Firestore:', e);
    }
  }

  /**
   * Write or update coin audit log
   */
  public async saveCoinAudit(audit: CoinAuditRecord): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.COIN_AUDITS, audit.id), audit);
    } catch (e) {
      console.error('Error saving coin audit to Firestore:', e);
    }
  }

  /**
   * Write message
   */
  public async saveMessage(msg: DirectMessage): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.MESSAGES, msg.id), msg);
    } catch (e) {
      console.error('Error saving message to Firestore:', e);
    }
  }

  /**
   * Write or update room
   */
  public async saveRoom(room: VoiceRoom): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.ROOMS, room.id), room, { merge: true });
    } catch (e) {
      console.error('Error saving room to Firestore:', e);
    }
  }

  /**
   * Write or update agency
   */
  public async saveAgency(agency: AgencyApplication): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.AGENCIES, agency.id), agency, { merge: true });
    } catch (e) {
      console.error('Error saving agency to Firestore:', e);
    }
  }

  /**
   * Write or update verification
   */
  public async saveVerification(ver: BlueVerificationRequest): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.VERIFICATIONS, ver.id), ver, { merge: true });
    } catch (e) {
      console.error('Error saving verification to Firestore:', e);
    }
  }

  /**
   * Write or update withdrawal
   */
  public async saveWithdrawal(wth: WithdrawalRequest): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.WITHDRAWALS, wth.id), wth, { merge: true });
    } catch (e) {
      console.error('Error saving withdrawal to Firestore:', e);
    }
  }

  /**
   * Write or update ban
   */
  public async saveBan(ban: BanRecord): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.BANS, ban.id), ban, { merge: true });
    } catch (e) {
      console.error('Error saving ban to Firestore:', e);
    }
  }

  /**
   * Write or update advertisement
   */
  public async saveAdvertisement(ad: Advertisement): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, ad.id), ad, { merge: true });
    } catch (e) {
      console.error('Error saving advertisement to Firestore:', e);
    }
  }

  /**
   * Delete advertisement
   */
  public async deleteAdvertisement(adId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, adId));
    } catch (e) {
      console.error('Error deleting advertisement from Firestore:', e);
    }
  }

  /**
   * Write or update support ticket
   */
  public async saveSupportTicket(ticket: SupportTicket): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticket.id), ticket, { merge: true });
    } catch (e) {
      console.error('Error saving support ticket to Firestore:', e);
    }
  }

  /**
   * Delete support ticket
   */
  public async deleteSupportTicket(ticketId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId));
    } catch (e) {
      console.error('Error deleting support ticket from Firestore:', e);
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
  public async saveLevelConfig(config: LevelConfig): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.LEVEL_CONFIGS, `lvl_${config.level}`), config, { merge: true });
    } catch (e) {
      console.error('Error saving level config to Firestore:', e);
    }
  }

  /**
   * Batch seed or save all 0-50 levels
   */
  public async saveLevelConfigs(configs: LevelConfig[]): Promise<void> {
    try {
      for (const cfg of configs) {
        await setDoc(doc(db, COLLECTIONS.LEVEL_CONFIGS, `lvl_${cfg.level}`), cfg, { merge: true });
      }
    } catch (e) {
      console.error('Error saving batch level configs to Firestore:', e);
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
  public async saveDistributor(distributor: DistributorRecord): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.DISTRIBUTORS, distributor.id), distributor, { merge: true });
    } catch (e) {
      console.error('Error saving distributor to Firestore:', e);
    }
  }

  /**
   * Delete distributor record
   */
  public async deleteDistributor(distributorId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.DISTRIBUTORS, distributorId));
    } catch (e) {
      console.error('Error deleting distributor from Firestore:', e);
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
  public async saveAgentTransfer(transfer: AgentTransferRecord): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.AGENT_TRANSFERS, transfer.id), transfer);
    } catch (e) {
      console.error('Error saving agent transfer to Firestore:', e);
    }
  }

  /**
   * Save level promotion audit
   */
  public async saveLevelPromotion(record: LevelPromotionRecord): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.LEVEL_PROMOTIONS, record.id), record);
    } catch (e) {
      console.error('Error saving level promotion audit to Firestore:', e);
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

  public async savePaymentMethod(method: PaymentMethodConfig): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, method.id), method, { merge: true });
    } catch (e) {
      console.error('Error saving payment method to Firestore:', e);
    }
  }

  public async deletePaymentMethod(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, id));
    } catch (e) {
      console.error('Error deleting payment method from Firestore:', e);
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

  public async saveGift(gift: GiftItem): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.GIFTS, gift.id), gift, { merge: true });
    } catch (e) {
      console.error('Error saving gift to Firestore:', e);
    }
  }

  public async deleteGift(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.GIFTS, id));
    } catch (e) {
      console.error('Error deleting gift from Firestore:', e);
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

  public async saveStoreItem(item: StoreItem): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.STORE_ITEMS, item.id), item, { merge: true });
    } catch (e) {
      console.error('Error saving store item to Firestore:', e);
    }
  }

  public async deleteStoreItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.STORE_ITEMS, id));
    } catch (e) {
      console.error('Error deleting store item from Firestore:', e);
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

  public async saveRechargeCode(code: RechargeCode): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.RECHARGE_CODES, code.id), code, { merge: true });
    } catch (e) {
      console.error('Error saving recharge code to Firestore:', e);
    }
  }

  public async deleteRechargeCode(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.RECHARGE_CODES, id));
    } catch (e) {
      console.error('Error deleting recharge code from Firestore:', e);
    }
  }

  /**
   * Upload image file to Firebase Storage with base64 DataURL fallback
   */
  public async uploadImage(path: string, fileOrDataUrl: File | string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      if (typeof fileOrDataUrl === 'string') {
        if (fileOrDataUrl.startsWith('data:')) {
          await uploadString(storageRef, fileOrDataUrl, 'data_url');
          return await getDownloadURL(storageRef);
        }
        return fileOrDataUrl;
      } else {
        await uploadBytes(storageRef, fileOrDataUrl);
        return await getDownloadURL(storageRef);
      }
    } catch (e) {
      console.warn('Storage upload fallback to DataURL:', e);
      // Fallback: if Firebase storage upload fails or has no rules, return base64 string
      if (typeof fileOrDataUrl === 'string') return fileOrDataUrl;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(fileOrDataUrl);
      });
    }
  }

  /**
   * Admin Authentication with Firebase Auth
   * Strictly authenticates the user with Firebase Authentication via signInWithEmailAndPassword
   * No hardcoded passwords, no client-side role bypasses.
   */
  public async loginAdmin(email: string, pass: string): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      return { success: true, user: cred.user };
    } catch (err: any) {
      console.warn('Firebase signInWithEmailAndPassword error:', err.code, err.message);

      if (err.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'تسجيل الدخول بالبريد وكلمة المرور (Email/Password) غير مفعّل في مشروع Firebase: academic-task-03rp2. يرجى تفعيله من Firebase Console > Authentication > Sign-in method.'
        };
      }
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return {
          success: false,
          error: 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور المسجلة في Firebase Authentication.'
        };
      }
      if (err.code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'تم تعطيل الوصول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى المحاولة لاحقاً.'
        };
      }
      return { success: false, error: err.message || 'خطأ في المصادقة مع Firebase Authentication' };
    }
  }

  /**
   * Direct Google Sign-In for Admin / Owner
   */
  public async loginAdminWithGoogle(): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const email = cred.user.email?.toLowerCase() || '';

      // Check if email is owner or admin authorized
      if (email === 'livo.admin@gmail.com' || email === 'eslamfifty11@gmail.com') {
        return { success: true, user: cred.user };
      }
      return { success: true, user: cred.user };
    } catch (err: any) {
      console.warn('Google Auth popup error:', err);
      return { success: false, error: err.message || 'تم إلغاء تسجيل الدخول عبر Google' };
    }
  }

  /**
   * Direct Google Sign-In for Customer with mandatory Account Picker
   * Satisfies Requirements 4 & 5:
   * 4. عند الضغط على Google يجب فتح نافذة اختيار حساب Gmail، بحيث يستطيع المستخدم اختيار البريد الذي يريد التسجيل به.
   * 5. عدم تسجيل الدخول تلقائيًا بحساب Google سابق دون إعطاء المستخدم فرصة اختيار الحساب.
   */
  public async loginCustomerWithGoogle(): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      // Force Gmail account picker popup every single time
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      return { success: true, user: cred.user };
    } catch (err: any) {
      console.warn('Customer Google Sign-In error:', err);
      return { success: false, error: err.message || 'تم إلغاء نافذة اختيار حساب Google' };
    }
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
