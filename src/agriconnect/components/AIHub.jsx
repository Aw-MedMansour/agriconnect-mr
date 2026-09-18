import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Leaf, Sparkles, BrainCircuit } from 'lucide-react';
import PlantAIChat from './PlantAIChat';
import PlantAnalysis from './PlantAnalysis';
import MatchingEngine from './MatchingEngine';
import { useLanguage } from '../i18n';

const TABS = [
  { id: 'chat', label: 'Plant AI', hint: 'Chatbot agronome', icon: Bot },
  { id: 'analysis', label: 'Analyse IA', hint: 'Diagnostic par photo', icon: Leaf },
  { id: 'matching', label: 'Matching IA', hint: 'Mise en relation', icon: Sparkles },
];

export default function AIHub({ currentUser, onRequireAuth, onDispatchSuccess, defaultTab = 'chat' }) {
  const [tab, setTab] = useState(defaultTab);
  const [isExpanded, setIsExpanded] = useState(false);
  const fullscreenRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!isExpanded) return undefined;

    const scrollY = window.scrollY;
    const previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const syncViewport = () => {
      const viewport = window.visualViewport;
      const node = fullscreenRef.current;
      if (!node || !viewport) return;
      node.style.setProperty('--ai-viewport-height', `${viewport.height}px`);
      node.style.setProperty('--ai-viewport-top', `${viewport.offsetTop}px`);
    };

    syncViewport();
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('scroll', syncViewport);
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
      document.body.style.overflow = previousBodyStyles.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isExpanded]);

  const openTool = (id) => {
    setTab(id);
    setIsExpanded(true);
  };

  const activeTool = TABS.find(item => item.id === tab) || TABS[0];
  const ActiveIcon = activeTool.icon;

  const toolContent = (
    <>
      {tab === 'chat' && <PlantAIChat currentUser={currentUser} onRequireAuth={onRequireAuth} fullScreen={isExpanded} />}
      {tab === 'analysis' && (
        <div className={isExpanded ? 'h-full min-h-0 overflow-y-auto overscroll-contain' : '-mx-3 sm:-mx-4'}>
          <PlantAnalysis currentUser={currentUser} onRequireAuth={onRequireAuth} />
        </div>
      )}
      {tab === 'matching' && (
        <div className={isExpanded ? 'h-full min-h-0 overflow-y-auto overscroll-contain' : '-mx-3 sm:-mx-4'}>
          <MatchingEngine onDispatchSuccess={onDispatchSuccess} />
        </div>
      )}
    </>
  );

  return (
    <div className="stable-page mx-auto min-h-[720px] max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#073b63] via-[#0a66c2] to-[#0b8f79] p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -end-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><BrainCircuit className="h-6 w-6" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">AgriConnect AI</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">{t('Intelligence artificielle')}</h2><p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-blue-50 sm:text-sm">{t("Discutez avec l’agronome virtuel, analysez vos plantes et trouvez le bon partenaire depuis un espace unique.")}</p></div>
        </div>
      </div>

      {/* Sous-navigation */}
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, hint, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => openTool(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-3 text-xs font-bold transition-all sm:px-2 ${
                active ? 'bg-gradient-to-br from-[#0a66c2] to-[#0b8f79] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span className="truncate">{t(label)}</span>
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                <span className="hidden sm:inline">{t(hint)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[520px]">
        {!isExpanded && toolContent}
      </div>

      {isExpanded && (
        <div
          ref={fullscreenRef}
          role="dialog"
          aria-modal="true"
          aria-label={t(activeTool.label)}
          className="ai-fullscreen fixed start-0 z-[100] flex w-full min-w-0 flex-col overflow-hidden bg-slate-50"
        >
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 shadow-sm sm:px-5">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label={t('Retour à l’espace Intelligence artificielle')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0a66c2] text-white">
              <ActiveIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{t(activeTool.label)}</p>
              <p className="truncate text-[10px] font-semibold text-slate-500">{t(activeTool.hint)}</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{toolContent}</div>
        </div>
      )}
    </div>
  );
}
