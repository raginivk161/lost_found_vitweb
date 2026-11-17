import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Tag,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Lock,
  User,
} from 'lucide-react';
import MatchCard from '../components/MatchCard';

export default function ItemDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const justSubmitted = searchParams.get('justSubmitted') === 'true';

  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  async function fetchItemDetails() {
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${id}`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Item not found');
      }
      const data = await res.json();
      setItem(data.item);

      // Fetch matches for this item if owner or admin
      if (user && (user.id === data.item.user_id || user.role === 'admin')) {
        const matchRes = await fetch(`/api/matches/for-item/${id}`, { credentials: 'include' });
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatches(matchData.matches || []);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this report? This will also remove any active AI matches.')) return;
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        navigate('/my-reports');
      }
    } catch (err) {
      alert('Failed to delete item: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-muted text-xs animate-pulse">
        Loading item details...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-danger mx-auto" />
        <h2 className="text-base font-bold text-navy">Item Not Found</h2>
        <p className="text-xs text-muted">The requested report does not exist or has been removed.</p>
        <Link to="/browse" className="inline-block mt-3 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold">
          Back to Browse
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === item.user_id;
  const isLost = item.type === 'lost';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {isOwner && ['open', 'matched'].includes(item.status) && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-danger hover:bg-red-50 border border-red-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Report</span>
          </button>
        )}
      </div>

      {/* Just submitted banner */}
      {justSubmitted && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Report successfully filed on campus!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                AI matching executed immediately. Any potential counterpart reports are highlighted below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Photo */}
          <div className="bg-slate-100 flex items-center justify-center p-4 min-h-[280px]">
            {item.images && item.images.length > 0 ? (
              <img
                src={`/uploads/${item.images[0].filename}`}
                alt={item.title}
                className="max-h-72 w-full object-contain rounded-2xl"
              />
            ) : (
              <div className="text-center p-6 text-muted">
                <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No photograph provided</p>
                <p className="text-[10px] mt-0.5">Matched using textual semantics &amp; categories</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isLost ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {item.type}
                </span>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  Status: {item.status}
                </span>
              </div>

              <h1 className="text-xl font-black text-navy">{item.title}</h1>

              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Tag className="w-3.5 h-3.5" />
                <span>{item.category}</span>
              </div>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{item.location} {item.location_detail ? `(${item.location_detail})` : ''}</span>
              </p>

              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Occurred on: {new Date(item.date_occurred).toLocaleString()}</span>
              </p>

              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Reported by: {item.user_name}</span>
              </p>

              {item.secret_detail && (
                <div className="mt-2 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px]">
                  <p className="font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-600" />
                    <span>Your Recorded Secret Detail:</span>
                  </p>
                  <p className="mt-0.5">{item.secret_detail}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Matches for this item */}
      {isOwner && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">AI Counterpart Matches</h2>
              <p className="text-xs text-muted">Potential pairings identified by the CLIP multi-modal network</p>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200/80 text-center shadow-soft">
              <p className="text-xs text-muted">
                No active counterpart matches found yet for this report. As new opposite reports are submitted, they will be evaluated instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
