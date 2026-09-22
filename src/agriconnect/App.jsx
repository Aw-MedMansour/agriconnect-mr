import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import MarketplaceProducts from './components/MarketplaceProducts';
import MarketplaceServices from './components/MarketplaceServices';
import SocialFeed from './components/SocialFeed';
import ReputationDirectory from './components/ReputationDirectory';
import CreateModal from './components/CreateModal';
import ContactModal from './components/ContactModal';
import AuthModal from './components/AuthModal';
import MessagingPanel from './components/MessagingPanel';
import NotificationPanel from './components/NotificationPanel';
import UserProfileModal from './components/UserProfileModal';
import AIHub from './components/AIHub';
import SplashScreen from './components/SplashScreen';
import { useLanguage } from './i18n';
import { supabase } from './utils/supabaseClient';

import { Bot, CheckCircle2, Info, Search, ShieldCheck, Store, Truck, Users, X } from 'lucide-react';

const MODULES = [
  { id: 'products', label: 'Marketplace Produits', hint: 'Produits agricoles', icon: Store },
  { id: 'services', label: 'Marketplace Services', hint: 'Services agricoles', icon: Truck },
  { id: 'social', label: 'Réseau Social Agricole', hint: 'Communauté agricole', icon: Users },
  { id: 'ai', label: 'Intelligence artificielle', hint: 'Outils intelligents', icon: Bot },
  { id: 'reputation', label: 'Acteurs & Réputation', hint: 'Annuaire professionnel', icon: ShieldCheck },
];

import { fetchAllData, fetchConversations, fetchUsers, fetchNotifications, updateNotification, insertData, upsertData, deleteData, registerView } from './utils/dbSync';

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { t, language, setLanguage, authenticatedProfile, setAuthenticatedProfile } = useLanguage();
  const [activeModule, setActiveModule] = useState('products');
  const [aiDefaultTab, setAiDefaultTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const [toolsHidden, setToolsHidden] = useState(false);

  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Data
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 1600);
    return () => clearTimeout(t);
  }, []);


  const allAvailableUsers = Array.isArray(registeredUsers) ? registeredUsers : [];

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
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setIsSearchOpen(false);
    setIsMessagingOpen(false);
    setIsNotificationsOpen(false);
  }, [activeModule]);

  useEffect(() => {
    let previous = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const next = window.scrollY;
        const delta = next - previous;
        if (next < 48) {
          setBottomNavHidden(false);
          setToolsHidden(false);
        } else if (Math.abs(delta) >= 8) {
          const shouldHide = delta > 0;
          setBottomNavHidden(shouldHide);
          setToolsHidden(shouldHide);
        }
        previous = next;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const locked = isAuthModalOpen || isCreateModalOpen || !!contactTarget || !!profileModalTarget || isMessagingOpen || isNotificationsOpen;
    if (!locked) return undefined;
    const scrollY = window.scrollY;
    const previous = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      Object.assign(document.body.style, previous);
      window.scrollTo(0, scrollY);
    };
  }, [isAuthModalOpen, isCreateModalOpen, contactTarget, profileModalTarget, isMessagingOpen, isNotificationsOpen]);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  // ── Conversations visible for the logged-in account (shared between both accounts) ──
  const myConversations = React.useMemo(() => {
    if (!currentUser) return [];
    const me = String(currentUser.id);
    return (conversations || [])
      .filter(c => Array.isArray(c?.participantIds) && c.participantIds.map(String).includes(me))
      .map(c => {
        const otherId = c.participantIds.map(String).find(id => id !== me) || me;
        const other = c.participants?.[otherId] || {};
        const lastRead = c.reads?.[me] || 0;
        const unread = (c.messages || []).filter(m => String(m.senderId) !== me && (m.ts || 0) > lastRead).length;
        return {
          ...c,
          participantId: otherId,
          participantName: other.name || 'Utilisateur',
          participantAvatar: other.avatar || '',
          unread,
        };
      })
      .sort((a, b) => {
        const la = a.messages?.[a.messages.length - 1]?.ts || 0;
        const lb = b.messages?.[b.messages.length - 1]?.ts || 0;
        return lb - la;
      });
  }, [conversations, currentUser]);

  // ── Keep messages in sync so the recipient really receives them ──
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const sync = async () => {
      const [fresh, freshUsers] = await Promise.all([fetchConversations(), fetchUsers()]);
      if (cancelled) return;
      const mergeById = (prev, next) => {
        const byId = {};
        (prev || []).forEach(item => { byId[String(item.id)] = item; });
        (next || []).forEach(item => { byId[String(item.id)] = item; });
        return Object.values(byId);
      };
      if (fresh) setConversations(prev => mergeById(prev, fresh));
      if (freshUsers && freshUsers.length) setRegisteredUsers(prev => mergeById(prev, freshUsers));
    };
    sync();
    const t = setInterval(sync, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setIsNotificationsOpen(false);
      return;
    }
    let cancelled = false;
    const syncNotifications = async () => {
      const fresh = await fetchNotifications(currentUser.id);
      if (!cancelled && fresh) setNotifications(fresh);
    };
    syncNotifications();
    const timer = setInterval(syncNotifications, 4000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [currentUser]);


  // ── Authentication is resolved before the language gate is displayed.
  useEffect(() => {
    setCurrentUser(authenticatedProfile);
  }, [authenticatedProfile]);

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

  const sendNotification = (recipientId, type, text, target = {}) => {
    if (!currentUser || !recipientId || String(recipientId) === String(currentUser.id)) return;
    const ts = Date.now();
    const notification = {
      id: `notification-${ts}-${Math.random().toString(36).slice(2, 8)}`,
      recipientId: String(recipientId),
      actorId: String(currentUser.id),
      actorName: currentUser.name || 'Un membre',
      actorAvatar: currentUser.avatar || '',
      type,
      text,
      target,
      read: false,
      ts,
    };
    insertData('notifications', notification.id, notification);
  };

  const openCreateModal = (defaultTab = 'product', defaultCategory = null) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setCreateModalDefaultTab(defaultTab);
    setCreateModalDefaultCategory(defaultCategory);
    setIsCreateModalOpen(true);
  };

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleLoginSuccess = (userObj, isNewUser = false) => {
    const preferredLanguage = userObj.preferredLanguage || userObj.preferred_language || language;
    const resolvedUser = { ...userObj, preferredLanguage };
    setCurrentUser(resolvedUser);
    setAuthenticatedProfile(resolvedUser);
    setLanguage(preferredLanguage);
    if (isNewUser) {
      setRegisteredUsers(prev => [...prev, resolvedUser]);
      upsertData('users', resolvedUser.id, resolvedUser);
    }
    showToast(`✅ Bienvenue ${resolvedUser.name} ! Votre compte est activé.`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAuthenticatedProfile(null);
    showToast('Vous vous êtes déconnecté.');
  };

  const handleLanguageChange = async (nextLanguage) => {
    setLanguage(nextLanguage);
    if (!currentUser) return;
    const updatedUser = { ...currentUser, preferredLanguage: nextLanguage };
    setCurrentUser(updatedUser);
    setAuthenticatedProfile(updatedUser);
    await upsertData('users', updatedUser.id, updatedUser);
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
      authorName: currentUser?.name || 'Utilisateur AgriConnect',
      authorRole: currentUser?.roleLabel || 'Agriculteur',
      authorAvatar: currentUser?.avatar || '',
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

  // Suppression d'une annonce produit par son propre auteur
  const handleDeleteProduct = (productId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const prod = products.find(p => p.id === productId);
    if (!prod || String(prod.sellerId) !== String(currentUser.id)) {
      showToast("⚠️ Vous ne pouvez supprimer que vos propres annonces.");
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    deleteData('products', productId);
    showToast('🗑️ Annonce supprimée de la Marketplace Produits.');
  };

  // Suppression d'une annonce de service par son propre auteur
  const handleDeleteService = (serviceId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const serv = services.find(s => s.id === serviceId);
    if (!serv || String(serv.providerId) !== String(currentUser.id)) {
      showToast("⚠️ Vous ne pouvez supprimer que vos propres annonces.");
      return;
    }
    setServices(prev => prev.filter(s => s.id !== serviceId));
    deleteData('services', serviceId);
    showToast('🗑️ Annonce supprimée de la Marketplace Services.');
  };

  // Compteur de vues : une vue par contenu et par session de navigation
  const handleRegisterView = (kind, id) => {
    if (typeof window === 'undefined' || !id) return;
    const key = `agriconnect_view_${kind}_${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* stockage indisponible */ }

    registerView(kind, id);
    const apply = (setter) => setter(prev =>
      prev.map(item => (item.id === id ? { ...item, viewsCount: (item.viewsCount || 0) + 1 } : item))
    );
    if (kind === 'products') apply(setProducts);
    else if (kind === 'services') apply(setServices);
    else if (kind === 'posts') apply(setSocialPosts);
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
    sendNotification(post.authorId, 'repost', 'a republié votre publication.', { module: 'social', postId: post.id });
    showToast('✅ Publication repartagée !');
  };

  const handleToggleFollow = (authorId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const isAlreadyFollowing = currentUser.following?.includes(authorId);
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
    if (!isAlreadyFollowing) sendNotification(authorId, 'follow', 's’est abonné à votre profil.', { profileId: currentUser.id });
    showToast(currentUser.following?.includes(authorId) ? 'Vous ne suivez plus cet agriculteur.' : '✅ Vous suivez maintenant cet agriculteur !');
  };

  const handleAddComment = (postId, text, replyToId = null) => {
    const sourcePost = socialPosts.find(p => p.id === postId);
    const sourceComment = replyToId ? sourcePost?.comments?.find(c => c.id === replyToId) : null;
    setSocialPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        const newComment = {
          id: `c-${Date.now()}`,
          userId: currentUser?.id,
          user: currentUser?.name || 'Vous',
          avatar: currentUser?.avatar || '',
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
    const recipientId = sourceComment?.userId || sourcePost?.authorId;
    sendNotification(recipientId, replyToId ? 'comment_reply' : 'post_comment', replyToId ? 'a répondu à votre commentaire.' : 'a commenté votre publication.', { module: 'social', postId });
  };

  // Suppression d'un commentaire (ou d'une réponse) par son auteur ou l'auteur de la publication
  const handleDeleteComment = (postId, commentId, parentId = null) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setSocialPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        const canModerate = String(p.authorId) === String(currentUser.id);
        if (parentId) {
          return {
            ...p,
            comments: (p.comments || []).map(c =>
              c.id !== parentId ? c : {
                ...c,
                replies: (c.replies || []).filter(r =>
                  !(r.id === commentId && (canModerate || String(r.userId) === String(currentUser.id)))
                )
              }
            )
          };
        }
        return {
          ...p,
          comments: (p.comments || []).filter(c =>
            !(c.id === commentId && (canModerate || String(c.userId) === String(currentUser.id)))
          )
        };
      });
      const post = updated.find(p => p.id === postId);
      if (post) upsertData('posts', postId, post);
      return updated;
    });
    showToast('🗑️ Commentaire supprimé.');
  };

  const handleAddCommentReaction = (postId, commentId, emoji) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const sourceComment = socialPosts.find(p => p.id === postId)?.comments?.find(c => c.id === commentId);
    const existingReaction = sourceComment?.reactions?.[emoji] || [];
    const isRemoving = existingReaction.includes(currentUser.id);
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
    if (!isRemoving) sendNotification(sourceComment?.userId, 'comment_reaction', `a réagi ${emoji} à votre commentaire.`, { module: 'social', postId });
  };


  const handleRequestTransportForProduct = (prod) => {
    setAiDefaultTab('matching');
    setActiveModule('ai');
    showToast(`Matching IA ouvert pour le transport de : ${prod.title}`);
  };

  const handleToggleLikePost = (postId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const sourcePost = socialPosts.find(p => p.id === postId);
    const isRemoving = sourcePost?.likedBy?.includes(currentUser.id);
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
    if (!isRemoving) sendNotification(sourcePost?.authorId, 'post_like', 'a aimé votre publication.', { module: 'social', postId });
  };

  const handleToggleLikeProduct = (productId) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const sourceProduct = products.find(p => p.id === productId);
    const isRemoving = sourceProduct?.likedBy?.includes(currentUser.id);
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
    if (!isRemoving) sendNotification(sourceProduct?.sellerId, 'product_like', 'a aimé votre annonce.', { module: 'products', productId });
  };

  const handleAddProductComment = (productId, text) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id !== productId) return p;
        return {
          ...p,
          comments: [...(p.comments || []), { id: `pc-${Date.now()}`, userId: currentUser.id, user: currentUser.name, avatar: currentUser.avatar, text }]
        };
      });
      const prod = updated.find(p => p.id === productId);
      if (prod) upsertData('products', productId, prod);
      return updated;
    });
    const product = products.find(p => p.id === productId);
    sendNotification(product?.sellerId, 'product_comment', 'a commenté votre annonce.', { module: 'products', productId });
    showToast('✅ Commentaire ajouté au produit !');
  };

  // Incrémente et enregistre le compteur de partages du contenu concerné
  const bumpShareCount = (table, id) => {
    const setter = table === 'posts' ? setSocialPosts : table === 'products' ? setProducts : setServices;
    setter(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, sharesCount: (item.sharesCount || 0) + 1 } : item));
      const target = updated.find(item => item.id === id);
      if (target) upsertData(table, id, target);
      return updated;
    });
  };

  const handleShare = async (item, type = 'post') => {
    const text = type === 'post' ? `Post de ${item.authorName}` : `Annonce : ${item.title}`;
    const table = type === 'post' ? 'posts' : type === 'service' ? 'services' : 'products';
    try {
      if (navigator.share) {
        await navigator.share({
          title: text,
          text: 'Découvrez ceci sur AgriConnect',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('✅ Lien copié dans le presse-papier !');
      }
      bumpShareCount(table, item.id);
    } catch (err) {
      console.log('Erreur de partage', err);
    }
  };

  // ── Messaging handlers ────────────────────────────────────────────────────
  // A conversation is shared between the two accounts:
  // { id, participantIds: [a, b], participants: { [id]: {id,name,avatar} }, messages: [], reads: { [id]: ts } }
  const convIdFor = (a, b) => `conv-${[String(a), String(b)].sort().join('__')}`;

  // Resolve the real account behind a listing (product / service / post) or a user card.
  const resolveParticipant = (participant) => {
    if (!participant) return null;
    const id =
      participant.sellerId || participant.authorId || participant.providerId || participant.id;
    const name =
      participant.sellerName || participant.authorName || participant.providerName ||
      participant.name || 'Inconnu';
    const avatar =
      participant.sellerAvatar || participant.authorAvatar || participant.providerAvatar ||
      participant.avatar || '';
    if (!id) return null;
    return { id: String(id), name, avatar };
  };

  // Creates the conversation if needed and returns its id (null when impossible).
  const ensureConversation = (participant) => {
    if (!currentUser) { setIsAuthModalOpen(true); return null; }
    const target = resolveParticipant(participant);
    if (!target) {
      showToast("⚠️ Impossible d'identifier le destinataire de ce message.");
      return null;
    }
    if (target.id === String(currentUser.id)) {
      showToast('⚠️ Vous ne pouvez pas vous envoyer un message à vous-même.');
      return null;
    }

    const id = convIdFor(currentUser.id, target.id);
    const existing = conversations.find(c => c.id === id);
    if (existing) return id;

    const newConv = {
      id,
      participantIds: [String(currentUser.id), target.id],
      participants: {
        [String(currentUser.id)]: { id: String(currentUser.id), name: currentUser.name, avatar: currentUser.avatar || '' },
        [target.id]: { id: target.id, name: target.name, avatar: target.avatar },
      },
      messages: [],
      reads: {},
    };
    setConversations(prev => [newConv, ...prev.filter(c => c.id !== id)]);
    upsertData('conversations', newConv.id, newConv);
    return id;
  };

  const startOrOpenConversation = (participant) => {
    const target = resolveParticipant(participant);
    const convId = ensureConversation(participant);
    if (!convId) return;
    setIsMessagingOpen(true);
    showToast(`💬 Conversation avec ${target?.name || 'ce membre'} ouverte dans votre messagerie.`);
  };

  // Used by the contact form (services, eau & énergie, etc.): really delivers the text.
  const sendDirectMessage = (participant, text) => {
    const body = (text || '').trim();
    if (!body) return false;
    const convId = ensureConversation(participant);
    if (!convId) return false;
    handleSendMessage(convId, body);
    const target = resolveParticipant(participant);
    showToast(`✅ Message envoyé à ${target?.name || 'ce membre'}.`);
    return true;
  };

  const handleSendMessage = (convId, text) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const ts = Date.now();
    const msgId = `msg-${ts}-${Math.random().toString(36).slice(2, 7)}`;
    // delivered = false tant que le message n'est pas enregistré côté serveur (1 coche)
    const newMsg = { id: msgId, senderId: String(currentUser.id), text, ts, delivered: false };
    const sourceConversation = conversations.find(c => c.id === convId);
    // Fallback: a conversation created in the same tick isn't in state yet, so read the ids from the conv id.
    const idsFromConvId = String(convId).replace(/^conv-/, '').split('__');
    const recipientId =
      sourceConversation?.participantIds?.map(String).find(id => id !== String(currentUser.id)) ||
      idsFromConvId.find(id => id && id !== String(currentUser.id));
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...(c.messages || []), newMsg], reads: { ...(c.reads || {}), [String(currentUser.id)]: ts } }
          : c
      );
      const conv = updated.find(c => c.id === convId);
      if (conv) {
        Promise.resolve(upsertData('conversations', convId, conv)).then(() => {
          // le message est bien arrivé sur le serveur → 2 coches (grises tant que non lu)
          setConversations(cur => {
            const next = cur.map(c =>
              c.id === convId
                ? { ...c, messages: (c.messages || []).map(m => (m.id === msgId ? { ...m, delivered: true } : m)) }
                : c
            );
            const updatedConv = next.find(c => c.id === convId);
            if (updatedConv) upsertData('conversations', convId, updatedConv);
            return next;
          });
        });
      }
      return updated;
    });
    sendNotification(recipientId, 'message', 'vous a envoyé un nouveau message.', { conversationId: convId });
  };

  const handleMarkRead = (convId) => {
    if (!currentUser) return;
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === convId ? { ...c, reads: { ...(c.reads || {}), [String(currentUser.id)]: Date.now() } } : c
      );
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

  const markNotificationRead = (notification) => {
    if (!notification || notification.read) return;
    const updated = { ...notification, read: true };
    setNotifications(prev => prev.map(item => item.id === notification.id ? updated : item));
    updateNotification(notification.id, updated);
  };

  const handleOpenNotification = (notification) => {
    markNotificationRead(notification);
    setIsNotificationsOpen(false);
    if (notification.type === 'message') {
      setIsMessagingOpen(true);
      return;
    }
    if (notification.target?.profileId) {
      const actor = allAvailableUsers.find(user => String(user.id) === String(notification.actorId));
      if (actor) setProfileModalTarget({ authorId: actor.id, authorName: actor.name, authorAvatar: actor.avatar || '', authorRole: actor.roleLabel || 'Membre' });
      return;
    }
    if (notification.target?.module) setActiveModule(notification.target.module);
  };

  const handleMarkAllNotificationsRead = () => {
    const unread = notifications.filter(item => !item.read);
    const updated = notifications.map(item => ({ ...item, read: true }));
    setNotifications(updated);
    unread.forEach(item => updateNotification(item.id, { ...item, read: true }));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
    deleteData('notifications', id);
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

  const showSplash = isLoading || !minSplashDone;

  const totalUnread = myConversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const unreadNotifications = notifications.filter(item => !item.read).length;

  const openMyProfile = () => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setProfileModalTarget({
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar || '',
      authorRole: currentUser.roleLabel || 'Membre',
      authorBadge: currentUser.badge || 'Membre Vérifié',
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`stable-page flex min-h-screen flex-col bg-[#f3f2ef] font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900 transition-[padding] duration-200 ${bottomNavHidden ? 'pb-0' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'}`} data-language={language}>

      {showSplash && <SplashScreen done={!isLoading} />}


      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#0a66c2] bg-white px-4 py-3 text-slate-900 shadow-xl sm:inset-x-auto sm:bottom-5 sm:end-5">
          <CheckCircle2 className="w-5 h-5 text-[#0a66c2] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} aria-label="Fermer la notification" className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        setActiveModule={setActiveModule}
        unreadCount={totalUnread}
        onToggleMessaging={() => {
          if (!currentUser) { setIsAuthModalOpen(true); return; }
          setIsNotificationsOpen(false);
          setIsMessagingOpen(o => !o);
        }}
      />

      <div className={`sticky top-[62px] z-30 overflow-hidden border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl transition-[max-height,opacity,border-color] duration-200 ease-out ${toolsHidden ? 'pointer-events-none max-h-0 border-transparent opacity-0' : 'max-h-44 opacity-100'}`}>
        {isSearchOpen && <div className="px-3 pt-2"><div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3"><Search className="h-4 w-4 shrink-0 text-slate-400" /><input autoFocus value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={t('Rechercher une récolte, un service, un membre…')} className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none sm:text-sm" /><button type="button" onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} aria-label={t('Fermer')} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200"><X className="h-4 w-4" /></button></div></div>}
        <section className="mx-auto w-full max-w-7xl px-3 py-2 sm:px-4" aria-labelledby="module-title">
          <h2 id="module-title" className="sr-only">{t('Explorer AgriConnect')}</h2>
          <div className="grid grid-cols-5 gap-1.5 overflow-hidden sm:gap-2">
            {MODULES.map(({ id, label, hint, icon: Icon }) => <button type="button" key={id} onClick={() => setActiveModule(id)} aria-current={activeModule === id ? 'page' : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center transition ${activeModule === id ? 'border-[#0a66c2] bg-blue-50 text-[#0a66c2]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4 shrink-0" /><span className="hidden text-[10px] font-bold leading-tight sm:block">{t(label)}</span><span className="max-w-full truncate text-[9px] font-semibold sm:hidden">{t(hint)}</span></button>)}
          </div>
        </section>
      </div>



      {/* ── Titre principal (SEO) ── */}
      <section className="max-w-7xl mx-auto px-4 pt-5 w-full">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          {t('AgriConnect — le réseau professionnel agricole')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium max-w-3xl">
          {t("Vendez vos récoltes, trouvez des transporteurs et prestataires, échangez avec les acteurs de l'agriculture et analysez vos plantes grâce à l'intelligence artificielle.")}
        </p>
      </section>

      {/* ── Info Banner : explains where posts go ── */}

      {activeModule === 'products' && (
        <div className="max-w-7xl mx-auto px-4 pt-4 w-full">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs text-blue-800 font-medium">
            <Info className="w-4 h-4 text-[#0a66c2] shrink-0" />
             <span>{t('Pour publier une récolte ici, cliquez sur « Vendre ma récolte » ci-dessous. Les publications du Réseau Social sont distinctes.')}</span>
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
            onDeleteProduct={handleDeleteProduct}
            onRegisterView={(id) => handleRegisterView('products', id)}
          />
        )}

        {activeModule === 'services' && (
          <MarketplaceServices
            services={services}
            currentUser={currentUser}
            onContactProvider={(serv) => { if (!currentUser) setIsAuthModalOpen(true); else setContactTarget(serv); }}
            onOpenCreate={() => openCreateModal('service')}
            searchQuery={searchQuery}
            onDeleteService={handleDeleteService}
            onRegisterView={(id) => handleRegisterView('services', id)}
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
            onDeleteComment={handleDeleteComment}
            onToggleLike={handleToggleLikePost}
            onRepost={handleRepost}
            onToggleFollow={handleToggleFollow}
            onAddCommentReaction={handleAddCommentReaction}
            onShare={(post) => handleShare(post, 'post')}
            onContactUser={startOrOpenConversation}
            onOpenProfile={setProfileModalTarget}
            allProducts={products}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onRegisterView={(id) => handleRegisterView('posts', id)}
          />
        )}

        {activeModule === 'ai' && (
          <AIHub
            currentUser={currentUser}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onDispatchSuccess={(msg) => showToast(msg)}
            defaultTab={aiDefaultTab}
            key={aiDefaultTab}
          />
        )}

        {activeModule === 'reputation' && (
          <ReputationDirectory
            actors={allAvailableUsers.filter(u => !currentUser || u.id !== currentUser.id)}
            onContactActor={(actor) => { if (!currentUser) setIsAuthModalOpen(true); else startOrOpenConversation(actor); }}
            searchQuery={searchQuery}
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
        onSendMessage={(text) => sendDirectMessage(contactTarget, text)}
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
          allUsers={allAvailableUsers}
          currentUser={currentUser}
          onToggleFollow={handleToggleFollow}
          onStartConversation={startOrOpenConversation}
          onOpenProfile={setProfileModalTarget}
          onRequireAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Messagerie (ancrée en haut à droite, comme Facebook) */}
      <MessagingPanel
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
        currentUser={currentUser}
        conversations={myConversations}
        onSendMessage={handleSendMessage}
        onMarkRead={handleMarkRead}
        onDeleteConv={handleDeleteConv}
        allUsers={allAvailableUsers}
        onStartConversation={startOrOpenConversation}
      />

      <NotificationPanel
        isOpen={isNotificationsOpen}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenNotification={handleOpenNotification}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDelete={handleDeleteNotification}
      />

      <BottomNav
        hidden={bottomNavHidden}
        activeAction={isSearchOpen ? 'search' : isNotificationsOpen ? 'notifications' : profileModalTarget ? 'profile' : 'home'}
        onHome={() => { setActiveModule('products'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSearch={() => { setIsSearchOpen(value => !value); setIsMessagingOpen(false); setIsNotificationsOpen(false); }}
        onPublish={() => openCreateModal(activeModule === 'services' ? 'service' : 'product')}
        onNotifications={() => { if (!currentUser) { setIsAuthModalOpen(true); return; } setIsMessagingOpen(false); setIsNotificationsOpen(value => !value); }}
        onProfile={openMyProfile}
        onAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onLanguageChange={handleLanguageChange}
        currentUser={currentUser}
        notificationCount={unreadNotifications}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0a66c2]">AgriConnect 🌱</span>
            <span>— {t('Le réseau professionnel agricole')}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
             <span>{t('Marketplace Produits')}</span>
             <span>{t('Services & Logistique')}</span>
             <span>{t('Matching IA Pro')}</span>
            <a href="/conditions" className="font-bold text-[#0a66c2] hover:underline">
              {t("Conditions d'utilisation")}
            </a>
            <a href="/mentions-legales" className="font-bold text-[#0a66c2] hover:underline">
              {t('Mentions légales')}
            </a>
            <a href="/politique-d-utilisation" className="font-bold text-[#0a66c2] hover:underline">
              {t("Politique d'utilisation")}
            </a>
          </div>
          <div className="flex flex-col items-center gap-1 text-slate-400 md:items-end">
            <span>© 2026 AgriConnect. {t('Tous droits réservés.')}</span>
            <span>
               {t('Développé en partenariat par')}{' '}
              <a
                href="https://3A55.Fulania.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#0a66c2] hover:underline"
              >
                3A55
              </a>{' '}
              & Agrosky
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}

