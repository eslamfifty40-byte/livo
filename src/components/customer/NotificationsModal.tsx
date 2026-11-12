import React from 'react';
import { X, Bell, CheckCircle2, ShieldAlert, Coins, Radio } from 'lucide-react';
import { UserProfile } from '../../types';

interface NotificationsModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n-1',
      title: 'إشعار رسمي من إدارة LIVO',
      body: 'مرحباً بك في LIVO! تم تفعيل ميزات الحماية والتحديثات الأمنية لمنظومة البث والغرف.',
      time: 'منذ ساعتين',
      type: 'official',
      icon: <Radio className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'n-2',
      title: 'حالة محفظة الكوينز',
      body: `رصيدك الحالي هو ${user.coins.toLocaleString()} كوينز. يمكنك الشحن بأمان عبر باقات الكوينز المعتمدة.`,
      time: 'اليوم 10:30 ص',
      type: 'coins',
      icon: <Coins className="w-4 h-4 text-green-400" />
    },
    {
      id: 'n-3',
      title: 'أمان الحساب ومعرف UID',
      body: `معرفك الثابت هو ${user.uid}. تم فحص سلامة الجلسة وتوثيق الاتصال المشفر.`,
      time: 'أمس',
      type: 'security',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#170b2c] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-800/60 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white">
        <div className="p-4 border-b border-purple-800/40 flex items-center justify-between bg-[#1f103b]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">مركز الإشعارات والتنبيهات</h3>
              <p className="text-[11px] text-purple-300">أحدث مستجدات الحساب والعمليات</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5">
          {notifications.map(n => (
            <div
              key={n.id}
              className="bg-[#120824] p-3 rounded-2xl border border-purple-800/40 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {n.icon}
                  <span className="font-bold text-xs text-white">{n.title}</span>
                </div>
                <span className="text-[10px] text-purple-400 font-digits">{n.time}</span>
              </div>
              <p className="text-xs text-purple-200/90 leading-relaxed pr-6">
                {n.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
