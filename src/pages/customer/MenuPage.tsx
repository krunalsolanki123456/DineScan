import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  Heart,
  MapPin,
  Menu as MenuIcon,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  UtensilsCrossed,
  X,
  Flame,
  QrCode,
} from 'lucide-react';
import { getCategories, getMenuItems, getRestaurantBySlug } from '@/lib/services';
import type { Category, MenuItem, Restaurant } from '@/types';
import { FoodTypeIcon } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { demoCategories, demoMenuItems, demoRestaurant } from '@/data/demo';

const FALLBACK_FOOD = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85';

export default function MenuPage() {
  const { restaurantSlug = 'sk-restaurant' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, totalAmount, totalItems, setTableNumber, tableNumber } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableInput, setTableInput] = useState('');

  useEffect(() => {
    const table = params.get('table');
    if (table) setTableNumber(table);
  }, [params, setTableNumber]);

  useEffect(() => {
    let alive = true;
    const fetchMenu = async () => {
      try {
        const r = await getRestaurantBySlug(restaurantSlug);
        if (!alive) return;
        const targetRest = r || { ...demoRestaurant, slug: restaurantSlug };
        setRestaurant(targetRest);
        const [cats, menu] = await Promise.all([
          getCategories(targetRest.id),
          getMenuItems(targetRest.id),
        ]);
        if (!alive) return;
        setCategories(cats.length ? cats : demoCategories.map((x) => ({ ...x, restaurant_id: targetRest.id })));
        setItems(menu.length ? menu : demoMenuItems.map((x) => ({ ...x, restaurant_id: targetRest.id })));
      } catch {
        if (!alive) return;
        setRestaurant({ ...demoRestaurant, slug: restaurantSlug });
        setCategories(demoCategories);
        setItems(demoMenuItems);
      }
    };

    void fetchMenu();

    const handleSync = () => {
      void fetchMenu();
    };
    window.addEventListener('dinescan:menu-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      alive = false;
      window.removeEventListener('dinescan:menu-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [restaurantSlug]);

  const visibleCategories = categories.filter((c) => c.is_active);
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (!item.is_available) return false;
        const catOk =
          selectedCategory === 'all' || selectedCategory === 'recommended'
            ? selectedCategory === 'all' || item.is_recommended
            : item.category_id === selectedCategory;
        const filterOk =
          filter === 'all' ||
          (filter === 'veg' && item.food_type === 'veg') ||
          (filter === 'non-veg' && item.food_type === 'non-veg') ||
          (filter === 'bestseller' && item.is_bestseller);
        const q = search.trim().toLowerCase();
        const searchOk = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
        return catOk && filterOk && searchOk;
      }),
    [items, selectedCategory, filter, search]
  );

  const { themeColor, isCustom, syncWithRestaurant } = useTheme();

  useEffect(() => {
    if (restaurant?.primary_color) {
      syncWithRestaurant(restaurant.primary_color);
    }
  }, [restaurant?.primary_color, syncWithRestaurant]);

  if (!restaurant) {
    return <div className="flex min-h-screen items-center justify-center bg-[#fff8f3] text-slate-500">Loading menu...</div>;
  }

  const primary = isCustom ? themeColor : (restaurant.primary_color || themeColor || '#F97316');
  const tableQuery = tableNumber ? `?table=${encodeURIComponent(tableNumber)}` : '';

  const openItem = (item: MenuItem) => {
    navigate(`/menu/${restaurantSlug}/item/${item.id}${tableQuery}`);
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] text-slate-900">
      <div className="mx-auto min-h-screen w-full max-w-[760px] overflow-hidden bg-[#fffdfb] shadow-[0_0_80px_rgba(76,45,20,0.08)]">
        <section className="relative h-[300px] overflow-hidden bg-slate-950 sm:h-[340px]">
          <img
            src={restaurant.cover_url || demoRestaurant.cover_url || ''}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/90 text-slate-900 shadow-lg backdrop-blur"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setLiked((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/90 text-slate-900 shadow-lg backdrop-blur"
              aria-label="Favourite"
            >
              <Heart size={20} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <div className="flex items-end gap-4">
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] border-[3px] border-white bg-white shadow-xl">
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
                ) : (
                  <img src="/favicon.png" alt="DineScan" className="h-14 w-14 object-contain" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1 text-white">
                <h1 className="truncate text-[28px] font-black tracking-tight sm:text-3xl">{restaurant.name}</h1>
                <p className="truncate text-sm text-white/80">{restaurant.cuisines || 'Multi-Cuisine • Restaurant & Cafe'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Star size={14} className="fill-amber-300" /> {restaurant.rating}
                  </span>
                  <span className="text-white/35">•</span>
                  <span className="inline-flex items-center gap-1 text-white/85">
                    <Clock3 size={14} /> {restaurant.opening_time} – {restaurant.closing_time}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> {restaurant.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sleek Modern Table Banner */}
        <section className="bg-white px-3.5 pb-2.5 pt-3 sm:px-5">
          <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50/90 via-amber-50/50 to-orange-50/80 p-3 shadow-sm transition">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm border border-orange-100">
                <UtensilsCrossed size={18} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black tracking-tight text-slate-900 truncate">
                    {tableNumber ? `Table ${tableNumber}` : 'Table Not Set'}
                  </p>
                  <span className="inline-flex shrink-0 items-center rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-200/70 whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    Dine-In
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {tableNumber ? `Ordering for Table #${tableNumber}` : 'Tap to select or scan your table'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTableInput(tableNumber || '');
                setTableModalOpen(true);
              }}
              className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-orange-600 border border-orange-200 shadow-sm hover:bg-orange-50 active:scale-95 transition whitespace-nowrap"
            >
              {tableNumber ? 'Change' : '+ Set Table'}
            </button>
          </div>
        </section>

        {/* Sticky Search, Category Pills & Dietary Filters */}
        <section className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-3.5 pb-2.5 pt-2 backdrop-blur-xl sm:px-5">
          {/* Search bar with instant clear */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-slate-400 pointer-events-none" size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, starters, desserts..."
              className="h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50/90 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
              >
                <X size={13} />
              </button>
            ) : (
              <div className="absolute right-3 pointer-events-none text-slate-400">
                <SlidersHorizontal size={15} />
              </div>
            )}
          </div>

          {/* Categories Pill Bar with Emojis & Smooth Scroll */}
          <div className="scrollbar-hide mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 whitespace-nowrap',
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              )}
            >
              <span>🍽️</span>
              <span>All Menu</span>
            </button>
            <button
              onClick={() => setSelectedCategory('recommended')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 whitespace-nowrap',
                selectedCategory === 'recommended'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              )}
            >
              <span>⭐</span>
              <span>Recommended</span>
            </button>
            {visibleCategories
              .filter((c) => c.name !== 'Recommended')
              .map((c) => {
                const active = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 whitespace-nowrap',
                      active
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    )}
                  >
                    <span>{c.icon || '🍽️'}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
          </div>

          {/* Quick Dietary Filters */}
          <div className="scrollbar-hide mt-2 flex items-center gap-2 overflow-x-auto pb-0.5">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition active:scale-95 whitespace-nowrap',
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter(filter === 'veg' ? 'all' : 'veg')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition active:scale-95 whitespace-nowrap',
                filter === 'veg'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
              )}
            >
              <span className="flex h-3 w-3 items-center justify-center rounded border border-emerald-600 p-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              </span>
              Veg Only
            </button>
            <button
              onClick={() => setFilter(filter === 'non-veg' ? 'all' : 'non-veg')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition active:scale-95 whitespace-nowrap',
                filter === 'non-veg'
                  ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50/40'
              )}
            >
              <span className="flex h-3 w-3 items-center justify-center rounded border border-rose-600 p-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
              </span>
              Non-Veg
            </button>
            <button
              onClick={() => setFilter(filter === 'bestseller' ? 'all' : 'bestseller')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition active:scale-95 whitespace-nowrap',
                filter === 'bestseller'
                  ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/40'
              )}
            >
              <Flame size={13} className="text-amber-500 fill-amber-400" />
              Bestsellers
            </button>
          </div>
        </section>

        <main className="px-4 pb-36 pt-5 sm:px-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  {selectedCategory === 'all'
                    ? 'All Items'
                    : selectedCategory === 'recommended'
                      ? 'Recommended'
                      : visibleCategories.find((c) => c.id === selectedCategory)?.name || 'All Items'}
                </h2>
                {selectedCategory === 'recommended' && <Sparkles size={18} className="text-orange-500" />}
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-400">{filtered.length} delicious choices</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_7px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.11)]"
              >
                <button onClick={() => openItem(item)} className="relative block h-[146px] w-full overflow-hidden bg-slate-100 text-left sm:h-[180px]">
                  <img
                    src={item.image_url || FALLBACK_FOOD}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  {item.is_bestseller && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black text-white shadow-lg">
                      Bestseller
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md">
                    <Heart size={14} />
                  </span>
                </button>

                <div className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    <FoodTypeIcon type={item.food_type} />
                    <button onClick={() => openItem(item)} className="min-w-0 flex-1 text-left">
                      <h3 className="truncate text-[14px] font-black text-slate-900 sm:text-[15px]">{item.name}</h3>
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-[34px] text-[11px] leading-[17px] text-slate-500">
                    {item.description || 'Freshly prepared with premium ingredients.'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                    <span className="inline-flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" /> {item.rating || 4.8}</span>
                    <span>•</span>
                    <span>{item.prep_time || 15} min</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-black text-slate-950">{formatCurrency(Number(item.discount_price ?? item.price))}</span>
                      {item.discount_price && restaurant.show_discount && (
                        <span className="ml-1 text-[10px] text-slate-400 line-through">{formatCurrency(Number(item.price))}</span>
                      )}
                    </div>
                    <button
                      onClick={() => addItem(item, [], '', 1)}
                      className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-600 transition active:scale-95"
                    >
                      <span className="text-base leading-none">+</span> Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!filtered.length && (
            <div className="py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Search size={24} />
              </div>
              <p className="mt-4 font-black text-slate-800">No dishes found</p>
              <p className="mt-1 text-sm text-slate-500">Try another category or search term.</p>
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[760px] -translate-x-1/2 border-t border-slate-200/80 bg-white/95 px-5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
          {totalItems > 0 && (
            <button
              onClick={() => navigate(`/menu/${restaurantSlug}/cart${tableQuery}`)}
              className="mb-2.5 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)]"
              style={{ backgroundColor: primary }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-black">
                <ShoppingBag size={17} /> {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
              </span>
              <span className="text-sm font-black">View Cart • {formatCurrency(totalAmount)}</span>
            </button>
          )}
          <div className="grid grid-cols-4">
            <button className="flex flex-col items-center gap-1 py-1 text-orange-500">
              <UtensilsCrossed size={19} />
              <span className="text-[10px] font-black">Menu</span>
            </button>
            <button onClick={() => navigate(`/menu/${restaurantSlug}/cart${tableQuery}`)} className="relative flex flex-col items-center gap-1 py-1 text-slate-400">
              <ShoppingBag size={19} />
              {totalItems > 0 && <span className="absolute left-1/2 top-0 ml-2 rounded-full bg-orange-500 px-1.5 text-[9px] font-black text-white">{totalItems}</span>}
              <span className="text-[10px] font-bold">Cart</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-1 text-slate-400">
              <Tag size={19} />
              <span className="text-[10px] font-bold">Offers</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-1 text-slate-400">
              <MenuIcon size={19} />
              <span className="text-[10px] font-bold">More</span>
            </button>
          </div>
        </nav>

        <footer className="hidden border-t border-slate-100 px-5 py-5 text-center text-xs text-slate-400 sm:block">
          <p className="font-semibold text-slate-600">Powered by DineScan</p>
          <p className="mt-1 inline-flex items-center gap-1"><MapPin size={12} /> {restaurant.address}</p>
        </footer>

        {/* Table Number Selection Modal */}
        {tableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Select Table</h3>
                    <p className="text-xs text-slate-500">Pick quick table or enter your number</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700">Quick Select</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTableInput(t)}
                      className={cn(
                        'rounded-xl border py-2.5 text-xs font-bold transition active:scale-95',
                        tableInput === t
                          ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      Table {t}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-slate-700">Custom Table / Area</label>
                  <input
                    type="text"
                    value={tableInput}
                    onChange={(e) => setTableInput(e.target.value)}
                    placeholder="e.g. Table 12, Rooftop 3, T-04"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 transition"
                  />
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTableModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = tableInput.trim();
                      if (trimmed) {
                        setTableNumber(trimmed);
                        navigate(`/menu/${restaurantSlug}?table=${encodeURIComponent(trimmed)}`, { replace: true });
                      }
                      setTableModalOpen(false);
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/25 active:scale-95 transition"
                  >
                    Confirm Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
