import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface StoriesSectionProps {
  currentUser: UserProfile;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({ currentUser }) => {
  const [activeStory, setActiveStory] = useState<{ name: string; avatar: string; image: string; text: string } | null>(null);
  const [showAddStoryInfo, setShowAddStoryInfo] = useState(false);
  const [genuineUsers, setGenuineUsers] = useState<UserProfile[]>(() => livoStore.getGenuineUsers());

  useEffect(() => {
    const unsub = livoStore.subscribe(() => {
      setGenuineUsers([...livoStore.getGenuineUsers()]);
    });
    return () => unsub();
  }, []);

  const blockedSet = new Set(currentUser.blockedUids || []);
  const realStories = genuineUsers
    .filter(u => u.uid !== currentUser.uid && !blockedSet.has(u.uid) && Boolean(u.bio))
    .slice(0, 10)
    .map(u => ({
      id: u.uid,
      name: u.displayName || u.username,
      avatar: u.avatar,
      image: u.avatar,
      text: u.bio || ''
    }));

  return (
    <>
      {/* Stories Strip */}
      <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
        {/* My Story / Status */}
        <div
          onClick={() => setShowAddStoryInfo(true)}
          className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
        >
          <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-purple-500/80 p-0.5 flex items-center justify-center bg-purple-950/40 hover:border-amber-400 transition-colors">
            <img src={currentUser.avatar} alt={currentUser.displayName} className="w-full h-full rounded-full object-cover opacity-80" />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black flex items-center justify-center text-[10px] font-black border border-black shadow">
              +
            </span>
          </div>
          <span className="text-[10px] text-purple-300 font-semibold truncate max-w-[56px] text-center">
            قصتك
          </span>
        </div>

        {/* Genuine Users' Status Items */}
        {realStories.map(story => (
          <div
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 group-hover:scale-105 transition-transform">
              <img src={story.avatar} alt={story.name} className="w-full h-full rounded-full object-cover border-2 border-[#090314]" />
            </div>
            <span className="text-[10px] text-white font-semibold truncate max-w-[56px] text-center">
              {story.name}
            </span>
          </div>
        ))}
      </div>

      {/* Add Story Info Modal */}
      {showAddStoryInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#170b2c] border border-purple-800 rounded-2xl p-5 w-full max-w-xs text-center text-white space-y-3 shadow-2xl">
            <h4 className="font-black text-sm">حالتك في LIVO</h4>
            <p className="text-xs text-purple-200 leading-relaxed">
              تظهر نبذتك التعريفية وصورتك الشخصية هنا لجميع الأصدقاء الحقيقيين في المنصة. يمكنك تحديثها من الملف الشخصي في أي وقت.
            </p>
            <button
              onClick={() => setShowAddStoryInfo(false)}
              className="w-full py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs"
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="relative w-full max-w-sm h-[580px] rounded-3xl overflow-hidden border border-purple-800 shadow-2xl flex flex-col justify-between p-4 bg-cover bg-center" style={{ backgroundImage: `url(${activeStory.image})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={activeStory.avatar} alt={activeStory.name} className="w-9 h-9 rounded-full border border-amber-400" />
                <span className="font-bold text-xs text-white">{activeStory.name}</span>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative z-10 bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-purple-800/60 text-xs text-white leading-relaxed">
              {activeStory.text}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

