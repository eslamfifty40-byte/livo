import React, { useState, useEffect } from 'react';
import { RefreshCw, Compass, Mic, Music, MapPin, Check, Plus, Sparkles, MessageCircle, Users } from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';
import { LivoVerifiedBadge } from '../common/LivoVerifiedBadge';

interface DiscoverViewProps {
  currentUser: UserProfile;
  onStartChat?: (uid: string) => void;
}

const ORBIT_SLOTS = [
  { top: '10%', left: '20%' },
  { top: '8%', left: '68%' },
  { top: '42%', left: '8%' },
  { top: '40%', left: '80%' },
  { top: '75%', left: '16%' },
  { top: '72%', left: '65%' },
  { top: '84%', left: '40%' }
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({ currentUser, onStartChat }) => {
  const [activeCategory, setActiveCategory] = useState<'party' | 'sing' | 'popular'>('party');
  const [genuineUsers, setGenuineUsers] = useState<UserProfile[]>(() => livoStore.getGenuineUsers());
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const sync = () => setGenuineUsers([...livoStore.getGenuineUsers()]);
    const unsub = livoStore.subscribe(sync);
    return () => unsub();
  }, []);

  const blockedSet = new Set(currentUser.blockedUids || []);
  const followingSet = new Set(currentUser.followingUids || []);

  const candidates = genuineUsers.filter(
    u => u.uid !== currentUser.uid && !blockedSet.has(u.uid)
  );

  // Rotate real users across the 7 radar orbit positions when user taps "تغيير"
  const rotatedCandidates = candidates.length > 0
    ? [...candidates.slice(shuffleOffset % candidates.length), ...candidates.slice(0, shuffleOffset % candidates.length)]
    : [];

  const radarUsers = rotatedCandidates.slice(0, ORBIT_SLOTS.length).map((user, idx) => ({
    user,
    ...ORBIT_SLOTS[idx]
  }));

  const suggestedUsers = showAll ? rotatedCandidates : rotatedCandidates.slice(0, 12);

  const handleShuffleRadar = () => {
    if (candidates.length > 1) {
      setShuffleOffset(prev => (prev + 1) % candidates.length);
    }
  };

  const handleToggleFollow = (targetUid: string) => {
    livoStore.toggleFollowUser(currentUser.uid, targetUid);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none overflow-y-auto pb-8">
      
      {/* Top Header & Filter Pills */}
      <div className="bg-white px-3 pt-3 pb-2 border-b border-gray-100 shadow-2xs sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <button
              onClick={() => setActiveCategory('party')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                activeCategory === 'party'
                  ? 'bg-[#FFE600] text-black font-extrabold shadow-2xs'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              حفلة
            </button>

            <button
              onClick={() => setActiveCategory('sing')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                activeCategory === 'sing'
                  ? 'bg-[#FFE600] text-black font-extrabold shadow-2xs'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              غناء
            </button>

            <button
              onClick={() => setActiveCategory('popular')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                activeCategory === 'popular'
                  ? 'bg-[#FFE600] text-black font-extrabold shadow-2xs'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              الشائع
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-700">
            <span>🇪🇬 {currentUser.country || 'مصر'}</span>
          </div>
        </div>
      </div>

      {/* Circular Radar Match Section */}
      <div className="px-3 pt-4 pb-2">
        <div className="relative w-full aspect-square max-h-[300px] mx-auto bg-gradient-to-b from-[#180829] to-[#290d40] rounded-3xl overflow-hidden shadow-md flex items-center justify-center p-4">
          
          <div className="absolute inset-8 rounded-full border border-purple-500/20 animate-pulse pointer-events-none" />
          <div className="absolute inset-16 rounded-full border border-purple-400/30 pointer-events-none" />
          <div className="absolute inset-24 rounded-full border border-purple-300/40 pointer-events-none" />

          {/* Central 3D Disc */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-500 p-1 shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center text-white">
            <div className="w-full h-full rounded-full bg-[#1b082c] flex flex-col items-center justify-center">
              <Compass className="w-6 h-6 text-[#FFE600]" />
              <span className="text-[9px] font-extrabold text-[#FFE600] tracking-wider mt-0.5">LIVO</span>
            </div>
          </div>

          {radarUsers.length === 0 ? (
            <span className="absolute bottom-4 left-4 text-[10px] text-purple-200/80 bg-black/40 px-2.5 py-1 rounded-full">
              في انتظار انضمام أعضاء جدد قريباً
            </span>
          ) : (
            radarUsers.map(({ user, top, left }) => (
              <div
                key={user.uid}
                onClick={() => onStartChat?.(user.uid)}
                style={{ top, left }}
                className="absolute z-10 flex flex-col items-center cursor-pointer group transition-transform hover:scale-110"
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#FFE600] shadow-md"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border border-white" />
                </div>
                <span className="text-[10px] text-white font-bold bg-black/60 backdrop-blur-xs px-1.5 rounded-full mt-0.5 whitespace-nowrap max-w-[75px] truncate">
                  {user.displayName}
                </span>
              </div>
            ))
          )}

          <button
            onClick={handleShuffleRadar}
            className="absolute bottom-3 right-3 z-20 bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>تغيير</span>
          </button>
        </div>
      </div>

      {/* Suggested Real Community Users */}
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FFE600] fill-[#FFE600]" />
            أعضاء مجتمع LIVO المسجلون ({candidates.length})
          </h3>
          {candidates.length > 12 && (
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="text-xs text-purple-700 font-bold hover:underline"
            >
              {showAll ? 'عرض أقل' : 'عرض المزيد'}
            </button>
          )}
        </div>

        {suggestedUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2 shadow-2xs">
            <Users className="w-9 h-9 text-gray-300 mx-auto" />
            <p className="text-xs font-extrabold text-gray-700">لا يوجد مستخدمون مسجلون آخرون بعد</p>
            <p className="text-[11px] text-gray-400">
              يظهر هنا فقط الأعضاء الحقيقيون المسجلون عبر Google أو البريد أو الهاتف داخل المنصة.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {suggestedUsers.map((user) => {
              const isFollowed = followingSet.has(user.uid);

              return (
                <div
                  key={user.uid}
                  className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-gray-900 truncate">
                        {user.displayName}
                      </h4>
                      {user.isVerified && <LivoVerifiedBadge size={14} />}
                      <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1 rounded font-digits">
                        Lv.{user.level || 0}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-digits block">
                      UID: {user.uid} • @{user.username}
                    </span>
                    <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                      {user.bio || 'عضو حقيقي في منصة LIVO 🌟'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onStartChat && (
                      <button
                        onClick={() => onStartChat(user.uid)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors"
                        title="إرسال رسالة"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleFollow(user.uid)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 shadow-2xs ${
                        isFollowed
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-[#FFE600] hover:bg-yellow-400 text-black active:scale-95'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" />
                          متابع
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 stroke-[3]" />
                          تابع
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

