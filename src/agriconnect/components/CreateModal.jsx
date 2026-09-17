import React, { useState, useRef, useEffect } from 'react';
import { X, Store, Truck, PlusCircle, Image as ImageIcon, Video as VideoIcon, Lock, Play } from 'lucide-react';
import { uploadMedia } from '../utils/dbSync';

export default function CreateModal({ isOpen, onClose, defaultTab = 'product', defaultCategory = null, currentUser, onCreateProduct, onCreateService, onRequireAuth }) {
  const [formType, setFormType] = useState(defaultTab);
  const [isPublishing, setIsPublishing] = useState(false);

  // Product Form State
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState('Légumes');
  const [prodQuantity, setProdQuantity] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodLocation, setProdLocation] = useState('Rosso, Trarza');
  const [prodDescription, setProdDescription] = useState('');

  // Service Form State
  const [servTitle, setServTitle] = useState('');
  const [servType, setServType] = useState('offer'); // 'offer', 'request'
  const [servCategory, setServCategory] = useState(defaultCategory || 'transporteur_terrestre');

  useEffect(() => {
    if (isOpen) {
      setFormType(defaultTab);
      if (defaultCategory) {
        setServCategory(defaultCategory);
      } else {
        setServCategory('transporteur_terrestre');
      }
    }
  }, [isOpen, defaultTab, defaultCategory]);
  const [servPricing, setServPricing] = useState('');
  const [servLocation, setServLocation] = useState('Rosso & Axe Fleuve');
  const [servDescription, setServDescription] = useState('');
  const [servAvailability, setServAvailability] = useState('');

  // Multiple Media Attachments State: [{ id, type: 'image'|'video', url: string }]
  const [mediaItems, setMediaItems] = useState([]);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  if (!isOpen) return null;

  const handleMultipleFilesUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newItems = files.map(file => ({
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: type,
      file: file,
      url: URL.createObjectURL(file) // preview only
    }));

    setMediaItems(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removeMediaItem = (id) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    setIsPublishing(true);

    // Upload all media files to Supabase Storage
    const processedMedia = [];
    for (const item of mediaItems) {
      if (item.file) {
        try {
          const publicUrl = await uploadMedia(item.file, item.type === 'video' ? 'videos' : 'images');
          processedMedia.push({ id: item.id, type: item.type, url: publicUrl });
        } catch (err) {
          console.error('Upload failed:', err);
          // Fallback to blob URL
          processedMedia.push({ id: item.id, type: item.type, url: item.url });
        }
      } else {
        processedMedia.push(item);
      }
    }

    // Fallbacks for older components if needed, though we rely on `media` array mostly now
    const imagesList = processedMedia.filter(m => m.type === 'image').map(m => m.url || '');
    const videosList = processedMedia.filter(m => m.type === 'video').map(m => m.url || '');

    if (formType === 'product') {
      if (!prodTitle.trim() || !prodQuantity || !prodPrice) { setIsPublishing(false); return; }
      onCreateProduct({
        id: `prod-${Date.now()}`,
        title: prodTitle.trim(),
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerRole: currentUser.roleLabel || 'Agriculteur',
        sellerAvatar: currentUser.avatar,
        category: prodCategory,
        quantity: `${prodQuantity} ${prodQuantityUnit}`,
        price: `${prodPrice} ${prodPriceUnit}`,
        location: prodLocation,
        availabilityDate: 'Immédiate (Nouvelle publication)',
        images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'],
        videos: videosList,
        media: processedMedia,
        deliveryConditions: 'Transport à convenir avec l\'acheteur',
        description: prodDescription || 'Produit récolté avec soin.',
        verifiedSeller: true,
        likes: 1
      });
    } else if (formType === 'service') {
      if (!servTitle || !servPricing) return;
      onCreateService({
        id: `serv-${Date.now()}`,
        type: servType,
        title: servTitle,
        providerId: currentUser.id,
        providerName: currentUser.name,
        providerRole: currentUser.roleLabel || 'Prestataire',
        providerAvatar: currentUser.avatar,
        serviceCategory: servCategory,
        categoryLabel: {
          'transporteur_terrestre': 'Transport Terrestre',
          'transporteur_maritime': 'Transport Maritime',
          'energie_eau': 'Énergie & Eau',
          'banque_assurance': 'Banque & Assurance',
          'terrain': 'Terrain',
          'technicien': 'Technicien',
          'agronome': 'Agronome & Ouvrier'
        }[servCategory] || 'Service Spécialisé',
        pricing: servPricing,
        location: servLocation,
        availability: servAvailability || 'Disponible immédiatement',
        specs: servDescription.substring(0, 50) + '...',
        description: servDescription || 'Service disponible sur demande.',
        media: processedMedia,
        verified: true
      });
    }

    setMediaItems([]);
    setIsPublishing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 overflow-hidden shadow-2xl animate-scaleIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#0a66c2]" />
            <h3 className="text-lg font-bold text-slate-900">Nouvelle Publication AgriConnect</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Auth Warning if logged out */}
        {!currentUser && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-center flex items-center justify-center gap-2 text-amber-800 text-xs font-bold">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Vous devez être connecté à un compte professionnel pour publier.</span>
            <button 
              onClick={onRequireAuth}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-full text-[11px] font-bold"
            >
              Créer compte / Connexion
            </button>
          </div>
        )}

        {/* Type Selector Tabs */}
        {!defaultCategory && (
          <div className="grid grid-cols-2 p-3 bg-slate-100 border-b border-slate-200 gap-2">
            <button
              onClick={() => setFormType('product')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                formType === 'product' 
                  ? 'bg-[#0a66c2] text-white shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Store className="w-4 h-4" /> Vendre Récolte / Produit
            </button>
            <button
              onClick={() => setFormType('service')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                formType === 'service' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" /> Publier Offre / Demande Service
            </button>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {formType === 'product' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de la récolte / produit</label>
                <input
                  type="text"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="Ex: 10 Tonnes de Tomates Rania fraîches"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white cursor-pointer"
                  >
                    <option value="Légumes">🍅 Légumes</option>
                    <option value="Fruits & Dattes">🌴 Fruits & Dattes</option>
                    <option value="Céréales">🌾 Céréales</option>
                    <option value="Intrants & Semences">🌱 Intrants & Engrais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité disponible (unité obligatoire)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={prodQuantity}
                      onChange={(e) => setProdQuantity(e.target.value)}
                      placeholder="Ex: 500"
                      required
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                    />
                    <select
                      value={prodQuantityUnit}
                      onChange={(e) => setProdQuantityUnit(e.target.value)}
                      aria-label="Unité de quantité"
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="Tonnes">Tonnes</option>
                      <option value="Litres">Litres</option>
                      <option value="Sacs">Sacs</option>
                      <option value="Caisses">Caisses</option>
                      <option value="Unités">Unités</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prix (MRU) et base de facturation</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="Ex: 320"
                      required
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                    />
                    <select
                      value={prodPriceUnit}
                      onChange={(e) => setProdPriceUnit(e.target.value)}
                      aria-label="Base de prix"
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                    >
                      <option value="MRU / kg">MRU / kg</option>
                      <option value="MRU / Tonne">MRU / Tonne</option>
                      <option value="MRU / Litre">MRU / Litre</option>
                      <option value="MRU / Sac">MRU / Sac</option>
                      <option value="MRU / Unité">MRU / Unité</option>
                      <option value="MRU (prix global)">MRU (prix global)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Localisation</label>
                  <input
                    type="text"
                    value={prodLocation}
                    onChange={(e) => setProdLocation(e.target.value)}
                    placeholder="Ex: Rosso, Trarza"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                  />
                </div>
              </div>


              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & conditions de livraison</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Précisez le conditionnement, accès camion, mode de paiement..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l'annonce de service</label>
                <input
                  type="text"
                  value={servTitle}
                  onChange={(e) => setServTitle(e.target.value)}
                  placeholder="Ex: Camion frigorifique 15T disponible Rosso → Nouakchott"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type d'annonce</label>
                  <select
                    value={servType}
                    onChange={(e) => setServType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
                  >
                    <option value="offer">🚚 Offre de Service (Je suis prestataire)</option>
                    <option value="request">📢 Demande d'Agriculteur (J'ai un besoin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie de Service</label>
                  <select
                    value={servCategory}
                    onChange={(e) => setServCategory(e.target.value)}
                    disabled={!!defaultCategory}
                    className={`w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 ${defaultCategory ? 'opacity-70 cursor-not-allowed' : 'focus:bg-white cursor-pointer'}`}
                  >
                    <option value="transporteur_terrestre">🚚 Transport Terrestre</option>
                    <option value="transporteur_maritime">🚢 Transport Maritime</option>
                    <option value="energie_eau">💧 Énergie & Eau</option>
                    <option value="banque_assurance">🏦 Banque & Assurance</option>
                    <option value="terrain">🗺️ Terrain Louer / Vendre</option>
                    <option value="technicien">🔧 Technicien / Réparation</option>
                    <option value="agronome">👨‍🔬 Agronome & Ouvrier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarif / Budget estimé</label>
                  <input
                    type="text"
                    value={servPricing}
                    onChange={(e) => setServPricing(e.target.value)}
                    placeholder="Ex: Sur devis ou 45 000 MRU"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zone d'intervention</label>
                  <input
                    type="text"
                    value={servLocation}
                    onChange={(e) => setServLocation(e.target.value)}
                    placeholder="Ex: Rosso, Boghé, Nouakchott"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disponibilité / Délai</label>
                <input
                  type="text"
                  value={servAvailability}
                  onChange={(e) => setServAvailability(e.target.value)}
                  placeholder="Ex: Immédiatement, Dans 2 jours..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Détails & spécifications techniques</label>
                <textarea
                  rows={3}
                  value={servDescription}
                  onChange={(e) => setServDescription(e.target.value)}
                  placeholder="Décrivez les caractéristiques techniques du camion, du forage, ou de l'équipement..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </>
          )}

          {/* Photos & Videos Upload Area (Shared for both Product and Service) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ajouter des Photos et/ou Vidéos (Plusieurs autorisées)</label>
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-300">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                ref={photoInputRef}
                onChange={(e) => handleMultipleFilesUpload(e, 'image')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#0a66c2]" />
                <span>+ Photos</span>
              </button>

              <input 
                type="file" 
                accept="video/*" 
                multiple
                ref={videoInputRef}
                onChange={(e) => handleMultipleFilesUpload(e, 'video')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer"
              >
                <VideoIcon className="w-4 h-4 text-emerald-600" />
                <span>+ Vidéos</span>
              </button>

              <span className="text-[11px] text-slate-500 font-medium">({mediaItems.length} fichier(s) sélectionné(s))</span>
            </div>

            {/* Multiple Media Preview Grid */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {mediaItems.map((item) => (
                  <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-300">
                    {item.type === 'image' ? (
                      <img src={item.url} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMediaItem(item.id)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className={`px-6 py-2.5 rounded-full text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50 ${
                formType === 'product' ? 'bg-[#0a66c2] hover:bg-[#004182]' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPublishing ? 'Publication...' : 'Publier l\'Annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
