import { useNavigate } from 'react-router-dom';
import { Utensils, X, ExternalLink, Volume2 } from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';

export default function OrderNotificationToast() {
  const navigate = useNavigate();
  const { latestBanner, dismissBanner, markAsRead } = useNotifications();

  if (!latestBanner) return null;

  const handleClick = () => {
    markAsRead(latestBanner.id);
    dismissBanner();
    navigate('/admin/orders');
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="rounded-2xl border-2 border-orange-400 bg-white/95 p-4 shadow-2xl backdrop-blur-md ring-4 ring-orange-400/20 transition hover:shadow-orange-200">
        <div className="flex items-start gap-3">
          {/* Animated Glowing Icon */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-500/30">
            <Utensils size={18} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                  Live QR Order
                </span>
                <Volume2 size={12} className="text-orange-500" />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissBanner();
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>

            <h4 className="mt-0.5 text-sm font-black text-slate-900">
              {latestBanner.title}
            </h4>
            <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">
              {latestBanner.message}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleClick}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 transition cursor-pointer"
              >
                <span>View Order</span>
                <ExternalLink size={12} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissBanner();
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
