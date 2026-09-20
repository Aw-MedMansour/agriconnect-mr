import React, { useEffect, useRef, useState } from 'react';
import { Bell, Bot, Check, ChevronDown, Languages, LogOut, MessageCircle, Plus, Search, ShieldCheck, Store, Truck, UserCircle2, Users, X } from 'lucide-react';
import agriLogo from '../assets/agriconnect-logo.png';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

const modules = [
  { id: 'products', label: 'Marketplace Produits', icon: Store },
  { id: 'services', label: 'Marketplace Services', icon: Truck },
  { id: 'social', label: 'Réseau Social Agricole', icon: Users },
  { id: 'ai', label: 'Intelligence artificielle', icon: Bot },
  { id: 'reputation', label: 'Acteurs & Réputation', icon: ShieldCheck },
];

const languages = [
  { id: 'fr', short: 'FR', label: 'Français' },
  { id: 'en', short: 'EN', label: 'English' },
  { id: 'ar', short: 'ع', label: 'العربية' },
];

function Counter({ children }) {
  if (!children) return null;
  return <span className="absolute -end-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white ring-2 ring-white">{children > 99 ? '99+' : children}</span>;
}

export default function Navbar({ activeModule, setActiveModule, onOpenAuthModal, currentUser, onLogout, onOpenCreateModal, searchQuery, setSearchQuery, onToggleMessaging, unreadCount = 0, onToggleNotifications, notificationCount = 0, onOpenMyProfile }) {
  const { language, setLanguage, t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const goHome = () => {
    setActiveModule('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-5">
        <div dir="ltr" className="flex min-h-[62px] items-center justify-between gap-2 py-1.5 sm:min-h-[72px]">
          <button onClick={goHome} className="group flex min-w-0 items-center gap-2 text-left sm:gap-2.5" aria-label="AgriConnect">
            <img src={agriLogo} alt="Logo AgriConnect" className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200 sm:h-14 sm:w-14" />
            <span className="min-w-0 text-start">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span className="truncate text-xl font-black tracking-tight text-[#0a66c2] sm:text-2xl">AgriConnect</span>
                <span className="rounded-md bg-[#0a66c2] px-1.5 py-0.5 text-[7px] font-black tracking-wider text-white sm:text-[9px]">PRO</span>
              </span>
              <span className="mt-0.5 block max-w-[190px] truncate text-[9px] font-semibold text-slate-500 sm:max-w-none sm:text-[11px]">{t('Le réseau professionnel agricole')}</span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button onClick={onOpenCreateModal} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0a66c2] to-[#0ea5a0] text-white shadow-sm hover:opacity-90 sm:h-10 sm:w-10" aria-label={t('Publier une annonce')}>
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button onClick={() => setSearchOpen(v => !v)} className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition sm:h-10 sm:w-10 ${searchOpen ? 'border-[#0a66c2] bg-blue-50 text-[#0a66c2]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} aria-label={t('Rechercher')}><Search className="h-4 w-4 sm:h-5 sm:w-5" /></button>
            <button onClick={onToggleNotifications} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 sm:h-10 sm:w-10" aria-label={t('Ouvrir les notifications')}><Bell className="h-4 w-4 sm:h-5 sm:w-5" /><Counter>{notificationCount}</Counter></button>
          </div>
        </div>

        <div dir="ltr" className="relative flex min-h-[46px] items-center justify-between border-t border-slate-100 py-1.5">
          <div ref={profileRef} className="relative min-w-0 justify-self-start">
              {currentUser ? (
                <button onClick={() => setProfileOpen(v => !v)} className="flex h-9 max-w-[120px] items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 pe-2 text-start hover:bg-slate-50 sm:max-w-[170px]" aria-expanded={profileOpen} aria-label={t('Mon profil')}>
                  <Avatar src={currentUser.avatar} name={currentUser.name} seed={currentUser.id} className="h-6 w-6 shrink-0" textClassName="text-[8px]" />
                  <span className="hidden min-w-0 md:block"><span className="block truncate text-[10px] font-extrabold text-slate-800">{currentUser.name}</span><span className="block truncate text-[9px] text-slate-500">{currentUser.roleLabel || t('Membre')}</span></span>
                  <ChevronDown className="hidden h-3 w-3 text-slate-400 md:block" />
                </button>
              ) : (
                <button onClick={() => setProfileOpen(v => !v)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0a66c2] to-[#0ea5a0] text-white shadow-sm" aria-expanded={profileOpen} aria-label={t('Connexion')}><UserCircle2 className="h-5 w-5" /></button>
              )}
              {profileOpen && (
                <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="absolute left-0 top-full z-50 mt-2 w-[min(14rem,88vw)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-start shadow-xl">
                  {currentUser ? <>
                    <button onClick={() => { onOpenMyProfile?.(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-bold text-slate-700 hover:bg-slate-50"><UserCircle2 className="h-4 w-4 text-[#0a66c2]" />{t('Mon profil & mes publications')}</button>
                    <button onClick={() => { onLogout?.(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-bold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />{t('Se déconnecter')}</button>
                  </> : <button onClick={() => { onOpenAuthModal?.(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-bold text-slate-700 hover:bg-slate-50"><UserCircle2 className="h-4 w-4 text-[#0a66c2]" />{t('Connexion')}</button>}
                  <div className="my-1 border-t border-slate-100" />
                  <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-slate-400"><Languages className="h-3.5 w-3.5" />{t('Choisir la langue')}</div>
                  {languages.map(item => <button key={item.id} onClick={() => { setLanguage(item.id); setProfileOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-semibold text-slate-700 hover:bg-slate-50"><span>{item.label}</span>{language === item.id && <Check className="h-4 w-4 text-[#0a66c2]" />}</button>)}
                </div>
              )}
          </div>

          {searchOpen && <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="absolute left-1/2 top-1/2 z-50 flex w-[min(64vw,420px)] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-lg"><Search className="ms-1 h-4 w-4 shrink-0 text-slate-400" /><input autoFocus value={searchQuery || ''} onChange={e => setSearchQuery(e.target.value)} placeholder={t('Rechercher une récolte, un service, un membre…')} className="min-w-0 flex-1 bg-transparent py-1.5 text-xs outline-none" /><button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button></div>}

          <button onClick={onToggleMessaging} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0a66c2] to-[#0ea5a0] text-white shadow-sm hover:opacity-90" aria-label={t('Ouvrir la messagerie')}><MessageCircle className="h-5 w-5" /><Counter>{unreadCount}</Counter></button>
        </div>
      </div>

      <nav aria-label="Navigation principale" className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto flex max-w-7xl items-stretch gap-1 overflow-x-auto px-3 no-scrollbar sm:justify-center sm:px-5">
          {modules.map(({ id, label, icon: Icon }) => {
            const active = activeModule === id;
            return <button key={id} onClick={() => setActiveModule(id)} className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold transition sm:px-4 sm:text-xs ${active ? 'text-[#0a66c2]' : 'text-slate-600 hover:text-slate-900'}`}><Icon className="h-3.5 w-3.5" />{t(label)}{active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#0a66c2]" />}</button>;
          })}
        </div>
      </nav>
    </header>
  );
}
