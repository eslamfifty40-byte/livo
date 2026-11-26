import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Upload, AlertCircle, Check, Copy, Edit3 } from 'lucide-react';
import { VERIFICATION_PLANS, RECHARGE_PAYMENT_PHONE } from '../../data/initialData';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';
import { LivoVerifiedBadge } from '../common/LivoVerifiedBadge';
import { compressImageForFirestore } from '../../utils/imageCompression';

interface VerificationModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ user, isOpen, onClose }) => {
  const [defaultPayNumber, setDefaultPayNumber] = useState<string>(
    () => livoStore.getDefaultPaymentMethod()?.accountNumber || RECHARGE_PAYMENT_PHONE
  );
  const [selectedPlan, setSelectedPlan] = useState(VERIFICATION_PLANS[0]);
  const [payerPhone, setPayerPhone] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOwnerAdmin = user.role === 'owner' || livoStore.isOwnerEmail(user.email);
  const [editingNumber, setEditingNumber] = useState(false);
  const [editNumberInput, setEditNumberInput] = useState('');

  useEffect(() => {
    return livoStore.subscribe(() => {
      const def = livoStore.getDefaultPaymentMethod();
      if (def?.accountNumber) setDefaultPayNumber(def.accountNumber);
    });
  }, []);

  if (!isOpen) return null;

  const handleSaveNumber = () => {
    if (!editNumberInput.trim()) return;
    const def = livoStore.getDefaultPaymentMethod();
    if (def) {
      livoStore.savePaymentMethod({
        ...def,
        accountNumber: editNumberInput.trim()
      });
    } else {
      livoStore.savePaymentMethod({
        id: 'pay-default-vodafone',
        type: 'vodafone_cash',
        title: 'فودافون كاش',
        accountNumber: editNumberInput.trim(),
        accountHolder: 'إدارة LIVO الرسمية',
        instructions: 'يرجى إرسال صورة الإيصال بعد التحويل مباشرة',
        isActive: true,
        isDefault: true,
        updatedAt: new Date().toISOString()
      });
    }
    setDefaultPayNumber(editNumberInput.trim());
    setEditingNumber(false);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(defaultPayNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('يرجى اختيار ملف صورة صالح');
        return;
      }
      setReceiptFileName(file.name);
      try {
        const compressed = await compressImageForFirestore(file, {
          maxDim: 900,
          quality: 0.75,
          maxBytes: 220_000
        });
        setReceiptImage(compressed);
      } catch {
        setErrorMsg('تعذر معالجة صورة الإيصال');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!payerPhone.trim()) {
      setErrorMsg('يرجى كتابة رقم الهاتف المحول منه');
      return;
    }
    if (!receiptImage) {
      setErrorMsg('رفع صورة إيصال الدفع إلزامي لمراجعة التوثيق');
      return;
    }

    livoStore.submitVerificationRequest({
      uid: user.uid,
      monthsCount: selectedPlan.months,
      priceEGP: selectedPlan.priceEGP,
      paymentPhone: payerPhone.trim(),
      receiptUrl: receiptImage
    });

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#170b2c] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-purple-800/60 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-purple-800/40 flex items-center justify-between bg-[#1f103b]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
              <LivoVerifiedBadge size={28} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-base text-white">التوثيق بالعلامة الزرقاء الرسمية</h2>
                <LivoVerifiedBadge size={16} />
              </div>
              <p className="text-xs text-purple-300">نظام اشتراك مستقل تماماً عن الكوينز</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-900/50 hover:bg-purple-800 flex items-center justify-center text-purple-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-3 my-auto">
            <CheckCircle2 className="w-14 h-14 text-blue-400 mx-auto" />
            <h3 className="font-bold text-base text-white">تم إرسال طلب التوثيق للإدارة</h3>
            <p className="text-xs text-purple-300 leading-relaxed">
              سيتم مراجعة إيصال السداد وتفعيل شارة التوثيق الزرقاء في ملفك الشخصي فوراً بعد التحقق.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
            >
              تم
            </button>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto space-y-4">
            {/* Payment Transfer Info */}
            <div className="bg-[#120824] p-3 rounded-2xl border border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-purple-300 block">رقم التحويل المعتمد:</span>
                  <span className="font-digits font-black text-amber-400 text-sm">{defaultPayNumber}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isOwnerAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditNumberInput(defaultPayNumber);
                        setEditingNumber(v => !v);
                      }}
                      className="flex items-center gap-1 text-[11px] bg-[#FFE600] text-black font-black px-2.5 py-1 rounded-lg"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{editingNumber ? 'إلغاء' : 'تعديل'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="flex items-center gap-1 text-xs bg-purple-800/70 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              {isOwnerAdmin && editingNumber && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={editNumberInput}
                    onChange={(e) => setEditNumberInput(e.target.value)}
                    placeholder="أدخل رقم التحويل الجديد"
                    className="flex-1 bg-black/40 border border-amber-400/60 rounded-lg px-2.5 py-1.5 text-xs font-digits text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNumber}
                    className="px-3 py-1.5 rounded-lg bg-[#FFE600] text-black font-black text-xs shrink-0"
                  >
                    حفظ ✓
                  </button>
                </div>
              )}
            </div>

            {/* Verification Plans Grid */}
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-2">اختر مدة التوثيق:</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {VERIFICATION_PLANS.map(plan => {
                  const isSelected = selectedPlan.months === plan.months;
                  return (
                    <button
                      key={plan.months}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-400 shadow-md shadow-blue-500/20'
                          : 'bg-[#120824] border-purple-900/50 hover:border-purple-700'
                      }`}
                    >
                      <span className="font-bold text-xs text-white block">
                        {plan.months} {plan.months === 1 ? 'شهر' : plan.months === 2 ? 'شهران' : 'أشهر'}
                      </span>
                      <span className="font-digits font-extrabold text-xs text-amber-300 block mt-1">
                        {plan.priceEGP} ج.م
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  رقم الهاتف المحول منه:
                </label>
                <input
                  type="text"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="010XXXXXXXX"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs font-digits text-white placeholder-purple-400/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  إيصال سداد رسوم التوثيق:
                </label>
                <label className="border-2 border-dashed border-purple-700/60 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-purple-950/20 hover:bg-purple-900/30 text-center">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <Upload className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-xs text-white font-bold">
                    {receiptFileName || 'اضغط لاختيار صورة إيصال السداد'}
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div className="bg-red-500/20 text-red-300 p-2 rounded-xl text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                إرسال طلب التوثيق للمراجعة ({selectedPlan.priceEGP} ج.م)
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
