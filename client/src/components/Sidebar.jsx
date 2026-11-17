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

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin DB Viewer', path: '/admin', icon: Shield, badge: 'Admin' });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-navy truncate">{user?.name}</p>
              <p className="text-[11px] text-muted truncate font-mono">{user?.registration_number || user?.email}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-muted flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" /> Karma
            </span>
            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
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
                    : 'text-slate-600 hover:text-navy hover:bg-slate-100/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-100 text-purple-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* AI Assistance Badge */}
      <div className="p-3.5 rounded-2xl bg-primary-light/50 border border-primary/10 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-navy">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Campus AI Matching</span>
        </div>
        <p className="text-[11px] text-muted mt-1 leading-relaxed">
          CLIP multi-modal neural matching runs locally for zero-latency item recovery.
        </p>
      </div>
    </aside>
  );
}
