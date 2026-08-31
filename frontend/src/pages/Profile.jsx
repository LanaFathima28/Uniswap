import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import { updateUserProfile, getUserActivity, uploadToCloudinary } from '../services/userService';
import { 
  User, 
  Upload, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  PackageCheck, 
  TrendingUp, 
  Edit3, 
  Activity as ActivityIcon,
  Sparkles,
  Calendar,
  IndianRupee,
  Package,
  X,
  Plus
} from 'lucide-react';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, token, updateCurrentUser } = useAuth();

  // Determine if viewing own profile
  const targetUserId = userId || (currentUser ? currentUser._id : null);
  const isOwnProfile = Boolean(currentUser && targetUserId === currentUser._id);

  // Toggle Edit Form Visibility (Pencil Icon control)
  const [showEditForm, setShowEditForm] = useState(false);

  // Active Tab for own profile ('overview' | 'activity')
  const defaultTab = searchParams.get('tab') === 'activity' ? 'activity' : 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    year: '',
    company: '',
    designation: '',
    profilePhotoUrl: ''
  });

  // Photo Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Status & Validation States
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // Activity Log State
  const [activity, setActivity] = useState({ listed: [], bought: [], sold: [] });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  // Populate form with currentUser data
  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setFormData({
        name: currentUser.name || '',
        branch: currentUser.branch || '',
        year: currentUser.year || '',
        company: currentUser.company || '',
        designation: currentUser.designation || '',
        profilePhotoUrl: currentUser.profilePhotoUrl || ''
      });
      setPreviewUrl(currentUser.profilePhotoUrl || '');
    }
  }, [isOwnProfile, currentUser]);

  // Fetch Activity Log when 'activity' tab is selected
  useEffect(() => {
    if (isOwnProfile && activeTab === 'activity' && currentUser) {
      let isMounted = true;
      const fetchActivity = async () => {
        setActivityLoading(true);
        setActivityError('');
        try {
          const res = await getUserActivity(currentUser._id, token);
          if (isMounted) {
            if (res.success && res.data) {
              setActivity({
                listed: res.data.listed || [],
                bought: res.data.bought || [],
                sold: res.data.sold || []
              });
            } else {
              setActivityError(res.message || 'Failed to load activity log');
            }
          }
        } catch (err) {
          if (isMounted) {
            setActivityError(err.message || 'Error loading activity log');
          }
        } finally {
          if (isMounted) {
            setActivityLoading(false);
          }
        }
      };

      fetchActivity();
      return () => {
        isMounted = false;
      };
    }
  }, [isOwnProfile, activeTab, currentUser, token]);

  // Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
    setSuccessMessage('');
  };

  // Handle Photo Selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setServerError('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setServerError('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setServerError('');
    setSuccessMessage('');
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (currentUser?.role === 'Student') {
      if (!formData.branch.trim()) {
        newErrors.branch = 'Branch is required for students';
      }
      if (!formData.year.trim()) {
        newErrors.year = 'Graduation/Current year is required for students';
      }
    } else if (currentUser?.role === 'Alumni') {
      if (!formData.company.trim()) {
        newErrors.company = 'Company name is required for alumni';
      }
      if (!formData.designation.trim()) {
        newErrors.designation = 'Current designation is required for alumni';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit & Profile Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setSaving(true);
    let finalPhotoUrl = formData.profilePhotoUrl;

    // 1. Upload photo to Cloudinary if a new file was selected
    if (selectedFile) {
      setUploadingPhoto(true);
      try {
        finalPhotoUrl = await uploadToCloudinary(selectedFile);
        setFormData((prev) => ({ ...prev, profilePhotoUrl: finalPhotoUrl }));
      } catch (err) {
        setServerError(err.message || 'Photo upload failed. Please check Cloudinary configuration.');
        setUploadingPhoto(false);
        setSaving(false);
        return;
      }
      setUploadingPhoto(false);
    }

    // 2. Submit PATCH update to backend
    try {
      const updatePayload = {
        name: formData.name.trim(),
        profilePhotoUrl: finalPhotoUrl,
        ...(currentUser?.role === 'Student'
          ? { branch: formData.branch.trim(), year: formData.year.trim() }
          : { company: formData.company.trim(), designation: formData.designation.trim() })
      };

      const res = await updateUserProfile(currentUser._id, updatePayload, token);

      if (res.success && res.data) {
        setSuccessMessage('Profile updated successfully!');
        setSelectedFile(null);
        setShowEditForm(false);
        if (updateCurrentUser) {
          updateCurrentUser(res.data);
        }
      } else {
        setServerError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setServerError(err.message || 'An error occurred while saving changes');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW MODE 1: Viewing another user's profile
  // -------------------------------------------------------------
  if (!isOwnProfile) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition uppercase tracking-wider flex items-center gap-1.5"
          >
            ← Back
          </button>
          <span className="text-xs text-slate-400 font-medium">Public User Profile</span>
        </div>

        {/* Standalone Reusable Profile Card (Fresh fetch via GET /api/users/:id) */}
        <ProfileCard userId={targetUserId} />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW MODE 2: Viewing Own Profile (Overview/Edit + Activity)
  // -------------------------------------------------------------
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Member Profile
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">My Profile & Account</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your public information and view your activity log.</p>
          </div>

          {/* Edit Toggle Pencil Button for Profile Owner */}
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            title="Edit Profile Information"
          >
            {showEditForm ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{showEditForm ? 'Close Edit' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Profile Overview
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'activity'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ActivityIcon className="w-4 h-4" />
          My Activity
        </button>
      </div>

      {/* Feedback Banners */}
      {serverError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Public Profile Card View */}
          <div className="md:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Profile Card</h2>
              {/* Pencil Edit Icon Button */}
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 transition"
                title="Edit Bio / Photo"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <ProfileCard userId={currentUser._id} />
          </div>

          {/* Collapsible / Togglable Edit Form */}
          <div className="md:col-span-2">
            {showEditForm ? (
              <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-400" />
                    Edit Profile Details
                  </h2>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-slate-400 hover:text-slate-200 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  
                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Profile Photo (Cloudinary Upload)
                    </label>
                    <div className="flex items-center gap-4">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <label className="cursor-pointer py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition flex items-center gap-2">
                        <Upload className="w-4 h-4 text-indigo-400" />
                        <span>{selectedFile ? selectedFile.name : 'Choose New Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full bg-slate-800/90 border ${
                        errors.name ? 'border-red-500' : 'border-slate-700'
                      } rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>

                  {/* Role Specific Fields */}
                  {currentUser?.role === 'Student' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Branch
                        </label>
                        <input
                          type="text"
                          name="branch"
                          value={formData.branch}
                          onChange={handleChange}
                          placeholder="CSE / ECE / Mech"
                          className={`w-full bg-slate-800/90 border ${
                            errors.branch ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                        />
                        {errors.branch && <p className="mt-1 text-xs text-red-400">{errors.branch}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Graduation / Current Year
                        </label>
                        <input
                          type="text"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          placeholder="3rd Year / 2025"
                          className={`w-full bg-slate-800/90 border ${
                            errors.year ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                        />
                        {errors.year && <p className="mt-1 text-xs text-red-400">{errors.year}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Google / TCS / Startup"
                          className={`w-full bg-slate-800/90 border ${
                            errors.company ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                        />
                        {errors.company && <p className="mt-1 text-xs text-red-400">{errors.company}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Designation
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          placeholder="SDE-2 / Product Lead"
                          className={`w-full bg-slate-800/90 border ${
                            errors.designation ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                        />
                        {errors.designation && <p className="mt-1 text-xs text-red-400">{errors.designation}</p>}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={saving || uploadingPhoto}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving || uploadingPhoto ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>{uploadingPhoto ? 'Uploading Photo...' : 'Saving Changes...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                <p className="text-sm text-slate-300 font-medium">Your profile information is currently up to date.</p>
                <p className="text-xs text-slate-500">Click the "Edit Profile" button above or the pencil icon to update your bio or photo.</p>
                <button
                  onClick={() => setShowEditForm(true)}
                  className="mt-2 py-2 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Open Edit Form</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVITY LOG TAB */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {activityLoading ? (
            <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading your activity log...</p>
            </div>
          ) : activityError ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{activityError}</span>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* 1. Listed Items Section */}
              <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    <span>Items I've Listed</span>
                    <span className="text-xs px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 font-mono">
                      {activity.listed.length}
                    </span>
                  </h3>

                  {/* Quick-list Shortcut Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/products/new?type=Sell')}
                      className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition"
                      title="Quick List Item to Sell"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Sell an item</span>
                    </button>

                    <button
                      onClick={() => navigate('/products/new?type=Rent')}
                      className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
                      title="Quick List Item to Rent"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Rent out an item</span>
                    </button>
                  </div>
                </div>
                {activity.listed.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                    <p className="text-sm text-slate-500">No items listed yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activity.listed.map((item) => (
                      <ActivityCard key={item.transactionId} item={item} />
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Bought / Rented Items Section */}
              <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-400" />
                  Items I've Bought / Rented
                  <span className="ml-auto text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 font-mono">
                    {activity.bought.length}
                  </span>
                </h3>
                {activity.bought.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                    <p className="text-sm text-slate-500">No completed purchases or rentals yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activity.bought.map((item) => (
                      <ActivityCard key={item.transactionId} item={item} />
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Sold / Rented Out Items Section */}
              <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Items I've Sold / Rented Out
                  <span className="ml-auto text-xs px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-mono">
                    {activity.sold.length}
                  </span>
                </h3>
                {activity.sold.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                    <p className="text-sm text-slate-500">No completed sales or rentals out yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activity.sold.map((item) => (
                      <ActivityCard key={item.transactionId} item={item} />
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};

/**
 * Detailed Activity Item Card Component
 */
const ActivityCard = ({ item }) => {
  const { productTitle, productImage, cost, type, date } = item;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent';

  // Badge Styling based on type
  const getTypeBadge = (t) => {
    switch (t) {
      case 'Bought':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Sold':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Rented':
      case 'Rented Out':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3.5 hover:border-slate-600 transition shadow-sm">
      {/* Product Thumbnail */}
      {productImage ? (
        <img
          src={productImage}
          alt={productTitle}
          className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
          <Package className="w-6 h-6" />
        </div>
      )}

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-slate-100 text-sm truncate">{productTitle}</h4>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border shrink-0 ${getTypeBadge(type)}`}>
            {type}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-200 flex items-center gap-0.5">
            <IndianRupee className="w-3 h-3 text-indigo-400" />
            {cost}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
