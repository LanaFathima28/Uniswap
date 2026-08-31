import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateCollegeEmail, COLLEGE_EMAIL_DOMAIN } from '../services/authService';
import { UserCheck, ShieldAlert, GraduationCap, Briefcase, Mail, Lock, User, Building, BookOpen, Calendar, Award } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student',
    branch: '',
    year: '',
    company: '',
    designation: ''
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for edited field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = `Invalid email structure. Must include a domain like .com or .edu (e.g. rahul.${COLLEGE_EMAIL_DOMAIN}@gmail.com or student@${COLLEGE_EMAIL_DOMAIN}.edu)`;
    } else if (!validateCollegeEmail(formData.email)) {
      newErrors.email = `Email must contain "${COLLEGE_EMAIL_DOMAIN}" (e.g. rahul.${COLLEGE_EMAIL_DOMAIN}@gmail.com or student@${COLLEGE_EMAIL_DOMAIN}.edu)`;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (formData.role === 'Student') {
      if (!formData.branch.trim()) {
        newErrors.branch = 'Branch is required for students';
      }
      if (!formData.year.trim()) {
        newErrors.year = 'Graduation/Current year is required for students';
      }
    } else if (formData.role === 'Alumni') {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const cleanData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim()
      };
      await signup(cleanData);
      navigate('/profile');
    } catch (err) {
      if (err.message && err.message.includes('auth/invalid-email')) {
        setServerError('Invalid email format! Ensure your email ends with a domain like .com or .edu (e.g. rahul.collegename@gmail.com)');
      } else if (err.message && err.message.includes('auth/api-key-not-valid')) {
        setServerError('Firebase Web API Key is missing or invalid! Please copy your Web API Key from Firebase Console -> Project Settings -> General, and paste it into frontend/.env as VITE_FIREBASE_API_KEY.');
      } else if (err.message && (err.message.toLowerCase().includes('network error') || err.message.includes('ERR_CONNECTION_REFUSED'))) {
        setServerError('Network Error: Cannot connect to the backend server at http://localhost:5000. Please ensure the backend server is running.');
      } else {
        setServerError(err.message || 'Registration failed. Please check your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl shadow-indigo-950/40">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600/20 text-indigo-400 mb-4 border border-indigo-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Join <span className="text-indigo-400">CampusConnect</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Exclusive Marketplace & Network for College Students & Alumni
          </p>
        </div>

        {/* Global Server Error Notice */}
        {serverError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                className={`w-full bg-slate-800/90 border ${errors.name ? 'border-red-500' : 'border-slate-700'} rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* College Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              College Email (Must include {COLLEGE_EMAIL_DOMAIN})
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={`rahul.${COLLEGE_EMAIL_DOMAIN}@gmail.com`}
                className={`w-full bg-slate-800/90 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password (Min 6 chars)
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full bg-slate-800/90 border ${errors.password ? 'border-red-500' : 'border-slate-700'} rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: 'Student' }))}
                className={`py-2.5 px-4 rounded-xl font-medium text-sm border flex items-center justify-center gap-2 transition ${
                  formData.role === 'Student'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: 'Alumni' }))}
                className={`py-2.5 px-4 rounded-xl font-medium text-sm border flex items-center justify-center gap-2 transition ${
                  formData.role === 'Alumni'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Alumni
              </button>
            </div>
          </div>

          {/* Conditional Fields: Student */}
          {formData.role === 'Student' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Branch
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    placeholder="CSE / ECE / Mech"
                    className={`w-full bg-slate-800/90 border ${errors.branch ? 'border-red-500' : 'border-slate-700'} rounded-xl py-2.5 pl-9 pr-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                  />
                </div>
                {errors.branch && <p className="mt-1 text-xs text-red-400">{errors.branch}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Year
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="3rd Year / 2025"
                    className={`w-full bg-slate-800/90 border ${errors.year ? 'border-red-500' : 'border-slate-700'} rounded-xl py-2.5 pl-9 pr-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                  />
                </div>
                {errors.year && <p className="mt-1 text-xs text-red-400">{errors.year}</p>}
              </div>
            </div>
          )}

          {/* Conditional Fields: Alumni */}
          {formData.role === 'Alumni' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Company
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Google / TCS / Startup"
                    className={`w-full bg-slate-800/90 border ${errors.company ? 'border-red-500' : 'border-slate-700'} rounded-xl py-2.5 pl-9 pr-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                  />
                </div>
                {errors.company && <p className="mt-1 text-xs text-red-400">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Designation
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="SDE-2 / Product Lead"
                    className={`w-full bg-slate-800/90 border ${errors.designation ? 'border-red-500' : 'border-slate-700'} rounded-xl py-2.5 pl-9 pr-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                  />
                </div>
                {errors.designation && <p className="mt-1 text-xs text-red-400">{errors.designation}</p>}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition underline underline-offset-4">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;
