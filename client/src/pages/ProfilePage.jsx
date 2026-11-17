import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Hash,
  Phone,
  Lock,
  Bell,
  Award,
  Layers,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  // Stats
  const [stats, setStats] = useState(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      fetchStats();
      fetchProfileDetails();
    }
  }, [user]);

  async function fetchProfileDetails() {
    try {
      const res = await fetch('/api/users/profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const prefs = data.user.notification_preferences || {};
        setEmailNotifs(prefs.email !== false);
        setInAppNotifs(prefs.inApp !== false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/users/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setStatusMessage({ type: 'success', text: 'Profile details saved successfully!' });
      refreshUser();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setSavingPassword(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setStatusMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleToggleNotifs(typeKey, val) {
    const newEmail = typeKey === 'email' ? val : emailNotifs;
    const newInApp = typeKey === 'inApp' ? val : inAppNotifs;
    if (typeKey === 'email') setEmailNotifs(val);
    if (typeKey === 'inApp') setInAppNotifs(val);

    try {
      await fetch('/api/users/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail, inApp: newInApp }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteAccount() {
    const confirmation = window.prompt(
      'WARNING: Deleting your account will immediately remove all your reports, profile data, and wipe your uploaded photos from disk. Type "DELETE" to confirm:'
    );
    if (confirmation !== 'DELETE') return;

    try {
      const res = await fetch('/api/users/account', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await logout();
        navigate('/login');
      }
    } catch (err) {
      alert('Failed to delete account: ' + err.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy dark:text-slate-100 tracking-tight">Profile &amp; Settings</h1>
        <p className="text-xs text-muted dark:text-slate-400 mt-1">
          Manage your personal details, campus notification preferences, and account security.
        </p>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
            : 'bg-red-50 dark:bg-red-950/40 text-danger dark:text-red-400 border border-red-200 dark:border-red-900/50'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Karma & Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-2">
            <Award className="w-4 h-4" />
            <span>Karma Points</span>
          </div>
          <p className="text-2xl font-black text-navy dark:text-slate-100">{stats?.karma_points || 0}</p>
          <p className="text-[10px] text-muted dark:text-slate-400 mt-0.5">+10 pts per returned item</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold mb-2">
            <Layers className="w-4 h-4" />
            <span>Items Reported Lost</span>
          </div>
          <p className="text-2xl font-black text-navy dark:text-slate-100">{stats?.items_lost || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold mb-2">
            <Layers className="w-4 h-4" />
            <span>Items Reported Found</span>
          </div>
          <p className="text-2xl font-black text-navy dark:text-slate-100">{stats?.items_found || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold mb-2">
            <Award className="w-4 h-4" />
            <span>Returned &amp; Handed Over</span>
          </div>
          <p className="text-2xl font-black text-navy dark:text-slate-100">{stats?.items_returned || 0}</p>
        </div>
      </div>

      {/* Edit Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-8 space-y-5">
        <h3 className="font-bold text-navy dark:text-slate-100 text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary dark:text-blue-400" />
          <span>Student Credentials</span>
        </h3>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">VIT Email (Read-only)</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registration Number (Read-only)</label>
              <input
                type="text"
                disabled
                value={user?.registration_number || ''}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-mono uppercase"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-8 space-y-5">
        <h3 className="font-bold text-navy dark:text-slate-100 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary dark:text-blue-400" />
          <span>Change Account Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-navy dark:text-slate-100 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary dark:text-blue-400" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 cursor-pointer">
            <div>
              <p className="text-xs font-bold text-navy dark:text-slate-100">In-App Match &amp; Verification Alerts</p>
              <p className="text-[11px] text-muted dark:text-slate-400">Receive notification pill updates when a candidate item is discovered</p>
            </div>
            <input
              type="checkbox"
              checked={inAppNotifs}
              onChange={(e) => handleToggleNotifs('inApp', e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 cursor-pointer">
            <div>
              <p className="text-xs font-bold text-navy dark:text-slate-100">Email Dispatches</p>
              <p className="text-[11px] text-muted dark:text-slate-400">Send automated alerts to your VIT email when a match is verified</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => handleToggleNotifs('email', e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900/40 p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-danger text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Permanently delete your student account and all linked records. All uploaded photographs in our file storage will be unlinked and wiped.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-5 py-2.5 rounded-xl bg-danger hover:bg-red-600 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete My Account &amp; Wipe Photos</span>
        </button>
      </div>
    </div>
  );
}
