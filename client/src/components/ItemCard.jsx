import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, AlertCircle, CheckCircle, Clock, Trash2, Edit3, ArrowRight } from 'lucide-react';

export default function ItemCard({ item, isOwner = false, onDelete, onEdit }) {
  const isLost = item.type === 'lost';

  const statusColors = {
    open: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    matched: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    verifying: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    returned: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    closed: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  const imageUrl = item.image_filename 
    ? `/uploads/${item.image_filename}` 
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-hover transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Image container */}
      <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback category placeholder if no photo or image fails */}
        <div
          className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${
            imageUrl ? 'hidden' : 'flex'
          } ${isLost ? 'bg-amber-500/5 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300' : 'bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'}`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-sm ${
            isLost ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Tag className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold">{item.category}</p>
          <p className="text-[10px] text-muted dark:text-slate-400 mt-0.5">Photo not provided</p>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${
              isLost
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {item.type}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${statusColors[item.status] || statusColors.open}`}>
            {item.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary dark:text-blue-400 mb-1">
            <Tag className="w-3 h-3" />
            <span>{item.category}</span>
          </div>

          <h3 className="font-bold text-navy dark:text-white text-sm line-clamp-1 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{item.location} {item.location_detail ? `• ${item.location_detail}` : ''}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{new Date(item.date_occurred).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-muted dark:text-slate-400">
            by {item.user_name ? item.user_name.split(' ')[0] : 'Student'}
          </span>

          <div className="flex items-center gap-1.5">
            {isOwner && ['open', 'matched'].includes(item.status) && (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Edit Item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}

            <Link
              to={`/items/${item.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-primary/5 dark:hover:bg-blue-400/10 transition"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
