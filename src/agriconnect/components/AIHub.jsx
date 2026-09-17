import React, { useState } from 'react';
import { Bot, Leaf, Sparkles, BrainCircuit } from 'lucide-react';
import PlantAIChat from './PlantAIChat';
import PlantAnalysis from './PlantAnalysis';
import MatchingEngine from './MatchingEngine';

const TABS = [
  { id: 'chat', label: 'Plant AI', hint: 'Chatbot agronome', icon: Bot },
  { id: 'analysis', label: 'Analyse IA', hint: 'Diagnostic par photo', icon: Leaf },
  { id: 'matching', label: 'Matching IA', hint: 'Mise en relation', icon: Sparkles },
];

export default function AIHub({ currentUser, onRequireAuth, onDispatchSuccess, defaultTab = 'chat' }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Titre de section */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-blue-50 text-[#0a66c2] border border-blue-200">
            <BrainCircuit className="w-5 h-5" />
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Intelligence <span className="text-[#0a66c2]">artificielle</span>
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
          Trois outils réunis au même endroit : discuter avec l'agronome virtuel, analyser une plante par photo
          et trouver automatiquement le bon partenaire.
        </p>
      </div>

      {/* Sous-navigation */}
      <div className="grid grid-cols-3 gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs mb-6">
        {TABS.map(({ id, label, hint, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active ? 'bg-[#0a66c2] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {label}
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                {hint}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'chat' && <PlantAIChat currentUser={currentUser} onRequireAuth={onRequireAuth} />}
      {tab === 'analysis' && (
        <div className="-mx-4">
          <PlantAnalysis currentUser={currentUser} onRequireAuth={onRequireAuth} />
        </div>
      )}
      {tab === 'matching' && (
        <div className="-mx-4">
          <MatchingEngine onDispatchSuccess={onDispatchSuccess} />
        </div>
      )}
    </div>
  );
}
