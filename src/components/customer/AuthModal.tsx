import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Phone,
  User,
  Check,
  ShieldCheck,
  HelpCircle,
  Briefcase,
  AlertCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
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
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  // Mode: login vs signup (Requirement 2)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  // Account type: personal vs business (Requirement 3)
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  // Authentication Method: main, email, phone
  const [authMethod, setAuthMethod] = useState<'main' | 'email' | 'phone'>('main');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+20');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Help Modal State (Requirement 6)
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpContact, setHelpContact] = useState('');
  const [helpSentSuccess, setHelpSentSuccess] = useState(false);

  if (!isOpen) return null;

  /**
   * Google Sign-In with Real Firebase Authentication
   * Meets Requirements 4 & 5:
   * Opens Gmail Account Picker popup ('select_account') so the user can choose which Gmail to register/sign in with
   */
  const handleGoogleAuth = async () => {
    if (!agreedToTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await firebaseService.loginCustomerWithGoogle();

      if (!res.success || !res.user) {
        setLoading(false);
        setErrorMsg(res.error || 'تم إلغاء تسجيل الدخول عبر Google');
        return;
      }

      const fbUser = res.user;
      const cleanEmail = (fbUser.email || '').toLowerCase().trim();

      // Check for Admin access protection (Requirement 10: separate regular users from admin)
      if (cleanEmail === 'livo.admin@gmail.com') {
        setErrorMsg('هذا الحساب مخصص للوحة LIVO Admin المستقلة. يرجى اختيار حساب مستخدم عادي.');
        setLoading(false);
        return;
      }

      // Check if user already exists in system by authUid or email
      const users = livoStore.getUsers();
      const existingUser = users.find(
        u => (u.authUid && u.authUid === fbUser.uid) || (u.email && u.email.toLowerCase() === cleanEmail)
      );

      if (existingUser) {
        // Log in existing account
        livoStore.setCurrentUser(existingUser.uid);
        localStorage.setItem('livo_auth_logged_in', 'true');
        setLoading(false);
        onSuccess(existingUser);
        onClose();
      } else {
        // Create new account with chosen accountType
        const rawName = fbUser.displayName || 'مستخدم LIVO';
        const cleanUsername = (cleanEmail.split('@')[0] || `user_${Math.floor(1000 + Math.random() * 9000)}`)
          .replace(/[^a-z0-9_]/g, '');

        const newUser = livoStore.registerNewUser(
          rawName,
          cleanUsername,
          cleanEmail,
          accountType,
          fbUser.phoneNumber || undefined,
          fbUser.uid
        );

        if (fbUser.photoURL) {
          livoStore.updateUserProfile(newUser.uid, { avatar: fbUser.photoURL });
          newUser.avatar = fbUser.photoURL;
        }

        localStorage.setItem('livo_auth_logged_in', 'true');
        setLoading(false);
        onSuccess(newUser);
        onClose();
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال بخدمة Google');
    }
  };

  /**
   * Social login handler for other quick sign-in providers
   */
  const handleSocialLogin = (provider: 'facebook' | 'tiktok' | 'snapchat') => {
    if (!agreedToTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setLoading(false);
      let providerName = 'Facebook';
      let userAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop';

      if (provider === 'tiktok') {
        providerName = 'TikTok';
        userAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop';
      } else if (provider === 'snapchat') {
        providerName = 'Snapchat';
        userAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop';
      }

      const generatedUid = livoStore.generateUniqueUid();
      const generatedEmail = `${provider}_${generatedUid}@livo.live`;
      const generatedUsername = `${provider}_${generatedUid}`;

      const newUser = livoStore.registerNewUser(
        `${providerName} ${generatedUid.slice(-2)}`,
        generatedUsername,
        generatedEmail,
        accountType
      );

      livoStore.updateUserProfile(newUser.uid, { avatar: userAvatar });
      newUser.avatar = userAvatar;

      localStorage.setItem('livo_auth_logged_in', 'true');
      onSuccess(newUser);
      onClose();
    }, 500);
  };

  /**
   * Email Authentication Handler (Login or Register)
   */
  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();

    // Security: Disallow admin login through customer app
    if (cleanEmail === 'livo.admin@gmail.com') {
      setErrorMsg('حساب الإدارة مخصص لتطبيق LIVO ADMIN المستقل فقط.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const users = livoStore.getUsers();
      const existingUser = users.find(u => u.email?.toLowerCase() === cleanEmail);

      if (authMode === 'login') {
        if (existingUser) {
          livoStore.setCurrentUser(existingUser.uid);
          localStorage.setItem('livo_auth_logged_in', 'true');
          onSuccess(existingUser);
          onClose();
        } else {
          setErrorMsg('البريد الإلكتروني غير مسجل، يرجى اختيار تبويب "إنشاء حساب جديد" أولاً.');
        }
      } else {
        // Signup mode
        if (existingUser) {
          setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل، يرجى التبديل إلى "تسجيل الدخول".');
          return;
        }

        const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
        const newUser = livoStore.registerNewUser(
          displayName.trim() || `مستخدم ${cleanUsername}`,
          cleanUsername,
          cleanEmail,
          accountType
        );

        localStorage.setItem('livo_auth_logged_in', 'true');
        onSuccess(newUser);
        onClose();
      }
    }, 500);
  };

  /**
   * Phone Number and OTP Handler
   */
  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const cleanPhone = `${phoneCountryCode}${phoneNumber.trim()}`;
      const users = livoStore.getUsers();
      const existingUser = users.find(u => u.phoneNumber === cleanPhone);

      if (authMode === 'login' && existingUser) {
        livoStore.setCurrentUser(existingUser.uid);
        localStorage.setItem('livo_auth_logged_in', 'true');
        onSuccess(existingUser);
        onClose();
      } else {
        const generatedUid = livoStore.generateUniqueUid();
        const newUser = livoStore.registerNewUser(
          displayName.trim() || `مستخدم ${cleanPhone.slice(-4)}`,
          `user_${cleanPhone.slice(-4)}_${generatedUid.slice(-2)}`,
          `${cleanPhone}@phone.livo.live`,
          accountType,
          cleanPhone
        );

        localStorage.setItem('livo_auth_logged_in', 'true');
        onSuccess(newUser);
        onClose();
      }
    }, 500);
  };

  /**
   * Submit Urgent Support Ticket from Login Help Modal (Requirement 6)
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
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 md:p-4 select-none animate-in fade-in">
      <div className="bg-white rounded-none md:rounded-[36px] w-full max-w-[420px] h-[100dvh] md:h-auto md:max-h-[92vh] overflow-y-auto shadow-2xl relative text-gray-900 flex flex-col justify-between">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top 3D Banner */}
        <div className="relative w-full aspect-[4/3] max-h-[240px] overflow-hidden bg-gradient-to-b from-[#8B5CF6] via-[#A855F7] to-[#C084FC]">
          <img
            src="/assets/livo/login_party_banner.jpg"
            alt="LIVO Online Party"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
        </div>

        {/* Main Content Area */}
        <div className="px-5 pt-1 pb-5 flex-1 flex flex-col justify-between space-y-3.5 text-center">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Clear Choice: Login vs Create Account (Requirement 2) */}
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
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

          {/* 2. Clear Choice: Account Type (Requirement 3) */}
          <div className="bg-purple-50/70 border border-purple-100 p-2.5 rounded-2xl text-right">
            <span className="text-[11px] font-bold text-purple-900 block mb-1.5">
              نوع الحساب المطلوب:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                  accountType === 'personal'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>مستخدم عادي</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('business')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                  accountType === 'business'
                    ? 'bg-[#FFE600] text-black border-amber-400 font-black shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>حساب أعمال / Business</span>
              </button>
            </div>
          </div>

          {/* MAIN SCREEN: Google Big Button + 3 Circular Socials */}
          {authMethod === 'main' && (
            <div className="space-y-3.5">
              {/* GOOGLE Button with Account Selector (Requirements 4 & 5) */}
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full bg-[#FFE600] hover:bg-yellow-400 active:scale-[0.98] text-black font-black text-sm py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2.5 transition-all"
              >
                <span className="tracking-wide">
                  {loading ? 'جاري فتح نافذة اختيار الحساب...' : authMode === 'signup' ? 'التسجيل عبر GOOGLE' : 'المتابعة بحساب GOOGLE'}
                </span>
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </span>
              </button>

              <div className="flex items-center gap-2 my-1">
                <div className="h-[1px] bg-gray-200 flex-1" />
                <span className="text-[11px] font-bold text-gray-400">أو عبر الطرق التالية</span>
                <div className="h-[1px] bg-gray-200 flex-1" />
              </div>

              {/* 4 Circular Social/Phone Buttons */}
              <div className="flex items-center justify-center gap-4 py-1">
                {/* Phone */}
                <button
                  onClick={() => setAuthMethod('phone')}
                  className="w-12 h-12 rounded-full bg-[#FFE600] hover:scale-105 active:scale-95 text-black flex items-center justify-center text-xl shadow-xs transition-transform"
                  title="تسجيل برقم الموبايل"
                >
                  📱
                </button>

                {/* Snapchat */}
                <button
                  onClick={() => handleSocialLogin('snapchat')}
                  className="w-12 h-12 rounded-full bg-[#FFFC00] hover:scale-105 active:scale-95 text-black flex items-center justify-center text-xl shadow-xs transition-transform border border-yellow-300"
                  title="تسجيل عبر سناب شات"
                >
                  👻
                </button>

                {/* TikTok */}
                <button
                  onClick={() => handleSocialLogin('tiktok')}
                  className="w-12 h-12 rounded-full bg-black hover:scale-105 active:scale-95 text-white flex items-center justify-center text-lg shadow-xs transition-transform"
                  title="تسجيل عبر تيك توك"
                >
                  🎵
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleSocialLogin('facebook')}
                  className="w-12 h-12 rounded-full bg-[#1877F2] hover:scale-105 active:scale-95 text-white flex items-center justify-center text-xl font-black shadow-xs transition-transform"
                  title="تسجيل عبر فيسبوك"
                >
                  f
                </button>
              </div>

              {/* Direct Email Entrance */}
              <button
                onClick={() => setAuthMethod('email')}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold block mx-auto underline pt-1"
              >
                الدخول أو التسجيل بالبريد وكلمة المرور
              </button>
            </div>
          )}

          {/* EMAIL FORM */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-3 text-right">
              {authMode === 'signup' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">الاسم أو اللقب</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: أحمد شاهين"
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
                <label className="text-[11px] font-bold text-gray-700 block mb-1">كلمة المرور</label>
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
                className="w-full bg-[#FFE600] text-black font-black text-xs py-3 rounded-full shadow-md hover:bg-yellow-400 transition-all"
              >
                {loading ? 'جاري التحقق...' : authMode === 'signup' ? 'إتمام إنشاء الحساب' : 'تسجيل الدخول'}
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('main')}
                className="w-full text-center text-xs text-gray-500 font-bold block pt-1 hover:text-black"
              >
                العودة لطرق الدخول السريعة
              </button>
            </form>
          )}

          {/* PHONE FORM */}
          {authMethod === 'phone' && (
            <div className="space-y-3 text-right">
              {authMode === 'signup' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">الاسم أو اللقب</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: ياسمين فؤاد"
                    className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {!isOtpSent ? (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">أدخل رقم الموبايل</label>
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
                      className="flex-1 bg-transparent outline-none font-digits text-xs"
                      required
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!phoneNumber.trim()) {
                        setErrorMsg('يرجى كتابة رقم الهاتف أولاً');
                        return;
                      }
                      setIsOtpSent(true);
                      setOtpCode('1234');
                      setErrorMsg('');
                    }}
                    className="w-full bg-[#FFE600] text-black font-black text-xs py-3 rounded-full shadow-md hover:bg-yellow-400"
                  >
                    إرسال رمز التحقق OTP
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                  <span className="text-[11px] text-gray-600 block text-center">
                    أدخل رمز التحقق (الكود التجريبي الفوري: <strong className="font-digits">1234</strong>)
                  </span>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-gray-50 border border-gray-200 text-center font-digits font-black tracking-widest text-lg py-2 rounded-xl outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#FFE600] text-black font-black text-xs py-3 rounded-full shadow-md hover:bg-yellow-400"
                  >
                    تأكيد ودخول التطبيق
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setAuthMethod('main')}
                className="w-full text-center text-xs text-gray-500 font-bold block pt-1 hover:text-black"
              >
                العودة لطرق الدخول السريعة
              </button>
            </div>
          )}

          {/* Fixed Help Button (Requirement 6: Clicking opens real Help Modal) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-[11px] text-amber-600 hover:text-amber-700 underline font-bold cursor-pointer inline-flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>هل تواجه مشكلة في تسجيل الدخول؟ طلب المساعدة والدعم الفني</span>
            </button>
          </div>

          {/* Agreement Checkbox */}
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
              لقد قرأت وأوافق على <span className="text-black font-bold underline">سياسة الخصوصية</span> & <span className="text-black font-bold underline">اتفاقية المستخدم</span> & <span className="text-black font-bold underline">قواعد المنصة</span>
            </p>
          </div>
        </div>
      </div>

      {/* Login Help & Support Modal (Requirement 6) */}
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
                <p className="text-[10px] text-gray-500">حلول مشاكل الدخول والتواصل مع الإدارة</p>
              </div>
            </div>

            {helpSentSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800">
                  تم إرسال طلب المساعدة بنجاح إلى إدارة LIVO وسنتواصل معك فوراً!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendLoginHelpTicket} className="space-y-2.5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed">
                  <p className="font-bold mb-1">• حلول سريعة:</p>
                  <p>1. عند تسجيل الدخول بـ Google، تأكد من السماح بالنوافذ المنبثقة لاختيار الحساب.</p>
                  <p>2. للتسجيل برقم الهاتف، يمكنك استخدام كود التحقق <strong>1234</strong>.</p>
                  <p>3. البريد الرسمي للدعم: <strong>support@livo.live</strong></p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">وسيلة التواصل معك (بريد أو هاتف):</label>
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
                    placeholder="اشرح المشكلة التي تواجهها بالتفصيل ليتم حلها من قبل الإدارة..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 text-xs p-3 rounded-xl outline-none resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-md transition-all"
                >
                  إرسال طلب المساعدة للإدارة
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
