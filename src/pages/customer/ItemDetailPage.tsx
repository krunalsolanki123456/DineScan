import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, Flame, Heart, Minus, Plus, Star } from 'lucide-react';
import { getAddons, getMenuItems, getRestaurantBySlug } from '@/lib/services';
import type { MenuItem, MenuItemAddon, Restaurant } from '@/types';
import { FoodTypeIcon } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { demoMenuItems, demoRestaurant } from '@/data/demo';

const FALLBACK_FOOD = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85';

export default function ItemDetailPage() {
  const { restaurantSlug = 'sk-restaurant', itemId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, setTableNumber, tableNumber } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [addons, setAddons] = useState<MenuItemAddon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [spice, setSpice] = useState('mild');
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const table = params.get('table');
    if (table) setTableNumber(table);
  }, [params, setTableNumber]);

  useEffect(() => {
    (async () => {
      try {
        const r = (await getRestaurantBySlug(restaurantSlug)) || { ...demoRestaurant, slug: restaurantSlug };
        setRestaurant(r);
        const menu = await getMenuItems(r.id);
        const found = (menu.length ? menu : demoMenuItems.map((x) => ({ ...x, restaurant_id: r.id }))).find((x) => x.id === itemId) || demoMenuItems.find((x) => x.id === itemId) || null;
        setItem(found);
        if (found) {
          setSpice(found.spice_level || 'mild');
          try {
            const a = await getAddons(found.id);
            setAddons(a.length ? a : createDemoAddons(found));
          } catch {
            setAddons(createDemoAddons(found));
          }
        }
      } catch {
        const found = demoMenuItems.find((x) => x.id === itemId) || demoMenuItems[0];
        setRestaurant({ ...demoRestaurant, slug: restaurantSlug });
        setItem(found);
        setSpice(found.spice_level || 'mild');
        setAddons(createDemoAddons(found));
      }
    })();
  }, [restaurantSlug, itemId]);

  const selected = useMemo(() => addons.filter((a) => selectedAddons.includes(a.id)), [addons, selectedAddons]);
  const total = item ? (Number(item.discount_price ?? item.price) + selected.reduce((s, a) => s + Number(a.price), 0)) * qty : 0;
  const tableQuery = tableNumber ? `?table=${encodeURIComponent(tableNumber)}` : '';

  if (!restaurant || !item) {
    return <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] text-slate-500">Loading item...</div>;
  }

  const { themeColor, isCustom } = useTheme();
  const primary = isCustom ? themeColor : (restaurant.primary_color || themeColor || '#F97316');
  const addToCart = () => {
    const spiceNote = spice && spice !== item.spice_level ? `Spice: ${spice}` : '';
    const finalNote = [spiceNote, notes].filter(Boolean).join(' • ');
    addItem(item, selected, finalNote, qty);
    navigate(`/menu/${restaurantSlug}${tableQuery}`);
  };

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <div className="mx-auto min-h-screen w-full max-w-[620px] bg-white shadow-[0_0_80px_rgba(76,45,20,0.08)]">
        <div className="relative h-[360px] overflow-hidden bg-slate-900 sm:h-[420px]">
          <img src={item.image_url || FALLBACK_FOOD} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <button
              onClick={() => navigate(`/menu/${restaurantSlug}${tableQuery}`)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-xl"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setLiked((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-xl"
            >
              <Heart size={20} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
            </button>
          </div>
          {item.is_bestseller && (
            <span className="absolute bottom-5 left-5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-lg">Bestseller</span>
          )}
        </div>

        <main className="pb-28">
          <section className="px-5 pb-5 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FoodTypeIcon type={item.food_type} />
                  <h1 className="text-[28px] font-black tracking-tight text-slate-950">{item.name}</h1>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" /> {item.rating || 4.8}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {item.prep_time || 15} min</span>
                </div>
              </div>
              <span className="text-2xl font-black text-slate-950">{formatCurrency(Number(item.discount_price ?? item.price))}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.description || 'Freshly prepared with premium ingredients and authentic seasoning.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">✓ Freshly Prepared</span>
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">🔥 {capitalize(item.spice_level || 'mild')}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Premium Ingredients</span>
            </div>
          </section>

          <div className="h-2 bg-[#fff8f3]" />

          <section className="px-5 py-5">
            <h2 className="font-black text-slate-900">Spice Level</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {['mild', 'medium', 'hot'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSpice(level)}
                  className={`flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-black transition ${spice === level ? 'border-orange-300 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-600'}`}
                >
                  <Flame size={14} className={spice === level ? 'fill-orange-500 text-orange-500' : 'text-slate-400'} />
                  {capitalize(level)}
                </button>
              ))}
            </div>
          </section>

          {addons.length > 0 && (
            <>
              <div className="h-2 bg-[#fff8f3]" />
              <section className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-slate-900">Add-ons</h2>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {addons.map((addon) => {
                    const checked = selectedAddons.includes(addon.id);
                    return (
                      <label key={addon.id} className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5">
                        <span className="flex items-center gap-3">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${checked ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 bg-white'}`}>
                            {checked && <Check size={13} strokeWidth={3} />}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => setSelectedAddons((p) => (checked ? p.filter((x) => x !== addon.id) : [...p, addon.id]))}
                          />
                          <span className="text-sm font-semibold text-slate-700">{addon.name}</span>
                        </span>
                        <span className="text-sm font-black text-slate-800">+{formatCurrency(Number(addon.price))}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          <div className="h-2 bg-[#fff8f3]" />
          <section className="px-5 py-5">
            <h2 className="font-black text-slate-900">Special Instructions</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Less spicy, no onion..."
              className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none focus:border-orange-300 focus:bg-white"
            />
          </section>
        </main>

        <div className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[620px] -translate-x-1/2 items-center gap-3 border-t border-slate-200 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="flex h-[52px] items-center rounded-2xl bg-slate-100 p-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700"><Minus size={17} /></button>
            <span className="w-8 text-center text-sm font-black">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}><Plus size={17} /></button>
          </div>
          <button
            onClick={addToCart}
            className="flex h-[52px] flex-1 items-center justify-center rounded-2xl text-sm font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.25)]"
            style={{ backgroundColor: primary }}
          >
            Add to Cart&nbsp;&nbsp;•&nbsp;&nbsp;{formatCurrency(total)}
          </button>
        </div>
      </div>
    </div>
  );
}

function createDemoAddons(item: MenuItem): MenuItemAddon[] {
  const names = item.food_type === 'non-veg'
    ? [['Extra Sauce', 30], ['Onion Salad', 20], ['Extra Cheese', 40]]
    : [['Extra Mint Chutney', 20], ['Onion Salad', 20], ['Extra Cheese', 40], ['Tandoori Mayo', 30]];
  return names.map(([name, price], index) => ({
    id: `${item.id}-addon-${index}`,
    menu_item_id: item.id,
    name: String(name),
    price: Number(price),
    created_at: new Date().toISOString(),
  }));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
