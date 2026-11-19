import React, { useState } from 'react';
import {
  X,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Users,
  Search,
  DollarSign,
  Send,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, AgencyApplication } from '../../types';
import { livoStore } from '../../services/livoStore';

interface AgencyModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const AgencyModal: React.FC<AgencyModalProps> = ({ user, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'apply' | 'dashboard'>(
    user.role === 'agent' ? 'dashboard' : 'info'
  );

  // Application Form State
  const [agencyType, setAgencyType] = useState<'charging_agent' | 'distributors_agent'>('charging_agent');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [experience, setExperience] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Agent Dashboard Charge by UID State
  const [targetUid, setTargetUid] = useState('');
  const [chargeCoins, setChargeCoins] = useState('');
  const [chargeResult, setChargeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formError, setFormError] = useState('');
  const agencyHosts: Array<{
    uid: string;
    name: string;
    avatar: string;
    streamHours: number;
    monthlyTarget: number;
    earnedCoins: number;
    agencyCut: number;
    status: string;
    isVerified?: boolean;
  }> = livoStore
    .getGenuineUsers()
    .filter(u => u.uid !== user.uid && Boolean(user.agencyName && u.agencyName === user.agencyName))
    .map(u => ({
      uid: u.uid,
      name: u.displayName || u.username,
      avatar: u.avatar,
      streamHours: 0,
      monthlyTarget: 100000,
      earnedCoins: u.diamonds || 0,
      agencyCut: 15,
      status: 'active',
      isVerified: u.isVerified
    }));

  if (!isOpen) return null;

  const agencyTypesInfo = [
    {
      id: 'charging_agent',
      title: 'وكيل شحن معتمد',
      icon: '⚡',
      desc: 'شحن كوينز مباشرة للمستخدمين عبر رقم المعرف UID بهامش ربح وعمولة ممتازة (يتطلب موافقة صريحة من الإدارة لتفعيل صلاحية الشحن).'
    },
    {
      id: 'distributors_agent',
      title: 'وكيل موزعين',
      icon: '🌐',
      desc: 'إدارة شبكة من الموزعين وصناع المحتوى وتوسيع مجتمع المنصة ومتابعة أداء الفريق وأرباحهم الشهرية.'
    }
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!agencyName.trim() || !phone.trim() || !experience.trim()) {
      setFormError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    livoStore.submitAgencyApplication({
      uid: user.uid,
      agencyType,
      agencyName: agencyName.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      experienceNotes: experience.trim()
    });

    setIsSubmitted(true);
  };

  const handleAgentChargeMember = (e: React.FormEvent) => {
    e.preventDefault();
    setChargeResult(null);

    const coinsNum = parseInt(chargeCoins, 10);
    if (!targetUid.trim() || isNaN(coinsNum) || coinsNum <= 0) {
      setChargeResult({ success: false, message: 'يرجى إدخال UID صالح وكمية كوينز صحيحة' });
      return;
    }

    const res = livoStore.agencyChargeMember(user.uid, targetUid.trim(), coinsNum);
    setChargeResult(res);
    if (res.success) {
      setTargetUid('');
      setChargeCoins('');
    }
  };

  // Find existing agency profile if user is agent
  const myAgency = livoStore.getAgencies().find(a => a.uid === user.uid);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#170b2c] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-purple-800/60 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-purple-800/40 flex items-center justify-between bg-[#1f103b]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">مركز الوكالات المعتمدة</h2>
              <p className="text-xs text-purple-300">
                {user.role === 'agent' ? `وكيل معتمد: ${user.agencyName || 'LIVO Agency'}` : 'انضم لشبكة وكلاء LIVO الرسميين'}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-purple-800/40 bg-[#120824]">
          {user.role === 'agent' ? (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-amber-400 text-amber-300 bg-purple-900/20'
                  : 'border-transparent text-purple-300 hover:text-white'
              }`}
            >
              لوحة تحكم الوكيل
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'info'
                    ? 'border-amber-400 text-amber-300 bg-purple-900/20'
                    : 'border-transparent text-purple-300 hover:text-white'
                }`}
              >
                أنواع الوكالات وشروطها
              </button>
              <button
                onClick={() => setActiveTab('apply')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'apply'
                    ? 'border-amber-400 text-amber-300 bg-purple-900/20'
                    : 'border-transparent text-purple-300 hover:text-white'
                }`}
              >
                تقديم طلب وكالة جديد
              </button>
            </>
          )}
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Agent Dashboard View */}
          {activeTab === 'dashboard' && user.role === 'agent' && (
            <div className="space-y-4">
              {/* Agency Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#120824] p-3 rounded-2xl border border-purple-800/40 text-center">
                  <span className="text-[10px] text-purple-300 block">رصيد الوكالة</span>
                  <span className="font-digits font-black text-sm text-amber-400">
                    {user.coins.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-purple-400 block">كوينز</span>
                </div>
                <div className="bg-[#120824] p-3 rounded-2xl border border-purple-800/40 text-center">
                  <span className="text-[10px] text-purple-300 block">إجمالي المبيعات</span>
                  <span className="font-digits font-black text-sm text-green-400">
                    {(myAgency?.totalSalesEGP || 0).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-purple-400 block">ج.م</span>
                </div>
                <div className="bg-[#120824] p-3 rounded-2xl border border-purple-800/40 text-center">
                  <span className="text-[10px] text-purple-300 block">العمولة المكتسبة</span>
                  <span className="font-digits font-black text-sm text-cyan-400">
                    {(myAgency?.commissionEarnedEGP || 0).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-purple-400 block">ج.م</span>
                </div>
              </div>

              {/* Hosts & Content Creators Table (داتا المضيفين وصناع المحتوى التابعين للوكالة) */}
              <div className="bg-[#120824] p-3.5 rounded-2xl border border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">المضيفين وصناع المحتوى التابعين للوكالة ({agencyHosts.length})</span>
                  </div>
                  <span className="text-[10px] text-green-400 font-semibold bg-green-950/60 px-2 py-0.5 rounded-full border border-green-800/40">
                    تحديث لحظي مباشر
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="text-[10px] text-purple-300 border-b border-purple-900/40">
                        <th className="pb-1.5 font-bold">المضيف</th>
                        <th className="pb-1.5 font-bold text-center">UID</th>
                        <th className="pb-1.5 font-bold text-center">ساعات البث</th>
                        <th className="pb-1.5 font-bold text-center">التارجت</th>
                        <th className="pb-1.5 font-bold text-center">الكوينز المكتسبة</th>
                        <th className="pb-1.5 font-bold text-center">نسبة الوكالة</th>
                        <th className="pb-1.5 font-bold text-center">الحالة</th>
                        <th className="pb-1.5 font-bold text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/30">
                      {agencyHosts.map((host) => (
                        <tr key={host.uid} className="hover:bg-purple-900/20 transition-colors">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <img
                                src={host.avatar}
                                alt={host.name}
                                className="w-7 h-7 rounded-full object-cover border border-amber-400/40"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-[11px] text-white truncate block">{host.name}</span>
                                {host.isVerified && (
                                  <span className="text-[9px] text-sky-400 font-bold">موثق ✓</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-center font-digits font-bold text-purple-300 text-[11px]">
                            {host.uid}
                          </td>
                          <td className="py-2.5 text-center font-digits text-amber-300 text-[11px]">
                            {host.streamHours}h
                          </td>
                          <td className="py-2.5 text-center font-digits text-purple-200 text-[11px]">
                            {host.monthlyTarget.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-center font-digits font-bold text-green-400 text-[11px]">
                            {host.earnedCoins.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-center font-digits text-cyan-300 text-[11px]">
                            {host.agencyCut}%
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              host.status === 'live'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                : 'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                              {host.status === 'live' ? '🔴 لايف' : 'نشط'}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => {
                                setTargetUid(host.uid);
                                setChargeCoins('1000');
                              }}
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition-all"
                            >
                              شحن
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Agency Types Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-3">
              {agencyTypesInfo.map(t => (
                <div key={t.id} className="bg-[#120824] p-3.5 rounded-2xl border border-purple-800/40 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.icon}</span>
                    <h4 className="font-bold text-xs text-amber-300">{t.title}</h4>
                  </div>
                  <p className="text-xs text-purple-200 leading-relaxed">{t.desc}</p>
                </div>
              ))}

              <button
                onClick={() => setActiveTab('apply')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                تقديم طلب اعتماد وكالة الآن
              </button>
            </div>
          )}

          {/* Application Form Tab */}
          {activeTab === 'apply' && (
            isSubmitted ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">تم استلام طلب الوكالة بنجاح</h4>
                <p className="text-xs text-purple-300 leading-relaxed">
                  تم إرسال بياناتك وملفك إلى لوحة الإدارة للمراجعة والتدقيق الأمني. ستتلقى إشعاراً بنتيجة الطلب فور اعتماده.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">نوع الوكالة المطلوب:</label>
                  <select
                    value={agencyType}
                    onChange={(e) => setAgencyType(e.target.value as any)}
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none cursor-pointer"
                  >
                    <option value="charging_agent">⚡ وكيل شحن معتمد</option>
                    <option value="distributors_agent">🌐 وكيل موزعين</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-purple-200 mb-1">اسم الوكالة التجاري:</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="مثال: وكالة الأهرام للشحن"
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-purple-200 mb-1">رقم الهاتف للتواصل والواتساب:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs font-digits text-white placeholder-purple-400/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-purple-200 mb-1">الرقم القومي / إثبات الهوية (اختياري):</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="الرقم القومي"
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs font-digits text-white placeholder-purple-400/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-purple-200 mb-1">الخبرة السابقة وعدد صناع المحتوى التابعين:</label>
                  <textarea
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="اذكر خبراتك السابقة في إدارة البثوث أو الشحن..."
                    rows={3}
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white placeholder-purple-400/50 outline-none"
                    required
                  />
                </div>

                {formError && (
                  <p className="text-xs text-red-400 font-bold text-center">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all"
                >
                  إرسال طلب الاعتماد للإدارة
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};
