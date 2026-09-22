import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, Home, Languages, LogOut, Plus, Search, UserCircle2, X } from 'lucide-react';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

const languages = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

function Counter({ value }) {
  if (!value) return null;
  return <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white ring-2 ring-white">{value > 99 ? '99+' : value}</span>;
}

export default function BottomNav({ hidden, activeAction, onHome, onSearch, onPublish, onNotifications, onProfile, onAuth, currentUser, onLogout, notificationCount = 0 }) {
  const { language, setLanguage, t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = event => {
      if (!menuRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const openProfileMenu = () => setProfileOpen(value => !value);
  const items = [
    { id: 'home', label: t('Accueil'), icon: Home, action: onHome },
    { id: 'search', label: t('Rechercher'), icon: Search, action: onSearch },
    { id: 'publish', label: t('Publier'), icon: Plus, action: onPublish, primary: true },
    { id: 'notifications', label: t('Notifications'), icon: Bell, action: onNotifications, count: notificationCount },
  ];

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-200 ${hidden ? 'translate-y-full' : 'translate-y-0'}`}>
      <nav aria-label={t('Navigation principale')} className="border-t border-slate-200 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-xl grid-cols-5 items-end">
          {items.map(({ id, label, icon: Icon, action, primary, count }) => (
            <button key={id} type="button" onClick={action} aria-current={activeAction === id ? 'page' : undefined} className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold ${activeAction === id ? 'text-[#0a66c2]' : 'text-slate-500'}`}>
              <span className={`relative flex items-center justify-center ${primary ? '-mt-5 h-12 w-12 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#0ea5a0] text-white shadow-lg ring-4 ring-white' : 'h-6 w-8'}`}><Icon className={primary ? 'h-5 w-5' : 'h-5 w-5'} /><Counter value={count} /></span>
              <span className="max-w-full truncate">{label}</span>
            </button>
          ))}
          <div ref={menuRef} className="relative flex min-w-0 justify-center">
            <button type="button" onClick={openProfileMenu} aria-expanded={profileOpen} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold ${activeAction === 'profile' || profileOpen ? 'text-[#0a66c2]' : 'text-slate-500'}`}>
              {currentUser ? <Avatar src={currentUser.avatar} name={currentUser.name} seed={currentUser.id} className="h-6 w-6" textClassName="text-[8px]" /> : <UserCircle2 className="h-6 w-6" />}
              <span>{t('Profil')}</span>
            </button>
            {profileOpen && (
              <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="absolute bottom-full end-0 mb-3 w-[min(15rem,92vw)] rounded-2xl border border-slate-200 bg-white p-2 text-start shadow-2xl">
                <button type="button" onClick={() => { currentUser ? onProfile?.() : onAuth?.(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><UserCircle2 className="h-4 w-4 text-[#0a66c2]" />{currentUser ? t('Mon profil & mes publications') : t('Connexion')}</button>
                <div className="my-1 border-t border-slate-100" />
                <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-slate-400"><Languages className="h-3.5 w-3.5" />{t('Choisir la langue')}</div>
                {languages.map(item => <button type="button" key={item.id} onClick={() => { setLanguage(item.id); setProfileOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><span>{item.label}</span>{language === item.id && <Check className="h-4 w-4 text-[#0a66c2]" />}</button>)}
                {currentUser && <><div className="my-1 border-t border-slate-100" /><button type="button" onClick={() => { onLogout?.(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />{t('Se déconnecter')}</button></>}
                <button type="button" onClick={() => setProfileOpen(false)} aria-label={t('Fermer')} className="absolute end-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}