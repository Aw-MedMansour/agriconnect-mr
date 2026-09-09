import React, { useState } from 'react';
import { 
  Store, 
  MapPin, 
  Calendar, 
  Truck, 
  MessageSquare, 
  PlusCircle, 
  CheckCircle2, 
  Heart, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  ThumbsUp,
  MessageCircle,
  Share2,
  Repeat2
} from 'lucide-react';
import AsyncMediaItem from './AsyncMediaItem';
import MediaViewerModal from './MediaViewerModal';

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
export default function MarketplaceProducts({ products, currentUser, onContactSeller, onRequestTransport, onOpenCreate, searchQuery, onToggleLike, onAddComment, onShare, onRepost, onOpenProfile, onRequireAuth }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewerState, setViewerState] = useState({ isOpen: false, items: [], initialIndex: 0 });
  const [commentInputs, setCommentInputs] = useState({});

  const categories = [
    { id: 'all', label: 'Toutes les récoltes' },
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
    <div className="max-w-7xl mx-auto px-4 py-8">
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
              Marketplace des <span className="text-[#0a66c2]">Produits Agricoles</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            « Je produis → je publie avec photos/vidéos → un acheteur me contacte direct ». Ventes sans intermédiaire.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Vendre ma récolte</span>
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
          <h3 className="text-lg font-bold text-slate-900 mb-1">Aucun produit trouvé</h3>
          <p className="text-xs text-slate-500 mb-4">Essayez d'ajuster votre recherche ou filtre par catégorie.</p>
          <button 
            onClick={() => { setSelectedCategory('all'); }}
            className="text-xs text-[#0a66c2] underline font-bold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => {
            const isLiked = currentUser && prod.likedBy?.includes(currentUser.id);
            const likesCount = (prod.likesCount || 0) + (prod.likedBy?.length || 0);
            const isReposted = currentUser && prod.repostedBy?.includes(currentUser.id);
            const repostsCount = prod.repostedBy?.length || 0;
            const mediaCount = prod.media?.length || prod.images?.length || 1;

            return (
              <div 
                key={prod.id} 
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* ── Media Carousel (photos + videos) ── */}
                <div className="relative">
                  <ProductMediaGrid 
                    prod={prod} 
                    onOpenViewer={(items, index) => setViewerState({ isOpen: true, items, initialIndex: index })}
                  />

                  {/* Badge Category & Verified */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 pointer-events-none">
                    <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-slate-200">
                      {prod.category}
                    </span>
                    {prod.verifiedSeller && (
                      <span className="bg-[#0a66c2] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Vérifié
                      </span>
                    )}
                  </div>



                  {/* Volume Banner at bottom of media */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-6 flex items-center justify-between z-10">
                    <span className="text-xs font-semibold text-slate-200">Volume:</span>
                    <span className="text-xs font-extrabold text-white bg-[#0a66c2] px-2.5 py-0.5 rounded-md">
                      {prod.quantity}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#0a66c2] transition-colors line-clamp-2 mb-2">
                      {prod.title}
                    </h3>

                    <div className="text-lg font-black text-[#0a66c2] mb-3">
                      {prod.price}
                    </div>

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

                  {/* Seller Info & Actions */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={prod.sellerAvatar} 
                        alt={prod.sellerName}
                        className="w-8 h-8 rounded-full object-cover border border-[#0a66c2] cursor-pointer hover:ring-2 hover:ring-[#0a66c2]/40 transition-all"
                        onClick={() => onOpenProfile && onOpenProfile({ authorId: prod.sellerName, authorName: prod.sellerName, authorAvatar: prod.sellerAvatar, authorRole: prod.sellerRole })}
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-[#0a66c2] transition-colors inline-block"
                          onClick={() => onOpenProfile && onOpenProfile({ authorId: prod.sellerName, authorName: prod.sellerName, authorAvatar: prod.sellerAvatar, authorRole: prod.sellerRole })}
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
                        <span>Contacter</span>
                      </button>

                      <button
                        onClick={() => onRequestTransport(prod)}
                        className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold py-2.5 rounded-full shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#0a66c2]" />
                        <span>Transport</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Social Actions ── */}
                  <div className="pt-3 mt-3 border-t border-slate-200">
                    <div className="flex items-center justify-around py-1 text-[11px] font-semibold text-slate-600">
                      <button 
                        onClick={() => onToggleLike(prod.id)}
                        className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${isLiked ? 'text-[#0a66c2]' : ''}`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#0a66c2] text-[#0a66c2]' : ''}`} />
                        <span>J'aime ({likesCount})</span>
                      </button>

                      <button 
                        onClick={() => {
                          const input = document.getElementById(`comment-input-${prod.id}`);
                          if(input) input.focus();
                        }}
                        className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Commenter ({prod.comments?.length || 0})</span>
                      </button>

                      <button 
                        onClick={() => onShare(prod)}
                        className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Partager</span>
                      </button>

                      <button 
                        onClick={() => onRepost && onRepost(prod)}
                        className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${isReposted ? 'text-emerald-600' : ''}`}
                      >
                        <Repeat2 className={`w-3.5 h-3.5 ${isReposted ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <span>Repub. ({repostsCount})</span>
                      </button>
                    </div>

                    {/* Comments preview */}
                    <div className="space-y-2 mt-2">
                      {prod.comments?.map((c) => (
                        <div key={c.id} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <img 
                            src={c.avatar} 
                            alt={c.user} 
                            className="w-5 h-5 rounded-full object-cover shrink-0 cursor-pointer hover:ring-2 hover:ring-[#0a66c2]/40 transition-all"
                            onClick={() => onOpenProfile && onOpenProfile({ authorId: c.userId || c.user, authorName: c.user, authorAvatar: c.avatar, authorRole: 'Membre Réseau' })}
                          />
                          <div>
                            <div 
                              className="text-[10px] font-bold text-slate-900 cursor-pointer hover:text-[#0a66c2] transition-colors inline-block"
                              onClick={() => onOpenProfile && onOpenProfile({ authorId: c.userId || c.user, authorName: c.user, authorAvatar: c.avatar, authorRole: 'Membre Réseau' })}
                            >
                              {c.user}
                            </div>
                            <p className="text-[10px] text-slate-700 leading-tight">{c.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          id={`comment-input-${prod.id}`}
                          type="text"
                          value={commentInputs[prod.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [prod.id]: e.target.value })}
                          placeholder={currentUser ? "Votre commentaire..." : "Connectez-vous..."}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && commentInputs[prod.id]?.trim()) {
                              onAddComment(prod.id, commentInputs[prod.id]);
                              setCommentInputs({ ...commentInputs, [prod.id]: '' });
                            }
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-[11px] focus:outline-none focus:border-[#0a66c2]"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
