import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, CheckCircle2, AlertCircle, Phone, Award } from 'lucide-react';
import { UserProfile, DistributorRecord } from '../../types';
import { livoStore } from '../../services/livoStore';

interface DistributorAgentModalProps {
  agent: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const DistributorAgentModal: React.FC<DistributorAgentModalProps> = ({
  agent,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [distributorUid, setDistributorUid] = useState('');
  const [distributorName, setDistributorName] = useState('');
  const [distributorPhone, setDistributorPhone] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const distributors = livoStore.getDistributors(agent.uid);

  const handleAddDistributor = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!distributorName.trim()) {
      setFeedback({ type: 'error', message: 'يرجى إدخال اسم الموزع' });
      return;
    }

    try {
      const newDist = livoStore.addDistributor({
        agentUid: agent.uid,
        distributorUid: distributorUid.trim() || undefined,
        distributorName: distributorName.trim(),
        phone: distributorPhone.trim() || undefined
      });

      setFeedback({
        type: 'success',
        message: `تم إضافة الموزع ${newDist.distributorName} (ID: ${newDist.distributorUid}) بنجاح ضمن فريقك!`
      });

      setDistributorUid('');
      setDistributorName('');
      setDistributorPhone('');
      setActiveTab('list');
    } catch {
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء إضافة الموزع' });
    }
  };

  const handleDeleteDistributor = (id: string, name: string) => {
    const ok = livoStore.deleteDistributor(id);
    if (ok) {
      setFeedback({ type: 'success', message: `تم حذف الموزع ${name} من قائمة فريقك` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-lg bg-gradient-to-b from-[#18112C] via-[#100A20] to-[#0A0515] text-white rounded-t-3xl sm:rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-purple-500/20 bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-400 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                مركز وكيل الموزعين
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500 text-white">
                  وكيل موزعين
                </span>
              </h2>
              <p className="text-[11px] text-purple-300/80">
                إدارة شبكة الموزعين المعتمدين ومتابعة نشاطهم
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
        <div className="flex items-center px-4 pt-3 gap-2 border-b border-purple-500/20 bg-[#0E061D]">
          <button
            onClick={() => {
              setActiveTab('list');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            فريق الموزعين ({distributors.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('add');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            إضافة موزع جديد
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
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

          {/* TAB 1: DISTRIBUTORS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-purple-300/80 px-1">
                <span>الموزعون التابعون لوكالتك حصراً</span>
                <span className="font-digits font-bold">{distributors.length} موزع</span>
              </div>

              {distributors.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-xs text-purple-300/60">
                    لا يوجد أي موزعين مسجلين تحت وكالتك حتى الآن.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    إضافة أول موزع الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {distributors.map((dist) => (
                    <div
                      key={dist.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={dist.distributorAvatar}
                          alt={dist.distributorName}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-purple-400"
                        />
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-white">
                            {dist.distributorName}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] font-digits text-purple-300">
                            <span>ID: {dist.distributorUid}</span>
                            {dist.phone && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-3 h-3 text-purple-400" />
                                  {dist.phone}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          نشط
                        </span>
                        <button
                          onClick={() => handleDeleteDistributor(dist.id, dist.distributorName)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors"
                          title="حذف من الفريق"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD DISTRIBUTOR */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddDistributor} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200">
                  اسم الموزع بالكامل:
                </label>
                <input
                  type="text"
                  required
                  value={distributorName}
                  onChange={(e) => setDistributorName(e.target.value)}
                  placeholder="مثال: محمد عبد الله"
                  className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200">
                  معرّف الموزع في التطبيق (Public ID - اختياري):
                </label>
                <input
                  type="text"
                  value={distributorUid}
                  onChange={(e) => setDistributorUid(e.target.value)}
                  placeholder="إذا كان مسجلاً بالفعل، أدخل ID المكون من 5 أرقام"
                  className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400 font-digits"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200">
                  رقم الهاتف للتواصل (اختياري):
                </label>
                <input
                  type="tel"
                  value={distributorPhone}
                  onChange={(e) => setDistributorPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400 font-digits"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" />
                <span>حفظ وإضافة الموزع للفريق</span>
              </button>
            </form>
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
