import React, { useEffect, useState } from 'react';
import { X, Bell, CheckCircle2, Coins, Radio } from 'lucide-react';
import { InAppNotification, UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface NotificationsModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ user, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>(() =>
    livoStore.getInAppNotifications()
  );

  useEffect(() => {
    const sync = () => setNotifications([...livoStore.getInAppNotifications()]);
    sync();
    return livoStore.subscribe(sync);
  }, [user.uid]);

  if (!isOpen) return null;

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
              <p className="text-[11px] text-purple-300">إشعارات الحساب المباشرة ({notifications.length})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-xs text-purple-300">
              لا توجد إشعارات جديدة لحسابك ({user.uid}) حالياً.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && livoStore.markNotificationRead(n.id)}
                className={`p-3 rounded-2xl border space-y-1 cursor-pointer transition-colors ${
                  n.isRead
                    ? 'bg-[#120824] border-purple-800/40 opacity-80'
                    : 'bg-purple-950/60 border-amber-400/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {n.type === 'recharge_approved' ? (
                      <Coins className="w-4 h-4 text-green-400 shrink-0" />
                    ) : n.type === 'agency_approved' ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-xs text-white truncate">{n.title}</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-digits shrink-0">
                    {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed pr-6">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
