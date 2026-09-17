import React, { useState, useRef, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Calendar, 
  Truck, 
  MessageSquare, 
  PlusCircle, 
  CheckCircle2, 
  Filter,
  Image as ImageIcon,
  ThumbsUp,
  MessageCircle,
  Share2,
  Repeat2,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AsyncMediaItem from './AsyncMediaItem';
import MediaViewerModal from './MediaViewerModal';
import Avatar from './Avatar';
import { useLanguage } from '../i18n';

// Une quantité doit toujours porter une unité lisible (kg, tonne, litre, sac…).
export function formatQuantity(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Quantité non précisée';
  if (/^\d+([.,]\d+)?$/.test(raw)) return `${raw} unité${Number(raw.replace(',', '.')) > 1 ? 's' : ''}`;
  return raw
    .replace(/(\d)\s*t\b/i, '$1 Tonnes')
    .replace(/(\d)\s*kgs?\b/i, '$1 kg')
    .replace(/(\d)\s*l\b/i, '$1 litres');
}

// Enregistre une vue lorsque la carte devient réellement visible à l'écran.
export function useViewTracker(id, onRegisterView) {
  const ref = useRef(null);
  useEffect(() => {
    if (!onRegisterView || !ref.current || typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onRegisterView(id);
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, onRegisterView]);
  return ref;
}


// ── Sub-component: Product Media Grid ────────────────────────────────────
function ProductMediaGrid({ prod, onOpenViewer }) {
  // Build a unified list from media array (uploaded) OR from images/videos arrays
  let allMedia = [];
  if (prod.media && prod.media.length > 0) {
    allMedia = prod.media; // [{ type:'image'|'video', url }]
  } else {
    if (prod.images) prod.images.forEach(url => allMedia.push({ type: 'image', url }));
    if (prod.videos) prod.videos.forEach(url => allMedia.push({ type: 'video', url }));
    if (allMedia.length === 0 && prod.images?.[0]) {
      allMedia = [{ type: 'image', url: prod.images[0] }];
    }
  }

  if (allMedia.length === 0) {
    return (
      <div className="relative h-48 bg-slate-100 flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-slate-300" />
      </div>
    );
  }

  const total = allMedia.length;

  if (total === 1) {
    return (
      <div 
        className="relative h-48 overflow-hidden bg-black group cursor-pointer" 
        onClick={() => onOpenViewer(allMedia, 0)}
      >
        <AsyncMediaItem item={allMedia[0]} className="w-full h-full" style={{ objectFit: 'cover' }} isVideoThumbnail={true} />
        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
          {allMedia[0].type === 'video' ? '🎥 Vidéo' : '📷 Photo'}
        </span>
      </div>
    );
  }

  const displayItems = allMedia.slice(0, 4);
  
  let gridClass = 'grid gap-0.5 h-48 overflow-hidden bg-slate-200 ';
  if (total === 2) gridClass += 'grid-cols-2';
  else if (total === 3) gridClass += 'grid-cols-2 grid-rows-2';
  else gridClass += 'grid-cols-2 grid-rows-2'; // 4 or more

  return (
    <div className={gridClass}>
      {displayItems.map((item, idx) => {
        let itemClass = "relative bg-black group w-full h-full cursor-pointer overflow-hidden ";
        
        if (total === 3 && idx === 0) {
          itemClass += "col-span-2 row-span-1";
        }
        
        const isLastAndMore = total > 4 && idx === 3;

        return (
          <div 
            key={item.id || idx}
            className={itemClass}
            onClick={() => onOpenViewer(allMedia, idx)}
          >
            <AsyncMediaItem 
              item={item} 
              className="w-full h-full" 
              style={{ objectFit: 'cover' }}
              isVideoThumbnail={true}
            />
            
            <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none z-10 backdrop-blur-sm">
              {item.type === 'image' ? '📷' : '🎥'}
            </span>

            {isLastAndMore && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <span className="text-white text-xl font-bold">+{total - 3}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MarketplaceProducts({ products, currentUser, onContactSeller, onRequestTransport, onOpenCreate, searchQuery, onToggleLike, onAddComment, onShare, onRepost, onOpenProfile, onRequireAuth, onDeleteProduct = () => {}, onRegisterView }) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewerState, setViewerState] = useState({ isOpen: false, items: [], initialIndex: 0 });
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});

  const categories = [
    { id: 'all', label: t('Toutes les récoltes') },
    { id: 'Légumes', label: '🍅 Légumes' },
    { id: 'Fruits & Dattes', label: '🌴 Fruits & Dattes' },
    { id: 'Céréales', label: '🌾 Céréales (Riz, Maïs)' },
    { id: 'Intrants & Semences', label: '🌱 Intrants & Engrais' }
  ];



  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
     <div className="mx-auto min-h-[720px] max-w-7xl px-4 py-8">
      {/* Media Viewer Modal */}
      <MediaViewerModal 
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
        mediaItems={viewerState.items}
        initialIndex={viewerState.initialIndex}
      />

      {/* Module Title & Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-[#0a66c2] border border-blue-200">
              <Store className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('Marketplace des Produits Agricoles')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
             {t('« Je produis → je publie avec photos/vidéos → un acheteur me contacte direct ». Ventes sans intermédiaire.')}
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('Vendre ma récolte')}</span>
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
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

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">{t('Aucun produit trouvé')}</h3>
          <p className="text-xs text-slate-500 mb-4">{t("Essayez d'ajuster votre recherche ou filtre par catégorie.")}</p>
          <button 
            onClick={() => { setSelectedCategory('all'); }}
            className="text-xs text-[#0a66c2] underline font-bold"
          >
            {t('Réinitialiser les filtres')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              prod={prod}
              currentUser={currentUser}
              onContactSeller={onContactSeller}
              onRequestTransport={onRequestTransport}
              onToggleLike={onToggleLike}
              onAddComment={onAddComment}
              onShare={onShare}
              onRepost={onRepost}
              onOpenProfile={onOpenProfile}
              onDeleteProduct={onDeleteProduct}
              onRegisterView={onRegisterView}
              onOpenViewer={(items, index) => setViewerState({ isOpen: true, items, initialIndex: index })}
              commentValue={commentInputs[prod.id] || ''}
              setCommentValue={(v) => setCommentInputs(prev => ({ ...prev, [prod.id]: v }))}
              isCommentsOpen={!!openComments[prod.id]}
              toggleComments={() => setOpenComments(prev => ({ ...prev, [prod.id]: !prev[prod.id] }))}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Carte produit ─────────────────────────────────────────────────────────────
function ProductCard({
  prod, currentUser, onContactSeller, onRequestTransport, onToggleLike, onAddComment,
  onShare, onRepost, onOpenProfile, onDeleteProduct, onRegisterView, onOpenViewer,
  commentValue, setCommentValue, isCommentsOpen, toggleComments, t,
}) {
  const cardRef = useViewTracker(prod.id, onRegisterView);
  const isLiked = currentUser && prod.likedBy?.includes(currentUser.id);
  const likesCount = (prod.likesCount || 0) + (prod.likedBy?.length || 0);
  const isReposted = currentUser && prod.repostedBy?.includes(currentUser.id);
  const repostsCount = prod.repostedBy?.length || 0;
  const commentsCount = prod.comments?.length || 0;
  const sharesCount = prod.sharesCount || 0;
  const viewsCount = prod.viewsCount || 0;
  const mediaCount = prod.media?.length || prod.images?.length || 1;
  const isOwner = currentUser && String(prod.sellerId) === String(currentUser.id);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
    >
      {/* ── Médias ── */}
      <div className="relative">
        <ProductMediaGrid prod={prod} onOpenViewer={onOpenViewer} />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-slate-200">
            {prod.category}
          </span>
          {prod.verifiedSeller && (
            <span className="bg-[#0a66c2] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('Vérifié')}
            </span>
          )}
        </div>

        {isOwner && (
          <button
            onClick={() => {
              if (window.confirm('Supprimer définitivement cette annonce ?')) onDeleteProduct(prod.id);
            }}
            aria-label="Supprimer mon annonce"
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Quantité disponible, toujours avec son unité */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-6 flex items-center justify-between z-10">
          <span className="text-xs font-semibold text-slate-200">{t('Quantité :')}</span>
          <span className="text-xs font-extrabold text-white bg-[#0a66c2] px-2.5 py-0.5 rounded-md">
            {formatQuantity(prod.quantity)}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#0a66c2] transition-colors line-clamp-2 mb-2">
            {prod.title}
          </h3>

          <div className="text-lg font-black text-[#0a66c2] mb-3">{prod.price}</div>

          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 font-medium">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#0a66c2] shrink-0" />
              <span className="truncate">{prod.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{prod.availabilityDate}</span>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{prod.deliveryConditions}</span>
            </div>
          </div>
        </div>

        {/* Vendeur & actions principales */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={prod.sellerAvatar}
              name={prod.sellerName}
              seed={prod.sellerId || prod.sellerName}
              className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-[#0a66c2]/40 transition-all"
              textClassName="text-[10px]"
              onClick={() => onOpenProfile && onOpenProfile({ authorId: prod.sellerId || prod.sellerName, authorName: prod.sellerName, authorAvatar: prod.sellerAvatar, authorRole: prod.sellerRole })}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-[#0a66c2] transition-colors inline-block"
                onClick={() => onOpenProfile && onOpenProfile({ authorId: prod.sellerId || prod.sellerName, authorName: prod.sellerName, authorAvatar: prod.sellerAvatar, authorRole: prod.sellerRole })}
              >
                {prod.sellerName}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{prod.sellerRole}</div>
            </div>
            {mediaCount > 1 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                📷 {mediaCount} médias
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onContactSeller(prod)}
              className="group/msg flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#0a66c2] to-[#0ea5a0] text-white text-xs font-bold py-2.5 rounded-full shadow-md shadow-[#0a66c2]/25 hover:shadow-lg hover:shadow-[#0a66c2]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 transition-transform group-hover/msg:scale-110" />
              <span>{t('Contacter')}</span>
            </button>

            <button
              onClick={() => onRequestTransport(prod)}
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold py-2.5 rounded-full shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#0a66c2]" />
              <span>{t('Transport')}</span>
            </button>
          </div>
        </div>

        {/* ── Compteurs & interactions ── */}
        <div className="pt-3 mt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pb-2">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {viewsCount} vue{viewsCount > 1 ? 's' : ''}
            </span>
            <span>{likesCount} j'aime · {commentsCount} commentaire{commentsCount > 1 ? 's' : ''} · {sharesCount} partage{sharesCount > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center justify-around py-1 text-[11px] font-semibold text-slate-600 border-t border-slate-100">
            <button
              onClick={() => onToggleLike(prod.id)}
              className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${isLiked ? 'text-[#0a66c2]' : ''}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#0a66c2] text-[#0a66c2]' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={toggleComments}
              aria-expanded={isCommentsOpen}
              className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${isCommentsOpen ? 'text-[#0a66c2]' : ''}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{commentsCount}</span>
              {isCommentsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={() => onShare(prod)}
              className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{sharesCount}</span>
            </button>

            <button
              onClick={() => onRepost && onRepost(prod)}
              className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${isReposted ? 'text-emerald-600' : ''}`}
            >
              <Repeat2 className={`w-3.5 h-3.5 ${isReposted ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>{repostsCount}</span>
            </button>
          </div>

          {/* Espace commentaires dédié : hauteur bornée, sans déformer la carte */}
          {isCommentsOpen && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {commentsCount === 0 && (
                  <p className="text-[11px] text-slate-400 font-medium py-1">{t('Aucun commentaire pour le moment.')}</p>
                )}
                {prod.comments?.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Avatar
                      src={c.avatar}
                      name={c.user}
                      seed={c.userId || c.user}
                      className="w-5 h-5 shrink-0 cursor-pointer"
                      textClassName="text-[7px]"
                      onClick={() => onOpenProfile && onOpenProfile({ authorId: c.userId || c.user, authorName: c.user, authorAvatar: c.avatar, authorRole: 'Membre Réseau' })}
                    />
                    <div className="min-w-0">
                      <div
                        className="text-[10px] font-bold text-slate-900 cursor-pointer hover:text-[#0a66c2] transition-colors inline-block"
                        onClick={() => onOpenProfile && onOpenProfile({ authorId: c.userId || c.user, authorName: c.user, authorAvatar: c.avatar, authorRole: 'Membre Réseau' })}
                      >
                        {c.user}
                      </div>
                      <p className="text-[10px] text-slate-700 leading-snug break-words">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id={`comment-input-${prod.id}`}
                  type="text"
                  value={commentValue}
                  onChange={(e) => setCommentValue(e.target.value)}
                  placeholder={currentUser ? t('Votre commentaire…') : t('Connectez-vous…')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentValue.trim()) {
                      onAddComment(prod.id, commentValue);
                      setCommentValue('');
                    }
                  }}
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-[11px] focus:outline-none focus:border-[#0a66c2]"
                />
                <button
                  onClick={() => {
                    if (commentValue.trim()) { onAddComment(prod.id, commentValue); setCommentValue(''); }
                  }}
                  className="shrink-0 bg-[#0a66c2] hover:bg-[#004182] text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  {t('Envoyer')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
