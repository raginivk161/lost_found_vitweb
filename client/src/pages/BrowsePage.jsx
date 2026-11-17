import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Tag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import ItemCard from '../components/ItemCard';

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'Accessories',
  'Clothing',
  'Books & Notes',
  'Stationery',
  'ID Cards & Documents',
  'Keys & Access Cards',
  'Bags & Wallets',
  'Water Bottles & Containers',
  'Sports Equipment',
  'Headphones & Earbuds',
  'Chargers & Cables',
  'Umbrellas',
  'Other',
];

const LOCATIONS = [
  'All Locations',
  'Main Building',
  'AB-1',
  'AB-2',
  'TT Block',
  'SJT',
  'SMV',
  'Technology Tower',
  'GDN Block',
  'Anna Auditorium',
  'Main Gate',
  'Library',
  'Food Court',
  'Mens Hostel',
  'Womens Hostel',
  'Sports Complex',
  'CDMM',
  'VIT Mall',
];

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [type, setType] = useState(searchParams.get('type') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [type, category, location, search, page]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (category && category !== 'All Categories') params.set('category', category);
      if (location && location !== 'All Locations') params.set('location', location);
      if (search) params.set('search', search);
      params.set('page', page);
      params.set('limit', 12);

      const res = await fetch(`/api/items?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleResetFilters() {
    setType('');
    setCategory('');
    setLocation('');
    setSearch('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-navy tracking-tight">Browse Campus Items</h1>
        <p className="text-xs text-muted mt-1">
          Explore lost and found belongings across all academic and hostel blocks.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search items by keywords (e.g. 'black wallet', 'Casio calculator', 'Quechua umbrella')..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Report Type</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary outline-none bg-white font-medium"
            >
              <option value="">All (Lost &amp; Found)</option>
              <option value="lost">Lost Only</option>
              <option value="found">Found Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary outline-none bg-white font-medium"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c === 'All Categories' ? '' : c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Campus Spot</label>
            <select
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary outline-none bg-white font-medium"
            >
              {LOCATIONS.map(l => (
                <option key={l} value={l === 'All Locations' ? '' : l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-navy text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Found <strong className="text-navy">{totalItems}</strong> active items</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted text-xs animate-pulse">
            Loading campus listings...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-navy text-sm">No Items Matched Your Search</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1">
              Try adjusting your search terms, changing the location, or resetting the filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy text-xs font-semibold transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-6 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-navy disabled:opacity-40 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-700 px-3">
              {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-navy disabled:opacity-40 transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
