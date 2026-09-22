import React from 'react';
import { Languages } from 'lucide-react';
import agriLogo from '../assets/agriconnect-logo.png';
import { useLanguage } from '../i18n';

const options = [
  { id: 'fr', label: 'Français', detail: 'Continuer en français' },
  { id: 'en', label: 'English', detail: 'Continue in English' },
  { id: 'ar', label: 'العربية', detail: 'المتابعة باللغة العربية' },
];

export default function LanguageGate({ children }) {
  const { ready, hasChosenLanguage, chooseLanguage } = useLanguage();
  if (!ready) return null;
  return (
    <>
      {children}
      {!hasChosenLanguage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <section aria-labelledby="language-title" className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <img src={agriLogo} alt="AgriConnect" className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
              <div><h1 id="language-title" className="text-lg font-black text-slate-900">AgriConnect</h1><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Languages className="h-3.5 w-3.5" /> Choisissez votre langue</p></div>
            </div>
            <div className="space-y-2">
              {options.map(option => <button key={option.id} type="button" onClick={() => chooseLanguage(option.id)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-start hover:border-[#0a66c2] hover:bg-blue-50"><span className="font-bold text-slate-900">{option.label}</span><span className="text-[11px] text-slate-500">{option.detail}</span></button>)}
            </div>
          </section>
        </div>
      )}
    </>
  );
}