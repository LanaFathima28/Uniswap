import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserById } from '../services/userService';
import { getUserRatings } from '../services/ratingService';
import { User, GraduationCap, Briefcase, Mail, Calendar, ShieldCheck, AlertCircle, Star } from 'lucide-react';

const ProfileCard = ({ userId }) => {
  const { currentUser, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [ratingInfo, setRatingInfo] = useState({ averageRating: 0, totalRatings: 0 });
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sync profile with currentUser if viewing own profile
  useEffect(() => {
    if (currentUser && currentUser._id && userId && currentUser._id.toString() === userId.toString()) {
      setProfile(currentUser);
      setImageError(false);
      setLoading(false);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    let isMounted = true;
    const fetchProfileAndRatings = async () => {
      if (!userId) {
        if (isMounted) {
          setError('User ID is required');
          setLoading(false);
        }
        return;
      }

      // If viewing own profile and currentUser is loaded, skip fetch to avoid latency
      if (currentUser && currentUser._id && currentUser._id.toString() === userId.toString()) {
        if (isMounted) {
          setProfile(currentUser);
          setLoading(false);
        }
      } else {
        setLoading(true);
        setError('');
        setImageError(false);
        try {
          const res = await getUserById(userId, token);
          if (isMounted) {
            if (res.success && res.data) {
              setProfile(res.data);
            } else {
              setError(res.message || 'User profile not found');
            }
          }
        } catch (err) {
          if (isMounted) {
            setError(err.message || 'Failed to load profile data');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }

      // Fetch Seller Ratings
      try {
        const ratingRes = await getUserRatings(userId, token);
        if (isMounted && ratingRes.success && ratingRes.data) {
          setRatingInfo({
            averageRating: ratingRes.data.averageRating || 0,
            totalRatings: ratingRes.data.totalRatings || 0
          });
        }
      } catch (err) {
        // Ignore non-critical rating errors
      }
    };

    fetchProfileAndRatings();
    return () => {
      isMounted = false;
    };
  }, [userId, token, currentUser]);

  if (loading && !profile) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-auto text-center">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-auto">
        <div className="flex items-center gap-3 text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error || 'Profile unavailable'}</span>
        </div>
      </div>
    );
  }

  // Use currentUser properties if available for own profile
  const activeUser = (currentUser && currentUser._id && userId && currentUser._id.toString() === userId.toString()) 
    ? currentUser 
    : profile;

  const { name, email, role, branch, year, company, designation, profilePhotoUrl, createdAt } = activeUser;

  // Format creation date
  const joinedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // Initials for avatar fallback
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-indigo-950/30 max-w-md w-full mx-auto relative overflow-hidden">
      {/* Top Banner accent */}
      <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 absolute top-0 left-0" />

      {/* Header section */}
      <div className="flex flex-col items-center text-center mt-2">
        {/* Avatar */}
        <div className="relative mb-4">
          {profilePhotoUrl && !imageError ? (
            <img
              key={profilePhotoUrl}
              src={profilePhotoUrl}
              alt={name}
              onError={() => setImageError(true)}
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-600/30 shadow-lg shadow-indigo-600/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-500/30 shadow-lg shadow-indigo-600/20">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0 right-0 p-1.5 bg-slate-950 rounded-full border border-slate-800 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>

        {/* Name & Role Badge */}
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{name}</h3>
        
        <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              role === 'Student'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {role === 'Student' ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
            {role}
          </span>

          {/* Seller Rating Badge */}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Star className="w-3.5 h-3.5 fill-amber-300" />
            <span>{ratingInfo.averageRating > 0 ? ratingInfo.averageRating.toFixed(1) : 'New'}</span>
            {ratingInfo.totalRatings > 0 && <span className="text-[10px] text-amber-200/80 font-normal">({ratingInfo.totalRatings})</span>}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-6 space-y-3 pt-6 border-t border-slate-800 text-sm">
        {/* Role specific info */}
        {role === 'Student' ? (
          <>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Branch</span>
              <span className="font-medium text-slate-200">{branch || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Graduation Year</span>
              <span className="font-medium text-slate-200">{year || 'N/A'}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Company</span>
              <span className="font-medium text-slate-200">{company || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Designation</span>
              <span className="font-medium text-slate-200">{designation || 'N/A'}</span>
            </div>
          </>
        )}

        {/* Email */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
          <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate text-xs font-mono">{email}</span>
        </div>

        {/* Joined Date */}
        {joinedDate && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Campus Member since {joinedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
