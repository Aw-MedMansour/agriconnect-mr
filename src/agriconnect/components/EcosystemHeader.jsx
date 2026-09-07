import React, { useState } from 'react';
import { 
  Store, 
  Truck, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Workflow,
  CheckCircle,
  Award
} from 'lucide-react';

export default function EcosystemHeader({ activeModule, setActiveModule, onOpenMatching }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#f3f2ef] border-b border-slate-200 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Banner Intro */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0a66c2] text-xs font-bold mb-2">
              <Workflow className="w-3.5 h-3.5" /> Écosystème Numérique Professionnel de l'Agriculture
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Connectez vos <span className="text-[#0a66c2]">Récoltes</span>, <span className="text-emerald-700">Services Logistiques</span> & <span className="text-amber-600">Acheteurs</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mt-1 font-medium">
              Plateforme professionnelle unifiée : Ventes directes, réseaux de transporteurs, pompage solaire, forage d'eau et réseau social agricole.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onOpenMatching}
              className="flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Tester le Matching IA Express</span>
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <span>{expanded ? 'Masquer Schéma' : 'Voir Schéma Écosystème'}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Architecture Diagram */}
        {expanded && (
          <div className="bg-white rounded-2xl p-5 mb-6 border border-slate-300 shadow-sm animate-fadeIn">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0a66c2]">🧩 Architecture de l'Écosystème AgroConnect</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Product Column */}
              <div 
                onClick={() => setActiveModule('products')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeModule === 'products' ? 'bg-blue-50/70 border-[#0a66c2]' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#0a66c2]" />
                    <span className="font-bold text-sm text-slate-900">PRODUITS</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-[#0a66c2] font-bold px-2 py-0.5 rounded">Module 1</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 border-t border-slate-200 pt-2 font-medium">
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-[#0a66c2]" /> Agriculteurs & Producteurs</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-[#0a66c2]" /> Acheteurs / Grossistes</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-[#0a66c2]" /> Distributeurs & Export</li>
                </ul>
              </div>

              {/* Services Column */}
              <div 
                onClick={() => setActiveModule('services')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeModule === 'services' ? 'bg-emerald-50/70 border-emerald-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-700" />
                    <span className="font-bold text-sm text-slate-900">SERVICES</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Module 2</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 border-t border-slate-200 pt-2 font-medium">
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-emerald-700" /> Transport Terrestre & Maritime</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-emerald-700" /> Prestataires Eau & Énergie Solaire</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-emerald-700" /> Techniciens & Agronomes</li>
                </ul>
              </div>

              {/* Social Column */}
              <div 
                onClick={() => setActiveModule('social')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeModule === 'social' ? 'bg-purple-50/70 border-purple-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-700" />
                    <span className="font-bold text-sm text-slate-900">SOCIAL & ACTUS</span>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">Module 3</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 border-t border-slate-200 pt-2 font-medium">
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-purple-700" /> Publications d'activités & Récoltes</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-purple-700" /> Photos, Vidéos & Échanges</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-purple-700" /> Suivi & Abonnements professionnels</li>
                </ul>
              </div>
            </div>

            {/* Bottom Core */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-[#0a66c2]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    MISE EN RELATION AUTOMATIQUE (MATCHING) <ArrowRight className="w-3.5 h-3.5 text-[#0a66c2]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Transactions & Devis Sécurisés</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white border border-amber-300 px-3 py-1.5 rounded-lg shadow-xs">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-900">⭐ Réputation / Avis & Badges de Confiance</span>
              </div>
            </div>
          </div>
        )}

        {/* LinkedIn-style Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-[#0a66c2]">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">100+ Tonnes</div>
              <div className="text-[11px] text-slate-500 font-medium">Récoltes en Vente Directe</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">45+ Offres</div>
              <div className="text-[11px] text-slate-500 font-medium">Services & Transport</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">98.4%</div>
              <div className="text-[11px] text-slate-500 font-medium">Matching Précis</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">10 Métiers</div>
              <div className="text-[11px] text-slate-500 font-medium">Profils Vérifiés</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
