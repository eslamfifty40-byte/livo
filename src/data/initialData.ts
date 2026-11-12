/**
 * LIVO - Initial verified datasets, official packages and pricing configuration
 */
import { CoinPackage, GiftItem, StoreItem, UserProfile, VoiceRoom, VideoPost, LevelConfig, PaymentMethodConfig, RechargeCode } from '../types';

export const RECHARGE_PAYMENT_PHONE = "01027503464"; // Vodafone Cash / Electronic Wallet
export const RECHARGE_INSTAPAY_IPA = "eslamfifty11@instapay"; // InstaPay Account
export const CUSTOMER_SUPPORT_CONTACT = "support@livo.live"; // Customer service contact without phone number as requested

// Default Payment Methods for Vodafone Cash, InstaPay, and Electronic Wallets
export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-vodafone-1',
    type: 'vodafone_cash',
    title: 'فودافون كاش (Vodafone Cash)',
    accountNumber: '01027503464',
    accountHolder: 'إسلام الشحات (إدارة LIVO الرسمية)',
    instructions: 'يرجى تحويل قيمة الباقة المطلوبة إلى رقم فودافون كاش الموضح أعلاه، مع إرفاق سكرين شوت الإيصال بوضوح.',
    isActive: true,
    isDefault: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pm-instapay-1',
    type: 'instapay',
    title: 'إنستاباي (InstaPay)',
    accountNumber: 'eslamfifty11@instapay',
    accountHolder: 'Eslam Elshahat',
    instructions: 'التحويل المباشر واللحظي عبر تطبيق InstaPay إلى المعرّف (IPA) الخاص بالإدارة ثم إرفاق إيصال العملية.',
    isActive: true,
    isDefault: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pm-orange-1',
    type: 'orange_cash',
    title: 'أورنج كاش (Orange Cash)',
    accountNumber: '01227503464',
    accountHolder: 'محفظة الإدارة المعتمدة',
    instructions: 'تحويل كاش عبر محفظة أورنج أو أي محفظة إلكترونية ذكية.',
    isActive: true,
    isDefault: false,
    updatedAt: new Date().toISOString()
  }
];

// Initial Recharge Voucher Codes
export const INITIAL_RECHARGE_CODES: RechargeCode[] = [
  {
    id: 'LIVO-VIP-500',
    code: 'LIVO-VIP-500',
    coins: 500,
    description: 'كود شحن ترويجي للمستخدمين الجدد',
    status: 'active',
    maxUses: 100,
    usedCount: 0,
    usedByUids: [],
    createdAt: new Date().toISOString(),
    createdBy: 'livo.admin@gmail.com'
  },
  {
    id: 'LIVO-GOLD-1000',
    code: 'LIVO-GOLD-1000',
    coins: 1000,
    description: 'كود شحن ذهبي للمميزين',
    status: 'active',
    maxUses: 50,
    usedCount: 0,
    usedByUids: [],
    createdAt: new Date().toISOString(),
    createdBy: 'livo.admin@gmail.com'
  }
];

// Strictly approved Coin Packages (350 EGP per 1000 coins, proportional, ZERO bonus)
export const INITIAL_COIN_PACKAGES: CoinPackage[] = [
  { id: 'pkg-100', coins: 100, priceEGP: 35 },
  { id: 'pkg-200', coins: 200, priceEGP: 70 },
  { id: 'pkg-300', coins: 300, priceEGP: 105 },
  { id: 'pkg-400', coins: 400, priceEGP: 140 },
  { id: 'pkg-500', coins: 500, priceEGP: 175 },
  { id: 'pkg-600', coins: 600, priceEGP: 210 },
  { id: 'pkg-700', coins: 700, priceEGP: 245 },
  { id: 'pkg-800', coins: 800, priceEGP: 280 },
  { id: 'pkg-900', coins: 900, priceEGP: 315 },
  { id: 'pkg-1000', coins: 1000, priceEGP: 350, popular: true },
  { id: 'pkg-2000', coins: 2000, priceEGP: 700 },
  { id: 'pkg-3000', coins: 3000, priceEGP: 1050 },
  { id: 'pkg-4000', coins: 4000, priceEGP: 1400 },
  { id: 'pkg-5000', coins: 5000, priceEGP: 1750, popular: true },
  { id: 'pkg-6000', coins: 6000, priceEGP: 2100 },
  { id: 'pkg-7000', coins: 7000, priceEGP: 2450 },
  { id: 'pkg-7500', coins: 7500, priceEGP: 2625 },
  { id: 'pkg-8000', coins: 8000, priceEGP: 2800 },
  { id: 'pkg-9000', coins: 9000, priceEGP: 3150 },
  { id: 'pkg-10000', coins: 10000, priceEGP: 3500, popular: true },
];

// Blue Badge Verification pricing schedule (Independent from coins)
export const VERIFICATION_PLANS = [
  { months: 1, priceEGP: 100 },
  { months: 2, priceEGP: 150 },
  { months: 3, priceEGP: 250 },
  { months: 4, priceEGP: 350 },
  { months: 5, priceEGP: 450 },
  { months: 6, priceEGP: 550 },
  { months: 7, priceEGP: 650 },
  { months: 8, priceEGP: 750 },
  { months: 9, priceEGP: 850 },
  { months: 10, priceEGP: 950 },
  { months: 11, priceEGP: 1050 },
  { months: 12, priceEGP: 1100, saveTag: 'أفضل قيمة' },
];

// Interactive live stream animated gifts
export const INITIAL_GIFTS: GiftItem[] = [
  { id: 'gift-lion', name: 'الأسد الذهبي', coins: 5000, icon: '🦁', animationType: 'lion', durationMs: 4000 },
  { id: 'gift-car', name: 'سيارة سوبر سبورت', coins: 2000, icon: '🏎️', animationType: 'car', durationMs: 3500 },
  { id: 'gift-dragon', name: 'التنين الأسطوري', coins: 1000, icon: '🐉', animationType: 'dragon', durationMs: 3500 },
  { id: 'gift-castle', name: 'القصر الملكي', coins: 800, icon: '🏰', animationType: 'castle', durationMs: 3000 },
  { id: 'gift-rocket', name: 'الصاروخ الفضائي', coins: 500, icon: '🚀', animationType: 'rocket', durationMs: 2500 },
  { id: 'gift-diamond', name: 'ألماسة فاخرة', coins: 200, icon: '💎', animationType: 'diamond', durationMs: 2000 },
  { id: 'gift-rose', name: 'وردة حمراء', coins: 20, icon: '🌹', animationType: 'rose', durationMs: 1500 },
  { id: 'gift-heart', name: 'قلب نيون', coins: 10, icon: '💖', animationType: 'heart', durationMs: 1200 },
];

// Store Frames & Entrance Effects
export const INITIAL_STORE_ITEMS: StoreItem[] = [
  {
    id: 'frame-royal-gold',
    name: 'إطار التاج الملكي',
    type: 'frame',
    priceCoins: 1500,
    image: '👑',
    description: 'إطار ذهبي متوهج يعلوه تاج ملكي فخم'
  },
  {
    id: 'frame-neon-flame',
    name: 'إطار اللهب النيون',
    type: 'frame',
    priceCoins: 800,
    image: '🔥',
    description: 'حافة نيون أرجوانية مع نبضات لهب مستمرة'
  },
  {
    id: 'frame-cyber-shield',
    name: 'إطار الدرع السيبراني',
    type: 'frame',
    priceCoins: 1200,
    image: '🛡️',
    description: 'درع رقمي أزرق سماوي مع تأثيرات ضوئية'
  },
  {
    id: 'entrance-rolls-royce',
    name: 'دخلة رولز رويس الفاخرة',
    type: 'entrance',
    priceCoins: 3000,
    image: '🚘',
    description: 'دخول أسطوري بسيارة سوداء مع نجوم براقة في الغرفة'
  },
  {
    id: 'entrance-phoenix',
    name: 'دخلة العنقاء المتوهجة',
    type: 'entrance',
    priceCoins: 2500,
    image: '🦅',
    description: 'دخول مهيب مع طائر عنقاء يرفرف بنيران ذهبية'
  }
];

// Levels Configuration 0 to 50
export const INITIAL_LEVEL_CONFIGS: LevelConfig[] = Array.from({ length: 51 }, (_, i) => {
  if (i === 0) {
    return {
      level: 0,
      requiredCoins: 0,
      rewardDiamonds: 0,
      title: 'مستوى البداية'
    };
  }
  // Strictly progressive curve for levels 1 to 50
  const requiredCoins = Math.round((Math.pow(i, 1.95) * 600) / 100) * 100;
  const rewardDiamonds = Math.round((Math.pow(i, 1.6) * 40) / 10) * 10;
  
  let title = `المستوى ${i}`;
  if (i === 50) title = 'أسطورة LIVO الملكية (أعلى مستوى)';
  else if (i >= 40) title = 'نخبة الماس VIP';
  else if (i >= 30) title = 'فارس الذهب LIVO';
  else if (i >= 20) title = 'نجم الفضة المشرق';
  else if (i >= 10) title = 'عضو متميز برونزي';

  return {
    level: i,
    requiredCoins,
    rewardDiamonds,
    title
  };
});

// Initial real verified users with unique 5-digit UIDs
export const INITIAL_USERS: UserProfile[] = [
  {
    uid: '10000',
    email: 'livo.admin@gmail.com',
    username: 'livoadmin',
    displayName: 'LIVO Official Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    role: 'owner',
    coins: 500000,
    diamonds: 50000,
    level: 50,
    eligibleRechargedCoins: 5000000,
    unlockedLevelRewards: Array.from({ length: 50 }, (_, i) => i + 1),
    isVerified: true,
    equippedFrame: 'frame-royal-gold',
    bio: 'الحساب الرسمي لإدارة منصة LIVO 🛡️',
    followingCount: 142,
    followersCount: 12500,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: '10245',
    username: 'ahmed_king',
    displayName: 'أحمد شاهين',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    role: 'user',
    coins: 350,
    diamonds: 0,
    level: 0,
    eligibleRechargedCoins: 0,
    unlockedLevelRewards: [],
    isVerified: true,
    equippedFrame: 'frame-neon-flame',
    bio: 'صانع محتوى وبثوث يومية 🎙️ مرحباً بالجميع',
    followingCount: 88,
    followersCount: 2450,
    deviceId: 'dev_ahmed_92a1',
    createdAt: '2026-01-10T14:20:00.000Z'
  },
  {
    uid: '10246',
    username: 'sara_live',
    displayName: 'سارة نور',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
    role: 'user',
    coins: 1200,
    diamonds: 0,
    level: 0,
    eligibleRechargedCoins: 0,
    unlockedLevelRewards: [],
    isVerified: false,
    bio: 'غناء ومحادثات ليلية هادئة ✨',
    followingCount: 120,
    followersCount: 1890,
    deviceId: 'dev_sara_34b2',
    createdAt: '2026-01-15T09:12:00.000Z'
  },
  {
    uid: '10247',
    username: 'tariq_agency',
    displayName: 'طارق المصري (وكيل)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
    role: 'charging_agent',
    agencyType: 'charging_agent',
    agencyName: 'وكالة الأهرام للشحن',
    canChargeUsers: true,
    coins: 45000,
    diamonds: 500,
    level: 5,
    eligibleRechargedCoins: 25000,
    unlockedLevelRewards: [1, 2, 3, 4, 5],
    agentBalance: 40000,
    isVerified: true,
    bio: 'وكيل شحن معتمد في LIVO ⚡ سرعة وموثوقية',
    followingCount: 340,
    followersCount: 8900,
    deviceId: 'dev_tariq_78f9',
    createdAt: '2026-01-18T18:00:00.000Z'
  }
];

// Initial voice rooms grid (12 rooms with official room at top)
export const INITIAL_ROOMS: VoiceRoom[] = [
  {
    id: 'room-official-livo',
    title: '📢 الغرفة الرسمية - LIVO Admin Official',
    ownerUid: '10000',
    ownerName: 'LIVO Official Admin',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    isOfficial: true,
    status: 'open',
    category: 'إدارة وإعلانات رسمية',
    allChatDisabled: false,
    announcement: 'مرحباً بجميع رواد LIVO! مرحباً بكم في الغرفة الرسمية للإدارة.',
    seats: [
      { seatIndex: 0, occupiedByUid: '10000', occupiedByName: 'LIVO Official Admin', occupiedByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces', isMuted: false, isLocked: false },
      { seatIndex: 1, isMuted: false, isLocked: false },
      { seatIndex: 2, isMuted: false, isLocked: false },
      { seatIndex: 3, isMuted: false, isLocked: false },
      { seatIndex: 4, isMuted: false, isLocked: false },
      { seatIndex: 5, isMuted: false, isLocked: false },
      { seatIndex: 6, isMuted: false, isLocked: false },
      { seatIndex: 7, isMuted: false, isLocked: false },
    ],
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-2',
    title: 'جلسة سمر وطرب مصري 🎶',
    ownerUid: '10245',
    ownerName: 'أحمد شاهين',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    isOfficial: false,
    status: 'open',
    category: 'موسيقى ودردشة',
    allChatDisabled: false,
    announcement: 'احترام الجميع شرط أساسي للبقاء في الروم 🌟',
    seats: [
      { seatIndex: 0, occupiedByUid: '10245', occupiedByName: 'أحمد شاهين', occupiedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces', isMuted: false, isLocked: false },
      { seatIndex: 1, occupiedByUid: '10246', occupiedByName: 'سارة نور', occupiedByAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces', isMuted: false, isLocked: false },
      { seatIndex: 2, isMuted: false, isLocked: false },
      { seatIndex: 3, isMuted: false, isLocked: false },
      { seatIndex: 4, isMuted: false, isLocked: false },
      { seatIndex: 5, isMuted: false, isLocked: false },
      { seatIndex: 6, isMuted: false, isLocked: false },
      { seatIndex: 7, isMuted: false, isLocked: false },
    ],
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-3',
    title: 'ديوانية ليالي القاهرة ☕',
    ownerUid: '10247',
    ownerName: 'طارق المصري',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
    isOfficial: false,
    status: 'open',
    category: 'نقاشات عامة',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-4',
    title: 'تحديات لودو والمسابقات 🎲',
    ownerUid: '10248',
    ownerName: 'كابتن ماجد',
    ownerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'ألعاب ومسابقات',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-5',
    title: 'نادي رواد الأعمال والتقنية 💡',
    ownerUid: '10249',
    ownerName: 'م. إبراهيم',
    ownerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'تطوير وتكنولوجيا',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-6',
    title: 'خواطر وشعر وقهوة المساء 📖',
    ownerUid: '10250',
    ownerName: 'ياسمين الشام',
    ownerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'أدب وشعر',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-7',
    title: 'سهرة ضحك ومواقف طريفة 😂',
    ownerUid: '10251',
    ownerName: 'محمود كوميدي',
    ownerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'ترفيه وضحك',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-8',
    title: 'بودكاست الشباب والرياضة ⚽',
    ownerUid: '10252',
    ownerName: 'كابتن حسام',
    ownerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'رياضة وكرة قدم',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-9',
    title: 'ألحان الجيتار والموسيقى الهادئة 🎸',
    ownerUid: '10253',
    ownerName: 'عمر عازف',
    ownerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'موسيقى وعزف',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-10',
    title: 'تطوير الذات والطاقة الإيجابية 🌿',
    ownerUid: '10254',
    ownerName: 'د. منى',
    ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'تنمية بشرية',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-11',
    title: 'محبو الأنمي والجيمنج 🎮',
    ownerUid: '10255',
    ownerName: 'أوتاكو جيمر',
    ownerAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'جيمنج وأنيمي',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  },
  {
    id: 'room-12',
    title: 'ملتقى الصداقة والتعارف الراقي 🤝',
    ownerUid: '10256',
    ownerName: 'كريم وندى',
    ownerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
    isOfficial: false,
    status: 'open',
    category: 'صداقة وتعارف',
    allChatDisabled: false,
    seats: Array(8).fill(null).map((_, i) => ({ seatIndex: i, isMuted: false, isLocked: false })),
    mutedUsers: [],
    bannedUsers: []
  }
];

// Initial genuine user videos (NO fake videos or inflated numbers)
export const INITIAL_VIDEOS: VideoPost[] = [
  {
    id: 'vid-1',
    authorUid: '10245',
    authorName: 'أحمد شاهين',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    isVerified: true,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'أجمل لقطات لايف الليلة مع الأصدقاء شكراً لكل الداعمين 💎🔥',
    likesCount: 28,
    commentsCount: 6,
    createdAt: '2026-11-08T18:30:00.000Z'
  },
  {
    id: 'vid-2',
    authorUid: '10246',
    authorName: 'سارة نور',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
    isVerified: false,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    caption: 'مقطع غنائي هادئ قبل انطلاق التحدي القادم 🎤🎵 شاركوني رأيكم!',
    likesCount: 45,
    commentsCount: 11,
    createdAt: '2026-11-09T08:15:00.000Z'
  }
];
