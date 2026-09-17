import React, { useEffect, useRef, useState } from 'react';
import { Bell, Bot, ChevronDown, LogOut, MessageCircle, Plus, Search, ShieldCheck, Store, Truck, UserCircle2, Users, X } from 'lucide-react';
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
        <div className="flex min-h-[56px] items-center justify-center py-1.5 sm:min-h-[64px]">
          <button onClick={goHome} className="group flex min-w-0 items-center justify-center gap-2 text-center sm:gap-2.5" aria-label="AgriConnect">
            <img src={agriLogo} alt="Logo AgriConnect" className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200 sm:h-12 sm:w-12" />
            <span className="min-w-0 text-start">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span className="truncate text-lg font-black tracking-tight text-[#0a66c2] sm:text-2xl">AgriConnect</span>
                <span className="rounded-md bg-[#0a66c2] px-1.5 py-0.5 text-[7px] font-black tracking-wider text-white sm:text-[9px]">PRO</span>
              </span>
              <span className="mt-0.5 block truncate text-[9px] font-semibold text-slate-500 sm:text-[11px]">{t('Le réseau professionnel agricole')}</span>
            </span>
          </button>
        </div>

        <div className="relative flex min-h-[44px] items-center justify-between gap-2 border-t border-slate-100 py-1.5 sm:min-h-[48px]">
          <button onClick={onOpenCreateModal} className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#0a66c2] px-2.5 py-2 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-[#004182] sm:px-4 sm:text-xs">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('Publier une annonce')}</span><span className="sm:hidden">{t('Publier une annonce').split(' ')[0]}</span>
          </button>

          <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
            <div ref={profileRef} className="relative">
              {currentUser ? (
                <button onClick={() => setProfileOpen(v => !v)} className="flex h-9 max-w-[150px] items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 pe-2 text-start hover:bg-slate-50" aria-expanded={profileOpen}>
                  <Avatar src={currentUser.avatar} name={currentUser.name} seed={currentUser.id} className="h-6 w-6 shrink-0" textClassName="text-[8px]" />
                  <span className="hidden min-w-0 md:block"><span className="block truncate text-[10px] font-extrabold text-slate-800">{currentUser.name}</span><span className="block truncate text-[9px] text-slate-500">{currentUser.roleLabel || t('Membre')}</span></span>
                  <ChevronDown className="hidden h-3 w-3 text-slate-400 md:block" />
                </button>
              ) : (
                <button onClick={onOpenAuthModal} className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 sm:px-3"><UserCircle2 className="h-4 w-4" /><span className="hidden sm:inline">{t('Connexion')}</span></button>
              )}
              {profileOpen && currentUser && (
                <div className="absolute start-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-start shadow-xl">
                  <button onClick={() => { onOpenMyProfile?.(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-bold text-slate-700 hover:bg-slate-50"><UserCircle2 className="h-4 w-4 text-[#0a66c2]" />{t('Mon profil & mes publications')}</button>
                  <button onClick={() => { onLogout?.(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-bold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />{t('Se déconnecter')}</button>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setSearchOpen(v => !v)} className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${searchOpen ? 'border-[#0a66c2] bg-blue-50 text-[#0a66c2]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} aria-label={t('Rechercher')}><Search className="h-4 w-4" /></button>
              {searchOpen && <div className="absolute end-0 top-full z-50 mt-2 flex w-[min(88vw,360px)] items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><Search className="ms-2 h-4 w-4 shrink-0 text-slate-400" /><input autoFocus value={searchQuery || ''} onChange={e => setSearchQuery(e.target.value)} placeholder={t('Rechercher une récolte, un service, un membre…')} className="min-w-0 flex-1 bg-transparent py-1.5 text-xs outline-none" /><button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button></div>}
            </div>

            <button onClick={onToggleNotifications} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label={t('Ouvrir les notifications')}><Bell className="h-4 w-4" /><Counter>{notificationCount}</Counter></button>
            <button onClick={onToggleMessaging} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0a66c2] to-[#0ea5a0] text-white shadow-md" aria-label={t('Ouvrir la messagerie')}><MessageCircle className="h-4 w-4 fill-white/15" /><Counter>{unreadCount}</Counter></button>

            <label className="relative flex h-9 shrink-0 items-center rounded-full border border-slate-200 bg-white px-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50" aria-label={t('Choisir la langue')}>
              <span className="pointer-events-none w-6 text-center">{languages.find(item => item.id === language)?.short}</span>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={t('Choisir la langue')}>{languages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            </label>
          </div>
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
