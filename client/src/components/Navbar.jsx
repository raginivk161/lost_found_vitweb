import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
  Sun,
  Moon,
} from 'lucide-react';
import NotificationModal from './NotificationModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy to-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-navy dark:text-white text-lg tracking-tight">VIT</span>
                <span className="font-semibold text-primary dark:text-blue-400 text-lg">Lost &amp; Found</span>
              </div>
              <p className="text-[10px] text-muted dark:text-slate-400 -mt-1 font-medium tracking-wide">Campus AI Recovery</p>
            </div>
          </Link>

          {/* Quick Search in Nav (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
            <div
              onClick={() => navigate('/browse')}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-muted dark:text-slate-400 text-xs hover:border-primary/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search campus items...</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Karma Badge */}
            <div
              title="Your Campus Karma Points"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{user?.karma_points || 0}</span>
              <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">Karma</span>
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
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-navy dark:text-white font-bold text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-navy dark:text-white leading-tight">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-muted dark:text-slate-400 leading-tight uppercase font-mono">{user?.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted dark:text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-hover border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fadeIn"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-navy dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-muted dark:text-slate-400 truncate">{user?.email}</p>
                    {user?.role === 'admin' && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                        Admin Mode
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile &amp; Settings</span>
                  </Link>

                  <Link
                    to="/my-reports"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>My Reports</span>
                  </Link>

                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-purple-700 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
                  >
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Admin Database Viewer</span>
                  </Link>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-danger hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left"
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
