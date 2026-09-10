import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Search,
  ChevronDown,
  CheckCheck,
  Phone,
  Video,
  Smile,
  ArrowLeft,
  Trash2
} from 'lucide-react';

const EMOJI_LIST = ['👍', '❤️', '😊', '🌾', '🚜', '🙏'];

// Helper: format time
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffM = Math.floor((now - d) / 60000);
  if (diffM < 1) return 'maintenant';
  if (diffM < 60) return `${diffM}m`;
  if (diffM < 1440) return `${Math.floor(diffM / 60)}h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

const ONLINE_IDS = ['user-2', 'user-3']; // mock online status

export default function MessagingPanel({ currentUser, conversations, onSendMessage, onMarkRead, onDeleteConv, allUsers, onStartConversation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (activeConv && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConv, conversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const filteredConvs = (conversations || []).filter(c =>
    !searchQuery || (c?.participantName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchedUsers = searchQuery 
    ? (allUsers || []).filter(u => 
        u && u.id !== currentUser?.id &&
        u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(conversations || []).some(c => c.participantId === u.id)
      )
    : [];

  const activeConvData = conversations.find(c => c.id === activeConv);

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    onSendMessage(activeConv, inputText.trim());
    setInputText('');
    setShowEmojiBar(false);
  };

  const openConv = (convId) => {
    setActiveConv(convId);
    onMarkRead(convId);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(p => !p)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gradient-to-r from-[#0a66c2] to-[#0ea5a0] text-white px-5 py-3 rounded-full shadow-xl shadow-[#0a66c2]/30 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-[#0a66c2]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm font-bold">Messages</span>
        {totalUnread > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-[350px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          style={{ maxHeight: '520px' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
            {activeConv ? (
              <button
                onClick={() => setActiveConv(null)}
                className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-[#0a66c2] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {activeConvData?.participantName || 'Retour'}
              </button>
            ) : (
              <h3 className="text-sm font-extrabold text-slate-900">
                Messagerie <span className="text-[#0a66c2]">AgriConnect</span>
              </h3>
            )}
            <div className="flex items-center gap-2">
              {activeConv && (
                <>
                  <button aria-label="Appeler" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button aria-label="Appel vidéo" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!activeConv ? (
            /* ── Conversation List ── */
            <>
              {/* Search bar */}
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une conversation..."
                    className="bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none flex-1"
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {filteredConvs.length === 0 && matchedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-xs text-slate-500 font-medium">Aucune conversation ou contact trouvé.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Recherchez un vendeur ou un agriculteur par son nom.</p>
                  </div>
                ) : (
                  <>
                    {filteredConvs.map(conv => {
                      const isOnline = ONLINE_IDS.includes(conv.participantId);
                      const lastMsg = conv.messages?.[conv.messages.length - 1];
                      return (
                        <div key={conv.id} className="relative group w-full">
                          <button
                            onClick={() => openConv(conv.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left"
                          >
                            {/* Avatar with online dot */}
                            <div className="relative shrink-0">
                              <img
                                src={conv.participantAvatar}
                                alt={conv.participantName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                              />
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs truncate ${conv.unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                  {conv.participantName}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0 ml-1">{formatTime(lastMsg?.ts)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-[11px] truncate ${conv.unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                  {lastMsg ? (lastMsg.senderId === currentUser?.id ? `Vous: ${lastMsg.text}` : lastMsg.text) : 'Démarrer la conversation'}
                                </p>
                                {conv.unread > 0 && (
                                  <span className="bg-[#0a66c2] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                                    {conv.unread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Delete conversation button */}
                          {onDeleteConv && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteConv(conv.id); }}
                              title="Supprimer la conversation"
                              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {matchedUsers.length > 0 && (
                      <div className="mt-2 pb-2">
                        <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-y border-slate-100">Nouveaux Contacts</div>
                        {matchedUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              onStartConversation(user);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left"
                          >
                            <img
                              src={user.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-900 block truncate">{user.name}</span>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">{user.roleLabel || 'Utilisateur'}</span>
                            </div>
                            <div className="text-[10px] font-bold text-[#0a66c2]">Contacter</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            /* ── Chat Window ── */
            <>
              {/* Participant status bar */}
              {activeConvData && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <div className="relative">
                    <img src={activeConvData.participantAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    {ONLINE_IDS.includes(activeConvData.participantId) && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{activeConvData.participantName}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      {ONLINE_IDS.includes(activeConvData.participantId) ? '● En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#f8fafc]">
                {activeConvData?.messages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                      <MessageSquare className="w-6 h-6 text-[#0a66c2]" />
                    </div>
                    <p className="text-xs text-slate-500">Démarrez la conversation !</p>
                  </div>
                ) : (
                  activeConvData?.messages?.map((msg, i) => {
                    const isMine = msg.senderId === currentUser?.id;
                    return (
                      <div key={i} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        {!isMine && (
                          <img src={activeConvData.participantAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        )}
                        <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                            isMine
                              ? 'bg-[#0a66c2] text-white rounded-br-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-xs'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1 text-[9px] text-slate-400 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <span>{formatTime(msg.ts)}</span>
                            {isMine && <CheckCheck className="w-3 h-3 text-[#0a66c2]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-slate-100 bg-white">
                {showEmojiBar && (
                  <div className="flex gap-2 mb-2 px-1">
                    {EMOJI_LIST.map(e => (
                      <button key={e} onClick={() => setInputText(t => t + e)} className="text-base hover:scale-125 transition-transform">
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEmojiBar(p => !p)}
                    className="text-slate-400 hover:text-[#0a66c2] transition-colors p-1"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="Écrire un message..."
                    className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="bg-gradient-to-r from-[#0a66c2] to-[#0ea5a0] disabled:opacity-40 disabled:shadow-none text-white p-2.5 rounded-full shadow-md shadow-[#0a66c2]/30 transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
