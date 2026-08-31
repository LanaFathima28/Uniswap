import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessagesForTransaction, sendMessage, markMessagesAsRead } from '../services/messageService';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Package, 
  IndianRupee, 
  AlertCircle, 
  CheckCheck, 
  Sparkles,
  Inbox,
  User
} from 'lucide-react';

const Messages = () => {
  const { currentUser, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Conversations List on Mount & Polling (5s)
  useEffect(() => {
    let isMounted = true;

    const fetchConvs = async (showLoading = false) => {
      if (showLoading) setLoadingConversations(true);
      try {
        const res = await getConversations(token);
        if (isMounted && res.success && res.data) {
          setConversations(res.data);
          
          // Auto-select first conversation if none is selected
          if (!activeConversation && res.data.length > 0) {
            setActiveConversation(res.data[0]);
          }
        }
      } catch (err) {
        if (isMounted && showLoading) {
          setError(err.message || 'Error loading conversations');
        }
      } finally {
        if (isMounted && showLoading) {
          setLoadingConversations(false);
        }
      }
    };

    fetchConvs(true);

    const interval = setInterval(() => {
      fetchConvs(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // Fetch Messages for Active Conversation & Polling (3s)
  useEffect(() => {
    if (!activeConversation) return;

    let isMounted = true;
    const txId = activeConversation.transactionId;

    const fetchThread = async (showLoading = false) => {
      if (showLoading) setLoadingMessages(true);
      try {
        const res = await getMessagesForTransaction(txId, token);
        if (isMounted && res.success && res.data) {
          setMessages(res.data);

          // Mark unread messages as read
          markMessagesAsRead(txId, token).then(() => {
            // Update unread count in conversation list locally
            setConversations((prev) =>
              prev.map((c) => (c.transactionId === txId ? { ...c, unreadCount: 0 } : c))
            );
          }).catch(() => {});
        }
      } catch (err) {
        if (isMounted && showLoading) {
          setError(err.message || 'Error loading message thread');
        }
      } finally {
        if (isMounted && showLoading) {
          setLoadingMessages(false);
        }
      }
    };

    fetchThread(true);

    const interval = setInterval(() => {
      fetchThread(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeConversation, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    const txId = activeConversation.transactionId;
    const peerId = activeConversation.peer?._id || activeConversation.peer;

    try {
      const res = await sendMessage({ transactionId: txId, receiverId: peerId, text }, token);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();

        // Update lastMessage preview in conversations list
        setConversations((prev) =>
          prev.map((c) =>
            c.transactionId === txId
              ? {
                  ...c,
                  lastMessage: {
                    text: res.data.text,
                    senderId: res.data.senderId,
                    createdAt: res.data.createdAt,
                    isRead: true
                  }
                }
              : c
          )
        );
      } else {
        setError(res.message || 'Failed to send message');
        setInputText(text);
      }
    } catch (err) {
      setError(err.message || 'Error sending message');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    const peerName = c.peer?.name?.toLowerCase() || '';
    const prodTitle = c.product?.title?.toLowerCase() || '';
    return peerName.includes(term) || prodTitle.includes(term);
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Direct Messages
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Messages & Peer Chats</h1>
          <p className="text-slate-400 text-sm mt-1">Communicate directly with buyers and sellers for accepted requests.</p>
        </div>
      </div>

      {/* Main Dual-Pane Chat Layout */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[680px] grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT PANEL: Conversation List (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/60">
          
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loadingConversations ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Conversations Yet</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Messaging is enabled automatically when a seller accepts an interest request.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activeConversation?.transactionId === c.transactionId;
                const peerName = c.peer?.name || 'Campus Peer';
                const peerPhoto = c.peer?.profilePhotoUrl;
                const prodTitle = c.product?.title || 'Item';
                const initials = peerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <button
                    key={c.transactionId}
                    onClick={() => setActiveConversation(c)}
                    className={`w-full p-4 text-left transition flex items-start gap-3 relative ${
                      isActive
                        ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Peer Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      {peerPhoto ? (
                        <img
                          src={peerPhoto}
                          alt={peerName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/40">
                          {initials}
                        </div>
                      )}

                      {c.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-semibold text-sm text-slate-100 truncate">{peerName}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                          {c.myRole}
                        </span>
                      </div>

                      <p className="text-xs text-indigo-400 font-medium truncate mt-0.5">{prodTitle}</p>

                      <p className="text-xs text-slate-400 truncate mt-1">
                        {c.lastMessage ? c.lastMessage.text : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT PANEL: Active Chat Thread (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900/60">
          
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Peer Avatar */}
                  {activeConversation.peer?.profilePhotoUrl ? (
                    <img
                      src={activeConversation.peer.profilePhotoUrl}
                      alt={activeConversation.peer.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/40 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold text-sm flex items-center justify-center border-2 border-indigo-500/40 shrink-0">
                      {activeConversation.peer?.name ? activeConversation.peer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </div>
                  )}

                  <div className="truncate">
                    <h3 className="font-bold text-white text-base truncate">
                      {activeConversation.peer?.name || 'Campus Peer'}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-indigo-400 font-semibold">{activeConversation.product?.title}</span>
                      <span className="text-slate-500">• ₹{activeConversation.product?.cost || 0}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
                    {activeConversation.transactionStatus}
                  </span>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-950/30">
                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                    <p className="text-xs">Loading thread history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 text-center p-6">
                    <MessageSquare className="w-12 h-12 text-slate-600 mb-1" />
                    <p className="text-sm font-bold text-slate-300">Start the conversation</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Send a message to {activeConversation.peer?.name} to arrange pickup or payment.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = (msg.senderId?._id || msg.senderId)?.toString() === currentUser._id.toString();
                    const timeStr = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div
                        key={msg._id || msg.createdAt}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60 shadow-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <div
                            className={`text-[10px] mt-1 text-right font-mono ${
                              isMe ? 'text-indigo-200/80' : 'text-slate-400'
                            }`}
                          >
                            {timeStr}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="px-4 py-2 bg-red-500/20 text-red-300 text-xs flex items-center gap-2 border-t border-red-500/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Type message to ${activeConversation.peer?.name || 'peer'}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center shrink-0"
                  title="Send Message"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8 space-y-3">
              <MessageSquare className="w-14 h-14 text-slate-700" />
              <h3 className="text-lg font-bold text-slate-300">Select a Conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose an active transaction thread from the left panel to view and send messages.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Messages;
