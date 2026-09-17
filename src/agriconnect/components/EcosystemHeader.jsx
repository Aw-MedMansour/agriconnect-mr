import React from 'react';
import { Brain, Store, Truck, Users } from 'lucide-react';

export default function EcosystemHeader({ activeModule, setActiveModule, onOpenMatching }) {
  const shortcuts = [
    { id: 'products', label: 'Marketplace Produits', icon: Store },
    { id: 'services', label: 'Marketplace Services', icon: Truck },
    { id: 'social', label: 'Réseau Social Agricole', icon: Users },
  ];

  return (
    <div className="bg-[#f3f2ef] border-b border-slate-200 py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Connectez vos <span className="text-[#0a66c2]">récoltes</span>, vos{' '}
            <span className="text-emerald-700">services</span> et vos{' '}
            <span className="text-amber-600">acheteurs</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mt-1.5 font-medium">
            Ventes directes, transport et logistique, réseau social agricole et intelligence artificielle, sur une seule plateforme.
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {shortcuts.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveModule(id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  activeModule === id
                    ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenMatching}
          className="self-start flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Brain className="w-4 h-4" />
          <span>Intelligence artificielle</span>
        </button>
      </div>
    </div>
  );
}
