import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Trash2,
  Upload,
  Check,
  Video,
  X
} from 'lucide-react';
import { UserProfile, VideoPost } from '../../types';
import { livoStore } from '../../services/livoStore';

interface VideosViewProps {
  currentUser: UserProfile;
}

export const VideosView: React.FC<VideosViewProps> = ({ currentUser }) => {
  const videos = livoStore.getVideos();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(new Set());

  const handleToggleLike = (id: string) => {
    setLikedVideoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      alert('يرجى كتابة وصف للفيديو');
      return;
    }

    const defaultSampleVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
    ];
    const finalUrl = videoUrl.trim() || defaultSampleVideos[Math.floor(Math.random() * defaultSampleVideos.length)];

    livoStore.uploadVideo({
      authorUid: currentUser.uid,
      caption: caption.trim(),
      videoUrl: finalUrl
    });

    setCaption('');
    setVideoUrl('');
    setShowUploadModal(false);
  };

  const handleDelete = (videoId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
      livoStore.deleteVideo(videoId, currentUser.uid);
    }
  };

  return (
    <div className="relative flex flex-col h-[620px] bg-[#090314] rounded-2xl border border-purple-900/50 overflow-hidden text-white shadow-2xl">
      {/* Top Header */}
      <div className="p-3 border-b border-purple-800/40 flex items-center justify-between bg-[#170b2c]/80 backdrop-blur-md">
        <div>
          <h2 className="font-extrabold text-sm text-white">مقاطع الفيديو الحقيقية</h2>
          <p className="text-[11px] text-purple-300">محتوى أصلي من صناع مجتمع LIVO فقط</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>نشر مقطع</span>
        </button>
      </div>

      {/* Videos Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {videos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-purple-400 text-xs">
            <Video className="w-10 h-10 mb-2 text-purple-500" />
            <p>لا توجد مقاطع منشورة حالياً</p>
            <p className="text-[11px] text-purple-500 mt-1">كن أول من ينشر مقطع فيديو حقيقي في المنصة!</p>
          </div>
        ) : (
          videos.map(video => {
            const isLiked = likedVideoIds.has(video.id);
            const canDelete = currentUser.role === 'owner' || video.authorUid === currentUser.uid;

            return (
              <div
                key={video.id}
                className="bg-[#150a28] rounded-2xl border border-purple-800/40 overflow-hidden shadow-lg"
              >
                {/* Author Info */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={video.authorAvatar}
                        alt={video.authorName}
                        className="w-9 h-9 rounded-full object-cover border border-purple-500"
                      />
                      {video.isVerified && (
                        <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-3 h-3 flex items-center justify-center text-[7px] text-white">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{video.authorName}</span>
                      <span className="text-[10px] text-purple-400 font-digits">
                        UID: {video.authorUid} • {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="text-purple-400 hover:text-red-400 p-1 rounded-lg"
                      title="حذف المقطع"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Video Player */}
                <div className="relative bg-black w-full h-72 flex items-center justify-center">
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>

                {/* Caption & Interaction */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-purple-100 leading-relaxed">
                    {video.caption}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-purple-900/40 text-purple-300 text-xs">
                    <button
                      onClick={() => handleToggleLike(video.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isLiked ? 'text-red-400 font-bold' : 'hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-digits">{video.likesCount + (isLiked ? 1 : 0)}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-digits">{video.commentsCount}</span>
                    </div>

                    <button
                      onClick={() => alert('تم نسخ رابط الفيديو')}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>مشاركة</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#170b2c] w-full max-w-sm rounded-2xl border border-purple-800 p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
              <h3 className="font-bold text-sm text-white">نشر مقطع فيديو جديد</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-purple-200 mb-1">وصف الفيديو:</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="اكتب وصفاً أو شارك أفكارك مع المجتمع..."
                  rows={3}
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white placeholder-purple-400/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-purple-200 mb-1">رابط الفيديو (اختياري، يترك فارغاً لاستخدام العينة):</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none font-digits"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                تأكيد النشر
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
