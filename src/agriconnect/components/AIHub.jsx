import React, { useState } from 'react';
import { Bot, Leaf, Sparkles, BrainCircuit } from 'lucide-react';
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
  const { t } = useLanguage();

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
              onClick={() => setTab(id)}
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
      {tab === 'chat' && <PlantAIChat currentUser={currentUser} onRequireAuth={onRequireAuth} />}
      {tab === 'analysis' && (
        <div className="-mx-3 sm:-mx-4">
          <PlantAnalysis currentUser={currentUser} onRequireAuth={onRequireAuth} />
        </div>
      )}
      {tab === 'matching' && (
        <div className="-mx-3 sm:-mx-4">
          <MatchingEngine onDispatchSuccess={onDispatchSuccess} />
        </div>
      )}
      </div>
    </div>
  );
}
