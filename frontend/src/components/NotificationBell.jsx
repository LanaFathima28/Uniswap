import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';
import { Bell, CheckCheck, Heart, CheckCircle2, XCircle, Star, Sparkles } from 'lucide-react';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch notifications helper
  const fetchUserNotifications = async (silent = false) => {
    if (!token || !currentUser) return;
    if (!silent) setLoading(true);
    try {
      const res = await getNotifications(token);
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Poll notifications every 15 seconds
  useEffect(() => {
    fetchUserNotifications(false);

    const intervalId = setInterval(() => {
      fetchUserNotifications(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [token, currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification read & handle click navigation
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif._id, token);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }

    setIsOpen(false);

    // Navigation logic based on notification type
    if (notif.type === 'Interest' || notif.type === 'RatingReceived') {
      navigate('/requests');
    } else if (notif.relatedTransactionId?.productId?._id) {
      navigate(`/products/${notif.relatedTransactionId.productId._id}`);
    } else if (notif.relatedTransactionId?.productId) {
      navigate(`/products/${notif.relatedTransactionId.productId}`);
    } else {
      navigate('/requests');
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  // Format relative time (e.g. 5m ago, 2h ago)
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Render Type Icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Interest':
        return <Heart className="w-4 h-4 text-emerald-400" />;
      case 'Accepted':
        return <CheckCircle2 className="w-4 h-4 text-indigo-400" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'RatingReceived':
        return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition focus:outline-none flex items-center justify-center"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full border-2 border-slate-950 animate-pulse shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <p className="text-sm font-semibold text-slate-300">No notifications yet</p>
                <p className="text-xs text-slate-500">You'll see activity updates here when peers express interest or respond.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                    !notif.isRead
                      ? 'bg-indigo-950/30 hover:bg-indigo-950/50 border-l-2 border-indigo-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;
