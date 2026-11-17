import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Layers,
  User,
} from 'lucide-react';

export default function BottomNav() {
  const { user } = useAuth();

  const links = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse', path: '/browse', icon: Search },
    { name: 'Report', path: '/report', icon: PlusCircle, highlight: true },
    { name: 'Reports', path: '/my-reports', icon: Layers },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition ${
              isActive
                ? 'text-primary'
                : 'text-slate-500 hover:text-navy'
            }`
          }
        >
          {link.highlight ? (
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center -mt-3 shadow-md">
              <link.icon className="w-4 h-4" />
            </div>
          ) : (
            <link.icon className="w-4 h-4" />
          )}
          <span>{link.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}
