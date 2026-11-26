import React, { useState, useEffect, Suspense, lazy } from 'react';
import { CustomerApp } from './components/customer/CustomerApp';
import { livoStore } from './services/livoStore';
import { UserProfile } from './types';
import { ArrowRight } from 'lucide-react';

const AdminApp = lazy(() =>
  import('./components/admin/AdminApp').then((mod) => ({ default: mod.AdminApp }))
);

export default function App() {
  // Support independent app launch: Customer by default, Admin via VITE_APP_MODE=admin or ?app=admin
  const [appMode, setAppMode] = useState<'customer' | 'admin'>(() => {
    const buildMode = (import.meta as any).env?.VITE_APP_MODE;
    if (buildMode === 'admin') return 'admin';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === 'admin') return 'admin';
    }
    return 'customer';
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(livoStore.getCurrentUser());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === 'admin') {
        setAppMode('admin');
      }
    }

    const unsubscribe = livoStore.subscribe(() => {
      setCurrentUser(livoStore.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0515] text-white flex flex-col font-sans selection:bg-[#FFE600] selection:text-black relative overflow-x-hidden">
      {/* Standalone APK switcher strictly based on explicit URL param ?app=admin */}

      {/* Main Apps Host Container */}
      <main className="flex-1 w-full flex items-center justify-center p-0 md:p-4 overflow-auto">
        {/* LIVO Customer Mobile Application (Zero Admin Trace) */}
        {appMode === 'customer' && (
          <div className="w-full h-full flex items-center justify-center">
            <CustomerApp currentUser={currentUser} />
          </div>
        )}

        {/* LIVO Admin Standalone Application */}
        {appMode === 'admin' && (
          <div className="w-full h-full p-2 sm:p-4 animate-in fade-in">
            {/* Mobile Exit to Customer */}
            <div className="lg:hidden mb-2 flex justify-start">
              <button
                onClick={() => setAppMode('customer')}
                className="bg-[#FFE600] text-black text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لتطبيق العميل</span>
              </button>
            </div>
            <Suspense
              fallback={
                <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-amber-300">
                  جاري تحميل لوحة الإدارة...
                </div>
              }
            >
              <AdminApp />
            </Suspense>
          </div>
        )}
      </main>
    </div>
  );
}
