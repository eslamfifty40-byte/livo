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

// Zero fake seeded users — all users come from real Firebase Auth / Admin creation
export const INITIAL_USERS: UserProfile[] = [];

// Single official LIVO Admin room (starts closed until opened by Owner/Admin)
export const INITIAL_ROOMS: VoiceRoom[] = [
  {
    id: 'room-official-livo',
    title: '📢 الغرفة الرسمية - LIVO Official',
    ownerUid: '10000',
    ownerName: 'إدارة LIVO الرسمية',
    ownerAvatar: '/assets/livo/customer_icon.jpg',
    isOfficial: true,
    roomType: 'voice',
    status: 'closed',
    category: 'إدارة وإعلانات رسمية',
    viewersCount: 0,
    allChatDisabled: false,
    announcement: 'مرحباً بجميع رواد LIVO! مرحباً بكم في الغرفة الرسمية للإدارة.',
    seats: Array.from({ length: 12 }, (_, idx) => ({
      seatIndex: idx,
      isMuted: false,
      isLocked: false
    })),
    mutedUsers: [],
    bannedUsers: [],
    messages: []
  }
];

// Zero fake seeded videos — only real user uploads
export const INITIAL_VIDEOS: VideoPost[] = [];

