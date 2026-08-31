import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User, Shield } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/home" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight hover:opacity-90 transition">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span>Campus<span className="text-indigo-400">Connect</span></span>
        </Link>

        {/* User Info & Logout Button */}
        {currentUser && (
          <div className="flex items-center gap-4">
            
            {/* User Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-medium text-slate-200">{currentUser.name}</span>
              <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider ${
                currentUser.role === 'Student'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {currentUser.role}
              </span>
            </div>

            {/* Profile Navigation Button */}
            <Link
              to="/profile"
              className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 text-xs font-semibold rounded-xl border border-indigo-500/30 transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="py-2 px-3.5 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 hover:border-red-500/40 transition flex items-center gap-2"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

export default Navbar;
