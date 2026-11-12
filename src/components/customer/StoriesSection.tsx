import React, { useState } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { UserProfile } from '../../types';

interface StoriesSectionProps {
  currentUser: UserProfile;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({ currentUser }) => {
  const [activeStory, setActiveStory] = useState<{ name: string; avatar: string; image: string; text: string } | null>(null);

  const sampleStories = [
    {
      id: 'story-1',
      name: 'سارة نور',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&fit=crop',
      text: 'بث الليلة الساعة 9:00 مساءً مجهز مفاجآت وهدايا للجميع 🌟'
    },
    {
      id: 'story-2',
      name: 'أحمد شاهين',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
      text: 'تحدي PK ناري اليوم مع كبار الداعمين، لا تفوتوا الحماس 🔥'
    },
    {
      id: 'story-3',
      name: 'طارق المصري',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&fit=crop',
      text: 'شحن فوري ومعتمد لجميع أعضاء وكالة الأهرام ⚡'
    }
  ];

  return (
    <>
      {/* Stories Strip */}
      <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
        {/* Add My Story */}
        <div
          onClick={() => alert('ميزة إضافة قصة جديدة متاحة لصناع المحتوى المؤهلين')}
          className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
        >
          <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-purple-500/80 p-0.5 flex items-center justify-center bg-purple-950/40 hover:border-amber-400 transition-colors">
            <img src={currentUser.avatar} alt="Me" className="w-full h-full rounded-full object-cover opacity-80" />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black flex items-center justify-center text-[10px] font-black border border-black shadow">
              +
            </span>
          </div>
          <span className="text-[10px] text-purple-300 font-semibold truncate max-w-[56px] text-center">
            قصتك
          </span>
        </div>

        {/* Stories Items */}
        {sampleStories.map(story => (
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

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="relative w-full max-w-sm h-[580px] rounded-3xl overflow-hidden border border-purple-800 shadow-2xl flex flex-col justify-between p-4 bg-cover bg-center" style={{ backgroundImage: `url(${activeStory.image})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

            {/* Story Header */}
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

            {/* Story Text */}
            <div className="relative z-10 bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-purple-800/60 text-xs text-white leading-relaxed">
              {activeStory.text}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
