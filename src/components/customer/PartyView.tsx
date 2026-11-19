import React, { useState, useEffect, useRef } from 'react';
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
  Lock
} from 'lucide-react';
import { UserProfile, VoiceRoom } from '../../types';
import { livoStore } from '../../services/livoStore';
import { RoyalVoiceRoomModal } from './RoyalVoiceRoomModal';
import { LiveStreamView } from './LiveStreamView';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { LivoVerifiedBadge } from '../common/LivoVerifiedBadge';

interface PartyViewProps {
  currentUser: UserProfile | null;
  onOpenRecharge: () => void;
  onRequireAuth?: () => void;
}

export const PartyView: React.FC<PartyViewProps> = ({ currentUser, onOpenRecharge, onRequireAuth }) => {
  const [activeSubTab, setActiveSubTab] = useState<'follow' | 'trending' | 'party' | 'live'>('party');
  const [activeFilterPill, setActiveFilterPill] = useState<string>('recommend');
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<VoiceRoom[]>(livoStore.getRooms());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active modals
  const [selectedVoiceRoomId, setSelectedVoiceRoomId] = useState<string | null>(null);
  const [activeLiveRoomId, setActiveLiveRoomId] = useState<string | null>(null);
  const lastSelectedVoiceRoomRef = useRef<VoiceRoom | null>(null);

  // Create Room / Go Live modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomType, setNewRoomType] = useState<'voice' | 'live'>('voice');
  const [newRoomSeatCount, setNewRoomSeatCount] = useState<6 | 12>(12);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('دردشة صوتية');

  useEffect(() => {
    const unsub = livoStore.subscribe(() => {
      setRooms([...livoStore.getRooms()]);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const isOwnerUser = Boolean(
    currentUser && (currentUser?.role === 'owner' || livoStore.isOwnerEmail(currentUser?.email))
  );

  // Official Room unified with 'room-official-livo'
  const officialRoom = rooms.find(r => r.isOfficial || r.id === 'room-official-livo');
  const isOfficialOpen = officialRoom?.status === 'open';

  const handleOpenOfficialRoom = () => {
    if (!officialRoom) return;

    if (!isOfficialOpen) {
      if (isOwnerUser && currentUser) {
        livoStore.setOfficialRoomStatus('open');
        livoStore.joinRoomSeat(officialRoom.id, 0, currentUser?.uid);
        setSelectedVoiceRoomId(officialRoom.id);
        return;
      }
      showToast('🔒 الغرفة الرسمية مغلقة حالياً، تفتح عند دخول المالك أو الإدارة');
      return;
    }

    if (isOwnerUser && currentUser) {
      const alreadySeated = officialRoom.seats.some(s => s.occupiedByUid === currentUser?.uid);
      if (!alreadySeated) {
        livoStore.joinRoomSeat(officialRoom.id, 0, currentUser?.uid);
      }
    }
    setSelectedVoiceRoomId(officialRoom.id);
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
      title: newRoomTitle.trim() || (newRoomType === 'live' ? `بث ${currentUser?.displayName} المباشر` : `غرفة ${currentUser?.displayName}`),
      category: newRoomCategory,
      roomType: newRoomType,
      ownerUid: currentUser?.uid,
      seatCount: newRoomSeatCount
    });
    setShowCreateModal(false);
    setNewRoomTitle('');

    if (newRoomType === 'live') {
      setActiveLiveRoomId(created.id);
    } else {
      setSelectedVoiceRoomId(created.id);
    }
  };

  // Real open user rooms
  const openCommunityRooms = rooms.filter(r => {
    if (r.isOfficial || r.id === 'room-official-livo') return false;
    if (r.status !== 'open') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.ownerName.toLowerCase().includes(q)) return false;
    }
    if (activeSubTab === 'follow') {
      return Boolean(currentUser && (currentUser?.followingUids || []).includes(r.ownerUid));
    }
    if (activeSubTab === 'live') {
      return r.roomType === 'live';
    }
    if (activeSubTab === 'party') {
      return r.roomType !== 'live';
    }
    return true;
  });

  const foundVoiceRoom = selectedVoiceRoomId
    ? rooms.find(r => r.id === selectedVoiceRoomId) || null
    : null;
  if (foundVoiceRoom) {
    lastSelectedVoiceRoomRef.current = foundVoiceRoom;
  } else if (!selectedVoiceRoomId) {
    lastSelectedVoiceRoomRef.current = null;
  }
  const selectedVoiceRoom =
    foundVoiceRoom || (selectedVoiceRoomId ? lastSelectedVoiceRoomRef.current : null);

  const activeLiveRoom = activeLiveRoomId
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
              placeholder="ابحث عن الغرف أو البثوث المباشرة..."
              className="w-full bg-transparent outline-none text-xs text-gray-800 placeholder-gray-400"
            />
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-bold">
          {[
            { id: 'recommend', label: 'توصية' },
            { id: 'community', label: 'مجتمع' },
            { id: 'activity', label: 'ترفيه' },
            { id: 'events', label: 'فعاليات' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilterPill(pill.id)}
              className={`px-3 py-1 rounded-full transition-all shrink-0 ${
                activeFilterPill === pill.id
                  ? 'bg-[#FFE600] text-black shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-6">
        {/* Pinned Official Admin Room (only in party/trending/follow) */}
        {officialRoom && activeSubTab !== 'live' && (
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
              if (activeSubTab === 'live' || r.roomType === 'live') {
                return (
                  <div
                    key={r.id}
                    onClick={() =>
                      r.roomType === 'live' ? setActiveLiveRoomId(r.id) : setSelectedVoiceRoomId(r.id)
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
                      <div className="flex items-center gap-1.5 mb-1">
                        <img
                          src={r.ownerAvatar}
                          alt={r.ownerName}
                          className="w-5 h-5 rounded-full border border-white object-cover"
                        />
                        <span className="text-xs font-bold truncate">{r.ownerName}</span>
                      </div>
                      <p className="text-[10px] text-gray-200 line-clamp-1">{r.title}</p>
                    </div>
                  </div>
                );
              }

              const hostUser = livoStore.getUserByUid(r.ownerUid);
              const roomCap = r.seatCount === 6 ? 6 : 12;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedVoiceRoomId(r.id)}
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
                    />
                    <span className="absolute -bottom-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow z-20">
                      {r.category}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs text-gray-900 truncate mb-1">{r.title}</h4>
                    <div className="flex items-center gap-1 mb-1 truncate">
                      <p
                        className={`text-[11px] font-bold truncate ${
                          hostUser?.nameGlowColor && hostUser.nameGlowColor !== 'none'
                            ? `name-glow-${hostUser.nameGlowColor}`
                            : 'text-gray-600'
                        }`}
                      >
                        {r.ownerName}
                      </p>
                      {hostUser?.isVerified && (
                        <LivoVerifiedBadge
                          size={12}
                          color={hostUser.verifiedBadgeColor}
                          shape={hostUser.verifiedBadgeShape}
                        />
                      )}
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
                : 'لا توجد غرف مستخدمين مفتوحة حالياً'}
            </h4>
            <p className="text-[11px] text-gray-500">
              كن أول من يفتح {activeSubTab === 'live' ? 'بثاً مباشراً حقيقياً' : 'غرفة دردشة صوتية حقيقية'} الآن!
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
                  <span>دردشة صوتية (12 مايك)</span>
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
                  <option value="دردشة صوتية">دردشة صوتية</option>
                  <option value="بث مباشر">بث مباشر</option>
                  <option value="موسيقى وطرب">موسيقى وطرب</option>
                  <option value="ألعاب ومسابقات">ألعاب ومسابقات</option>
                  <option value="تعارف وأصدقاء">تعارف وأصدقاء</option>
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

      {/* Voice Room Modal */}
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

      {/* Real Video Live Stream Modal */}
      {activeLiveRoom && currentUser && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="w-full max-w-[430px] h-[100dvh]">
            <LiveStreamView
              currentUser={currentUser}
              room={activeLiveRoom}
              isHost={activeLiveRoom.ownerUid === currentUser?.uid}
              onOpenRecharge={onOpenRecharge}
              onClose={() => {
                if (activeLiveRoom.ownerUid === currentUser?.uid) {
                  livoStore.closeAndRemoveRoom(activeLiveRoom.id);
                }
                setActiveLiveRoomId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
