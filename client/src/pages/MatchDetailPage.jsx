import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Key,
  Award,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';

export default function MatchDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verification state
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [claimError, setClaimError] = useState('');

  // Handover state
  const [handoverCode, setHandoverCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    fetchMatch();
  }, [id]);

  async function fetchMatch() {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${id}`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load match');
      }
      const data = await res.json();
      setMatch(data.match);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle owner verification claim
  async function handleClaimSubmit(e) {
    e.preventDefault();
    if (!claimAnswer.trim()) return;

    setClaiming(true);
    setClaimError('');
    try {
      const res = await fetch(`/api/matches/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answer: claimAnswer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Claim verification failed');
      }
      setClaimResult(data);
      if (data.verified) {
        fetchMatch(); // Refresh to see contact info and verified status
      }
    } catch (err) {
      setClaimError(err.message);
    } finally {
      setClaiming(false);
    }
  }

  // Handle finder confirming handover code
  async function handleConfirmHandover(e) {
    e.preventDefault();
    if (!handoverCode.trim()) return;

    setConfirming(true);
    setConfirmError('');
    try {
      const res = await fetch('/api/handover/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ match_id: id, code: handoverCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Handover confirmation failed');
      }
      setConfirmSuccess(true);
      fetchMatch();
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-muted text-xs animate-pulse">
        Loading match details &amp; neural score...
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-danger mx-auto" />
        <h2 className="text-base font-bold text-navy">Match Not Available</h2>
        <p className="text-xs text-muted">{error || 'Could not find the requested match.'}</p>
        <Link to="/dashboard" className="inline-block mt-3 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === match.lost_user_id;
  const isFinder = user?.id === match.found_user_id;
  const isReturned = match.lost_status === 'returned' || match.found_status === 'returned';
  const isVerified = match.status === 'verified';
  const scorePct = Math.round(match.score * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
            match.match_type === 'strong'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{match.match_type === 'strong' ? 'Strong Match' : 'Possible Match'}</span>
            <span className="font-extrabold ml-1">{scorePct}%</span>
          </span>
        </div>
      </div>

      {/* Returned Success Card */}
      {isReturned && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-hover flex items-center gap-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Item Successfully Returned! 🎉</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Handover verified via digital code. 10 Karma Points awarded to finder. In accordance with VIT privacy rules, photos and embeddings have been wiped permanently from storage.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lost Item Side */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
              Lost Item
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              by {match.lost_user_name}
            </span>
          </div>

          {match.lost_images && match.lost_images.length > 0 && !isReturned ? (
            <img
              src={`/uploads/${match.lost_images[0].filename}`}
              alt={match.lost_title}
              className="w-full h-48 object-cover rounded-2xl border border-slate-100 dark:border-slate-800"
            />
          ) : (
            <div className="w-full h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-muted dark:text-slate-400 text-xs">
              <span>{isReturned ? 'Photo purged upon verified return' : 'No photo uploaded'}</span>
            </div>
          )}

          <div>
            <h3 className="font-bold text-navy dark:text-slate-100 text-base">{match.lost_title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{match.lost_description}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{match.lost_location}</span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Lost on: {new Date(match.lost_date).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Found Item Side */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
              Found Item
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              by {match.found_user_name}
            </span>
          </div>

          {match.found_images && match.found_images.length > 0 && !isReturned ? (
            <img
              src={`/uploads/${match.found_images[0].filename}`}
              alt={match.found_title}
              className="w-full h-48 object-cover rounded-2xl border border-slate-100 dark:border-slate-800"
            />
          ) : (
            <div className="w-full h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-muted dark:text-slate-400 text-xs">
              <span>{isReturned ? 'Photo purged upon verified return' : 'No photo uploaded'}</span>
            </div>
          )}

          <div>
            <h3 className="font-bold text-navy dark:text-slate-100 text-base">{match.found_title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{match.found_description}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{match.found_location}</span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Found on: {new Date(match.found_date).toLocaleDateString()}</span>
            </p>
            {match.item_location && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                Currently with: {match.item_location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Breakdown Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-navy dark:text-slate-100 text-sm">Why This Matched (Explainable AI)</h3>
              <p className="text-xs text-muted dark:text-slate-400">Mathematical confidence scores across 5 neural and categorical signals</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
            Score: {scorePct}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Image */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-600 dark:text-slate-300">Image Neural Match (45%)</span>
              <span className="font-bold text-navy dark:text-slate-100">{Math.round((match.image_score || 0) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.round((match.image_score || 0) * 100)}%` }} />
            </div>
          </div>

          {/* Text */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-600 dark:text-slate-300">Description Semantics (25%)</span>
              <span className="font-bold text-navy dark:text-slate-100">{Math.round((match.text_score || 0) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((match.text_score || 0) * 100)}%` }} />
            </div>
          </div>

          {/* Category */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-600 dark:text-slate-300">Category Correlation (15%)</span>
              <span className="font-bold text-navy dark:text-slate-100">{Math.round((match.category_score || 0) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((match.category_score || 0) * 100)}%` }} />
            </div>
          </div>

          {/* Location */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-600 dark:text-slate-300">Location Proximity (10%)</span>
              <span className="font-bold text-navy dark:text-slate-100">{Math.round((match.location_score || 0) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((match.location_score || 0) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Verification & Handover Action Section */}
      {!isReturned && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary dark:text-blue-400" />
            <h3 className="font-bold text-navy dark:text-slate-100 text-base">Ownership Verification &amp; Handover</h3>
          </div>

          {/* 1. If owner hasn't verified yet */}
          {isOwner && !isVerified && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-300 text-xs leading-relaxed">
                <p className="font-bold">Step 1: Verify Ownership</p>
                <p className="mt-1">
                  The finder noted a secret detail when reporting this item. To prove this is yours, describe a unique identifying mark, contents, or sticker below.
                </p>
              </div>

              {claimError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-danger text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              {claimResult && !claimResult.verified && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs">
                  {claimResult.message}
                </div>
              )}

              <form onSubmit={handleClaimSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-navy dark:text-slate-200">
                  Describe a unique mark, serial, or detail only you would know:
                </label>
                <textarea
                  rows={2}
                  required
                  value={claimAnswer}
                  onChange={(e) => setClaimAnswer(e.target.value)}
                  placeholder="e.g. Has a small sticker of Iron Man on the back, or ₹500 note inside the card slot"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
                />

                <button
                  type="submit"
                  disabled={claiming}
                  className="py-2.5 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {claiming ? 'Verifying with Finder\'s Secret...' : 'Submit Claim Verification'}
                  {!claiming && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* 2. If verified -> Show Handover Code to Owner */}
          {isOwner && isVerified && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm">Ownership Verified Successfully!</h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Give this 6-digit one-time handover code to the finder when you meet them or pick it up from the security desk:
                </p>

                {match.handover ? (
                  <div className="py-3 px-6 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 inline-block font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-widest shadow-inner my-2">
                    {match.handover.code || (claimResult?.handoverCode)}
                  </div>
                ) : claimResult?.handoverCode ? (
                  <div className="py-3 px-6 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 inline-block font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-widest shadow-inner my-2">
                    {claimResult.handoverCode}
                  </div>
                ) : null}

                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  The finder will enter this code on their dashboard to complete the return.
                </p>
              </div>

              {/* Reveal Contact Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <p className="font-bold text-navy dark:text-slate-100">Finder Contact Details (Unlocked):</p>
                <div className="flex flex-wrap gap-4 text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" /> {match.found_user_email}
                  </span>
                  {match.found_user_phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {match.found_user_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. If Finder -> Enter Handover Code */}
          {isFinder && (
            <div className="space-y-4">
              {isVerified ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 text-xs">
                    <p className="font-bold">Step 2: Complete Handover</p>
                    <p className="mt-1">
                      The owner's claim was verified. When you hand over the item, ask them for their 6-digit handover code and enter it below.
                    </p>
                  </div>

                  {confirmError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-danger text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{confirmError}</span>
                    </div>
                  )}

                  <form onSubmit={handleConfirmHandover} className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={handoverCode}
                      onChange={(e) => setHandoverCode(e.target.value)}
                      placeholder="6-digit code"
                      className="px-3.5 py-2.5 text-center font-mono text-sm tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={confirming}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      {confirming ? 'Confirming...' : 'Confirm Return'}
                    </button>
                  </form>

                  {/* Owner contact details */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <p className="font-bold text-navy dark:text-slate-100">Owner Contact Details (Unlocked):</p>
                    <div className="flex flex-wrap gap-4 text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary" /> {match.lost_user_email}
                      </span>
                      {match.lost_user_phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" /> {match.lost_user_phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-muted dark:text-slate-400">
                  <p className="font-bold text-navy dark:text-slate-100">Awaiting Owner Claim</p>
                  <p className="mt-1">
                    The owner has not claimed this item yet. Once they accurately identify the secret detail, you will receive an in-app alert.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
