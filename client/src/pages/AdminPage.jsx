import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  Database,
  Users,
  Layers,
  Image,
  Sparkles,
  CheckCircle2,
  Key,
  RefreshCw,
  Search,
  ExternalLink,
  Bell,
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('items');

  const [stats, setStats] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTable(activeTab);
  }, [activeTab]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTable(endpoint) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${endpoint}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTableData(data[endpoint] || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredData = tableData.filter((row) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(row).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Live SQLite Inspector • Demo Mode</span>
          </div>
          <h1 className="text-2xl font-black text-navy dark:text-slate-100 tracking-tight">Database Viewer &amp; Audit Logs</h1>
          <p className="text-xs text-muted dark:text-slate-400 mt-1">
            Real-time read-only inspection of SQLite database records for presentation demos.
          </p>
        </div>

        <button
          onClick={() => { fetchStats(); fetchTable(activeTab); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-navy dark:text-slate-200 text-xs font-semibold transition self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <p className="text-xs text-muted dark:text-slate-400 font-medium">Total Registered Users</p>
          <p className="text-2xl font-black text-navy dark:text-slate-100 mt-1">{stats?.total_users || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <p className="text-xs text-muted dark:text-slate-400 font-medium">Total Reported Items</p>
          <p className="text-2xl font-black text-navy dark:text-slate-100 mt-1">{stats?.total_items || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <p className="text-xs text-muted dark:text-slate-400 font-medium">AI Matches Formed</p>
          <p className="text-2xl font-black text-primary dark:text-blue-400 mt-1">{stats?.total_matches || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <p className="text-xs text-muted dark:text-slate-400 font-medium">Completed Returns</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.total_returned || 0}</p>
        </div>
      </div>

      {/* Table Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'items', label: 'Items Table', icon: Layers },
              { id: 'matches', label: 'Matches Table', icon: Sparkles },
              { id: 'users', label: 'Users Table', icon: Users },
              { id: 'verifications', label: 'Verifications', icon: CheckCircle2 },
              { id: 'handovers', label: 'Handovers', icon: Key },
              { id: 'images', label: 'Image Storage', icon: Image },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setSearch(''); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter row values..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Table Render */}
        <div className="overflow-x-auto max-h-[500px]">
          {loading ? (
            <div className="py-16 text-center text-muted dark:text-slate-400 text-xs animate-pulse">
              Querying SQLite tables...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center text-muted dark:text-slate-400 text-xs">
              No rows found in <code className="font-mono font-bold text-slate-700 dark:text-slate-300">{activeTab}</code>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 shadow-xs z-10">
                <tr>
                  {Object.keys(filteredData[0]).map((col) => (
                    <th key={col} className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    {Object.entries(row).map(([k, v], cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2.5 max-w-xs truncate text-slate-700 dark:text-slate-300">
                        {v === null || v === undefined ? (
                          <span className="text-slate-300 dark:text-slate-600 italic">null</span>
                        ) : typeof v === 'object' ? (
                          JSON.stringify(v)
                        ) : k.includes('image') && String(v).endsWith('.svg') ? (
                          <a href={`/uploads/${v}`} target="_blank" rel="noreferrer" className="text-primary dark:text-blue-400 underline flex items-center gap-1">
                            <span>{String(v)}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          String(v)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-right text-[11px] text-muted dark:text-slate-400">
          Showing {filteredData.length} entries from <code className="font-mono text-purple-700 dark:text-purple-400 font-bold">lostfound.db</code>
        </div>
      </div>
    </div>
  );
}
