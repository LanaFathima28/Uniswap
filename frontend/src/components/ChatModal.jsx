import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendMessage, getMessagesForTransaction, markMessagesAsRead } from '../services/messageService';
import { X, Send, MessageSquare, Check, ShieldCheck, IndianRupee, AlertCircle, Package } from 'lucide-react';

const ChatModal = ({ transaction, onClose }) => {
  const { currentUser, token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  if (!transaction) return null;

  const { _id: transactionId, productId, buyerId, sellerId, status, type } = transaction;

  const isBuyer = Boolean(currentUser && (buyerId?._id || buyerId)?.toString() === currentUser._id.toString());
  const peer = isBuyer ? sellerId : buyerId;
  const peerMongoId = peer?._id || peer;

  // Format Peer Name and photo
  const peerName = peer?.name || (isBuyer ? 'Seller' : 'Buyer');
  const peerPhoto = peer?.profilePhotoUrl;
  const peerRole = peer?.role || 'Peer';

  const productTitle = productId?.title || 'Product Listing';
  const productCost = productId?.cost || productId?.price || 0;
  const productImage = (productId?.images && productId.images.length > 0) ? productId.images[0] : null;

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages and setup polling (3s)
  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const res = await getMessagesForTransaction(transactionId, token);
        if (isMounted && res.success && res.data) {
          setMessages(res.data);
          setError('');

          // Mark unread messages as read
          markMessagesAsRead(transactionId, token).catch(() => {});
        } else if (isMounted && showLoading) {
          setError(res.message || 'Failed to load chat thread');
        }
      } catch (err) {
        if (isMounted && showLoading) {
          setError(err.message || 'Error loading messages');
        }
      } finally {
        if (isMounted && showLoading) {
          setLoading(false);
        }
      }
    };

    fetchMessages(true);

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [transactionId, token]);

  // Scroll on messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    setError('');

    try {
      const res = await sendMessage(
        {
          transactionId,
          receiverId: peerMongoId,
          text: messageText
        },
        token
      );

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
      } else {
        setError(res.message || 'Failed to send message');
        setInputText(messageText); // Restore input on error
      }
    } catch (err) {
      setError(err.message || 'Error sending message');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  // Initials for avatar fallback
  const initials = peerName
    ? peerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full h-[600px] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3 min-w-0">
            {/* Peer Avatar */}
            <div className="relative shrink-0">
              {peerPhoto ? (
                <img
                  src={peerPhoto}
                  alt={peerName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/40"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold text-sm flex items-center justify-center border-2 border-indigo-500/40">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
            </div>

            {/* Peer Info & Product */}
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base truncate">{peerName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isBuyer ? 'Seller' : 'Buyer'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                <span className="text-slate-300 font-semibold truncate">{productTitle}</span>
                <span className="text-indigo-400 font-mono">₹{productCost}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {/* Message Thread Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 text-center p-6">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-1" />
              <p className="text-sm font-semibold text-slate-300">No messages yet</p>
              <p className="text-xs text-slate-500">
                Start the conversation with {peerName} regarding "{productTitle}".
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
                    className={`max-w-[78%] p-3.5 rounded-2xl text-sm leading-relaxed ${
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

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/20 text-red-300 text-xs flex items-center gap-2 border-t border-red-500/30">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${peerName}...`}
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

      </div>
    </div>
  );
};

export default ChatModal;
