import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  PlusCircle,
  Bell,
  Award,
  User,
  LogOut,
  Shield,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import NotificationModal from './NotificationModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  async function fetchUnreadCount() {
    try {
      const res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy to-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-navy text-lg tracking-tight">VIT</span>
                <span className="font-semibold text-primary text-lg">Lost &amp; Found</span>
              </div>
              <p className="text-[10px] text-muted -mt-1 font-medium tracking-wide">Campus AI Recovery</p>
            </div>
          </Link>

          {/* Quick Search in Nav (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
            <div
              onClick={() => navigate('/browse')}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-muted text-xs hover:border-primary/40 hover:bg-white cursor-pointer transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search campus items...</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Karma Badge */}
            <div
              title="Your Campus Karma Points"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{user?.karma_points || 0}</span>
              <span className="text-[10px] font-normal text-emerald-600">Karma</span>
            </div>

            {/* Report CTA */}
            <Link
              to="/report"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Report Item</span>
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-navy hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-navy font-bold text-xs flex items-center justify-center border border-slate-300">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-navy leading-tight">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-muted leading-tight uppercase font-mono">{user?.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:block" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-hover border border-slate-100 py-2 z-50 animate-fadeIn"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-navy truncate">{user?.name}</p>
                    <p className="text-[11px] text-muted truncate">{user?.email}</p>
                    {user?.role === 'admin' && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                        Admin Mode
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile &amp; Settings</span>
                  </Link>

                  <Link
                    to="/my-reports"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>My Reports</span>
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-purple-700 font-semibold hover:bg-purple-50 transition"
                    >
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Admin Database Viewer</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-danger hover:bg-red-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onRefreshCount={fetchUnreadCount}
      />
    </>
  );
}
