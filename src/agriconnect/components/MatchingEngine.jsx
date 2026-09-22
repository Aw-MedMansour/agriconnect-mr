import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  Send, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Star,
  ThumbsUp
} from 'lucide-react';
import { MOCK_ACTORS, MOCK_MATCHING_PRESETS } from '../data/mockData';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

export default function MatchingEngine({ onDispatchSuccess }) {
  const { t } = useLanguage();
  const [selectedNeed, setSelectedNeed] = useState('transporteur_terrestre');
  const [quantity, setQuantity] = useState('15 Tonnes');
  const [location, setLocation] = useState('Rosso, Trarza');
  const [urgency, setUrgency] = useState('48h');
  const [isScanning, setIsScanning] = useState(false);
  const [matchedResults, setMatchedResults] = useState(null);
  const [dispatched, setDispatched] = useState(false);

  const needOptions = [
    { id: 'transporteur_terrestre', icon: '🚚', label: 'Camion Frigorifique / Transport Terrestre' },
    { id: 'transporteur_maritime', icon: '🚢', label: 'Service Transit & Fret Maritime' },
    { id: 'prestataire_eau', icon: '💧', label: "Forage & Réseau d'Irrigation" },
    { id: 'prestataire_energie', icon: '⚡', label: 'Pompage Solaire & Énergie' },
    { id: 'acheteur', icon: '🏢', label: 'Acheteur / Grossiste pour Récolte' },
    { id: 'technicien', icon: '🔧', label: 'Technicien / Réparation Urgente' },
    { id: 'agronome', icon: '👨‍🔬', label: 'Conseil & Diagnostic Agronomique' }
  ];

  const applyPreset = (preset) => {
    setSelectedNeed(preset.needType);
    setLocation(preset.location);
    setMatchedResults(null);
    setDispatched(false);
  };

  const handleRunMatching = (e) => {
    e.preventDefault();
    setIsScanning(true);
    setMatchedResults(null);
    setDispatched(false);

    setTimeout(() => {
      const candidates = MOCK_ACTORS.filter(a => a.role === selectedNeed || a.role.includes(selectedNeed.split('_')[0]));
      const displayCandidates = candidates.length > 0 ? candidates : MOCK_ACTORS.slice(0, 3);
      
      const resultsWithScores = displayCandidates.map((actor, idx) => ({
        ...actor,
        matchScore: 98 - (idx * 4),
        distanceKm: Math.floor(Math.random() * 25) + 5,
        estimatedTime: idx === 0 ? 'Disponible immédiatement' : 'Disponible sous 24h'
      }));

      setMatchedResults(resultsWithScores);
      setIsScanning(false);
    }, 1200);
  };

  const handleDispatchAll = () => {
    setDispatched(true);
    if (onDispatchSuccess) {
      onDispatchSuccess(`Demande envoyée automatiquement aux ${matchedResults.length} prestataires identifiés !`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0a66c2] text-xs font-bold mb-3">
           <Sparkles className="w-4 h-4 fill-[#0a66c2]" /> {t('Algorithme de Matching LinkedIn Pro')}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
           {t('Mise en Relation Automatique')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
           {t('AgriConnect identifie en temps réel les prestataires disponibles les plus qualifiés à proximité de votre exploitation.')}
        </p>
      </div>

      {/* Preset Quick-Buttons */}
      <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
         <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t('Exemples de recherches fréquentes:')}</span>
        <div className="flex flex-wrap gap-2">
          {MOCK_MATCHING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
            >
              <Zap className="w-3.5 h-3.5 text-[#0a66c2]" />
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Matching Form Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md mb-8">
        <form onSubmit={handleRunMatching} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Need Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                 1. {t('Quel est votre besoin ?')}
              </label>
              <select
                value={selectedNeed}
                onChange={(e) => setSelectedNeed(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#0a66c2] focus:bg-white cursor-pointer"
              >
                {needOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.icon} {t(opt.label)}</option>
                ))}
              </select>
            </div>

            {/* Quantity / Specs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                 2. {t('Détail / Spécifications')}
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 15 Tonnes de Tomates, Forage 80m..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#0a66c2] focus:bg-white"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                 3. {t("Zone d'intervention")}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#0a66c2] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Rosso, Trarza"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                />
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                 4. {t('Délai requis')}
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#0a66c2] focus:bg-white cursor-pointer"
              >
                <option value="immediate">🚨 {t("Urgent (Aujourd'hui)")}</option>
                <option value="48h">⚡ {t('Sous 48 heures')}</option>
                <option value="week">📅 {t('Dans la semaine')}</option>
              </select>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={isScanning}
              className="inline-flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white text-sm font-bold px-8 py-3.5 rounded-full shadow-md transition-all cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Radio className="w-5 h-5 animate-spin" />
                   <span>{t('Analyse des profils en cours...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-white" />
                   <span>{t('Lancer le Matching Automatique')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Matching Results Output */}
      {matchedResults && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#0a66c2]" />
                 {matchedResults.length} {t('Prestataires Correspondants Identifiés')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {t('Zone :')} <strong className="text-slate-800">{location}</strong> | {t('Volume :')} <strong className="text-[#0a66c2]">{quantity}</strong>
              </p>
            </div>

            {!dispatched ? (
              <button
                onClick={handleDispatchAll}
                className="flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                 <span>{t('Envoyer la demande à tous')} ({matchedResults.length})</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-[#0a66c2] bg-blue-50 px-4 py-2.5 rounded-full border border-blue-200">
                 <ThumbsUp className="w-4 h-4" /> {t('Demande envoyée avec succès !')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedResults.map((actor) => (
              <div key={actor.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="bg-blue-100 text-[#0a66c2] border border-blue-200 text-xs font-mono font-bold px-2.5 py-1 rounded-full">
                       🔥 {t('Score Matching')}: {actor.matchScore}%
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0a66c2]" /> ~{actor.distanceKm} km
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                     <Avatar src={actor.avatar} name={actor.name} seed={actor.id} className="w-12 h-12 border-2 border-[#0a66c2]" textClassName="text-xs" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                        {actor.name}
                        {actor.verified && <ShieldCheck className="w-4 h-4 text-[#0a66c2]" />}
                      </h4>
                      <div className="text-xs text-slate-500 font-medium">{actor.roleLabel}</div>
                      <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold">{actor.rating}</span>
                         <span className="text-slate-500">({actor.reviewsCount} {t('avis')})</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 font-medium">
                    {actor.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {actor.specialties.map((spec, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-[#0a66c2] font-semibold">{actor.estimatedTime}</span>
                  <button 
                    onClick={() => {
                      if (onDispatchSuccess) onDispatchSuccess(`Demande envoyée directement à ${actor.name}`);
                    }}
                    className="text-xs bg-[#0a66c2] hover:bg-[#004182] text-white font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                  >
                     {t('Demande Directe')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
