import React from 'react';
import { Home, Compass, MessageSquare, User } from 'lucide-react';

export type HagoTab = 'me' | 'messages' | 'discover' | 'party';

interface HagoBottomNavProps {
  activeTab: HagoTab;
  setActiveTab: (tab: HagoTab) => void;
  unreadCount?: number;
}

export const HagoBottomNav: React.FC<HagoBottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadCount = 0
}) => {
  return (
    <nav className="bg-white border-t border-gray-100 px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)] z-30 select-none">
      
      {/* 1. الحفلة (Party) */}
      <button
        onClick={() => setActiveTab('party')}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-all ${
          activeTab === 'party' ? 'text-[#FF2D55] font-black scale-105' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'party' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[11px] tracking-tight">الحفلة</span>
      </button>

      {/* 2. اكتشف (Discover) */}
      <button
        onClick={() => setActiveTab('discover')}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-all ${
          activeTab === 'discover' ? 'text-[#FF2D55] font-black scale-105' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Compass className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[11px] tracking-tight">اكتشف</span>
      </button>

      {/* 3. الرسائل (Messages) */}
      <button
        onClick={() => setActiveTab('messages')}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-all relative ${
          activeTab === 'messages' ? 'text-[#FF2D55] font-black scale-105' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className="relative">
          <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -left-2 min-w-4 h-4 px-1 rounded-full bg-[#FF2D55] text-white font-digits font-black text-[9px] flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[11px] tracking-tight">الرسائل</span>
      </button>

      {/* 4. حسابي (Me / Profile) */}
      <button
        onClick={() => setActiveTab('me')}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-all ${
          activeTab === 'me' ? 'text-black font-black scale-105' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center p-0.5 ${
          activeTab === 'me' ? 'bg-[#FFE600] ring-1 ring-black' : 'bg-gray-100'
        }`}>
          <User className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <span className="text-[11px] tracking-tight">حسابي</span>
      </button>

    </nav>
  );
};
