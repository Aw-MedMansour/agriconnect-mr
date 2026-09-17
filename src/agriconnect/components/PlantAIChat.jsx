import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Bot, Lock, RefreshCw } from 'lucide-react';
import { askPlantAI } from '@/lib/agri-chat.functions';
import Avatar from './Avatar';

const SUGGESTIONS = [
  'Mes feuilles de tomate jaunissent, que faire ?',
  'Quand semer le riz dans la vallée du fleuve ?',
  'Comment vendre ma récolte sur AgriConnect ?',
  'Comment fonctionne le Matching IA ?',
];

const WELCOME = {
  role: 'assistant',
  content:
    "Bonjour 👋 Je suis **Plant AI**, votre agronome virtuel AgriConnect (sous la tutelle de FulanIA).\nPosez-moi vos questions sur vos cultures, vos sols, vos maladies de plantes — ou sur l'utilisation de la plateforme.",
};

// Rendu léger du gras markdown (**texte**) et des retours à la ligne.
function RichText({ text }) {
  return (
    <>
      {String(text).split('\n').map((line, i) => (
        <p key={i} className={i ? 'mt-1.5' : ''}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
            ) : (
              <React.Fragment key={j}>{part}</React.Fragment>
            )
          )}
        </p>
      ))}
    </>
  );
}

export default function PlantAIChat({ currentUser, onRequireAuth }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => {
    if (currentUser) inputRef.current?.focus();
  }, [currentUser]);

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || isThinking) return;
    if (!currentUser) { onRequireAuth?.(); return; }

    const next = [...messages, { role: 'user', content: body }];
    setMessages(next);
    setInput('');
    setError(null);
    setIsThinking(true);

    try {
      const history = next
        .filter((m, i) => !(i === 0 && m === WELCOME))
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));
      const res = await askPlantAI({ data: { messages: history } });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setError(err?.message || "Plant AI est momentanément indisponible.");
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[70vh] min-h-[440px] max-h-[680px]">
      {/* En-tête */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-[#0a66c2]/5 to-emerald-500/5">
        <div className="w-9 h-9 rounded-xl bg-[#0a66c2] text-white flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">Plant AI</div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            Agronome virtuel AgriConnect — sous la tutelle de FulanIA
          </div>
        </div>
        <button
          onClick={() => { setMessages([WELCOME]); setError(null); }}
          className="ml-auto flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#0a66c2] px-2 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Nouvelle conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Nouvelle
        </button>
      </div>

      {/* Transcription */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[80%] bg-[#0a66c2] text-white text-xs leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-tr-sm'
                  : 'max-w-[85%] text-xs leading-relaxed text-slate-800'
              }
            >
              <RichText text={m.content} />
            </div>
            {m.role === 'user' && (
              <Avatar
                src={currentUser?.avatar}
                name={currentUser?.name || 'Moi'}
                seed={currentUser?.id || currentUser?.name}
                className="w-7 h-7 shrink-0 mt-0.5"
                textClassName="text-[9px]"
              />
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-[#0a66c2]" />
            Plant AI réfléchit…
          </div>
        )}

        {error && (
          <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="border-t border-slate-200 p-3 bg-slate-50"
      >
        {!currentUser ? (
          <button
            type="button"
            onClick={onRequireAuth}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-full transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" /> Connectez-vous pour discuter avec Plant AI
          </button>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Posez votre question agricole…"
              className="flex-1 resize-none max-h-32 bg-white border border-slate-300 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#0a66c2]"
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              aria-label="Envoyer le message à Plant AI"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-[#0a66c2] hover:bg-[#004182] disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
