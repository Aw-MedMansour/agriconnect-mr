import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MarketplaceProducts from './components/MarketplaceProducts';
import MarketplaceServices from './components/MarketplaceServices';
import SocialFeed from './components/SocialFeed';
import MatchingEngine from './components/MatchingEngine';
import ReputationDirectory from './components/ReputationDirectory';
import CreateModal from './components/CreateModal';
import ContactModal from './components/ContactModal';
import AuthModal from './components/AuthModal';
import MessagingPanel from './components/MessagingPanel';
import UserProfileModal from './components/UserProfileModal';
import ComingSoonModule from './components/ComingSoonModule';
import { MOCK_ACTORS, MOCK_PRODUCTS, MOCK_SERVICES, MOCK_SOCIAL_POSTS } from './data/mockData';
import { CheckCircle2, X, Info, Droplets, Landmark, Map, HardHat } from 'lucide-react';

import { fetchAllData, upsertData, deleteData } from './utils/dbSync';

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agroconnect_user')) || null; } catch { return null; }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Data
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const allAvailableUsers = Array.isArray(registeredUsers) && registeredUsers.length ? registeredUsers : (MOCK_ACTORS || []);

  useEffect(() => {
    fetchAllData().then(data => {
      setRegisteredUsers(data.users);
      setProducts(data.products);
      setServices(data.services);
      setSocialPosts(data.posts);
      setConversations(data.conversations);
      setIsLoading(false);
    });
  }, []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalDefaultTab, setCreateModalDefaultTab] = useState('product');
  const [createModalDefaultCategory, setCreateModalDefaultCategory] = useState(null);
  const [contactTarget, setContactTarget] = useState(null);
  const [profileModalTarget, setProfileModalTarget] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  // ── Persist currentUser locally ────────────────────────────────
  useEffect(() => { 
    if (currentUser) localStorage.setItem('agroconnect_user', JSON.stringify(currentUser));
    else localStorage.removeItem('agroconnect_user');
  }, [currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('profile');
    if (profileId) {
      const user = allAvailableUsers.find(u => u.id === profileId) || (socialPosts || []).find(p => p.authorId === profileId) || (products || []).find(p => p.sellerId === profileId);
      if (user) {
        setProfileModalTarget({
          authorId: profileId,
          authorName: user.name || user.authorName || user.sellerName,
          authorAvatar: user.avatar || user.authorAvatar || user.sellerAvatar,
          authorRole: user.roleLabel || user.authorRole || user.sellerRole || 'Membre',
        });
      }
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const openCreateModal = (defaultTab = 'product', defaultCategory = null) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setCreateModalDefaultTab(defaultTab);
    setCreateModalDefaultCategory(defaultCategory);
    setIsCreateModalOpen(true);
  };

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleLoginSuccess = (userObj, isNewUser = false) => {
    setCurrentUser(userObj);
    if (isNewUser) {
      setRegisteredUsers(prev => [...prev, userObj]);
      upsertData('users', userObj.id, userObj);
    }
    showToast(`✅ Bienvenue ${userObj.name} ! Votre compte est activé.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Vous vous êtes déconnecté.');
  };

  // ── Creation handlers ──────────────────────────────────────────────────────
  const handleCreateProduct = (newProd) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    upsertData('products', newProd.id, newProd);
    setActiveModule('products'); // Switch to marketplace so user sees their new product
    showToast('✅ Votre récolte est publiée dans la Marketplace Produits !');
  };

  const handleCreateService = (newServ) => {
    const updated = [newServ, ...services];
    setServices(updated);
    upsertData('services', newServ.id, newServ);
    setActiveModule('services');
    showToast('✅ Votre offre/demande de service est publiée !');
  };

  const handleAddSocialPost = (postData) => {
    const newPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Utilisateur AgroConnect',
      authorRole: currentUser?.roleLabel || 'Agriculteur',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80',
      timestamp: 'À l\'instant',
      badge: currentUser?.badge || 'Membre Vérifié',
      content: postData.content,
      media: postData.media || [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedBy: [],
      repostedBy: [],
      comments: [],
      repostOf: postData.repostOf || null,
    };
    const updated = [newPost, ...socialPosts];
    setSocialPosts(updated);
    upsertData('posts', newPost.id, newPost);
    showToast('✅ Post publié dans le Réseau Social Agricole !');
  };

  const handleEditPost = (postId, newContent) => {
    setSocialPosts(prev => {
      const updated = prev.map(p => p.id === postId ? { ...p, content: newContent } : p);
      const post = updated.find(p => p.id === postId);
      if (post) upsertData('posts', postId, post);
      return updated;
    });
    showToast('✏️ Publication modifiée.');
  };

  const handleDeletePost = (postId) => {
    setSocialPosts(prev => prev.filter(p => p.id !== postId));
    deleteData('posts', postId);
    showToast('🗑️ Publication supprimée.');
  };

  const handleRepost = (post) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const alreadyReposted = post.repostedBy?.includes(currentUser.id);
    if (alreadyReposted) {
      setSocialPosts(prev => {
        const updated = prev.map(p => {
          if (p.id !== post.id) return p;
          return { ...p, repostedBy: (p.repostedBy || []).filter(id => id !== currentUser.id) };
        });
        const p = updated.find(p => p.id === post.id);
        if (p) upsertData('posts', p.id, p);
        return updated;
      });
      showToast('Republication annulée.');
      return;
    }
    const repostEntry = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.roleLabel || 'Agriculteur',
      authorAvatar: currentUser.avatar,
      timestamp: 'À l\'instant',
      badge: currentUser.badge || 'Membre Vérifié',
      content: '',
      media: [],
      likesCount: 0,
      likedBy: [],
      repostedBy: [],
      comments: [],
      repostOf: {
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        authorRole: post.authorRole,
        content: post.content,
        media: post.media || [],
        timestamp: post.timestamp,
      }
    };
    setSocialPosts(prev => {
      const updated = [
        repostEntry,
        ...prev.map(p => p.id === post.id ? { ...p, repostedBy: [...(p.repostedBy || []), currentUser.id] } : p)
      ];
      upsertData('posts', repostEntry.id, repostEntry);
      const original = updated.find(p => p.id === post.id);
      if (original) upsertData('posts', original.id, original);
      return updated;
    });
    showToast('✅ Publication repartagée !');
  };

  const handleToggleFollow = (authorId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setCurrentUser(prev => {
      const following = prev.following || [];
      const isFollowing = following.includes(authorId);
      const updatedUser = {
        ...prev,
        following: isFollowing ? following.filter(id => id !== authorId) : [...following, authorId]
      };
      upsertData('users', updatedUser.id, updatedUser);
      return updatedUser;
    });
    showToast(currentUser.following?.includes(authorId) ? 'Vous ne suivez plus cet agriculteur.' : '✅ Vous suivez maintenant cet agriculteur !');
  };

  const handleAddComment = (postId, text, replyToId = null) => {
    setSocialPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        const newComment = {
          id: `c-${Date.now()}`,
          userId: currentUser?.id,
          user: currentUser?.name || 'Vous',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80',
          text,
          reactions: {},
          replies: [],
          replyTo: replyToId,
        };
        if (replyToId) {
          return {
            ...p,
            comments: (p.comments || []).map(c =>
              c.id === replyToId ? { ...c, replies: [...(c.replies || []), newComment] } : c
            )
          };
        }
        return { ...p, comments: [...(p.comments || []), newComment] };
      });
      const post = updated.find(p => p.id === postId);
      if (post) upsertData('posts', postId, post);
      return updated;
    });
  };

  const handleAddCommentReaction = (postId, commentId, emoji) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setSocialPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: (p.comments || []).map(c => {
            if (c.id !== commentId) return c;
            const existing = c.reactions?.[emoji] || [];
            const hasReacted = existing.includes(currentUser.id);
            return {
              ...c,
              reactions: {
                ...(c.reactions || {}),
                [emoji]: hasReacted ? existing.filter(id => id !== currentUser.id) : [...existing, currentUser.id]
              }
            };
          })
        };
      });
      const post = updated.find(p => p.id === postId);
      if (post) upsertData('posts', postId, post);
      return updated;
    });
  };


  const handleRequestTransportForProduct = (prod) => {
    setActiveModule('matching');
    showToast(`Matching pré-rempli pour le transport de : ${prod.title}`);
  };

  const handleToggleLikePost = (postId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setSocialPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        const isLiked = p.likedBy?.includes(currentUser.id);
        const newLikedBy = isLiked ? (p.likedBy || []).filter(id => id !== currentUser.id) : [...(p.likedBy || []), currentUser.id];
        return { ...p, likedBy: newLikedBy };
      });
      const post = updated.find(p => p.id === postId);
      if (post) upsertData('posts', postId, post);
      return updated;
    });
  };

  const handleToggleLikeProduct = (productId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id !== productId) return p;
        const isLiked = p.likedBy?.includes(currentUser.id);
        const newLikedBy = isLiked ? (p.likedBy || []).filter(id => id !== currentUser.id) : [...(p.likedBy || []), currentUser.id];
        return { ...p, likedBy: newLikedBy };
      });
      const prod = updated.find(p => p.id === productId);
      if (prod) upsertData('products', productId, prod);
      return updated;
    });
  };

  const handleAddProductComment = (productId, text) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id !== productId) return p;
        return {
          ...p,
          comments: [...(p.comments || []), { id: `pc-${Date.now()}`, user: currentUser.name, avatar: currentUser.avatar, text }]
        };
      });
      const prod = updated.find(p => p.id === productId);
      if (prod) upsertData('products', productId, prod);
      return updated;
    });
    showToast('✅ Commentaire ajouté au produit !');
  };

  const handleShare = async (item, type = 'post') => {
    const text = type === 'post' ? `Post de ${item.authorName}` : `Produit: ${item.title}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: text,
          text: 'Découvrez ceci sur AgroConnect',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('✅ Lien copié dans le presse-papier !');
      }
    } catch (err) {
      console.log('Erreur de partage', err);
    }
  };

  // ── Messaging handlers ────────────────────────────────────────────────────
  const startOrOpenConversation = (participant) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }

    // Build resolved fields from various shapes of participant objects
    const participantId = participant.id || participant.authorId || participant.sellerName || participant.name;
    const participantName = participant.name || participant.sellerName || participant.authorName || 'Inconnu';
    const participantAvatar =
      participant.avatar || participant.sellerAvatar || participant.authorAvatar ||
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80';

    // ❌ Block sending a message to yourself
    if (participantId === currentUser.id || participantName === currentUser.name) {
      showToast('⚠️ Vous ne pouvez pas vous envoyer un message à vous-même.');
      return;
    }

    // Check if this contact already exists — use existing conv
    const existing = conversations.find(
      c => c.participantId === participantId || c.participantName === participantName
    );
    if (existing) {
      showToast(`💬 Conversation avec ${participantName} déjà ouverte dans votre messagerie.`);
      return;
    }

    // Create new conversation
    const newConv = {
      id: `conv-${Date.now()}`,
      participantId,
      participantName,
      participantAvatar,
      messages: [],
      unread: 0,
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      upsertData('conversations', newConv.id, newConv);
      return updated;
    });
    showToast(`✅ Conversation avec ${participantName} créée ! Ouvrez la messagerie en bas à droite.`);
  };

  const handleSendMessage = (convId, text) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== convId) return c;
        const newMsg = { senderId: currentUser?.id, text, ts: Date.now() };
        // Simulate auto-reply after 2s (only in local state for mockup)
        setTimeout(() => {
          setConversations(prev2 => {
            const updated2 = prev2.map(c2 => {
              if (c2.id !== convId) return c2;
              const res = {
                ...c2,
                messages: [...(c2.messages || []), { senderId: c.participantId, text: 'Merci pour votre message ! Je reviens vers vous dès que possible. 🌾', ts: Date.now() }],
                unread: (c2.unread || 0) + 1
              };
              upsertData('conversations', convId, res);
              return res;
            });
            return updated2;
          });
        }, 2000);
        return { ...c, messages: [...(c.messages || []), newMsg] };
      });
      const conv = updated.find(c => c.id === convId);
      if (conv) upsertData('conversations', convId, conv);
      return updated;
    });
  };

  const handleMarkRead = (convId) => {
    setConversations(prev => {
      const updated = prev.map(c => c.id === convId ? { ...c, unread: 0 } : c);
      const conv = updated.find(c => c.id === convId);
      if (conv) upsertData('conversations', convId, conv);
      return updated;
    });
  };

  const handleDeleteConv = (convId) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    deleteData('conversations', convId);
    showToast('🗑️ Conversation supprimée.');
  };

  // ── Repost product as social post ──────────────────────────────────────────────
  const handleRepostProduct = (prod) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const alreadyReposted = prod.repostedBy?.includes(currentUser.id);
    setProducts(prev => {
      const updated = prev.map(p =>
        p.id === prod.id
          ? { ...p, repostedBy: alreadyReposted ? (p.repostedBy || []).filter(id => id !== currentUser.id) : [...(p.repostedBy || []), currentUser.id] }
          : p
      );
      const product = updated.find(p => p.id === prod.id);
      if (product) upsertData('products', prod.id, product);
      return updated;
    });
    if (!alreadyReposted) {
      handleAddSocialPost({
        content: `🌾 Je recommande ce produit : "${prod.title}" à ${prod.price}. Vendeur: ${prod.sellerName} (${prod.location})`,
        media: prod.media || []
      });
      showToast('✅ Produit publié sur le Réseau Social !');
    } else {
      showToast('Republication annulée.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#f3f2ef] flex items-center justify-center font-bold text-slate-500">Chargement de la base de données...</div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f2ef] text-slate-900 flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900">

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-[#0a66c2] text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#0a66c2] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onOpenCreateModal={() => openCreateModal(activeModule === 'services' ? 'service' : 'product')}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />



      {/* ── Info Banner : explains where posts go ── */}
      {activeModule === 'products' && (
        <div className="max-w-7xl mx-auto px-4 pt-4 w-full">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs text-blue-800 font-medium">
            <Info className="w-4 h-4 text-[#0a66c2] shrink-0" />
            <span>Pour publier une récolte ici, cliquez sur <strong>"Vendre ma récolte"</strong> ci-dessous. Les publications du Réseau Social sont distinctes.</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {activeModule === 'products' && (
          <MarketplaceProducts
            products={products}
            currentUser={currentUser}
            onContactSeller={(prod) => { if (!currentUser) setIsAuthModalOpen(true); else startOrOpenConversation(prod); }}
            onRequestTransport={handleRequestTransportForProduct}
            onOpenCreate={() => openCreateModal('product')}
            searchQuery={searchQuery}
            onToggleLike={handleToggleLikeProduct}
            onAddComment={handleAddProductComment}
            onShare={(prod) => handleShare(prod, 'product')}
            onRepost={handleRepostProduct}
            onOpenProfile={setProfileModalTarget}
            onRequireAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeModule === 'services' && (
          <MarketplaceServices
            services={services}
            onContactProvider={(serv) => { if (!currentUser) setIsAuthModalOpen(true); else setContactTarget(serv); }}
            onOpenCreate={() => openCreateModal('service')}
            searchQuery={searchQuery}
          />
        )}

        {activeModule === 'social' && (
          <SocialFeed
            posts={socialPosts}
            currentUser={currentUser}
            onAddPost={handleAddSocialPost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onAddComment={handleAddComment}
            onToggleLike={handleToggleLikePost}
            onRepost={handleRepost}
            onToggleFollow={handleToggleFollow}
            onAddCommentReaction={handleAddCommentReaction}
            onShare={(post) => handleShare(post, 'post')}
            onContactUser={startOrOpenConversation}
            onOpenProfile={setProfileModalTarget}
            allProducts={products}
            onRequireAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeModule === 'matching' && (
          <MatchingEngine onDispatchSuccess={(msg) => showToast(msg)} />
        )}

        {activeModule === 'reputation' && (
          <ReputationDirectory
            onContactActor={(actor) => { if (!currentUser) setIsAuthModalOpen(true); else setContactTarget(actor); }}
            searchQuery={searchQuery}
          />
        )}

        {/* New Modules Placeholders */}
        {activeModule === 'energy' && (
          <MarketplaceServices
            services={services}
            onContactProvider={(serv) => { if (!currentUser) setIsAuthModalOpen(true); else setContactTarget(serv); }}
            onOpenCreate={() => openCreateModal('service', 'energie_eau')}
            searchQuery={searchQuery}
            predefinedCategory="energie_eau"
            moduleTitle="Énergie & Eau"
          />
        )}
        {activeModule === 'finance' && (
          <MarketplaceServices
            services={services}
            onContactProvider={(serv) => { if (!currentUser) setIsAuthModalOpen(true); else setContactTarget(serv); }}
            onOpenCreate={() => openCreateModal('service', 'banque_assurance')}
            searchQuery={searchQuery}
            predefinedCategory="banque_assurance"
            moduleTitle="Banque & Assurance"
          />
        )}
        {activeModule === 'land' && (
          <MarketplaceServices
            services={services}
            onContactProvider={(serv) => { if (!currentUser) setIsAuthModalOpen(true); else setContactTarget(serv); }}
            onOpenCreate={() => openCreateModal('service', 'terrain')}
            searchQuery={searchQuery}
            predefinedCategory="terrain"
            moduleTitle="Terrain à louer & vendre"
          />
        )}
        {activeModule === 'workers' && (
          <MarketplaceServices
            services={services}
            onContactProvider={(serv) => { if (!currentUser) setIsAuthModalOpen(true); else setContactTarget(serv); }}
            onOpenCreate={() => openCreateModal('service', 'agronome')}
            searchQuery={searchQuery}
            predefinedCategory="agronome"
            moduleTitle="Agronome & Ouvrier"
          />
        )}
      </main>

      {/* Modals */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultTab={createModalDefaultTab}
        defaultCategory={createModalDefaultCategory}
        currentUser={currentUser}
        onCreateProduct={handleCreateProduct}
        onCreateService={handleCreateService}
        onRequireAuth={() => { setIsCreateModalOpen(false); setIsAuthModalOpen(true); }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        allUsers={allAvailableUsers}
      />

      <ContactModal
        isOpen={!!contactTarget}
        onClose={() => setContactTarget(null)}
        targetData={contactTarget}
        onSendMessage={(msg) => showToast(msg)}
      />

      {/* User Profile Modal */}
      {profileModalTarget && (
        <UserProfileModal
          isOpen={!!profileModalTarget}
          onClose={() => setProfileModalTarget(null)}
          authorId={profileModalTarget.authorId}
          authorName={profileModalTarget.authorName}
          authorAvatar={profileModalTarget.authorAvatar}
          authorRole={profileModalTarget.authorRole}
          authorBadge={profileModalTarget.authorBadge}
          allPosts={socialPosts}
          allProducts={products}
          currentUser={currentUser}
          onToggleFollow={handleToggleFollow}
          onStartConversation={startOrOpenConversation}
          onRequireAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Floating Messaging Panel */}
      <MessagingPanel
        currentUser={currentUser}
        conversations={conversations}
        onSendMessage={handleSendMessage}
        onMarkRead={handleMarkRead}
        onDeleteConv={handleDeleteConv}
        allUsers={allAvailableUsers}
        onStartConversation={startOrOpenConversation}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0a66c2]">AgroConnect 🌱</span>
            <span>— Le réseau professionnel agricole</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-slate-600">
            <span>Marketplace Produits</span>
            <span>Services & Logistique</span>
            <span>Pompage Solaire & Eau</span>
            <span>Matching IA Pro</span>
          </div>
          <div className="text-slate-400">© 2026 AgroConnect. Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
}
