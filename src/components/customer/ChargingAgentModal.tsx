import React, { useState } from 'react';
import { X, Send, Search, CheckCircle2, AlertCircle, History, Coins, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { UserProfile, AgentTransferRecord } from '../../types';
import { livoStore } from '../../services/livoStore';

interface ChargingAgentModalProps {
  agent: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const ChargingAgentModal: React.FC<ChargingAgentModalProps> = ({
  agent,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'history'>('transfer');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [coinsAmount, setCoinsAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const agentBalance = agent.agentBalance !== undefined ? agent.agentBalance : agent.coins;
  const transferHistory = livoStore.getAgentTransfers(agent.uid);

  const handleSearchUser = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError('');
    setFeedback(null);
    setTargetUser(null);

    const clean = searchQuery.trim().toLowerCase();
    if (!clean) {
      setSearchError('يرجى إدخال معرّف المستخدم (ID)');
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      const found = livoStore.getUsers().find(
        u => u.uid === clean ||
             u.authUid === clean ||
             u.username.toLowerCase() === clean
      );

      if (!found) {
        setSearchError(`لم يتم العثور على أي مستخدم بالمعرف "${searchQuery}"`);
      } else if (found.uid === agent.uid) {
        setSearchError('لا يمكن تحويل الكوينز إلى نفس حساب الوكيل');
      } else {
        setTargetUser(found);
      }
    }, 250);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!targetUser) {
      setFeedback({ type: 'error', message: 'يرجى البحث عن المستخدم وتحديده أولاً' });
      return;
    }

    const amount = Number(coinsAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setFeedback({ type: 'error', message: 'يرجى إدخال عدد كوينز صحيح أكبر من الصفر' });
      return;
    }

    if (agentBalance < amount) {
      setFeedback({
        type: 'error',
        message: `رصيد الوكيل الحالي (${agentBalance.toLocaleString('en-US')}) غير كافٍ لتحويل ${amount.toLocaleString('en-US')} كوينز`
      });
      return;
    }

    const result = livoStore.executeAgentTransfer(agent.uid, targetUser.uid, amount, notes);
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      setCoinsAmount('');
      setNotes('');
      // Refresh target user state
      const refreshed = livoStore.getUserByUid(targetUser.uid);
      if (refreshed) setTargetUser(refreshed);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-lg bg-gradient-to-b from-[#1A102E] via-[#120924] to-[#0A0414] text-white rounded-t-3xl sm:rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-purple-500/20 bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-yellow-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                مركز وكيل الشحن
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400 text-purple-950">
                  وكيل شحن
                </span>
              </h2>
              <p className="text-[11px] text-purple-300/80">
                تحويل وتوزيع الكوينز للمستخدمين من رصيد الوكيل المعتمد
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

        {/* Agent Balance Summary Bar */}
        <div className="px-5 py-3 bg-gradient-to-r from-purple-900/40 via-purple-950/60 to-purple-900/40 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-purple-200">رصيد الوكيل المتاح للتحويل:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black font-digits text-yellow-300">
              {agentBalance.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-yellow-400 font-bold">كوينز</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-4 pt-3 gap-2 border-b border-purple-500/20 bg-[#100720]">
          <button
            onClick={() => {
              setActiveTab('transfer');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'transfer'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            تحويل كوينز جديد
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            سجل التحويلات ({transferHistory.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Notification Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-2xl flex items-start gap-2 text-xs font-bold border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: TRANSFER */}
          {activeTab === 'transfer' && (
            <div className="space-y-4">
              
              {/* Step 1: User Lookup by ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-yellow-400" />
                  <span>1. البحث عن المستخدم برقم المعرّف (Public ID):</span>
                </label>

                <form onSubmit={handleSearchUser} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="أدخل معرّف المستخدم (مثال: 10245)"
                    className="flex-1 bg-white/5 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-yellow-400 font-digits"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-purple-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSearching ? 'جاري البحث...' : 'بحث'}
                  </button>
                </form>

                {searchError && (
                  <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{searchError}</span>
                  </p>
                )}
              </div>

              {/* Step 2: Target User Confirmation Card */}
              {targetUser && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-yellow-400/40 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={targetUser.avatar}
                        alt={targetUser.displayName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-yellow-400"
                      />
                      <div>
                        <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                          {targetUser.displayName}
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-digits text-purple-300">
                          <span>ID: {targetUser.uid}</span>
                          <span>•</span>
                          <span className="text-yellow-400 font-bold">Lv. {targetUser.level || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left font-digits">
                      <span className="text-[10px] text-purple-300/80">رصيده الحالي</span>
                      <p className="text-xs font-bold text-yellow-300">
                        {(targetUser.coins || 0).toLocaleString('en-US')} كوينز
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Coins Amount & Execution Form */}
              <form onSubmit={handleExecuteTransfer} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">
                    2. عدد الكوينز المراد تحويلها:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={agentBalance}
                      value={coinsAmount}
                      onChange={(e) => setCoinsAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="أدخل عدد الكوينز"
                      className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-yellow-400 font-digits"
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-yellow-400">
                      كوينز
                    </span>
                  </div>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[500, 1000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCoinsAmount(amt)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-digits font-bold text-purple-200 border border-purple-500/20 transition-colors"
                    >
                      +{amt.toLocaleString('en-US')}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">
                    3. ملاحظات العملية (اختياري):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: شحن فوري عبر فودافون كاش"
                    className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!targetUser || !coinsAmount || Number(coinsAmount) <= 0}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-purple-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>تأكيد تحويل الكوينز للعميل</span>
                </button>
              </form>

              {/* Note about level upgrade rule */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-300 space-y-1">
                <p className="font-bold text-yellow-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  تنبيه تنظيمي معتمد:
                </p>
                <p>
                  يتم خصم الكوينز من رصيد الوكيل فوراً وإضافتها لرصيد المستخدم. وفقاً لقواعد LIVO، تحويلات الوكلاء لا تُحتسب ضمن نقاط شحن الترقية لمستويات المستخدمين.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-purple-300/80 px-1 pb-1">
                <span>سجل عمليات التحويل الصادرة من هذا الحساب</span>
                <span className="font-digits font-bold">{transferHistory.length} عملية</span>
              </div>

              {transferHistory.length === 0 ? (
                <div className="py-12 text-center text-purple-300/60 text-xs">
                  لم تقم بأي عمليات تحويل كوينز حتى الآن.
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {transferHistory.map((trf) => (
                    <div
                      key={trf.id}
                      className="p-3 rounded-xl bg-white/5 border border-purple-500/20 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center text-xs font-bold">
                            <Send className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-white">
                              إلى: {trf.targetName}
                            </span>
                            <span className="text-[10px] font-digits text-purple-300 block">
                              ID: {trf.targetUid}
                            </span>
                          </div>
                        </div>

                        <div className="text-left font-digits">
                          <span className="text-sm font-black text-yellow-400">
                            -{trf.coinsAmount.toLocaleString('en-US')}
                          </span>
                          <span className="text-[10px] text-yellow-300/80 block">كوينز</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-purple-400/80 font-digits pt-1 border-t border-white/5">
                        <span>{new Date(trf.createdAt).toLocaleString('en-GB')}</span>
                        {trf.notes && <span className="text-purple-300 truncate max-w-[150px]">{trf.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
