import React, { useState } from 'react';
import { X, Megaphone, Plus, Trash2, Edit2, ExternalLink, Calendar, Eye, MousePointerClick, CheckCircle, AlertTriangle } from 'lucide-react';
import { Advertisement, UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';

interface AdCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const AdCenterModal: React.FC<AdCenterModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [ads, setAds] = useState<Advertisement[]>(() => livoStore.getAdvertisements(false));
  const [isCreating, setIsCreating] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [placement, setPlacement] = useState<'banner' | 'popup' | 'feed'>('banner');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteAdConfirmId, setDeleteAdConfirmId] = useState<string | null>(null);
  const [adLinkNotice, setAdLinkNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = currentUser.role === 'owner' || livoStore.isOwnerEmail(currentUser.email);

  const handleSaveAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      setErrorMsg('يرجى كتابة عنوان الإعلان وإدراج رابط الصورة');
      return;
    }

    if (editingAdId) {
      livoStore.updateAdvertisement(editingAdId, {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        targetUrl: targetUrl.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        placement
      });
      setEditingAdId(null);
    } else {
      livoStore.createAdvertisement({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        targetUrl: targetUrl.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        placement,
        createdBy: currentUser.displayName || currentUser.username
      });
    }

    setAds(livoStore.getAdvertisements(false));
    setIsCreating(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setTargetUrl('');
    setErrorMsg('');
  };

  const handleDeleteAd = (id: string) => {
    setDeleteAdConfirmId(id);
  };

  const confirmDeleteAd = () => {
    if (!deleteAdConfirmId) return;
    livoStore.deleteAdvertisement(deleteAdConfirmId);
    setAds(livoStore.getAdvertisements(false));
    setDeleteAdConfirmId(null);
  };

  const handleToggleStatus = (ad: Advertisement) => {
    const newStatus = ad.status === 'active' ? 'inactive' : 'active';
    livoStore.updateAdvertisement(ad.id, { status: newStatus });
    setAds(livoStore.getAdvertisements(false));
  };

  const handleAdClick = (ad: Advertisement) => {
    livoStore.recordAdClick(ad.id);
    if (ad.targetUrl) {
      navigator.clipboard?.writeText(ad.targetUrl);
      setAdLinkNotice(ad.targetUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in select-none">
      <div className="bg-white text-gray-900 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
        
        {/* Header */}
        <div className="bg-[#120824] text-white px-5 py-4 flex items-center justify-between border-b border-purple-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE600] flex items-center justify-center text-black">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">مركز الإعلانات والحملات الترويجية</h3>
              <p className="text-[10px] text-purple-300">منظومة الإعلانات الرسمية لمنصة LIVO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar for Admin */}
        {isOwner && !isCreating && (
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">إدارة الإعلانات المباشرة ({ads.length})</span>
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingAdId(null);
                setTitle('');
                setDescription('');
                setImageUrl('');
                setTargetUrl('');
              }}
              className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة إعلان جديد</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Create or Edit Form */}
          {isCreating && (
            <form onSubmit={handleSaveAd} className="bg-purple-50/50 border border-purple-200/60 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                <h4 className="font-black text-xs text-purple-950">
                  {editingAdId ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-gray-500 hover:text-black font-bold"
                >
                  إلغاء
                </button>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600 bg-red-100 p-2 rounded-xl flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">عنوان الإعلان *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مهرجان كوينز الصيف في LIVO ☀️"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FFE600]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">وصف الإعلان</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل العرض الترويجي..."
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FFE600]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">رابط صورة الإعلان (URL) *</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FFE600] font-mono text-[10px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">رابط الوجهة أو الصفحة (اختياري)</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FFE600] font-mono text-[10px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs outline-none font-digits"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs outline-none font-digits"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">موضع الظهور</label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as any)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs outline-none"
                >
                  <option value="banner">بانر علوي (Banner)</option>
                  <option value="popup">نافذة منبثقة (Popup)</option>
                  <option value="feed">في ساحة الاكتشاف (Feed)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-xs transition-all"
              >
                {editingAdId ? 'حفظ التعديلات' : 'نشر الإعلان فوراً في المنظومة'}
              </button>
            </form>
          )}

          {/* Advertisements List */}
          {ads.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-700" />
              <p className="font-bold text-xs text-gray-600">لا توجد إعلانات نشطة حالياً</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {isOwner
                  ? 'يمكنك كأدمن إضافة إعلانات وعروض ترويجية لتظهر فوراً لجميع المستخدمين.'
                  : 'تابع العروض والمهرجانات الترويجية القادمة قريباً في LIVO.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => {
                const now = new Date();
                const isDateActive = now >= new Date(ad.startDate) && now <= new Date(ad.endDate);
                const isEffectivelyActive = ad.status === 'active' && isDateActive;

                return (
                  <div
                    key={ad.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col"
                  >
                    {/* Banner Image */}
                    <div className="relative aspect-[16/7] w-full bg-gray-100 overflow-hidden cursor-pointer" onClick={() => handleAdClick(ad)}>
                      <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                            isEffectivelyActive
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-gray-800/80 text-gray-200'
                          }`}
                        >
                          {isEffectivelyActive ? 'نشط الآن ✓' : 'غير نشط أو منتهي'}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-digits px-2 py-0.5 rounded-full">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.viewsCount || 0}</span>
                        <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicksCount || 0}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-xs text-gray-900">{ad.title}</h4>
                          {ad.description && (
                            <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">{ad.description}</p>
                          )}
                        </div>
                        {ad.targetUrl && (
                          <button
                            onClick={() => handleAdClick(ad)}
                            className="bg-[#FFE600] hover:bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 flex items-center gap-1"
                          >
                            <span>فتح</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400 font-digits">
                        <span>من: {new Date(ad.startDate).toLocaleDateString()}</span>
                        <span>إلى: {new Date(ad.endDate).toLocaleDateString()}</span>
                      </div>

                      {/* Admin Controls */}
                      {isOwner && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <button
                            onClick={() => handleToggleStatus(ad)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              ad.status === 'active'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ad.status === 'active' ? 'إيقاف مؤقت' : 'تفعيل'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingAdId(ad.id);
                                setTitle(ad.title);
                                setDescription(ad.description);
                                setImageUrl(ad.imageUrl);
                                setTargetUrl(ad.targetUrl || '');
                                setStartDate(new Date(ad.startDate).toISOString().split('T')[0]);
                                setEndDate(new Date(ad.endDate).toISOString().split('T')[0]);
                                setPlacement(ad.placement);
                                setIsCreating(true);
                              }}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* In-app Delete Confirm Modal */}
      {deleteAdConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs text-center space-y-3 text-gray-900">
            <h4 className="font-black text-sm">تأكيد حذف الإعلان</h4>
            <p className="text-xs text-gray-600">هل أنت متأكد من حذف هذا الإعلان نهائياً؟</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteAdConfirmId(null)}
                className="py-2 rounded-xl bg-gray-100 text-gray-800 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteAd}
                className="py-2 rounded-xl bg-red-600 text-white font-black text-xs"
              >
                حذف الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Ad Target Link Info Modal (replaces window.open) */}
      {adLinkNotice && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm text-center space-y-3 text-gray-900">
            <h4 className="font-black text-sm">رابط العرض الترويجي</h4>
            <p className="text-xs text-gray-600 break-all bg-gray-50 p-2 rounded-xl border border-gray-200 font-mono">
              {adLinkNotice}
            </p>
            <p className="text-[11px] text-emerald-700 font-bold">تم نسخ الرابط للحافظة تلقائياً ✓</p>
            <button
              onClick={() => setAdLinkNotice(null)}
              className="w-full py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
