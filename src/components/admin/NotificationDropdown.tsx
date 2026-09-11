import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Volume2, VolumeX, ExternalLink, Utensils, Clock, Check } from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';
import { formatRelativeTime } from '@/lib/utils';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    soundEnabled,
    setSoundEnabled,
    testSound,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (id: string, orderId?: string) => {
    markAsRead(id);
    setIsOpen(false);
    navigate('/admin/orders');
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border transition cursor-pointer ${
          unreadCount > 0
            ? 'border-orange-300 bg-orange-50 text-orange-600 shadow-xs ring-2 ring-orange-200/50'
            : 'border-slate-200/80 bg-slate-50/60 text-slate-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600'
        }`}
        title={unreadCount > 0 ? `${unreadCount} unread order notifications` : 'Notifications'}
      >
        <Bell size={17} className={`sm:w-[19px] sm:h-[19px] ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in-50 zoom-in-95 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Bell size={15} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Notifications</h3>
                <p className="text-[10px] text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} new order${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) testSound();
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                  soundEnabled
                    ? 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
                    : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600'
                }`}
                title={soundEnabled ? 'Order sound chime is ON (click to mute)' : 'Order sound chime is MUTED (click to enable)'}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              {/* Mark All as Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} className="text-emerald-600" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Utensils size={22} />
                </div>
                <p className="text-xs font-bold text-slate-800">No Notifications Yet</p>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed max-w-[240px] mx-auto">
                  When customers scan table QR codes and place orders, live alerts will chime and appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.order_id)}
                  className={`flex items-start gap-3 p-3.5 transition cursor-pointer ${
                    n.read ? 'bg-white hover:bg-slate-50' : 'bg-orange-50/40 hover:bg-orange-50/70'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      n.read ? 'bg-slate-100 text-slate-500' : 'bg-orange-500 text-white shadow-xs'
                    }`}
                  >
                    <Utensils size={15} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${n.read ? 'font-semibold text-slate-800' : 'font-black text-slate-900'}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatRelativeTime(n.created_at)}
                      </span>
                      {n.table_number && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">
                          Table {n.table_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
              >
                <Trash2 size={12} /> Clear all
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/orders');
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer"
              >
                <span>View all orders</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
