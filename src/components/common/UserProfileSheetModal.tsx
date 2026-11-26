import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  MessageCircle,
  Mic,
  Gift,
  Users,
  ShieldBan,
  Check,
  Copy,
  Share2,
  Lock
} from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';
import { AvatarWithFrame } from './AvatarWithFrame';
import { UserNameWithBadges } from './UserNameWithBadges';
import { shareContentToSocial } from '../../utils/socialShare';

interface UserProfileSheetModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onStartChat?: (uid: string) => void;
  onVoiceCall?: (target: UserProfile) => void;
}

export const UserProfileSheetModal: React.FC<UserProfileSheetModalProps> = ({
  isOpen,
  user,
  currentUser,
  onClose,
  onStartChat,
  onVoiceCall
}) => {
  const [, setTick] = useState(0);
  const [copiedUid, setCopiedUid] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = livoStore.subscribe(() => setTick((t) => t + 1));
    return () => unsub();
  }, [isOpen]);

  const liveUser = useMemo(() => {
    if (!user) return null;
    return livoStore.getUserByUid(user.uid) || user;
  }, [user, livoStore.getUsers().length]);

  if (!isOpen || !liveUser) return null;

  const isMe = currentUser?.uid === liveUser.uid;
  const liveCurrent = currentUser ? livoStore.getUserByUid(currentUser.uid) || currentUser : null;
  const isFollowing = Boolean(liveCurrent && (liveCurrent.followingUids || []).includes(liveUser.uid));
  const isMutualFriend = Boolean(liveCurrent && livoStore.areMutualFriends(liveCurrent.uid, liveUser.uid));
  const isBlocked = Boolean(liveCurrent && (liveCurrent.blockedUids || []).includes(liveUser.uid));
  const canViewDetails = livoStore.canViewUserContent(liveCurrent?.uid, liveUser, 'profile');
  const privacyMode = livoStore.resolveAccountPrivacy(liveUser);

  const followers = livoStore.getFollowersList(liveUser.uid);
  const following = livoStore.getFollowingList(liveUser.uid);
  const friends = livoStore.getFriendsList(liveUser.uid);

  const giftLogs = livoStore.getGiftLogs();
  const giftsSentCoins = giftLogs
    .filter((g) => g.senderUid === liveUser.uid)
    .reduce((sum, g) => sum + (g.coinsTotal || 0), 0);
  const giftsReceivedCoins = giftLogs
    .filter((g) => g.recipientUid === liveUser.uid)
    .reduce((sum, g) => sum + (g.coinsTotal || 0), 0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const handleCopyUid = () => {
    try {
      navigator.clipboard?.writeText(liveUser.uid);
    } catch {}
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 1800);
  };

  const handleShareProfile = async () => {
    const res = await shareContentToSocial('native', {
      title: `ملف ${liveUser.displayName} في LIVO`,
      text: `شاهد حساب ${liveUser.displayName} (UID: ${liveUser.uid}) على تطبيق LIVO 🎙️✨`,
      url: typeof window !== 'undefined' ? `${window.location.origin}/?uid=${liveUser.uid}` : undefined
    });
    showToast(res.message);
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-xs flex items-end justify-center select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#160a28] text-white w-full max-w-[430px] rounded-t-3xl border-t border-x border-purple-700/60 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {toastMsg && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#FFE600] text-black px-3.5 py-1 rounded-full text-[11px] font-black shadow-lg whitespace-nowrap">
            {toastMsg}
          </div>
        )}

        {/* Cover Banner */}
        <div
          className="h-28 relative bg-gradient-to-br from-purple-900 via-[#2a1154] to-amber-900/60 bg-cover bg-center"
          style={liveUser.coverUrl ? { backgroundImage: `url(${liveUser.coverUrl})` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#160a28] via-[#160a28]/35 to-black/30" />
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 flex items-center justify-center text-white"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleShareProfile}
                className="w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 flex items-center justify-center text-white"
                title="مشاركة الملف الشخصي"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {!isMe && liveCurrent && (
                <button
                  onClick={() => {
                    const blocked = livoStore.toggleBlockUser(liveCurrent.uid, liveUser.uid);
                    showToast(blocked ? 'تم حظر المستخدم ✓' : 'تم فك الحظر ✓');
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isBlocked ? 'bg-red-600 text-white' : 'bg-black/45 hover:bg-red-600/80 text-white'
                  }`}
                  title={isBlocked ? 'إلغاء الحظر' : 'حظر'}
                >
                  <ShieldBan className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Avatar & Basic Info */}
        <div className="px-5 pb-5 -mt-10 relative z-10 space-y-3.5 text-right">
          <div className="flex items-end justify-between gap-3">
            <div className="relative">
              <AvatarWithFrame
                sizePx={78}
                avatarUrl={liveUser.avatar}
                displayName={liveUser.displayName}
                frameUrl={livoStore.getResolvedFrameUrl(liveUser)}
                frameGlowColor={liveUser.frameGlowColor}
                frameAnimated={liveUser.frameAnimated}
                customIconUrl={liveUser.customIconUrl}
                customIconGlow={liveUser.customIconGlow}
                customIconAnimated={liveUser.customIconAnimated}
              />
              <span className="absolute -bottom-1 right-1 bg-gradient-to-r from-[#FFE600] to-amber-400 text-black text-[9px] font-black font-digits px-2 py-0.5 rounded-full border border-[#160a28] shadow">
                Lv.{liveUser.level || 0}
              </span>
            </div>

            {isMutualFriend && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                <Users className="w-3 h-3" />
                أصدقاء متبادلون
              </span>
            )}
          </div>

          <div>
            <UserNameWithBadges
              displayName={liveUser.displayName}
              nameGlowColor={liveUser.nameGlowColor}
              isVerified={liveUser.isVerified}
              verifiedBadgeColor={liveUser.verifiedBadgeColor}
              verifiedBadgeShape={liveUser.verifiedBadgeShape}
              verifiedBadgeGlow={liveUser.verifiedBadgeGlow}
              customIconUrl={liveUser.customIconUrl}
              customIconGlow={liveUser.customIconGlow}
              customIconAnimated={liveUser.customIconAnimated}
              customIconLabel={liveUser.customIconLabel}
              agencyLabel={livoStore.getAgencyDisplayLabel(liveUser)}
              badgeSize={15}
              iconSize={19}
              nameClassName="text-base font-black text-white"
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleCopyUid}
                className="text-[11px] font-digits text-purple-200 bg-purple-900/50 hover:bg-purple-800/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
              >
                <span>UID: {liveUser.uid}</span>
                {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <span className="text-[11px] text-purple-300">@{liveUser.username}</span>
            </div>
          </div>

          {/* Privacy-gated bio */}
          {canViewDetails ? (
            <p className="text-xs text-purple-200/90 leading-relaxed bg-[#1f0f38] border border-purple-800/40 rounded-2xl px-3.5 py-2.5">
              {liveUser.bio?.trim() || 'عضو مميز في مجتمع LIVO الصوتي ✨'}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3.5 py-2.5">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                {privacyMode === 'private'
                  ? 'هذا الحساب مضبوط على الوضع الخاص'
                  : 'تفاصيل هذا الحساب متاحة للأصدقاء المتبادلين فقط'}
              </span>
            </div>
          )}

          {/* Real Live Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#1e0f38] border border-purple-800/50 rounded-2xl p-2.5 text-center">
              <span className="text-sm font-black font-digits text-white block">
                {Math.max(followers.length, liveUser.followersCount || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-purple-300 font-bold">المتابعون</span>
            </div>
            <div className="bg-[#1e0f38] border border-purple-800/50 rounded-2xl p-2.5 text-center">
              <span className="text-sm font-black font-digits text-white block">
                {Math.max(following.length, liveUser.followingCount || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-purple-300 font-bold">يتابع</span>
            </div>
            <div className="bg-[#1e0f38] border border-purple-800/50 rounded-2xl p-2.5 text-center">
              <span className="text-sm font-black font-digits text-emerald-300 block">
                {friends.length.toLocaleString()}
              </span>
              <span className="text-[10px] text-purple-300 font-bold">الأصدقاء</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] text-amber-200 font-bold flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                هدايا مرسلة
              </span>
              <span className="text-xs font-black font-digits text-amber-300">
                {giftsSentCoins.toLocaleString()} 🪙
              </span>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] text-cyan-200 font-bold flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-cyan-400" />
                هدايا مستلمة
              </span>
              <span className="text-xs font-black font-digits text-cyan-300">
                {giftsReceivedCoins.toLocaleString()} 💎
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {!isMe && liveCurrent && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => {
                  const nowFollowing = livoStore.toggleFollowUser(liveCurrent.uid, liveUser.uid);
                  showToast(nowFollowing ? 'تمت المتابعة بنجاح ✓' : 'تم إلغاء المتابعة');
                }}
                className={`py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  isFollowing
                    ? 'bg-purple-900/70 border border-purple-600 text-purple-100'
                    : 'bg-[#FFE600] text-black shadow-md'
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isFollowing ? 'تتابعه' : 'متابعة'}</span>
              </button>

              {onStartChat && (
                <button
                  onClick={() => {
                    onClose();
                    onStartChat(liveUser.uid);
                  }}
                  className="py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مراسلة</span>
                </button>
              )}

              {onVoiceCall && (
                <button
                  onClick={() => {
                    onClose();
                    onVoiceCall(liveUser);
                  }}
                  className="py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <Mic className="w-4 h-4" />
                  <span>اتصال صوتي</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
