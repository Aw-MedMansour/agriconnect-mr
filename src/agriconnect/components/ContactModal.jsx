import React, { useState } from 'react';
import { X, Phone, MessageSquare, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

export default function ContactModal({ isOpen, onClose, targetData, onSendMessage }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !targetData) return null;

  const handleSend = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    // Le message part réellement dans la messagerie du destinataire.
    const sent = onSendMessage ? onSendMessage(text) : false;
    if (sent === false) return;
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessage('');
      onClose();
    }, 1200);
  };

  const recipientName = targetData.name || targetData.sellerName || targetData.providerName || 'Acteur Agricole';
  const recipientRole = targetData.roleLabel || targetData.sellerRole || targetData.providerRole || 'Professionnel AgriConnect';
  const phone = targetData.phone || '+222 45 23 88 11';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 overflow-hidden shadow-2xl animate-scaleIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <Avatar
              src={targetData.avatar || targetData.sellerAvatar || targetData.providerAvatar}
              name={recipientName}
              seed={targetData.id || recipientName}
              className="w-10 h-10"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                {recipientName}
                <ShieldCheck className="w-4 h-4 text-[#0a66c2]" />
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">{recipientRole}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#0a66c2] border border-blue-200 p-3 rounded-full text-xs font-bold transition-all"
            >
              <Phone className="w-4 h-4 text-[#0a66c2]" />
               <span>{t('Appel Direct')}</span>
            </a>
            <a 
              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 p-3 rounded-full text-xs font-bold transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
               <span>{t('WhatsApp Direct')}</span>
            </a>
          </div>

          {/* Direct Message Form */}
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                 {t('Envoyer un message sécurisé')}
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                 placeholder={`${t('Bonjour')} ${recipientName}, ${t('je vous contacte concernant votre annonce...')}`}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#0a66c2] focus:bg-white transition-colors"
              />
            </div>

            {targetData.title && (
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between font-medium">
                 <span>{t('Annonce concernée')}: <strong className="text-slate-900">{targetData.title}</strong></span>
              </div>
            )}

            {sentSuccess ? (
              <div className="p-3 bg-blue-50 text-[#0a66c2] border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                 <CheckCircle2 className="w-4 h-4" /> {t('Message transmis instantanément !')}
              </div>
            ) : (
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs py-3 rounded-full transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                 <span>{t('Envoyer le message')}</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
