import React from 'react';
import { Smartphone, Shield, Columns, Maximize2, Minimize2, UserCheck } from 'lucide-react';
import { livoStore } from '../../services/livoStore';
import { LivoCustomerAppIcon, LivoAdminAppIcon } from '../../assets/appIcons';

interface HeaderBarProps {
  appMode: 'customer' | 'admin' | 'split';
  setAppMode: (mode: 'customer' | 'admin' | 'split') => void;
  isFramed: boolean;
  setIsFramed: (framed: boolean) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  appMode,
  setAppMode,
  isFramed,
  setIsFramed
}) => {
  const users = livoStore.getUsers();
  const currentUser = livoStore.getCurrentUser();

  const handleQuickSwitchUser = (uid: string) => {
    livoStore.setCurrentUser(uid);
  };

  return (
    <header className="bg-[#120824] border-b border-purple-900/40 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-white sticky top-0 z-50 shadow-lg shadow-purple-950/30">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <LivoCustomerAppIcon size={34} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-pink-400 via-purple-200 to-amber-300 bg-clip-text text-transparent">
              LIVO
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-semibold border border-purple-700/40">
              v2.5
            </span>
          </div>
          <p className="text-[10px] text-purple-300/70 hidden sm:block">
            منظومة البث الاجتماعي والدردشة وإدارة العمليات
          </p>
        </div>
      </div>

      {/* App Mode Switcher (Customer / Admin / Split View) */}
      <div className="flex items-center bg-[#1a0f35] p-1 rounded-xl border border-purple-800/40">
        <button
          onClick={() => setAppMode('customer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            appMode === 'customer'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
          }`}
          title="تطبيق العملاء LIVO Customer"
        >
          <LivoCustomerAppIcon size={18} />
          <span>تطبيق العميل</span>
        </button>

        <button
          onClick={() => setAppMode('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            appMode === 'admin'
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black font-extrabold shadow-md shadow-amber-600/30'
              : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
          }`}
          title="تطبيق الإدارة LIVO Admin"
        >
          <LivoAdminAppIcon size={18} />
          <span>لوحة الإدارة</span>
        </button>

        <button
          onClick={() => setAppMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            appMode === 'split'
              ? 'bg-gradient-to-r from-violet-600 to-purple-800 text-white shadow-md'
              : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
          }`}
          title="عرض تجريبي متزامن للتطبيقين جنباً إلى جنب لاختبار العمليات لحظياً"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden md:inline">عرض متزامن (2 في 1)</span>
        </button>
      </div>

      {/* Quick Account Switcher & Frame Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#1a0f35] px-2.5 py-1 rounded-xl border border-purple-800/40">
          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-purple-300 hidden md:inline">الحساب النشط:</span>
          <select
            value={currentUser?.uid || ''}
            onChange={(e) => handleQuickSwitchUser(e.target.value)}
            className="bg-transparent text-xs text-amber-300 font-bold outline-none cursor-pointer"
          >
            {users.map(u => (
              <option key={u.uid} value={u.uid} className="bg-[#170b2c] text-white">
                {u.displayName} ({u.role === 'owner' ? 'المالك' : u.role === 'agent' ? 'وكيل' : 'مستخدم'} - UID: {u.uid})
              </option>
            ))}
          </select>
        </div>

        {appMode !== 'split' && (
          <button
            onClick={() => setIsFramed(!isFramed)}
            className="p-1.5 rounded-lg bg-[#1a0f35] border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
            title={isFramed ? "ملء الشاشة" : "إطار هاتف أندرويد"}
          >
            {isFramed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
};
