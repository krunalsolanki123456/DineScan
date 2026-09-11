import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  Check,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock3,
  Eye,
  LogOut,
  Maximize2,
  Settings,
  Users,
  Wifi,
  X,
  Printer,
  User,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getOrderItems, getOrders, updateOrderStatus } from '@/lib/services';
import type { Order, OrderItem } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { demoOrders } from '@/data/demo';

type OrderWithItems = Order & { items: OrderItem[] };
type Stage = 'new' | 'preparing' | 'ready';

type StageConfig = {
  key: Stage;
  title: string;
  subtitle: string;
  next: string;
  action: string;
  headerClass: string;
  borderClass: string;
  countClass: string;
  buttonClass: string;
  icon: typeof ClipboardList;
};

const stages: StageConfig[] = [
  {
    key: 'new',
    title: 'New Orders',
    subtitle: 'Just received • Start preparing',
    next: 'preparing',
    action: 'Start Preparing',
    headerClass: 'from-red-950/80 via-red-900/55 to-orange-950/45',
    borderClass: 'border-red-500/55',
    countClass: 'bg-red-500 text-white',
    buttonClass: 'from-orange-500 to-orange-400 text-white',
    icon: ClipboardList,
  },
  {
    key: 'preparing',
    title: 'Preparing',
    subtitle: 'In progress • Keep it up!',
    next: 'ready',
    action: 'Mark Ready',
    headerClass: 'from-amber-950/85 via-yellow-900/55 to-amber-950/45',
    borderClass: 'border-amber-400/60',
    countClass: 'bg-amber-400 text-slate-950',
    buttonClass: 'from-yellow-400 to-amber-400 text-slate-950',
    icon: ChefHat,
  },
  {
    key: 'ready',
    title: 'Ready',
    subtitle: 'Completed • Serve to guests',
    next: 'served',
    action: 'Mark Served',
    headerClass: 'from-emerald-950/85 via-teal-900/55 to-emerald-950/45',
    borderClass: 'border-emerald-400/60',
    countClass: 'bg-emerald-400 text-slate-950',
    buttonClass: 'from-emerald-400 to-green-400 text-slate-950',
    icon: CheckCircle2,
  },
];

const demoItems: Record<string, { name: string; quantity: number }[]> = {
  DS1028: [
    { name: 'Margherita Pizza', quantity: 1 },
    { name: 'Caesar Salad', quantity: 2 },
    { name: 'Garlic Bread', quantity: 1 },
    { name: 'Spaghetti Bolognese', quantity: 1 },
    { name: 'Chicken Wings', quantity: 1 },
    { name: 'Coke', quantity: 2 },
  ],
  DS1024: [
    { name: 'Grilled Chicken', quantity: 1 },
    { name: 'French Fries', quantity: 1 },
    { name: 'Mushroom Soup', quantity: 1 },
    { name: 'Iced Lemon Tea', quantity: 2 },
  ],
  DS1029: [
    { name: 'Veg Burger', quantity: 2 },
    { name: 'Cold Coffee', quantity: 2 },
    { name: 'French Fries', quantity: 1 },
  ],
  DS1027: [
    { name: 'Paneer Tikka', quantity: 2 },
    { name: 'Dal Makhani', quantity: 1 },
    { name: 'Butter Naan', quantity: 2 },
    { name: 'Veg Biryani', quantity: 1 },
    { name: 'Raita', quantity: 1 },
  ],
  DS1025: [
    { name: 'Chicken Biryani', quantity: 1 },
    { name: 'Raita', quantity: 1 },
    { name: 'Mint Mojito', quantity: 2 },
    { name: 'Chocolate Brownie', quantity: 1 },
    { name: 'Vanilla Ice Cream', quantity: 1 },
  ],
  DS1030: [
    { name: 'Veg Noodles', quantity: 2 },
    { name: 'Manchurian', quantity: 1 },
    { name: 'Spring Rolls', quantity: 1 },
  ],
  DS1026: [
    { name: 'Masala Dosa', quantity: 1 },
    { name: 'Sambar', quantity: 1 },
    { name: 'Coconut Chutney', quantity: 1 },
    { name: 'Filter Coffee', quantity: 3 },
    { name: 'Medu Vada', quantity: 1 },
  ],
  DS1023: [
    { name: 'Chicken Tikka', quantity: 1 },
    { name: 'Laccha Paratha', quantity: 1 },
    { name: 'Paneer Butter Masala', quantity: 1 },
    { name: 'Steamed Rice', quantity: 1 },
    { name: 'Mango Lassi', quantity: 2 },
  ],
  DS1021: [
    { name: 'Veg Pizza', quantity: 1 },
    { name: 'Chocolate Brownie', quantity: 2 },
    { name: 'Cold Coffee', quantity: 1 },
  ],
};

const foodImages: Record<string, string> = {
  'Margherita Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=100&q=80',
  'Caesar Salad': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=100&q=80',
  'Garlic Bread': 'https://images.unsplash.com/photo-1573140401552-3fab0b24427f?auto=format&fit=crop&w=100&q=80',
  'Spaghetti Bolognese': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=100&q=80',
  'Chicken Wings': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=100&q=80',
  Coke: 'https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=100&q=80',
  'Grilled Chicken': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=100&q=80',
  'French Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=100&q=80',
  'Mushroom Soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=100&q=80',
  'Iced Lemon Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=100&q=80',
  'Veg Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80',
  'Cold Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=100&q=80',
  'Paneer Tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=100&q=80',
  'Dal Makhani': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=100&q=80',
  'Butter Naan': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=100&q=80',
  'Veg Biryani': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=100&q=80',
  Raita: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=100&q=80',
  'Chicken Biryani': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=100&q=80',
  'Mint Mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=100&q=80',
  'Chocolate Brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80',
  'Vanilla Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=100&q=80',
  'Veg Noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=100&q=80',
  Manchurian: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=100&q=80',
  'Spring Rolls': 'https://images.unsplash.com/photo-1548507200-8c84aa978c9c?auto=format&fit=crop&w=100&q=80',
  'Masala Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=100&q=80',
  Sambar: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=100&q=80',
  'Coconut Chutney': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=100&q=80',
  'Filter Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80',
  'Medu Vada': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=100&q=80',
  'Chicken Tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=100&q=80',
  'Laccha Paratha': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=100&q=80',
  'Paneer Butter Masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=100&q=80',
  'Steamed Rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=100&q=80',
  'Mango Lassi': 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?auto=format&fit=crop&w=100&q=80',
  'Veg Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=100&q=80',
  'Tandoori Roti': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=100&q=80',
  'Butter Roti': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=100&q=80',
  Roti: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=100&q=80',
};

function makeItems(order: Order, source?: { name: string; quantity: number }[]): OrderItem[] {
  const list = source || demoItems[order.order_number || ''] || [];
  return list.map((item, index) => ({
    id: `${order.id}-kds-${index}`,
    order_id: order.id,
    menu_item_id: null,
    name: item.name,
    quantity: item.quantity,
    price: 0,
    addons: null,
    special_instructions: null,
    created_at: order.created_at,
  }));
}

function activeForStage(orders: OrderWithItems[], key: Stage) {
  if (key === 'new') return orders.filter((o) => ['new', 'accepted'].includes(o.status));
  return orders.filter((o) => o.status === key);
}

function ageMinutes(date: string) {
  return Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
}

function createDisplayDemoOrders(restaurantId: string): OrderWithItems[] {
  const byNum = new Map(demoOrders.map((o) => [o.order_number, o]));
  const clone = (num: string, status: string, table: string, minutes: number, total: number, note: string | null = null): OrderWithItems => {
    const base = byNum.get(num) || demoOrders[0];
    const order: Order = {
      ...base,
      id: `kds-${num}`,
      order_number: num,
      restaurant_id: restaurantId,
      table_number: table,
      status,
      grand_total: total,
      special_instructions: note,
      created_at: new Date(Date.now() - minutes * 60000).toISOString(),
      updated_at: new Date(Date.now() - Math.max(1, minutes - 1) * 60000).toISOString(),
    };
    return { ...order, items: makeItems(order) };
  };

  return [
    clone('DS1028', 'new', '12', 2, 748, 'Less spicy please'),
    clone('DS1024', 'accepted', '07', 6, 980),
    clone('DS1029', 'new', '15', 8, 560),
    clone('DS1027', 'preparing', '08', 8, 620),
    clone('DS1025', 'preparing', '03', 14, 560),
    clone('DS1030', 'preparing', '11', 18, 690),
    clone('DS1026', 'ready', '05', 12, 430),
    clone('DS1023', 'ready', '01', 16, 420),
    clone('DS1021', 'ready', '09', 20, 840),
  ];
}

function printKOT(order: OrderWithItems, restaurantName: string) {
  const dateStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:6px 0;font-size:15px;font-weight:bold;border-bottom:1px dashed #bbb;">${item.name}</td>
      <td style="padding:6px 0;font-size:17px;font-weight:900;text-align:right;border-bottom:1px dashed #bbb;">× ${item.quantity}</td>
    </tr>
    ${item.addons ? `<tr><td colspan="2" style="font-size:11px;color:#555;padding-bottom:4px;">↳ Addons: ${item.addons}</td></tr>` : ''}
    ${item.special_instructions ? `<tr><td colspan="2" style="font-size:11px;color:#d97706;padding-bottom:4px;">📝 ${item.special_instructions}</td></tr>` : ''}
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>KOT - Order #${order.order_number}</title>
  <style>
    body { font-family: monospace, sans-serif; padding: 12px; width: 280px; margin: 0 auto; color: #000; }
    .center { text-align: center; }
    .dashed { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="center">
    <h2 style="margin:0;font-size:18px;letter-spacing:1px;">KITCHEN TICKET (KOT)</h2>
    <p style="margin:2px 0;font-size:13px;font-weight:bold;">${restaurantName}</p>
    <div class="dashed"></div>
    <div style="font-size:18px;font-weight:900;margin:3px 0;">${order.table_number ? `TABLE: ${order.table_number}` : 'TAKEAWAY'}</div>
    <div style="font-size:14px;font-weight:bold;">ORDER: #${order.order_number}</div>
    <div style="font-size:12px;color:#333;">Time: ${dateStr}</div>
    <div class="dashed"></div>
  </div>
  <table>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
  ${order.special_instructions ? `
    <div class="dashed"></div>
    <div style="font-size:12px;font-weight:bold;background:#eee;padding:6px;border-radius:4px;">
      ⚠️ INSTRUCTION: ${order.special_instructions}
    </div>
  ` : ''}
  <div class="dashed"></div>
  <div class="center" style="font-size:11px;color:#666;">DineScan Kitchen Display</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
  const w = window.open('', '_blank', 'width=380,height=550');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export default function KitchenPage() {
  const { restaurant, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const load = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const base = await getOrders(restaurant.id);
      const active = base.filter((o) => ['new', 'accepted', 'preparing', 'ready'].includes(o.status));

      if (!active.length) {
        setOrders(createDisplayDemoOrders(restaurant.id));
        return;
      }

      const full = await Promise.all(
        active.map(async (order) => {
          try {
            const fetched = await getOrderItems(order.id);
            return { ...order, items: fetched.length ? fetched : makeItems(order) };
          } catch {
            return { ...order, items: makeItems(order) };
          }
        })
      );
      setOrders(full);
    } catch {
      setOrders(createDisplayDemoOrders(restaurant.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const refreshId = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(refreshId);
  }, [restaurant?.id]);

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clockId);
  }, []);

  const move = async (order: OrderWithItems, status: string) => {
    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status } : item)).filter((item) => item.status !== 'served'));
    if (!order.id.startsWith('kds-')) {
      try {
        await updateOrderStatus(order.id, status);
      } catch {
        // UI already updated; next refresh will reconcile server state.
      }
    }
  };

  const counts = useMemo(
    () => ({
      new: activeForStage(orders, 'new').length,
      preparing: activeForStage(orders, 'preparing').length,
      ready: activeForStage(orders, 'ready').length,
    }),
    [orders]
  );

  const averagePrep = useMemo(() => {
    if (!orders.length) return 12;
    return Math.max(1, Math.round(orders.reduce((sum, order) => sum + (order.estimated_prep_time || 12), 0) / orders.length));
  }, [orders]);

  const urgentCount = useMemo(() => orders.filter((o) => o.special_instructions || ageMinutes(o.created_at) >= 20).length, [orders]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#06101e] text-white">
      <header className="border-b border-white/10 bg-[#07111f] px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex items-center gap-3 border-r border-white/10 pr-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-[0_10px_30px_rgba(249,115,22,0.35)]">
                <ChefHat size={26} />
              </div>
              <div>
                <div className="text-[28px] font-black leading-none tracking-tight">
                  <span>Dine</span><span className="text-orange-400">Scan</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">Kitchen Display System</p>
              </div>
            </div>

            <div className="hidden min-w-[180px] md:block">
              <p className="text-xl font-extrabold">{restaurant?.name || 'SK Restaurant'}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Live Orders</p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#0b1829] xl:flex">
              <div className="flex min-w-[145px] items-center gap-3 border-r border-white/10 px-5 py-3">
                <ClipboardList className="text-orange-400" size={22} />
                <div><p className="text-2xl font-black leading-none">{counts.new}</p><p className="mt-1 text-xs text-slate-400">New Orders</p></div>
              </div>
              <div className="flex min-w-[145px] items-center gap-3 border-r border-white/10 px-5 py-3">
                <ChefHat className="text-amber-400" size={22} />
                <div><p className="text-2xl font-black leading-none">{counts.preparing}</p><p className="mt-1 text-xs text-slate-400">Preparing</p></div>
              </div>
              <div className="flex min-w-[125px] items-center gap-3 border-r border-white/10 px-5 py-3">
                <CheckCircle2 className="text-emerald-400" size={22} />
                <div><p className="text-2xl font-black leading-none">{counts.ready}</p><p className="mt-1 text-xs text-slate-400">Ready</p></div>
              </div>
              <div className="flex min-w-[160px] items-center gap-3 px-5 py-3">
                <Clock3 className="text-slate-400" size={23} />
                <div><p className="text-2xl font-black leading-none">{averagePrep} min</p><p className="mt-1 text-xs text-slate-400">Avg. Prep Time</p></div>
              </div>
            </div>

            <div className="hidden text-right lg:block">
              <p className="text-xl font-black">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-slate-400">{now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>

            <button className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-slate-300 hover:bg-white/10" title="Fullscreen">
              <Maximize2 size={18} />
            </button>
            <button className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-slate-300 hover:bg-white/10" title="Settings">
              <Settings size={18} />
            </button>
            <button onClick={() => void handleSignOut()} className="inline-flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500/20">
              <LogOut size={17} /> End Shift
            </button>
          </div>
        </div>
      </header>

      <main className="grid gap-4 p-4 xl:grid-cols-3">
        {stages.map((stage) => {
          const stageOrders = activeForStage(orders, stage.key);
          const StageIcon = stage.icon;
          return (
            <section key={stage.key} className={`overflow-hidden rounded-2xl border ${stage.borderClass} bg-[#081425] shadow-[0_22px_70px_rgba(0,0,0,0.28)]`}>
              <div className={`bg-gradient-to-r ${stage.headerClass} px-5 py-4`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${stage.borderClass} bg-black/20`}>
                    <StageIcon size={23} className={stage.key === 'new' ? 'text-orange-400' : stage.key === 'preparing' ? 'text-amber-300' : 'text-emerald-300'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight">{stage.title}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${stage.countClass}`}>{stageOrders.length}</span>
                    </div>
                    <p className="text-sm text-slate-300">{stage.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-2.5">
                {stageOrders.map((order) => {
                  const items = order.items.length ? order.items : makeItems(order);
                  const minutes = ageMinutes(order.created_at);
                  const isTakeaway = !order.table_number;
                  const prepLeft = Math.max(4, (order.estimated_prep_time || 20) - minutes);
                  return (
                    <article key={order.id} className={`rounded-2xl border ${stage.borderClass} bg-[linear-gradient(145deg,rgba(17,31,50,0.98),rgba(9,21,37,0.98))] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-400">#{order.order_number || order.id}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-4">
                            <h3 className="text-3xl font-black tracking-tight">Table {order.table_number || '—'}</h3>
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-300"><Users size={15} /> {Math.min(5, Math.max(2, Math.round(items.length / 2) + 1))} guests</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300"><Clock3 size={14} className="text-emerald-200" /> {formatRelativeTime(order.created_at)}</span>
                          <span className={`rounded-lg px-3 py-1 text-sm font-black ${isTakeaway ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}>{isTakeaway ? 'Takeaway' : 'Dine In'}</span>
                        </div>
                      </div>

                      <div className={`mt-3 grid gap-3 ${stage.key === 'preparing' || stage.key === 'ready' ? 'md:grid-cols-[1fr_auto]' : ''}`}>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                              <img
                                src={foodImages[item.name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                                alt=""
                                className="h-9 w-9 rounded-full border border-white/10 object-cover shadow-md"
                              />
                              <p className="min-w-0 truncate text-[15px] font-semibold text-slate-100">{item.name}</p>
                              <p className="text-sm font-bold text-slate-100">× {item.quantity}</p>
                            </div>
                          ))}
                        </div>

                        {stage.key === 'preparing' && (
                          <div className="flex items-center justify-center px-2">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full border-[8px] border-slate-600/60 border-t-amber-400 border-r-orange-500 bg-[#07111f] text-center shadow-inner">
                              <div><p className="text-xl font-black leading-none">{prepLeft}:00</p><p className="mt-1 text-xs font-semibold text-slate-400">min left</p></div>
                            </div>
                          </div>
                        )}

                        {stage.key === 'ready' && (
                          <div className="flex min-w-[120px] flex-col items-center justify-center border-l border-white/5 pl-4 text-emerald-300">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-[0_10px_30px_rgba(52,211,153,0.25)]"><Check size={34} strokeWidth={3} /></div>
                            <p className="mt-2 text-lg font-black">Ready!</p>
                            <p className="text-xs text-emerald-100/70">{minutes} minutes</p>
                          </div>
                        )}
                      </div>

                      {order.special_instructions && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                          <BellRing size={15} className="text-amber-300" />
                          <span className="font-semibold">Note:</span> {order.special_instructions}
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#203149] px-4 py-2.5 text-sm font-bold text-slate-100 hover:bg-[#293d59] transition active:scale-95"
                        >
                          <Eye size={16} /> View Details
                        </button>
                        <button onClick={() => void move(order, stage.next)} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${stage.buttonClass} px-4 py-2.5 text-sm font-black shadow-lg hover:brightness-105`}>
                          {stage.key === 'new' ? '▶' : '✓'} {stage.action}
                        </button>
                      </div>
                    </article>
                  );
                })}

                {!stageOrders.length && (
                  <div className="py-16 text-center text-sm text-slate-500">No orders</div>
                )}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="flex flex-col gap-2 border-t border-white/10 bg-[#07111f] px-5 py-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 font-bold text-amber-300"><BellRing size={16} /> Kitchen Alert <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-950">{urgentCount}</span></span>
          <span className="text-slate-600">|</span>
          <span>High priority order on Table 12</span>
          <span className="text-slate-600">|</span>
          <span>{orders.length} orders pending</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="italic text-slate-400">“Good food brings people together” — DineScan</span>
          <span className="text-slate-600">|</span>
          <span className="inline-flex items-center gap-2 font-bold text-emerald-300"><Wifi size={16} /> System Online</span>
        </div>
      </footer>

      {/* 📋 Kitchen Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0b1829] text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#07111f] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <ChefHat size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-white">Order #{selectedOrder.order_number}</h3>
                    <span className="rounded-md bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-xs font-bold text-orange-300">
                      {selectedOrder.table_number ? `Table ${selectedOrder.table_number}` : 'Takeaway'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Clock3 size={12} /> Placed {ageMinutes(selectedOrder.created_at)} mins ago • {new Date(selectedOrder.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Customer details if present */}
              {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span>Customer: <strong className="text-white">{selectedOrder.customer_name || 'Guest'}</strong></span>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone size={13} />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Special Cooking Note / Allergy alert */}
              {selectedOrder.special_instructions && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
                  <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Chef Cooking Instruction</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedOrder.special_instructions}</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Items to Prepare ({selectedOrder.items.length})</h4>
                  <span className="text-xs text-slate-400">Total items: {selectedOrder.items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="space-y-2.5">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#07111f] p-3.5 hover:border-white/20 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={foodImages[item.name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="h-12 w-12 rounded-xl border border-white/10 object-cover shadow"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-100 text-sm truncate">{item.name}</p>
                          {item.addons && (
                            <p className="text-xs text-slate-400 mt-0.5">↳ <span className="text-orange-300">{item.addons}</span></p>
                          )}
                          {item.special_instructions && (
                            <p className="text-xs text-amber-300 mt-0.5 font-medium">📝 {item.special_instructions}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center justify-center rounded-lg bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 text-base font-black text-orange-400">
                          × {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/10 bg-[#07111f] px-6 py-4">
              <button
                type="button"
                onClick={() => printKOT(selectedOrder, restaurant?.name || 'SK Restaurant')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
              >
                <Printer size={15} /> Print KOT Ticket
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
                >
                  Close
                </button>
                {['new', 'accepted'].includes(selectedOrder.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      void move(selectedOrder, 'preparing');
                      setSelectedOrder(null);
                    }}
                    className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow hover:brightness-110 transition"
                  >
                    ▶ Start Preparing
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button
                    type="button"
                    onClick={() => {
                      void move(selectedOrder, 'ready');
                      setSelectedOrder(null);
                    }}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow hover:brightness-110 transition"
                  >
                    ✓ Mark Ready
                  </button>
                )}
                {selectedOrder.status === 'ready' && (
                  <button
                    type="button"
                    onClick={() => {
                      void move(selectedOrder, 'served');
                      setSelectedOrder(null);
                    }}
                    className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow hover:brightness-110 transition"
                  >
                    ✓ Mark Served
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="fixed right-4 top-24 rounded-full border border-white/10 bg-slate-950/90 px-3 py-1.5 text-xs font-semibold text-slate-300">Refreshing kitchen orders…</div>}
    </div>
  );
}
