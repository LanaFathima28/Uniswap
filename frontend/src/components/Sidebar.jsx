import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, User, Users, LogOut, GraduationCap, Inbox, MessageSquare } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Requests', path: '/requests', icon: Inbox },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Connect', path: '/connect', icon: Users }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40">
      <div>
        {/* Logo / Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/home" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight hover:opacity-90 transition">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Campus<span className="text-indigo-400">Connect</span></span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/profile' && location.pathname.startsWith('/profile'));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Bottom Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {currentUser && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-800">
            {currentUser.profilePhotoUrl ? (
              <img
                src={currentUser.profilePhotoUrl}
                alt={currentUser.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                className="w-8 h-8 rounded-full object-cover border border-indigo-500/40 shrink-0"
              />
            ) : null}
            <div
              style={{ display: currentUser.profilePhotoUrl ? 'none' : 'flex' }}
              className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 items-center justify-center font-bold text-xs shrink-0"
            >
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div className="truncate text-xs">
              <p className="font-semibold text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-slate-400 uppercase tracking-wider font-mono text-[10px]">{currentUser.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 hover:border-red-500/40 transition flex items-center justify-center gap-2"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
