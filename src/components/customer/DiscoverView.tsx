import React, { useState } from 'react';
import { RefreshCw, Users, Compass, Gamepad2, Mic, Music, MapPin, Check, Plus, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';

interface DiscoverViewProps {
  currentUser: UserProfile;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ currentUser }) => {
  const [activeCategory, setActiveCategory] = useState<'party' | 'sing' | 'popular'>('party');
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});

  // Radar Match Orbiting Avatars matching Screenshot 5
  const [radarUsers, setRadarUsers] = useState([
    { id: 'u1', name: 'Meme 🎀', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', top: '10%', left: '20%' },
    { id: 'u2', name: 'Amira ✨', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', top: '8%', left: '68%' },
    { id: 'u3', name: 'Karim 👑', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', top: '42%', left: '8%' },
    { id: 'u4', name: 'Soha 🌸', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop', top: '40%', left: '80%' },
    { id: 'u5', name: 'Tarek 🔥', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', top: '75%', left: '16%' },
    { id: 'u6', name: 'Nour 💎', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', top: '72%', left: '65%' },
    { id: 'u7', name: 'Yara 🎵', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop', top: '85%', left: '40%' }
  ]);

  // Suggested Nearby Users matching Screenshot 5
  const suggestedUsers = [
    {
      id: 'sug-sara',
      name: 'سارة نور',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
      distance: 'بالقرب منك • 800 م',
      bio: 'عاشقة للألعاب الصوتية ولودو وتحدي الطرب 🎤',
      level: 32,
      country: '🇪🇬'
    },
    {
      id: 'sug-ahmed',
      name: 'أحمد شاهين',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      distance: 'بالقرب منك • 1.5 كم',
      bio: 'مرحب بالجميع في رومات LIVO وسهرات الأنس ☕',
      level: 44,
      country: '🇪🇬'
    },
    {
      id: 'sug-tariq',
      name: 'طارق المصري (وكيل)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
      distance: 'بالقرب منك • 2.1 كم',
      bio: 'وكيل شحن معتمد • شحن فوري وتحديات ألعاب 🎲',
      level: 50,
      country: '🇪🇬'
    }
  ];

  const handleShuffleRadar = () => {
    // Shuffle avatars slightly
    setRadarUsers(prev => [...prev].reverse());
  };

  const toggleFollow = (id: string) => {
    setFollowedUsers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none overflow-y-auto pb-8">
      
      {/* Top Header & Filter Pills matching Screenshot 5 */}
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

          {/* Egypt / Country Badge */}
          <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-700">
            <span>🇪🇬 مصر</span>
          </div>
        </div>
      </div>

      {/* Circular Radar Match Section matching Screenshot 5 */}
      <div className="px-3 pt-4 pb-2">
        <div className="relative w-full aspect-square max-h-[300px] mx-auto bg-gradient-to-b from-[#180829] to-[#290d40] rounded-3xl overflow-hidden shadow-md flex items-center justify-center p-4">
          
          {/* Glowing Radar Concentric Circles */}
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

          {/* 7 Orbiting Avatars matching Screenshot 5 */}
          {radarUsers.map((user) => (
            <div
              key={user.id}
              style={{ top: user.top, left: user.left }}
              className="absolute z-10 flex flex-col items-center cursor-pointer group transition-transform hover:scale-110"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#FFE600] shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border border-white" />
              </div>
              <span className="text-[10px] text-white font-bold bg-black/60 backdrop-blur-xs px-1.5 rounded-full mt-0.5 whitespace-nowrap">
                {user.name}
              </span>
            </div>
          ))}

          {/* Shuffle Button "تغيير" matching Screenshot 5 */}
          <button
            onClick={handleShuffleRadar}
            className="absolute bottom-3 right-3 z-20 bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>تغيير</span>
          </button>
        </div>
      </div>

      {/* Suggested Users Section matching Screenshot 5: "اقتراحات - بالقرب" */}
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FFE600] fill-[#FFE600]" />
            اقتراحات - بالقرب
          </h3>
          <span className="text-xs text-gray-400 font-medium">عرض المزيد</span>
        </div>

        <div className="space-y-2.5">
          {suggestedUsers.map((user) => {
            const isFollowed = followedUsers[user.id];

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
              >
                {/* User Avatar + Online Mic */}
                <div className="relative shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FFE600] border-2 border-white flex items-center justify-center text-[7px] text-black font-black">
                    🎤
                  </span>
                </div>

                {/* User Bio and Distance */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-xs text-gray-900 truncate">
                      {user.name}
                    </h4>
                    <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1 rounded font-digits">
                      Lv.{user.level}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium block">
                    {user.distance}
                  </span>
                  <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                    {user.bio}
                  </p>
                </div>

                {/* Follow Button (Bright Yellow "#FFE600") */}
                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 flex items-center gap-1 shadow-2xs ${
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
            );
          })}
        </div>
      </div>
    </div>
  );
};
