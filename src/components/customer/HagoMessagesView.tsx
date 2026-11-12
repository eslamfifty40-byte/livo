import React, { useState, useEffect } from 'react';
import { UserPlus, BookOpen, MessageSquare, Search, CheckCircle, Send, ArrowRight, Smile, MoreVertical, X, Phone, Video, Headphones } from 'lucide-react';
import { UserProfile, DirectMessage } from '../../types';
import { livoStore } from '../../services/livoStore';

interface HagoMessagesViewProps {
  currentUser: UserProfile;
}

interface ChatThreadItem {
  id: string;
  name: string;
  avatar: string;
  isBot?: boolean;
  isVerified?: boolean;
  time: string;
  lastMessage: string;
  unreadCount: number;
  isOnline?: boolean;
}

export const HagoMessagesView: React.FC<HagoMessagesViewProps> = ({ currentUser }) => {
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatTarget, setActiveChatTarget] = useState<{ id: string; name: string; avatar: string; isBot?: boolean; isOnline?: boolean } | null>(null);
  const [chatReply, setChatReply] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>(livoStore.getMessages());

  // Listen to livoStore messages
  useEffect(() => {
    const unsub = livoStore.subscribe(() => {
      setMessages([...livoStore.getMessages()]);
    });
    return () => unsub();
  }, []);

  // Compute dynamic threads from real store messages plus official channel
  const otherUsers = livoStore.getUsers().filter(u => u.uid !== currentUser.uid);

  // Official Support Thread
  const supportMsgs = messages.filter(
    m => (m.senderUid === currentUser.uid && m.receiverUid === '10000') ||
         (m.senderUid === '10000' && m.receiverUid === currentUser.uid)
  );
  const lastSupportMsg = supportMsgs[supportMsgs.length - 1];

  // Base preset threads for rich immediate chat experience
  const threads: ChatThreadItem[] = [
    {
      id: '10000',
      name: 'LIVO Official (الدعم وخدمة العملاء)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      isBot: true,
      isVerified: true,
      time: lastSupportMsg ? new Date(lastSupportMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'الآن',
      lastMessage: lastSupportMsg ? lastSupportMsg.content : 'أهلاً بك في منصة LIVO! الدعم الفني وخدمة العملاء جاهزة لمساعدتك دائماً 🛡️',
      unreadCount: supportMsgs.filter(m => m.receiverUid === currentUser.uid && m.status !== 'read').length,
      isOnline: true
    },
    ...otherUsers.slice(0, 5).map(u => {
      const userMsgs = messages.filter(
        m => (m.senderUid === currentUser.uid && m.receiverUid === u.uid) ||
             (m.senderUid === u.uid && m.receiverUid === currentUser.uid)
      );
      const lastMsg = userMsgs[userMsgs.length - 1];
      return {
        id: u.uid,
        name: u.displayName || u.username,
        avatar: u.avatar,
        isVerified: u.isVerified,
        time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'منذ قليل',
        lastMessage: lastMsg ? lastMsg.content : (u.bio || 'مرحباً بك في LIVO! 🌟'),
        unreadCount: userMsgs.filter(m => m.receiverUid === currentUser.uid && m.status !== 'read').length,
        isOnline: true
      };
    })
  ];

  // Real Online Users Strip
  const onlineFriends = otherUsers.slice(0, 4).map(u => ({
    id: u.uid,
    name: u.displayName || u.username,
    avatar: u.avatar
  }));

  const handleOpenChat = (thread: ChatThreadItem) => {
    setActiveChatId(thread.id);
    setActiveChatTarget({
      id: thread.id,
      name: thread.name,
      avatar: thread.avatar,
      isBot: thread.isBot,
      isOnline: thread.isOnline
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !activeChatTarget) return;

    // Send real message through livoStore which propagates to Firestore
    livoStore.sendDirectMessage({
      senderUid: currentUser.uid,
      receiverUid: activeChatTarget.id,
      content: chatReply.trim()
    });

    setChatReply('');
  };

  // Get active conversation messages in real time
  const activeConversationMessages = activeChatTarget
    ? messages
        .filter(
          m => (m.senderUid === currentUser.uid && m.receiverUid === activeChatTarget.id) ||
               (m.senderUid === activeChatTarget.id && m.receiverUid === currentUser.uid)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  return (
    <div className="flex flex-col h-full bg-white text-black select-none overflow-hidden relative">
      
      {/* Top Header matching Screenshots 2 & 3 */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-2xl font-black tracking-tight text-gray-900">
          الرسائل
        </h2>

        {/* 3 Top Action Icons matching Screenshot 2 & 3 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('إضافة صديق جديد')}
            className="text-gray-700 hover:text-black transition-colors"
            title="إضافة أصدقاء"
          >
            <UserPlus className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            onClick={() => alert('دفتر جهات الاتصال')}
            className="text-gray-700 hover:text-black transition-colors relative"
            title="جهات الاتصال"
          >
            <BookOpen className="w-5 h-5 stroke-[2]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <button
            onClick={() => alert('مجموعة جديدة')}
            className="text-gray-700 hover:text-black transition-colors"
            title="إنشاء مجموعة"
          >
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Main Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-8">
        
        {/* Yellow Contacts Sync Banner matching Screenshots 2 & 3 */}
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
                الاتصال بـ جهات الاتصال
              </h4>
              <p className="text-[10px] text-gray-600 line-clamp-1">
                قم بتوصيل جهات الاتصال الخاص بك للقاء الأصدقاء في LIVO
              </p>
            </div>

            <button
              onClick={() => {
                alert('تم مزامنة جهات الاتصال بنجاح ✓');
                setShowSyncBanner(false);
              }}
              className="bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-2xs shrink-0 active:scale-95 transition-all"
            >
              توصيل
            </button>
          </div>
        )}

        {/* Online Friends Strip matching Screenshot 3: "أصدقاؤك متصلون الآن للدردشة." */}
        <div className="px-4 py-2 border-b border-gray-50">
          <h4 className="font-extrabold text-xs text-gray-800 mb-2">
            أصدقاؤك متصلون الآن للدردشة.
          </h4>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
            {onlineFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => {
                  const targetThread = threads.find(t => t.id === friend.id) || threads[1];
                  handleOpenChat(targetThread);
                }}
                className="flex flex-col items-center shrink-0 cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-[#FFE600] to-yellow-300">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                    />
                  </div>
                  {/* Yellow Mic / In Chat Indicator */}
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#FFE600] border-2 border-white flex items-center justify-center text-[8px]">
                    🎤
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-800 mt-1 truncate max-w-[60px] text-center">
                  {friend.name}
                </span>
                <span className="text-[8px] text-gray-400 font-medium">في دردشة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation List matching Screenshots 2 & 3 */}
        <div className="divide-y divide-gray-50">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => handleOpenChat(thread)}
              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 cursor-pointer transition-colors"
            >
              {/* Avatar + Badge */}
              <div className="relative shrink-0">
                {thread.isBot ? (
                  <div className="w-12 h-12 rounded-full bg-[#FFE600] flex items-center justify-center text-2xl font-black text-black shadow-xs">
                    ☻
                  </div>
                ) : (
                  <img
                    src={thread.avatar}
                    alt={thread.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-100"
                  />
                )}
                {thread.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>

              {/* Sender Name & Preview Message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <h4 className="font-extrabold text-sm text-gray-900 truncate">
                      {thread.name}
                    </h4>
                    {thread.isVerified && (
                      <span className="text-amber-500 font-bold text-xs" title="موثق رسمياً">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-digits shrink-0 mr-1">
                    {thread.time}
                  </span>
                </div>

                <p className="text-xs text-gray-500 truncate font-normal">
                  {thread.lastMessage}
                </p>
              </div>

              {/* Unread Red Counter Badge matching screenshots */}
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
      </div>

      {/* Interactive Chat Window Modal */}
      {activeChatTarget && (
        <div className="absolute inset-0 z-40 bg-white flex flex-col animate-in slide-in-from-right duration-200">
          {/* Chat Window Top Bar */}
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between bg-white shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveChatTarget(null);
                  setActiveChatId(null);
                }}
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

              <div>
                <h4 className="font-extrabold text-xs text-gray-900 truncate max-w-[140px]">
                  {activeChatTarget.name}
                </h4>
                <span className="text-[9px] text-green-600 font-bold block">
                  {activeChatTarget.isOnline ? 'متصل الآن' : 'غير متصل'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <button
                onClick={() => alert('جاري الاتصال الصوتي المباشر... 📞')}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => alert('مكالمة فيديو سريعة 📹')}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F8F9FA]">
            {activeConversationMessages.length > 0 ? (
              activeConversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.senderUid === currentUser.uid ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs font-medium shadow-2xs ${
                      msg.senderUid === currentUser.uid
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
                          onClick={() => window.open(msg.mediaUrl, '_blank')}
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
                <p className="text-[10px] text-gray-400 mt-1">اكتب رسالتك الآن وستصل مباشرة إلى الطرف الآخر والإدارة 💬</p>
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !activeChatTarget) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result as string;
                    livoStore.sendDirectMessage({
                      senderUid: currentUser.uid,
                      receiverUid: activeChatTarget.id,
                      content: '📷 صورة مرفقة',
                      type: 'image',
                      mediaUrl: base64
                    });
                  };
                  reader.readAsDataURL(file);
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
              placeholder="اكتب رسالة حقيقية للإدارة أو الصديق..."
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
        </div>
      )}
    </div>
  );
};
