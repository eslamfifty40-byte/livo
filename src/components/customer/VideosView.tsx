import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Trash2,
  Video,
  X,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, VideoPost } from '../../types';
import { livoStore } from '../../services/livoStore';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { UserNameWithBadges } from '../common/UserNameWithBadges';

interface VideosViewProps {
  currentUser: UserProfile;
}

export const VideosView: React.FC<VideosViewProps> = ({ currentUser }) => {
  const [videos, setVideos] = useState<VideoPost[]>(() => livoStore.getVideos());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(new Set());
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setVideos([...livoStore.getVideos()]);
    const unsub = livoStore.subscribe(sync);
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const handleToggleLike = (id: string) => {
    if (!likedVideoIds.has(id)) {
      livoStore.likeVideo(id);
      setLikedVideoIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!caption.trim()) {
      setUploadError('يرجى كتابة وصف للفيديو');
      return;
    }
    if (!videoUrl.trim()) {
      setUploadError('يرجى إدخال رابط فيديو مباشر (.mp4) أو اختيار ملف فيديو');
      return;
    }

    livoStore.uploadVideo({
      authorUid: currentUser.uid,
      caption: caption.trim(),
      videoUrl: videoUrl.trim()
    });

    setCaption('');
    setVideoUrl('');
    setShowUploadModal(false);
    showToast('تم نشر المقطع في ساحة LIVO بنجاح ✓');
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 680 * 1024) {
      setUploadError('حجم ملف الفيديو كبير للحفظ المباشر! يرجى اختيار مقطع أصغر من 680 كيلوبايت أو لصق رابط الفيديو (.mp4)');
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setVideoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex flex-col h-[620px] bg-[#090314] rounded-2xl border border-purple-900/50 overflow-hidden text-white shadow-2xl">
      {toastMsg && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{toastMsg}</span>
        </div>
      )}

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
            const authorUser = livoStore.getUserByUid(video.authorUid);

            return (
              <div
                key={video.id}
                className="bg-[#150a28] rounded-2xl border border-purple-800/40 overflow-hidden shadow-lg"
              >
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarWithFrame
                      sizePx={40}
                      avatarUrl={authorUser?.avatar || video.authorAvatar}
                      displayName={authorUser?.displayName || video.authorName}
                      frameUrl={authorUser?.equippedFrameUrl}
                      frameGlowColor={authorUser?.frameGlowColor}
                      frameAnimated={authorUser?.frameAnimated}
                      customIconUrl={authorUser?.customIconUrl}
                      customIconGlow={authorUser?.customIconGlow}
                      customIconAnimated={authorUser?.customIconAnimated}
                    />
                    <div className="min-w-0">
                      <UserNameWithBadges
                        displayName={authorUser?.displayName || video.authorName}
                        nameGlowColor={authorUser?.nameGlowColor}
                        isVerified={authorUser?.isVerified ?? video.isVerified}
                        verifiedBadgeColor={authorUser?.verifiedBadgeColor}
                        verifiedBadgeShape={authorUser?.verifiedBadgeShape}
                        verifiedBadgeGlow={authorUser?.verifiedBadgeGlow}
                        customIconUrl={authorUser?.customIconUrl}
                        customIconGlow={authorUser?.customIconGlow}
                        customIconAnimated={authorUser?.customIconAnimated}
                        customIconLabel={authorUser?.customIconLabel}
                        badgeSize={14}
                        iconSize={18}
                        nameClassName="text-xs font-bold text-white"
                      />
                      <span className="text-[10px] text-purple-400 font-digits block">
                        UID: {video.authorUid} • {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => setDeleteTargetId(video.id)}
                      className="text-purple-400 hover:text-red-400 p-1 rounded-lg"
                      title="حذف المقطع"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="relative bg-black w-full h-72 flex items-center justify-center">
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>

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
                      <span className="font-digits">{video.likesCount}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-digits">{video.commentsCount}</span>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(video.videoUrl);
                        showToast('تم نسخ رابط المقطع ✓');
                      }}
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

      {/* Delete Confirm Modal */}
      {deleteTargetId && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#170b2c] border border-purple-800 rounded-2xl p-5 w-full max-w-xs text-center space-y-3">
            <h3 className="font-black text-sm text-white">تأكيد حذف الفيديو</h3>
            <p className="text-xs text-purple-200">هل أنت متأكد من رغبتك في حذف هذا المقطع نهائياً؟</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="py-2 rounded-xl bg-purple-900/60 text-purple-200 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  livoStore.deleteVideo(deleteTargetId, currentUser.uid);
                  setDeleteTargetId(null);
                  showToast('تم حذف الفيديو');
                }}
                className="py-2 rounded-xl bg-red-600 text-white text-xs font-black"
              >
                حذف الآن
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label className="block text-xs text-purple-200 mb-1">رابط الفيديو المباشر (.mp4) أو اختر ملفاً:</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none font-digits mb-2"
                />
                <label className="block text-center py-2 rounded-xl border border-dashed border-purple-600 text-[11px] text-purple-300 hover:border-amber-400 cursor-pointer">
                  <input type="file" accept="video/*" onChange={handleVideoFileSelect} className="hidden" />
                  اختيار ملف فيديو من الجهاز
                </label>
              </div>

              {uploadError && (
                <p className="text-xs text-red-400 font-bold">{uploadError}</p>
              )}

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

