import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  AlertCircle,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  TrendingUp,
  Inbox,
  Award,
  Shield,
  HelpCircle,
} from 'lucide-react';
import MatchCard from '../components/MatchCard';
import ItemCard from '../components/ItemCard';
import ActiveReportLifecycle from '../components/ActiveReportLifecycle';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    my_open_lost: 0,
    my_open_found: 0,
    matches_waiting: 0,
    items_returned: 0,
  });

  const [matches, setMatches] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [lifecycleItems, setLifecycleItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // 1. Dashboard counts
      const statsRes = await fetch('/api/items/stats/dashboard', { credentials: 'include' });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Active Lifecycle reports
      const lifecycleRes = await fetch('/api/items/active-lifecycle', { credentials: 'include' });
      if (lifecycleRes.ok) {
        const lifecycleData = await lifecycleRes.json();
        setLifecycleItems(lifecycleData.items || []);
      }

      // 3. AI Matches for current user
      const matchesRes = await fetch('/api/matches', { credentials: 'include' });
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches || []);
      }

      // 4. Recent campus items
      const itemsRes = await fetch('/api/items?limit=4', { credentials: 'include' });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setRecentItems(itemsData.items || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-primary rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>VIT Campus AI Recovery System</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name?.split(' ')[0] || 'VITian'} 👋
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
            Report missing belongings or turn in items you found on campus. Our neural CLIP model constantly pairs reports in the background.
          </p>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/report?type=lost"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </Link>

            <Link
              to="/report?type=found"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Report Found Item</span>
            </Link>

            <Link
              to="/browse"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition flex items-center gap-2 border border-white/10"
            >
              <Search className="w-4 h-4" />
              <span>Search Campus Items</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* Active Report Lifecycle Progress Bar */}
      {lifecycleItems.length > 0 && (
        <ActiveReportLifecycle items={lifecycleItems} />
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Lost */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-muted dark:text-slate-400 text-xs">
            <span>My Open Lost</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-navy dark:text-white">{stats.my_open_lost}</span>
            <span className="text-[11px] text-muted dark:text-slate-400">items</span>
          </div>
        </div>

        {/* Open Found */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-muted dark:text-slate-400 text-xs">
            <span>My Open Found</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-navy dark:text-white">{stats.my_open_found}</span>
            <span className="text-[11px] text-muted dark:text-slate-400">items</span>
          </div>
        </div>

        {/* Matches Waiting */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-muted dark:text-slate-400 text-xs">
            <span>Matches Waiting</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-blue-950/60 text-primary dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-navy dark:text-white">{stats.matches_waiting}</span>
            <span className="text-[11px] text-primary dark:text-blue-400 font-semibold">needs review</span>
          </div>
        </div>

        {/* Items Returned */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-muted dark:text-slate-400 text-xs">
            <span>Items Returned</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-navy dark:text-white">{stats.items_returned}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">resolved</span>
          </div>
        </div>
      </div>

      {/* AI Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-blue-950/60 text-primary dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy dark:text-white">AI Matches For You</h2>
              <p className="text-xs text-muted dark:text-slate-400">Automatic multi-modal matches involving your reports</p>
            </div>
          </div>

          {matches.length > 0 && (
            <Link
              to="/my-reports?tab=matches"
              className="text-xs font-semibold text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 flex items-center gap-1"
            >
              <span>View all ({matches.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-muted dark:text-slate-400 text-xs animate-pulse">
            Checking neural matches...
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center shadow-soft">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-navy dark:text-white text-sm">No Pending Matches Right Now</h3>
            <p className="text-xs text-muted dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              When someone reports finding an item that corresponds with your lost reports (or vice versa), our local CLIP AI engine will flag it here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.slice(0, 4).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Campus Activity */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy dark:text-white">Recent Campus Reports</h2>
              <p className="text-xs text-muted dark:text-slate-400">Latest lost and found notices posted across VIT blocks</p>
            </div>
          </div>

          <Link
            to="/browse"
            className="text-xs font-semibold text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 flex items-center gap-1"
          >
            <span>Browse all items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center shadow-soft">
            <p className="text-xs text-muted dark:text-slate-400">No items reported yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
