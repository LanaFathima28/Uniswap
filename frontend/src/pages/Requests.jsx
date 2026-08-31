import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIncomingTransactions, respondToTransaction, completeTransaction } from '../services/transactionService';
import { updateProductStatus } from '../services/productService';
import RatingModal from '../components/RatingModal';
import ChatModal from '../components/ChatModal';
import { 
  Inbox, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  IndianRupee, 
  Star, 
  Package, 
  AlertCircle, 
  Sparkles,
  User,
  MessageSquare
} from 'lucide-react';

const Requests = () => {
  const { token, currentUser } = useAuth();

  // Active Tab ('incoming' | 'outgoing')
  const [activeTab, setActiveTab] = useState('incoming');

  // Transactions State
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Rating Modal State
  const [selectedTxForRating, setSelectedTxForRating] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Chat Modal State
  const [selectedTxForChat, setSelectedTxForChat] = useState(null);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getIncomingTransactions(token);
      if (res.success && res.data) {
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      } else {
        setError(res.message || 'Failed to load transaction requests');
      }
    } catch (err) {
      setError(err.message || 'Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  // Handle Accept or Reject
  const handleRespond = async (txId, action) => {
    setProcessingId(txId);
    try {
      const res = await respondToTransaction(txId, action, token);
      if (res.success) {
        await fetchTransactions();
      } else {
        alert(res.message || `Failed to ${action.toLowerCase()} request`);
      }
    } catch (err) {
      alert(err.message || 'Error responding to request');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Mark Completed
  const handleComplete = async (txId) => {
    setProcessingId(txId);
    try {
      const res = await completeTransaction(txId, token);
      if (res.success) {
        await fetchTransactions();
      } else {
        alert(res.message || 'Failed to complete transaction');
      }
    } catch (err) {
      alert(err.message || 'Error marking completed');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Mark Product Sold/Rented Status
  const handleToggleProductStatus = async (productId, currentProductStatus, listingType) => {
    if (!productId) return;
    const targetStatus = currentProductStatus === 'Available' ? (listingType === 'Rent' ? 'Rented' : 'Sold') : 'Available';
    try {
      const res = await updateProductStatus(productId, targetStatus, token);
      if (res.success) {
        alert(res.message || `Product marked as ${targetStatus}`);
        await fetchTransactions();
      } else {
        alert(res.message || 'Failed to update product status');
      }
    } catch (err) {
      alert(err.message || 'Error updating product status');
    }
  };

  // Handle Open Rating Modal
  const handleOpenRating = (tx) => {
    setSelectedTxForRating(tx);
    setIsRatingModalOpen(true);
  };

  // Rating Success Callback
  const handleRatingSuccess = () => {
    fetchTransactions();
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Requests & Transactions
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Marketplace Requests</h1>
          <p className="text-slate-300 text-sm">
            Manage incoming peer interest requests for your listings, track your purchase requests, and rate completed deals.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'incoming'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Incoming Requests</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {incoming.filter((t) => t.status === 'Pending').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'outgoing'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>My Interest & Purchases</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            {outgoing.length}
          </span>
        </button>
      </div>

      {/* Error Feedback Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-3 border-indigo-500 border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-400">Loading requests...</p>
        </div>
      ) : activeTab === 'incoming' ? (
        
        /* ------------------------------------------------------------- */
        /* TAB 1: INCOMING REQUESTS (Where current user is Seller)       */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          {incoming.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 p-6">
              <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No incoming requests yet</h3>
              <p className="text-xs text-slate-500 mt-1">When campus peers express interest in items you listed, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incoming.map((tx) => {
                const product = tx.productId || {};
                const buyer = tx.buyerId || {};
                const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;

                return (
                  <div
                    key={tx._id}
                    className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Product Header Row */}
                      <div className="flex items-start gap-3.5">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={product.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            <Package className="w-7 h-7" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-white text-base truncate">{product.title || 'Product'}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                tx.type === 'Rent'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-extrabold text-indigo-400 text-sm mt-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>{product.cost?.toLocaleString('en-IN') || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Buyer Snippet */}
                      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
                        {buyer.profilePhotoUrl ? (
                          <img src={buyer.profilePhotoUrl} alt={buyer.name} className="w-9 h-9 rounded-full object-cover border border-slate-600 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {buyer.name ? buyer.name[0].toUpperCase() : 'B'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-slate-200 truncate">{buyer.name || 'Campus User'}</p>
                          <p className="text-slate-400 text-[10px]">{buyer.role || 'Peer'} {buyer.branch ? `• ${buyer.branch}` : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions / Status Footer */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                      </span>

                      {tx.status === 'Pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespond(tx._id, 'Reject')}
                            disabled={processingId === tx._id}
                            className="py-1.5 px-3 bg-slate-800 hover:bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg border border-slate-700 transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespond(tx._id, 'Accept')}
                            disabled={processingId === tx._id}
                            className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/30 transition flex items-center gap-1 disabled:opacity-50"
                          >
                            {processingId === tx._id ? (
                              <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Accept</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {['Accepted', 'Completed'].includes(tx.status) && (
                            <>
                              <button
                                onClick={() => setSelectedTxForChat(tx)}
                                className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 transition flex items-center gap-1"
                                title="Open Chat with Buyer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Open Chat</span>
                              </button>

                              {product._id && (
                                <button
                                  onClick={() => handleToggleProductStatus(product._id, product.status, tx.type)}
                                  className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition flex items-center gap-1 ${
                                    product.status === 'Available'
                                      ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                                      : 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                                  }`}
                                  title="Update product status to Sold/Rented"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{product.status === 'Available' ? `Mark ${tx.type === 'Rent' ? 'Rented' : 'Sold'}` : product.status}</span>
                                </button>
                              )}
                            </>
                          )}
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                              tx.status === 'Accepted'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : tx.status === 'Completed'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (

        /* ------------------------------------------------------------- */
        /* TAB 2: MY INTEREST & PURCHASES (Where current user is Buyer) */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          {outgoing.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 p-6">
              <Send className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No interest requests sent yet</h3>
              <p className="text-xs text-slate-500 mt-1">Browse campus listings on Home and click "I'm Interested" to express interest.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outgoing.map((tx) => {
                const product = tx.productId || {};
                const seller = tx.sellerId || {};
                const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;

                return (
                  <div
                    key={tx._id}
                    className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Product Header Row */}
                      <div className="flex items-start gap-3.5">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={product.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            <Package className="w-7 h-7" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-white text-base truncate">{product.title || 'Product'}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                tx.type === 'Rent'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-extrabold text-indigo-400 text-sm mt-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>{product.cost?.toLocaleString('en-IN') || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Seller Snippet */}
                      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
                        {seller.profilePhotoUrl ? (
                          <img src={seller.profilePhotoUrl} alt={seller.name} className="w-9 h-9 rounded-full object-cover border border-slate-600 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {seller.name ? seller.name[0].toUpperCase() : 'S'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-slate-200 truncate">Seller: {seller.name || 'Campus Peer'}</p>
                          <p className="text-slate-400 text-[10px]">{seller.role || 'Peer'} {seller.email ? `• ${seller.email}` : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Rating Triggers */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        Status: <strong className="text-slate-300">{tx.status}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {/* If Accepted/Completed, option to Open Chat */}
                        {['Accepted', 'Completed'].includes(tx.status) && (
                          <button
                            onClick={() => setSelectedTxForChat(tx)}
                            className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 transition flex items-center gap-1"
                            title="Open Chat with Seller"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Chat</span>
                          </button>
                        )}

                        {/* If Accepted, option to Mark Completed */}
                        {tx.status === 'Accepted' && (
                          <button
                            onClick={() => handleComplete(tx._id)}
                            disabled={processingId === tx._id}
                            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        {/* If Completed, option to Rate Seller */}
                        {tx.status === 'Completed' && (
                          tx.ratingGiven ? (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-300" />
                              <span>Rated</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenRating(tx)}
                              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5 fill-slate-950" />
                              <span>Rate Seller</span>
                            </button>
                          )
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      )}

      {/* Rating Modal Component */}
      <RatingModal
        transaction={selectedTxForRating}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSuccess={handleRatingSuccess}
      />

      {/* Chat Modal Component */}
      {selectedTxForChat && (
        <ChatModal
          transaction={selectedTxForChat}
          onClose={() => setSelectedTxForChat(null)}
        />
      )}

    </div>
  );
};

export default Requests;
