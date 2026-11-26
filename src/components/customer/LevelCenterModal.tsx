import React, { useState } from 'react';
import { X, Award, Sparkles, Trophy, ChevronLeft, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import { UserProfile, LevelConfig } from '../../types';
import { livoStore } from '../../services/livoStore';

interface LevelCenterModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecharge?: () => void;
}

export const LevelCenterModal: React.FC<LevelCenterModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenRecharge
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'all_levels' | 'rules'>('overview');

  if (!isOpen) return null;

  const currentLevel = Math.min(50, Math.max(0, user.level || 0));
  const eligibleCoins = user.eligibleRechargedCoins || 0;
  const levelConfigs = livoStore.getLevelConfigs();

  const currentConfig = levelConfigs.find(c => c.level === currentLevel) || {
    level: currentLevel,
    requiredCoins: 0,
    rewardDiamonds: 0,
    title: `المستوى ${currentLevel}`
  };

  const nextLevel = Math.min(50, currentLevel + 1);
  const nextConfig = levelConfigs.find(c => c.level === nextLevel);

  const prevCoinsRequirement = currentConfig.requiredCoins;
  const nextCoinsRequirement = nextConfig ? nextConfig.requiredCoins : currentConfig.requiredCoins;

  const progressCoins = eligibleCoins - prevCoinsRequirement;
  const rangeCoins = nextCoinsRequirement - prevCoinsRequirement;
  const progressPercent = currentLevel >= 50
    ? 100
    : rangeCoins > 0
      ? Math.min(100, Math.max(0, Math.floor((progressCoins / rangeCoins) * 100)))
      : 100;

  const coinsRemaining = Math.max(0, nextCoinsRequirement - eligibleCoins);
  const unlockedRewards = new Set(user.unlockedLevelRewards || []);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-lg bg-gradient-to-b from-[#1E1035] via-[#150A26] to-[#0D0518] text-white rounded-t-3xl sm:rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-purple-500/20 bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                مركز المستوى
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-yellow-300 border border-yellow-400/30">
                  Lv. {currentLevel}
                </span>
              </h2>
              <p className="text-[11px] text-purple-300/80">
                منظومة المستويات الرسمية (0 - 50) ومكافآت الألماسات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-3 gap-2 border-b border-purple-500/20 bg-[#120822]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            مستواي الحالي
          </button>
          <button
            onClick={() => setActiveTab('all_levels')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'all_levels'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-purple-300/60 hover:text-purple-200'
            }`}
          >
            جدول المستويات (0 - 50)
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'rules'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            شروط وقواعد الترقية
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Level 50 Congratulations or Current Progress Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/60 via-purple-950/80 to-black border border-purple-500/30 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-yellow-400 shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-purple-950 font-digits font-black text-[10px] px-1.5 py-0.5 rounded-full shadow">
                        Lv.{currentLevel}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white">{user.displayName}</h3>
                      <p className="text-[11px] text-purple-300 font-digits">ID: {user.uid}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/30">
                          {currentConfig.title || `المستوى ${currentLevel}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-[10px] text-purple-300/80">رصيد الألماسات</p>
                    <p className="text-base font-black font-digits text-cyan-300 flex items-center justify-end gap-1">
                      💎 {(user.diamonds || 0).toLocaleString('en-US')}
                    </p>
                  </div>
                </div>

                {/* Level 50 Cap Banner */}
                {currentLevel >= 50 ? (
                  <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-400/40 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-yellow-300 font-black text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>بلغت الحد الأقصى للمستويات: المستوى 50 الملكي!</span>
                    </div>
                    <p className="text-[11px] text-yellow-100/90">
                      تهانينا! لقد حققت أعلى وسام شرفي ورتبة ملكية في منصة LIVO.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                      <span>التقدم نحو المستوى {nextLevel}</span>
                      <span className="font-digits text-yellow-300 font-black">{progressPercent}%</span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-purple-950/80 border border-purple-500/30 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 transition-all duration-500 shadow-sm shadow-yellow-400/50"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-digits text-purple-300/90 pt-1">
                      <span>المشحون المؤهل: {eligibleCoins.toLocaleString('en-US')} كوينز</span>
                      <span>المطلوب: {nextCoinsRequirement.toLocaleString('en-US')} كوينز</span>
                    </div>

                    {coinsRemaining > 0 && (
                      <p className="text-[11px] text-amber-300/95 font-medium pt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>يتبقى شحن <strong className="font-digits font-bold">{coinsRemaining.toLocaleString('en-US')}</strong> كوينز للوصول إلى المستوى {nextLevel} والحصول على <strong className="font-digits font-bold">{nextConfig?.rewardDiamonds || 0}</strong> ألماسة هدية!</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/20">
                  <span className="text-[11px] text-purple-300">إجمالي النقاط المؤهلة للترقية</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg font-black font-digits text-yellow-400">
                      {eligibleCoins.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs text-yellow-300 font-bold">كوينز</span>
                  </div>
                  <p className="text-[10px] text-purple-400/70 mt-1">الشحن المعتمد + الهدايا المُرسلة</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/20">
                  <span className="text-[11px] text-purple-300">مكافآت الألماسات المستلمة</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg font-black font-digits text-cyan-300">
                      💎 {(user.diamonds || 0).toLocaleString('en-US')}
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-400/70 mt-1">
                    استلمت مكافآت {unlockedRewards.size} مستوى
                  </p>
                </div>
              </div>

              {/* Action Banner */}
              {onOpenRecharge && currentLevel < 50 && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenRecharge();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-purple-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/25 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>شحن كوينز الآن لرفع المستوى والحصول على ألماسات</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: ALL LEVELS (0 TO 50) */}
          {activeTab === 'all_levels' && (
            <div className="space-y-2">
              <div className="text-xs text-purple-300/80 px-1 pb-1 flex items-center justify-between">
                <span>المستويات من 0 إلى 50</span>
                <span>الأرقام باللغة الإنجليزية (0-9)</span>
              </div>

              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {levelConfigs.map((cfg) => {
                  const isCurrent = cfg.level === currentLevel;
                  const isUnlocked = cfg.level <= currentLevel;
                  const hasRewardClaimed = unlockedRewards.has(cfg.level);

                  return (
                    <div
                      key={cfg.level}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-yellow-400/15 border-yellow-400/50 shadow-md ring-1 ring-yellow-400/40'
                          : isUnlocked
                            ? 'bg-purple-900/30 border-purple-500/20'
                            : 'bg-white/5 border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-digits font-black text-xs ${
                            isCurrent
                              ? 'bg-yellow-400 text-purple-950 shadow-md'
                              : isUnlocked
                                ? 'bg-purple-600/60 text-yellow-300 border border-purple-400/30'
                                : 'bg-white/10 text-gray-400'
                          }`}
                        >
                          {cfg.level}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-white">
                              {cfg.title || `المستوى ${cfg.level}`}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-400 text-purple-950">
                                مستواك الحالي
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-digits text-purple-300">
                            مطلوب شحن: {cfg.requiredCoins.toLocaleString('en-US')} كوينز
                          </span>
                        </div>
                      </div>

                      <div className="text-left flex flex-col items-end">
                        <span className="text-xs font-black font-digits text-cyan-300 flex items-center gap-1">
                          💎 +{cfg.rewardDiamonds.toLocaleString('en-US')}
                        </span>
                        {isUnlocked ? (
                          <span className="text-[10px] text-green-400 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            {hasRewardClaimed ? 'مستلمة' : 'تم الوصول'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-purple-400/60 font-medium mt-0.5">
                            قيد التقدم
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3 text-xs leading-relaxed text-purple-200">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/20 space-y-2">
                <h4 className="font-extrabold text-sm text-yellow-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  قواعد احتساب الترقية والمكافآت
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-purple-200/90 text-[11px]">
                  <li>
                    <strong>يبدأ جميع المستخدمين الجدد من المستوى 0</strong> برصيد 0 ألماسات حتى إجراء أول عملية شحن معتمدة.
                  </li>
                  <li>
                    <strong>الحد الأقصى للمستويات هو المستوى 50</strong>، ولا يمكن تجاوز هذا المستوى إطلاقاً.
                  </li>
                  <li>
                    <strong>يتم الترقية تلقائياً</strong> فور تأكيد الإدارة لأي عملية شحن كوينز معتمدة أو عند إرسال الهدايا داخل الغرف.
                  </li>
                  <li>
                    <strong>حسابات الإدارة العليا (Admin)</strong> تعمل بالرتبة الملكية الكاملة (المستوى 50).
                  </li>
                  <li>
                    <strong>مكافأة الألماسات تُصرف لمرة واحدة فقط</strong> عند فتح كل مستوى ولا تتكرر عند إعادة الشحن في نفس المستوى.
                  </li>
                  <li className="text-amber-300 font-bold">
                    <strong>تحويلات الكوينز بين المستخدمين لا تُحتسب</strong> ضمن الترقية، بل يُحتسب الشحن الرسمي المعتمد والهدايا المُرسلة داخل الغرف.
                  </li>
                  <li>
                    تظهر شارة المستوى الرسمية في الغرف الصوتية، والرسائل، والملف الشخصي فور الترقية تلقائياً.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-start gap-2 text-[11px] text-purple-300">
                <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>
                  جميع الأرقام في منظومة المستويات تُعرض بالأرقام الإنجليزية (0-9) وفقاً لمعايير تطبيق LIVO المعتمدة.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-purple-500/20 bg-purple-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
