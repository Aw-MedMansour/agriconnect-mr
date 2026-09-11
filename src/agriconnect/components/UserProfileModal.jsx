import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  UserPlus,
  UserCheck,
  MessageSquare,
  MapPin,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Share2,
  Repeat2,
  Image as ImageIcon,
  Video as VideoIcon,
  Store,
  Users,
  Star,
  Link
} from 'lucide-react';
import AsyncMediaItem from './AsyncMediaItem';
import MediaViewerModal from './MediaViewerModal';
import Avatar from './Avatar';

export default function UserProfileModal({
  isOpen,
  onClose,
  authorId,
  authorName,
  authorAvatar,
  authorRole,
  authorBadge,
  allPosts,
  allProducts,
  allUsers = [],
  currentUser,
  onToggleFollow,
  onStartConversation,
  onOpenProfile,
  onRequireAuth
}) {
  const [activeTab, setActiveTab] = useState('posts');
  const [viewerState, setViewerState] = useState({ isOpen: false, items: [], initialIndex: 0 });

  if (!isOpen) return null;

  const isFollowing = currentUser?.following?.includes(authorId);
  const isOwnProfile = currentUser?.id === authorId || currentUser?.name === authorName;

  // Filter posts by this author
  const userPosts = (allPosts || []).filter(
    p => p.authorId === authorId || p.authorName === authorName
  );

  // Filter products by this author/seller
  const userProducts = (allProducts || []).filter(
    p => p.sellerName === authorName || p.authorId === authorId
  );

  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likedBy?.length || 0) + (p.likesCount || 0), 0);

  // ── Relations (abonnés / abonnements) ──
  const profileUser =
    (isOwnProfile ? currentUser : null) ||
    (allUsers || []).find(u => String(u?.id) === String(authorId)) ||
    null;

  const followingIds = (profileUser?.following || []).map(String);
  const followingUsers = followingIds
    .map(id => (allUsers || []).find(u => String(u?.id) === id) || { id, name: id })
    .filter(Boolean);

  const followerUsers = (allUsers || []).filter(u =>
    (u?.following || []).map(String).includes(String(authorId))
  );

  const relationsCount = followerUsers.length + followingUsers.length;

  const openOther = (u) => {
    if (!onOpenProfile || !u?.id) return;
    onOpenProfile({
      authorId: u.id,
      authorName: u.name || 'Membre',
      authorAvatar: u.avatar || '',
      authorRole: u.roleLabel || 'Membre du réseau',
      authorBadge: u.badge || '',
    });
  };

  function renderPersonList(list, emptyLabel) {
    if (!list.length) {
      return (
        <div className="flex flex-col items-center py-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-500">{emptyLabel}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map(u => (
          <button
            key={u.id}
            onClick={() => openOther(u)}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <Avatar src={u.avatar} name={u.name} seed={u.id} className="w-9 h-9" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{u.roleLabel || 'Membre du réseau'}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  function renderGallery(media) {
    if (!media || media.length === 0) return null;
    const total = media.length;
    const display = media.slice(0, 4);
    let gridClass = 'grid gap-0.5 rounded-xl overflow-hidden mt-3 ';
    if (total === 1) gridClass += 'grid-cols-1 h-56';
    else if (total === 2) gridClass += 'grid-cols-2 h-48';
    else gridClass += 'grid-cols-2 grid-rows-2 h-56';

    return (
      <div className={gridClass}>
        {display.map((item, idx) => {
          const isLastMore = total > 4 && idx === 3;
          let itemClass = 'relative bg-black overflow-hidden cursor-pointer ';
          if (total === 3 && idx === 0) itemClass += 'col-span-2';
          return (
            <div
              key={item.id || idx}
              className={itemClass}
              onClick={() => setViewerState({ isOpen: true, items: media, initialIndex: idx })}
            >
              <AsyncMediaItem item={item} className="w-full h-full" style={{ objectFit: 'cover' }} isVideoThumbnail />
              {isLastMore && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <span className="text-white text-2xl font-bold">+{total - 3}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Profile Header ── */}
          <div className="relative">
            {/* Cover banner */}
            <div className="h-28 bg-gradient-to-r from-[#0a66c2] via-[#1e7fb5] to-emerald-600" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Avatar */}
            <Avatar
              src={authorAvatar}
              name={authorName}
              seed={authorId || authorName}
              className="absolute left-5 -bottom-10 w-20 h-20 border-4 border-white shadow-lg"
              textClassName="text-xl"
            />
          </div>

          {/* Profile info */}
          <div className="px-5 pt-12 pb-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-slate-900">{authorName}</h2>
                  <CheckCircle2 className="w-5 h-5 text-[#0a66c2] shrink-0" />
                  {authorBadge && (
                    <span className="text-[10px] font-bold bg-blue-50 text-[#0a66c2] border border-blue-200 px-2 py-0.5 rounded-full">
                      {authorBadge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{authorRole}</p>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-[#0a66c2]" />
                    {userPosts.length} publication{userPosts.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
                    {totalLikes} j'aime reçus
                  </span>
                  <span className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-emerald-500" />
                    {userProducts.length} produit{userProducts.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setActiveTab('relations')}
                    className="flex items-center gap-1 hover:text-[#0a66c2] transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-violet-500" />
                    {followerUsers.length} abonné{followerUsers.length !== 1 ? 's' : ''} · {followingUsers.length} abonnement{followingUsers.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?profile=${authorId}`;
                    navigator.clipboard.writeText(url);
                    alert('Lien du profil copié !');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all"
                  title="Copier le lien du profil"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
                {!isOwnProfile && (
                  <>
                    <button
                      onClick={() => {
                        if (!currentUser) { onRequireAuth(); return; }
                        onToggleFollow(authorId || authorName);
                      }}
                      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                        isFollowing
                          ? 'border-slate-300 text-slate-600 hover:border-rose-400 hover:text-rose-500'
                          : 'bg-[#0a66c2] border-[#0a66c2] text-white hover:bg-[#004182]'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {isFollowing ? 'Suivi' : '+ Suivre'}
                    </button>
                    <button
                      onClick={() => {
                        if (!currentUser) { onRequireAuth(); return; }
                        onStartConversation({ name: authorName, avatar: authorAvatar, id: authorId });
                        onClose();
                      }}
                      className="group/msg flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[#0a66c2] to-[#0ea5a0] text-white shadow-md shadow-[#0a66c2]/25 hover:shadow-lg hover:shadow-[#0a66c2]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 transition-transform group-hover/msg:scale-110" />
                      Message
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <span className="text-xs text-slate-400 italic font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                    Votre profil
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-slate-100">
            {[
              { id: 'posts', label: `Publications (${userPosts.length})`, icon: Users },
              { id: 'products', label: `Produits (${userProducts.length})`, icon: Store },
              { id: 'relations', label: `Relations (${relationsCount})`, icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#0a66c2] text-[#0a66c2]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <div className="overflow-y-auto flex-1 p-4 space-y-4">

            {/* ── POSTS TAB ── */}
            {activeTab === 'posts' && (
              <>
                {userPosts.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <MessageCircle className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Aucune publication encore.</p>
                  </div>
                ) : (
                  userPosts.map(post => {
                    const likesCount = (post.likesCount || 0) + (post.likedBy?.length || 0);
                    const media = post.media && post.media.length > 0 ? post.media : [];
                    return (
                      <div key={post.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                          <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full object-cover border-2 border-[#0a66c2]" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{authorName}</p>
                            <p className="text-[10px] text-slate-400">{post.timestamp}</p>
                          </div>
                        </div>

                        {post.content && (
                          <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{post.content}</p>
                        )}

                        {renderGallery(media)}

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-semibold">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5 text-[#0a66c2]" /> {likesCount} j'aime
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" /> {post.comments?.length || 0} commentaire{(post.comments?.length || 0) !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat2 className="w-3.5 h-3.5 text-emerald-500" /> {post.repostedBy?.length || 0} republication{(post.repostedBy?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* ── PRODUCTS TAB ── */}
            {activeTab === 'products' && (
              <>
                {userProducts.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Store className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Aucun produit publié.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userProducts.map(prod => {
                      const img = prod.images?.[0] || prod.media?.[0]?.url;
                      return (
                        <div key={prod.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                          {img ? (
                            <img src={img} alt={prod.title} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                              <Store className="w-8 h-8 text-slate-300" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-xs font-bold text-slate-900 line-clamp-2">{prod.title}</p>
                            <p className="text-sm font-extrabold text-[#0a66c2] mt-1">{prod.price}</p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{prod.location}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Media Viewer Modal */}
      <MediaViewerModal
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
        mediaItems={viewerState.items}
        initialIndex={viewerState.initialIndex}
      />
    </>
  );
}
