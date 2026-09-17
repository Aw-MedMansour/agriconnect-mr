import React, { useState } from 'react';
import {
  Store,
  Truck,
  Users,
  ShieldCheck,
  PlusCircle,
  Search,
  Bell,
  User,
  UserCircle,
  LogOut,
  MessageSquare,
  BrainCircuit,
  X,
} from 'lucide-react';
import agriLogo from '../assets/agriconnect-logo.png';
import Avatar from './Avatar';

export default function Navbar({
  activeModule,
  setActiveModule,
  onOpenCreateModal,
  currentUser,
  onOpenAuthModal,
  onLogout,
  searchQuery,
  setSearchQuery,
  unreadCount = 0,
  isMessagingOpen = false,
  onToggleMessaging = () => {},
  notificationCount = 0,
  isNotificationsOpen = false,
  onToggleNotifications = () => {},
  onOpenMyProfile = () => {},
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const modules = [
    { id: 'products', label: 'Marketplace Produits', icon: Store },
    { id: 'services', label: 'Marketplace Services', icon: Truck },
    { id: 'social', label: 'Réseau Social Agricole', icon: Users },
    { id: 'ai', label: 'Intelligence artificielle', icon: BrainCircuit },
    { id: 'reputation', label: 'Acteurs & Réputation', icon: ShieldCheck },
  ];

  const iconButton =
    'relative flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Ligne principale : publication | identité centrée | actions utilisateur */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Gauche : publier */}
        <div className="flex items-center min-w-0">
          <button
            onClick={() => {
              if (!currentUser) onOpenAuthModal();
              else onOpenCreateModal();
            }}
            className="flex items-center gap-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-2 rounded-full shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Publier une annonce</span>
          </button>
        </div>

        {/* Centre : logo + nom */}
        <button
          onClick={() => setActiveModule('products')}
          className="flex items-center gap-2 justify-center cursor-pointer group"
          aria-label="Accueil AgriConnect"
        >
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm group-hover:ring-[#0a66c2] transition-all">
            <img src={agriLogo} alt="Logo AgriConnect" className="w-full h-full object-cover" />
          </span>
          <span className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
            Agri<span className="text-[#0a66c2]">Connect</span>
          </span>
        </button>

        {/* Droite : profil · recherche · notifications · messagerie */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1.5">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Mon profil"
                className={`${iconButton} ${showProfileMenu ? 'bg-blue-50' : 'hover:bg-slate-100'}`}
              >
                <Avatar
                  src={currentUser.avatar}
                  name={currentUser.name}
                  seed={currentUser.id || currentUser.name}
                  className="w-7 h-7"
                  textClassName="text-[9px]"
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser.roleLabel || 'Membre'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenMyProfile();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 font-bold hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <UserCircle className="w-4 h-4 text-[#0a66c2]" />
                    <span>Mon profil & mes publications</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 font-bold hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1 bg-white border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}

          {/* Recherche */}
          <button
            onClick={() => setShowSearch(open => !open)}
            aria-label="Rechercher"
            aria-expanded={showSearch}
            className={`${iconButton} ${showSearch ? 'bg-blue-50 text-[#0a66c2]' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button
            onClick={onToggleNotifications}
            aria-label="Ouvrir les notifications"
            aria-expanded={isNotificationsOpen}
            className={`${iconButton} ${isNotificationsOpen ? 'bg-blue-50 text-[#0a66c2]' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Messagerie */}
          <button
            onClick={onToggleMessaging}
            aria-label="Ouvrir la messagerie"
            className={`${iconButton} ${isMessagingOpen ? 'bg-blue-50 text-[#0a66c2]' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barre de recherche dépliable (n'altère pas la mise en page des autres éléments) */}
      {showSearch && (
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-2 relative">
            <Search className="w-4 h-4 absolute left-7 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une récolte, un service, un membre…"
              className="w-full pl-9 pr-4 py-2 bg-[#edf3f8] border border-transparent rounded-full text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:border-[#0a66c2] transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation principale */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-start md:justify-center gap-1 overflow-x-auto no-scrollbar">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`flex flex-col items-center justify-center px-3 sm:px-4 py-2 border-b-2 text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
