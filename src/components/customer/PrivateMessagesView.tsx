import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { UserProfile, DirectMessage, ChatThread } from '../../types';
import { livoStore } from '../../services/livoStore';

interface PrivateMessagesViewProps {
  currentUser: UserProfile;
}

export const PrivateMessagesView: React.FC<PrivateMessagesViewProps> = ({ currentUser }) => {
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSendingVoice, setIsSendingVoice] = useState(false);

  const threads = livoStore.getChatThreads(currentUser.uid);
  const allUsers = livoStore.getUsers().filter(u => u.uid !== currentUser.uid);

  // Search Results
  const searchResults = searchQuery.trim()
    ? allUsers.filter(u =>
        u.uid.includes(searchQuery.trim()) ||
        u.username.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const activeMessages = activePartner
    ? livoStore.getChatMessages(currentUser.uid, activePartner.uid)
    : [];

  const handleSendMessage = (e: React.FormEvent, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string) => {
    e.preventDefault();
    if (!activePartner) return;
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
    setIsSendingVoice(true);
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {} } as any, 'voice');
      setIsSendingVoice(false);
    }, 1200);
  };

  const handleSendImage = () => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&fit=crop',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop'
    ];
    const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    handleSendMessage({ preventDefault: () => {} } as any, 'image', randomImg);
  };

  return (
    <div className="flex flex-col h-[620px] bg-[#0c0517] rounded-2xl border border-purple-900/50 overflow-hidden text-white shadow-2xl">
      {activePartner ? (
        /* Active 1-on-1 Chat Screen */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Chat Header */}
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
              onClick={() => alert(`تم الإبلاغ عن المحادثة مع UID: ${activePartner.uid}`)}
              className="text-purple-400 hover:text-red-400 p-1.5"
              title="إبلاغ أو حظر"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-purple-400 text-xs">
                <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
                <span>بداية المحادثة الخاصة الآمنة بينكما</span>
                <span className="text-[10px] text-purple-500 mt-1">الرسائل مشفرة ومحمية بالكامل</span>
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

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="bg-[#170b2c] p-2.5 border-t border-purple-800/40 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendImage}
              className="p-2 rounded-xl bg-purple-900/40 text-purple-300 hover:text-amber-400 hover:bg-purple-800/50 transition-colors"
              title="إرفاق صورة"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
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
        </div>
      ) : (
        /* Chat Threads List & User Search */
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          {/* Header & Search */}
          <div className="space-y-2.5 mb-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-white">الرسائل والمحادثات</h2>
              <span className="text-xs text-purple-300 font-digits">
                {threads.length} محادثات نشطة
              </span>
            </div>

            {/* Search Input by UID or Username */}
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

          {/* Search Results Dropdown */}
          {searchQuery.trim() && (
            <div className="bg-[#170b2c] border border-purple-700/60 rounded-2xl p-2 mb-3 shadow-xl max-h-44 overflow-y-auto space-y-1">
              <span className="text-[10px] text-amber-300 font-bold px-2 block">نتائج البحث بالمعرف:</span>
              {searchResults.length === 0 ? (
                <p className="text-xs text-purple-400 text-center py-2">لا يوجد مستخدم مطابق للمعرف أو الاسم</p>
              ) : (
                searchResults.map(user => (
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
                    <span className="text-xs text-amber-400 font-bold">بدء المحادثة</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {threads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-purple-400 text-xs text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-300">
                  <User className="w-6 h-6" />
                </div>
                <span>لا توجد رسائل سابقة</span>
                <span className="text-[11px] text-purple-400">ابحث عن مستخدم برقم المعرف لبدء المحادثة الآن</span>
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
    </div>
  );
};
