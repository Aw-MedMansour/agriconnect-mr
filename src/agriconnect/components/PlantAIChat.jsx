import React, { useEffect, useRef, useState } from 'react';
import { Bot, Lock, RefreshCw, Send, Sprout } from 'lucide-react';
import { askPlantAI } from '@/lib/agri-chat.functions';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Shimmer } from '@/components/ai-elements/shimmer';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

const SUGGESTIONS = [
  'Mes feuilles de tomate jaunissent, que faire ?',
  'Quand semer le riz dans la vallée du fleuve ?',
  'Comment vendre ma récolte sur AgriConnect ?',
  'Comment fonctionne le Matching IA ?',
];
const WELCOME_TEXT = "Bonjour 👋 Je suis **Plant AI**, votre agronome virtuel AgriConnect (sous la tutelle de FulanIA).\nPosez-moi vos questions sur vos cultures, vos sols, vos maladies de plantes — ou sur l'utilisation de la plateforme.";

export default function PlantAIChat({ currentUser, onRequireAuth }) {
  const { t } = useLanguage();
  const welcome = { role: 'assistant', content: t(WELCOME_TEXT) };
  const [messages, setMessages] = useState([welcome]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { if (currentUser) inputRef.current?.focus(); }, [currentUser]);

  const reset = () => { setMessages([{ role: 'assistant', content: t(WELCOME_TEXT) }]); setError(null); };
  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || isThinking) return;
    if (!currentUser) { onRequireAuth?.(); return; }
    const next = [...messages, { role: 'user', content: body }];
    setMessages(next); setInput(''); setError(null); setIsThinking(true);
    try {
      const history = next.slice(-20).map(message => ({ role: message.role, content: message.content }));
      const response = await askPlantAI({ data: { messages: history } });
      setMessages(previous => [...previous, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setError(err?.message || 'Plant AI est momentanément indisponible.');
    } finally {
      setIsThinking(false); inputRef.current?.focus();
    }
  };

  return (
    <section className="flex h-[min(72vh,700px)] min-h-[500px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-3 sm:px-5">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-[#0a66c2] text-white shadow-md"><Bot className="h-5 w-5" /><span className="absolute -bottom-1 -end-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" /></span>
        <div className="min-w-0 flex-1"><h3 className="text-sm font-black text-slate-900">Plant AI</h3><p className="truncate text-[10px] font-semibold text-slate-500 sm:text-[11px]">{t('Agronome virtuel AgriConnect — sous la tutelle de FulanIA')}</p></div>
        <button onClick={reset} title={t('Nouvelle conversation')} className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-600 hover:text-[#0a66c2]"><RefreshCw className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('Nouvelle')}</span></button>
      </div>

      <Conversation className="bg-[radial-gradient(circle_at_top,_rgba(14,165,160,0.07),_transparent_35%)]">
        <ConversationContent className="gap-4 p-4 sm:p-5">
          {messages.map((message, index) => (
            <Message key={`${message.role}-${index}`} from={message.role} className={message.role === 'user' ? 'ms-auto' : ''}>
              <div className="flex items-start gap-2.5">
                {message.role === 'assistant' && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><Sprout className="h-4 w-4" /></span>}
                <MessageContent className={message.role === 'user' ? 'rounded-2xl rounded-ee-sm bg-[#0a66c2] px-4 py-3 text-white' : 'rounded-2xl rounded-es-sm border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm'}><MessageResponse>{message.content}</MessageResponse></MessageContent>
                {message.role === 'user' && <Avatar src={currentUser?.avatar} name={currentUser?.name || 'Moi'} seed={currentUser?.id} className="h-8 w-8 shrink-0" textClassName="text-[9px]" />}
              </div>
            </Message>
          ))}
          {isThinking && <div className="flex items-center gap-2 rounded-xl px-1 text-xs font-semibold"><Bot className="h-4 w-4 text-emerald-600" /><Shimmer>{t('Plant AI réfléchit…')}</Shimmer></div>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}
          {messages.length === 1 && <div className="flex flex-wrap gap-2 pt-2">{SUGGESTIONS.map(suggestion => <button key={suggestion} onClick={() => send(t(suggestion))} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm hover:border-[#0a66c2] hover:text-[#0a66c2]">{t(suggestion)}</button>)}</div>}
        </ConversationContent>
        <ConversationScrollButton aria-label="Scroll" />
      </Conversation>

      <form onSubmit={event => { event.preventDefault(); send(); }} className="border-t border-slate-200 bg-white p-3 sm:p-4">
        {!currentUser ? <button type="button" onClick={onRequireAuth} className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-xs font-bold text-white hover:bg-amber-600"><Lock className="h-4 w-4" />{t('Connectez-vous pour discuter avec Plant AI')}</button> : <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-1.5 focus-within:border-[#0a66c2] focus-within:ring-2 focus-within:ring-blue-100"><textarea ref={inputRef} rows={1} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={t('Posez votre question agricole…')} className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-xs outline-none" /><button type="submit" disabled={isThinking || !input.trim()} aria-label={t('Envoyer le message à Plant AI')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0a66c2] text-white disabled:opacity-40"><Send className="h-4 w-4" /></button></div>}
      </form>
    </section>
  );
}