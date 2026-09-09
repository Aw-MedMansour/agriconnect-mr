import React, { useState } from 'react';
import { 
  Sprout, 
  Store, 
  Truck, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Bell,
  CheckCircle2,
  User,
  LogOut,
  ChevronDown,
  Droplets,
  Landmark,
  Map,
  HardHat
} from 'lucide-react';

export default function Navbar({ activeModule, setActiveModule, onOpenCreateModal, currentUser, onOpenAuthModal, onLogout, searchQuery, setSearchQuery }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const modules = [
    { id: 'products', label: 'Marketplace Produits', icon: Store },
    { id: 'services', label: 'Marketplace Services', icon: Truck },
    { id: 'social', label: 'Réseau Social Agricole', icon: Users },
    { id: 'energy', label: 'Energie & Eau', icon: Droplets },
    { id: 'finance', label: 'Banque & Assurance', icon: Landmark },
    { id: 'land', label: 'Terrain à louer & vendre', icon: Map },
    { id: 'workers', label: 'Agronome & ouvrier', icon: HardHat },
    { id: 'plantai', label: 'Analyse des Plantes IA', icon: Sprout },
    { id: 'matching', label: 'Mise en Relation IA', icon: Sparkles },
    { id: 'reputation', label: 'Acteurs & Réputation', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Ticker & Role Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 text-[10px] sm:px-4 sm:py-1.5 sm:text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:justify-between sm:gap-3">
          <div className="flex min-w-0 items-center gap-4 text-slate-600">
            <span className="flex min-w-0 items-center gap-1.5 text-[#0a66c2] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0a66c2]"></span>
              </span>
              <span className="truncate">AgroConnect Réseau Pro</span>
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline text-slate-700">
              <strong className="text-[#0a66c2]">142 Tonnes</strong> de récoltes en ligne
            </span>
            <span className="hidden lg:inline text-slate-700">
              <strong className="text-emerald-700">38 Transporteurs</strong> actifs
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3 sm:ml-auto">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer sm:gap-2 sm:px-2.5 sm:py-1"
                >
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-5 h-5 rounded-full object-cover border border-[#0a66c2]"
                  />
                  <span className="hidden max-w-24 truncate text-xs font-bold text-slate-900 sm:inline">{currentUser.name}</span>
                  <span className="hidden text-[10px] bg-blue-100 text-[#0a66c2] font-bold px-1.5 py-0.5 rounded md:inline">
                    {currentUser.roleLabel || 'Membre'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 font-bold hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se Déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 bg-[#0a66c2] hover:bg-[#004182] text-white text-[10px] font-bold px-2 py-1 rounded-full transition-all cursor-pointer shadow-xs sm:gap-1.5 sm:px-3 sm:text-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span className="sm:hidden">Connexion</span>
                <span className="hidden sm:inline">Créer un compte / Connexion</span>
              </button>
            )}

            <div className="hidden items-center gap-1 bg-blue-50 text-[#0a66c2] border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold sm:flex">
              <CheckCircle2 className="w-3.5 h-3.5" /> Compte Vérifié
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={() => setActiveModule('products')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-md bg-[#0a66c2] flex items-center justify-center shadow-sm group-hover:bg-[#004182] transition-colors">
            <Sprout className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight text-slate-900">Agro<span className="text-[#0a66c2]">Connect</span></span>
              <span className="bg-blue-100 text-[#0a66c2] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Pro</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium -mt-1">Le réseau professionnel agricole</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md relative mx-2">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des récoltes, transporteurs, agronomes..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#edf3f8] border border-transparent rounded-md text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:border-[#0a66c2] transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (!currentUser) onOpenAuthModal();
              else onOpenCreateModal();
            }}
            className="flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Commencer un post / Annonce</span>
          </button>

          <div className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0a66c2]"></span>
          </div>
        </div>
      </div>

      {/* Primary Module Navigation Tabs */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center md:justify-start gap-2 overflow-x-auto no-scrollbar">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`flex flex-col items-center justify-center px-4 py-2 border-b-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#0a66c2] text-[#0a66c2]'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#0a66c2]' : 'text-slate-500'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
