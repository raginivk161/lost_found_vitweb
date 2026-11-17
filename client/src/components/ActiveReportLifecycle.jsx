import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function ActiveReportLifecycle({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const totalReports = items.length;
  const currentItem = items[currentIndex] || items[0];

  // Helper to determine the active step (1: Report, 2: Match, 3: Verify, 4: Recover)
  // item.status can be: 'open', 'matched', 'verifying', 'returned', 'closed'
  // match_status can be: 'pending', 'claimed', 'verified', 'rejected'
  // handover_status can be: 'pending', 'completed'
  let currentStep = 1;
  let statusBadgeText = 'Reported';
  let statusBadgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let guidanceText = 'Report active on campus. Neural AI matching running continuously in background.';
  let actionButton = null;

  if (currentItem.status === 'returned' || currentItem.handover_status === 'completed') {
    currentStep = 4;
    statusBadgeText = 'Returned & Recovered';
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    guidanceText = 'Digital handover confirmed. Belonging successfully recovered and returned to owner.';
    if (currentItem.match_id) {
      actionButton = (
        <Link
          to={`/matches/${currentItem.match_id}`}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition inline-flex items-center gap-1.5"
        >
          <span>View Return Record</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      );
    }
  } else if (currentItem.status === 'verifying' || currentItem.match_status === 'verified') {
    currentStep = 3;
    statusBadgeText = currentItem.match_status === 'verified' ? 'Verified - Ready for Handover' : 'Under Verification';
    statusBadgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    guidanceText = currentItem.match_status === 'verified'
      ? 'Ownership verified! Share or enter your 6-digit handover code at collection.'
      : 'Review candidate match and submit blind ownership proof.';
    if (currentItem.match_id) {
      actionButton = (
        <Link
          to={`/matches/${currentItem.match_id}`}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-md transition inline-flex items-center gap-1.5"
        >
          <span>{currentItem.match_status === 'verified' ? 'View Handover Code' : 'Complete Verification'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      );
    }
  } else if (currentItem.status === 'matched' || currentItem.match_id) {
    currentStep = 2;
    statusBadgeText = 'Matched';
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    guidanceText = 'Review candidate match and submit blind ownership proof.';
    if (currentItem.match_id) {
      actionButton = (
        <Link
          to={`/matches/${currentItem.match_id}`}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition inline-flex items-center gap-1.5"
        >
          <span>View Match Comparison</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      );
    }
  } else {
    // Step 1: Open / Report
    currentStep = 1;
    statusBadgeText = currentItem.type === 'lost' ? 'Lost Item Active' : 'Found Item Active';
    statusBadgeClass = currentItem.type === 'lost'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800'
      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    guidanceText = 'Report filed across VIT campus blocks. Matching active against incoming submissions.';
    actionButton = (
      <Link
        to={`/items/${currentItem.id}`}
        className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition inline-flex items-center gap-1.5"
      >
        <span>View Item Report</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  }

  const steps = [
    { num: 1, label: 'Report', icon: FileText },
    { num: 2, label: 'Match', icon: Sparkles },
    { num: 3, label: 'Verify', icon: ShieldCheck },
    { num: 4, label: 'Recover', icon: CheckCircle2 },
  ];

  function handlePrev() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalReports - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev < totalReports - 1 ? prev + 1 : 0));
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-soft space-y-6">
      {/* Top Header Row with Pagination and Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Report Carousel Indicator & Item Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {totalReports > 1 ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white transition"
                  title="Previous Report"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Report {currentIndex + 1} of {totalReports}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white transition"
                  title="Next Report"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="font-medium text-slate-600 dark:text-slate-400">Active Report Lifecycle</span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black text-navy dark:text-slate-100 tracking-tight">
            {currentItem.title}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>
              Reported at {currentItem.location}
              {currentItem.location_detail ? ` · ${currentItem.location_detail}` : ''}
            </span>
          </p>
        </div>

        {/* Right Top Status Badge & "View all reports" Link */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
          <Link
            to="/my-reports"
            className="text-[11px] font-semibold text-slate-400 hover:text-primary dark:hover:text-blue-400 transition"
          >
            View all reports
          </Link>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${statusBadgeClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{statusBadgeText}</span>
          </span>
        </div>
      </div>

      {/* Modern Stepper Lifecycle Timeline */}
      <div className="py-2 px-2 sm:px-6">
        <div className="relative flex items-center justify-between">
          {/* Connector Background Line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />

          {/* Active Connector Progress Line */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-teal-600 dark:bg-teal-500 z-0 transition-all duration-500"
            style={{
              width:
                currentStep === 1
                  ? '0%'
                  : currentStep === 2
                  ? '33.33%'
                  : currentStep === 3
                  ? '66.66%'
                  : 'calc(100% - 3rem)',
            }}
          />

          {/* Stepper Nodes */}
          {steps.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            const StepIcon = s.icon;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center group">
                {/* Circle Icon Container */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                    isCurrent
                      ? s.num === 2
                        ? 'bg-[#183B56] text-white ring-4 ring-blue-100 dark:ring-blue-950/60 shadow-md' // Navy/dark teal active node
                        : 'bg-teal-700 text-white ring-4 ring-teal-100 dark:ring-teal-950/60 shadow-md'
                      : isCompleted
                      ? 'bg-teal-600 dark:bg-teal-500 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-2 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>

                {/* Step Label */}
                <span
                  className={`mt-2 text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'text-navy dark:text-slate-100'
                      : isCompleted
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Guidance Note & Action CTA */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span>{guidanceText}</span>
        </div>

        {actionButton && <div>{actionButton}</div>}
      </div>
    </div>
  );
}
