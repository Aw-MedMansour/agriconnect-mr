import React from 'react';
import { MessageCircle } from 'lucide-react';
import agriLogo from '../assets/agriconnect-logo.png';
import { useLanguage } from '../i18n';

function Counter({ children }) {
  if (!children) return null;
  return <span className="absolute -end-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white ring-2 ring-white">{children > 99 ? '99+' : children}</span>;
}

export default function Navbar({ setActiveModule, onToggleMessaging, unreadCount = 0 }) {
  const { t } = useLanguage();
  const goHome = () => {
    setActiveModule('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-5">
        <div dir="ltr" className="flex min-h-[62px] items-center justify-between gap-3 py-1.5">
          <button onClick={goHome} className="group flex min-w-0 items-center gap-2 text-left sm:gap-2.5" aria-label="AgriConnect">
            <img src={agriLogo} alt="Logo AgriConnect" className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200" />
            <span className="min-w-0 text-start">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span className="truncate text-xl font-black text-[#0a66c2]">AgriConnect</span>
                <span className="rounded-md bg-[#0a66c2] px-1.5 py-0.5 text-[8px] font-black text-white">PRO</span>
              </span>
              <span className="mt-0.5 block max-w-[190px] truncate text-[9px] font-semibold text-slate-500 sm:max-w-none sm:text-[11px]">{t('Le réseau professionnel agricole')}</span>
            </span>
          </button>

          <button onClick={onToggleMessaging} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0a66c2] to-[#0ea5a0] text-white shadow-sm hover:opacity-90" aria-label={t('Ouvrir la messagerie')}><MessageCircle className="h-5 w-5" /><Counter>{unreadCount}</Counter></button>
        </div>
      </div>
    </header>
  );
}
