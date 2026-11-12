import React, { useState } from 'react';
import { Search, Plus, Radio, Mic, Flame, Sparkles, Volume2, Users, Heart, Trophy, Crown, ArrowLeft } from 'lucide-react';
import { UserProfile, VoiceRoom } from '../../types';
import { livoStore } from '../../services/livoStore';
import { RoyalVoiceRoomModal } from './RoyalVoiceRoomModal';

interface PartyViewProps {
  currentUser: UserProfile;
  onOpenRecharge: () => void;
}

export const PartyView: React.FC<PartyViewProps> = ({ currentUser, onOpenRecharge }) => {
  const [activeSubTab, setActiveSubTab] = useState<'follow' | 'trending' | 'party' | 'live'>('party');
  const [activeFilterPill, setActiveFilterPill] = useState<string>('recommend');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<{
    id: string;
    title: string;
    ownerName: string;
    ownerAvatar: string;
    viewersCount: number;
    category?: string;
  } | null>(null);

  const [adminRoomClosed, setAdminRoomClosed] = useState(false);
  const [myLiveStream, setMyLiveStream] = useState<{
    id: string;
    title: string;
    streamer: string;
    avatar: string;
    viewers: number;
    coinsEarned: number;
    cover: string;
    tag: string;
  } | null>(null);

  // Check if the current user is the official platform owner/admin (livo.admin@gmail.com)
  const isAdminLoggedIn = (currentUser.email === 'livo.admin@gmail.com' || currentUser.role === 'owner') && !adminRoomClosed;

  // Pinned Official Admin Room - strictly active ONLY when livo.admin@gmail.com is present!
  const adminPinnedRoom = {
    id: 'room-admin-official',
    title: '👑 روم الإدارة الرسمية — LIVO Official',
    ownerName: 'LIVO Official Admin',
    ownerEmail: 'livo.admin@gmail.com',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    cover: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=300&fit=crop',
    isOfficial: true,
    isPinned: true,
    isLive: isAdminLoggedIn,
    statusText: isAdminLoggedIn ? 'بث الإدارة مباشر الآن 🟢' : 'مغلقة حالياً 🔒 (تعمل فقط عند تواجد الإدارة)',
    tag: 'إدارة رسمية',
    viewers: isAdminLoggedIn ? 154 : 0
  };

  // Real registered community rooms
  const communityRooms = [
    {
      id: 'room-user-1',
      title: 'جلسة سمر وطرب أصيل 🎶',
      ownerName: 'أحمد شاهين',
      ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=260&fit=crop',
      tag: 'طرب',
      seatsAvail: 'مقاعد متاحة',
      viewers: 28,
      country: '🇪🇬',
      points: 'VIP 5'
    },
    {
      id: 'room-user-2',
      title: 'سوالف ودردشة شباب وبنات القاهرة ☕',
      ownerName: 'سارة نور',
      ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=260&fit=crop',
      tag: 'دردشة',
      seatsAvail: 'مقاعد متاحة',
      viewers: 19,
      country: '🇪🇬',
      points: 'VIP 3'
    },
    {
      id: 'room-user-3',
      title: 'ديوانية وكالة الأهرام وتحديات لودو 🎲',
      ownerName: 'طارق المصري (وكيل)',
      ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=260&fit=crop',
      tag: 'وكالة',
      seatsAvail: 'مقاعد متاحة',
      viewers: 42,
      country: '🇪🇬',
      points: 'وكيل معتمد'
    }
  ];

  // 2-Column Live Streams matching screenshot
  const liveStreams = [
    {
      id: 'live-1',
      streamer: 'سارة نور',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
      viewers: 68,
      title: 'صباح الورد والياسمين 🌸',
      tag: 'محادثة'
    },
    {
      id: 'live-2',
      streamer: 'ياسمين الشام',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
      viewers: 313,
      title: 'تحدي الداعمين وسحب كوينز 🔥',
      tag: 'حفلة'
    },
    {
      id: 'live-3',
      streamer: 'نور القمر',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
      viewers: 33,
      title: 'عزف عود وأجمل الأغاني 🎶',
      tag: 'موسيقى'
    },
    {
      id: 'live-4',
      streamer: 'أميرة القلوب',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
      viewers: 38,
      title: 'يوميات وبث مباشر مع المتابعين',
      tag: 'حياة'
    },
    {
      id: 'live-5',
      streamer: 'دودي كوين',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop',
      viewers: 106,
      title: 'مسابقات وجوائز كوينز كبرى 🏆',
      tag: 'ألعاب'
    },
    {
      id: 'live-6',
      streamer: 'شبح الليل',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
      cover: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
      viewers: 245,
      title: 'سهرة طرب إسكندرانية 🌊',
      tag: 'طرب'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none">
      
      {/* Top Header matching screenshots: Search + 4 Sub-Tabs + Plus */}
      <div className="bg-white px-3 pt-3 pb-2 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Search Bar */}
          <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-full px-3 py-1.5 text-xs text-gray-500">
            <Search className="w-3.5 h-3.5 text-gray-400 ml-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن الغرف، المذيعين..."
              className="w-full bg-transparent outline-none text-xs text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Plus / Create Room Button */}
          <button
            onClick={() => {
              setSelectedRoom({
                id: 'new-party-room',
                title: `${currentUser.displayName} — غرفة الحفلة`,
                ownerName: currentUser.displayName,
                ownerAvatar: currentUser.avatar,
                viewersCount: 1,
                category: 'حفلة'
              });
            }}
            className="w-8 h-8 rounded-full bg-[#FFE600] text-black font-extrabold flex items-center justify-center shadow hover:bg-yellow-400 active:scale-95 transition-all shrink-0"
            title="إنشاء غرفة جديدة"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 4 Navigation Subtabs: متابعة | شائع | الحفلة | بث مباشر */}
        <div className="flex items-center justify-between text-sm px-2 pt-1 font-bold">
          <button
            onClick={() => setActiveSubTab('follow')}
            className={`pb-1.5 transition-all relative ${
              activeSubTab === 'follow' ? 'text-black font-black text-base' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            متابعة
            {activeSubTab === 'follow' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#FFE600]" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('trending')}
            className={`pb-1.5 transition-all relative ${
              activeSubTab === 'trending' ? 'text-black font-black text-base' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            شائع
            {activeSubTab === 'trending' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#FFE600]" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('party')}
            className={`pb-1.5 transition-all relative ${
              activeSubTab === 'party' ? 'text-black font-black text-base' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            الحفلة
            {activeSubTab === 'party' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#FFE600]" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('live')}
            className={`pb-1.5 transition-all relative ${
              activeSubTab === 'live' ? 'text-black font-black text-base' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            بث مباشر
            {activeSubTab === 'live' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#FFE600]" />
            )}
          </button>
        </div>

        {/* Secondary Category Pills matching screenshot: توصية (yellow) | مجتمع | مركز النشاط | فعاليات */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-bold">
          <button
            onClick={() => setActiveFilterPill('recommend')}
            className={`px-3 py-1 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'recommend'
                ? 'bg-[#FFE600] text-black shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            توصية
          </button>
          <button
            onClick={() => setActiveFilterPill('community')}
            className={`px-3 py-1 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'community'
                ? 'bg-[#FFE600] text-black shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            مجتمع
          </button>
          <button
            onClick={() => setActiveFilterPill('activity')}
            className={`px-3 py-1 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'activity'
                ? 'bg-[#FFE600] text-black shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            مركز النشاط
          </button>
          <button
            onClick={() => setActiveFilterPill('events')}
            className={`px-3 py-1 rounded-full transition-all shrink-0 ${
              activeFilterPill === 'events'
                ? 'bg-[#FFE600] text-black shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            فعاليات
          </button>
        </div>
      </div>

      {/* Floating Friends Banner matching screenshot: "9 من المتابعين في الحفلة" */}
      <div className="px-3 py-2">
        <div className="bg-gradient-to-r from-[#FFFBE6] via-yellow-50 to-white border border-[#FFE600]/60 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden rtl:space-x-reverse">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop"
                alt="user"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop"
                alt="user"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop"
                alt="user"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
            </div>
            <span className="text-xs font-bold text-gray-800">
              <strong className="text-black font-extrabold font-digits">9</strong> من المتابعين في الحفلة
            </span>
          </div>
          <span className="text-xs bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold px-2.5 py-1 rounded-full cursor-pointer shadow-xs">
            انضم الآن
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        
        {/* SUBTAB 1 & 2: الحفلة (Party) & متابعة */}
        {(activeSubTab === 'party' || activeSubTab === 'follow') && (
          <div className="space-y-3">
            
            {/* 👑 PINNED OFFICIAL ADMIN ROOM (Fixed at Top, Live ONLY when livo.admin@gmail.com is in session) */}
            <div
              onClick={() => {
                if (!adminPinnedRoom.isLive) {
                  alert('🔒 غرفة الإدارة الرسمية مغلقة حالياً.\nتفتح الغرفة ويبدأ البث المباشر حصرياً عند تسجيل دخول المالك الرسمي: livo.admin@gmail.com');
                  return;
                }
                setSelectedRoom({
                  id: adminPinnedRoom.id,
                  title: adminPinnedRoom.title,
                  ownerName: adminPinnedRoom.ownerName,
                  ownerAvatar: adminPinnedRoom.ownerAvatar,
                  viewersCount: adminPinnedRoom.viewers,
                  category: adminPinnedRoom.tag
                });
              }}
              className={`rounded-2xl border-2 p-3 flex items-center justify-between gap-3 shadow-md transition-all cursor-pointer relative overflow-hidden ${
                adminPinnedRoom.isLive
                  ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-white border-amber-400 hover:shadow-lg'
                  : 'bg-gray-100/90 border-gray-300 opacity-90'
              }`}
            >
              {/* Pinned Tag */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-black text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1">
                <span>👑 مثبتة في القمة</span>
              </div>

              {/* Cover & Admin Avatar */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 mt-1">
                <img
                  src={adminPinnedRoom.cover}
                  alt={adminPinnedRoom.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className={`absolute top-1 right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                  adminPinnedRoom.isLive ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-700 text-gray-200'
                }`}>
                  {adminPinnedRoom.isLive ? 'مباشر 🟢' : 'مغلق 🔒'}
                </span>
                <span className="absolute bottom-1 right-1 bg-[#FFE600] text-black text-[8px] font-black px-1.5 py-0.2 rounded-full">
                  LIVO Admin
                </span>
              </div>

              {/* Room Details */}
              <div className="flex-1 min-w-0 pr-1 mt-1">
                <h4 className="font-black text-xs text-gray-900 truncate mb-1">
                  {adminPinnedRoom.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mb-1">
                  <img
                    src={adminPinnedRoom.ownerAvatar}
                    alt={adminPinnedRoom.ownerName}
                    className="w-4 h-4 rounded-full border border-amber-400 object-cover"
                  />
                  <span className="font-bold text-gray-900 truncate">{adminPinnedRoom.ownerName}</span>
                </div>

                <div className="text-[10px] font-bold">
                  {adminPinnedRoom.isLive ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                      المالك متواجد الآن — الروم مفتوح للجميع
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold flex items-center gap-1">
                      🔒 مغلقة (تعمل فقط عند دخول livo.admin@gmail.com)
                    </span>
                  )}
                </div>
              </div>

              {/* Enter / Status Button */}
              <div className="flex flex-col items-end justify-between self-stretch shrink-0 mt-1">
                <div className="text-[10px] font-digits font-extrabold text-amber-700">
                  {adminPinnedRoom.isLive ? `👥 ${adminPinnedRoom.viewers}` : '—'}
                </div>
                <button className={`text-[11px] font-black px-3.5 py-1.5 rounded-full shadow-xs transition-colors ${
                  adminPinnedRoom.isLive
                    ? 'bg-[#FFE600] hover:bg-yellow-400 text-black'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}>
                  {adminPinnedRoom.isLive ? 'دخول الروم' : 'مغلقة'}
                </button>
              </div>
            </div>

            {/* REAL REGISTERED COMMUNITY ROOMS */}
            {communityRooms.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedRoom({
                  id: card.id,
                  title: card.title,
                  ownerName: card.ownerName,
                  ownerAvatar: card.ownerAvatar,
                  viewersCount: card.viewers,
                  category: card.tag
                })}
                className="bg-white rounded-2xl border border-gray-100 p-2.5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Right: Room Cover & Host Avatar */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={card.cover}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Category Tag */}
                  <span className="absolute top-1 right-1 bg-[#10B981] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    {card.tag}
                  </span>

                  {/* Seat hint */}
                  <span className="absolute bottom-1 right-1 bg-[#FFE600] text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                    {card.seatsAvail}
                  </span>
                </div>

                {/* Center: Title & Room Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs text-gray-900 truncate mb-1">
                    {card.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                    <img
                      src={card.ownerAvatar}
                      alt={card.ownerName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="font-medium text-gray-700 truncate">{card.ownerName}</span>
                    <span className="text-[9px]">{card.country}</span>
                  </div>

                  {/* Room status & Audio indicator */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-[#059669] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      بث صوتي مباشر
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="bg-amber-100 text-amber-900 font-extrabold text-[8px] px-1 rounded">
                      {card.points}
                    </span>
                  </div>
                </div>

                {/* Left: Viewers Count & Join Button */}
                <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                  <div className="flex items-center gap-1 text-gray-500 font-digits font-extrabold text-xs">
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>{card.viewers}</span>
                  </div>

                  <button className="bg-[#FFE600] group-hover:bg-yellow-400 text-black font-extrabold text-[11px] px-3 py-1 rounded-full shadow-xs transition-colors">
                    دخول
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBTAB 3 & 4: بث مباشر & شائع (2-Column Grid matching screenshots) */}
        {(activeSubTab === 'live' || activeSubTab === 'trending') && (
          <div className="grid grid-cols-2 gap-2.5">
            {liveStreams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => setSelectedRoom({
                  id: stream.id,
                  title: stream.title,
                  ownerName: stream.streamer,
                  ownerAvatar: stream.avatar,
                  viewersCount: stream.viewers,
                  category: stream.tag
                })}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-gray-900 shadow-xs cursor-pointer group"
              >
                <img
                  src={stream.cover}
                  alt={stream.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                  <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                  <div className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full font-digits font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#FFE600]" />
                    <span>{stream.viewers}</span>
                  </div>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <img
                      src={stream.avatar}
                      alt={stream.streamer}
                      className="w-5 h-5 rounded-full border border-white object-cover"
                    />
                    <span className="text-xs font-bold truncate text-white">{stream.streamer}</span>
                  </div>
                  <p className="text-[10px] text-gray-200 line-clamp-1">{stream.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Royal 20-Throne Voice Room Modal */}
      {selectedRoom && (
        <RoyalVoiceRoomModal
          room={selectedRoom}
          currentUser={currentUser}
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onOpenRecharge={onOpenRecharge}
          onAdminLeaveRoom={() => {
            setAdminRoomClosed(true);
            setSelectedRoom(null);
          }}
        />
      )}

      {/* Live Broadcast Modal (عندما يفتح المستخدم بث مباشر) */}
      {myLiveStream && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white animate-in fade-in select-none">
          {/* Live Top Header */}
          <div className="p-3 pt-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-20">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-800/40">
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full border border-[#FFE600] object-cover"
              />
              <div>
                <h4 className="font-extrabold text-xs text-white truncate max-w-[120px]">{currentUser.displayName}</h4>
                <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  أنت على الهواء الآن
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                <span>LIVE</span>
                <span className="font-digits font-bold text-white">{myLiveStream.viewers}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من إنهاء البث المباشر؟')) {
                    setMyLiveStream(null);
                  }
                }}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-red-700 flex items-center justify-center text-white font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Live Stream Center Video/Animation */}
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="relative w-48 h-48 rounded-full p-2 bg-gradient-to-tr from-[#FFE600] via-pink-500 to-purple-600 animate-pulse flex items-center justify-center">
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-full h-full rounded-full object-cover border-4 border-black"
              />
            </div>
            <h3 className="mt-4 font-black text-lg text-white">{myLiveStream.title}</h3>
            <span className="text-xs text-[#FFE600] font-bold mt-1">الجمهور يتابعك ويتفاعل معك بالهدايا 🎁</span>
          </div>

          {/* Bottom Live Comments & Controls */}
          <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent space-y-2 z-20">
            <div className="max-h-24 overflow-y-auto space-y-1 text-xs">
              <div className="bg-black/60 px-3 py-1 rounded-full border border-purple-900/40 text-purple-200 w-fit">
                👋 دخل أحمد شاهين إلى البث المباشر
              </div>
              <div className="bg-black/60 px-3 py-1 rounded-full border border-purple-900/40 text-purple-200 w-fit">
                💬 سارة نور: منور اللايف يا بطل 🔥
              </div>
              <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full w-fit font-bold">
                🎁 أرسل طارق المصري (أسد ذهبي 🦁) على اللايف!
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="تحدث مع المتابعين في اللايف..."
                className="flex-1 bg-white/10 text-white placeholder-gray-400 px-3.5 py-2 rounded-full outline-none text-xs"
              />
              <button
                onClick={() => {
                  alert('تم إرسال هدية تجريبية على البث المباشر! 🦁');
                }}
                className="bg-[#FFE600] text-black text-xs font-black px-4 py-2 rounded-full shadow-md"
              >
                تفاعل 🎁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
