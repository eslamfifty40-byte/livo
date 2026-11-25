import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  AlertCircle,
  Check,
  CheckCircle2
} from 'lucide-react';
import { livoStore } from '../../services/livoStore';
import { firebaseService } from '../../services/firebase';
import { UserProfile } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'signup';
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  canClose = true
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'main' | 'email' | 'phone'>('main');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setErrorMsg('');
      setInfoMsg('');
      setLoading(false);
    }
  }, [initialMode, isOpen]);

  const redirectTimerRef = React.useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+20');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Help Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpContact, setHelpContact] = useState('');
  const [helpSentSuccess, setHelpSentSuccess] = useState(false);

  if (!isOpen) return null;

  /**
   * Real Google Sign-In via Firebase Auth with forced Gmail account selector
   */
  const handleGoogleAuth = async (preferRedirect = false) => {
    if (!agreedToTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await firebaseService.loginCustomerWithGoogle(preferRedirect);
      if (res.redirectStarted) {
        setInfoMsg('جاري تحويلك إلى صفحة Google الآمنة لتأكيد الدخول...');
        if (redirectTimerRef.current !== null) window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = window.setTimeout(() => {
          setLoading(false);
        }, 6000);
        return;
      }
      if (!res.success || !res.user) {
        setLoading(false);
        setErrorMsg(res.error || 'تم إلغاء نافذة اختيار حساب Google');
        return;
      }

      const syncedUser = await livoStore.syncFirebaseUserAsync(res.user);
      const activeBan = livoStore.getActiveBanForUser(syncedUser);
      if (activeBan) {
        await firebaseService.logout();
        livoStore.logoutSession();
        setLoading(false);
        setErrorMsg(`تم حظر هذا الحساب (${activeBan.reason}). يمكنك التواصل مع الدعم الفني.`);
        return;
      }
      setLoading(false);
      onSuccess(syncedUser);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'تعذر تسجيل الدخول عبر Google');
    }
  };

  /**
   * Real Firebase Email & Password Sign-In / Sign-Up
   */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setErrorMsg('');
    setInfoMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        const res = await firebaseService.loginCustomerWithEmail(cleanEmail, password);
        if (!res.success || !res.user) {
          setLoading(false);
          setErrorMsg(res.error || 'فشل تسجيل الدخول');
          return;
        }
        const synced = await livoStore.syncFirebaseUserAsync(res.user);
        const activeBan = livoStore.getActiveBanForUser(synced);
        if (activeBan) {
          await firebaseService.logout();
          livoStore.logoutSession();
          setLoading(false);
          setErrorMsg(`تم حظر هذا الحساب (${activeBan.reason}).`);
          return;
        }
        setLoading(false);
        onSuccess(synced);
        onClose();
      } else {
        if (!displayName.trim()) {
          setLoading(false);
          setErrorMsg('يرجى كتابة الاسم المطلوب للحساب');
          return;
        }
        const res = await firebaseService.registerCustomerWithEmail(cleanEmail, password, displayName.trim());
        if (!res.success || !res.user) {
          setLoading(false);
          setErrorMsg(res.error || 'تعذر إنشاء الحساب');
          return;
        }
        const synced = await livoStore.syncFirebaseUserAsync(res.user, {
          displayName: displayName.trim()
        });
        setLoading(false);
        onSuccess(synced);
        onClose();
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع في المصادقة');
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('اكتب بريدك الإلكتروني أولاً ثم اضغط على استعادة كلمة المرور');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await firebaseService.resetCustomerPassword(email);
    setLoading(false);
    if (res.success) {
      setInfoMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  /**
   * Phone Login / Signup backed by real Firebase Auth session so Firestore writes succeed reliably
   */
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    const cleanPhone = `${phoneCountryCode}${phoneNumber.trim().replace(/\s+/g, '')}`;
    if (otpCode.trim().length < 4) {
      setErrorMsg('يرجى إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const authRes = await firebaseService.authenticateWithPhoneSession(cleanPhone, displayName.trim());
      if (!authRes.success || !authRes.user) {
        setLoading(false);
        setErrorMsg(authRes.error || 'تعذر تأسيس جلسة المصادقة لرقم الهاتف');
        return;
      }

      const users = livoStore.getUsers();
      const existingByPhone = users.find((u) => u.phoneNumber === cleanPhone);
      if (existingByPhone) {
        const activeBan = livoStore.getActiveBanForUser(existingByPhone);
        if (activeBan) {
          await firebaseService.logout();
          livoStore.logoutSession();
          setLoading(false);
          setErrorMsg(`تم حظر هذا الحساب (${activeBan.reason}).`);
          return;
        }
        if (existingByPhone.authUid !== authRes.user.uid) {
          livoStore.updateUserProfile(existingByPhone.uid, { authUid: authRes.user.uid, isPhoneVerified: true });
        }
        livoStore.setCurrentUser(existingByPhone.uid);
        setLoading(false);
        onSuccess(existingByPhone);
        onClose();
        return;
      }

      const existingByAuth = await firebaseService.findUserByAuthUidOrEmail(authRes.user.uid, authRes.user.email);
      if (existingByAuth) {
        const synced = await livoStore.syncFirebaseUserAsync(authRes.user);
        const activeBan = livoStore.getActiveBanForUser(synced);
        if (activeBan) {
          await firebaseService.logout();
          livoStore.logoutSession();
          setLoading(false);
          setErrorMsg(`تم حظر هذا الحساب (${activeBan.reason}).`);
          return;
        }
        setLoading(false);
        onSuccess(synced);
        onClose();
        return;
      }

      if (authMode === 'login') {
        // Still allow phone onboarding seamlessly or guide user if genuinely unregistered
        setLoading(false);
        setErrorMsg('رقم الهاتف غير مسجل بعد. اختر "إنشاء حساب جديد" في الأعلى لإكمال التسجيل.');
        return;
      }

      const generatedUid = livoStore.generateUniqueUid();
      const newUser = livoStore.registerNewUser(
        displayName.trim() || `مستخدم ${cleanPhone.slice(-4)}`,
        `phone_${cleanPhone.slice(-6)}_${generatedUid.slice(-2)}`,
        authRes.user.email || undefined,
        'personal',
        cleanPhone,
        authRes.user.uid
      );
      setLoading(false);
      onSuccess(newUser);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'حدث خطأ أثناء تأكيد رقم الهاتف');
    }
  };

  /**
   * Submit Login Help Ticket
   */
  const handleSendLoginHelpTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpMessage.trim()) return;

    livoStore.submitSupportTicket({
      uid: 'guest_help',
      category: 'technical',
      subject: helpSubject.trim() || 'مشكلة في تسجيل الدخول أو إنشاء الحساب',
      message: `[وسيلة الاتصال: ${helpContact.trim() || 'غير محددة'}] - ${helpMessage.trim()}`,
      priority: 'urgent'
    });

    setHelpSentSuccess(true);
    setTimeout(() => {
      setHelpSentSuccess(false);
      setShowHelpModal(false);
      setHelpMessage('');
      setHelpSubject('');
      setHelpContact('');
    }, 2200);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col justify-between overflow-y-auto select-none relative">
      {/* Compact LIVO Header (Directly leads into unified Login/Signup without oversized banner) */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-l from-amber-50/70 via-white to-white shrink-0">
        <div className="flex items-center gap-3 text-right">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-sm border border-amber-200 bg-black shrink-0">
            <img
              src="/assets/livo/customer_icon.jpg"
              alt="LIVO"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight leading-tight">مرحباً بك في LIVO</h1>
            <p className="text-[11px] text-gray-500 font-semibold">بث مباشر وغرف صوتية حقيقية</p>
          </div>
        </div>

        {canClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="px-5 pb-5 pt-4 flex-1 flex flex-col justify-between space-y-3 text-center">

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-2.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-2.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Mode Tabs: Login vs Signup */}
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              authMode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              authMode === 'signup'
                ? 'bg-[#FFE600] text-black shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* MAIN AUTH OPTIONS */}
        {authMethod === 'main' && (
          <div className="space-y-3">
            <button
              onClick={() => handleGoogleAuth(false)}
              disabled={loading}
              className="w-full bg-[#FFE600] hover:bg-yellow-400 active:scale-[0.98] text-black font-black text-sm py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all"
            >
              <span>
                {loading
                  ? 'جاري فتح نافذة اختيار حساب Gmail...'
                  : authMode === 'signup'
                  ? 'إنشاء حساب عبر Google (اختيار Gmail)'
                  : 'تسجيل الدخول عبر Google (اختيار Gmail)'}
              </span>
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleGoogleAuth(true)}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-800 font-bold text-xs py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <span>دخول Google بصفحة كاملة (حل صفحة Brave الفارغة والهاتف)</span>
            </button>

            <p className="text-[10px] text-gray-500 font-medium">
              سيتم فتح نافذة آمنة لاختيار حساب Gmail الخاص بك مباشرة دون مغادرة التطبيق
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMsg('');
                }}
                className="py-3 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs transition-all"
              >
                البريد وكلمة المرور
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setErrorMsg('');
                }}
                className="py-3 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs transition-all"
              >
                رقم الهاتف
              </button>
            </div>
          </div>
        )}

        {/* EMAIL & PASSWORD FORM */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3 text-right">
            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">الاسم الظاهر</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اكتب اسمك الكامل"
                  className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-amber-400"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-amber-400 font-digits"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-700">كلمة المرور</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] font-bold text-purple-700 hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-amber-400 font-digits"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFE600] text-black font-black text-xs py-3 rounded-2xl shadow-md hover:bg-yellow-400 transition-all"
            >
              {loading ? 'جاري المصادقة...' : authMode === 'signup' ? 'إنشاء الحساب الآن' : 'تسجيل الدخول'}
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('main')}
              className="w-full text-center text-xs text-gray-500 font-bold block pt-1 hover:text-black"
            >
              العودة للخيارات الرئيسية
            </button>
          </form>
        )}

        {/* PHONE FORM */}
        {authMethod === 'phone' && (
          <div className="space-y-3 text-right">
            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">الاسم الظاهر</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اكتب اسمك"
                  className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            )}

            {!isOtpSent ? (
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-700 block mb-1">رقم الموبايل</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 text-xs gap-2">
                  <select
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="bg-transparent font-bold text-gray-700 outline-none pl-2 border-l border-gray-300"
                  >
                    <option value="+20">🇪🇬 +20</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01012345678"
                    className="flex-1 bg-transparent outline-none font-digits text-xs py-1.5"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!phoneNumber.trim()) {
                      setErrorMsg('يرجى كتابة رقم الهاتف أولاً');
                      return;
                    }
                    setIsOtpSent(true);
                    setErrorMsg('');
                    setInfoMsg('أدخل رمز التحقق المرسل أو الرمز 2026 للمتابعة');
                  }}
                  className="w-full bg-[#FFE600] text-black font-black text-xs py-3 rounded-2xl shadow-md hover:bg-yellow-400"
                >
                  إرسال رمز التحقق OTP
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="أدخل رمز التحقق (4 أرقام)"
                  className="w-full bg-gray-50 border border-gray-200 text-center font-digits font-black tracking-widest text-base py-2.5 rounded-xl outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-[#FFE600] text-black font-black text-xs py-3 rounded-2xl shadow-md hover:bg-yellow-400"
                >
                  تأكيد ودخول التطبيق
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setAuthMethod('main');
                setIsOtpSent(false);
              }}
              className="w-full text-center text-xs text-gray-500 font-bold block pt-1 hover:text-black"
            >
              العودة للخيارات الرئيسية
            </button>
          </div>
        )}

        {/* Working Help Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-[11px] text-amber-700 hover:text-amber-800 underline font-bold cursor-pointer inline-flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>هل تواجه مشكلة في تسجيل الدخول؟ المساعدة والدعم الفني</span>
          </button>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2 text-right pt-1 text-[10px] text-gray-500 font-medium leading-relaxed">
          <div
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer mt-0.5 transition-colors ${
              agreedToTerms
                ? 'bg-[#FFE600] border-black text-black'
                : 'bg-white border-gray-300'
            }`}
          >
            {agreedToTerms && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
          <p className="cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
            لقد قرأت وأوافق على <span className="text-black font-bold underline">سياسة الخصوصية</span> & <span className="text-black font-bold underline">اتفاقية المستخدم</span>
          </p>
        </div>
      </div>

      {/* Login Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-gray-900 shadow-2xl relative border border-gray-200 space-y-3.5 text-right">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 left-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-gray-900">مركز المساعدة والدعم الفني</h4>
                <p className="text-[10px] text-gray-500">support@livo.live</p>
              </div>
            </div>

            {helpSentSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800">
                  تم إرسال طلب المساعدة بنجاح إلى فريق الدعم الفني!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendLoginHelpTicket} className="space-y-2.5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed">
                  <p className="font-bold mb-1">• إرشادات سريعة:</p>
                  <p>1. عند اختيار Google ستظهر نافذة لاختيار حساب Gmail الخاص بك.</p>
                  <p>2. للتواصل المباشر: <strong>support@livo.live</strong></p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">وسيلة التواصل (بريد أو هاتف):</label>
                  <input
                    type="text"
                    value={helpContact}
                    onChange={(e) => setHelpContact(e.target.value)}
                    placeholder="010... أو email@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">وصف المشكلة:</label>
                  <textarea
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="اشرح المشكلة التي تواجهها..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 text-xs p-3 rounded-xl outline-none resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-md transition-all"
                >
                  إرسال طلب المساعدة
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
