import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  ShieldAlert,
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
  AlertTriangle,
  AlertCircle,
  Check,
  X,
  Lock,
  Unlock,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('flagged_claims');

  const [stats, setStats] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

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
      const url = endpoint === 'flagged_claims' ? '/api/admin/flagged-claims' : `/api/admin/${endpoint}`;
      const res = await fetch(url, { credentials: 'include' });
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

  async function handleVerifyClaim(matchId) {
    if (!window.confirm(`Are you sure you want to approve claim for Match #${matchId}? This will generate the handover code and unlock finder details for the owner.`)) {
      return;
    }
    setActionLoading(matchId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/claims/${matchId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes: 'Manually verified by Campus Security Administrator' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setActionMessage({
        type: 'success',
        text: `Match #${matchId} successfully verified! Handover Code: ${data.handoverCode}. Student dashboards updated.`,
      });
      fetchStats();
      fetchTable(activeTab);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetClaim(matchId) {
    if (!window.confirm(`Reset verification attempts for Match #${matchId}? This will allow the student to try entering the secret detail again.`)) {
      return;
    }
    setActionLoading(matchId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/claims/${matchId}/reset`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setActionMessage({
        type: 'success',
        text: `Match #${matchId} reset to pending. Student can now re-attempt verification.`,
      });
      fetchStats();
      fetchTable(activeTab);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  const filteredData = tableData.filter((row) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(row).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(s)
    );
  });

  if (user?.role !== 'admin') {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto text-danger">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-navy dark:text-slate-100">Restricted Admin Access</h2>
        <p className="text-xs text-muted dark:text-slate-400 leading-relaxed">
          The Database Inspector and Audit Logs are strictly restricted to Campus Security Administrators. Student accounts do not have permission to view raw database records or manage flagged claims.
        </p>
        <div className="pt-2">
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition"
          >
            <Key className="w-4 h-4" />
            <span>Campus Security Admin Sign In</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Campus Security Administration • SQLite Inspector</span>
          </div>
          <h1 className="text-2xl font-black text-navy dark:text-slate-100 tracking-tight">Database Viewer &amp; Claims Console</h1>
          <p className="text-xs text-muted dark:text-slate-400 mt-1">
            Real-time read-only inspection of SQLite database records and manual verification for failed student claims.
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

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-danger border border-red-200 dark:border-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-danger" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          <p className="text-xs text-muted dark:text-slate-400 font-medium">Flagged Claims</p>
          <p className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
            <span>{stats?.flagged_claims || 0}</span>
            {(stats?.flagged_claims || 0) > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                Review Needed
              </span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <p className="text-xs text-muted dark:text-slate-400 font-medium">Completed Returns</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.total_returned || 0}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'flagged_claims', label: 'Flagged Claims Review', icon: ShieldAlert, badge: stats?.flagged_claims },
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === t.id ? 'bg-white text-purple-700' : 'bg-amber-500 text-white'
                  }`}>
                    {t.badge}
                  </span>
                )}
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

        {/* Content Render */}
        {loading ? (
          <div className="py-20 text-center text-muted dark:text-slate-400 text-xs animate-pulse">
            Querying SQLite records...
          </div>
        ) : activeTab === 'flagged_claims' ? (
          /* Flagged Claims Dedicated Card Review */
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy dark:text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span>Flagged &amp; Failed Claims Resolution Desk</span>
                </h3>
                <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
                  When a student fails ownership verification 3 times, their claim is locked and transferred here. Campus Security can review the secret detail against student responses and manually verify the match.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start">
                {filteredData.length} Claim(s) Listed
              </span>
            </div>

            {filteredData.length === 0 ? (
              <div className="py-16 text-center text-muted dark:text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-200">No Flagged Claims Pending Review</p>
                <p>All automated ownership verification claims are currently resolved or in good standing.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredData.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs text-navy dark:text-slate-200">
                          Match #{claim.id}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                          claim.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                            : claim.status === 'verified'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        }`}>
                          {claim.status === 'rejected' ? <Lock className="w-3 h-3" /> : claim.status === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>
                            {claim.status === 'rejected'
                              ? '3/3 Attempts Failed (Claim Locked & Forwarded)'
                              : claim.status === 'verified'
                              ? 'Verified & Approved'
                              : `Attempt ${claim.attempt_count}/3 (Pending)`}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted dark:text-slate-400 font-medium">AI Match Score:</span>
                        <span className="font-extrabold text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                          {Math.round((claim.score || 0) * 100)}% ({claim.match_type})
                        </span>
                      </div>
                    </div>

                    {/* Match Comparison Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Lost Item (Owner) */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between font-bold text-navy dark:text-slate-100">
                          <span className="text-red-600 dark:text-red-400 uppercase tracking-wider text-[10px]">Lost Report (Owner)</span>
                          <span className="font-mono text-[11px] text-muted dark:text-slate-400">ID #{claim.lost_item_id}</span>
                        </div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">{claim.lost_title}</h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{claim.lost_description || 'No description provided'}</p>
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                          <div><strong>Student:</strong> {claim.lost_user_name} ({claim.lost_user_email})</div>
                          {claim.lost_user_reg && <div><strong>Reg No:</strong> {claim.lost_user_reg}</div>}
                          <div><strong>Lost Location:</strong> {claim.lost_location || 'Campus'}</div>
                        </div>
                      </div>

                      {/* Found Item (Finder) */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between font-bold text-navy dark:text-slate-100">
                          <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">Found Report (Finder)</span>
                          <span className="font-mono text-[11px] text-muted dark:text-slate-400">ID #{claim.found_item_id}</span>
                        </div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">{claim.found_title}</h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{claim.found_description || 'No description provided'}</p>
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                          <div><strong>Student:</strong> {claim.found_user_name} ({claim.found_user_email})</div>
                          <div><strong>Found Location:</strong> {claim.found_location || 'Campus'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Secret Detail Banner */}
                    <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                        <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Finder's Recorded Secret Detail (Campus Security Verification Ground Truth):</span>
                      </div>
                      <p className="font-mono font-bold text-purple-800 dark:text-purple-300 pl-5 text-sm">
                        "{claim.secret_detail || 'No secret detail recorded'}"
                      </p>
                    </div>

                    {/* Verification Attempt History */}
                    <div className="space-y-2 text-xs">
                      <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Student Verification Attempt Logs ({claim.attempts?.length || 0}):</span>
                      </h5>

                      {(!claim.attempts || claim.attempts.length === 0) ? (
                        <p className="text-[11px] text-muted dark:text-slate-400 italic pl-5">
                          No verification attempts submitted by student yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {claim.attempts.map((att) => (
                            <div
                              key={att.id}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                (att.result === 'success' || att.result === 'verified')
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                                  : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-900 dark:text-red-300'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">Attempt #{att.attempt_number}</span>
                                  <span className="font-mono text-[10px] opacity-75">
                                    {new Date(att.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                                  Student Input: "{att.answer || att.user_input}"
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-center">
                                <span className="font-semibold text-[11px]">
                                  Similarity: {Math.round(((att.similarity_score ?? att.similarity) || 0) * 100)}%
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  (att.result === 'success' || att.result === 'verified')
                                    ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                                    : 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
                                }`}>
                                  {att.result || att.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Admin Verification Action Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {claim.status === 'verified' ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Claim Verified &amp; Handover Code Active: <strong className="font-mono text-sm tracking-widest">{claim.handover_code || 'Issued'}</strong></span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted dark:text-slate-400">
                            Action required: Compare student description against secret detail to verify legitimate ownership.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {claim.status !== 'verified' && (
                          <button
                            onClick={() => handleVerifyClaim(claim.id)}
                            disabled={actionLoading === claim.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{actionLoading === claim.id ? 'Approving...' : 'Verify & Approve Claim'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleResetClaim(claim.id)}
                          disabled={actionLoading === claim.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition disabled:opacity-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Attempts to Retry</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Generic SQLite Raw Table Render */
          <div className="overflow-x-auto max-h-[500px]">
            {filteredData.length === 0 ? (
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
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-right text-[11px] text-muted dark:text-slate-400">
          Showing {filteredData.length} entries from <code className="font-mono text-purple-700 dark:text-purple-400 font-bold">lostfound.db</code>
        </div>
      </div>
    </div>
  );
}
