import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Minus, Plus, ShieldCheck, Sparkles, Trash2, UserRound, UtensilsCrossed } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { createOrder, createOrderItems, getRestaurantBySlug, getSettings, getTables, recordCustomerFromOrder } from '@/lib/services';
import type { Restaurant, RestaurantSettings, RestaurantTable } from '@/types';
import { formatCurrency, generateOrderNumber } from '@/lib/utils';
import { demoRestaurant, demoTables } from '@/data/demo';

const FALLBACK_FOOD = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';

export default function CartPage() {
  const { restaurantSlug = 'sk-restaurant' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalAmount, tableNumber, setTableNumber } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant>({ ...demoRestaurant, slug: restaurantSlug });
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tableParam = params.get('table');
    if (tableParam) setTableNumber(tableParam);
  }, [params, setTableNumber]);

  useEffect(() => {
    (async () => {
      try {
        const r = await getRestaurantBySlug(restaurantSlug);
        if (r) {
          setRestaurant(r);
          const [s, t] = await Promise.all([getSettings(r.id), getTables(r.id)]);
          setSettings(s);
          setTables(t.length ? t : demoTables.map((x) => ({ ...x, restaurant_id: r.id })));
        }
      } catch {
        // Use safe demo fallback.
      }
    })();
  }, [restaurantSlug]);

  const gst = Number(settings?.gst_percentage ?? 5);
  const service = Number(settings?.service_charge_percentage ?? 0);
  const tax = (totalAmount * gst) / 100;
  const serviceCharge = (totalAmount * service) / 100;
  const grand = totalAmount + tax + serviceCharge;
  const { themeColor, isCustom } = useTheme();
  const table = tables.find((t) => t.table_number === tableNumber);
  const primary = isCustom ? themeColor : (restaurant.primary_color || themeColor || '#F97316');
  const tableQuery = tableNumber ? `?table=${encodeURIComponent(tableNumber)}` : '';

  const placeOrder = async () => {
    setError(null);
    if (!tableNumber) {
      setError('Table number is missing. Please scan the table QR again.');
      return;
    }
    if (settings?.require_customer_name && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (settings?.require_phone_number && !phone.trim()) {
      setError('Please enter your mobile number.');
      return;
    }
    if (!items.length) return;

    setPlacing(true);
    const orderNumber = generateOrderNumber();
    try {
      let order: any;
      if (restaurant.id.startsWith('demo-')) {
        order = {
          id: `demo-order-${Date.now()}`,
          order_number: orderNumber,
          restaurant_id: restaurant.id,
          table_id: table && !table.id.startsWith('demo-') ? table.id : null,
          customer_id: null,
          customer_name: name || 'Guest',
          customer_phone: phone || null,
          table_number: tableNumber,
          status: 'new',
          items_total: totalAmount,
          tax_amount: tax,
          service_charge: serviceCharge,
          discount_amount: 0,
          grand_total: grand,
          special_instructions: notes || null,
          estimated_prep_time: 18,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        order = await createOrder({
          restaurant_id: restaurant.id,
          table_id: table && !table.id.startsWith('demo-') ? table.id : null,
          customer_name: name || null,
          customer_phone: phone || null,
          table_number: tableNumber,
          status: settings?.auto_accept_orders ? 'accepted' : 'new',
          items_total: totalAmount,
          tax_amount: tax,
          service_charge: serviceCharge,
          discount_amount: 0,
          grand_total: grand,
          special_instructions: notes || null,
          estimated_prep_time: 18,
          order_number: orderNumber,
        });
        if (!order) throw new Error('Order not created');
        await createOrderItems(
          items.map((ci) => ({
            order_id: order.id,
            menu_item_id: ci.menu_item.id.startsWith('demo-') ? null : ci.menu_item.id,
            name: ci.menu_item.name,
            quantity: ci.quantity,
            price: ci.unit_price,
            addons: ci.addons.map((a) => a.name).join(', ') || null,
            special_instructions: ci.special_instructions || null,
          }))
        );
      }

      if (name.trim() || phone.trim()) {
        const topDish = items[0]?.menu_item?.name || null;
        void recordCustomerFromOrder({
          restaurant_id: restaurant.id,
          customer_name: name.trim() || null,
          customer_phone: phone.trim() || null,
          grand_total: grand,
          favorite_dish: topDish,
        });
      }

      sessionStorage.setItem(
        'dinescan:lastOrder',
        JSON.stringify({
          order,
          items: items.map((ci) => ({ name: ci.menu_item.name, quantity: ci.quantity, price: ci.unit_price })),
          restaurant,
        })
      );
      clearCart();
      navigate(`/order/${order.id}`);
    } catch (e) {
      console.error(e);
      setError('Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#fff8f3] px-4 py-8">
        <div className="mx-auto max-w-lg">
          <Link to={`/menu/${restaurantSlug}${tableQuery}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft size={18} /> Back to menu</Link>
          <div className="mt-24 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-orange-50 text-orange-500"><UtensilsCrossed size={32} /></div>
            <h1 className="mt-5 text-2xl font-black text-slate-950">Your cart is empty</h1>
            <p className="mt-2 text-sm text-slate-500">Add something delicious from the menu.</p>
            <Link to={`/menu/${restaurantSlug}${tableQuery}`} className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white">Browse Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <div className="mx-auto min-h-screen w-full max-w-[620px] bg-white shadow-[0_0_80px_rgba(76,45,20,0.08)]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-xl">
          <Link to={`/menu/${restaurantSlug}${tableQuery}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-800"><ArrowLeft size={19} /></Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-slate-950">Your Cart</h1>
            <p className="truncate text-xs text-slate-400">Table {tableNumber || '—'} • {restaurant.name}</p>
          </div>
          <div className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-600">{totalItems} items</div>
        </header>

        <main className="pb-28">
          <section className="divide-y divide-slate-100 px-4 sm:px-5">
            {items.map((ci, index) => (
              <article key={`${ci.menu_item.id}-${index}`} className="py-4">
                <div className="flex gap-3.5">
                  <img src={ci.menu_item.image_url || FALLBACK_FOOD} alt={ci.menu_item.name} className="h-[82px] w-[82px] rounded-2xl object-cover shadow-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{ci.menu_item.name}</p>
                        {ci.addons.length > 0 && <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">+ {ci.addons.map((a) => a.name).join(', ')}</p>}
                        {ci.special_instructions && <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">Note: {ci.special_instructions}</p>}
                      </div>
                      <button onClick={() => removeItem(index)} className="rounded-full p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-base font-black text-slate-950">{formatCurrency(ci.unit_price * ci.quantity)}</p>
                      <div className="flex items-center rounded-full bg-slate-100 p-1">
                        <button onClick={() => updateQuantity(index, -1)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700"><Minus size={14} /></button>
                        <span className="w-7 text-center text-xs font-black">{ci.quantity}</span>
                        <button onClick={() => updateQuantity(index, 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="h-2 bg-[#fff8f3]" />
          <section className="px-4 py-5 sm:px-5">
            <div className="mb-3 flex items-center gap-2">
              <UserRound size={18} className="text-orange-500" />
              <h2 className="text-sm font-black text-slate-900">Customer Details</h2>
              <span className="text-xs text-slate-400">(optional)</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300 focus:bg-white" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300 focus:bg-white" />
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any special requests? (e.g. less spicy, no onion...)" className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none focus:border-orange-300 focus:bg-white" />
          </section>

          <div className="h-2 bg-[#fff8f3]" />
          <section className="px-4 py-5 sm:px-5">
            <h2 className="text-base font-black text-slate-950">Order Summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(totalAmount)}</span></div>
              <div className="flex justify-between text-slate-500"><span>CGST ({gst / 2}%)</span><span>{formatCurrency(tax / 2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>SGST ({gst / 2}%)</span><span>{formatCurrency(tax / 2)}</span></div>
              {service > 0 && <div className="flex justify-between text-slate-500"><span>Service Charge ({service}%)</span><span>{formatCurrency(serviceCharge)}</span></div>}
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-4 text-lg font-black text-slate-950"><span>Total</span><span>{formatCurrency(grand)}</span></div>
            </div>
          </section>

          <section className="mx-4 mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-orange-50 p-3 text-center sm:mx-5">
            <div className="text-[10px] font-bold text-orange-800"><Sparkles className="mx-auto mb-1 text-orange-500" size={16} />Freshly Prepared</div>
            <div className="text-[10px] font-bold text-orange-800"><ShieldCheck className="mx-auto mb-1 text-orange-500" size={16} />Hygienic Kitchen</div>
            <div className="text-[10px] font-bold text-orange-800"><CheckCircle2 className="mx-auto mb-1 text-orange-500" size={16} />Quality Checked</div>
          </section>

          {error && <div className="mx-4 mb-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-600 sm:mx-5">{error}</div>}
        </main>

        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[620px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <button
            disabled={placing}
            onClick={() => void placeOrder()}
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-2xl text-sm font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.25)] disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            {placing ? 'Placing Order...' : <>Place Order <span className="h-5 w-px bg-white/30" /> {formatCurrency(grand)}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
