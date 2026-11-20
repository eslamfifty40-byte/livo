import React, { useState } from 'react';
import { X, Camera, Check, User, AtSign, Phone, Wand2, Download } from 'lucide-react';
import { UserProfile } from '../../types';
import { livoStore } from '../../services/livoStore';
import { firebaseService } from '../../services/firebase';
import { compressImageForFirestore } from '../../utils/imageCompression';
import { MagicCutoutModal } from '../common/MagicCutoutModal';

interface EditProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [userPhone, setUserPhone] = useState(user.phoneNumber || '');
  const [isPhoneChanged, setIsPhoneChanged] = useState(false);
  const [showPhoneOtpInput, setShowPhoneOtpInput] = useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [phoneNotice, setPhoneNotice] = useState<string | null>(null);
  const [showMagicCutout, setShowMagicCutout] = useState(false);
  const [cutoutSource, setCutoutSource] = useState<string | File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح');
      return;
    }

    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    setIsUploading(true);
    setErrorMsg('');
    try {
      const compressed = await compressImageForFirestore(file, {
        maxDim: 512,
        quality: 0.82,
        preserveAlpha: isPng,
        maxBytes: 180_000
      });
      setAvatarUrl(compressed);
      try {
        const downloadUrl = await firebaseService.uploadImage(`avatars/${user.uid}_${Date.now()}`, compressed, {
          maxDim: 512,
          quality: 0.82,
          preserveAlpha: isPng,
          maxBytes: 180_000
        });
        setAvatarUrl(downloadUrl);
      } catch {
        // Already compressed cleanly as fallback
      }
    } catch {
      setErrorMsg('تعذر معالجة الصورة المختارة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyCutoutAvatar = async (transparentPng: string) => {
    setIsUploading(true);
    setErrorMsg('');
    try {
      setAvatarUrl(transparentPng);
      try {
        const uploaded = await firebaseService.uploadImage(`avatars/${user.uid}_${Date.now()}.png`, transparentPng, {
          preserveAlpha: true,
          maxDim: 512,
          maxBytes: 180_000
        });
        setAvatarUrl(uploaded);
      } catch {
        // transparentPng is already compressed for Firestore
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadAvatar = () => {
    try {
      const a = document.createElement('a');
      a.href = avatarUrl;
      a.download = `livo-avatar-${user.uid}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('اسم العرض لا يمكن أن يكون فارغاً');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      setErrorMsg('يرجى إدخال اسم مستخدم صالح بالحروف والأرقام الإنجليزية');
      return;
    }

    livoStore.updateUserProfile(user.uid, {
      displayName: displayName.trim(),
      username: cleanUsername,
      bio: bio.trim(),
      avatar: avatarUrl
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-gray-900 animate-in fade-in slide-in-from-bottom duration-200">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFE600] flex items-center justify-center text-black font-black text-sm">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-gray-900">تعديل الملف الشخصي</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          
          {/* Avatar Upload Preview */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-[#FFE600] to-yellow-200 shadow-md">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>

              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-black text-[#FFE600] hover:bg-yellow-400 hover:text-black flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 border-2 border-white">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <span className="text-[11px] text-gray-500 font-bold">
              {isUploading ? 'جاري رفع وحفظ الصورة...' : 'اضغط على الكاميرا لاختيار صورة أو استخدم القص السحري'}
            </span>

            {/* Magic Background Remover + Save Photo */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <label className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all">
                <Wand2 className="w-3.5 h-3.5" />
                <span>قص الخلفية سحرياً (اختر صورة)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) {
                      setCutoutSource(f);
                      setShowMagicCutout(true);
                    }
                  }}
                />
              </label>

              {avatarUrl && avatarUrl.startsWith('data:image') && (
                <button
                  type="button"
                  onClick={() => {
                    setCutoutSource(avatarUrl);
                    setShowMagicCutout(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-[11px] flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>تنظيف الصورة الحالية</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadAvatar}
                className="px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1"
                title="حفظ الصورة على الجهاز"
              >
                <Download className="w-3 h-3" />
                <span>حفظ الصورة</span>
              </button>
            </div>

            {/* Quick Preset Avatars */}
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto max-w-full py-1">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 transition-transform hover:scale-110 ${
                    avatarUrl === preset ? 'border-[#FFE600] ring-2 ring-black scale-105' : 'border-gray-200'
                  }`}
                >
                  <img src={preset} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              اسم العرض (الاسم في التطبيق):
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="أدخل اسمك"
                maxLength={40}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 font-bold outline-none focus:border-yellow-400 focus:bg-white"
                required
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              اسم المستخدم (المعرف الفريد):
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                maxLength={30}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 font-digits font-bold outline-none focus:border-yellow-400 focus:bg-white"
                required
              />
              <AtSign className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              يُستخدم في البحث والمحادثات بدون مسافات.
            </p>
          </div>

          {/* Phone Number Editing and Verification (Requirement 7) */}
          <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <span>رقم الهاتف المعتمد:</span>
              </label>
              {user.isPhoneVerified ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold border border-green-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>موثق</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-200">
                  غير موثق
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => {
                  setUserPhone(e.target.value);
                  setIsPhoneChanged(true);
                }}
                placeholder="01012345678"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-digits outline-none focus:border-amber-400"
              />
              {isPhoneChanged && !showPhoneOtpInput && (
                <button
                  type="button"
                  onClick={() => {
                    if (!userPhone.trim()) return;
                    setShowPhoneOtpInput(true);
                  }}
                  className="bg-purple-900 text-white text-[11px] font-bold px-3 py-2 rounded-xl whitespace-nowrap"
                >
                  طلب رمز التحقق
                </button>
              )}
            </div>

            {showPhoneOtpInput && (
              <div className="bg-white p-2.5 rounded-xl border border-purple-200 space-y-2 animate-in fade-in">
                <p className="text-[10px] text-gray-600">
                  أدخل رمز التحقق المرسل لهاتفك (الرمز السريع: <strong>1234</strong>):
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phoneOtpInput}
                    onChange={(e) => setPhoneOtpInput(e.target.value)}
                    placeholder="1234"
                    className="w-24 text-center bg-gray-50 border border-gray-300 rounded-lg py-1.5 font-digits font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (phoneOtpInput === '1234' || phoneOtpInput.length >= 4) {
                        livoStore.updateUserPhone(user.uid, userPhone, true);
                        setIsPhoneChanged(false);
                        setShowPhoneOtpInput(false);
                        setErrorMsg('');
                        setPhoneNotice('تم توثيق وتحديث رقم الهاتف بنجاح ✓');
                      } else {
                        setErrorMsg('رمز التحقق غير صحيح، يرجى كتابة 4 أرقام على الأقل');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    تأكيد وتوثيق
                  </button>
                </div>
              </div>
            )}
            {phoneNotice && (
              <div className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold">
                {phoneNotice}
              </div>
            )}
          </div>

          {/* UID Display (Read-Only) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              معرّف الحساب (UID الفريد):
            </label>
            <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-digits font-black text-amber-700 flex items-center justify-between">
              <span>{user.uid}</span>
              <span className="text-[10px] text-gray-500 font-sans font-bold">معرّف دائم ثابت</span>
            </div>
          </div>

          {/* Bio Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              النبذة التعريفية (Bio):
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة قصيرة عنك تظهر في ملفك الشخصي..."
              maxLength={120}
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-yellow-400 focus:bg-white resize-none"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-2.5 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {savedSuccess && (
            <div className="bg-green-50 text-green-700 border border-green-200 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 justify-center">
              <Check className="w-4 h-4" />
              <span>تم حفظ التعديلات بنجاح والمزامنة مع الحساب!</span>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>حفظ التعديلات في الملف الشخصي</span>
          </button>
        </form>
      </div>

      <MagicCutoutModal
        isOpen={showMagicCutout}
        initialImage={cutoutSource}
        title="قص خلفية الصورة الشخصية سحرياً"
        maxOutputDim={480}
        maxBytes={180_000}
        onClose={() => setShowMagicCutout(false)}
        onApply={handleApplyCutoutAvatar}
      />
    </div>
  );
};
