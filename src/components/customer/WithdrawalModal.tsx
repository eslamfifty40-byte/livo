import React, { useState } from 'react';
import { X, ArrowDownCircle, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface WithdrawalModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ user, isOpen, onClose }) => {
  const [coinsAmount, setCoinsAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay' | 'bank_transfer'>('vodafone_cash');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const parsedCoins = parseInt(coinsAmount, 10) || 0;
  const grossEGP = (parsedCoins / 1000) * 350;
  const platformFee = grossEGP * 0.15; // 15% platform fee
  const netPayout = Math.max(0, grossEGP - platformFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (parsedCoins < 1000) {
      setErrorMsg('الحد الأدنى لطلب السحب هو 1000 كوينز');
      return;
    }
    if (parsedCoins > user.coins) {
      setErrorMsg(`رصيدك الحالي (${user.coins.toLocaleString()} كوينز) لا يكفي`);
      return;
    }
    if (!paymentDetails.trim()) {
      setErrorMsg('يرجى إدخال تفاصيل الحساب أو رقم المحفظة لتحويل المبلغ');
      return;
    }

    const res = livoStore.submitWithdrawalRequest({
      uid: user.uid,
      totalCoins: parsedCoins,
      paymentMethod,
      paymentDetails: paymentDetails.trim()
    });

    if (res.success) {
      setIsSubmitted(true);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#170b2c] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-purple-800/60 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-purple-800/40 flex items-center justify-between bg-[#1f103b]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">سحب أرباح الكوينز</h2>
              <p className="text-xs text-purple-300">
                رصيدك المتاح: <strong className="font-digits text-amber-300">{user.coins.toLocaleString()}</strong> كوينز
              </p>
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
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
            <h3 className="font-bold text-base text-white">تم إرسال طلب السحب بنجاح!</h3>
            <p className="text-xs text-purple-300 leading-relaxed">
              صافي المبلغ المحول إليك: <strong className="font-digits text-amber-400 text-sm">{netPayout.toFixed(2)} ج.م</strong>. سيتم مراجعة الطلب وتحويل المبلغ خلال 24 ساعة عمل.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl"
            >
              حسناً
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5">
            {/* Net Calculation Breakdown */}
            <div className="bg-[#120824] p-3 rounded-2xl border border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-300">إجمالي قيمة الكوينز:</span>
                <span className="font-digits font-bold text-white">{grossEGP.toFixed(2)} ج.م</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-300">عمولة المنصة والضرائب (15%):</span>
                <span className="font-digits text-red-400">-{platformFee.toFixed(2)} ج.م</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-purple-800/40 text-xs">
                <span className="font-bold text-amber-300">الصافي المتوقع استلامه:</span>
                <span className="font-digits font-black text-green-400 text-sm">{netPayout.toFixed(2)} ج.م</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                كمية الكوينز المراد سحبها:
              </label>
              <input
                type="number"
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
                placeholder="الحد الأدنى 1000 كوينز"
                className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs font-digits text-white placeholder-purple-400/50 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                طريقة التحويل المفضلة:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none cursor-pointer"
              >
                <option value="vodafone_cash">فودافون كاش / محافظ إلكترونية</option>
                <option value="instapay">إنستاباي (InstaPay)</option>
                <option value="bank_transfer">تحويل بنكي مباشر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                تفاصيل الحساب أو رقم المحفظة:
              </label>
              <input
                type="text"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder="رقم المحفظة أو عنوان InstaPay IPA"
                className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-500/20 text-red-300 p-2 rounded-xl text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              تأكيد وإرسال طلب السحب للمراجعة
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
