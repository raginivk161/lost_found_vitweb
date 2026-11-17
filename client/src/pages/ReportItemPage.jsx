import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  Shield,
  HelpCircle,
  Info,
} from 'lucide-react';

const CATEGORIES = [
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

export default function ReportItemPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'found' ? 'found' : 'lost';

  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [locationDetail, setLocationDetail] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().slice(0, 16));

  // Found-specific fields
  const [secretDetail, setSecretDetail] = useState('');
  const [itemLocation, setItemLocation] = useState('with me');

  // Image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleFileSelect(file) {
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validations
    if (!title.trim() || title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }
    if (type === 'found' && !imageFile) {
      setError('A photo is mandatory for reporting found items to ensure verification.');
      return;
    }
    if (type === 'found' && (!secretDetail || secretDetail.trim().length < 3)) {
      setError('Please provide a secret detail that only the real owner would know.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('location', location);
      formData.append('location_detail', locationDetail.trim());
      formData.append('date_occurred', dateOccurred);

      if (type === 'found') {
        formData.append('secret_detail', secretDetail.trim());
        formData.append('item_location', itemLocation.trim());
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('/api/items', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');

      // Navigate immediately to match results or item page
      navigate(`/items/${data.item.id}?justSubmitted=true`);
    } catch (err) {
      setError(err.message || 'Error submitting report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy dark:text-slate-100 tracking-tight">Report Campus Item</h1>
        <p className="text-xs text-muted dark:text-slate-400 mt-1">
          Provide accurate details to maximize AI matching accuracy across campus.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-8">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setType('lost')}
            className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              type === 'lost'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>I Lost an Item</span>
          </button>

          <button
            type="button"
            onClick={() => setType('found')}
            className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              type === 'found'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Found an Item</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-danger text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-navy dark:text-slate-200 mb-1.5">
              Item Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'lost' ? "e.g. Black Leather Tommy Hilfiger Wallet" : "e.g. Casio Scientific Calculator fx-991EX"}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy dark:text-slate-200 mb-1.5">
                Category <span className="text-danger">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy dark:text-slate-200 mb-1.5">
                Date &amp; Estimated Time <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </div>
          </div>

          {/* Location Dropdown & Detail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy dark:text-slate-200 mb-1.5">
                Campus Location / Block <span className="text-danger">*</span>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy dark:text-slate-200 mb-1.5">
                Specific Spot / Room Details
              </label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="e.g. SJT 412 3rd row, TT Nescafe bench"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-navy dark:text-slate-200 mb-1.5">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide identifiable characteristics (color, brand, visible stickers, condition). Note: Do NOT mention your secret detail if you found it!"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none leading-relaxed"
            />
            <p className="text-[10px] text-muted dark:text-slate-400 mt-1">Min 10 characters.</p>
          </div>

          {/* FOUND ONLY: Secret Detail & Where is the item now */}
          {type === 'found' && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 text-xs font-bold">
                <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Verification Protection (Found Items Only)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                  Secret Detail only the real owner would know <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={secretDetail}
                  onChange={(e) => setSecretDetail(e.target.value)}
                  placeholder="e.g. Has ₹500 note inside or student ID 24BCE1001, specific scratch on back"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Hidden from everyone. The owner must accurately describe this to claim the item.</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                  Where is the item currently located?
                </label>
                <select
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="with me">With me (I have the item)</option>
                  <option value="security desk">Submitted to Block Security Desk</option>
                  <option value="block office">Submitted to Hostel / Academic Block Office</option>
                </select>
              </div>
            </div>
          )}

          {/* Drag & Drop Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-navy dark:text-slate-200 mb-1.5">
              Item Photograph {type === 'found' ? <span className="text-danger">* (Required for Found)</span> : <span className="text-muted dark:text-slate-400 font-normal">(Optional for Lost, powers CLIP neural matching)</span>}
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 p-2 flex items-center gap-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-navy dark:text-slate-100 truncate">{imageFile?.name}</p>
                  <p className="text-[10px] text-muted dark:text-slate-400">{(imageFile?.size / 1024).toFixed(1)} KB</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Ready for neural embedding analysis</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 rounded-xl text-slate-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Click or drag photo here to upload
                </p>
                <p className="text-[10px] text-muted dark:text-slate-400 mt-1">
                  JPG, PNG, or WebP up to 5MB. Photo is encrypted and deleted permanently upon verified return.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 transform active:scale-98 ${
                type === 'lost'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span>Running AI Multi-Modal Matching...</span>
              ) : (
                <>
                  <span>Submit Report &amp; Run AI Match</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
