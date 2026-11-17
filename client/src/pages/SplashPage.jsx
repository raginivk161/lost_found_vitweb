import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  Search,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Award,
  CheckCircle2,
  Check,
} from 'lucide-react';

export default function SplashPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-navy to-slate-950 text-white flex flex-col justify-between selection:bg-primary selection:text-white">
      {/* Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">VIT</span>
            <span className="font-semibold text-xl text-blue-400 ml-1">Lost &amp; Found</span>
          </div>
        </div>

        <div>
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition inline-flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition"
            >
              Student Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        {/* Course / Project Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-6 animate-pulse-subtle">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Design Thinking &amp; Product Lifecycle Management Project</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl">
          Lose it. Report it. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            AI finds it.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          The verified lost &amp; found network exclusively for VITians. Instant local CLIP multimodal AI matching, privacy-preserving secret verification, and fraud-proof digital handovers.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xl shadow-primary/25 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span>{user ? 'Open Dashboard' : 'Get Started with VIT Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/browse"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 backdrop-blur-sm transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-slate-300" />
            <span>Browse Campus Items</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-4xl text-left">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-400/30 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Instant AI Matching</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              CLIP neural embeddings cross-examine photos and text with category, location, and temporal decay signals.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-400/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Secret Verification</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Finders record a hidden identifier. Owners verify ownership securely without exposing the secret to the public.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-emerald-400/30 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Handover &amp; Privacy</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              One-time 6-digit handover codes guarantee delivery. Upon return, photos and embeddings are purged permanently.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© 2026 VIT Lost &amp; Found. Designed for VIT students, faculty, and campus security.</p>
      </footer>
    </div>
  );
}
