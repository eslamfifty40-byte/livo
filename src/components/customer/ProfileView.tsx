import React, { useState } from 'react';
import {
  Copy,
  Check,
  Coins,
  ShoppingBag,
  Briefcase,
  CheckCircle2,
  ArrowDownCircle,
  Headphones,
  LogOut,
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { UserProfile } from '../../types';
import { CUSTOMER_SUPPORT_CONTACT } from '../../data/initialData';

interface ProfileViewProps {
  user: UserProfile;
  onOpenRecharge: () => void;
  onOpenStore: () => void;
  onOpenAgency: () => void;
  onOpenVerification: () => void;
  onOpenWithdrawal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onOpenRecharge,
  onOpenStore,
  onOpenAgency,
  onOpenVerification,
  onOpenWithdrawal
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="flex flex-col h-[620px] bg-[#0c0517] rounded-2xl border border-purple-900/50 overflow-hidden text-white shadow-2xl">
      {/* Top Banner & Avatar Header */}
      <div className="relative bg-gradient-to-b from-purple-950 via-[#1a0c33] to-[#0c0517] p-4 pt-6 border-b border-purple-900/40">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with Equipped Frame */}
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-lg ring-4 ring-purple-600/30"
              />
              {user.isVerified && (
                <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white border-2 border-black" title="حساب موثق رسمي">
                  ✓
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white">{user.displayName}</h2>
                {user.role === 'owner' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                    المالك
                  </span>
                )}
                {user.role === 'agent' && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-bold">
                    {user.agencyName || 'وكيل معتمد'}
                  </span>
                )}
              </div>

              <span className="text-xs text-purple-300/80 block mt-0.5 font-digits">
                @{user.username}
              </span>

              {/* Unique UID Card with Copy Button */}
              <div className="mt-2 flex items-center gap-2 bg-[#120824] px-2.5 py-1 rounded-xl border border-purple-800/60 w-fit">
                <span className="text-[11px] text-purple-300 font-semibold">UID:</span>
                <span className="font-digits font-extrabold text-amber-300 text-xs tracking-wider">
                  {user.uid}
                </span>
                <button
                  onClick={handleCopyUid}
                  className="text-purple-400 hover:text-white p-0.5 transition-colors"
                  title="نسخ المعرف"
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-3 text-xs text-purple-200/90 leading-relaxed bg-black/20 p-2 rounded-xl">
            {user.bio}
          </p>
        )}

        {/* Stats Strip */}
        <div className="flex items-center justify-around mt-3 pt-3 border-t border-purple-900/40 text-center">
          <div>
            <span className="font-digits font-extrabold text-sm text-white block">
              {user.followingCount}
            </span>
            <span className="text-[10px] text-purple-400">أتابعهم</span>
          </div>
          <div className="w-px h-6 bg-purple-900/60" />
          <div>
            <span className="font-digits font-extrabold text-sm text-white block">
              {user.followersCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-purple-400">المتابعون</span>
          </div>
          <div className="w-px h-6 bg-purple-900/60" />
          <div>
            <span className="font-digits font-extrabold text-sm text-amber-400 block">
              Level 18
            </span>
            <span className="text-[10px] text-purple-400">المستوى</span>
          </div>
        </div>
      </div>

      {/* Main Action Links & Balance */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Real Coins Balance Box */}
        <div className="bg-gradient-to-r from-purple-950 via-[#231245] to-indigo-950 p-3.5 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-purple-300 block">رصيد الكوينز الحالي</span>
              <div className="flex items-baseline gap-1">
                <span className="font-digits font-black text-xl text-amber-300">
                  {user.coins.toLocaleString()}
                </span>
                <span className="text-xs text-purple-300">كوينز</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenRecharge}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>شحن الكوينز</span>
          </button>
        </div>

        {/* Action Menu List */}
        <div className="space-y-1.5">
          <button
            onClick={onOpenStore}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#170b2c]/80 hover:bg-[#1f103b] border border-purple-800/40 transition-all text-right group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-900/40 flex items-center justify-center text-purple-300 group-hover:text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">متجر الإطارات والدخلات</span>
                <span className="text-[10px] text-purple-300">تجهيز التاج الملكي والدخلة الفاخرة</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-purple-400 group-hover:text-white" />
          </button>

          <button
            onClick={onOpenAgency}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#170b2c]/80 hover:bg-[#1f103b] border border-purple-800/40 transition-all text-right group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">مركز الوكالات</span>
                <span className="text-[10px] text-purple-300">وكالات الشحن والموزعين والأرباح</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-purple-400 group-hover:text-white" />
          </button>

          <button
            onClick={onOpenVerification}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#170b2c]/80 hover:bg-[#1f103b] border border-purple-800/40 transition-all text-right group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">التوثيق بالعلامة الزرقاء</span>
                <span className="text-[10px] text-purple-300">اشتراك شهري مستقل ومميز</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-purple-400 group-hover:text-white" />
          </button>

          <button
            onClick={onOpenWithdrawal}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#170b2c]/80 hover:bg-[#1f103b] border border-purple-800/40 transition-all text-right group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                <ArrowDownCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">سحب الأرباح النقدية</span>
                <span className="text-[10px] text-purple-300">تحويل كوينز الدعم إلى مبالغ بالجنيه</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-purple-400 group-hover:text-white" />
          </button>

          {/* Customer Service without Phone number */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#170b2c]/80 hover:bg-[#1f103b] border border-purple-800/40 transition-all text-right group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-900/40 flex items-center justify-center text-purple-300">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">خدمة العملاء والدعم الفني</span>
                <span className="text-[10px] text-purple-300">مراسلة فريق الدعم والمساعدة</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-purple-400 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Customer Support Modal (Strictly without the phone number!) */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-purple-800 p-4 space-y-3 shadow-2xl text-center">
            <Headphones className="w-10 h-10 text-purple-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">مركز خدمة عملاء LIVO</h3>
            <p className="text-xs text-purple-300 leading-relaxed">
              فريق الدعم الفني متاح على مدار الساعة للإجابة على استفساراتكم وحل أي مشكلات فنية.
            </p>
            <div className="bg-[#120824] p-3 rounded-xl border border-purple-800/40 text-xs">
              <span className="text-purple-400 block mb-1">البريد المعتمد للدعم:</span>
              <span className="font-digits font-bold text-amber-300">{CUSTOMER_SUPPORT_CONTACT}</span>
            </div>
            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-xl"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
