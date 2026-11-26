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

// Exact 7 Official Gift Categories
export const GIFT_CATEGORIES = [
  'الهدايا الملكية',
  'الحيوانات',
  'السيارات',
  'الحب',
  'الألماس',
  'الحفلات',
  'كروت الهدايا'
] as const;

export function normalizeGiftCategory(rawCategory?: string, isCard?: boolean): string {
  if (isCard) return 'كروت الهدايا';
  const cat = (rawCategory || '').trim();
  if (!cat) return 'الهدايا الملكية';
  if (cat === 'ملكي' || cat === 'الهدايا الملكية') return 'الهدايا الملكية';
  if (cat === 'حيوانات' || cat === 'الحيوانات') return 'الحيوانات';
  if (cat === 'سيارات وطائرات' || cat === 'السيارات') return 'السيارات';
  if (cat === 'حب' || cat === 'الحب') return 'الحب';
  if (cat === 'ألماس' || cat === 'الألماس') return 'الألماس';
  if (cat === 'حفلات' || cat === 'الحفلات') return 'الحفلات';
  if (cat === 'كروت إهداء' || cat === 'كروت الهدايا') return 'كروت الهدايا';
  return cat;
}

// Interactive live stream animated gifts (8 core + 200 expanded catalog gifts = 208 gifts)
const CORE_INITIAL_GIFTS: GiftItem[] = [
  { id: 'gift-lion', name: 'الأسد الذهبي', coins: 5000, icon: '🦁', animationType: 'lion', durationMs: 4400, category: 'الحيوانات' },
  { id: 'gift-car', name: 'سيارة سوبر سبورت', coins: 2000, icon: '🏎️', animationType: 'car', durationMs: 3500, category: 'السيارات' },
  { id: 'gift-dragon', name: 'التنين الأسطوري', coins: 1000, icon: '🐉', animationType: 'dragon', durationMs: 3500, category: 'الحيوانات' },
  { id: 'gift-castle', name: 'القصر الملكي', coins: 800, icon: '🏰', animationType: 'castle', durationMs: 3000, category: 'الهدايا الملكية' },
  { id: 'gift-rocket', name: 'الصاروخ الفضائي', coins: 500, icon: '🚀', animationType: 'rocket', durationMs: 2500, category: 'السيارات' },
  { id: 'gift-diamond', name: 'ألماسة فاخرة', coins: 200, icon: '💎', animationType: 'diamond', durationMs: 2000, category: 'الألماس' },
  { id: 'gift-rose', name: 'وردة حمراء', coins: 20, icon: '🌹', animationType: 'rose', durationMs: 1500, category: 'الحب' },
  { id: 'gift-heart', name: 'قلب نيون', coins: 10, icon: '💖', animationType: 'heart', durationMs: 1200, category: 'الحب' },
];

const EXPANDED_GIFT_TEMPLATES: Array<{
  name: string;
  coins: number;
  icon: string;
  animationType: GiftItem['animationType'];
  category: string;
  isCard?: boolean;
}> = [
  // كروت إهداء قابلة للكتابة (Gift Cards)
  { name: 'كارت محبة ذهبي', coins: 50, icon: '💌', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت تهنئة ملكي', coins: 150, icon: '🪪', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت دعوة VIP', coins: 300, icon: '🎟️', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت إهداء الماس', coins: 500, icon: '💳', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت شكر فاخر', coins: 80, icon: '📜', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت حب ورومانسية', coins: 120, icon: '💝', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت صداقة أبدية', coins: 60, icon: '🧧', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت نجم الغرفة', coins: 400, icon: '🎫', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت الأسطورة', coins: 1200, icon: '🏅', animationType: 'card', category: 'كروت إهداء', isCard: true },
  { name: 'كارت عيد ميلاد سعيد', coins: 100, icon: '🎂', animationType: 'card', category: 'كروت إهداء', isCard: true },
  // حيوانات (Animals)
  { name: 'الأسد الملك المتجول', coins: 6500, icon: '🦁', animationType: 'lion', category: 'حيوانات' },
  { name: 'نمر ملكي ذهبي', coins: 3200, icon: '🐯', animationType: 'lion', category: 'حيوانات' },
  { name: 'صقر الصحراء الحر', coins: 1800, icon: '🦅', animationType: 'wings', category: 'حيوانات' },
  { name: 'حصان عربي أصيل', coins: 2400, icon: '🐎', animationType: 'lion', category: 'حيوانات' },
  { name: 'طاووس الألوان الملكي', coins: 900, icon: '🦚', animationType: 'wings', category: 'حيوانات' },
  { name: 'فهد السرعة', coins: 2100, icon: '🐆', animationType: 'lion', category: 'حيوانات' },
  { name: 'فراشة الكريستال', coins: 45, icon: '🦋', animationType: 'wings', category: 'حيوانات' },
  { name: 'دولفين المحيط', coins: 280, icon: '🐬', animationType: 'ship', category: 'حيوانات' },
  { name: 'باندا لطيف', coins: 95, icon: '🐼', animationType: 'heart', category: 'حيوانات' },
  { name: 'وحيد القرن الفضي', coins: 1400, icon: '🦄', animationType: 'wings', category: 'حيوانات' },
  { name: 'ذئب الليل', coins: 1600, icon: '🐺', animationType: 'lion', category: 'حيوانات' },
  { name: 'تنين النار الأحمر', coins: 4200, icon: '🐲', animationType: 'dragon', category: 'حيوانات' },
  { name: 'بجعة بيضاء', coins: 220, icon: '🦢', animationType: 'wings', category: 'حيوانات' },
  { name: 'طائر الفينيق', coins: 5500, icon: '🐦‍🔥', animationType: 'dragon', category: 'حيوانات' },
  { name: 'غزال ملكي', coins: 650, icon: '🦌', animationType: 'lion', category: 'حيوانات' },
  { name: 'أرنوب لطيف', coins: 15, icon: '🐰', animationType: 'heart', category: 'حيوانات' },
  { name: 'قطة مدللة', coins: 25, icon: '🐱', animationType: 'heart', category: 'حيوانات' },
  { name: 'دب محبة', coins: 35, icon: '🧸', animationType: 'heart', category: 'حيوانات' },
  { name: 'حوت أزرق عملاق', coins: 3800, icon: '🐋', animationType: 'ship', category: 'حيوانات' },
  { name: 'تمساح النيل', coins: 750, icon: '🐊', animationType: 'dragon', category: 'حيوانات' },
  // سيارات وطائرات ويخوت (Cars, Jets, Ships)
  { name: 'لامبورغيني ذهبية', coins: 4500, icon: '🏎️', animationType: 'car', category: 'سيارات وطائرات' },
  { name: 'رولز رويس فانتوم', coins: 6000, icon: '🚘', animationType: 'car', category: 'سيارات وطائرات' },
  { name: 'طائرة خاصة VIP', coins: 8500, icon: '🛩️', animationType: 'rocket', category: 'سيارات وطائرات' },
  { name: 'طائرة كونكورد', coins: 12000, icon: '✈️', animationType: 'rocket', category: 'سيارات وطائرات' },
  { name: 'يخت ملكي فاخر', coins: 7500, icon: '🛥️', animationType: 'ship', category: 'سيارات وطائرات' },
  { name: 'سفينة القراصنة', coins: 3500, icon: '⛵', animationType: 'ship', category: 'سيارات وطائرات' },
  { name: 'دراجة نارية رياضية', coins: 1100, icon: '🏍️', animationType: 'car', category: 'سيارات وطائرات' },
  { name: 'هليكوبتر رئاسية', coins: 5200, icon: '🚁', animationType: 'rocket', category: 'سيارات وطائرات' },
  { name: 'مكوك فضائي ذهبي', coins: 9900, icon: '🛸', animationType: 'rocket', category: 'سيارات وطائرات' },
  { name: 'سيارة فيراري حمراء', coins: 4000, icon: '🚗', animationType: 'car', category: 'سيارات وطائرات' },
  { name: 'جيب صحراوي فاخر', coins: 2200, icon: '🚙', animationType: 'car', category: 'سيارات وطائرات' },
  { name: 'قطار سريع ملكي', coins: 2900, icon: '🚄', animationType: 'car', category: 'سيارات وطائرات' },
  { name: 'كبسولة الفضاء', coins: 4800, icon: '🛰️', animationType: 'rocket', category: 'سيارات وطائرات' },
  { name: 'سفينة كروز العملاقة', coins: 15000, icon: '🛳️', animationType: 'ship', category: 'سيارات وطائرات' },
  { name: 'جيت سكي بحري', coins: 650, icon: '🚤', animationType: 'ship', category: 'سيارات وطائرات' },
  // ملكي وتيجان وقصور (Royal)
  { name: 'التاج الإمبراطوري', coins: 3000, icon: '👑', animationType: 'crown', category: 'ملكي' },
  { name: 'عرش الملوك', coins: 10000, icon: '🪑', animationType: 'castle', category: 'ملكي' },
  { name: 'قصر الأحلام المضيء', coins: 18000, icon: '🏯', animationType: 'castle', category: 'ملكي' },
  { name: 'جزيرة الماس الخاصة', coins: 25000, icon: '🏝️', animationType: 'castle', category: 'ملكي' },
  { name: 'عصا السحر الملكية', coins: 550, icon: '🪄', animationType: 'fireworks', category: 'ملكي' },
  { name: 'كأس البطولة الذهبي', coins: 1500, icon: '🏆', animationType: 'crown', category: 'ملكي' },
  { name: 'درع الحماية الملكي', coins: 850, icon: '🛡️', animationType: 'crown', category: 'ملكي' },
  { name: 'سيف الفارس الذهبي', coins: 1250, icon: '⚔️', animationType: 'crown', category: 'ملكي' },
  { name: 'ميدالية الأبطال', coins: 420, icon: '🥇', animationType: 'crown', category: 'ملكي' },
  { name: 'أجنحة الملاك الذهبية', coins: 2600, icon: '🪽', animationType: 'wings', category: 'ملكي' },
  { name: 'برج النجوم', coins: 7200, icon: '🗼', animationType: 'castle', category: 'ملكي' },
  { name: 'عربة السندريلا', coins: 4300, icon: '🎠', animationType: 'castle', category: 'ملكي' },
  { name: 'صندوق الكنز', coins: 1900, icon: '🧰', animationType: 'diamond', category: 'ملكي' },
  { name: 'مفتاح القصر', coins: 380, icon: '🗝️', animationType: 'crown', category: 'ملكي' },
  { name: 'ساعة رولكس ذهبية', coins: 2700, icon: '⌚', animationType: 'crown', category: 'ملكي' },
  // حب ورومانسية (Romance)
  { name: 'باقة ورد ملكية', coins: 90, icon: '💐', animationType: 'rose', category: 'حب' },
  { name: 'خاتم الماس والزواج', coins: 1500, icon: '💍', animationType: 'diamond', category: 'حب' },
  { name: 'قلبان متعانقان', coins: 180, icon: '💞', animationType: 'heart', category: 'حب' },
  { name: 'سهم كيوبيد', coins: 260, icon: '💘', animationType: 'heart', category: 'حب' },
  { name: 'وردة التوليب الوردية', coins: 25, icon: '🌷', animationType: 'rose', category: 'حب' },
  { name: 'زهرة الكرز اليابانية', coins: 35, icon: '🌸', animationType: 'rose', category: 'حب' },
  { name: 'أحمر الشفاه الفاخر', coins: 75, icon: '💄', animationType: 'heart', category: 'حب' },
  { name: 'قبلة حب ساخنة', coins: 55, icon: '💋', animationType: 'heart', category: 'حب' },
  { name: 'عطر باريس الفاخر', coins: 340, icon: '🧴', animationType: 'diamond', category: 'حب' },
  { name: 'فستان سهرة ملكي', coins: 890, icon: '👗', animationType: 'wings', category: 'حب' },
  { name: 'قلادة اللؤلؤ', coins: 460, icon: '📿', animationType: 'diamond', category: 'حب' },
  { name: 'قلب مشتعل', coins: 310, icon: '❤️‍🔥', animationType: 'heart', category: 'حب' },
  { name: 'شمس المحبة', coins: 110, icon: '🌻', animationType: 'rose', category: 'حب' },
  { name: 'إكليل الزهور', coins: 190, icon: '🌺', animationType: 'rose', category: 'حب' },
  { name: 'صندوق الشوكولاتة', coins: 65, icon: '🍫', animationType: 'heart', category: 'حب' },
  // ألماس وجواهر (Gems)
  { name: 'جوهرة السفير الزرقاء', coins: 1300, icon: '💠', animationType: 'diamond', category: 'ألماس' },
  { name: 'كريستالة السماء', coins: 620, icon: '🔮', animationType: 'diamond', category: 'ألماس' },
  { name: 'سبائك الذهب الخالص', coins: 3400, icon: '🪙', animationType: 'diamond', category: 'ألماس' },
  { name: 'حقيبة الأموال', coins: 2500, icon: '💰', animationType: 'fireworks', category: 'ألماس' },
  { name: 'ورقة الدولار الذهبية', coins: 490, icon: '💵', animationType: 'fireworks', category: 'ألماس' },
  { name: 'نجمة المجرة', coins: 700, icon: '🌟', animationType: 'fireworks', category: 'ألماس' },
  { name: 'شهاب السماء', coins: 1150, icon: '☄️', animationType: 'rocket', category: 'ألماس' },
  { name: 'هلال الذهب', coins: 350, icon: '🌙', animationType: 'crown', category: 'ألماس' },
  { name: 'قوس قزح السحري', coins: 410, icon: '🌈', animationType: 'wings', category: 'ألماس' },
  { name: 'ندفة ثلج كريستالية', coins: 85, icon: '❄️', animationType: 'diamond', category: 'ألماس' },
  // حفلات وموسيقى ومشروبات (Party & Music)
  { name: 'ألعاب نارية عملاقة', coins: 2200, icon: '🎆', animationType: 'fireworks', category: 'حفلات' },
  { name: 'بريق الاحتفال', coins: 130, icon: '🎇', animationType: 'fireworks', category: 'حفلات' },
  { name: 'انفجار السعادة', coins: 90, icon: '🎉', animationType: 'fireworks', category: 'حفلات' },
  { name: 'كرة الديسكو المضيئة', coins: 450, icon: '🪩', animationType: 'fireworks', category: 'حفلات' },
  { name: 'مايكروفون النجوم الذهبي', coins: 580, icon: '🎤', animationType: 'crown', category: 'حفلات' },
  { name: 'جيتار الروك', coins: 390, icon: '🎸', animationType: 'fireworks', category: 'حفلات' },
  { name: 'بيانو الحفلات الملكي', coins: 1450, icon: '🎹', animationType: 'castle', category: 'حفلات' },
  { name: 'سماعات الدي جي', coins: 240, icon: '🎧', animationType: 'fireworks', category: 'حفلات' },
  { name: 'كوب عصير ملكي', coins: 15, icon: '🍹', animationType: 'heart', category: 'حفلات' },
  { name: 'قهوة الصباح', coins: 5, icon: '☕', animationType: 'heart', category: 'حفلات' },
  { name: 'آيس كريم الصيف', coins: 12, icon: '🍦', animationType: 'heart', category: 'حفلات' },
  { name: 'كب كيك الحفلة', coins: 18, icon: '🧁', animationType: 'heart', category: 'حفلات' },
  { name: 'دونات حلوة', coins: 10, icon: '🍩', animationType: 'heart', category: 'حفلات' },
  { name: 'برغر السهرة', coins: 30, icon: '🍔', animationType: 'heart', category: 'حفلات' },
  { name: 'بيتزا الأصدقاء', coins: 40, icon: '🍕', animationType: 'heart', category: 'حفلات' },
  { name: 'سوشي فاخر', coins: 80, icon: '🍣', animationType: 'heart', category: 'حفلات' },
  { name: 'طقم بالونات ملونة', coins: 50, icon: '🎈', animationType: 'fireworks', category: 'حفلات' },
  { name: 'كأس احتفال فاخر', coins: 160, icon: '🥂', animationType: 'fireworks', category: 'حفلات' },
  { name: 'ساكسفون الجاز', coins: 330, icon: '🎷', animationType: 'fireworks', category: 'حفلات' },
  { name: 'طبلة الحفلات', coins: 210, icon: '🥁', animationType: 'fireworks', category: 'حفلات' },
];

const EXTRA_THEMES: Array<{
  prefix: string;
  suffixes: string[];
  icon: string;
  animationType: GiftItem['animationType'];
  category: string;
  baseCoins: number;
  isCard?: boolean;
}> = [
  { prefix: 'كارت', suffixes: ['الوفاء', 'الإخلاص', 'النجومية', 'الأمراء', 'الليل', 'القمر', 'الشمس', 'الفخامة', 'السعادة', 'الورد'], icon: '💌', animationType: 'card', category: 'كروت إهداء', baseCoins: 95, isCard: true },
  { prefix: 'تاج', suffixes: ['السلطان', 'الملكة', 'الفجر', 'الماس', 'الزمرد', 'الذهب', 'الياقوت', 'اللؤلؤ', 'السحاب', 'العظمة'], icon: '👑', animationType: 'crown', category: 'ملكي', baseCoins: 650 },
  { prefix: 'أسد', suffixes: ['العرين', 'القوة', 'الهيبة', 'الفخر', 'الصحراء', 'النار', 'الجليد', 'الأطلس', 'الشجاعة', 'الأبيض'], icon: '🦁', animationType: 'lion', category: 'حيوانات', baseCoins: 3100 },
  { prefix: 'سيارة', suffixes: ['البرق', 'الأحلام', 'الملياردير', 'السباق', 'بوغاتي', 'ماكلارين', 'بورش', 'مرسيدس', 'بنتلي', 'تيسلا'], icon: '🏎️', animationType: 'car', category: 'سيارات وطائرات', baseCoins: 2400 },
  { prefix: 'يخت', suffixes: ['الفيلا', 'الأمواج', 'دبي', 'المحيط', 'الأميرات', 'الشمس', 'الكاريبي', 'الذهب', 'الفيروز', 'المرجان'], icon: '🛥️', animationType: 'ship', category: 'سيارات وطائرات', baseCoins: 4200 },
  { prefix: 'قصر', suffixes: ['السلاطين', 'الورود', 'الثلج', 'السماء', 'الرمال', 'القمر', 'النجوم', 'العقيق', 'المرمر', 'الأمل'], icon: '🏰', animationType: 'castle', category: 'ملكي', baseCoins: 3600 },
  { prefix: 'ألماسة', suffixes: ['القلب', 'البرق', 'العسل', 'الليل', 'البحر', 'النور', 'الفرح', 'الأمل', 'الحلم', 'المجد'], icon: '💎', animationType: 'diamond', category: 'ألماس', baseCoins: 290 },
  { prefix: 'وردة', suffixes: ['الصباح', 'المساء', 'العشق', 'الياسمين', 'الجوري', 'القرنفل', 'الأوركيد', 'النرجس', 'الندى', 'الربيع'], icon: '🌹', animationType: 'rose', category: 'حب', baseCoins: 35 },
  { prefix: 'صاروخ', suffixes: ['النصر', 'الفضاء', 'المجرة', 'الشهاب', 'القمر', 'البرق', 'الرياح', 'الحماس', 'الطاقة', 'الإبداع'], icon: '🚀', animationType: 'rocket', category: 'سيارات وطائرات', baseCoins: 780 },
  { prefix: 'قلب', suffixes: ['الذهب', 'الفضة', 'الألماس', 'الوفاء', 'الحنين', 'الأمان', 'الشوق', 'النبض', 'الورد', 'الفرح'], icon: '💖', animationType: 'heart', category: 'حب', baseCoins: 55 },
];

const BUILT_200_GIFTS: GiftItem[] = (() => {
  const list: GiftItem[] = EXPANDED_GIFT_TEMPLATES.map((t, idx) => ({
    id: `gift-pack-${idx + 1}`,
    name: t.name,
    coins: t.coins,
    icon: t.icon,
    animationType: t.animationType,
    durationMs: t.animationType === 'lion' ? 4400 : t.isCard ? 3600 : t.coins >= 1000 ? 3400 : 2200,
    category: normalizeGiftCategory(t.category, t.isCard),
    isCard: Boolean(t.isCard),
    isActive: true
  }));
  let extraCounter = list.length + 1;
  for (const grp of EXTRA_THEMES) {
    for (let sIdx = 0; sIdx < grp.suffixes.length && list.length < 200; sIdx++) {
      const price = Math.max(10, Math.round((grp.baseCoins + sIdx * Math.max(15, Math.round(grp.baseCoins * 0.12))) / 5) * 5);
      list.push({
        id: `gift-pack-${extraCounter}`,
        name: `${grp.prefix} ${grp.suffixes[sIdx]}`,
        coins: price,
        icon: grp.icon,
        animationType: grp.animationType,
        durationMs: grp.animationType === 'lion' ? 4400 : grp.isCard ? 3600 : price >= 1000 ? 3400 : 2300,
        category: normalizeGiftCategory(grp.category, grp.isCard),
        isCard: Boolean(grp.isCard),
        isActive: true
      });
      extraCounter += 1;
    }
  }
  return list.slice(0, 200);
})();

export const INITIAL_GIFTS: GiftItem[] = [...CORE_INITIAL_GIFTS, ...BUILT_200_GIFTS];

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

export interface RoyalFramePreset {
  id: string;
  name: string;
  url: string;
  defaultGlow: string;
  recommendedAnimated: boolean;
}

export const ROYAL_FRAME_PRESETS: RoyalFramePreset[] = [
  { id: 'rf-01', name: 'أزرق أساسي', url: '/assets/frames/01_basic_blue.png', defaultGlow: 'rgba(59, 130, 246, 0.85)', recommendedAnimated: false },
  { id: 'rf-02', name: 'أخضر أساسي', url: '/assets/frames/02_basic_green.png', defaultGlow: 'rgba(16, 185, 129, 0.85)', recommendedAnimated: false },
  { id: 'rf-03', name: 'فضي أزرق متقدم', url: '/assets/frames/03_silver_blue.png', defaultGlow: 'rgba(56, 189, 248, 0.9)', recommendedAnimated: true },
  { id: 'rf-04', name: 'الأجنحة الفضية', url: '/assets/frames/04_silver_wings.png', defaultGlow: 'rgba(148, 163, 184, 0.95)', recommendedAnimated: true },
  { id: 'rf-05', name: 'الأجنحة الذهبية', url: '/assets/frames/05_gold_wings.png', defaultGlow: 'rgba(245, 158, 11, 0.95)', recommendedAnimated: true },
  { id: 'rf-07', name: 'الألماس الأزرق', url: '/assets/frames/07_diamond_blue.png', defaultGlow: 'rgba(37, 99, 235, 0.95)', recommendedAnimated: true },
  { id: 'rf-08', name: 'الزمرد الملكي', url: '/assets/frames/08_emerald.png', defaultGlow: 'rgba(16, 185, 129, 0.95)', recommendedAnimated: true },
  { id: 'rf-10', name: 'الكريستال البنفسجي', url: '/assets/frames/10_crystal_purple.png', defaultGlow: 'rgba(168, 85, 247, 0.95)', recommendedAnimated: true },
  { id: 'rf-12', name: 'VIP الذهبي', url: '/assets/frames/12_vip_gold.png', defaultGlow: 'rgba(250, 204, 21, 0.98)', recommendedAnimated: true },
  { id: 'rf-13', name: 'الملكي الليموني', url: '/assets/frames/13_royal_lime.png', defaultGlow: 'rgba(132, 204, 22, 0.95)', recommendedAnimated: true },
  { id: 'rf-14', name: 'تاج الفخامة 38', url: '/assets/frames/14_frame_38.png', defaultGlow: 'rgba(245, 158, 11, 0.92)', recommendedAnimated: true },
  { id: 'rf-15', name: 'عرش الأسد الزمردي', url: '/assets/frames/15_royal_lion_emerald.png', defaultGlow: 'rgba(20, 184, 166, 0.95)', recommendedAnimated: true },
  { id: 'rf-16', name: 'عرش الأسد القرمزي', url: '/assets/frames/16_royal_lion_crimson.png', defaultGlow: 'rgba(239, 68, 68, 0.95)', recommendedAnimated: true },
  { id: 'rf-17', name: 'عرش الأسد الأرجواني', url: '/assets/frames/17_royal_lion_purple.png', defaultGlow: 'rgba(168, 85, 247, 0.95)', recommendedAnimated: true }
];

export const GLOW_COLOR_PRESETS = [
  { id: 'none', label: 'بدون توهج', value: 'none', swatch: '#9ca3af' },
  { id: 'rgba(250, 204, 21, 0.95)', label: 'ذهبي مشع', value: 'rgba(250, 204, 21, 0.95)', swatch: '#facc15' },
  { id: 'rgba(56, 189, 248, 0.95)', label: 'سماوي نيون', value: 'rgba(56, 189, 248, 0.95)', swatch: '#38bdf8' },
  { id: 'rgba(236, 72, 153, 0.95)', label: 'وردي نيون', value: 'rgba(236, 72, 153, 0.95)', swatch: '#ec4899' },
  { id: 'rgba(239, 68, 68, 0.95)', label: 'أحمر ملكي', value: 'rgba(239, 68, 68, 0.95)', swatch: '#ef4444' },
  { id: 'rgba(249, 115, 22, 0.95)', label: 'برتقالي ناري', value: 'rgba(249, 115, 22, 0.95)', swatch: '#f97316' },
  { id: 'rgba(168, 85, 247, 0.95)', label: 'أرجواني فاخر', value: 'rgba(168, 85, 247, 0.95)', swatch: '#a855f7' },
  { id: 'rgba(16, 185, 129, 0.95)', label: 'زمردي متلألئ', value: 'rgba(16, 185, 129, 0.95)', swatch: '#10b981' },
  { id: 'rgba(132, 204, 22, 0.95)', label: 'ليموني نيون', value: 'rgba(132, 204, 22, 0.95)', swatch: '#84cc16' },
  { id: 'rgba(241, 245, 249, 0.95)', label: 'بلاتيني ساطع', value: 'rgba(241, 245, 249, 0.95)', swatch: '#e2e8f0' }
];

