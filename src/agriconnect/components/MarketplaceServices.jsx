import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Ship, 
  Droplets, 
  Zap, 
  Wrench, 
  GraduationCap, 
  PlusCircle, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  DollarSign, 
  MessageSquare,
  Filter,
  Landmark,
  Map,
  Eye,
  Trash2
} from 'lucide-react';
import Avatar from './Avatar';
import { useViewTracker } from './MarketplaceProducts';
import { useLanguage } from '../i18n';

export default function MarketplaceServices({ services, currentUser, onContactProvider, onOpenCreate, searchQuery, predefinedCategory, moduleTitle, onDeleteService = () => {}, onRegisterView }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'offer', 'request'
  const [selectedCategory, setSelectedCategory] = useState(predefinedCategory || 'all');

  useEffect(() => {
    if (predefinedCategory) {
      setSelectedCategory(predefinedCategory);
    }
  }, [predefinedCategory]);

  const categories = [
    { id: 'all', label: t('Tous les services'), icon: null },
    { id: 'transporteur_terrestre', label: '🚚 Transport Terrestre', icon: Truck },
    { id: 'transporteur_maritime', label: '🚢 Services Maritimes', icon: Ship },
    { id: 'energie_eau', label: '💧 Énergie & Eau', icon: Droplets },
    { id: 'banque_assurance', label: '🏦 Banque & Assurance', icon: Landmark },
    { id: 'terrain', label: '🗺️ Terrain Louer / Vendre', icon: Map },
    { id: 'technicien', label: '🔧 Techniciens & Répa', icon: Wrench },
    { id: 'agronome', label: '👨‍🔬 Agronome & Ouvrier', icon: GraduationCap }
  ];

  const filteredServices = services.filter(s => {
    const matchesTab = activeTab === 'all' || s.type === activeTab;
    const matchesCategory = selectedCategory === 'all' || s.serviceCategory === selectedCategory;
    const matchesSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.providerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('Marketplace des Services Agricoles')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Transport routier, fret maritime, pompage solaire, forage d'eau, maintenance de machinerie et conseil d'experts.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{moduleTitle ? `Publier ${moduleTitle}` : t('Publier Offre / Demande Service')}</span>
        </button>
      </div>

      {/* Tabs: Offers vs Requests */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Toutes les annonces')} ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('offer')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'offer' ? 'bg-blue-100 text-[#0a66c2]' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚚 {t('Offres de Prestataires')}
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'request' ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📢 {t("Demandes d'Agriculteurs")}
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#0a66c2] text-white font-bold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">{t('Aucune annonce trouvée')}</h3>
          <p className="text-xs text-slate-500">{t('Essayez de modifier les filtres ou la recherche.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.map((serv) => (
            <ServiceCard
              key={serv.id}
              serv={serv}
              currentUser={currentUser}
              onContactProvider={onContactProvider}
              onDeleteService={onDeleteService}
              onRegisterView={onRegisterView}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Carte service ─────────────────────────────────────────────────────────────
function ServiceCard({ serv, currentUser, onContactProvider, onDeleteService, onRegisterView, t }) {
  const cardRef = useViewTracker(serv.id, onRegisterView);
  const isOffer = serv.type === 'offer';
  const isOwner = currentUser && String(serv.providerId) === String(currentUser.id);
  const viewsCount = serv.viewsCount || 0;

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
            isOffer
              ? 'bg-blue-100 text-[#0a66c2] border border-blue-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {isOffer ? t('Offre de Service') : t("Demande d'Agriculteur")}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              {serv.categoryLabel}
            </span>
            {isOwner && (
              <button
                onClick={() => { if (window.confirm('Supprimer définitivement cette annonce ?')) onDeleteService(serv.id); }}
                aria-label="Supprimer mon annonce"
                className="p-1.5 rounded-full text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-base leading-snug mb-2">{serv.title}</h3>

        <p className="text-xs text-slate-600 mb-4 line-clamp-2 font-medium">{serv.description}</p>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0a66c2]" /> {t('Zone :')}
            </span>
            <span className="font-bold text-slate-900">{serv.location}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> {t('Disponibilité :')}
            </span>
            <span className="font-bold text-slate-900">{serv.availability}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {t('Tarif / Estimation :')}
            </span>
            <span className="font-black text-emerald-700">{serv.pricing}</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 mb-3 font-medium">
          💡 <strong>{t('Spécifications :')}</strong> {serv.specs}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mb-3">
          <Eye className="w-3.5 h-3.5" /> {viewsCount} vue{viewsCount > 1 ? 's' : ''}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            src={serv.providerAvatar}
            name={serv.providerName}
            seed={serv.providerId || serv.providerName}
            className="w-9 h-9 shrink-0"
            textClassName="text-[11px]"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
              {serv.providerName}
              {serv.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#0a66c2] shrink-0" />}
            </div>
            <div className="text-[10px] text-slate-500 truncate">{serv.providerRole}</div>
          </div>
        </div>

        <button
          onClick={() => onContactProvider(serv)}
          className="group/msg flex items-center gap-1.5 bg-gradient-to-r from-[#0a66c2] to-[#0ea5a0] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-md shadow-[#0a66c2]/25 hover:shadow-lg hover:shadow-[#0a66c2]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5 transition-transform group-hover/msg:scale-110" />
          <span>{t('Répondre')}</span>
        </button>
      </div>
    </div>
  );
}
