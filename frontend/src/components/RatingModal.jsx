import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitRating } from '../services/ratingService';
import { Star, X, CheckCircle2, AlertCircle } from 'lucide-react';

const RatingModal = ({ transaction, isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();

  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (stars < 1 || stars > 5) {
      setError('Please select a star rating between 1 and 5');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitRating(
        {
          transactionId: transaction._id,
          stars,
          comment: comment.trim()
        },
        token
      );

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to submit seller rating');
      }
    } catch (err) {
      setError(err.message || 'An error occurred submitting rating');
    } finally {
      setSubmitting(false);
    }
  };

  const sellerName = transaction.sellerId?.name || 'Seller';
  const productTitle = transaction.productId?.title || 'Item';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30 uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-300" />
            Seller Review
          </div>
          <h2 className="text-xl font-extrabold text-white">Rate {sellerName}</h2>
          <p className="text-xs text-slate-400">
            How was your transaction for <span className="text-slate-200 font-semibold">"{productTitle}"</span>?
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Interactive Star Picker */}
          <div className="space-y-2 text-center">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Star Rating
            </label>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((starNum) => {
                const active = starNum <= (hoverStars || stars);
                return (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => setStars(starNum)}
                    onMouseEnter={() => setHoverStars(starNum)}
                    onMouseLeave={() => setHoverStars(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        active
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-amber-300">
              {stars === 5 ? 'Excellent ⭐⭐⭐⭐⭐' : stars === 4 ? 'Very Good ⭐⭐⭐⭐' : stars === 3 ? 'Good ⭐⭐⭐' : stars === 2 ? 'Fair ⭐⭐' : 'Poor ⭐'}
            </p>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Review Comment (Optional)
            </label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Punctual, item in great condition, smooth campus meet up..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Rating</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RatingModal;
