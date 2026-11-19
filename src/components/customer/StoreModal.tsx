import React, { useState } from 'react';
import { X, ShoppingBag, Sparkles, Check, Coins, AlertCircle, RefreshCw } from 'lucide-react';
import { UserProfile, StoreItem, GiftItem } from '../../types';
import { livoStore } from '../../services/livoStore';

interface StoreModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecharge: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenRecharge
}) => {
  const [storeItems, setStoreItems] = useState<StoreItem[]>(() => livoStore.getActiveStoreItems());
  const [gifts, setGifts] = useState<GiftItem[]>(() => livoStore.getActiveGifts());
  const [activeTab, setActiveTab] = useState<'all' | 'frames' | 'entrances' | 'gifts'>('all');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Real-time synchronization when Admin updates store items or gifts
  React.useEffect(() => {
    const unsub = livoStore.subscribe(() => {
      setStoreItems(livoStore.getActiveStoreItems());
      setGifts(livoStore.getActiveGifts());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const showFeedback = (success: boolean, message: string) => {
    setFeedback({ success, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleBuy = (item: StoreItem) => {
    if (user.coins < item.priceCoins) {
      showFeedback(false, `رصيد الكوينز غير كافٍ. يتطلب ${item.priceCoins.toLocaleString()} كوينز.`);
      setTimeout(() => onOpenRecharge(), 1200);
      return;
    }

    const res = livoStore.buyStoreItem(user.uid, item.id, item.type, item.priceCoins);
    showFeedback(res.success, res.message);
  };

  const filteredStoreItems = storeItems.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'frames') return item.type === 'frame';
    if (activeTab === 'entrances') return item.type === 'entrance';
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in">
      <div className="bg-[#170b2c] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-purple-800/60 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-purple-800/40 flex items-center justify-between bg-[#1f103b]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">متجر LIVO للإطارات والدخلات</h2>
              <p className="text-xs text-purple-300">
                رصيدك المتاح: <strong className="font-digits text-amber-300">{user.coins.toLocaleString()}</strong> كوينز
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-900/50 hover:bg-purple-800 flex items-center justify-center text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtabs Bar */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-2 bg-[#170b2c] border-b border-purple-900/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all' ? 'bg-[#FFE600] text-black shadow-sm' : 'text-purple-300 hover:text-white bg-purple-950/40'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setActiveTab('frames')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'frames' ? 'bg-[#FFE600] text-black shadow-sm' : 'text-purple-300 hover:text-white bg-purple-950/40'
            }`}
          >
            إطارات الملف والغرف
          </button>
          <button
            onClick={() => setActiveTab('entrances')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'entrances' ? 'bg-[#FFE600] text-black shadow-sm' : 'text-purple-300 hover:text-white bg-purple-950/40'
            }`}
          >
            الدخلات الملكية
          </button>
          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'gifts' ? 'bg-[#FFE600] text-black shadow-sm' : 'text-purple-300 hover:text-white bg-purple-950/40'
            }`}
          >
            كتالوج الهدايا
          </button>
        </div>

        {/* Toast Feedback */}
        {feedback && (
          <div className={`mx-4 mt-2 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            feedback.success ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
          }`}>
            {feedback.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Area with Robust Fallback (No White Screen) */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {activeTab === 'gifts' ? (
            /* Gifts Catalog View */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {gifts.map((g) => (
                <div
                  key={g.id}
                  className="bg-[#120824]/90 p-3 rounded-2xl border border-purple-800/40 flex flex-col items-center text-center gap-1.5"
                >
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt={g.name} className="w-12 h-12 object-contain filter drop-shadow" />
                  ) : (
                    <span className="text-4xl filter drop-shadow">{g.icon}</span>
                  )}
                  <span className="font-bold text-xs text-white truncate max-w-full">{g.name}</span>
                  <span className="font-digits font-black text-amber-300 text-xs">{g.coins.toLocaleString()} 🪙</span>
                  <span className="text-[10px] text-purple-400 font-sans">تأثير {g.animationType}</span>
                </div>
              ))}
            </div>
          ) : filteredStoreItems.length === 0 ? (
            <div className="text-center py-12 text-purple-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-xs font-bold">لا توجد عناصر معروضة حالياً في هذا القسم</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStoreItems.map((item) => {
                const isEquipped = user.equippedFrame === item.id || user.equippedEntrance === item.id;
                const canAfford = user.coins >= item.priceCoins;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'bg-purple-900/40 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-[#120824]/80 border-purple-800/40 hover:border-purple-600'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-4xl filter drop-shadow-md">{item.image}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{item.name}</span>
                          {isEquipped && (
                            <span className="text-[9px] bg-green-500/20 text-green-300 border border-green-500/30 px-1 rounded font-bold">
                              مُجهز
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-purple-400 block mt-0.5">
                          {item.type === 'frame' ? 'إطار الملف والغرف' : 'دخلة روم أسطورية'}
                        </span>
                        <p className="text-[11px] text-purple-200/80 mt-1 leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-purple-900/40">
                      <div className="flex items-center gap-1 text-amber-300">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="font-digits font-extrabold text-xs">
                          {item.priceCoins.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuy(item)}
                        disabled={isEquipped}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                          isEquipped
                            ? 'bg-purple-950/50 text-purple-400 border border-purple-800 cursor-default'
                            : canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black shadow-md'
                            : 'bg-purple-900/60 text-purple-300 hover:bg-purple-800 border border-purple-700'
                        }`}
                      >
                        {isEquipped ? 'مفعل لديك' : canAfford ? 'شراء وتجهيز' : 'شحن وشراء'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
