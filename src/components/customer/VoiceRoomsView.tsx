import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Lock,
  Unlock,
  Users,
  Shield,
  Send,
  Radio,
  ArrowRight,
  UserX,
  Grid
} from 'lucide-react';
import { VoiceRoom, UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface VoiceRoomsViewProps {
  currentUser: UserProfile;
}

export const VoiceRoomsView: React.FC<VoiceRoomsViewProps> = ({ currentUser }) => {
  const [rooms, setRooms] = useState<VoiceRoom[]>(livoStore.getRooms());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomChatText, setRoomChatText] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = livoStore.subscribe(() => {
      setRooms([...livoStore.getRooms()]);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'supervisor';
  const officialRoom = rooms.find(r => r.isOfficial || r.id === 'room-official-livo') || rooms[0];
  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) || null : null;

  const handleSeatClick = (seatIndex: number) => {
    if (!activeRoom) return;
    const seat = activeRoom.seats[seatIndex];
    if (!seat) return;

    if (seat.occupiedByUid === currentUser.uid) {
      const muted = livoStore.toggleSeatMute(activeRoom.id, seatIndex);
      showToast(muted ? 'تم كتم المايك 🔇' : 'تم فتح المايك 🎙️');
      return;
    }

    if (seat.isLocked && !isOwnerOrAdmin) {
      showToast('هذا المايك مقفل بواسطة الإدارة');
      return;
    }

    if (!seat.occupiedByUid) {
      const res = livoStore.joinRoomSeat(activeRoom.id, seatIndex, currentUser.uid);
      showToast(res.message);
    }
  };

  const handleSendRoomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !roomChatText.trim()) return;
    if (activeRoom.allChatDisabled && !isOwnerOrAdmin) {
      showToast('تم تعطيل الكتابة مؤقتاً في الغرفة بواسطة الإدارة');
      return;
    }

    livoStore.appendRoomMessage(activeRoom.id, {
      uid: currentUser.uid,
      user: currentUser.displayName,
      text: roomChatText.trim(),
      isVip: isOwnerOrAdmin
    });
    setRoomChatText('');
  };

  return (
    <div className="flex flex-col h-[620px] bg-[#0c0517] rounded-2xl border border-purple-900/50 overflow-hidden text-white shadow-2xl relative">
      {toastMsg && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
          {toastMsg}
        </div>
      )}

      {activeRoom ? (
        <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
          <div className="bg-[#170b2c]/90 rounded-2xl p-3 border border-purple-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  livoStore.leaveRoomSeat(activeRoom.id, currentUser.uid);
                  setActiveRoomId(null);
                }}
                className="w-8 h-8 rounded-full bg-purple-900/40 hover:bg-purple-800 flex items-center justify-center text-purple-300"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <img
                src={activeRoom.ownerAvatar}
                alt={activeRoom.ownerName}
                className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover"
              />
              <div>
                <h3 className="font-extrabold text-xs text-white">{activeRoom.title}</h3>
                <p className="text-[11px] text-purple-300/80">
                  المضيف: <span className="text-amber-300 font-semibold">{activeRoom.ownerName}</span>
                </p>
              </div>
            </div>

            {isOwnerOrAdmin && activeRoom.isOfficial && (
              <button
                onClick={() => {
                  const next = activeRoom.status === 'open' ? 'closed' : 'open';
                  livoStore.setOfficialRoomStatus(next);
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                  activeRoom.status === 'open'
                    ? 'bg-red-950/60 text-red-300 border-red-700/50'
                    : 'bg-green-950/60 text-green-300 border-green-700/50'
                }`}
              >
                {activeRoom.status === 'open' ? 'قفل الغرفة' : 'فتح الغرفة'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2.5 my-2">
            {activeRoom.seats.slice(0, 12).map((seat, index) => {
              const isOccupied = !!seat.occupiedByUid;
              const isMe = seat.occupiedByUid === currentUser.uid;

              return (
                <div
                  key={index}
                  className={`relative p-2 rounded-2xl flex flex-col items-center justify-center border ${
                    isOccupied
                      ? 'bg-purple-900/30 border-purple-600/50'
                      : seat.isLocked
                      ? 'bg-black/40 border-red-900/40 text-gray-500'
                      : 'bg-[#120824]/60 border-purple-900/40'
                  }`}
                >
                  <div
                    onClick={() => handleSeatClick(index)}
                    className="relative w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
                  >
                    {isOccupied ? (
                      <div className="relative">
                        <img
                          src={seat.occupiedByAvatar || '/assets/livo/customer_icon.jpg'}
                          alt={seat.occupiedByName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-amber-400"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center ${
                          seat.isMuted ? 'bg-red-600' : 'bg-green-500'
                        }`}>
                          {seat.isMuted ? <MicOff className="w-2 h-2 text-white" /> : <Mic className="w-2 h-2 text-white" />}
                        </span>
                      </div>
                    ) : seat.isLocked ? (
                      <Lock className="w-4 h-4 text-red-400" />
                    ) : (
                      <MicOff className="w-4 h-4 text-purple-400" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-white mt-1 truncate max-w-full text-center">
                    {isOccupied ? (isMe ? 'أنا' : seat.occupiedByName) : seat.isLocked ? 'مقفل' : `مايك ${index + 1}`}
                  </span>

                  {isOwnerOrAdmin && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => livoStore.toggleSeatLock(activeRoom.id, index)}
                        className="text-[9px]"
                      >
                        {seat.isLocked ? <Unlock className="w-3 h-3 text-green-400" /> : <Lock className="w-3 h-3 text-red-400" />}
                      </button>
                      {isOccupied && !isMe && (
                        <button
                          onClick={() => livoStore.kickFromSeat(activeRoom.id, index)}
                          className="text-[9px] text-red-400"
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

          <div className="flex-1 bg-[#120824]/80 rounded-2xl border border-purple-900/50 p-2.5 flex flex-col justify-between overflow-hidden">
            <div className="overflow-y-auto space-y-1.5 max-h-32 pr-1">
              {(activeRoom.messages || []).map(msg => (
                <div
                  key={msg.id}
                  className="text-xs px-2.5 py-1 rounded-xl max-w-[90%] bg-purple-950/60 border border-purple-800/40 text-purple-100"
                >
                  <span className="font-bold text-amber-400 ml-1.5">{msg.user}:</span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>

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
        <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3">
          {officialRoom && (
            <div
              onClick={() => setActiveRoomId(officialRoom.id)}
              className="cursor-pointer bg-gradient-to-r from-purple-900/90 via-amber-950/80 to-purple-950/90 border-2 border-amber-500/60 p-3 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={officialRoom.ownerAvatar}
                  alt={officialRoom.ownerName}
                  className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-white">{officialRoom.title}</h3>
                  <p className="text-xs text-purple-200/90 mt-0.5">الغرفة الرسمية المعتمدة</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl text-amber-300 text-xs font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>دخول</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-purple-400" />
              <h3 className="font-extrabold text-sm text-white">الغرف الصوتية</h3>
            </div>
            <span className="text-[11px] text-purple-400 font-digits">{rooms.length} غرفة</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className="cursor-pointer p-3 rounded-2xl border bg-[#140a2a]/90 border-purple-800/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <img
                      src={room.ownerAvatar}
                      alt={room.ownerName}
                      className="w-9 h-9 rounded-full object-cover border border-purple-500"
                    />
                    <span className="text-[9px] font-digits font-bold bg-black/40 text-purple-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />
                      <span>{room.seats.filter(s => s.occupiedByUid).length}</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white truncate">{room.title}</h4>
                  <span className="text-[10px] text-purple-300 block truncate">{room.ownerName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
