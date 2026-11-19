import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  CreditCard,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { INITIAL_COIN_PACKAGES, INITIAL_PAYMENT_METHODS } from '../../data/initialData';
import { CoinPackage, UserProfile, PaymentMethodConfig } from '../../types';
import { livoStore } from '../../services/livoStore';

interface RechargeModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({ user, isOpen, onClose }) => {
  // Tabs: 'receipt' (باقات التحويل والإيصال) or 'voucher' (كود الشحن الفوري)
  const [activeTab, setActiveTab] = useState<'receipt' | 'voucher'>('receipt');

  // Dynamic Payment Methods from Admin (Requirement 5)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() => {
    const active = livoStore.getActivePaymentMethods();
    return active.length > 0 ? active : INITIAL_PAYMENT_METHODS;
  });
  const [selectedMethodId, setSelectedMethodId] = useState<string>(() => {
    const def = livoStore.getDefaultPaymentMethod();
    return def ? def.id : (INITIAL_PAYMENT_METHODS[0]?.id || '');
  });

  // Dynamic Coin Packages from Admin CRUD
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>(() => {
    const active = livoStore.getActiveCoinPackages();
    return active.length > 0 ? active : INITIAL_COIN_PACKAGES;
  });

  // Package & Form Fields
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(() => {
    const active = livoStore.getActiveCoinPackages();
    const list = active.length > 0 ? active : INITIAL_COIN_PACKAGES;
    return list.find(p => p.popular) || list[0];
  });
  const [payerPhone, setPayerPhone] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [copiedMethodId, setCopiedMethodId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

  // Voucher Code Form (Requirement 4)
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Sync payment methods & coin packages in real time when Admin modifies them
  useEffect(() => {
    const syncStore = () => {
      const activeMethods = livoStore.getActivePaymentMethods();
      setPaymentMethods(activeMethods.length > 0 ? activeMethods : INITIAL_PAYMENT_METHODS);

      const activePkgs = livoStore.getActiveCoinPackages();
      const pkgList = activePkgs.length > 0 ? activePkgs : INITIAL_COIN_PACKAGES;
      setCoinPackages(pkgList);
      setSelectedPkg(prev => pkgList.find(p => p.id === prev?.id) || pkgList.find(p => p.popular) || pkgList[0]);
    };
    const unsub = livoStore.subscribe(syncStore);
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentMethod = paymentMethods.find(m => m.id === selectedMethodId) || paymentMethods[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMethodId(id);
    setTimeout(() => setCopiedMethodId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('يرجى اختيار ملف صورة صالح (JPG أو PNG)');
        return;
      }
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setReceiptImage(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Recharge Order with Receipt
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPkg) {
      setErrorMsg('يرجى اختيار باقة الكوينز');
      return;
    }

    if (!payerPhone.trim()) {
      setErrorMsg('يرجى كتابة رقم الهاتف أو المحفظة المحول منها');
      return;
    }

    if (!receiptImage) {
      setErrorMsg('رفع صورة إيصال التحويل إلزامي لإتمام الطلب ومراجعته من الإدارة');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = livoStore.submitRechargeRequest({
        uid: user.uid,
        packageCoins: selectedPkg.coins,
        amountEGP: selectedPkg.priceEGP,
        payerPhone: payerPhone.trim(),
        receiptUrl: receiptImage
      });

      setSuccessOrderNumber(order.orderNumber);
      setPayerPhone('');
      setReceiptImage(null);
      setReceiptFileName('');
    } catch {
      setErrorMsg('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redeem Voucher Code (Requirement 4)
  const handleRedeemVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);
    setVoucherSuccess(null);

    if (!voucherCodeInput.trim()) {
      setVoucherError('يرجى إدخال كود الشحن');
      return;
    }

    const res = livoStore.redeemRechargeCode(voucherCodeInput, user.uid);
    if (res.success) {
      setVoucherSuccess(res.message);
      setVoucherCodeInput('');
    } else {
      setVoucherError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-[#170b2c] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-purple-800/60 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white animate-in fade-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-purple-800/40 flex items-center justify-between bg-[#1f103b]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">شحن كوينز LIVO الرسمية</h2>
              <p className="text-xs text-purple-300">
                1000 كوينز = <span className="font-digits font-bold text-amber-300">350</span> ج.م (تفعيل وإشراف إداري مباشر)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-900/50 hover:bg-purple-800 flex items-center justify-center text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Receipt vs Voucher Code (Requirement 4) */}
        <div className="flex bg-[#120824] p-1.5 border-b border-purple-900/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('receipt');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'receipt'
                ? 'bg-[#FFE600] text-black shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>وسائل الدفع والتحويل المعتمدة</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('voucher');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'voucher'
                ? 'bg-[#FFE600] text-black shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>شحن فوري بكود الشحن</span>
          </button>
        </div>

        {/* Success Modal View for Order Submission */}
        {successOrderNumber ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">تم إرسال طلب الشحن بنجاح!</h3>
            <p className="text-sm text-purple-300">
              رقم الطلب: <span className="font-digits font-bold text-amber-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/50">{successOrderNumber}</span>
            </p>
            <div className="bg-purple-950/60 border border-purple-800/40 rounded-2xl p-4 text-xs text-purple-200 leading-relaxed text-right space-y-1.5">
              <p className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Sparkles className="w-4 h-4" /> وصل الطلب إلى لوحة LIVO Admin للمراجعة الفورية
              </p>
              <p>• سيتم التحقق من إيصال الدفع وإضافة الكوينز لحسابك مباشرة فور تأكيد الإدارة.</p>
              <p>• الطلب مربوط بـ UID الخاص بك ({user.uid}) ومحفوظ دائماً في قاعدة البيانات.</p>
            </div>
            <button
              onClick={() => {
                setSuccessOrderNumber(null);
                onClose();
              }}
              className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition-all"
            >
              حسناً، استمرار
            </button>
          </div>
        ) : activeTab === 'voucher' ? (
          /* TAB 2: Instant Voucher Code Redemption (Requirement 4) */
          <div className="p-5 overflow-y-auto space-y-4 text-right">
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-900/30 to-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-2">
              <h4 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>إدخال كود الشحن والتحقق الفوري منه</span>
              </h4>
              <p className="text-xs text-purple-200 leading-relaxed">
                إذا حصلت على كود شحن من الإدارة أو أحد وكلاء LIVO المعتمدين، أدخله هنا لإضافة الكوينز إلى رصيدك فوراً وبشكل آمن ومحمي ضد التكرار.
              </p>
            </div>

            {voucherSuccess && (
              <div className="p-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
                <span>{voucherSuccess}</span>
              </div>
            )}

            {voucherError && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{voucherError}</span>
              </div>
            )}

            <form onSubmit={handleRedeemVoucher} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1">
                  أدخل كود الشحن المعتمد:
                </label>
                <input
                  type="text"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  placeholder="مثال: LIVO-VIP-500 أو LIVO-GOLD-1000"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-4 py-3 text-center text-sm font-digits font-black tracking-widest text-amber-300 outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="bg-[#120824]/60 p-3 rounded-xl border border-purple-900/40 text-[11px] text-purple-300 leading-relaxed">
                <p>• أكواد الشحن مخصصة للاستخدام الفردي فقط ولا يمكن تكرار استخدامها لنفس الحساب.</p>
                <p>• يتم تسجيل العملية وتحديث رصيد الكوينز تلقائياً بعد التحقق من صحة الكود.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 active:scale-[0.98] text-black font-black text-xs rounded-xl shadow-lg transition-all"
              >
                التحقق وشحن الكوينز فوراً ⚡
              </button>
            </form>
          </div>
        ) : (
          /* TAB 1: Payment Methods & Receipt Upload */
          <div className="p-4 overflow-y-auto space-y-4">
            {/* User Info Bar */}
            <div className="flex items-center justify-between bg-[#120824] p-3 rounded-2xl border border-purple-900/60">
              <div className="flex items-center gap-2">
                <img src={user.avatar} alt={user.displayName} className="w-8 h-8 rounded-full border border-purple-500/40" />
                <span className="text-xs font-bold text-white">{user.displayName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-300">
                  UID: <strong className="font-digits text-amber-400">{user.uid}</strong>
                </span>
                <span className="text-xs text-purple-300">
                  الرصيد: <strong className="font-digits text-amber-300">{user.coins.toLocaleString()}</strong> كوينز
                </span>
              </div>
            </div>

            {/* Dynamic Payment Methods from Admin (Requirement 5) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-purple-200">
                وسائل الدفع المعتمدة حالياً (المحددة من الإدارة):
              </label>
              
              {/* Payment Method Selector Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethodId(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      currentMethod?.id === m.id
                        ? 'bg-[#FFE600] text-black border-amber-400 shadow-sm'
                        : 'bg-[#120824] text-purple-300 border-purple-800/50 hover:bg-purple-900/30'
                    }`}
                  >
                    {m.title}
                  </button>
                ))}
              </div>

              {/* Active Method Details Box */}
              {currentMethod && (
                <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-950/90 p-3.5 rounded-2xl border border-purple-700/40 space-y-2.5 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-200 font-bold">{currentMethod.title}:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-bold">
                      {currentMethod.isDefault ? 'وسيلة الدفع الافتراضية' : 'مفعل ومعتمد'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-purple-800/40">
                    <div>
                      <span className="font-digits text-sm font-black text-amber-400 tracking-wider">
                        {currentMethod.accountNumber}
                      </span>
                      {currentMethod.accountHolder && (
                        <span className="text-[11px] text-purple-300 block">
                          اسم صاحب الحساب: <strong className="text-white">{currentMethod.accountHolder}</strong>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentMethod.accountNumber, currentMethod.id)}
                      className="flex items-center gap-1 text-xs bg-purple-800/80 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors font-bold"
                    >
                      {copiedMethodId === currentMethod.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMethodId === currentMethod.id ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>

                  {currentMethod.instructions && (
                    <p className="text-[11px] text-purple-200 leading-relaxed bg-purple-950/50 p-2 rounded-lg border border-purple-800/30">
                      ℹ️ {currentMethod.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Packages Grid */}
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-2 text-right">
                اختر الباقة المطلوبة (100 إلى 10000 كوينز):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {coinPackages.map((pkg) => {
                  const isSelected = selectedPkg?.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPkg(pkg)}
                      className={`relative p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-gradient-to-b from-purple-700 to-indigo-800 border-amber-400 shadow-md shadow-purple-600/40 scale-102'
                          : 'bg-[#120824]/80 border-purple-900/60 hover:border-purple-700 text-purple-200'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] bg-amber-500 text-black font-extrabold px-1 rounded-full whitespace-nowrap">
                          شائع
                        </span>
                      )}
                      <span className="font-digits font-black text-sm text-amber-300">
                        {pkg.coins >= 1000 ? `${pkg.coins / 1000}K` : pkg.coins}
                      </span>
                      <span className="text-[10px] text-purple-300">كوينز</span>
                      <span className="mt-1 text-[11px] font-digits font-extrabold text-white bg-black/40 px-1.5 py-0.5 rounded-md w-full">
                        {pkg.priceEGP} ج.م
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Summary Card */}
            <div className="bg-purple-900/30 p-3 rounded-2xl border border-purple-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-300 block">الباقة المختارة:</span>
                <span className="font-digits font-bold text-base text-amber-300">
                  {selectedPkg.coins.toLocaleString()} كوينز
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs text-purple-300 block">المبلغ المطلوب سداده:</span>
                <span className="font-digits font-extrabold text-base text-green-400">
                  {selectedPkg.priceEGP} ج.م
                </span>
              </div>
            </div>

            {/* Form Inputs: Payer Phone and Receipt Upload */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1 text-right">
                  رقم الهاتف أو الحساب المحول منه: *
                </label>
                <input
                  type="tel"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400 font-digits text-right"
                  required
                />
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1 text-right">
                  صورة إيصال التحويل (سكرين شوت واضحة): *
                </label>
                <div className="relative border-2 border-dashed border-purple-700/60 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer bg-[#120824]/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  {receiptImage ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={receiptImage}
                        alt="إيصال التحويل"
                        className="w-12 h-12 object-cover rounded-lg border border-purple-500"
                      />
                      <div className="text-right">
                        <span className="text-xs font-bold text-green-400 block truncate max-w-[200px]">
                          {receiptFileName || 'تم تحديد صورة الإيصال ✓'}
                        </span>
                        <span className="text-[10px] text-purple-300">انقر لتغيير الصورة</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-purple-300 mx-auto" />
                      <p className="text-xs text-purple-200 font-bold">اضغط هنا لرفع صورة الإيصال</p>
                      <p className="text-[10px] text-purple-400">PNG أو JPG بحد أقصى 5 ميجابايت</p>
                    </div>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>جاري رفع الإيصال وحفظ الطلب...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تأكيد وإرسال طلب الشحن للإدارة</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
