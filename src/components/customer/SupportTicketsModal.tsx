import React, { useState, useEffect } from 'react';
import { X, Headphones, Send, CheckCircle2, MessageSquare, FileText, ImagePlus } from 'lucide-react';
import { UserProfile, SupportTicket } from '../../types';
import { livoStore } from '../../services/livoStore';
import { compressImageForFirestore } from '../../utils/imageCompression';

interface SupportTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const SupportTicketsModal: React.FC<SupportTicketsModalProps> = ({ isOpen, onClose, currentUser }) => {
  const activeUid = currentUser?.uid || 'guest_help';
  const [tickets, setTickets] = useState<SupportTicket[]>(() => livoStore.getSupportTickets(activeUid));
  const [isCreating, setIsCreating] = useState(false);
  const [category, setCategory] = useState<'complaint' | 'inquiry' | 'report' | 'technical' | 'financial'>('inquiry');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    setTickets(livoStore.getSupportTickets(activeUid));
    return livoStore.subscribe(() => {
      setTickets(livoStore.getSupportTickets(activeUid));
    });
  }, [activeUid]);

  if (!isOpen) return null;

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageForFirestore(file, { maxDim: 900, quality: 0.74, maxBytes: 220_000 });
    setAttachmentUrl(compressed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    livoStore.submitSupportTicket({
      uid: activeUid,
      category,
      subject: subject.trim(),
      message: message.trim(),
      attachmentUrl: attachmentUrl.trim() || undefined,
      priority
    });

    setTickets(livoStore.getSupportTickets(activeUid));
    setIsCreating(false);
    setSubject('');
    setMessage('');
    setAttachmentUrl('');
    setSuccessNotice('تم إرسال تذكرتك بنجاح ووصلت إلى صندوق وارد الإدارة المركزي 🛡️');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in select-none">
      <div className="bg-white text-gray-900 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
        
        {/* Header */}
        <div className="bg-[#120824] text-white px-5 py-4 flex items-center justify-between border-b border-purple-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE600] flex items-center justify-center text-black">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">مركز المساعدة والدعم الفني المباشر</h3>
              <p className="text-[10px] text-purple-300">تواصل مباشر ولحظي مع إدارة LIVO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toggle */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">تذاكري وبلاغاتي ({tickets.length})</span>
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs"
            >
              <span>فتح تذكرة / بلاغ جديد</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-gray-500 hover:text-black font-bold"
            >
              عرض التذاكر السابقة
            </button>
          )}
        </div>

        {successNotice && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isCreating ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">نوع الطلب أو البلاغ</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'inquiry', label: 'استفسار عام' },
                    { id: 'financial', label: 'شحن وأرصدة' },
                    { id: 'technical', label: 'مشكلة تقنية' },
                    { id: 'complaint', label: 'شكوى مستخدم' },
                    { id: 'report', label: 'بلاغ إساءة' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                        category === cat.id
                          ? 'bg-purple-950 text-white border-purple-950 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">موضوع التذكرة *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="اكتب عنواناً مختصراً للطلب أو الشكوى"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FFE600]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">تفاصيل الرسالة أو الشكوى *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل، وسيصل إشعار فوري للأدمن للرد عليك..."
                  rows={4}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FFE600]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">إرفاق صورة أو سكرين شوت (اختياري)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-purple-700" />
                    <span>{attachmentUrl ? 'تم إرفاق الصورة ✓ (اضغط للتغيير)' : 'رفع صورة من الجهاز'}</span>
                    <input type="file" accept="image/*" onChange={handleUploadAttachment} className="hidden" />
                  </label>
                  {attachmentUrl && (
                    <button
                      type="button"
                      onClick={() => setAttachmentUrl('')}
                      className="text-[11px] font-bold text-red-600 px-2.5 py-2 bg-red-50 rounded-xl"
                    >
                      حذف
                    </button>
                  )}
                </div>
                {attachmentUrl && attachmentUrl.startsWith('data:image') && (
                  <img src={attachmentUrl} alt="Attachment preview" className="mt-2 h-24 rounded-xl object-cover border border-gray-200" />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">درجة الأهمية</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs outline-none"
                >
                  <option value="normal">عادية (خلال 24 ساعة)</option>
                  <option value="high">هامة (خلال ساعات)</option>
                  <option value="urgent">عاجلة جداً (فوري)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span>إرسال التذكرة للوحة الإدارة المركزية</span>
              </button>
            </form>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-700" />
              <p className="font-bold text-xs text-gray-600">لا توجد لديك تذاكر دعم سابقة</p>
              <p className="text-[10px] text-gray-400 mt-1">اضغط على "فتح تذكرة / بلاغ جديد" للتواصل مع فريق إدارة LIVO.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md">
                      #{t.id.slice(-6)} • {t.category}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        t.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status === 'resolved' ? 'تم الحل ✓' : t.status === 'in_progress' ? 'قيد المتابعة' : 'قيد الانتظار'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-xs text-gray-900">{t.subject}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-xl">{t.message}</p>

                  {t.attachmentUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImg(t.attachmentUrl || null)}
                      className="text-[10px] text-purple-700 font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      <FileText className="w-3 h-3" />
                      <span>عرض المرفق</span>
                    </button>
                  )}

                  {/* Admin Reply if resolved */}
                  {t.reply && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-emerald-800 font-black">
                        <span>رد رسمي من إدارة LIVO:</span>
                        <span className="font-digits">{new Date(t.repliedAt || '').toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-emerald-950 font-medium">{t.reply}</p>
                    </div>
                  )}

                  <div className="text-[9px] text-gray-400 font-digits text-left">
                    {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-md w-full bg-white rounded-2xl p-2">
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white text-black shadow-lg flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewImg} alt="مرفق التذكرة" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
