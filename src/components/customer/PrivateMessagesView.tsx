import React, { useState, useEffect } from 'react';
import {
  Search,
  Send,
  Image as ImageIcon,
  Mic,
  Check,
  CheckCheck,
  ShieldAlert,
  ArrowRight,
  User,
  Sparkles,
  Clock,
  PauseCircle,
  XCircle,
  MessageSquarePlus
} from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface PrivateMessagesViewProps {
  currentUser: UserProfile;
}

export const PrivateMessagesView: React.FC<PrivateMessagesViewProps> = ({ currentUser }) => {
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [requestIntroInput, setRequestIntroInput] = useState('');
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = livoStore.subscribe(() => setTick((t) => t + 1));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activePartner) {
      livoStore.markThreadAsRead(currentUser.uid, activePartner.uid);
    }
  }, [activePartner, currentUser.uid]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const blockedSet = new Set(currentUser.blockedUids || []);
  const threads = livoStore.getChatThreads(currentUser.uid);
  const allUsers = livoStore.getGenuineUsers().filter(
    u => u.uid !== currentUser.uid && !blockedSet.has(u.uid)
  );

  const searchResults = searchQuery.trim()
    ? allUsers.filter(u =>
        u.uid.includes(searchQuery.trim()) ||
        u.username.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const canChatWithPartner = activePartner
    ? livoStore.canChatPrivately(currentUser.uid, activePartner.uid)
    : false;

  const existingRequest = activePartner
    ? livoStore.getMessageRequestBetween(currentUser.uid, activePartner.uid)
    : undefined;

  const activeMessages = activePartner && canChatWithPartner
    ? livoStore.getChatMessages(currentUser.uid, activePartner.uid)
    : [];

  const handleSendMessage = (e: React.FormEvent, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string) => {
    e.preventDefault();
    if (!activePartner) return;
    if (!canChatWithPartner) {
      showToast('يجب قبول طلب المراسلة أولاً لبدء المحادثة الخاصة');
      return;
    }
    const content = messageInput.trim();
    if (!content && type === 'text') return;

    livoStore.sendDirectMessage({
      senderUid: currentUser.uid,
      receiverUid: activePartner.uid,
      content: content || (type === 'voice' ? 'تسجيل صوتي 🎙️' : 'صورة مرفقة 📷'),
      type,
      mediaUrl
    });

    setMessageInput('');
  };

  const handleSendVoiceNote = () => {
    if (!canChatWithPartner) return;
    setIsSendingVoice(true);
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {} } as React.FormEvent, 'voice');
      setIsSendingVoice(false);
    }, 800);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePartner || !canChatWithPartner) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleSendMessage({ preventDefault: () => {} } as React.FormEvent, 'image', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner) return;
    const res = livoStore.sendMessageRequest(
      currentUser.uid,
      activePartner.uid,
      requestIntroInput.trim() || 'مرحباً، أود التواصل معك عبر الرسائل الخاصة'
    );
    showToast(res.message);
    if (res.success) setRequestIntroInput('');
  };

  return (
    <div className="relative flex flex-col h-[620px] bg-[#0c0517] rounded-2xl border border-purple-900/50 overflow-hidden text-white shadow-2xl">
      {toastMsg && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-lg text-center max-w-[90%]">
          {toastMsg}
        </div>
      )}

      {activePartner ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="bg-[#170b2c] p-3 border-b border-purple-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActivePartner(null)}
                className="w-8 h-8 rounded-full bg-purple-900/40 hover:bg-purple-800 flex items-center justify-center text-purple-300"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="relative">
                <img
                  src={activePartner.avatar}
                  alt={activePartner.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-purple-500"
                />
                {activePartner.isVerified && (
                  <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] text-white">
                    ✓
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">{activePartner.displayName}</h3>
                <span className="text-[10px] text-purple-300 font-digits">
                  UID: {activePartner.uid} • @{activePartner.username}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="text-purple-400 hover:text-red-400 p-1.5"
              title="إبلاغ أو حظر"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>

          {!canChatWithPartner ? (
            <div className="flex-1 p-5 flex flex-col items-center justify-center text-center space-y-4">
              {existingRequest && existingRequest.receiverUid === currentUser.uid && (existingRequest.status === 'pending' || existingRequest.status === 'suspended') ? (
                <div className="w-full max-w-sm bg-[#170b2c] border border-purple-700/60 rounded-2xl p-4 space-y-3">
                  <h4 className="font-black text-sm text-amber-300">طلب مراسلة وارد</h4>
                  <p className="text-xs text-purple-200 bg-[#120824] p-3 rounded-xl border border-purple-800/40">
                    &ldquo;{existingRequest.introMessage}&rdquo;
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        const res = livoStore.respondToMessageRequest(existingRequest.id, 'accepted', currentUser.uid);
                        showToast(res.message);
                      }}
                      className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black"
                    >
                      قبول
                    </button>
                    <button
                      onClick={() => {
                        const res = livoStore.respondToMessageRequest(existingRequest.id, 'suspended', currentUser.uid);
                        showToast(res.message);
                      }}
                      className="py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold"
                    >
                      تعليق
                    </button>
                    <button
                      onClick={() => {
                        const res = livoStore.respondToMessageRequest(existingRequest.id, 'rejected', currentUser.uid);
                        showToast(res.message);
                      }}
                      className="py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ) : existingRequest && existingRequest.senderUid === currentUser.uid && (existingRequest.status === 'pending' || existingRequest.status === 'suspended') ? (
                <div className="w-full max-w-sm bg-[#170b2c] border border-purple-700/60 rounded-2xl p-5 space-y-2.5">
                  <Clock className="w-9 h-9 text-amber-400 mx-auto" />
                  <h4 className="font-black text-sm text-white">طلب المراسلة قيد الانتظار</h4>
                  <p className="text-xs text-purple-300 leading-relaxed">
                    تم إرسال طلب مراسلة إلى {activePartner.displayName}. لا يمكن بدء المحادثة المباشرة إلا بعد موافقته.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendRequest} className="w-full max-w-sm bg-[#170b2c] border border-purple-700/60 rounded-2xl p-4 space-y-3">
                  <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm text-white">إرسال طلب مراسلة</h4>
                  <p className="text-[11px] text-purple-300">
                    {existingRequest?.status === 'rejected'
                      ? 'تم رفض الطلب السابق. يمكنك إرسال طلب مراسلة جديد مع رسالة تعريفية.'
                      : 'تتطلب المحادثة الخاصة موافقة الطرف الآخر أولاً لحماية الخصوصية.'}
                  </p>
                  <textarea
                    value={requestIntroInput}
                    onChange={(e) => setRequestIntroInput(e.target.value)}
                    placeholder="اكتب رسالة تعريفية مع طلب المراسلة..."
                    rows={3}
                    className="w-full bg-[#120824] border border-purple-800/60 rounded-xl p-2.5 text-xs text-white placeholder-purple-400/50 outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs shadow-md"
                  >
                    إرسال طلب المراسلة
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-purple-400 text-xs">
                    <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
                    <span>بداية المحادثة الخاصة الآمنة بينكما</span>
                    <span className="text-[10px] text-purple-500 mt-1">الرسائل متزامنة ومحمية بالكامل</span>
                  </div>
                ) : (
                  activeMessages.map(msg => {
                    const isMe = msg.senderUid === currentUser.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs shadow-md ${
                            isMe
                              ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-br-none'
                              : 'bg-[#1b1035] text-purple-100 border border-purple-800/50 rounded-bl-none'
                          }`}
                        >
                          {msg.type === 'image' && msg.mediaUrl ? (
                            <img
                              src={msg.mediaUrl}
                              alt="Attachment"
                              className="w-48 h-32 object-cover rounded-xl mb-1.5"
                            />
                          ) : null}
                          <p className="leading-relaxed">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-purple-200/60 font-digits">
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              msg.status === 'read' ? (
                                <CheckCheck className="w-3 h-3 text-cyan-300" />
                              ) : (
                                <Check className="w-3 h-3 text-purple-300" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="bg-[#170b2c] p-2.5 border-t border-purple-800/40 flex items-center gap-2">
                <label
                  className="p-2 rounded-xl bg-purple-900/40 text-purple-300 hover:text-amber-400 hover:bg-purple-800/50 transition-colors cursor-pointer"
                  title="إرفاق صورة من جهازك"
                >
                  <input type="file" accept="image/*" onChange={handleImageFileSelect} className="hidden" />
                  <ImageIcon className="w-4 h-4" />
                </label>
                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className={`p-2 rounded-xl transition-all ${
                    isSendingVoice
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-purple-900/40 text-purple-300 hover:text-amber-400'
                  }`}
                  title="إرسال تسجيل صوتي"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="اكتب رسالتك الخاصة هنا..."
                  className="flex-1 bg-[#120824] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white hover:scale-105 transition-all shadow-md"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          <div className="space-y-2.5 mb-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-white">الرسائل والمحادثات</h2>
              <span className="text-xs text-purple-300 font-digits">
                {threads.length} محادثات نشطة
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم المعرف UID أو اسم المستخدم..."
                className="w-full bg-[#170b2c] border border-purple-800/60 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-purple-400/50 outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {searchQuery.trim() && (
            <div className="bg-[#170b2c] border border-purple-700/60 rounded-2xl p-2 mb-3 shadow-xl max-h-44 overflow-y-auto space-y-1">
              <span className="text-[10px] text-amber-300 font-bold px-2 block">نتائج البحث بالمعرف:</span>
              {searchResults.length === 0 ? (
                <p className="text-xs text-purple-400 text-center py-2">لا يوجد مستخدم مطابق للمعرف أو الاسم</p>
              ) : (
                searchResults.map(user => {
                  const canChat = livoStore.canChatPrivately(currentUser.uid, user.uid);
                  return (
                    <button
                      key={user.uid}
                      onClick={() => {
                        setActivePartner(user);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-purple-900/50 text-right transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <img src={user.avatar} alt={user.displayName} className="w-8 h-8 rounded-full border border-purple-500" />
                        <div>
                          <span className="text-xs font-bold text-white block">{user.displayName}</span>
                          <span className="text-[10px] text-purple-300 font-digits">UID: {user.uid} • @{user.username}</span>
                        </div>
                      </div>
                      <span className="text-xs text-amber-400 font-bold">
                        {canChat ? 'فتح الدردشة' : 'طلب مراسلة'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2">
            {threads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-purple-400 text-xs text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-300">
                  <User className="w-6 h-6" />
                </div>
                <span>لا توجد رسائل سابقة</span>
                <span className="text-[11px] text-purple-400">ابحث عن مستخدم برقم المعرف لإرسال طلب مراسلة</span>
              </div>
            ) : (
              threads.map(thread => (
                <button
                  key={thread.participantUid}
                  onClick={() => {
                    const partner = livoStore.getUserByUid(thread.participantUid);
                    if (partner) setActivePartner(partner);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#170b2c]/80 hover:bg-[#1f103b] border border-purple-800/40 hover:border-purple-600 transition-all text-right group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={thread.participantAvatar}
                        alt={thread.participantName}
                        className="w-11 h-11 rounded-full object-cover border border-purple-500"
                      />
                      {thread.participantVerified && (
                        <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] text-white">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {thread.participantName}
                        </span>
                        <span className="text-[10px] text-purple-400 font-digits">
                          (UID: {thread.participantUid})
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-300/80 truncate max-w-[190px]">
                        {thread.lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="text-left flex flex-col items-end gap-1">
                    <span className="text-[10px] text-purple-400 font-digits">
                      {new Date(thread.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-digits font-black text-[9px] flex items-center justify-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showReportModal && activePartner && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#170b2c] border border-purple-700/60 rounded-2xl p-5 w-full max-w-sm text-center space-y-3 shadow-2xl">
            <h3 className="font-black text-sm text-white">حماية وأمان المحادثة</h3>
            <p className="text-xs text-purple-200">
              يمكنك حظر المستخدم ({activePartner.displayName}) أو إرسال بلاغ للإدارة للمراجعة الفورية.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  livoStore.submitSupportTicket({
                    uid: currentUser.uid,
                    category: 'report',
                    subject: `بلاغ عن المحادثة مع UID: ${activePartner.uid}`,
                    message: `تم الإبلاغ عن المستخدم ${activePartner.displayName} (${activePartner.uid}) من المحادثات الخاصة.`,
                    priority: 'high'
                  });
                  setShowReportModal(false);
                  showToast('تم إرسال البلاغ للإدارة بنجاح ✓');
                }}
                className="py-2 rounded-xl bg-amber-500 text-black font-black text-xs"
              >
                إرسال بلاغ للإدارة
              </button>
              <button
                onClick={() => {
                  livoStore.toggleBlockUser(currentUser.uid, activePartner.uid);
                  setShowReportModal(false);
                  setActivePartner(null);
                  showToast('تم حظر المستخدم بنجاح ✓');
                }}
                className="py-2 rounded-xl bg-red-600 text-white font-black text-xs"
              >
                حظر المستخدم
              </button>
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full py-2 rounded-xl bg-purple-900/50 text-purple-200 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
