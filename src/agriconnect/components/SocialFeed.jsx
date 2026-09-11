import React, { useState, useRef } from 'react';
import { 
  Users, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Send, 
  Image as ImageIcon, 
  Video as VideoIcon,
  CheckCircle2, 
  X,
  Lock,
  Play,
  Repeat2,
  UserPlus,
  UserCheck,
  SmilePlus,
  CornerDownRight,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { saveMedia } from '../utils/db';
import AsyncMediaItem from './AsyncMediaItem';
import MediaViewerModal from './MediaViewerModal';
import Avatar from './Avatar';

export default function SocialFeed({ posts, currentUser, onAddPost, onEditPost, onDeletePost, onAddComment, onToggleLike, onRepost, onToggleFollow, onAddCommentReaction, onShare, onContactUser, onRequireAuth, allProducts, onOpenProfile }) {
  const [newPostText, setNewPostText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState({}); // { postId: commentId }
  const [emojiPickerFor, setEmojiPickerFor] = useState(null); // commentId
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Post edit/delete state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [optionsOpenFor, setOptionsOpenFor] = useState(null);

  // Multiple media attachments state: [{ id, type, file, url }]
  const [mediaItems, setMediaItems] = useState([]);
  
  // Viewer Modal State
  const [viewerState, setViewerState] = useState({ isOpen: false, items: [], initialIndex: 0 });

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const filters = [
    { id: 'all', label: 'Toutes les actualités' },
    { id: 'harvest', label: '🌾 Récoltes & Production' },
    { id: 'tech', label: '⚡ Eau & Pompage Solaire' },
    { id: 'logistics', label: '🚛 Disponibilité Transport' },
    { id: 'advice', label: '👨‍🔬 Conseils Agronomiques' }
  ];

  const handleMultipleFilesUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newItems = files.map(file => ({
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: type, // 'image' or 'video'
      file: file,
      url: URL.createObjectURL(file) // temporary preview
    }));

    setMediaItems(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removeMediaItem = (id) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!newPostText.trim() && mediaItems.length === 0) return;

    setIsPublishing(true);
    
    // Upload files to Supabase Storage — returns permanent public URLs
    const processedMedia = [];
    for (const item of mediaItems) {
      if (item.file) {
        try {
          const publicUrl = await uploadMedia(item.file, item.type === 'video' ? 'videos' : 'images');
          processedMedia.push({ id: item.id, type: item.type, url: publicUrl });
        } catch (err) {
          console.error('Upload failed:', err);
          processedMedia.push({ id: item.id, type: item.type, url: item.url });
        }
      } else {
        processedMedia.push(item);
      }
    }

    onAddPost({
      content: newPostText,
      media: processedMedia
    });

    setNewPostText('');
    setMediaItems([]);
    setIsPublishing(false);
  };

  const handleCommentSubmit = (postId) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    onAddComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleReplySubmit = (postId, commentId) => {
    if (!currentUser) { onRequireAuth(); return; }
    const text = replyInputs[commentId];
    if (!text?.trim()) return;
    onAddComment(postId, text, commentId);
    setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    setReplyingTo(prev => ({ ...prev, [postId]: null }));
  };

  const toggleLike = (postId) => {
    if (!currentUser) { onRequireAuth(); return; }
    onToggleLike(postId);
  };

  const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🌾'];

  const openViewer = (gallery, index) => {
    setViewerState({ isOpen: true, items: gallery, initialIndex: index });
  };

  // Helper to render media items gallery in post card
  const renderMediaGallery = (post) => {
    let gallery = [];
    if (post.media && post.media.length > 0) {
      gallery = post.media;
    } else {
      if (post.image) gallery.push({ id: 'img0', type: 'image', url: post.image });
      if (post.video) gallery.push({ id: 'vid0', type: 'video', url: post.video });
    }

    if (gallery.length === 0) return null;

    if (gallery.length === 1) {
      const item = gallery[0];
      return (
        <div className="rounded-xl overflow-hidden mb-4 border border-slate-200 bg-black">
          <AsyncMediaItem 
            item={item} 
            className="w-full max-h-[500px]" 
            style={{ display: 'block', objectFit: 'contain' }}
            onClick={() => openViewer(gallery, 0)}
          />
        </div>
      );
    }

    // Grid layout for 2 or more media files
    const total = gallery.length;
    const displayItems = gallery.slice(0, 4);

    let gridClass = 'grid gap-1 mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 ';
    if (total === 2) gridClass += 'grid-cols-2 h-[250px] sm:h-[300px]';
    else if (total === 3) gridClass += 'grid-cols-2 grid-rows-2 h-[350px] sm:h-[400px]';
    else gridClass += 'grid-cols-2 grid-rows-2 h-[350px] sm:h-[400px]'; // 4 or more

    return (
      <div className={gridClass}>
        {displayItems.map((item, idx) => {
          let itemClass = "relative bg-black group w-full h-full cursor-pointer ";
          
          // First item in a 3-item grid spans full width
          if (total === 3 && idx === 0) {
            itemClass += "col-span-2 row-span-1";
          }
          
          const isLastAndMore = total > 4 && idx === 3;

          return (
            <div 
              key={item.id || idx}
              className={itemClass}
              onClick={() => openViewer(gallery, idx)}
            >
              <AsyncMediaItem 
                item={item} 
                className="w-full h-full" 
                style={{ objectFit: 'cover' }}
                isVideoThumbnail={true}
              />
              
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none z-10 backdrop-blur-sm">
                {item.type === 'image' ? '📷' : '🎥'}
              </span>

              {isLastAndMore && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <span className="text-white text-3xl font-bold">+{total - 3}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Media Viewer Modal */}


      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-[#0a66c2] border border-blue-200">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Fil d'Actualités <span className="text-[#0a66c2]">Agricoles</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Partagez plusieurs photos, vidéos et actualités avec la communauté (Cliquez pour agrandir).
          </p>
        </div>
      </div>

      {/* LinkedIn Style Create Post Widget */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6">
        <form onSubmit={handlePostSubmit}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              src={currentUser?.avatar}
              name={currentUser?.name || 'Mon Profil'}
              seed={currentUser?.id || currentUser?.name}
              className="w-11 h-11"
              textClassName="text-sm"
            />
            <input
              type="text"
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder={currentUser ? "Commencer un post (plusieurs photos/vidéos possibles)..." : "🔒 Veuillez vous connecter pour publier..."}
              onClick={() => {
                if (!currentUser) onRequireAuth();
              }}
              className="w-full bg-[#f8fafc] hover:bg-slate-100 border border-slate-300 rounded-full px-4 py-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:border-[#0a66c2] transition-all"
            />
          </div>

          {/* Multiple Media Preview Grid */}
          {mediaItems.length > 0 && (
            <div className="mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Médias sélectionnés ({mediaItems.length})</span>
                <span className="text-[11px] text-slate-500 font-normal">Vous pouvez ajouter d'autres photos ou vidéos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mediaItems.map((item) => (
                  <div key={item.id} className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-300 group">
                    {item.type === 'image' ? (
                      <img src={item.url} alt="Aperçu Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                        <video src={item.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                    )}

                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {item.type === 'image' ? 'Photo' : 'Vidéo'}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeMediaItem(item.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
                      title="Supprimer ce média"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
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
                onClick={() => {
                  if (!currentUser) onRequireAuth();
                  else photoInputRef.current?.click();
                }} 
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
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
                onClick={() => {
                  if (!currentUser) onRequireAuth();
                  else videoInputRef.current?.click();
                }} 
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <VideoIcon className="w-4 h-4 text-emerald-600" />
                <span>+ Vidéos</span>
              </button>
            </div>

            {currentUser ? (
              <button
                type="submit"
                disabled={isPublishing || (!newPostText.trim() && mediaItems.length === 0)}
                className="flex items-center gap-1.5 bg-[#0a66c2] hover:bg-[#004182] disabled:opacity-40 text-white text-xs font-bold px-5 py-2 rounded-full transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPublishing ? 'Publication...' : 'Publier'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequireAuth}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Créer compte pour publier</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === f.id
                ? 'bg-[#0a66c2] text-white font-bold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Social Posts List */}
      <div className="space-y-6">
        {posts.map((post) => {
          const isLiked = currentUser && post.likedBy?.includes(currentUser.id);
          const likesCount = (post.likesCount || 0) + (post.likedBy?.length || 0);
          const isReposted = currentUser && post.repostedBy?.includes(currentUser.id);
          const repostsCount = post.repostedBy?.length || 0;
          const isFollowing = currentUser?.following?.includes(post.authorId);
          const isOwnPost = currentUser?.id === post.authorId;

          return (
            <div key={post.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">

              {/* Repost badge if this is a repost */}
              {post.repostOf && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mb-3 -mt-1">
                  <Repeat2 className="w-3.5 h-3.5" />
                  <span>{post.authorName} a republié</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={post.repostOf ? post.repostOf.authorAvatar : post.authorAvatar}
                    name={post.repostOf ? post.repostOf.authorName : post.authorName}
                    seed={post.repostOf ? (post.repostOf.authorId || post.authorId) : post.authorId}
                    textClassName="text-sm"
                    className="w-11 h-11 cursor-pointer hover:ring-2 hover:ring-[#0a66c2]/40 transition-all"
                    onClick={() => onOpenProfile({
                      authorId: post.repostOf ? (post.repostOf.authorId || post.authorId) : post.authorId,
                      authorName: post.repostOf ? post.repostOf.authorName : post.authorName,
                      authorAvatar: post.repostOf ? post.repostOf.authorAvatar : post.authorAvatar,
                      authorRole: post.repostOf ? post.repostOf.authorRole : post.authorRole,
                      authorBadge: post.badge,
                    })}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className="text-sm font-bold text-slate-900 hover:text-[#0a66c2] transition-colors cursor-pointer"
                        onClick={() => onOpenProfile({
                          authorId: post.repostOf ? (post.repostOf.authorId || post.authorId) : post.authorId,
                          authorName: post.repostOf ? post.repostOf.authorName : post.authorName,
                          authorAvatar: post.repostOf ? post.repostOf.authorAvatar : post.authorAvatar,
                          authorRole: post.repostOf ? post.repostOf.authorRole : post.authorRole,
                          authorBadge: post.badge,
                        })}
                      >
                        {post.repostOf ? post.repostOf.authorName : post.authorName}
                      </h4>
                      <CheckCircle2 className="w-4 h-4 text-[#0a66c2] shrink-0" />
                      {post.badge && !post.repostOf && (
                        <span className="text-[10px] font-bold bg-blue-50 text-[#0a66c2] border border-blue-200 px-2 py-0.5 rounded-full">
                          {post.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>{post.repostOf ? post.repostOf.authorRole : post.authorRole}</span>
                      <span>•</span>
                      <span>{post.repostOf ? post.repostOf.timestamp : post.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Follow / Unfollow */}
                  {!isOwnPost && (
                    <button
                      onClick={() => onToggleFollow(post.repostOf ? post.repostOf.authorId || post.authorId : post.authorId)}
                      className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                        isFollowing
                          ? 'border-slate-300 text-slate-600 hover:border-rose-400 hover:text-rose-500'
                          : 'border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {isFollowing ? 'Suivi' : '+ Suivre'}
                    </button>
                  )}

                  {/* Edit / Delete Options */}
                  {isOwnPost && !post.repostOf && (
                    <div className="relative">
                      <button
                        onClick={() => setOptionsOpenFor(optionsOpenFor === post.id ? null : post.id)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {optionsOpenFor === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditContent(post.content || '');
                              setOptionsOpenFor(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" /> Modifier
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) {
                                onDeletePost(post.id);
                              }
                              setOptionsOpenFor(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {editingPostId === post.id ? (
                <div className="mb-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[100px] border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a66c2]"
                  />
                  <div className="flex items-center gap-2 justify-end mt-2">
                    <button
                      onClick={() => setEditingPostId(null)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        onEditPost(post.id, editContent);
                        setEditingPostId(null);
                      }}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0a66c2] text-white hover:bg-[#004182] transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                post.content && (
                  <p className="text-sm text-slate-800 leading-relaxed mb-4 whitespace-pre-line font-normal">
                    {post.repostOf ? post.repostOf.content : post.content}
                  </p>
                )
              )}
              {/* Repost quoted content */}
              {post.repostOf && (
                <div className="border border-slate-200 rounded-xl p-3 mb-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar src={post.authorAvatar} name={post.authorName} seed={post.authorId} className="w-6 h-6" textClassName="text-[8px]" />
                    <span className="text-xs font-bold text-slate-700">{post.authorName}</span>
                    <span className="text-[10px] text-slate-400">(publication originale)</span>
                  </div>
                  {post.content && <p className="text-xs text-slate-600">{post.content}</p>}
                </div>
              )}

              {renderMediaGallery(post.repostOf ? { media: post.repostOf.media } : post)}

              <div className="flex items-center justify-around border-t border-b border-slate-100 py-1.5 my-3 text-xs font-semibold text-slate-600">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${
                    isLiked ? 'text-[#0a66c2]' : ''
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-[#0a66c2] text-[#0a66c2]' : ''}`} />
                  <span>J'aime ({likesCount})</span>
                </button>

                <div className="flex items-center justify-center gap-2 flex-1 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span>Commenter ({post.comments?.length || 0})</span>
                </div>

                <button 
                  onClick={() => onRepost(post)}
                  className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${ isReposted ? 'text-emerald-600' : ''}`}
                >
                  <Repeat2 className={`w-4 h-4 ${isReposted ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>Repub. ({repostsCount})</span>
                </button>

                <button 
                  onClick={() => onShare(post)}
                  className="flex items-center justify-center gap-2 flex-1 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Partager</span>
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {post.comments && post.comments.map((c) => (
                  <div key={c.id}>
                    {/* Comment bubble */}
                    <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <Avatar
                        src={c.avatar}
                        name={c.user}
                        seed={c.userId || c.user}
                        textClassName="text-[9px]"
                        className="w-7 h-7 mt-0.5 cursor-pointer hover:ring-2 hover:ring-[#0a66c2]/40 transition-all"
                        onClick={() => onOpenProfile({ authorId: c.userId || c.user, authorName: c.user, authorAvatar: c.avatar, authorRole: 'Membre Réseau' })}
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-xs font-bold text-slate-900 cursor-pointer hover:text-[#0a66c2] transition-colors inline-block"
                          onClick={() => onOpenProfile({ authorId: c.userId || c.user, authorName: c.user, authorAvatar: c.avatar, authorRole: 'Membre Réseau' })}
                        >
                          {c.user}
                        </div>
                        <p className="text-xs text-slate-700 mt-0.5">{c.text}</p>

                        {/* Reaction bar */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {/* Existing reactions */}
                          {c.reactions && Object.entries(c.reactions).map(([emoji, users]) =>
                            users.length > 0 ? (
                              <button
                                key={emoji}
                                onClick={() => onAddCommentReaction(post.id, c.id, emoji)}
                                className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition-all ${
                                  currentUser && users.includes(currentUser.id)
                                    ? 'bg-blue-50 border-blue-300 text-[#0a66c2]'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="font-semibold">{users.length}</span>
                              </button>
                            ) : null
                          )}

                          {/* Emoji picker trigger */}
                          <div className="relative">
                            <button
                              onClick={() => setEmojiPickerFor(emojiPickerFor === c.id ? null : c.id)}
                              className="flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded-full hover:bg-slate-100 transition-colors"
                              title="Réagir"
                            >
                              <SmilePlus className="w-3 h-3" />
                            </button>
                            {emojiPickerFor === c.id && (
                              <div className="absolute bottom-6 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg px-2 py-1.5 flex gap-1">
                                {EMOJI_REACTIONS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => { onAddCommentReaction(post.id, c.id, emoji); setEmojiPickerFor(null); }}
                                    className="text-base hover:scale-125 transition-transform"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Reply button */}
                          <button
                            onClick={() => setReplyingTo(prev => ({ ...prev, [post.id]: prev[post.id] === c.id ? null : c.id }))}
                            className="flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-[#0a66c2] transition-colors font-semibold"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            Répondre
                          </button>
                        </div>

                        {/* Reply input */}
                        {replyingTo[post.id] === c.id && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              autoFocus
                              value={replyInputs[c.id] || ''}
                              onChange={(e) => setReplyInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                              placeholder={`Répondre à ${c.user}...`}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleReplySubmit(post.id, c.id); }}
                              className="flex-1 bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-[#0a66c2]"
                            />
                            <button
                              onClick={() => handleReplySubmit(post.id, c.id)}
                              className="bg-[#0a66c2] text-white text-xs font-bold px-3 py-1.5 rounded-full"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nested replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="ml-8 mt-1 space-y-1">
                        {c.replies.map(r => (
                          <div key={r.id} className="flex items-start gap-2 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                            <Avatar
                              src={r.avatar}
                              name={r.user}
                              seed={r.userId || r.user}
                              textClassName="text-[7px]"
                              className="w-5 h-5 mt-0.5 cursor-pointer hover:ring-2 hover:ring-[#0a66c2]/40 transition-all"
                              onClick={() => onOpenProfile({ authorId: r.userId || r.user, authorName: r.user, authorAvatar: r.avatar, authorRole: 'Membre Réseau' })}
                            />
                            <div>
                              <div 
                                className="text-[11px] font-bold text-slate-800 cursor-pointer hover:text-[#0a66c2] transition-colors inline-block"
                                onClick={() => onOpenProfile({ authorId: r.userId || r.user, authorName: r.user, authorAvatar: r.avatar, authorRole: 'Membre Réseau' })}
                              >
                                {r.user}
                              </div>
                              <p className="text-[11px] text-slate-700">{r.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* New comment input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    placeholder={currentUser ? "Ajouter un commentaire..." : "Connectez-vous pour commenter..."}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommentSubmit(post.id);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#0a66c2] focus:bg-white"
                  />
                  <button
                    onClick={() => handleCommentSubmit(post.id)}
                    className="bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
