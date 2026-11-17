import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Shield,
  Key,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Database,
  ArrowLeft,
  Sun,
  Moon,
  Info,
} from 'lucide-react';

export default function AdminLoginPage() {
  const { user, adminLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in as admin, go straight to /admin
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  function fillDemoCredentials() {
    setEmail('admin@vit.edu');
    setPassword('Admin@123');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-textMain dark:text-slate-100 transition-colors duration-200 relative">
      {/* Top Bar with Theme Toggle and Back Link */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-navy to-primary flex items-center justify-center text-white mx-auto shadow-md">
          <Shield className="w-6 h-6 text-amber-300" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-navy dark:text-slate-100 tracking-tight">
          Campus Security &amp; Admin
        </h2>
        <p className="text-xs text-muted dark:text-slate-400 mt-1 font-medium">
          Restricted Portal • Live SQLite Database Inspector
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          {/* Admin Credentials Callout Card */}
          <div className="mb-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50 text-purple-900 dark:text-purple-200 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                  <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Admin Login Credentials:</span>
                </p>
                <div className="space-y-0.5 text-[11px] text-purple-800 dark:text-purple-300 font-mono">
                  <p>Email: <strong>admin@vit.edu</strong></p>
                  <p>Password: <strong>Admin@123</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs transition self-start whitespace-nowrap"
              >
                Auto-Fill
              </button>
            </div>
            <p className="mt-2 text-[10px] text-purple-700 dark:text-purple-400">
              Only this admin account has authorization to view the live database tables.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-danger text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Admin Email Address
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vit.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Security Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating Administrator...</span>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Sign In as Security Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted dark:text-slate-400 hover:text-navy dark:hover:text-slate-200 transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Student Portal Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
