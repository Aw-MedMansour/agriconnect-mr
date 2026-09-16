import React, { useState, useEffect, useRef } from 'react';
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
import NotificationPanel from './components/NotificationPanel';
import UserProfileModal from './components/UserProfileModal';
import ComingSoonModule from './components/ComingSoonModule';
import PlantAnalysis from './components/PlantAnalysis';
import SplashScreen from './components/SplashScreen';

import { MOCK_ACTORS, MOCK_PRODUCTS, MOCK_SERVICES, MOCK_SOCIAL_POSTS } from './data/mockData';
import { CheckCircle2, X, Info, Droplets, Landmark, Map, HardHat } from 'lucide-react';

import { fetchAllData, fetchConversations, fetchUsers, fetchNotifications, updateNotification, insertData, upsertData, deleteData } from './utils/dbSync';

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const userRestoredRef = useRef(false);
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
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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


  // ── Restore currentUser from localStorage (client-only, avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('agriconnect_user'));
      if (stored) setCurrentUser(stored);
    } catch { /* ignore */ }
    userRestoredRef.current = true;
  }, []);

  // ── Persist currentUser locally ────────────────────────────────
  useEffect(() => {
    if (!userRestoredRef.current) return;
    if (currentUser) localStorage.setItem('agriconnect_user', JSON.stringify(currentUser));
    else localStorage.removeItem('agriconnect_user');
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
    setActiveModule('matching');
    showToast(`Matching pré-rempli pour le transport de : ${prod.title}`);
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

  const handleShare = async (item, type = 'post') => {
    const text = type === 'post' ? `Post de ${item.authorName}` : `Produit: ${item.title}`;
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
    <div className="min-h-screen bg-[#f3f2ef] text-slate-900 flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900">

      {showSplash && <SplashScreen done={!isLoading} />}


      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-[#0a66c2] text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#0a66c2] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} aria-label="Fermer la notification" className="text-slate-400 hover:text-slate-700 p-1">
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
        products={products}
        members={allAvailableUsers}
        unreadCount={totalUnread}
        isMessagingOpen={isMessagingOpen}
        onToggleMessaging={() => {
          if (!currentUser) { setIsAuthModalOpen(true); return; }
          setIsNotificationsOpen(false);
          setIsMessagingOpen(o => !o);
        }}
        notificationCount={unreadNotifications}
        isNotificationsOpen={isNotificationsOpen}
        onToggleNotifications={() => {
          if (!currentUser) { setIsAuthModalOpen(true); return; }
          setIsMessagingOpen(false);
          setIsNotificationsOpen(open => !open);
        }}
        onOpenMyProfile={openMyProfile}
      />



      {/* ── Titre principal (SEO) ── */}
      <section className="max-w-7xl mx-auto px-4 pt-5 w-full">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          AgriConnect — le réseau professionnel agricole
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium max-w-3xl">
          Vendez vos récoltes, trouvez des transporteurs et prestataires, échangez avec
          les acteurs de l'agriculture et analysez vos plantes grâce à l'intelligence artificielle.
        </p>
      </section>

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
          />
        )}

        {activeModule === 'plantai' && (
          <PlantAnalysis
            currentUser={currentUser}
            onRequireAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeModule === 'matching' && (
          <MatchingEngine onDispatchSuccess={(msg) => showToast(msg)} />
        )}

        {activeModule === 'reputation' && (
          <ReputationDirectory
            actors={allAvailableUsers.filter(u => !currentUser || u.id !== currentUser.id)}
            onContactActor={(actor) => { if (!currentUser) setIsAuthModalOpen(true); else startOrOpenConversation(actor); }}
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0a66c2]">AgriConnect 🌱</span>
            <span>— Le réseau professionnel agricole</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
            <span>Marketplace Produits</span>
            <span>Services & Logistique</span>
            <span>Matching IA Pro</span>
            <a href="/conditions" className="font-bold text-[#0a66c2] hover:underline">
              Conditions d'utilisation
            </a>
            <a href="/mentions-legales" className="font-bold text-[#0a66c2] hover:underline">
              Mentions légales
            </a>
            <a href="/politique-d-utilisation" className="font-bold text-[#0a66c2] hover:underline">
              Politique d'utilisation
            </a>
          </div>
          <div className="flex flex-col items-center gap-1 text-slate-400 md:items-end">
            <span>© 2026 AgriConnect. Tous droits réservés.</span>
            <span>
              Développé en partenariat par{' '}
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

