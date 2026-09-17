import React from 'react';
import {
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  MessageSquare,
  Repeat2,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

const TYPE_ICON = {
  message: MessageSquare,
  follow: UserPlus,
  post_like: Heart,
  product_like: Heart,
  post_comment: MessageCircle,
  product_comment: MessageCircle,
  comment_reply: MessageCircle,
  comment_reaction: Heart,
  repost: Repeat2,
};

function formatTime(ts, language) {
  if (!ts) return '';
  const minutes = Math.floor(Math.max(0, Date.now() - Number(ts)) / 60000);
  if (minutes < 1) return language === 'ar' ? 'الآن' : language === 'en' ? 'Just now' : 'À l’instant';
  if (minutes < 60) return language === 'ar' ? `منذ ${minutes} د` : language === 'en' ? `${minutes} min ago` : `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === 'ar' ? `منذ ${hours} س` : language === 'en' ? `${hours} h ago` : `Il y a ${hours} h`;
  return new Date(Number(ts)).toLocaleDateString(language === 'ar' ? 'ar-MR' : language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationPanel({ isOpen, notifications = [], onClose, onOpenNotification, onMarkAllRead, onDelete }) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const unreadCount = notifications.filter(item => !item.read).length;

  return (
    <section aria-label={t('Notifications')} className="fixed end-3 top-[128px] z-50 flex max-h-[min(70vh,560px)] w-[calc(100vw-1.5rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:end-5 sm:top-[148px]">
      <div className="flex min-h-14 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">{t('Notifications')}</h2>
          <p className="text-[10px] font-medium text-slate-500">{unreadCount ? `${unreadCount} ${language === 'ar' ? 'غير مقروء' : language === 'en' ? 'unread' : `non lue${unreadCount > 1 ? 's' : ''}`}` : t('Vous êtes à jour')}</p>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#0a66c2] hover:bg-blue-50">
              <CheckCheck className="h-3.5 w-3.5" /> {t('Tout lire')}
            </button>
          )}
          <button onClick={onClose} aria-label={t('Fermer les notifications')} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><Bell className="h-6 w-6 text-slate-400" /></span>
            <p className="text-xs font-bold text-slate-700">{t('Aucune notification')}</p>
            <p className="mt-1 text-[11px] text-slate-400">{t('Les nouvelles activités apparaîtront ici.')}</p>
          </div>
        ) : notifications.map(item => {
          const Icon = TYPE_ICON[item.type] || Bell;
          return (
            <article key={item.id} className={`group relative border-b border-slate-100 ${item.read ? 'bg-white' : 'bg-blue-50/70'}`}>
              <button onClick={() => onOpenNotification(item)} className="flex w-full items-start gap-3 px-4 py-3 pe-12 text-start hover:bg-slate-50">
                <div className="relative shrink-0">
                  <Avatar src={item.actorAvatar} name={item.actorName} seed={item.actorId} className="h-10 w-10" textClassName="text-xs" />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#0a66c2] text-white"><Icon className="h-2.5 w-2.5" /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs leading-relaxed text-slate-700 ${item.read ? 'font-medium' : 'font-bold'}`}><span className="text-slate-900">{item.actorName || t('Un membre')}</span> {item.text}</p>
                  <p className={`mt-1 text-[10px] font-semibold ${item.read ? 'text-slate-400' : 'text-[#0a66c2]'}`}>{formatTime(item.ts, language)}</p>
                </div>
                {!item.read && <span className="mt-4 h-2 w-2 shrink-0 rounded-full bg-[#0a66c2]" aria-label={t('Non lue')} />}
              </button>
              <button onClick={() => onDelete(item.id)} aria-label={t('Supprimer la notification')} className="absolute end-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </article>
          );
        })}
      </div>
    </section>
  );
}