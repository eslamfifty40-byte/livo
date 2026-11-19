import React, { useState, useEffect } from 'react';
import { CustomerApp } from './components/customer/CustomerApp';
import { AdminApp } from './components/admin/AdminApp';
import { livoStore } from './services/livoStore';
import { UserProfile } from './types';
import { Shield, Smartphone, ExternalLink, ArrowRight } from 'lucide-react';
import { LivoCustomerAppIcon, LivoAdminAppIcon } from './assets/appIcons';

export default function App() {
  // Support independent app launch: Customer by default, Admin via ?app=admin or standalone admin.html
  const [appMode, setAppMode] = useState<'customer' | 'admin'>('customer');
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
            <AdminApp />
          </div>
        )}
      </main>
    </div>
  );
}
