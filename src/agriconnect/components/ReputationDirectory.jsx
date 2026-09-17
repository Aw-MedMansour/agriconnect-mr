import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  MapPin, 
  Award, 
  Filter, 
  MessageSquare,
  Building
} from 'lucide-react';
import { ACTOR_CATEGORIES, MOCK_ACTORS } from '../data/mockData';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

export default function ReputationDirectory({ actors, onContactActor, searchQuery }) {
  const { t } = useLanguage();
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  const source = Array.isArray(actors) && actors.length ? actors : MOCK_ACTORS;

  const normalized = source.map(a => ({
    ...a,
    name: a.name || 'Membre AgriConnect',
    company: a.company || a.roleLabel || 'Professionnel indépendant',
    location: a.location || 'Mauritanie',
    bio: a.bio || 'Membre de la communauté AgriConnect.',
    specialties: Array.isArray(a.specialties) ? a.specialties : [],
    zone: a.zone || a.location || 'Mauritanie',
    rating: a.rating ?? '—',
    transactionsCount: a.transactionsCount ?? 0,
    badge: a.badge || 'Nouveau membre',
    avatar: a.avatar || `https://ui-avatars.com/api/?background=0a66c2&color=fff&name=${encodeURIComponent(a.name || 'AgriConnect')}`,
    coverImage: a.coverImage || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
  }));

  const filteredActors = normalized.filter(actor => {
    const matchesRole = selectedRoleFilter === 'all' || actor.role === selectedRoleFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q ||
      actor.name.toLowerCase().includes(q) ||
      actor.company.toLowerCase().includes(q) ||
      actor.specialties.some(s => String(s).toLowerCase().includes(q)) ||
      actor.location.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-[#0a66c2] border border-blue-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
               {t('Annuaire des Acteurs Vérifiés')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Profils professionnels, notes ⭐, badges de réputation, avis clients et réseau d'intervenants.
          </p>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
        {ACTOR_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedRoleFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedRoleFilter === cat.id
                ? 'bg-[#0a66c2] text-white font-bold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Actors Directory Grid */}
      {filteredActors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
           <h3 className="text-lg font-bold text-slate-900 mb-1">{t('Aucun professionnel trouvé dans cette catégorie')}</h3>
           <p className="text-xs text-slate-500">{t('Sélectionnez une autre catégorie ci-dessus.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActors.map((actor) => (
            <div 
              key={actor.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Cover Banner */}
              <div className="h-24 relative bg-slate-100 overflow-hidden">
                <img 
                  src={actor.coverImage} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur-md text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-300 shadow-xs flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-500" /> {actor.badge}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 pt-0 pb-5 flex-1 flex flex-col justify-between -mt-10 relative">
                <div>
                  <div className="flex items-end justify-between gap-3 mb-3">
                     <Avatar src={actor.avatar} name={actor.name} seed={actor.id} className="w-16 h-16 border-4 border-white shadow-md" textClassName="text-base" />

                    {/* Rating & Transactions */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{actor.rating}</span>
                      </div>
                      <span className="text-slate-300 text-xs">|</span>
                      <div className="text-[11px] text-[#0a66c2] font-semibold">
                         {actor.transactionsCount} {t('Contrats')}
                      </div>
                    </div>
                  </div>

                  {/* Name & Verification */}
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5 mb-0.5">
                    {actor.name}
                    {actor.verified && (
                      <span title="Professionnel Vérifié AgriConnect">
                        <CheckCircle2 className="w-4 h-4 text-[#0a66c2] shrink-0" />
                      </span>
                    )}
                  </h3>

                  <div className="text-xs text-[#0a66c2] font-semibold mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> {actor.company}
                  </div>

                  <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0a66c2]" /> {actor.location}
                  </div>

                  <p className="text-xs text-slate-700 mb-4 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                    {actor.bio}
                  </p>

                  {/* Specialties Pills */}
                  <div className={actor.specialties.length ? 'mb-4' : 'hidden'}>

                     <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">{t('Spécialités & Équipements:')}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {actor.specialties.map((spec, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Zone: <strong className="text-slate-800">{actor.zone}</strong></span>
                    <span className="text-[#0a66c2] font-semibold">✓ Vérifié</span>
                  </div>

                  <button
                    onClick={() => onContactActor(actor)}
                    className="group/msg w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0a66c2] to-[#0ea5a0] text-white font-bold text-xs py-2.5 rounded-full shadow-md shadow-[#0a66c2]/25 hover:shadow-lg hover:shadow-[#0a66c2]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 transition-transform group-hover/msg:scale-110" />
                     <span>{t('Se connecter / Profil')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
