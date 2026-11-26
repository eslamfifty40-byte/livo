import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Compass, Mic, Music, MapPin, Check, Plus, Sparkles, MessageCircle, Users, Search, Navigation, Loader2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';
import { UserNameWithBadges } from '../common/UserNameWithBadges';
import { AvatarWithFrame } from '../common/AvatarWithFrame';

interface DiscoverViewProps {
  currentUser: UserProfile | null;
  onStartChat?: (uid: string) => void;
  onRequireAuth?: () => void;
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

export const DiscoverView: React.FC<DiscoverViewProps> = ({ currentUser, onStartChat, onRequireAuth }) => {
  const [activeCategory, setActiveCategory] = useState<'party' | 'sing' | 'popular' | 'nearby'>('party');
  const [genuineUsers, setGenuineUsers] = useState<UserProfile[]>(() => livoStore.getCustomerUsers());
  const [rooms, setRooms] = useState(() => livoStore.getRooms());
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // UID (10000 - 100000+) & Name Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUid, setSearchingUid] = useState(false);
  const [remoteMatchedUsers, setRemoteMatchedUsers] = useState<UserProfile[]>([]);

  // Nearby Geolocation
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setGenuineUsers([...livoStore.getCustomerUsers()]);
      setRooms([...livoStore.getRooms()]);
    };
    const unsub = livoStore.subscribe(sync);
    return () => unsub();
  }, []);

  // Firestore UID/Name lookup when typing 4+ chars (covers 10000 - 100000+ UIDs)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 4) {
      setRemoteMatchedUsers([]);
      setSearchingUid(false);
      return;
    }
    let cancelled = false;
    setSearchingUid(true);
    const timer = setTimeout(async () => {
      try {
        const found = await livoStore.lookupUserInFirestore(q, { excludeOwners: true });
        if (!cancelled) {
          setRemoteMatchedUsers(found);
        }
      } finally {
        if (!cancelled) setSearchingUid(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const requestMyLocation = () => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (!navigator.geolocation) {
      setLocError('المتصفح الحالي لا يدعم خدمة تحديد الموقع الجغرافي');
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await livoStore.updateUserLocation(
          currentUser.uid,
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          true
        );
        setLocLoading(false);
      },
      () => {
        setLocError('يرجى السماح بصلاحية الموقع لعرض الأعضاء القريبين منك');
        setLocLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSelectCategory = (cat: 'party' | 'sing' | 'popular' | 'nearby') => {
    setActiveCategory(cat);
    if (cat === 'nearby' && currentUser && !currentUser.locationEnabled) {
      requestMyLocation();
    }
  };

  const blockedSet = new Set(currentUser?.blockedUids || []);
  const followingSet = new Set(currentUser?.followingUids || []);

  const openRooms = useMemo(
    () => rooms.filter(r => r.status === 'open'),
    [rooms]
  );
  const openRoomOwnerUids = useMemo(
    () => new Set(openRooms.map(r => r.ownerUid)),
    [openRooms]
  );
  const musicRoomOwnerUids = useMemo(
    () => new Set(openRooms.filter(r => (r.category || '').includes('موسيق') || (r.title || '').includes('طرب') || (r.title || '').includes('غناء')).map(r => r.ownerUid)),
    [openRooms]
  );

  const mergedUsers = useMemo(() => {
    const map = new Map<string, UserProfile>();
    genuineUsers.forEach(u => map.set(u.uid, u));
    remoteMatchedUsers.forEach(u => map.set(u.uid, u));
    return Array.from(map.values());
  }, [genuineUsers, remoteMatchedUsers]);

  const candidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = mergedUsers.filter((u) => {
      if (u.uid === currentUser?.uid || blockedSet.has(u.uid)) return false;
      const priv = livoStore.resolveAccountPrivacy(u);
      if (priv === 'private') {
        const isExactUidSearch = Boolean(q && u.uid.toLowerCase() === q);
        if (!isExactUidSearch && !livoStore.canViewUserContent(currentUser?.uid, u, 'profile')) {
          return false;
        }
      }
      return true;
    });

    const searched = q
      ? base.filter(
          u =>
            u.uid.toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.displayName || '').toLowerCase().includes(q)
        )
      : base;

    const sorted = [...searched].sort((a, b) => {
      if (activeCategory === 'nearby') {
        const da = currentUser ? livoStore.getUserDistanceKm(currentUser, a) : null;
        const db = currentUser ? livoStore.getUserDistanceKm(currentUser, b) : null;
        if (da !== null && db !== null) return da - db;
        if (da !== null) return -1;
        if (db !== null) return 1;
        return (b.level || 0) - (a.level || 0);
      }
      if (activeCategory === 'popular') {
        const scoreA = (a.followersCount || 0) * 10 + (a.level || 0) * 5 + (a.isVerified ? 50 : 0);
        const scoreB = (b.followersCount || 0) * 10 + (b.level || 0) * 5 + (b.isVerified ? 50 : 0);
        return scoreB - scoreA;
      }
      if (activeCategory === 'sing') {
        const aMusic = musicRoomOwnerUids.has(a.uid) ? 2 : openRoomOwnerUids.has(a.uid) ? 1 : 0;
        const bMusic = musicRoomOwnerUids.has(b.uid) ? 2 : openRoomOwnerUids.has(b.uid) ? 1 : 0;
        if (bMusic !== aMusic) return bMusic - aMusic;
        return (b.level || 0) - (a.level || 0);
      }
      // 'party' default: active open room owners first, then verified/level
      const aHost = openRoomOwnerUids.has(a.uid) ? 1 : 0;
      const bHost = openRoomOwnerUids.has(b.uid) ? 1 : 0;
      if (bHost !== aHost) return bHost - aHost;
      return (b.followersCount || 0) - (a.followersCount || 0);
    });

    return sorted;
  }, [mergedUsers, currentUser, searchQuery, activeCategory, musicRoomOwnerUids, openRoomOwnerUids]);

  // Rotate real users across the 7 radar orbit positions when user taps "تغيير"
  const rotatedCandidates = candidates.length > 0
    ? [...candidates.slice(shuffleOffset % candidates.length), ...candidates.slice(0, shuffleOffset % candidates.length)]
    : [];

  const radarUsers = rotatedCandidates.slice(0, ORBIT_SLOTS.length).map((user, idx) => ({
    user,
    ...ORBIT_SLOTS[idx]
  }));

  const suggestedUsers = showAll ? candidates : candidates.slice(0, 20);

  const handleShuffleRadar = () => {
    if (candidates.length > 1) {
      setShuffleOffset(prev => (prev + 1) % candidates.length);
    }
  };

  const handleToggleFollow = (targetUid: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    livoStore.toggleFollowUser(currentUser?.uid, targetUid);
  };

  const handleOpenUserChat = (targetUid: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    onStartChat?.(targetUid);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none overflow-y-auto pb-8">
      
      {/* Top Header, Search (UID 10000-100000+) & Filter Pills */}
      <div className="bg-white px-3 pt-3 pb-2.5 border-b border-gray-100 shadow-2xs sticky top-0 z-10 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-full px-3 py-1.5 text-xs text-gray-500">
            <Search className="w-3.5 h-3.5 text-gray-400 ml-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالـ UID (10000 - 100000+) أو الاسم..."
              className="w-full bg-transparent outline-none text-xs text-gray-800 placeholder-gray-400"
            />
            {searchingUid && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-gray-700 shrink-0">
            <span>🇪🇬 {currentUser?.country || 'مصر'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-bold text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleSelectCategory('party')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 shrink-0 ${
              activeCategory === 'party'
                ? 'bg-[#FFE600] text-black font-extrabold shadow-2xs'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            حفلة
          </button>

          <button
            onClick={() => handleSelectCategory('sing')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 shrink-0 ${
              activeCategory === 'sing'
                ? 'bg-[#FFE600] text-black font-extrabold shadow-2xs'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            غناء
          </button>

          <button
            onClick={() => handleSelectCategory('popular')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 shrink-0 ${
              activeCategory === 'popular'
                ? 'bg-[#FFE600] text-black font-extrabold shadow-2xs'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            الشائع
          </button>

          <button
            onClick={() => handleSelectCategory('nearby')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 shrink-0 ${
              activeCategory === 'nearby'
                ? 'bg-[#FFE600] text-black font-extrabold shadow-2xs'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            القريبون مني
          </button>
        </div>
      </div>

      {/* Geolocation Bar for Nearby Mode */}
      {activeCategory === 'nearby' && (
        <div className="px-3 pt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="text-right min-w-0">
              <p className="text-xs font-black text-amber-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {currentUser?.locationEnabled ? 'موقعك مفعّل للبحث عن القريبين' : 'تحديد القريبين بالموقع الجغرافي الحقيقي'}
              </p>
              {locError && <p className="text-[10px] text-red-600 font-bold mt-0.5">{locError}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={requestMyLocation}
                disabled={locLoading}
                className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-[11px] px-3 py-1.5 rounded-full shadow-2xs flex items-center gap-1"
              >
                {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                <span>{currentUser?.locationEnabled ? 'تحديث الموقع' : 'تفعيل الآن'}</span>
              </button>
              {currentUser?.locationEnabled && (
                <button
                  onClick={() => livoStore.updateUserLocation(currentUser.uid, null, false)}
                  className="bg-white border border-gray-200 text-gray-600 font-bold text-[10px] px-2.5 py-1.5 rounded-full"
                >
                  إيقاف
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Circular Radar Match Section */}
      {!searchQuery.trim() && (
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
                  onClick={() => handleOpenUserChat(user.uid)}
                  style={{ top, left }}
                  className="absolute z-10 flex flex-col items-center cursor-pointer group transition-transform hover:scale-110"
                >
                  <AvatarWithFrame
                    sizePx={42}
                    avatarUrl={user.avatar}
                    displayName={user.displayName}
                    frameUrl={user.equippedFrameUrl}
                    frameGlowColor={user.frameGlowColor}
                    frameAnimated={user.frameAnimated}
                    customIconUrl={user.customIconUrl}
                    customIconGlow={user.customIconGlow}
                    customIconAnimated={user.customIconAnimated}
                    showOnlineDot
                  />
                  <div className="bg-black/60 backdrop-blur-xs px-1.5 rounded-full mt-0.5 max-w-[92px]">
                    <UserNameWithBadges
                      displayName={user.displayName}
                      nameGlowColor={user.nameGlowColor}
                      isVerified={user.isVerified}
                      verifiedBadgeColor={user.verifiedBadgeColor}
                      verifiedBadgeShape={user.verifiedBadgeShape}
                      verifiedBadgeGlow={user.verifiedBadgeGlow}
                      customIconUrl={user.customIconUrl}
                      customIconGlow={user.customIconGlow}
                      customIconAnimated={user.customIconAnimated}
                      customIconLabel={user.customIconLabel}
                      badgeSize={10}
                      iconSize={13}
                      nameClassName="text-[10px] text-white font-bold"
                    />
                  </div>
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
      )}

      {/* Suggested Real Community Users */}
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FFE600] fill-[#FFE600]" />
            {searchQuery.trim()
              ? `نتائج البحث (${candidates.length})`
              : `أعضاء مجتمع LIVO المسجلون (${candidates.length})`}
          </h3>
          {candidates.length > 20 && (
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
            <p className="text-xs font-extrabold text-gray-700">
              {searchQuery.trim() ? 'لا يوجد عضو بهذا المعرف أو الاسم' : 'لا يوجد مستخدمون مسجلون آخرون بعد'}
            </p>
            <p className="text-[11px] text-gray-400">
              {searchQuery.trim()
                ? 'تأكد من كتابة رقم الـ UID الصحيح (من 10000 فأعلى).'
                : 'يظهر هنا فقط الأعضاء الحقيقيون المسجلون عبر Google أو البريد أو الهاتف داخل المنصة.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {suggestedUsers.map((user) => {
              const isFollowed = followingSet.has(user.uid);
              const distKm = currentUser ? livoStore.getUserDistanceKm(currentUser, user) : null;
              const hasOpenRoom = openRoomOwnerUids.has(user.uid);

              return (
                <div
                  key={user.uid}
                  className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs transition-all"
                >
                  <AvatarWithFrame
                    sizePx={52}
                    avatarUrl={user.avatar}
                    displayName={user.displayName}
                    frameUrl={user.equippedFrameUrl}
                    frameGlowColor={user.frameGlowColor}
                    frameAnimated={user.frameAnimated}
                    customIconUrl={user.customIconUrl}
                    customIconGlow={user.customIconGlow}
                    customIconAnimated={user.customIconAnimated}
                    showOnlineDot
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserNameWithBadges
                        displayName={user.displayName}
                        nameGlowColor={user.nameGlowColor}
                        isVerified={user.isVerified}
                        verifiedBadgeColor={user.verifiedBadgeColor}
                        verifiedBadgeShape={user.verifiedBadgeShape}
                        verifiedBadgeGlow={user.verifiedBadgeGlow}
                        customIconUrl={user.customIconUrl}
                        customIconGlow={user.customIconGlow}
                        customIconAnimated={user.customIconAnimated}
                        customIconLabel={user.customIconLabel}
                        agencyLabel={livoStore.getAgencyDisplayLabel(user)}
                        agencyLabelBelow={true}
                        badgeSize={14}
                        iconSize={18}
                        nameClassName="font-extrabold text-xs text-gray-900"
                      />
                      <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1 rounded font-digits shrink-0">
                        Lv.{user.level || 0}
                      </span>
                      {distKm !== null && (
                        <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full font-digits shrink-0">
                          {distKm < 1 ? 'أقل من 1 كم' : `${distKm} كم`}
                        </span>
                      )}
                      {hasOpenRoom && (
                        <span className="bg-rose-100 text-rose-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                          مباشر الآن
                        </span>
                      )}
                      {livoStore.areMutualFriends(currentUser?.uid, user.uid) && (
                        <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                          🤝 صديق
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-digits block">
                      UID: {user.uid} • @{user.username}
                    </span>
                    <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                      {livoStore.canViewUserContent(currentUser?.uid, user, 'profile')
                        ? user.bio || 'عضو حقيقي في منصة LIVO 🌟'
                        : '🔒 الملف مضبوط للأصدقاء فقط'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onStartChat && (
                      <button
                        onClick={() => handleOpenUserChat(user.uid)}
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


