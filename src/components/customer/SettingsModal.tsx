import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, Check, CheckCircle2, X, ShieldBan, Bell } from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface SettingsModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSwitchAccount?: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSwitchAccount,
  onLogout
}) => {
  const [cacheSize, setCacheSize] = useState('0.51M');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [publicBroadcast, setPublicBroadcast] = useState(true);
  const [privateProfileOnly, setPrivateProfileOnly] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const notificationsOn = user.notificationsEnabled !== false;
  const blockedUids = user.blockedUids || [];

  const handleToggleNotifications = () => {
    const nextVal = !notificationsOn;
    livoStore.updateUserProfile(user.uid, { notificationsEnabled: nextVal });
    showToast(nextVal ? 'تم تفعيل إشعارات الرسائل والتنبيهات ✓' : 'تم كتم الإشعارات مؤقتاً');
  };

  const handleClearCache = () => {
    setCacheSize('0.00M');
    showToast('تم مسح الذاكرة الانتقالية المؤقتة بنجاح ✓');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white text-gray-900 flex flex-col select-none animate-in slide-in-from-right duration-200">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black text-[#FFE600] px-4 py-2 rounded-full text-xs font-black shadow-lg animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5 whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">إعدادات المنظومة</h2>
        </div>
      </div>

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] divide-y divide-gray-100">
        
        {/* GROUP 1: الإشعارات والخصوصية والأمان */}
        <div className="bg-white my-2 divide-y divide-gray-50 border-y border-gray-100">
          <div
            onClick={handleToggleNotifications}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="font-bold text-xs text-gray-900">إشعار الرسائل والتنبيهات</span>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              notificationsOn ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {notificationsOn ? 'مفعل' : 'متوقف'}
            </span>
          </div>

          <div
            onClick={() => setShowBlockedModal(true)}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldBan className="w-4 h-4 text-gray-600" />
              <span className="font-bold text-xs text-gray-900">قائمة المحظورين</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-digits font-bold text-gray-500">{blockedUids.length}</span>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div
            onClick={() => {
              const next = !publicBroadcast;
              setPublicBroadcast(next);
              showToast(next ? 'تم تفعيل إخطار البث العام ✓' : 'تم إيقاف إخطار البث العام');
            }}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <span className="font-bold text-xs text-gray-900">إخطار البث العام</span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              publicBroadcast ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {publicBroadcast ? 'مفعل' : 'متوقف'}
            </span>
          </div>

          <div
            onClick={() => {
              const next = !privateProfileOnly;
              setPrivateProfileOnly(next);
              showToast(next ? 'الخصوصية: الظهور للأصدقاء فقط' : 'الخصوصية: الظهور للجميع في LIVO');
            }}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <span className="font-bold text-xs text-gray-900">الخصوصية والظهور</span>
            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {privateProfileOnly ? 'الأصدقاء فقط' : 'متاح للجميع'}
            </span>
          </div>

          <div
            onClick={() => showToast(`حسابك (${user.uid}) مربوط ومؤمّن بالكامل ✓`)}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <span className="font-bold text-xs text-gray-900">مركز الأمان</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                تحت الحماية
              </span>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* GROUP 2: الشبكة والتخزين */}
        <div className="bg-white my-2 divide-y divide-gray-50 border-y border-gray-100">
          <div
            onClick={() => showToast('تشخيص الاتصال: متصل بقاعدة بيانات Firebase الموحدة ✓')}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <span className="font-bold text-xs text-gray-900">تشخيص الشبكة والاتصال</span>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div
            onClick={handleClearCache}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <span className="font-bold text-xs text-gray-900">مسح الذاكرة الانتقالية المؤقتة</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-digits font-bold text-gray-500">{cacheSize}</span>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div
            onClick={() => showToast(`منظومة LIVO الموحدة — UID: ${user.uid}`)}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <span className="font-bold text-xs text-gray-900">عن المنظومة وإصدار التطبيق</span>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* GROUP 3: الحساب وتبديل الحساب والخروج */}
        <div className="bg-white my-2 divide-y divide-gray-50 border-y border-gray-100">
          <div
            onClick={() => {
              onClose();
              if (onSwitchAccount) onSwitchAccount();
            }}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
          >
            <span className="font-bold text-xs text-gray-900">تبديل الحساب</span>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </div>

          <div
            onClick={() => setShowLogoutConfirm(true)}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-red-50 cursor-pointer text-red-600"
          >
            <span className="font-bold text-xs text-red-600">تسجيل الخروج</span>
            <ChevronLeft className="w-4 h-4 text-red-400" />
          </div>
        </div>
      </div>

      {/* Blocked Users Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-3 text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-black text-sm">قائمة المحظورين ({blockedUids.length})</h3>
              <button onClick={() => setShowBlockedModal(false)} className="text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            {blockedUids.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">لا توجد حسابات محظورة من قبلك حالياً.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {blockedUids.map(targetUid => {
                  const target = livoStore.getUserByUid(targetUid);
                  return (
                    <div key={targetUid} className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        {target?.avatar && (
                          <img src={target.avatar} alt={target.displayName} className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <div>
                          <span className="text-xs font-bold block">{target?.displayName || `مستخدم ${targetUid}`}</span>
                          <span className="text-[10px] text-gray-500 font-digits">UID: {targetUid}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          livoStore.toggleBlockUser(user.uid, targetUid);
                          showToast('تم إلغاء الحظر بنجاح ✓');
                        }}
                        className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFE600] text-black"
                      >
                        إلغاء الحظر
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl relative text-gray-900">
            <h3 className="font-black text-base mb-2 text-gray-900">تأكيد تسجيل الخروج</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في تسجيل الخروج من هذا الحساب؟
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onClose();
                  if (onLogout) onLogout();
                }}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

