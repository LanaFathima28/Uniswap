import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProduct, getProductById, updateProduct } from '../services/productService';
import { uploadToCloudinary } from '../services/userService';
import { 
  PlusCircle, 
  Edit3, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon, 
  Tag, 
  IndianRupee,
  Package,
  ArrowLeft
} from 'lucide-react';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Cycle', 'Other'];

const ProductForm = () => {
  const { id } = useParams(); // If present, mode is "edit", otherwise "create"
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const { token, currentUser } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Books',
    listingType: typeParam === 'Rent' ? 'Rent' : 'Sell',
    cost: '',
    color: '',
    usageDuration: '',
    dimensions: '',
    hasDamage: false,
    damageDescription: ''
  });

  // Pre-select listingType if query param specifies Sell or Rent
  useEffect(() => {
    if (!isEdit && typeParam && ['Sell', 'Rent'].includes(typeParam)) {
      setFormData((prev) => ({ ...prev, listingType: typeParam }));
    }
  }, [isEdit, typeParam]);

  // Images state (holds existing Cloudinary URLs or newly uploaded ones)
  const [imageUrls, setImageUrls] = useState([]);
  
  // Pending file objects selected by user for upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // UI & Loading States
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // If in edit mode, fetch existing product details
  useEffect(() => {
    if (isEdit && id) {
      let isMounted = true;
      const fetchExistingProduct = async () => {
        setInitialLoading(true);
        setError('');
        try {
          const res = await getProductById(id, token);
          if (isMounted) {
            if (res.success && res.data) {
              const prod = res.data;

              // Check ownership authorization
              const ownerId = prod.ownerId?._id || prod.ownerId;
              if (currentUser && ownerId && ownerId.toString() !== currentUser._id.toString()) {
                setError('Unauthorized: You can only edit your own product listing.');
                setInitialLoading(false);
                return;
              }

              setFormData({
                title: prod.title || '',
                description: prod.description || '',
                category: prod.category || 'Books',
                listingType: prod.listingType || 'Sell',
                cost: prod.cost !== undefined ? prod.cost : '',
                color: prod.color || '',
                usageDuration: prod.usageDuration || '',
                dimensions: prod.dimensions || '',
                hasDamage: Boolean(prod.hasDamage),
                damageDescription: prod.damageDescription || ''
              });

              if (Array.isArray(prod.images)) {
                setImageUrls(prod.images);
              }
            } else {
              setError(res.message || 'Product not found');
            }
          }
        } catch (err) {
          if (isMounted) {
            setError(err.message || 'Failed to load product for editing');
          }
        } finally {
          if (isMounted) {
            setInitialLoading(false);
          }
        }
      };

      fetchExistingProduct();
      return () => {
        isMounted = false;
      };
    }
  }, [id, isEdit, token, currentUser]);

  // Handle Text/Select Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setError('');
  };

  // Handle Multi-Image File Selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Filter valid images under 5MB
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('All selected files must be valid images (JPG, PNG, WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file sizes must be under 5MB each');
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
    if (validationErrors.images) {
      setValidationErrors((prev) => ({ ...prev, images: '' }));
    }
    setError('');
  };

  // Remove existing Cloudinary image URL
  const handleRemoveExistingImage = (indexToRemove) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Remove newly selected file preview
  const handleRemoveNewFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFilePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Form Validation
  const validate = () => {
    const errorsObj = {};

    if (!formData.title.trim()) {
      errorsObj.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errorsObj.description = 'Description is required';
    }

    if (!formData.category) {
      errorsObj.category = 'Category is required';
    }

    if (formData.cost === '' || isNaN(Number(formData.cost)) || Number(formData.cost) < 0) {
      errorsObj.cost = 'Please enter a valid cost (₹0 or greater)';
    }

    const totalImagesCount = imageUrls.length + selectedFiles.length;
    if (totalImagesCount === 0) {
      errorsObj.images = 'At least 1 product image is required';
    }

    if (formData.hasDamage && !formData.damageDescription.trim()) {
      errorsObj.damageDescription = 'Please describe the damage when "Has Damage" is checked';
    }

    setValidationErrors(errorsObj);
    return Object.keys(errorsObj).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setSubmitting(true);
    let uploadedUrls = [...imageUrls];

    // 1. Upload new selected image files to Cloudinary if any
    if (selectedFiles.length > 0) {
      setUploadingImages(true);
      try {
        const uploadPromises = selectedFiles.map((file) => uploadToCloudinary(file));
        const newUploaded = await Promise.all(uploadPromises);
        uploadedUrls = [...uploadedUrls, ...newUploaded];
      } catch (err) {
        setError(err.message || 'Image upload to Cloudinary failed. Please try again.');
        setUploadingImages(false);
        setSubmitting(false);
        return;
      }
      setUploadingImages(false);
    }

    // 2. Build backend payload
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      listingType: formData.listingType,
      cost: Number(formData.cost),
      color: formData.color.trim(),
      usageDuration: formData.usageDuration.trim(),
      dimensions: formData.dimensions.trim(),
      hasDamage: formData.hasDamage,
      damageDescription: formData.hasDamage ? formData.damageDescription.trim() : '',
      images: uploadedUrls
    };

    try {
      let res;
      if (isEdit) {
        res = await updateProduct(id, payload, token);
      } else {
        res = await createProduct(payload, token);
      }

      if (res.success && res.data) {
        const targetId = res.data._id || id;
        if (typeParam || searchParams.get('from') === 'profile') {
          navigate('/profile?tab=activity');
        } else {
          navigate(`/products/${targetId}`);
        }
      } else {
        setError(res.message || 'Failed to save product listing');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting the listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading listing details...</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      
      {/* Navigation Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-xs text-slate-500 font-medium">
          {isEdit ? 'Edit Listing' : 'New Listing'}
        </span>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            {isEdit ? <Edit3 className="w-7 h-7 text-indigo-400" /> : <PlusCircle className="w-7 h-7 text-indigo-400" />}
            <span>{isEdit ? 'Edit Product Listing' : 'List an Item for Sale or Rent'}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Fill in the details below to share your item with your campus community.
          </p>
        </div>

        {/* Global Server Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. HC Verma Concepts of Physics Vol 1 & 2"
              className={`w-full bg-slate-800/90 border ${
                validationErrors.title ? 'border-red-500' : 'border-slate-700'
              } rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
            />
            {validationErrors.title && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.title}</p>
            )}
          </div>

          {/* Listing Type Toggle (Sell / Rent) & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Listing Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Listing Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-800 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, listingType: 'Sell' }))}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    formData.listingType === 'Sell'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sell Item
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, listingType: 'Rent' }))}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    formData.listingType === 'Rent'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Rent Item
                </button>
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.category}</p>
              )}
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Cost (₹) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                name="cost"
                min="0"
                value={formData.cost}
                onChange={handleChange}
                placeholder="e.g. 450"
                className={`w-full bg-slate-800/90 border ${
                  validationErrors.cost ? 'border-red-500' : 'border-slate-700'
                } rounded-xl py-3 pl-9 pr-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
              />
            </div>
            {validationErrors.cost && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.cost}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe condition, edition, reason for selling/renting, included accessories..."
              className={`w-full bg-slate-800/90 border ${
                validationErrors.description ? 'border-red-500' : 'border-slate-700'
              } rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
            />
            {validationErrors.description && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.description}</p>
            )}
          </div>

          {/* Multi Image Upload Section */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Product Images (Min 1 required) <span className="text-red-400">*</span>
            </label>

            {/* Image Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {/* Existing Cloudinary Images */}
              {imageUrls.map((url, index) => (
                <div key={`existing-${index}`} className="relative aspect-square bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group">
                  <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(index)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-600 transition"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-950/80 text-[10px] text-slate-300 rounded font-mono">
                    Saved
                  </span>
                </div>
              ))}

              {/* Newly Selected File Previews */}
              {filePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative aspect-square bg-slate-800 rounded-xl overflow-hidden border border-indigo-500/50 group">
                  <img src={preview} alt={`New upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(index)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-600 transition"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-indigo-600/90 text-[10px] text-white rounded font-mono">
                    New
                  </span>
                </div>
              ))}

              {/* File Select Upload Trigger Button */}
              <label className="aspect-square bg-slate-800/60 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-300 cursor-pointer transition p-2 text-center">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-semibold">Add Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {validationErrors.images && (
              <p className="text-xs text-red-400 mt-1">{validationErrors.images}</p>
            )}
          </div>

          {/* Optional Specs (Color, Usage Duration, Dimensions) */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Additional Specifications (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g. Black / Matte Blue"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Usage Duration</label>
                <input
                  type="text"
                  name="usageDuration"
                  value={formData.usageDuration}
                  onChange={handleChange}
                  placeholder="e.g. 6 months / 2 years"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dimensions</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g. 30x20x10 cm"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Condition & Damage Details */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasDamage"
                checked={formData.hasDamage}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-200">
                This item has visible wear, scratch, or defect
              </span>
            </label>

            {/* Conditionally show damage description textarea */}
            {formData.hasDamage && (
              <div className="pl-7 space-y-1">
                <label className="block text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1">
                  Describe Damage / Wear <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="damageDescription"
                  rows="2"
                  value={formData.damageDescription}
                  onChange={handleChange}
                  placeholder="Describe the flaw or wear (e.g. minor scratch on rear frame, light highlights on page 20)..."
                  className={`w-full bg-slate-800/90 border ${
                    validationErrors.damageDescription ? 'border-red-500' : 'border-rose-500/40'
                  } rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition`}
                />
                {validationErrors.damageDescription && (
                  <p className="text-xs text-red-400">{validationErrors.damageDescription}</p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || uploadingImages}
              className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting || uploadingImages ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>{uploadingImages ? 'Uploading Images to Cloudinary...' : 'Saving Listing...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isEdit ? 'Update Listing' : 'Publish Listing'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default ProductForm;
