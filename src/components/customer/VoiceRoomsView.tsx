import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Lock,
  Unlock,
  Volume2,
  Users,
  Shield,
  Send,
  Radio,
  Sparkles,
  ArrowRight,
  UserX,
  Flame,
  Grid
} from 'lucide-react';
import { VoiceRoom, UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface VoiceRoomsViewProps {
  currentUser: UserProfile;
}

export const VoiceRoomsView: React.FC<VoiceRoomsViewProps> = ({ currentUser }) => {
  const rooms = livoStore.getRooms();
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [roomChatText, setRoomChatText] = useState('');
  const [roomMessages, setRoomMessages] = useState<Array<{ id: string; sender: string; text: string; isOfficial?: boolean }>>([
    { id: '1', sender: 'LIVO Official Admin', text: 'أهلاً بكم في الغرفة الرسمية لإدارة LIVO. نرجو الالتزام بقواعد الاحترام 🛡️', isOfficial: true },
    { id: '2', sender: 'أحمد شاهين', text: 'مساء الخير للجميع، منصة ممتازة بالتوفيق 🌟' },
  ]);

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'supervisor';
  const officialRoom = rooms.find(r => r.isOfficial) || rooms[0];

  const handleSeatClick = (seatIndex: number) => {
    if (!activeRoom) return;
    const seat = activeRoom.seats[seatIndex];

    if (seat.isLocked && !isOwnerOrAdmin) {
      alert('هذا المايك مقفل بواسطة الإدارة');
      return;
    }

    if (seat.occupiedByUid === currentUser.uid) {
      // Leave seat
      livoStore.updateRoomSeat(activeRoom.id, seatIndex, undefined);
    } else if (!seat.occupiedByUid) {
      // Take seat
      livoStore.updateRoomSeat(activeRoom.id, seatIndex, currentUser.uid);
    }
  };

  const handleAdminToggleSeatLock = (seatIndex: number, currentLocked: boolean) => {
    if (!activeRoom || !isOwnerOrAdmin) return;
    livoStore.updateRoomSeat(activeRoom.id, seatIndex, activeRoom.seats[seatIndex].occupiedByUid, !currentLocked);
  };

  const handleAdminKickUser = (seatIndex: number) => {
    if (!activeRoom || !isOwnerOrAdmin) return;
    livoStore.updateRoomSeat(activeRoom.id, seatIndex, undefined);
  };

  const handleSendRoomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomChatText.trim()) return;
    if (activeRoom?.allChatDisabled && !isOwnerOrAdmin) {
      alert('تم تعطيل الكتابة مؤقتاً في الغرفة بواسطة الإدارة');
      return;
    }

    setRoomMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        sender: currentUser.displayName,
        text: roomChatText.trim(),
        isOfficial: isOwnerOrAdmin
      }
    ]);
    setRoomChatText('');
  };

  return (
    <div className="flex flex-col h-[620px] bg-[#0c0517] rounded-2xl border border-purple-900/50 overflow-hidden text-white shadow-2xl">
      {activeRoom ? (
        /* Inside Voice Room Screen */
        <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
          {/* Room Header Info */}
          <div className="bg-[#170b2c]/90 rounded-2xl p-3 border border-purple-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveRoom(null)}
                className="w-8 h-8 rounded-full bg-purple-900/40 hover:bg-purple-800 flex items-center justify-center text-purple-300"
                title="الرجوع لقائمة الغرف"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative">
                <img
                  src={activeRoom.ownerAvatar}
                  alt={activeRoom.ownerName}
                  className="w-10 h-10 rounded-full border-2 border-amber-400"
                />
                {activeRoom.isOfficial && (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black rounded-full p-0.5">
                    <Shield className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-white">{activeRoom.title}</h3>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    activeRoom.status === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {activeRoom.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/80">
                  المضيف: <span className="text-amber-300 font-semibold">{activeRoom.ownerName}</span>
                </p>
              </div>
            </div>

            {/* Admin Controls on Room */}
            {isOwnerOrAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = activeRoom.status === 'open' ? 'closed' : 'open';
                    livoStore.setOfficialRoomStatus(next);
                  }}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                    activeRoom.status === 'open'
                      ? 'bg-red-950/60 text-red-300 border-red-700/50 hover:bg-red-900/60'
                      : 'bg-green-950/60 text-green-300 border-green-700/50 hover:bg-green-900/60'
                  }`}
                  title="قفل/فتح الغرفة دون حذف بياناتها"
                >
                  {activeRoom.status === 'open' ? 'قفل الغرفة' : 'فتح الغرفة'}
                </button>
              </div>
            )}
          </div>

          {/* Announcement Banner */}
          {activeRoom.announcement && (
            <div className="my-2 bg-gradient-to-r from-purple-950/80 via-amber-950/40 to-purple-950/80 px-3 py-1.5 rounded-xl border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span className="truncate">{activeRoom.announcement}</span>
            </div>
          )}

          {/* 8 Mic Seats Grid */}
          <div className="grid grid-cols-4 gap-2.5 my-2">
            {activeRoom.seats.map((seat, index) => {
              const isOccupied = !!seat.occupiedByUid;
              const isMe = seat.occupiedByUid === currentUser.uid;

              return (
                <div
                  key={index}
                  className={`relative p-2 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                    isOccupied
                      ? 'bg-purple-900/30 border-purple-600/50 shadow-md'
                      : seat.isLocked
                      ? 'bg-black/40 border-red-900/40 text-gray-500'
                      : 'bg-[#120824]/60 border-purple-900/40 hover:border-purple-600/60'
                  }`}
                >
                  {/* Avatar / Empty Seat Slot */}
                  <div
                    onClick={() => handleSeatClick(index)}
                    className="relative w-11 h-11 rounded-full flex items-center justify-center cursor-pointer group"
                  >
                    {isOccupied ? (
                      <div className="relative">
                        <img
                          src={seat.occupiedByAvatar}
                          alt={seat.occupiedByName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 ring-2 ring-purple-600/40"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border border-black flex items-center justify-center text-[8px]">
                          <Mic className="w-2 h-2 text-white" />
                        </span>
                      </div>
                    ) : seat.isLocked ? (
                      <div className="w-11 h-11 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-purple-950/50 border border-purple-800/60 group-hover:border-amber-400 flex items-center justify-center text-purple-400 group-hover:text-amber-400 transition-colors">
                        <MicOff className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Seat Label */}
                  <span className="text-[10px] font-bold text-white mt-1 truncate max-w-full text-center">
                    {isOccupied ? (isMe ? 'أنا' : seat.occupiedByName) : seat.isLocked ? 'مقفل' : `مايك ${index + 1}`}
                  </span>

                  {/* Admin Seat Controls */}
                  {isOwnerOrAdmin && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => handleAdminToggleSeatLock(index, seat.isLocked)}
                        className="text-[9px] text-purple-400 hover:text-amber-300"
                        title={seat.isLocked ? "فتح المايك" : "قفل المايك"}
                      >
                        {seat.isLocked ? <Unlock className="w-3 h-3 text-green-400" /> : <Lock className="w-3 h-3 text-red-400" />}
                      </button>
                      {isOccupied && (
                        <button
                          onClick={() => handleAdminKickUser(index)}
                          className="text-[9px] text-red-400 hover:text-red-300"
                          title="إنزال المستخدم من المايك"
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Room Live Chat Feed */}
          <div className="flex-1 bg-[#120824]/80 rounded-2xl border border-purple-900/50 p-2.5 flex flex-col justify-between overflow-hidden">
            <div className="overflow-y-auto space-y-1.5 max-h-32 pr-1">
              {roomMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`text-xs px-2.5 py-1 rounded-xl max-w-[90%] ${
                    msg.isOfficial
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                      : 'bg-purple-950/60 border border-purple-800/40 text-purple-100'
                  }`}
                >
                  <span className="font-bold text-amber-400 ml-1.5">{msg.sender}:</span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendRoomChat} className="mt-2 flex items-center gap-1.5 bg-[#170b2c] border border-purple-800/60 rounded-xl px-2.5 py-1">
              <input
                type="text"
                value={roomChatText}
                onChange={(e) => setRoomChatText(e.target.value)}
                placeholder="تحدث في دردشة الغرفة..."
                className="w-full bg-transparent text-xs text-white placeholder-purple-400/50 outline-none"
              />
              <button type="submit" className="text-purple-300 hover:text-amber-400 p-1">
                <Send className="w-3.5 h-3.5 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 12-Room Grid View as requested in item 8 & 23 */
        <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3">
          {/* Top Pinned Official Room Banner */}
          <div
            onClick={() => setActiveRoom(officialRoom)}
            className="cursor-pointer bg-gradient-to-r from-purple-900/90 via-amber-950/80 to-purple-950/90 border-2 border-amber-500/60 hover:border-amber-400 p-3 rounded-2xl shadow-lg transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={officialRoom.ownerAvatar}
                  alt={officialRoom.ownerName}
                  className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black rounded-full p-0.5">
                  <Shield className="w-3.5 h-3.5 fill-current" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                    {officialRoom.title}
                  </h3>
                  <span className="text-[10px] bg-amber-500 text-black font-extrabold px-1.5 py-0.2 rounded-full">
                    مثبت رسمي
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 mt-0.5">
                  الغرفة الرسمية المعتمدة للمنصة والإعلانات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>دخول</span>
            </div>
          </div>

          {/* Section Header: 12-Box Grid */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-purple-400" />
              <h3 className="font-extrabold text-sm text-white">شبكة الغرف الصوتية (12 غرفة)</h3>
            </div>
            <span className="text-[11px] text-purple-400 font-digits">
              {rooms.length} غرف نشطة
            </span>
          </div>

          {/* The 12-Room Cards Grid (3 cols on desktop/tablet, 2 cols on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`cursor-pointer p-3 rounded-2xl border text-right transition-all flex flex-col justify-between hover:scale-[1.02] ${
                  room.isOfficial
                    ? 'bg-[#1a0f35] border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-[#140a2a]/90 hover:bg-[#1c0e3a] border-purple-800/40 hover:border-purple-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <img
                      src={room.ownerAvatar}
                      alt={room.ownerName}
                      className="w-9 h-9 rounded-full object-cover border border-purple-500"
                    />
                    <span className="text-[9px] font-digits font-bold bg-black/40 text-purple-300 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-800/40">
                      <Users className="w-2.5 h-2.5" />
                      <span>{Math.floor(12 + idx * 7)}</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-white truncate mb-0.5">
                    {room.title}
                  </h4>
                  <span className="text-[10px] text-purple-300 block truncate">
                    المضيف: {room.ownerName}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-purple-900/40 flex items-center justify-between text-[9px]">
                  <span className="text-amber-400 font-semibold">{room.category}</span>
                  <span className="text-purple-400 flex items-center gap-0.5">
                    <Mic className="w-2.5 h-2.5" /> 8 مايك
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
