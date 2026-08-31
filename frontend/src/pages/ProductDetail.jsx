import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProductById, deleteProduct, updateProductStatus } from '../services/productService';
import { expressInterest, checkUserInterestForProduct } from '../services/transactionService';
import { getUserRatings } from '../services/ratingService';
import ProfileCard from '../components/ProfileCard';
import { 
  IndianRupee, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  Heart, 
  AlertTriangle, 
  ArrowLeft, 
  Calendar, 
  Palette, 
  Ruler, 
  Package, 
  AlertCircle,
  CheckCircle2,
  Star,
  Check
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();

  // Data & Loading States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interest state
  const [hasInterest, setHasInterest] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestFeedback, setInterestFeedback] = useState('');
  const [interestError, setInterestError] = useState('');

  // Seller Rating Score state
  const [sellerRating, setSellerRating] = useState({ averageRating: 0, totalRatings: 0 });

  // Image Gallery Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Deleting modal / state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch Product Detail & Check Existing Interest
  useEffect(() => {
    let isMounted = true;
    const fetchProductAndInterest = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getProductById(id, token);
        if (isMounted) {
          if (res.success && res.data) {
            setProduct(res.data);

            const ownerId = typeof res.data.ownerId === 'object' ? res.data.ownerId?._id : res.data.ownerId;

            // Fetch seller rating score
            if (ownerId) {
              const ratingRes = await getUserRatings(ownerId, token);
              if (ratingRes.success && ratingRes.data) {
                setSellerRating({
                  averageRating: ratingRes.data.averageRating || 0,
                  totalRatings: ratingRes.data.totalRatings || 0
                });
              }
            }

            // Check if logged-in user has already expressed interest in this product
            if (currentUser && ownerId && currentUser._id.toString() !== ownerId.toString()) {
              const checkRes = await checkUserInterestForProduct(id, token);
              if (checkRes.success && checkRes.data?.hasExpressedInterest) {
                setHasInterest(true);
              }
            }
          } else {
            setError(res.message || 'Product not found');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error fetching product details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProductAndInterest();
    return () => {
      isMounted = false;
    };
  }, [id, token, currentUser]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center flex-1">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/home')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>

        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">Error Loading Listing</h3>
            <p className="text-xs mt-1 text-slate-300">{error || 'This listing might have been removed or does not exist.'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Destructure product properties
  const {
    _id,
    title,
    description,
    category,
    listingType,
    cost,
    color,
    usageDuration,
    dimensions,
    hasDamage,
    damageDescription,
    images = [],
    status,
    createdAt,
    ownerId
  } = product;

  // Determine owner Mongo ID
  const ownerMongoId = typeof ownerId === 'object' ? ownerId?._id : ownerId;
  const isOwner = Boolean(currentUser && ownerMongoId && currentUser._id.toString() === ownerMongoId.toString());

  // Carousel Next/Prev Navigation
  const handlePrevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Real handleExpressInterest function
  const handleExpressInterest = async () => {
    if (hasInterest || interestLoading) return;
    setInterestLoading(true);
    setInterestError('');
    setInterestFeedback('');

    try {
      const res = await expressInterest(_id, token);
      if (res.success) {
        setHasInterest(true);
        setInterestFeedback('Interest expressed! The seller has been notified.');
      } else {
        setInterestError(res.message || 'Failed to express interest.');
      }
    } catch (err) {
      setInterestError(err.message || 'Error expressing interest.');
    } finally {
      setInterestLoading(false);
    }
  };

  // Handle Toggle Sold/Rented/Available Status
  const handleToggleStatus = async () => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    const targetStatus = status === 'Available' ? (listingType === 'Rent' ? 'Rented' : 'Sold') : 'Available';
    try {
      const res = await updateProductStatus(_id, targetStatus, token);
      if (res.success && res.data) {
        setProduct(res.data);
        if (targetStatus !== 'Available') {
          // Immediately remove item from active listings & redirect owner to profile activity
          navigate('/profile?tab=activity');
        }
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteProduct(_id, token);
      if (res.success) {
        navigate('/home');
      } else {
        alert(res.message || 'Failed to delete listing');
      }
    } catch (err) {
      alert(err.message || 'Error deleting listing');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/home')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>

        <span className="text-xs text-slate-500 font-mono">
          ID: {_id}
        </span>
      </div>

      {/* Main Grid: Images & Details (Left 7 cols) + Owner Card & Actions (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Gallery & Main Content */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Image Gallery / Carousel Component */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center">
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  alt={`${title} view ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600">
                  <Package className="w-12 h-12 mb-2" />
                  <span className="text-xs font-medium">No Images Available</span>
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border ${
                    listingType === 'Rent'
                      ? 'bg-amber-500/90 text-slate-950 border-amber-400'
                      : 'bg-emerald-600/90 text-white border-emerald-400'
                  }`}
                >
                  {listingType}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 shadow-lg">
                  {category}
                </span>
              </div>

              {/* Carousel Controls (Show only if > 1 image) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-md border border-slate-700 transition shadow-lg"
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-md border border-slate-700 transition shadow-lg"
                    title="Next Image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-slate-300 text-xs font-mono rounded-full border border-slate-800">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Navigation Row */}
            {images.length > 1 && (
              <div className="p-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      idx === currentImageIndex ? 'border-indigo-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Header & Title */}
          <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Listed {createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                </p>
              </div>

              {/* Price Banner */}
              <div className="bg-indigo-950/80 border border-indigo-500/30 p-3 px-5 rounded-2xl flex items-center gap-1 font-extrabold text-2xl text-indigo-400 shrink-0">
                <IndianRupee className="w-6 h-6 text-indigo-400" />
                <span>{cost?.toLocaleString('en-IN') || 0}</span>
                {listingType === 'Rent' && <span className="text-xs font-medium text-slate-400 ml-1">/ rent</span>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{description}</p>
            </div>

            {/* Technical Specs Grid */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specifications</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {color && (
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Color</p>
                      <p className="text-xs font-medium text-slate-200">{color}</p>
                    </div>
                  </div>
                )}

                {usageDuration && (
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Usage Duration</p>
                      <p className="text-xs font-medium text-slate-200">{usageDuration}</p>
                    </div>
                  </div>
                )}

                {dimensions && (
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
                    <Ruler className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Dimensions</p>
                      <p className="text-xs font-medium text-slate-200">{dimensions}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Damage Info (Shown ONLY if hasDamage is true) */}
            {hasDamage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Item Condition & Damage Notice</span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  {damageDescription || 'Seller noted minor wear or cosmetic damage.'}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Action Buttons & Owner Snippet */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Action Box (Owner vs Buyer controls) */}
          <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {isOwner ? 'Manage Your Listing' : 'Interested in this item?'}
            </h2>

            {isOwner ? (
              /* Owner Actions: Mark Sold/Rented, Edit & Delete */
              <div className="space-y-3">
                <button
                  onClick={handleToggleStatus}
                  disabled={updatingStatus}
                  className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
                    status === 'Available'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                      : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {updatingStatus ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : status === 'Available' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as {listingType === 'Rent' ? 'Rented' : 'Sold'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span>Mark as Available (Cancel {status})</span>
                    </>
                  )}
                </button>

                {['Sold', 'Rented'].includes(status) && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-medium leading-relaxed">
                    ⚠️ Marked as <strong>{status}</strong>. This listing will be automatically deleted from the database in 24 hours.
                  </div>
                )}

                <button
                  onClick={() => navigate(`/products/edit/${_id}`)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Listing</span>
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-slate-700 hover:border-red-500/40 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Listing</span>
                </button>
              </div>
            ) : (
              /* Non-Owner Action: "I'm Interested" or "Interest Sent" button */
              <div className="space-y-3">
                <button
                  onClick={handleExpressInterest}
                  disabled={hasInterest || interestLoading || status !== 'Available'}
                  className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl shadow-xl transition flex items-center justify-center gap-2 ${
                    hasInterest
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-none cursor-not-allowed'
                      : status !== 'Available'
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  {interestLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Sending Interest...</span>
                    </>
                  ) : hasInterest ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Interest Sent</span>
                    </>
                  ) : status !== 'Available' ? (
                    <span>Item {status}</span>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-white" />
                      <span>I'm Interested</span>
                    </>
                  )}
                </button>

                {interestFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{interestFeedback}</span>
                  </div>
                )}

                {interestError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{interestError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Owner Profile Snippet with Star Rating Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Listed By Campus Peer
              </h3>
              
              {/* Rating score badge */}
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{sellerRating.averageRating > 0 ? sellerRating.averageRating.toFixed(1) : 'New'}</span>
                {sellerRating.totalRatings > 0 && (
                  <span className="text-slate-400 font-normal text-[10px]">({sellerRating.totalRatings})</span>
                )}
              </div>
            </div>

            {ownerMongoId ? (
              <ProfileCard userId={ownerMongoId} />
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 text-center">
                Seller information unavailable
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">Delete Listing?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete "{title}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Listing</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetail;
