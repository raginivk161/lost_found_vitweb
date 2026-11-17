import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Layers,
  User,
  Shield,
  Database,
  Award,
  Sparkles,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Items', path: '/browse', icon: Search },
    { name: 'Report Item', path: '/report', icon: PlusCircle },
    { name: 'My Reports', path: '/my-reports', icon: Layers },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  // Strictly restricted to Admin accounts only — never visible in student login
  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin DB Viewer', path: '/admin', icon: Shield, badge: 'Admin' });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 justify-between transition-colors">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-navy dark:text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-muted dark:text-slate-400 truncate font-mono">{user?.registration_number || user?.email}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-muted dark:text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Karma
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full text-[11px]">
              {user?.karma_points || 0} pts
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* AI Assistance Badge */}
      <div className="p-3.5 rounded-2xl bg-primary-light/50 dark:bg-slate-800/60 border border-primary/10 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-navy dark:text-white">
          <Sparkles className="w-4 h-4 text-primary dark:text-blue-400" />
          <span>Campus AI Matching</span>
        </div>
        <p className="text-[11px] text-muted dark:text-slate-400 mt-1 leading-relaxed">
          CLIP multi-modal neural matching runs locally for zero-latency item recovery.
        </p>
      </div>
    </aside>
  );
}
