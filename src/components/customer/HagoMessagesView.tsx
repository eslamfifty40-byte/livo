import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  BookOpen,
  MessageSquare,
  Search,
  Send,
  ArrowRight,
  X,
  Phone,
  Video,
  CheckCircle2,
  ShieldBan,
  Mic,
  Inbox,
  PauseCircle,
  Check,
  Clock,
  MessageSquarePlus,
  Ban,
  LogIn
} from 'lucide-react';
import { UserProfile, DirectMessage, MessageRequest } from '../../types';
import { livoStore } from '../../services/livoStore';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { VerifiedBadgeColor, VerifiedBadgeShape } from '../common/LivoVerifiedBadge';
import { UserNameWithBadges } from '../common/UserNameWithBadges';
import { compressImageForFirestore } from '../../utils/imageCompression';

interface HagoMessagesViewProps {
  currentUser: UserProfile | null;
  initialChatPartnerUid?: string | null;
  onClearInitialPartner?: () => void;
  onRequireAuth?: () => void;
}

interface ChatThreadItem {
  id: string;
  name: string;
  avatar: string;
  isBot?: boolean;
  isVerified?: boolean;
  verifiedBadgeColor?: VerifiedBadgeColor;
  verifiedBadgeShape?: VerifiedBadgeShape;
  verifiedBadgeGlow?: boolean;
  nameGlowColor?: UserProfile['nameGlowColor'];
  equippedFrameUrl?: string;
  frameGlowColor?: string;
  frameAnimated?: boolean;
  customIconUrl?: string;
  customIconGlow?: string;
  customIconAnimated?: boolean;
  time: string;
  lastMessage: string;
  unreadCount: number;
  isOnline?: boolean;
  isAccepted?: boolean;
  requestStatus?: MessageRequest['status'];
}

export const HagoMessagesView: React.FC<HagoMessagesViewProps> = ({
  currentUser,
  initialChatPartnerUid,
  onClearInitialPartner,
  onRequireAuth
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'suspended'>('chats');
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const [activeChatTarget, setActiveChatTarget] = useState<{
    id: string;
    name: string;
    avatar: string;
    isBot?: boolean;
    isOnline?: boolean;
  } | null>(null);
  const [chatReply, setChatReply] = useState('');
  const [requestIntroMsg, setRequestIntroMsg] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>(() => livoStore.getMessages());
  const [genuineUsers, setGenuineUsers] = useState<UserProfile[]>(() => livoStore.getCustomerUsers());
  const [msgRequests, setMsgRequests] = useState<MessageRequest[]>(() => livoStore.getMessageRequests());

  // In-app modals & notifications (Zero window.alert / window.open)
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [remoteFriendResults, setRemoteFriendResults] = useState<UserProfile[]>([]);
  const [searchingFriendUid, setSearchingFriendUid] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showQuickRoomModal, setShowQuickRoomModal] = useState(false);
  const [quickRoomTitle, setQuickRoomTitle] = useState('');
  const [activeCallMode, setActiveCallMode] = useState<'audio' | 'video' | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  // Listen to livoStore changes
  useEffect(() => {
    const sync = () => {
      setMessages([...livoStore.getMessages()]);
      setGenuineUsers([...livoStore.getCustomerUsers()]);
      setMsgRequests([...livoStore.getMessageRequests()]);
    };
    sync();
    const unsub = livoStore.subscribe(sync);
    return () => unsub();
  }, []);

  // Live Firestore lookup for UID 10000-100000+ in Add Friend modal
  useEffect(() => {
    const q = friendSearchQuery.trim();
    if (!showAddFriendModal || q.length < 4) {
      setRemoteFriendResults([]);
      setSearchingFriendUid(false);
      return;
    }
    let cancelled = false;
    setSearchingFriendUid(true);
    const t = setTimeout(async () => {
      try {
        const found = await livoStore.lookupUserInFirestore(q, { excludeOwners: true });
        if (!cancelled) setRemoteFriendResults(found);
      } finally {
        if (!cancelled) setSearchingFriendUid(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [friendSearchQuery, showAddFriendModal]);

  // Mark incoming messages read whenever opening/viewing an active conversation
  useEffect(() => {
    if (!activeChatTarget || !currentUser) return;
    if (livoStore.canChatPrivately(currentUser?.uid, activeChatTarget.id)) {
      livoStore.markThreadAsRead(currentUser?.uid, activeChatTarget.id);
    }
  }, [activeChatTarget, currentUser?.uid, messages.length]);

  // Open direct chat automatically when routed from Discover or elsewhere
  useEffect(() => {
    if (!initialChatPartnerUid || !currentUser) return;
    if (initialChatPartnerUid === '10000') {
      setActiveChatTarget({
        id: '10000',
        name: 'LIVO Official (الدعم وخدمة العملاء)',
        avatar: '/assets/livo/customer_icon.jpg',
        isBot: true,
        isOnline: true
      });
    } else {
      const targetUser = livoStore.getUserByUid(initialChatPartnerUid);
      if (targetUser) {
        setActiveChatTarget({
          id: targetUser.uid,
          name: targetUser.displayName || targetUser.username,
          avatar: targetUser.avatar,
          isOnline: true
        });
      }
    }
    onClearInitialPartner?.();
  }, [initialChatPartnerUid, currentUser, onClearInitialPartner]);

  if (!currentUser) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] text-black select-none items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 max-w-sm w-full space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFE600] text-black flex items-center justify-center mx-auto shadow-sm">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-base text-gray-900">الرسائل والمحادثات الخاصة</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              قم بتسجيل الدخول لتلقي الرسائل وطلبات المراسلة والتواصل المباشر مع أعضاء LIVO والدعم الفني.
            </p>
          </div>
          <button
            onClick={() => onRequireAuth?.()}
            className="w-full py-3 rounded-2xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول لفتح الرسائل</span>
          </button>
        </div>
      </div>
    );
  }

  const blockedSet = new Set(currentUser?.blockedUids || []);
  const followingSet = new Set(currentUser?.followingUids || []);
  const otherUsers = genuineUsers.filter(
    u => u.uid !== currentUser?.uid && !blockedSet.has(u.uid)
  );

  const {
    incomingPending,
    incomingSuspended,
    outgoing
  } = livoStore.getMessageRequestsForUser(currentUser?.uid);

  // Official Support Thread
  const supportMsgs = messages.filter(
    m => (m.senderUid === currentUser?.uid && m.receiverUid === '10000') ||
         (m.senderUid === '10000' && m.receiverUid === currentUser?.uid)
  );
  const lastSupportMsg = supportMsgs[supportMsgs.length - 1];

  const threads: ChatThreadItem[] = [
    {
      id: '10000',
      name: 'LIVO Official (الدعم وخدمة العملاء)',
      avatar: '/assets/livo/customer_icon.jpg',
      isBot: true,
      isVerified: true,
      verifiedBadgeColor: 'gold',
      verifiedBadgeShape: 'crown',
      time: lastSupportMsg
        ? new Date(lastSupportMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'متاح دائماً',
      lastMessage: lastSupportMsg
        ? lastSupportMsg.content
        : 'أهلاً بك في منصة LIVO! الدعم الفني وخدمة العملاء جاهزة لمساعدتك دائماً 🛡️',
      unreadCount: supportMsgs.filter(m => m.receiverUid === currentUser?.uid && m.status !== 'read').length,
      isOnline: true,
      isAccepted: true
    },
    ...otherUsers.map(u => {
      const reqBetween = msgRequests.find(
        r => (r.senderUid === currentUser?.uid && r.receiverUid === u.uid) ||
             (r.senderUid === u.uid && r.receiverUid === currentUser?.uid)
      );
      const isAccepted = reqBetween?.status === 'accepted';
      const userMsgs = isAccepted
        ? messages.filter(
            m => (m.senderUid === currentUser?.uid && m.receiverUid === u.uid) ||
                 (m.senderUid === u.uid && m.receiverUid === currentUser?.uid)
          )
        : [];
      const lastMsg = userMsgs[userMsgs.length - 1];
      const subtitle = lastMsg
        ? lastMsg.content
        : isAccepted
        ? 'تم قبول طلب المراسلة — ابدأ المحادثة الآن 💬'
        : reqBetween?.status === 'pending'
        ? reqBetween.senderUid === currentUser?.uid
          ? 'طلب مراسلة مُرسل — بانتظار القبول'
          : 'طلب مراسلة جديد بانتظار موافقتك'
        : reqBetween?.status === 'suspended'
        ? 'طلب مراسلة معلق'
        : 'أرسل طلب مراسلة لبدء المحادثة الخاصة 🔒';

      return {
        id: u.uid,
        name: u.displayName || u.username,
        avatar: u.avatar,
        isVerified: u.isVerified,
        verifiedBadgeColor: u.verifiedBadgeColor,
        verifiedBadgeShape: u.verifiedBadgeShape,
        verifiedBadgeGlow: u.verifiedBadgeGlow,
        nameGlowColor: u.nameGlowColor,
        equippedFrameUrl: u.equippedFrameUrl,
        frameGlowColor: u.frameGlowColor,
        frameAnimated: u.frameAnimated,
        customIconUrl: u.customIconUrl,
        customIconGlow: u.customIconGlow,
        customIconAnimated: u.customIconAnimated,
        time: lastMsg
          ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : `UID: ${u.uid}`,
        lastMessage: subtitle,
        unreadCount: userMsgs.filter(m => m.receiverUid === currentUser?.uid && m.status !== 'read').length,
        isOnline: isAccepted && userMsgs.length > 0,
        isAccepted,
        requestStatus: reqBetween?.status
      };
    })
  ];

  // Online/Following strip
  const quickStripUsers = otherUsers.slice(0, 6);

  const handleOpenChat = (thread: ChatThreadItem) => {
    setActiveChatTarget({
      id: thread.id,
      name: thread.name,
      avatar: thread.avatar,
      isBot: thread.isBot,
      isOnline: thread.isOnline
    });
  };

  const openChatByUser = (user: UserProfile) => {
    setActiveChatTarget({
      id: user.uid,
      name: user.displayName || user.username,
      avatar: user.avatar,
      isOnline: true
    });
    setShowAddFriendModal(false);
    setShowContactsModal(false);
  };

  const canDirectChat = activeChatTarget
    ? livoStore.canChatPrivately(currentUser?.uid, activeChatTarget.id)
    : false;

  const activePairRequest = activeChatTarget && !activeChatTarget.isBot
    ? livoStore.getMessageRequestBetween(currentUser?.uid, activeChatTarget.id)
    : undefined;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !activeChatTarget) return;
    if (!canDirectChat) {
      showToast('يجب قبول طلب المراسلة أولاً لبدء المحادثة');
      return;
    }

    livoStore.sendDirectMessage({
      senderUid: currentUser?.uid,
      receiverUid: activeChatTarget.id,
      content: chatReply.trim()
    });

    setChatReply('');
  };

  const handleSendMessageRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatTarget || activeChatTarget.isBot) return;
    const res = livoStore.sendMessageRequest(
      currentUser?.uid,
      activeChatTarget.id,
      requestIntroMsg.trim() || 'مرحباً، أود إرسال رسالة خاصة لك'
    );
    showToast(res.message);
    if (res.success) {
      setRequestIntroMsg('');
    }
  };

  const handleRespondRequest = (
    requestId: string,
    action: 'accepted' | 'rejected' | 'suspended',
    openOnAccept?: MessageRequest
  ) => {
    const res = livoStore.respondToMessageRequest(requestId, action, currentUser?.uid);
    showToast(res.message);
    if (res.success && action === 'accepted' && openOnAccept) {
      const otherUid = openOnAccept.senderUid === currentUser?.uid ? openOnAccept.receiverUid : openOnAccept.senderUid;
      const otherUser = livoStore.getUserByUid(otherUid);
      setActiveTab('chats');
      setActiveChatTarget({
        id: otherUid,
        name: otherUser?.displayName || openOnAccept.senderName,
        avatar: otherUser?.avatar || openOnAccept.senderAvatar,
        isOnline: true
      });
    }
  };

  const activeConversationMessages = activeChatTarget && canDirectChat
    ? messages
        .filter(
          m => (m.senderUid === currentUser?.uid && m.receiverUid === activeChatTarget.id) ||
               (m.senderUid === activeChatTarget.id && m.receiverUid === currentUser?.uid)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const extraRemote = remoteFriendResults.filter(
    r => r.uid !== currentUser.uid && !blockedSet.has(r.uid) && !otherUsers.some(u => u.uid === r.uid)
  );
  const searchMergedUsers = [...extraRemote, ...otherUsers];

  const filteredFriendResults = friendSearchQuery.trim()
    ? searchMergedUsers.filter(
        u =>
          u.uid.includes(friendSearchQuery.trim()) ||
          u.username.toLowerCase().includes(friendSearchQuery.trim().toLowerCase()) ||
          u.displayName.toLowerCase().includes(friendSearchQuery.trim().toLowerCase())
      )
    : searchMergedUsers.slice(0, 12);

  const followedUsersList = otherUsers.filter(u => followingSet.has(u.uid));

  return (
    <div className="flex flex-col h-full bg-white text-black select-none overflow-hidden relative">
      {/* In-app Toast */}
      {toastMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-black text-[#FFE600] px-4 py-2 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5 whitespace-nowrap max-w-[92%] truncate">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-2xl font-black tracking-tight text-gray-900">
          الرسائل
        </h2>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="text-gray-700 hover:text-black transition-colors"
            title="البحث بالمعرف UID وإضافة صديق"
          >
            <UserPlus className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            onClick={() => setShowContactsModal(true)}
            className="text-gray-700 hover:text-black transition-colors relative"
            title="جهات الاتصال والمتابَعون"
          >
            <BookOpen className="w-5 h-5 stroke-[2]" />
            {followedUsersList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setShowQuickRoomModal(true)}
            className="text-gray-700 hover:text-black transition-colors"
            title="إنشاء غرفة دردشة صوتية"
          >
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-tabs: Chats / Message Requests / Suspended */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/70 flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
            activeTab === 'chats'
              ? 'bg-[#FFE600] text-black shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>المحادثات</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 relative ${
            activeTab === 'requests'
              ? 'bg-[#FFE600] text-black shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>طلبات المراسلة</span>
          {incomingPending.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-[#FF2D55] text-white text-[9px] font-digits font-black flex items-center justify-center">
              {incomingPending.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('suspended')}
          className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
            activeTab === 'suspended'
              ? 'bg-gray-900 text-[#FFE600] shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <PauseCircle className="w-3.5 h-3.5" />
          <span>المعلقة</span>
          {incomingSuspended.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-amber-500 text-black text-[9px] font-digits font-black flex items-center justify-center">
              {incomingSuspended.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-8">
        {activeTab === 'chats' && (
          <>
            {showSyncBanner && (
              <div className="m-3 p-3 rounded-2xl bg-[#FFFDE7] border border-[#FFE600]/80 flex items-center justify-between gap-3 shadow-2xs relative">
                <button
                  onClick={() => setShowSyncBanner(false)}
                  className="absolute top-2 left-2 text-gray-400 hover:text-black text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="font-extrabold text-xs text-gray-900 mb-0.5">
                    البحث السريع عن الأصدقاء بالمعرف UID
                  </h4>
                  <p className="text-[10px] text-gray-600 line-clamp-1">
                    أرسل طلب مراسلة أو تواصل مع جهات اتصالك المعتمدة بخصوصية تامة
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowAddFriendModal(true);
                    setShowSyncBanner(false);
                  }}
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-2xs shrink-0 active:scale-95 transition-all"
                >
                  بحث الآن
                </button>
              </div>
            )}

            {/* Quick Real Contacts Strip */}
            {quickStripUsers.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-50">
                <h4 className="font-extrabold text-xs text-gray-800 mb-2">
                  أعضاء LIVO المتاحون للتواصل
                </h4>

                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                  {quickStripUsers.map((friend) => (
                    <div
                      key={friend.uid}
                      onClick={() => openChatByUser(friend)}
                      className="flex flex-col items-center shrink-0 cursor-pointer group"
                    >
                      <div className="relative">
                        <AvatarWithFrame
                          sizePx={50}
                          avatarUrl={friend.avatar}
                          displayName={friend.displayName}
                          frameUrl={friend.equippedFrameUrl}
                          frameGlowColor={friend.frameGlowColor}
                          frameAnimated={friend.frameAnimated}
                          customIconUrl={friend.customIconUrl}
                          customIconGlow={friend.customIconGlow}
                          customIconAnimated={friend.customIconAnimated}
                        />
                        <span className="absolute bottom-0 right-0 z-20 w-4 h-4 rounded-full bg-[#FFE600] border-2 border-white flex items-center justify-center text-[8px]">
                          💬
                        </span>
                      </div>
                      <div className="mt-1 max-w-[74px]">
                        <UserNameWithBadges
                          displayName={friend.displayName || friend.username}
                          nameGlowColor={friend.nameGlowColor}
                          isVerified={friend.isVerified}
                          verifiedBadgeColor={friend.verifiedBadgeColor}
                          verifiedBadgeShape={friend.verifiedBadgeShape}
                          verifiedBadgeGlow={friend.verifiedBadgeGlow}
                          customIconUrl={friend.customIconUrl}
                          customIconGlow={friend.customIconGlow}
                          customIconAnimated={friend.customIconAnimated}
                          customIconLabel={friend.customIconLabel}
                          badgeSize={11}
                          iconSize={13}
                          nameClassName="text-[10px] font-bold text-gray-800"
                        />
                      </div>
                      <span className="text-[8px] text-gray-400 font-digits">UID {friend.uid}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation List */}
            <div className="divide-y divide-gray-50">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => handleOpenChat(thread)}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <div className="relative shrink-0">
                    {thread.isBot ? (
                      <div className="w-12 h-12 rounded-full bg-[#FFE600] flex items-center justify-center text-2xl font-black text-black shadow-xs">
                        ☻
                      </div>
                    ) : (
                      <AvatarWithFrame
                        sizePx={48}
                        avatarUrl={thread.avatar}
                        displayName={thread.name}
                        frameUrl={thread.equippedFrameUrl}
                        frameGlowColor={thread.frameGlowColor}
                        frameAnimated={thread.frameAnimated}
                        customIconUrl={thread.customIconUrl}
                        customIconGlow={thread.customIconGlow}
                        customIconAnimated={thread.customIconAnimated}
                        showOnlineDot={thread.isOnline}
                      />
                    )}
                    {thread.isBot && thread.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <UserNameWithBadges
                          displayName={thread.name}
                          nameGlowColor={thread.nameGlowColor}
                          isVerified={thread.isVerified}
                          verifiedBadgeColor={thread.verifiedBadgeColor}
                          verifiedBadgeShape={thread.verifiedBadgeShape}
                          verifiedBadgeGlow={thread.verifiedBadgeGlow}
                          customIconUrl={thread.customIconUrl}
                          customIconGlow={thread.customIconGlow}
                          customIconAnimated={thread.customIconAnimated}
                          badgeSize={14}
                          iconSize={18}
                          nameClassName="font-extrabold text-sm text-gray-900"
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-digits shrink-0 mr-1">
                        {thread.time}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 truncate font-normal">
                      {thread.lastMessage}
                    </p>
                  </div>

                  {thread.unreadCount > 0 && (
                    <div className="shrink-0 mr-1">
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FF2D55] text-white text-[10px] font-digits font-black flex items-center justify-center shadow-xs">
                        {thread.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Active Message Requests Tab */}
        {activeTab === 'requests' && (
          <div className="p-3 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-gray-800">
                  طلبات المراسلة الواردة ({incomingPending.length})
                </h3>
                <span className="text-[10px] text-gray-500">
                  يتطلب القبول لفتح الدردشة الخاصة
                </span>
              </div>

              {incomingPending.length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center space-y-1.5">
                  <Inbox className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-600">لا توجد طلبات مراسلة جديدة حالياً</p>
                  <p className="text-[10px] text-gray-400">
                    ستظهر هنا أي طلبات مراسلة يرسلها الأعضاء الجدد قبل بدء المحادثة
                  </p>
                </div>
              ) : (
                incomingPending.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={req.senderAvatar || '/assets/livo/customer_icon.jpg'}
                          alt={req.senderName}
                          className="w-10 h-10 rounded-full object-cover border border-amber-300"
                        />
                        <div className="min-w-0">
                          <h4 className="font-black text-xs text-gray-900 truncate">{req.senderName}</h4>
                          <span className="text-[10px] text-gray-500 font-digits">
                            UID: {req.senderUid} • {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                        قيد المراجعة
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                      {req.introMessage}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'accepted', req)}
                        className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>قبول</span>
                      </button>

                      <button
                        onClick={() => handleRespondRequest(req.id, 'suspended')}
                        className="py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>تعليق</span>
                      </button>

                      <button
                        onClick={() => handleRespondRequest(req.id, 'rejected')}
                        className="py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {outgoing.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-black text-gray-700 px-1">
                  طلبات المراسلة المُرسلة ({outgoing.length})
                </h3>
                {outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={req.receiverAvatar || '/assets/livo/customer_icon.jpg'}
                        alt={req.receiverName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 truncate">{req.receiverName}</h4>
                        <p className="text-[10px] text-gray-500 truncate">{req.introMessage}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${
                        req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : req.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'accepted'
                        ? 'مقبول ✓'
                        : req.status === 'rejected'
                        ? 'مرفوض'
                        : 'قيد الانتظار'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suspended Requests Tab (Preserved without losing data) */}
        {activeTab === 'suspended' && (
          <div className="p-3 space-y-2.5">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-[11px] text-amber-900 font-medium">
              يتم حفظ جميع الطلبات المعلقة هنا مع كامل بياناتها دون حذف، ويمكنك قبولها أو رفضها في أي وقت.
            </div>

            {incomingSuspended.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center space-y-1.5">
                <PauseCircle className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">لا توجد طلبات مراسلة معلقة حالياً</p>
              </div>
            ) : (
              incomingSuspended.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-amber-200 rounded-2xl p-3 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={req.senderAvatar || '/assets/livo/customer_icon.jpg'}
                        alt={req.senderName}
                        className="w-10 h-10 rounded-full object-cover border border-amber-300"
                      />
                      <div className="min-w-0">
                        <h4 className="font-black text-xs text-gray-900 truncate">{req.senderName}</h4>
                        <span className="text-[10px] text-gray-500 font-digits">
                          UID: {req.senderUid} • معلق منذ {new Date(req.updatedAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-900 text-[#FFE600] font-bold shrink-0">
                      معلق
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                    {req.introMessage}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRespondRequest(req.id, 'accepted', req)}
                      className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>قبول وفتح الدردشة</span>
                    </button>
                    <button
                      onClick={() => handleRespondRequest(req.id, 'rejected')}
                      className="py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>رفض الطلب</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Friend / Search by UID Modal */}
      {showAddFriendModal && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl max-h-[82vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-sm text-gray-900">إضافة صديق والبحث بالمعرف</h3>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative my-3">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                placeholder="ابحث برقم UID (10000 - 100000+) أو الاسم..."
                className="w-full bg-gray-100 rounded-xl pr-9 pl-8 py-2 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-[#FFE600]"
              />
              {searchingFriendUid && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredFriendResults.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-8">لا يوجد مستخدمون مطابقون للبحث</p>
              ) : (
                filteredFriendResults.map(u => {
                  const isFollowed = followingSet.has(u.uid);
                  const canChat = livoStore.canChatPrivately(currentUser?.uid, u.uid);
                  return (
                    <div key={u.uid} className="flex items-center justify-between p-2.5 rounded-2xl border border-gray-100 bg-gray-50/70">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={u.avatar} alt={u.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
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
                            customIconLabel={u.customIconLabel}
                            badgeSize={13}
                            iconSize={16}
                            nameClassName="font-bold text-xs text-gray-900"
                          />
                          <span className="text-[10px] text-gray-500 font-digits block">UID: {u.uid}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => livoStore.toggleFollowUser(currentUser?.uid, u.uid)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isFollowed ? 'bg-gray-200 text-gray-700' : 'bg-[#FFE600] text-black'
                          }`}
                        >
                          {isFollowed ? 'متابَع' : 'متابعة'}
                        </button>
                        <button
                          onClick={() => openChatByUser(u)}
                          className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-[11px] font-bold"
                        >
                          {canChat ? 'مراسلة' : 'طلب مراسلة'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contacts / Following Modal */}
      {showContactsModal && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl max-h-[82vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-sm text-gray-900">دفتر جهات الاتصال والمتابَعين</h3>
              <button
                onClick={() => setShowContactsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {followedUsersList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-2">
                  <p className="text-xs font-bold text-gray-600">لم تقم بمتابعة أي صديق بعد</p>
                  <button
                    onClick={() => {
                      setShowContactsModal(false);
                      setShowAddFriendModal(true);
                    }}
                    className="bg-[#FFE600] text-black font-bold text-xs px-4 py-2 rounded-full"
                  >
                    ابحث عن أصدقاء الآن
                  </button>
                </div>
              ) : (
                followedUsersList.map(u => (
                  <div
                    key={u.uid}
                    onClick={() => openChatByUser(u)}
                    className="flex items-center justify-between p-2.5 rounded-2xl border border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={u.avatar} alt={u.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
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
                          customIconLabel={u.customIconLabel}
                          badgeSize={13}
                          iconSize={16}
                          nameClassName="font-bold text-xs text-gray-900"
                        />
                        <span className="text-[10px] text-gray-500 font-digits block">UID: {u.uid}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-600">
                      {livoStore.canChatPrivately(currentUser?.uid, u.uid) ? 'فتح الدردشة' : 'طلب مراسلة'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Voice Room Modal */}
      {showQuickRoomModal && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-purple-600" />
                إنشاء غرفة دردشة صوتية
              </h3>
              <button onClick={() => setShowQuickRoomModal(false)} className="text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={quickRoomTitle}
              onChange={(e) => setQuickRoomTitle(e.target.value)}
              placeholder={`غرفة ${currentUser?.displayName}`}
              className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-[#FFE600]"
            />
            <button
              onClick={() => {
                livoStore.createRoom({
                  title: quickRoomTitle.trim() || `غرفة ${currentUser?.displayName}`,
                  category: 'عام',
                  roomType: 'voice',
                  ownerUid: currentUser?.uid
                });
                setQuickRoomTitle('');
                setShowQuickRoomModal(false);
                showToast('تم إنشاء الغرفة الصوتية في تبويب الحفلات ✓');
              }}
              className="w-full py-2.5 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs"
            >
              إنشاء الغرفة الآن
            </button>
          </div>
        </div>
      )}

      {/* Interactive Chat / Message Request Window Modal */}
      {activeChatTarget && (
        <div className="absolute inset-0 z-40 bg-white flex flex-col animate-in slide-in-from-right duration-200">
          {/* Chat Window Top Bar */}
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between bg-white shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChatTarget(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="relative">
                {activeChatTarget.isBot ? (
                  <div className="w-9 h-9 rounded-full bg-[#FFE600] flex items-center justify-center text-lg font-black text-black">
                    ☻
                  </div>
                ) : (
                  <img
                    src={activeChatTarget.avatar}
                    alt={activeChatTarget.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                )}
                {activeChatTarget.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white" />
                )}
              </div>

              {(() => {
                const partnerUser = !activeChatTarget.isBot ? livoStore.getUserByUid(activeChatTarget.id) : undefined;
                return (
                  <div className="min-w-0 max-w-[175px]">
                    <UserNameWithBadges
                      displayName={partnerUser?.displayName || activeChatTarget.name}
                      nameGlowColor={partnerUser?.nameGlowColor}
                      isVerified={activeChatTarget.isBot ? true : partnerUser?.isVerified}
                      verifiedBadgeColor={activeChatTarget.isBot ? 'gold' : partnerUser?.verifiedBadgeColor}
                      verifiedBadgeShape={activeChatTarget.isBot ? 'crown' : partnerUser?.verifiedBadgeShape}
                      verifiedBadgeGlow={partnerUser?.verifiedBadgeGlow}
                      customIconUrl={partnerUser?.customIconUrl}
                      customIconGlow={partnerUser?.customIconGlow}
                      customIconAnimated={partnerUser?.customIconAnimated}
                      customIconLabel={partnerUser?.customIconLabel}
                      badgeSize={14}
                      iconSize={17}
                      nameClassName="font-extrabold text-xs text-gray-900"
                    />
                    <span className="text-[9px] text-green-600 font-bold block">
                      {activeChatTarget.isBot ? 'الدعم الرسمي' : `UID: ${activeChatTarget.id}`}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              {canDirectChat && (
                <>
                  <button
                    onClick={() => setActiveCallMode('audio')}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700"
                    title="مكالمة صوتية"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveCallMode('video')}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700"
                    title="مكالمة فيديو"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </>
              )}
              {!activeChatTarget.isBot && (
                <button
                  onClick={() => {
                    livoStore.toggleBlockUser(currentUser?.uid, activeChatTarget.id);
                    setActiveChatTarget(null);
                    showToast('تم حظر المستخدم بنجاح');
                  }}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500"
                  title="حظر المستخدم"
                >
                  <ShieldBan className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {!canDirectChat ? (
            /* Message Request Gate View */
            <div className="flex-1 overflow-y-auto p-5 bg-[#F8F9FA] flex flex-col items-center justify-center text-center">
              {activePairRequest &&
              activePairRequest.receiverUid === currentUser?.uid &&
              (activePairRequest.status === 'pending' || activePairRequest.status === 'suspended') ? (
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-gray-900">
                    طلب مراسلة من {activeChatTarget.name}
                  </h4>
                  <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                    &ldquo;{activePairRequest.introMessage}&rdquo;
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => handleRespondRequest(activePairRequest.id, 'accepted', activePairRequest)}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs"
                    >
                      قبول
                    </button>
                    <button
                      onClick={() => {
                        handleRespondRequest(activePairRequest.id, 'suspended');
                        setActiveChatTarget(null);
                      }}
                      className="py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs"
                    >
                      تعليق
                    </button>
                    <button
                      onClick={() => {
                        handleRespondRequest(activePairRequest.id, 'rejected');
                        setActiveChatTarget(null);
                      }}
                      className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ) : activePairRequest &&
                activePairRequest.senderUid === currentUser?.uid &&
                (activePairRequest.status === 'pending' || activePairRequest.status === 'suspended') ? (
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-gray-900">طلب المراسلة قيد الانتظار</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    أرسلت طلب مراسلة إلى {activeChatTarget.name}. ستفتح المحادثة الخاصة فور قبول الطلب.
                  </p>
                  <div className="text-[11px] bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-gray-700">
                    رسالتك: {activePairRequest.introMessage}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessageRequest}
                  className="w-full max-w-sm bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3 text-right"
                >
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-[#FFE600]/30 text-amber-800 flex items-center justify-center mx-auto">
                      {activePairRequest?.status === 'rejected' ? (
                        <Ban className="w-6 h-6 text-red-500" />
                      ) : (
                        <MessageSquarePlus className="w-6 h-6" />
                      )}
                    </div>
                    <h4 className="font-black text-sm text-gray-900">إرسال طلب مراسلة</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {activePairRequest?.status === 'rejected'
                        ? 'تم رفض الطلب السابق. يمكنك إرسال طلب مراسلة جديد برسالة واضحة.'
                        : `لا يمكن بدء المحادثة المباشرة مع ${activeChatTarget.name} إلا بعد موافقته على طلب المراسلة.`}
                    </p>
                  </div>

                  <textarea
                    value={requestIntroMsg}
                    onChange={(e) => setRequestIntroMsg(e.target.value)}
                    placeholder="اكتب رسالة طلب المراسلة (مثال: مرحباً، أود التحدث معك...)"
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs text-gray-900 outline-none focus:border-[#FFE600] resize-none"
                  />

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs shadow-sm transition-all"
                  >
                    إرسال طلب مراسلة الآن
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F8F9FA]">
                {activeConversationMessages.length > 0 ? (
                  activeConversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.senderUid === currentUser?.uid ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs font-medium shadow-2xs ${
                          msg.senderUid === currentUser?.uid
                            ? 'bg-[#FFE600] text-black rounded-tl-2xs'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-tr-2xs'
                        }`}
                      >
                        {msg.mediaUrl && (
                          <div className="mb-1.5 rounded-xl overflow-hidden border border-black/10">
                            <img
                              src={msg.mediaUrl}
                              alt="مرفق صورة"
                              className="max-h-48 w-full object-cover cursor-pointer hover:opacity-90"
                              onClick={() => setPreviewImageUrl(msg.mediaUrl || null)}
                            />
                          </div>
                        )}
                        {msg.content && <p>{msg.content}</p>}
                      </div>
                      <span className="text-[9px] text-gray-400 font-digits mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-xs font-bold text-gray-500">لا توجد رسائل سابقة في هذه المحادثة</p>
                    <p className="text-[10px] text-gray-400 mt-1">اكتب رسالتك الآن وستصل مباشرة إلى الطرف الآخر 💬</p>
                  </div>
                )}
              </div>

              {/* Chat Reply Input Bar */}
              <form
                onSubmit={handleSendReply}
                className="p-2 border-t border-gray-100 bg-white flex items-center gap-2"
              >
                <label className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer text-gray-600 transition-colors shrink-0" title="إرفاق صورة أو لقطة شاشة">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file || !activeChatTarget) return;
                      try {
                        const compressed = await compressImageForFirestore(file, {
                          maxDim: 900,
                          quality: 0.78,
                          maxBytes: 220_000
                        });
                        livoStore.sendDirectMessage({
                          senderUid: currentUser?.uid,
                          receiverUid: activeChatTarget.id,
                          content: '📷 صورة مرفقة',
                          type: 'image',
                          mediaUrl: compressed
                        });
                      } catch {
                        showToast('تعذر ضغط الصورة المرفقة، جرب صورة أخرى');
                      }
                    }}
                  />
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </label>

                <input
                  type="text"
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  placeholder="اكتب رسالة حقيقية الآن..."
                  className="flex-1 bg-gray-100 text-xs text-gray-900 placeholder-gray-400 px-3.5 py-2 rounded-full outline-none focus:ring-1 focus:ring-[#FFE600]"
                />
                <button
                  type="submit"
                  disabled={!chatReply.trim()}
                  className="w-9 h-9 rounded-full bg-[#FFE600] disabled:bg-gray-200 text-black flex items-center justify-center shadow-2xs active:scale-95 transition-all shrink-0"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </>
          )}

          {/* In-app Call Overlay */}
          {activeCallMode && (
            <div className="absolute inset-0 z-50 bg-[#120824]/95 text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
              <img
                src={activeChatTarget.avatar}
                alt={activeChatTarget.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#FFE600] shadow-xl animate-pulse"
              />
              <div>
                <h4 className="font-black text-base">{activeChatTarget.name}</h4>
                <p className="text-xs text-purple-300 mt-1">
                  {activeCallMode === 'video' ? 'جاري طلب مكالمة فيديو مباشرة...' : 'جاري طلب مكالمة صوتية مباشرة...'}
                </p>
              </div>
              <button
                onClick={() => setActiveCallMode(null)}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg"
              >
                إنهاء المكالمة
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen In-App Image Preview Modal (replaces window.open) */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImageUrl}
            alt="معاينة الصورة"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
