/**
 * LIVO Social Platform - Shared Types & Interfaces
 * Fully typed schema for Customer and Admin applications
 */

export type UserRole = 'user' | 'charging_agent' | 'distributor_agent' | 'agent' | 'supervisor' | 'owner';

export type VerifiedBadgeColor =
  | 'blue'
  | 'gold'
  | 'crimson'
  | 'emerald'
  | 'purple'
  | 'cyan'
  | 'pink'
  | 'orange'
  | 'lime'
  | 'indigo'
  | 'silver'
  | 'rainbow';

export type VerifiedBadgeShape = 'rosette' | 'crown' | 'shield' | 'diamond';

export interface UserProfile {
  uid: string; // Unique 5+ digit alphanumeric ID (Public ID)
  authUid?: string; // Firebase Auth UID
  email?: string;
  username: string;
  displayName: string;
  avatar: string;
  role: UserRole;
  coins: number;
  diamonds: number;
  level: number; // Strictly Level 0 to 50
  eligibleRechargedCoins: number; // Cumulative recharge count for level progression
  unlockedLevelRewards: number[]; // Array of level numbers whose diamond rewards have been claimed
  isVerified: boolean; // Verified check badge (Admin/Verification only)
  verifiedUntil?: string;
  verifiedBadgeColor?: VerifiedBadgeColor;
  verifiedBadgeShape?: VerifiedBadgeShape;
  verifiedBadgeGlow?: boolean;
  nameGlowColor?: 'none' | 'gold' | 'cyan' | 'crimson' | 'purple' | 'emerald' | 'pink' | 'orange' | 'lime' | 'indigo' | 'silver' | 'rainbow';
  equippedFrame?: string;
  equippedFrameUrl?: string;
  frameGlowColor?: string;
  frameAnimated?: boolean;
  customIconUrl?: string;
  customIconLabel?: string;
  customIconGlow?: string;
  customIconAnimated?: boolean;
  equippedEntrance?: string;
  bio?: string;
  followingCount: number;
  followersCount: number;
  agencyType?: 'charging_agent' | 'distributors_agent';
  agencyName?: string;
  canChargeUsers?: boolean;
  agentBalance?: number; // Balance reserved for charging agents
  isBanned?: boolean;
  banDetails?: {
    type: 'account' | 'device' | 'both';
    reason: string;
    bannedAt: string;
    expiresAt?: string;
    bannedBy: string;
  };
  deviceId?: string;
  country?: string;
  voiceRoomBgUrl?: string;
  accountType?: 'personal' | 'business'; // Legacy compatibility field (unified login)
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  followingUids?: string[];
  blockedUids?: string[];
  notificationsEnabled?: boolean;
  publicBroadcast?: boolean;
  privateProfileOnly?: boolean;
  locationEnabled?: boolean;
  locationCoords?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  canStealthRooms?: boolean; // Admin-granted permission for stealth room entry
  agencyBadgeLabel?: string; // e.g. 'وكيل شحن' or 'وكيل مذيعين'
  coverUrl?: string; // Profile cover banner image URL or preset
  accountPrivacy?: 'public' | 'private' | 'friends_only';
  photosVisibility?: 'public' | 'friends_only' | 'private';
  videosVisibility?: 'public' | 'friends_only' | 'private';
  postsVisibility?: 'public' | 'friends_only' | 'private';
  lastGiftSenderUid?: string;
  lastVoucherCodeId?: string;
  lastAgentUid?: string;
  createdAt: string;
}

export interface SupervisorRecord {
  id: string;
  uid: string;
  name: string;
  email: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface LevelConfig {
  level: number; // 0 to 50
  requiredCoins: number; // Cumulative coins needed
  rewardDiamonds: number; // Diamonds awarded upon reaching level
  title?: string;
}

export interface LevelPromotionRecord {
  id: string;
  uid: string;
  username: string;
  oldLevel: number;
  newLevel: number;
  unlockedAt: string;
  rewardDiamondsAwarded: number;
  eligibleRechargedCoins: number;
}

export interface DistributorRecord {
  id: string;
  agentUid: string; // The distributor agent UID
  distributorUid: string; // Public ID of the distributor
  distributorName: string;
  distributorAvatar: string;
  phone?: string;
  status: 'active' | 'suspended';
  salesCount: number;
  totalVolumeCoins: number;
  joinedAt: string;
}

export interface AgentTransferRecord {
  id: string;
  agentUid: string;
  agentName: string;
  targetUid: string;
  targetName: string;
  targetAvatar?: string;
  coinsAmount: number;
  agentBalanceBefore: number;
  agentBalanceAfter: number;
  createdAt: string;
  notes?: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  priceEGP: number;
  icon?: string;
  popular?: boolean;
  isActive?: boolean;
  updatedAt?: string;
}

export interface RechargeRequest {
  id: string;
  orderNumber: string;
  uid: string;
  username: string;
  userAvatar: string;
  packageCoins: number;
  amountEGP: number;
  payerPhone: string;
  receiptUrl: string; // Base64 data or Firebase Storage URL
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  rejectReason?: string;
}

export interface CoinAuditRecord {
  id: string;
  uid: string;
  username: string;
  actionType: 'recharge_request' | 'admin_add' | 'admin_deduct' | 'admin_set' | 'gift_sent' | 'gift_received' | 'store_purchase' | 'agency_charge';
  coinsChange: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  chatId: string;
  senderUid: string;
  senderAuthUid?: string;
  senderName: string;
  senderAvatar: string;
  receiverUid: string;
  receiverAuthUid?: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'video';
  mediaUrl?: string;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

export type MessageRequestStatus = 'pending' | 'accepted' | 'rejected' | 'suspended';

export interface MessageRequest {
  id: string;
  senderUid: string;
  senderAuthUid?: string;
  senderName: string;
  senderAvatar: string;
  senderVerified?: boolean;
  receiverUid: string;
  receiverAuthUid?: string;
  receiverName?: string;
  receiverAvatar?: string;
  introMessage: string;
  status: MessageRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  chatId: string;
  participantUid: string;
  participantName: string;
  participantAvatar: string;
  participantVerified: boolean;
  lastMessage: string;
  lastMessageType: 'text' | 'image' | 'voice' | 'video';
  lastMessageTime: string;
  unreadCount: number;
}

export interface RoomMessage {
  id: string;
  uid: string;
  user: string;
  text: string;
  isVip?: boolean;
  isVerified?: boolean;
  verifiedBadgeColor?: VerifiedBadgeColor;
  verifiedBadgeShape?: VerifiedBadgeShape;
  verifiedBadgeGlow?: boolean;
  nameGlowColor?: UserProfile['nameGlowColor'];
  customIconUrl?: string;
  customIconGlow?: string;
  customIconAnimated?: boolean;
  emojiSize?: 'small' | 'large';
  createdAt: string;
}

export interface RoomGiftBlast {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  giftImageUrl?: string;
  animationType: GiftItem['animationType'];
  senderUid: string;
  senderName: string;
  recipientName?: string;
  recipientNames?: string[];
  targetAll?: boolean;
  cardMessage?: string;
  count: number;
  coinsEach: number;
  createdAt: string;
}

export interface RoomGameEvent {
  id: string;
  type: 'dice' | 'couple_heart';
  actorUid: string;
  actorName: string;
  diceValue?: number;
  partner1Uid?: string;
  partner1Name?: string;
  partner1Avatar?: string;
  partner2Uid?: string;
  partner2Name?: string;
  partner2Avatar?: string;
  createdAt: string;
}

export interface VoiceRoom {
  id: string;
  title: string;
  ownerUid: string;
  ownerAuthUid?: string;
  ownerName: string;
  ownerAvatar: string;
  isOfficial: boolean; // "LIVO Admin" official room
  roomType?: 'voice' | 'live';
  seatCount?: 6 | 12;
  moderatorUids?: string[];
  coverImage?: string;
  backgroundUrl?: string;
  viewersCount?: number;
  status: 'open' | 'closed' | 'locked_by_admin';
  category: string;
  seats: RoomSeat[];
  mutedUsers: string[]; // uids forbidden to write
  micBlockedUsers?: string[]; // uids whose microphone is locked by Admin/Moderator
  bannedUsers: string[]; // uids banned from room
  stealthUids?: string[]; // uids currently browsing in stealth mode
  allChatDisabled: boolean;
  announcement?: string;
  messages?: RoomMessage[];
  latestGiftBlast?: RoomGiftBlast;
  latestGameEvent?: RoomGameEvent;
}

export interface RoomSeat {
  seatIndex: number;
  occupiedByUid?: string;
  occupiedByName?: string;
  occupiedByAvatar?: string;
  isVerified?: boolean;
  verifiedBadgeColor?: VerifiedBadgeColor;
  verifiedBadgeShape?: VerifiedBadgeShape;
  verifiedBadgeGlow?: boolean;
  nameGlowColor?: UserProfile['nameGlowColor'];
  equippedFrameUrl?: string;
  frameGlowColor?: string;
  frameAnimated?: boolean;
  customIconUrl?: string;
  customIconGlow?: string;
  customIconAnimated?: boolean;
  agencyBadgeLabel?: string;
  isMuted: boolean;
  isLocked: boolean;
  isMicBlocked?: boolean;
  isChatBlocked?: boolean;
  points?: number;
  giftsCount?: number;
}

export interface LiveStream {
  id: string;
  hostUid: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  coverImage: string;
  viewersCount: number;
  likesCount: number;
  isLive: boolean;
  pkChallenge?: PKChallenge;
  topSupporters: StreamSupporter[];
}

export interface StreamSupporter {
  rank: 1 | 2 | 3;
  uid: string;
  username: string;
  avatar: string;
  supportedCoins: number;
}

export interface PKChallenge {
  id: string;
  challenger1: {
    uid: string;
    username: string;
    avatar: string;
    coinsSupported: number;
  };
  challenger2: {
    uid: string;
    username: string;
    avatar: string;
    coinsSupported: number;
  };
  durationSeconds: number; // 300s default (5 minutes)
  secondsRemaining: number;
  status: 'ongoing' | 'finished';
  winnerUid?: string | 'draw';
}

export interface GiftItem {
  id: string;
  name: string;
  coins: number;
  icon: string;
  animationType:
    | 'lion'
    | 'car'
    | 'dragon'
    | 'castle'
    | 'diamond'
    | 'heart'
    | 'rose'
    | 'rocket'
    | 'card'
    | 'ship'
    | 'crown'
    | 'wings'
    | 'fireworks';
  durationMs: number;
  category?: string;
  imageUrl?: string;
  isCard?: boolean;
  isActive?: boolean;
  updatedAt?: string;
}

export interface StoreItem {
  id: string;
  name: string;
  type: 'frame' | 'entrance';
  priceCoins: number;
  image: string;
  imageUrl?: string;
  glowColor?: string;
  description: string;
  isActive?: boolean;
  updatedAt?: string;
}

export interface PaymentMethodConfig {
  id: string;
  type: 'vodafone_cash' | 'instapay' | 'orange_cash' | 'etisalat_cash' | 'we_pay' | 'bank_transfer' | 'other';
  title: string;
  accountNumber: string; // Phone number or InstaPay IPA or Account Number
  accountHolder: string; // Name of account holder (e.g. إسلام الشحات)
  instructions: string; // Instructions for user
  isActive: boolean; // Enabled/disabled
  isDefault: boolean; // Default payment method
  updatedAt: string;
  updatedBy?: string;
}

export interface RechargeCode {
  id: string; // Code string e.g. LIVO-1000-XYZ
  code: string;
  coins: number;
  description?: string;
  status: 'active' | 'used' | 'cancelled';
  maxUses: number;
  usedCount: number;
  usedByUids: string[];
  createdAt: string;
  createdBy: string;
  usedAt?: string;
}

export interface AgencyApplication {
  id: string;
  uid: string;
  username: string;
  userAvatar: string;
  agencyType: 'charging_agent' | 'distributors_agent';
  agencyName: string;
  phone: string;
  nationalId?: string;
  experienceNotes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  canChargeUsers: boolean;
  totalSalesEGP: number;
  commissionEarnedEGP: number;
  membersCount: number;
}

export interface BlueVerificationRequest {
  id: string;
  uid: string;
  username: string;
  userAvatar: string;
  monthsCount: number;
  priceEGP: number;
  paymentPhone: string;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  username: string;
  totalCoins: number;
  grossAmountEGP: number;
  platformFeeEGP: number;
  netPayoutEGP: number;
  paymentMethod: 'vodafone_cash' | 'instapay' | 'bank_transfer';
  paymentDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  transferProofUrl?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface BanRecord {
  id: string;
  uid: string;
  username: string;
  userAvatar: string;
  deviceId?: string;
  banType: 'account' | 'device' | 'both';
  duration: 'temporary' | 'permanent';
  durationDays?: number;
  expiresAt?: string;
  reason: string;
  bannedBy: string;
  createdAt: string;
  status: 'active' | 'unbanned';
  unbannedBy?: string;
  unbannedAt?: string;
  unbanReason?: string;
}

export interface VideoPost {
  id: string;
  authorUid: string;
  authorAuthUid?: string;
  authorName: string;
  authorAvatar: string;
  isVerified: boolean;
  videoUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  placement: 'banner' | 'popup' | 'feed';
  clicksCount: number;
  viewsCount: number;
  createdAt: string;
  createdBy: string;
}

export interface SupportTicket {
  id: string;
  uid: string;
  username: string;
  userAvatar: string;
  category: 'complaint' | 'inquiry' | 'report' | 'technical' | 'financial';
  subject: string;
  message: string;
  attachmentUrl?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'normal' | 'high' | 'urgent';
  createdAt: string;
  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
}

export interface GiftSupportLog {
  id: string;
  roomId: string;
  roomTitle?: string;
  senderUid: string;
  senderName: string;
  senderAvatar: string;
  recipientUid: string;
  recipientName: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  coinsTotal: number;
  count: number;
  cardMessage?: string;
  createdAt: string;
}

export interface SupporterRankEntry {
  uid: string;
  displayName: string;
  avatar: string;
  totalCoins: number;
  giftsCount: number;
  isVerified?: boolean;
  verifiedBadgeColor?: VerifiedBadgeColor;
  agencyBadgeLabel?: string;
}

export interface SplashBannerConfig {
  id: string;
  title: string;
  dedicationMessage?: string;
  senderName?: string;
  recipientName?: string;
  imageUrl: string;
  isActive: boolean;
  durationMs?: number; // Default 3000ms (3 seconds)
  createdAt: string;
  createdBy: string;
}

export interface InAppNotification {
  id: string;
  uid: string;
  type: 'recharge_approved' | 'gift_received' | 'system' | 'agency_approved';
  title: string;
  body: string;
  coinsAmount?: number;
  isRead: boolean;
  createdAt: string;
}

export interface RoomRtcSignal {
  id: string;
  roomId: string;
  fromUid: string;
  fromAuthUid?: string;
  toUid: string;
  type: 'offer' | 'answer' | 'candidate' | 'presence' | 'ring' | 'accept' | 'decline' | 'hangup';
  callMode?: 'audio' | 'video';
  callerName?: string;
  callerAvatar?: string;
  sdp?: string;
  sdpType?: 'offer' | 'answer';
  candidate?: {
    candidate: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
  };
  createdAt: string;
}
