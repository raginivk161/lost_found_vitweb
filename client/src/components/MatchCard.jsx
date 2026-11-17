import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronDown, ChevronUp, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function MatchCard({ match }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const scorePct = Math.round(match.score * 100);
  const isStrong = match.match_type === 'strong';

  const lostImg = match.lost_image ? `/uploads/${match.lost_image}` : null;
  const foundImg = match.found_image ? `/uploads/${match.found_image}` : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-hover transition-all duration-200 overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                isStrong
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isStrong ? 'Strong Match' : 'Possible Match'}</span>
              <span className="font-extrabold ml-1">{scorePct}%</span>
            </span>

            {match.matching_mode === 'basic' && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                Keyword Mode
              </span>
            )}
          </div>

          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
            match.status === 'verified'
              ? 'bg-purple-100 text-purple-700'
              : match.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {match.status}
          </span>
        </div>

        {/* Side by side comparison preview */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          {/* Lost item */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
              Lost Report
            </span>
            <p className="text-xs font-bold text-navy truncate mt-1">{match.lost_title}</p>
            <p className="text-[11px] text-muted truncate">{match.lost_location} • {match.lost_category}</p>
          </div>

          {/* Found item */}
          <div className="space-y-1 border-l border-slate-200/80 pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
              Found Report
            </span>
            <p className="text-xs font-bold text-navy truncate mt-1">{match.found_title}</p>
            <p className="text-[11px] text-muted truncate">{match.found_location} • {match.found_category}</p>
          </div>
        </div>

        {/* Explainability Accordion Button */}
        <div className="mt-3">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-navy py-1.5 px-1 rounded-lg hover:bg-slate-50 transition"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>Why this matched (AI Breakdown)</span>
            </span>
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBreakdown && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs animate-fadeIn">
              {/* Image similarity */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Image Neural Match (45%)</span>
                  <span className="font-bold text-navy">{Math.round((match.image_score || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((match.image_score || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Text similarity */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Description Semantics (25%)</span>
                  <span className="font-bold text-navy">{Math.round((match.text_score || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((match.text_score || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Category Correlation (15%)</span>
                  <span className="font-bold text-navy">{Math.round((match.category_score || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((match.category_score || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Location Proximity (10%)</span>
                  <span className="font-bold text-navy">{Math.round((match.location_score || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((match.location_score || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Temporal Closeness (5%)</span>
                  <span className="font-bold text-navy">{Math.round((match.time_score || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((match.time_score || 0) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-muted">
            Found by {match.found_user_name ? match.found_user_name.split(' ')[0] : 'Student'}
          </span>

          <Link
            to={`/matches/${match.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition shadow-xs"
          >
            <span>Review &amp; Verify</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
