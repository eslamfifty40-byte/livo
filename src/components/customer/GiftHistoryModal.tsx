import React, { useState } from 'react';
import { X, Gift, ArrowUpRight, ArrowDownLeft, Sparkles, Filter } from 'lucide-react';
import { UserProfile, CoinAuditRecord } from '../../types';
import { livoStore } from '../../services/livoStore';

interface GiftHistoryModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const GiftHistoryModal: React.FC<GiftHistoryModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');

  if (!isOpen) return null;

  const allAudits = livoStore.getCoinAudits(user.uid);
  const giftRecords = allAudits.filter(
    a => a.actionType === 'gift_send' ||
         a.actionType === 'gift_receive' ||
         a.reason.includes('هدية') ||
         a.reason.includes('Gift')
  );

  const filtered = giftRecords.filter(r => {
    if (filterType === 'sent') return r.coinsChange < 0;
    if (filterType === 'received') return r.coinsChange > 0;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-lg bg-gradient-to-b from-[#181028] via-[#120B20] to-[#0A0512] text-white rounded-t-3xl sm:rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-purple-500/20 bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 p-0.5 shadow-lg shadow-pink-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                سجل الهدايا الخاصة
              </h2>
              <p className="text-[11px] text-purple-300/80">
                سجل الهدايا المرسلة والمستلمة في الغرف والبثوث
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center px-4 pt-3 gap-2 border-b border-purple-500/20 bg-[#0E0618]">
          <button
            onClick={() => setFilterType('all')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              filterType === 'all'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            جميع الهدايا ({giftRecords.length})
          </button>
          <button
            onClick={() => setFilterType('sent')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              filterType === 'sent'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            الهدايا المرسلة
          </button>
          <button
            onClick={() => setFilterType('received')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              filterType === 'received'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            الهدايا المستلمة
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Gift className="w-10 h-10 text-purple-400/30 mx-auto" />
              <p className="text-xs text-purple-300/60">
                لا توجد سجلات هدايا في هذا القسم حتى الآن.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filtered.map((r) => {
                const isSent = r.coinsChange < 0;
                return (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl bg-white/5 border border-purple-500/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSent
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isSent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-white">
                          {r.reason}
                        </h4>
                        <span className="text-[10px] font-digits text-purple-300/80 block">
                          {new Date(r.timestamp).toLocaleString('en-GB')}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-digits">
                      <span
                        className={`text-sm font-black ${
                          isSent ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isSent ? '' : '+'}
                        {r.coinsChange.toLocaleString('en-US')}
                      </span>
                      <span className="text-[10px] text-purple-300/80 block">كوينز</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-purple-500/20 bg-purple-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
