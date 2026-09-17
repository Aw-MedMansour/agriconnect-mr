import React, { useState } from 'react';
import { X, Mail, Lock, User, MapPin, Camera, ArrowRight } from 'lucide-react';
import { ACTOR_CATEGORIES } from '../data/mockData';
import { saveUser, findUserById } from '../utils/dbSync';
import { supabase } from '../utils/supabaseClient';
import agriLogo from '../assets/agriconnect-logo.png';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, allUsers = [] }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('signup');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('agriculteur');
  const [company, setCompany]     = useState('');
  const [location, setLocation]   = useState('Rosso, Trarza');
  const [profilePic, setProfilePic] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return;
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          const raw = (signUpError.message || '').toLowerCase();
          setError(
            raw.includes('already')
              ? 'Cet email est déjà utilisé.'
              : raw.includes('weak') || raw.includes('easy to guess')
                ? 'Mot de passe trop faible. Choisissez-en un plus long et unique.'
                : raw.includes('password')
                  ? 'Mot de passe invalide : au moins 6 caractères.'
                  : signUpError.message || 'Inscription impossible.'
          );
          setLoading(false);
          return;
        }

        // Make sure a session exists before writing the profile (otherwise it is refused)
        let session = data.session;
        if (!session) {
          const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
          session = signInData?.session || null;
        }
        if (!session) {
          setError("Compte créé, mais la connexion a échoué. Essayez « Se Connecter ».");
          setLoading(false);
          return;
        }

        const uid = session.user?.id || data.user?.id || `user-${Date.now()}`;
        const newUser = {
          id: uid,
          name: fullName || 'Utilisateur',
          email,
          role,
          roleLabel: ACTOR_CATEGORIES.find(c => c.id === role)?.label || 'Membre Professionnel',
          company: company || 'Exploitation Agricole',
          location,
          avatar: profilePic || '',
          verified: true,
          badge: 'Membre Vérifié',
        };

        await saveUser(newUser);
        onLoginSuccess(newUser, true);
        onClose();

      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError || !data.user) {
          setError('Email ou mot de passe incorrect.');
          setLoading(false);
          return;
        }

        const profile = await findUserById(data.user.id);
        onLoginSuccess(profile || {
          id: data.user.id,
          name: data.user.user_metadata?.name || email.split('@')[0],
          email,
          role: 'agriculteur',
          roleLabel: 'Membre',
          company: '',
          location: '',
          avatar: '',
          verified: true,
          badge: 'Membre Vérifié',
        }, false);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProfilePic(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/70 p-3 backdrop-blur-xs sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white ring-1 ring-slate-200 shadow-xs">
              <img src={agriLogo} alt="Logo AgriConnect" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                 {mode === 'signup' ? t('Créer un Compte AgriConnect') : t('Se Connecter à AgriConnect')}
              </h3>
               <p className="text-xs text-slate-500 font-medium">{t('Rejoignez le réseau professionnel agricole')}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200 gap-2">
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${mode === 'signup' ? 'bg-[#0a66c2] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
          >
             {t("S'inscrire (Nouveau Compte)")}
          </button>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${mode === 'login' ? 'bg-[#0a66c2] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
          >
             {t('Se Connecter')}
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {mode === 'signup' && (
            <>
              {/* Profile Photo */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative">
                  <Avatar
                    src={profilePic}
                    name={fullName || 'Nouveau membre'}
                    seed={email || fullName || 'nouveau'}
                    className="w-14 h-14 border-2 border-[#0a66c2]"
                    textClassName="text-base"
                  />
                  <label className="absolute bottom-0 right-0 bg-[#0a66c2] text-white p-1 rounded-full cursor-pointer shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <div>
                   <span className="text-xs font-bold text-slate-800 block">{t('Photo de profil')}</span>
                   <span className="text-[11px] text-slate-500 font-medium">{t('Ajoutez une photo claire pour votre badge vérifié.')}</span>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">{t('Nom Complet / Entreprise')}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Ex: Mamadou Oumar Diallo" required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white" />
                </div>
              </div>

               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">{t('Rôle Professionnel')}</label>
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white cursor-pointer font-medium">
                    {ACTOR_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">{t('Nom Exploitation / Société')}</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="Ex: Ferme du Fleuve"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white" />
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">{t('Région / Localisation')}</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#0a66c2] absolute left-3.5 top-3" />
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Ex: Rosso, Trarza" required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white" />
                </div>
              </div>
            </>
          )}

          <div>
             <label className="block text-xs font-bold text-slate-700 mb-1">{t('Adresse Email')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre.email@agriconnect.mr" required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 mb-1">{t('Mot de passe')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white" />
            </div>
          </div>

          {mode === 'signup' && (
            <label className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0a66c2] cursor-pointer"
              />
              <span className="text-[11px] text-slate-600 font-medium leading-snug">
                J'ai lu et j'accepte les{' '}
                <a href="/conditions" target="_blank" rel="noreferrer" className="text-[#0a66c2] font-bold underline">conditions d'utilisation</a>
                {' '}et les{' '}
                <a href="/mentions-legales" target="_blank" rel="noreferrer" className="text-[#0a66c2] font-bold underline">mentions légales</a> d'AgriConnect.
              </span>
            </label>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading || (mode === 'signup' && !acceptTerms)}
              className="w-full flex items-center justify-center gap-2 bg-[#0a66c2] hover:bg-[#004182] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-full shadow-md transition-all cursor-pointer">
               <span>{loading ? t('Chargement...') : mode === 'signup' ? t('Créer mon Compte & Continuer') : t('Se Connecter')}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
