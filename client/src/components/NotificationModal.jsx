import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationModal({ isOpen, onClose, onRefreshCount }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id, e) {
    e?.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
      onRefreshCount?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include',
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      onRefreshCount?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNotif(id, e) {
    e?.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      onRefreshCount?.();
    } catch (err) {
      console.error(err);
    }
  }

  function handleNotifClick(notif) {
    markAsRead(notif.id);
    try {
      const data = JSON.parse(notif.data || '{}');
      if (data.match_id) {
        navigate(`/matches/${data.match_id}`);
        onClose();
      } else if (data.item_id) {
        navigate(`/items/${data.item_id}`);
        onClose();
      }
    } catch {}
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface dark:bg-slate-900 rounded-2xl shadow-hover border border-slate-200/80 dark:border-slate-800 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-navy dark:text-white text-base">Notifications</h3>
              <p className="text-xs text-muted dark:text-slate-400">Stay updated on your lost & found matches</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary dark:text-blue-400 hover:text-primary-hover font-medium px-2 py-1 rounded hover:bg-primary/5 transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted dark:text-slate-400 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 space-y-2 flex-1">
          {loading ? (
            <div className="py-12 text-center text-muted dark:text-slate-400 text-sm animate-pulse">
              Loading updates...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-muted mx-auto flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No notifications yet</p>
              <p className="text-xs text-muted dark:text-slate-400 mt-1">When an AI match is found or verified, you'll be notified here.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-start gap-3 ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 opacity-80'
                    : 'bg-primary/5 dark:bg-blue-950/30 border-primary/20 dark:border-blue-800 hover:border-primary/40'
                }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  notif.type.includes('match')
                    ? 'bg-primary/10 text-primary'
                    : notif.type.includes('verification') || notif.type.includes('handover')
                    ? 'bg-found/10 text-found-dark'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {notif.type.includes('match') ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold truncate ${notif.read ? 'text-slate-800 dark:text-slate-200' : 'text-primary dark:text-blue-400'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted dark:text-slate-400 flex-shrink-0">
                      {new Date(notif.created_at + (notif.created_at.includes('Z') ? '' : 'Z')).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 opacity-60 hover:opacity-100">
                  {!notif.read && (
                    <button
                      onClick={(e) => markAsRead(notif.id, e)}
                      title="Mark as read"
                      className="p-1 hover:text-primary transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteNotif(notif.id, e)}
                    title="Delete"
                    className="p-1 hover:text-danger transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
