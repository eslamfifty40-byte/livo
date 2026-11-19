import { createRoot } from 'react-dom/client';
import { AdminApp } from './components/admin/AdminApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <div className="min-h-[100dvh] w-full bg-[#0a0515] text-white flex flex-col font-sans selection:bg-[#FFE600] selection:text-black p-2 sm:p-4">
    <AdminApp />
  </div>
);
