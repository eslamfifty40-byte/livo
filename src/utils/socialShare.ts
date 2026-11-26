/**
 * LIVO Real Social Sharing Utilities
 * Supports Facebook, Snapchat, WhatsApp, Web Share API (including images/links), and safe Clipboard fallback.
 * Never uses window.open / window.alert (iframe & WebView compliant).
 */

export type SocialSharePlatform = 'facebook' | 'snapchat' | 'whatsapp' | 'native' | 'copy';
export type SharePlatform = SocialSharePlatform;

export interface SharePayload {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
}

export interface ShareResult {
  success: boolean;
  platform: SocialSharePlatform;
  message: string;
}

function getSafeShareUrl(customUrl?: string): string {
  if (customUrl && /^https?:\/\//i.test(customUrl)) {
    return customUrl;
  }
  if (typeof window !== 'undefined' && /^https?:\/\//i.test(window.location.href)) {
    return window.location.href;
  }
  return 'https://livo.live';
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

async function copyTextSafely(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function triggerExternalLink(url: string, newTab = true): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const a = document.createElement('a');
    a.href = url;
    if (newTab) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

export async function shareContentToSocial(
  platform: SocialSharePlatform,
  payload: SharePayload
): Promise<ShareResult> {
  const shareUrl = getSafeShareUrl(payload.url);
  const fullText = `${payload.title ? payload.title + ' — ' : ''}${payload.text}\n${shareUrl}`;

  await copyTextSafely(fullText);

  if (platform === 'copy') {
    return {
      success: true,
      platform: 'copy',
      message: 'تم نسخ الرابط وتفاصيل المشاركة إلى الحافظة ✓'
    };
  }

  // Try native Web Share API (including shared image file when supported)
  if (platform === 'native' && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const shareData: ShareData = {
        title: payload.title,
        text: payload.text,
        url: shareUrl
      };
      if (payload.imageUrl && /^data:image\//i.test(payload.imageUrl) && typeof navigator.canShare === 'function') {
        try {
          const resp = await fetch(payload.imageUrl);
          const blob = await resp.blob();
          const file = new File([blob], 'livo-share.png', { type: blob.type || 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch {
          // share text/url without image file
        }
      }
      await navigator.share(shareData);
      return {
        success: true,
        platform: 'native',
        message: 'تمت المشاركة بنجاح ✓'
      };
    } catch {
      return {
        success: true,
        platform: 'copy',
        message: 'تم نسخ تفاصيل المشاركة إلى الحافظة ✓'
      };
    }
  }

  if (platform === 'facebook') {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedQuote = encodeURIComponent(`${payload.title ? payload.title + ' - ' : ''}${payload.text}`);
    const fbWebUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`;
    if (isMobileDevice() && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: payload.title, text: payload.text, url: shareUrl });
        return {
          success: true,
          platform: 'facebook',
          message: 'تم فتح قائمة المشاركة لتطبيق فيسبوك ✓'
        };
      } catch {
        // continue to web sharer link
      }
    }
    triggerExternalLink(fbWebUrl, true);
    return {
      success: true,
      platform: 'facebook',
      message: 'تم فتح نافذة المشاركة على فيسبوك ونسخ الرابط ✓'
    };
  }

  if (platform === 'snapchat') {
    const encodedUrl = encodeURIComponent(shareUrl);
    const snapWebUrl = `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`;
    if (isMobileDevice() && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: payload.title, text: payload.text, url: shareUrl });
        return {
          success: true,
          platform: 'snapchat',
          message: 'تم فتح قائمة المشاركة لتطبيق سناب شات ✓'
        };
      } catch {
        // continue to Snapchat web link
      }
    }
    triggerExternalLink(snapWebUrl, true);
    return {
      success: true,
      platform: 'snapchat',
      message: 'تم فتح المشاركة على سناب شات ونسخ الرابط ✓'
    };
  }

  if (platform === 'whatsapp') {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    triggerExternalLink(waUrl, true);
    return {
      success: true,
      platform: 'whatsapp',
      message: 'تم فتح واتساب لمشاركة الرابط ✓'
    };
  }

  return {
    success: true,
    platform,
    message: 'تم نسخ رابط المشاركة ✓'
  };
}
