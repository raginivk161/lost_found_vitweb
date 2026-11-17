import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layers, AlertCircle, CheckCircle2, Sparkles, Award, PlusCircle, Trash2, Edit3, ArrowRight } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import MatchCard from '../components/MatchCard';

export default function MyReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'lost';

  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit item state
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    fetchMyData();
  }, []);

  async function fetchMyData() {
    setLoading(true);
    try {
      const [itemsRes, matchesRes] = await Promise.all([
        fetch('/api/items/my', { credentials: 'include' }),
        fetch('/api/matches', { credentials: 'include' }),
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      alert('Failed to delete item: ' + err.message);
    }
  }

  function handleStartEdit(item) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditLocation(item.location);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          location: editLocation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...data.item } : i));
        setEditingItem(null);
      }
    } catch (err) {
      alert('Failed to update item: ' + err.message);
    }
  }

  // Filter items by current tab
  const lostItems = items.filter(i => i.type === 'lost' && i.status !== 'returned');
  const foundItems = items.filter(i => i.type === 'found' && i.status !== 'returned');
  const returnedItems = items.filter(i => i.status === 'returned');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">My Reports &amp; Matches</h1>
          <p className="text-xs text-muted mt-1">
            Track your open lost reports, items you found, active AI matches, and returned history.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setSearchParams({ tab: 'lost' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'lost'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-muted hover:text-navy'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Lost Reports ({lostItems.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'found' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'found'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-muted hover:text-navy'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Found Reports ({foundItems.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'matches' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'matches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-navy'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Matches ({matches.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'returned' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'returned'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-muted hover:text-navy'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Returned &amp; Resolved ({returnedItems.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="py-20 text-center text-muted text-xs animate-pulse">
          Loading your reports...
        </div>
      ) : activeTab === 'lost' ? (
        lostItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-navy text-sm">No Active Lost Reports</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1">
              If you misplaced something on campus, report it now to activate instant AI detection.
            </p>
            <Link to="/report?type=lost" className="inline-block mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold">
              Report Lost Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lostItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                isOwner={true}
                onDelete={handleDelete}
                onEdit={handleStartEdit}
              />
            ))}
          </div>
        )
      ) : activeTab === 'found' ? (
        foundItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-navy text-sm">No Active Found Reports</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1">
              Found an abandoned item in class or hostels? Report it and earn campus karma points!
            </p>
            <Link to="/report?type=found" className="inline-block mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold">
              Report Found Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foundItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                isOwner={true}
                onDelete={handleDelete}
                onEdit={handleStartEdit}
              />
            ))}
          </div>
        )
      ) : activeTab === 'matches' ? (
        matches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-navy text-sm">No Active Matches Found Yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1">
              Our neural matching algorithm runs automatically after every submission. Matches above 50% will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )
      ) : (
        /* Returned tab */
        returnedItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
            <Award className="w-10 h-10 text-purple-500 mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-navy text-sm">No Returned Items Yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1">
              Completed handovers with verified digital codes will be archived here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {returnedItems.map(item => (
              <ItemCard key={item.id} item={item} isOwner={true} />
            ))}
          </div>
        )
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-hover p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-navy text-base">Edit Report</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location Details</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
