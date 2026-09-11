import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChefHat, CircleCheckBig, Clock3, Headphones, Heart, Star, UtensilsCrossed } from 'lucide-react';
import { createFeedback, getOrderById, getRestaurantById } from '@/lib/services';
import type { Order, Restaurant } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';
import { demoRestaurant } from '@/data/demo';

const flow = ['new', 'accepted', 'preparing', 'ready', 'served'];
const labels: Record<string, string> = {
  new: 'Order Received',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Almost Ready',
  served: 'Served',
};
const descriptions: Record<string, string> = {
  new: 'Your order has been received',
  accepted: 'Restaurant accepted your order',
  preparing: 'Our chef is preparing your food',
  ready: 'Your order is ready to serve',
  served: 'Your food has been served to your table',
};

export default function OrderTrackingPage() {
  const { orderId = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant>(demoRestaurant);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('dinescan:lastOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.order?.id === orderId) {
          setOrder(parsed.order);
          if (parsed.restaurant) setRestaurant(parsed.restaurant);
        }
      } catch {
        // Ignore invalid cached order.
      }
    }

    if (!orderId.startsWith('demo-')) {
      const load = async () => {
        try {
          const o = await getOrderById(orderId);
          if (o) {
            setOrder(o);
            try {
              const r = await getRestaurantById(o.restaurant_id);
              if (r) setRestaurant(r);
            } catch {
              // Keep restaurant fallback.
            }
          }
        } catch {
          // Keep cached order.
        }
      };
      void load();
      const id = setInterval(() => void load(), 5000);
      return () => clearInterval(id);
    }
    return undefined;
  }, [orderId]);

  if (!order) {
    return <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] text-slate-500">Loading order...</div>;
  }

  const { themeColor, isCustom } = useTheme();
  const index = flow.indexOf(order.status);
  const progressIndex = index < 0 ? 0 : index;
  const primary = isCustom ? themeColor : (restaurant.primary_color || themeColor || '#F97316');
  const tableQuery = order.table_number ? `?table=${encodeURIComponent(order.table_number)}` : '';

  const submitFeedback = async () => {
    try {
      await createFeedback({
        restaurant_id: restaurant.id,
        order_id: order.id,
        customer_name: order.customer_name || 'Guest',
        food_rating: rating,
        service_rating: rating,
        overall_rating: rating,
        comment: comment || null,
      });
      setSent(true);
    } catch {
      setSent(true);
    }
  };

  const baseTime = new Date(order.created_at).getTime();
  const stageTime = (stageIndex: number) => {
    if (stageIndex > progressIndex) return '';
    return new Date(baseTime + stageIndex * 4 * 60_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <div className="mx-auto min-h-screen w-full max-w-[620px] bg-white shadow-[0_0_80px_rgba(76,45,20,0.08)]">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div>
            <h1 className="text-lg font-black text-slate-950">Order Tracking</h1>
            <p className="text-xs text-slate-400">Table {order.table_number || '—'} • {restaurant.name}</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Headphones size={18} /></button>
        </header>

        <main className="px-5 pb-8 pt-7">
          <div className="text-center">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <CircleCheckBig size={44} />
              <span className="absolute -right-1 top-3 h-2 w-2 rounded-full bg-emerald-400" />
              <span className="absolute -left-2 bottom-4 h-2.5 w-2.5 rounded-full bg-amber-400" />
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">Order Placed Successfully!</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Order #{order.order_number}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">We've received your order and it's being prepared with great care.</p>
          </div>

          <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Estimated preparation</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xl font-black text-slate-950"><Clock3 size={19} className="text-orange-500" /> {order.estimated_prep_time} minutes</p>
              </div>
              <p className="text-xl font-black text-slate-950">{formatCurrency(Number(order.grand_total))}</p>
            </div>

            <div className="mt-5 space-y-0">
              {flow.map((stage, stageIndex) => {
                const done = stageIndex <= progressIndex;
                const active = stageIndex === progressIndex && order.status !== 'served';
                return (
                  <div key={stage} className="relative flex gap-4 pb-7 last:pb-0">
                    {stageIndex < flow.length - 1 && (
                      <div className={`absolute left-[15px] top-8 h-[calc(100%-21px)] w-0.5 ${stageIndex < progressIndex ? 'bg-orange-500' : 'bg-slate-200'}`} />
                    )}
                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-200 bg-white text-slate-300'}`}
                    >
                      {done ? <Check size={16} strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-slate-200" />}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-black ${done ? 'text-slate-900' : 'text-slate-400'}`}>{labels[stage]}</p>
                          <p className="mt-0.5 text-xs leading-5 text-slate-400">{descriptions[stage]}</p>
                          {active && <p className="mt-1 text-xs font-black text-orange-500">In progress...</p>}
                        </div>
                        <span className="whitespace-nowrap text-[11px] font-semibold text-slate-400">{stageTime(stageIndex)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm"><ChefHat size={24} /></div>
            <p className="mt-3 text-base font-black text-slate-900">Good Food Brings People Together</p>
            <p className="mt-1 text-xs text-slate-500">Thank you for dining with {restaurant.name} <Heart size={12} className="inline fill-rose-400 text-rose-400" /></p>
          </section>

          <Link
            to={`/menu/${restaurant.slug}${tableQuery}`}
            className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-orange-200 py-3.5 text-sm font-black text-orange-600"
          >
            <UtensilsCrossed size={17} /> View Menu
          </Link>

          {order.status === 'served' && (
            <section className="mt-7 border-t border-slate-100 pt-6">
              {sent ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">Thanks for your feedback!</div>
              ) : (
                <>
                  <div className="text-center">
                    <h2 className="font-black text-slate-900">How was your experience?</h2>
                    <div className="mt-3 flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button key={score} onClick={() => setRating(score)}>
                          <Star size={29} className={score <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Share a comment (optional)" className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none focus:border-orange-300" />
                  <button onClick={() => void submitFeedback()} className="mt-3 w-full rounded-2xl py-3.5 text-sm font-black text-white" style={{ backgroundColor: primary }}>Submit Feedback</button>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
