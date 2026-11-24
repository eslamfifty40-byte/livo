import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Radio,
  Volume2,
  Users,
  Video,
  Mic,
  X,
  Sparkles,
  Lock,
  MessageCircle,
  Loader2,
  Trophy
} from 'lucide-react';
import { UserProfile, VoiceRoom, SupporterRankEntry } from '../../types';
import { livoStore } from '../../services/livoStore';
import { RoyalVoiceRoomModal } from './RoyalVoiceRoomModal';
import { LiveStreamView } from './LiveStreamView';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { UserNameWithBadges } from '../common/UserNameWithBadges';

interface PartyViewProps {
  currentUser: UserProfile | null;
  onOpenRecharge: () => void;
  onRequireAuth?: () => void;
  onOpenVoiceRoom?: (roomId: string) => void;
  onOpenLiveRoom?: (roomId: string) => void;
  onStartChat?: (uid: string) => void;
}

export const PartyView: React.FC<PartyViewProps> = ({
  currentUser,
  onOpenRecharge,
  onRequireAuth,
  onOpenVoiceRoom,
  onOpenLiveRoom,
  onStartChat
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'follow' | 'trending' | 'party' | 'live'>('party');
  const [activeFilterPill, setActiveFilterPill] = useState<'recommend' | 'community' | 'activity' | 'events'>('recommend');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUid, setSearchingUid] = useState(false);
  const [remoteMatchedUsers, setRemoteMatchedUsers] = useState<UserProfile[]>([]);

  const [rooms, setRooms] = useState<VoiceRoom[]>(livoStore.getRooms());
  const [genuineUsers, setGenuineUsers] = useState<UserProfile[]>(() => livoStore.getCustomerUsers());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Local modal fallback only when parent does not lift Voice/Live room state
  const [selectedVoiceRoomId, setSelectedVoiceRoomId] = useState<string | null>(null);
  const [activeLiveRoomId, setActiveLiveRoomId] = useState<string | null>(null);
  const lastSelectedVoiceRoomRef = useRef<VoiceRoom | null>(null);

  // Create Room / Go Live modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomType, setNewRoomType] = useState<'voice' | 'live'>('voice');
  const [newRoomSeatCount, setNewRoomSeatCount] = useState<6 | 12>(12);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('دردشة صوتية');
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    const unsub = livoStore.subscribe(() => {
      setRooms([...livoStore.getRooms()]);
      setGenuineUsers([...livoStore.getCustomerUsers()]);
    });
    return () => unsub();
  }, []);

  // Firestore UID/Name lookup when searching UID 10000 - 100000+
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 4) {
      setRemoteMatchedUsers([]);
      setSearchingUid(false);
      return;
    }
    let cancelled = false;
    setSearchingUid(true);
    const t = setTimeout(async () => {
      try {
        const found = await livoStore.lookupUserInFirestore(q, { excludeOwners: true });
        if (!cancelled) setRemoteMatchedUsers(found);
      } finally {
        if (!cancelled) setSearchingUid(false);
      }
    }, 260);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openVoiceRoom = (roomId: string) => {
    if (onOpenVoiceRoom) {
      onOpenVoiceRoom(roomId);
    } else {
      setSelectedVoiceRoomId(roomId);
    }
  };

  const openLiveRoom = (roomId: string) => {
    if (onOpenLiveRoom) {
      onOpenLiveRoom(roomId);
    } else {
      setActiveLiveRoomId(roomId);
    }
  };

  const isOwnerUser = Boolean(
    currentUser && (currentUser.role === 'owner' || livoStore.isOwnerEmail(currentUser.email))
  );

  // Official Room unified with 'room-official-livo'
  const officialRoom = rooms.find(r => r.isOfficial || r.id === 'room-official-livo');
  const isOfficialOpen = officialRoom?.status === 'open';

  const handleOpenOfficialRoom = () => {
    if (!officialRoom) return;

    if (!isOfficialOpen) {
      if (isOwnerUser && currentUser) {
        livoStore.setOfficialRoomStatus('open');
        livoStore.joinRoomSeat(officialRoom.id, 0, currentUser.uid);
        openVoiceRoom(officialRoom.id);
        return;
      }
      showToast('🔒 الغرفة الرسمية مغلقة حالياً، تفتح عند دخول المالك أو الإدارة');
      return;
    }

    if (isOwnerUser && currentUser) {
      const alreadySeated = officialRoom.seats.some(s => s.occupiedByUid === currentUser.uid);
      if (!alreadySeated) {
        livoStore.joinRoomSeat(officialRoom.id, 0, currentUser.uid);
      }
    }
    openVoiceRoom(officialRoom.id);
  };

  const openCreateDialog = (type: 'voice' | 'live', category: string) => {
    if (!currentUser) {
      showToast('سجّل الدخول أولاً لفتح غرفة صوتية أو بث مباشر');
      onRequireAuth?.();
      return;
    }
    setNewRoomType(type);
    setNewRoomCategory(category);
    setShowCreateModal(true);
  };

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    const created = livoStore.createRoom({
      title: newRoomTitle.trim() || (newRoomType === 'live' ? `بث ${currentUser.displayName} المباشر` : `غرفة ${currentUser.displayName}`),
      category: newRoomCategory,
      roomType: newRoomType,
      ownerUid: currentUser.uid,
      seatCount: newRoomSeatCount
    });
    setShowCreateModal(false);
    setNewRoomTitle('');

    if (newRoomType === 'live') {
      openLiveRoom(created.id);
    } else {
      openVoiceRoom(created.id);
    }
  };

  // Matching UID / User search cards when user types in search bar
  const matchedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const map = new Map<string, UserProfile>();
    genuineUsers.forEach(u => map.set(u.uid, u));
    remoteMatchedUsers.forEach(u => map.set(u.uid, u));
    return Array.from(map.values())
      .filter(
        u =>
          u.uid !== currentUser?.uid &&
          (u.uid.toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.displayName || '').toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [searchQuery, genuineUsers, remoteMatchedUsers, currentUser?.uid]);

  // Real open user rooms with activeFilterPill (recommend / community / activity / events)
  const openCommunityRooms = useMemo(() => {
    const filtered = rooms.filter(r => {
      if (r.isOfficial || r.id === 'room-official-livo') return false;
      if (r.status !== 'open') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchRoom =
          r.title.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          (r.ownerUid || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q);
        if (!matchRoom) return false;
      }

      if (activeSubTab === 'follow') {
        if (!currentUser || !(currentUser.followingUids || []).includes(r.ownerUid)) return false;
      } else if (activeSubTab === 'live') {
        if (r.roomType !== 'live') return false;
      } else if (activeSubTab === 'party') {
        if (r.roomType === 'live') return false;
      }

      const cat = (r.category || '').toLowerCase();
      const titleLower = (r.title || '').toLowerCase();
      if (activeFilterPill === 'community') {
        return (
          cat.includes('دردشة') ||
          cat.includes('تعارف') ||
          cat.includes('مجتمع') ||
          cat.includes('بث') ||
          titleLower.includes('تعارف') ||
          titleLower.includes('مجتمع')
        );
      }
      if (activeFilterPill === 'activity') {
        return (
          cat.includes('ألعاب') ||
          cat.includes('مسابقات') ||
          cat.includes('موسيق') ||
          cat.includes('ترفيه') ||
          titleLower.includes('لعب') ||
          titleLower.includes('طرب')
        );
      }
      if (activeFilterPill === 'events') {
        return (
          Boolean(r.announcement) ||
          cat.includes('مسابقات') ||
          cat.includes('فعاليات') ||
          titleLower.includes('مسابق') ||
          titleLower.includes('فعال') ||
          titleLower.includes('بطول') ||
          titleLower.includes('حفلة')
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (activeSubTab === 'trending' || activeFilterPill === 'recommend') {
        const scoreA = (a.viewersCount || 0) + a.seats.filter(s => s.occupiedByUid).length * 3;
        const scoreB = (b.viewersCount || 0) + b.seats.filter(s => s.occupiedByUid).length * 3;
        return scoreB - scoreA;
      }
      return 0;
    });
  }, [rooms, searchQuery, activeSubTab, activeFilterPill, currentUser]);

  const foundVoiceRoom = !onOpenVoiceRoom && selectedVoiceRoomId
    ? rooms.find(r => r.id === selectedVoiceRoomId) || null
    : null;
  if (foundVoiceRoom) {
    lastSelectedVoiceRoomRef.current = foundVoiceRoom;
  } else if (!selectedVoiceRoomId) {
    lastSelectedVoiceRoomRef.current = null;
  }
  const selectedVoiceRoom =
    foundVoiceRoom || (!onOpenVoiceRoom && selectedVoiceRoomId ? lastSelectedVoiceRoomRef.current : null);

  const activeLiveRoom = !onOpenLiveRoom && activeLiveRoomId
    ? rooms.find(r => r.id === activeLiveRoomId) || null
    : null;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none relative">
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-[#FFE600] px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border border-amber-400/30 text-center max-w-[90%] animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white px-3 pt-3 pb-2 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-full px-3 py-1.5 text-xs text-gray-500">
            <Search className="w-3.5 h-3.5 text-gray-400 ml-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن غرفة أو عضو بـ UID (10000 - 100000+)..."
              className="w-full bg-transparent outline-none text-xs text-gray-800 placeholder-gray-400"
            />
            {searchingUid && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 ml-1 shrink-0" />}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-700 mr-1"
                title="مسح"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => openCreateDialog(activeSubTab === 'live' ? 'live' : 'voice', activeSubTab === 'live' ? 'بث مباشر' : 'دردشة صوتية')}
            className="h-8 px-3 rounded-full bg-[#FFE600] text-black font-black text-xs flex items-center gap-1 shadow hover:bg-yellow-400 active:scale-95 transition-all shrink-0"
            title="فتح بث مباشر أو غرفة صوتية"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>بث / غرفة</span>
          </button>
        </div>

        {/* 4 Navigation Subtabs */}
        <div className="flex items-center justify-between text-sm px-2 pt-1 font-bold">
          {(['follow', 'trending', 'party', 'live'] as const).map((tab) => {
            const label =
              tab === 'follow' ? 'متابعة' : tab === 'trending' ? 'شائع' : tab === 'party' ? 'الحفلة' : 'بث مباشر';
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`pb-1.5 transition-all relative ${
                  activeSubTab === tab ? 'text-black font-black text-base' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {label}
                {activeSubTab === tab && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-[#FFE600]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Pills: توصية | مجتمع | ترفيه | فعاليات */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-bold">
          {[
            { id: 'recommend' as const, label: 'توصية' },
            { id: 'community' as const, label: 'مجتمع' },
            { id: 'activity' as const, label: 'ترفيه' },
            { id: 'events' as const, label: 'فعاليات' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilterPill(pill.id)}
              className={`px-3 py-1 rounded-full transition-all shrink-0 ${
                activeFilterPill === pill.id
                  ? 'bg-[#FFE600] text-black shadow-sm font-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
          <button
            onClick={() => setShowLeaderboardModal(true)}
            className="px-3 py-1 rounded-full transition-all shrink-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-black font-black shadow-sm flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>كأس الداعمين</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-6">
        {/* Matched UID Users from Search */}
        {searchQuery.trim() && matchedUsers.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-3 space-y-2 shadow-xs">
            <h4 className="text-[11px] font-black text-amber-800 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              نتائج البحث عن الحسابات ({matchedUsers.length})
            </h4>
            <div className="space-y-1.5">
              {matchedUsers.map(u => {
                const userOpenRoom = rooms.find(r => r.ownerUid === u.uid && r.status === 'open');
                return (
                  <div key={u.uid} className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarWithFrame
                        sizePx={36}
                        avatarUrl={u.avatar}
                        displayName={u.displayName}
                        frameUrl={u.equippedFrameUrl}
                        frameGlowColor={u.frameGlowColor}
                        frameAnimated={u.frameAnimated}
                      />
                      <div className="min-w-0">
                        <UserNameWithBadges
                          displayName={u.displayName}
                          nameGlowColor={u.nameGlowColor}
                          isVerified={u.isVerified}
                          verifiedBadgeColor={u.verifiedBadgeColor}
                          verifiedBadgeShape={u.verifiedBadgeShape}
                          verifiedBadgeGlow={u.verifiedBadgeGlow}
                          customIconUrl={u.customIconUrl}
                          customIconGlow={u.customIconGlow}
                          customIconAnimated={u.customIconAnimated}
                          agencyLabel={livoStore.getAgencyDisplayLabel(u)}
                          agencyLabelBelow={true}
                          badgeSize={12}
                          iconSize={15}
                          nameClassName="text-xs font-extrabold text-gray-900"
                        />
                        <span className="text-[10px] text-gray-500 font-digits block">UID: {u.uid}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {userOpenRoom && (
                        <button
                          onClick={() =>
                            userOpenRoom.roomType === 'live'
                              ? openLiveRoom(userOpenRoom.id)
                              : openVoiceRoom(userOpenRoom.id)
                          }
                          className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black"
                        >
                          دخول الغرفة
                        </button>
                      )}
                      {onStartChat && (
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              onRequireAuth?.();
                              return;
                            }
                            onStartChat(u.uid);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#FFE600] text-black text-[10px] font-black flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          مراسلة
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pinned Official Admin Room (only in party/trending/follow and recommend/community/events) */}
        {officialRoom && activeSubTab !== 'live' && activeFilterPill !== 'activity' && (
          <div
            onClick={handleOpenOfficialRoom}
            className={`rounded-2xl border-2 p-3 flex items-center justify-between gap-3 shadow-sm transition-all cursor-pointer relative overflow-hidden ${
              isOfficialOpen
                ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-white border-amber-400 hover:shadow-md'
                : 'bg-gray-100/90 border-gray-300'
            }`}
          >
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-black text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl shadow-xs">
              👑 الغرفة الرسمية
            </div>

            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 mt-1 border border-amber-300 bg-black">
              <img
                src="/assets/livo/customer_icon.jpg"
                alt={officialRoom.title}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute bottom-1 right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                  isOfficialOpen ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-200'
                }`}
              >
                {isOfficialOpen ? 'مفتوحة' : 'مغلقة'}
              </span>
            </div>

            <div className="flex-1 min-w-0 mt-1">
              <h4 className="font-black text-xs text-gray-900 truncate mb-1">{officialRoom.title}</h4>
              <p className="text-[11px] text-gray-600 font-bold truncate">{officialRoom.ownerName}</p>
              <div className="text-[10px] font-bold mt-1">
                {isOfficialOpen ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    مفتوحة الآن — اضغط للانضمام
                  </span>
                ) : (
                  <span className="text-gray-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {isOwnerUser ? 'اضغط لفتح الغرفة الرسمية كمالك' : 'مغلقة حالياً'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end justify-center shrink-0">
              <span
                className={`text-[11px] font-black px-3.5 py-1.5 rounded-full shadow-xs ${
                  isOfficialOpen || isOwnerUser
                    ? 'bg-[#FFE600] text-black'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isOfficialOpen ? 'دخول' : isOwnerUser ? 'فتح ودخول' : 'مغلقة'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Go Live & Voice Room Launch Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => openCreateDialog('live', 'بث مباشر')}
            className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl p-3 flex items-center justify-between shadow-sm hover:opacity-95 active:scale-[0.98] transition-all text-right"
          >
            <div>
              <span className="text-xs font-black block">ابدأ بث مباشر</span>
              <span className="text-[10px] text-pink-100">كاميرا + مايك حقيقي</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => openCreateDialog('voice', 'دردشة صوتية')}
            className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white rounded-2xl p-3 flex items-center justify-between shadow-sm hover:opacity-95 active:scale-[0.98] transition-all text-right"
          >
            <div>
              <span className="text-xs font-black block">غرفة دردشة صوتية</span>
              <span className="text-[10px] text-purple-200">6 أو 12 مقعد مايك</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Real Active Rooms & Streams List */}
        {openCommunityRooms.length > 0 ? (
          <div className={activeSubTab === 'live' ? 'grid grid-cols-2 gap-2.5' : 'space-y-2.5'}>
            {openCommunityRooms.map((r) => {
              const occupiedCount = r.seats.filter(s => s.occupiedByUid).length;
              const hostUser = livoStore.getUserByUid(r.ownerUid);
              if (activeSubTab === 'live' || r.roomType === 'live') {
                return (
                  <div
                    key={r.id}
                    onClick={() =>
                      r.roomType === 'live' ? openLiveRoom(r.id) : openVoiceRoom(r.id)
                    }
                    className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-gray-900 shadow-xs cursor-pointer group"
                  >
                    <img
                      src={r.coverImage || r.ownerAvatar}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                      <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        LIVE
                      </span>
                      <div className="bg-black/55 backdrop-blur-xs px-2 py-0.5 rounded-full font-digits font-bold flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#FFE600]" />
                        <span>{r.viewersCount || occupiedCount || 1}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <div className="flex items-center gap-1.5 mb-1 min-w-0">
                        <img
                          src={hostUser?.avatar || r.ownerAvatar}
                          alt={r.ownerName}
                          className="w-5 h-5 rounded-full border border-white object-cover shrink-0"
                        />
                        <UserNameWithBadges
                          displayName={hostUser?.displayName || r.ownerName}
                          nameGlowColor={hostUser?.nameGlowColor}
                          isVerified={hostUser?.isVerified}
                          verifiedBadgeColor={hostUser?.verifiedBadgeColor}
                          verifiedBadgeShape={hostUser?.verifiedBadgeShape}
                          verifiedBadgeGlow={hostUser?.verifiedBadgeGlow}
                          customIconUrl={hostUser?.customIconUrl}
                          customIconGlow={hostUser?.customIconGlow}
                          customIconAnimated={hostUser?.customIconAnimated}
                          customIconLabel={hostUser?.customIconLabel}
                          badgeSize={12}
                          iconSize={15}
                          nameClassName="text-xs font-bold text-white"
                        />
                      </div>
                      <p className="text-[10px] text-gray-200 line-clamp-1">{r.title}</p>
                    </div>
                  </div>
                );
              }

              const roomCap = r.seatCount === 6 ? 6 : 12;

              return (
                <div
                  key={r.id}
                  onClick={() => openVoiceRoom(r.id)}
                  className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <AvatarWithFrame
                      sizePx={62}
                      avatarUrl={hostUser?.avatar || r.ownerAvatar}
                      displayName={r.ownerName}
                      frameUrl={hostUser?.equippedFrameUrl}
                      frameGlowColor={hostUser?.frameGlowColor}
                      frameAnimated={hostUser?.frameAnimated}
                      customIconUrl={hostUser?.customIconUrl}
                      customIconGlow={hostUser?.customIconGlow}
                      customIconAnimated={hostUser?.customIconAnimated}
                    />
                    <span className="absolute -bottom-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow z-20">
                      {r.category}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs text-gray-900 truncate mb-1">{r.title}</h4>
                    <div className="flex items-center gap-1 mb-1 min-w-0">
                      <UserNameWithBadges
                        displayName={hostUser?.displayName || r.ownerName}
                        nameGlowColor={hostUser?.nameGlowColor}
                        isVerified={hostUser?.isVerified}
                        verifiedBadgeColor={hostUser?.verifiedBadgeColor}
                        verifiedBadgeShape={hostUser?.verifiedBadgeShape}
                        verifiedBadgeGlow={hostUser?.verifiedBadgeGlow}
                        customIconUrl={hostUser?.customIconUrl}
                        customIconGlow={hostUser?.customIconGlow}
                        customIconAnimated={hostUser?.customIconAnimated}
                        customIconLabel={hostUser?.customIconLabel}
                        badgeSize={13}
                        iconSize={16}
                        nameClassName="text-[11px] font-bold text-gray-600"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{occupiedCount} / {roomCap} على المايك</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <div className="flex items-center gap-1 text-gray-500 font-digits font-extrabold text-xs">
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>{r.viewersCount || occupiedCount || 1}</span>
                    </div>
                    <span className="bg-[#FFE600] text-black font-black text-[11px] px-3 py-1 rounded-full shadow-xs">
                      دخول
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center space-y-2 shadow-xs">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="font-black text-xs text-gray-900">
              {activeSubTab === 'live'
                ? 'لا يوجد بث مباشر نشط حالياً'
                : activeSubTab === 'follow'
                ? 'لا توجد غرف نشطة لمن تتابعهم حالياً'
                : activeFilterPill !== 'recommend'
                ? 'لا توجد غرف مفتوحة في هذا التصنيف حالياً'
                : 'لا توجد غرف مستخدمين مفتوحة حالياً'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {activeFilterPill !== 'recommend'
                ? 'جرّب اختيار تصنيف "توصية" أو افتح غرفتك الخاصة في هذا التصنيف الآن!'
                : `كن أول من يفتح ${activeSubTab === 'live' ? 'بثاً مباشراً حقيقياً' : 'غرفة دردشة صوتية حقيقية'} الآن!`}
            </p>
          </div>
        )}
      </div>

      {/* Create Voice Room / Go Live Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[420px] rounded-t-3xl md:rounded-3xl p-5 text-gray-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-sm text-gray-900">بدء بث أو غرفة صوتية جديدة</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-3 text-right">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewRoomType('voice')}
                  className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all ${
                    newRoomType === 'voice'
                      ? 'bg-[#FFE600] border-amber-400 text-black'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span>دردشة صوتية (6 / 12)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewRoomType('live')}
                  className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all ${
                    newRoomType === 'live'
                      ? 'bg-rose-600 border-rose-700 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span>بث مباشر (فيديو وصوت)</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">عنوان الغرفة / البث</label>
                <input
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder={newRoomType === 'live' ? 'مثال: بث مباشر مع المتابعين 🔥' : 'مثال: جلسة دردشة وتعارف ☕'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-400"
                  required
                />
              </div>

              {newRoomType === 'voice' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">عدد المقاعد الصوتية</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[6, 12].map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setNewRoomSeatCount(sc as 6 | 12)}
                        className={`py-2 rounded-xl border text-xs font-black transition-all ${
                          newRoomSeatCount === sc
                            ? 'bg-[#FFE600] border-amber-400 text-black'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {sc} مقاعد
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">التصنيف</label>
                <select
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs outline-none"
                >
                  <option value="دردشة صوتية">دردشة صوتية (مجتمع)</option>
                  <option value="تعارف وأصدقاء">تعارف وأصدقاء (مجتمع)</option>
                  <option value="موسيقى وطرب">موسيقى وطرب (ترفيه)</option>
                  <option value="ألعاب ومسابقات">ألعاب ومسابقات (ترفيه / فعاليات)</option>
                  <option value="فعاليات">فعاليات ومسابقات كبرى</option>
                  <option value="بث مباشر">بث مباشر</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs shadow-md transition-all"
              >
                {newRoomType === 'live' ? 'تشغيل الكاميرا والبدء الآن 🔴' : 'إنشاء الغرفة والجلوس على المقعد 1 🎙️'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fallback Voice Room Modal when parent does not manage PiP */}
      {selectedVoiceRoom && (
        <RoyalVoiceRoomModal
          room={selectedVoiceRoom}
          currentUser={currentUser}
          isOpen={true}
          onClose={() => setSelectedVoiceRoomId(null)}
          onOpenRecharge={onOpenRecharge}
          onRequireAuth={onRequireAuth}
          onAdminLeaveRoom={() => {
            livoStore.closeAndRemoveRoom(selectedVoiceRoom.id);
            setSelectedVoiceRoomId(null);
          }}
        />
      )}

      {/* Fallback Video Live Stream Modal when parent does not manage PiP */}
      {activeLiveRoom && currentUser && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="w-full max-w-[430px] h-[100dvh]">
            <LiveStreamView
              currentUser={currentUser}
              room={activeLiveRoom}
              isHost={activeLiveRoom.ownerUid === currentUser.uid}
              onOpenRecharge={onOpenRecharge}
              onClose={() => {
                if (activeLiveRoom.ownerUid === currentUser.uid) {
                  livoStore.closeAndRemoveRoom(activeLiveRoom.id);
                }
                setActiveLiveRoomId(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal: Supporters Leaderboard Cup (يومي / أسبوعي / شهري) */}
      {showLeaderboardModal && (() => {
        const ranks: SupporterRankEntry[] = livoStore.getSupporterLeaderboard(leaderboardPeriod);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[82dvh] text-gray-900">
              <div className="bg-gradient-to-l from-[#170b2c] via-[#2b1055] to-[#170b2c] text-white px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-[#FFE600] text-black flex items-center justify-center shadow">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">🏆 كأس الداعمين الملكي</h3>
                    <p className="text-[10px] text-amber-200">ترتيب أعلى داعمي الهدايا الحقيقيين في LIVO</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLeaderboardModal(false)}
                  className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 p-3 bg-gray-50 border-b border-gray-100">
                {([
                  { id: 'daily', label: 'اليوم' },
                  { id: 'weekly', label: 'الأسبوع' },
                  { id: 'monthly', label: 'الشهر' }
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLeaderboardPeriod(tab.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                      leaderboardPeriod === tab.id
                        ? 'bg-[#FFE600] text-black shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {ranks.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Trophy className="w-10 h-10 text-amber-300 mx-auto" />
                    <p className="text-xs font-bold text-gray-500">لا توجد عمليات دعم مسجلة في هذه الفترة بعد</p>
                    <p className="text-[10px] text-gray-400">أرسل هدية داخل أي غرفة صوتية لتتصدر كأس الداعمين!</p>
                  </div>
                ) : (
                  ranks.map((entry, idx) => (
                    <div
                      key={entry.uid}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl border ${
                        idx === 0
                          ? 'bg-amber-50 border-amber-300 shadow-xs'
                          : idx === 1
                          ? 'bg-slate-50 border-slate-300'
                          : idx === 2
                          ? 'bg-orange-50/70 border-orange-200'
                          : 'bg-white border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 text-center font-black font-digits text-sm shrink-0">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                        </span>
                        <AvatarWithFrame
                          avatarUrl={entry.avatar}
                          displayName={entry.displayName}
                          sizePx={40}
                        />
                        <div className="min-w-0">
                          <UserNameWithBadges
                            displayName={entry.displayName}
                            isVerified={entry.isVerified}
                            verifiedBadgeColor={entry.verifiedBadgeColor}
                            agencyLabel={entry.agencyBadgeLabel}
                            agencyLabelBelow={true}
                            badgeSize={12}
                            nameClassName="text-xs font-extrabold text-gray-900"
                          />
                          <span className="text-[10px] text-gray-400 font-digits block">
                            UID: {entry.uid} • {entry.giftsCount} هدية
                          </span>
                        </div>
                      </div>
                      <div className="text-left shrink-0 bg-[#FFE600]/25 border border-amber-300 px-2.5 py-1 rounded-xl">
                        <span className="text-xs font-black font-digits text-amber-800 block">
                          {entry.totalCoins.toLocaleString()} 🪙
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

