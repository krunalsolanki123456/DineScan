import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getOrders, getMenuItems, getTables } from '@/lib/services';
import type { Order, MenuItem, RestaurantTable } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { StatCard, StatusBadge, SkeletonCard, EmptyState } from '@/components/ui';
import { demoMenuItems, demoOrders, demoTables } from '@/data/demo';
import {
  ShoppingCart,
  IndianRupee,
  Table2,
  UtensilsCrossed,
  TrendingUp,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const revenueData7 = [
  { day: 'Mon', revenue: 3200 },
  { day: 'Tue', revenue: 4100 },
  { day: 'Wed', revenue: 3800 },
  { day: 'Thu', revenue: 5200 },
  { day: 'Fri', revenue: 6800 },
  { day: 'Sat', revenue: 8200 },
  { day: 'Sun', revenue: 7400 },
];

const revenueData30 = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  revenue: 3000 + Math.floor(Math.random() * 6000),
}));

const revenueData90 = Array.from({ length: 90 }, (_, i) => ({
  day: `${i + 1}`,
  revenue: 2500 + Math.floor(Math.random() * 7000),
}));

const statusData = [
  { name: 'New', value: 1, color: '#3B82F6' },
  { name: 'Preparing', value: 1, color: '#F97316' },
  { name: 'Ready', value: 1, color: '#16A34A' },
  { name: 'Completed', value: 6, color: '#64748B' },
];

export default function DashboardPage() {
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'7' | '30' | '90'>('7');

  useEffect(() => {
    if (!restaurant) return;
    (async () => {
      setLoading(true);
      try {
        const [o, m, t] = await Promise.all([
          getOrders(restaurant.id),
          getMenuItems(restaurant.id),
          getTables(restaurant.id),
        ]);
        setOrders(o.length ? o : demoOrders.map((x) => ({ ...x, restaurant_id: restaurant.id })));
        setMenuItems(m.length ? m : demoMenuItems.map((x) => ({ ...x, restaurant_id: restaurant.id })));
        setTables(t.length ? t : demoTables.map((x) => ({ ...x, restaurant_id: restaurant.id })));
      } catch (err) {
        console.error(err);
        setOrders(demoOrders.map((x) => ({ ...x, restaurant_id: restaurant.id })));
        setMenuItems(demoMenuItems.map((x) => ({ ...x, restaurant_id: restaurant.id })));
        setTables(demoTables.map((x) => ({ ...x, restaurant_id: restaurant.id })));
      }
      setLoading(false);
    })();
  }, [restaurant?.id]);

  if (!restaurant) return null;

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.grand_total, 0);
  const activeTables = tables.filter((t) => t.status === 'occupied').length;
  const recentOrders = orders.slice(0, 6);

  const chartData = chartRange === '7' ? revenueData7 : chartRange === '30' ? revenueData30 : revenueData90;

  const popularDishes = menuItems
    .filter((m) => m.is_bestseller || m.is_featured)
    .slice(0, 4)
    .map((m) => ({
      ...m,
      orders: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 10000) + 2000,
    }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{greeting},</h2>
          <p className="text-lg text-slate-600">{restaurant.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${restaurant.is_open ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <span className={`h-2 w-2 rounded-full ${restaurant.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
              {restaurant.is_open ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>
        <Link
          to={`/menu/${restaurant.slug}?table=01`}
          target="_blank"
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <ArrowUpRight size={18} /> View QR Menu
        </Link>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Today's Orders" value={todayOrders.length} icon={<ShoppingCart size={20} />} change={12} accent="orange" />
          <StatCard title="Today's Revenue" value={formatCurrency(todayRevenue)} icon={<IndianRupee size={20} />} change={8} accent="green" />
          <StatCard title="Active Tables" value={`${activeTables}/${tables.length}`} icon={<Table2 size={20} />} change={-5} accent="blue" />
          <StatCard title="Total Menu Items" value={menuItems.length} icon={<UtensilsCrossed size={20} />} change={3} accent="purple" />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Revenue Overview</h3>
              <p className="text-sm text-slate-500">Daily revenue trend</p>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(['7', '30', '90'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${chartRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  {r} Days
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280} className="mt-4">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Order Status</h3>
          <p className="text-sm text-slate-500">Today's distribution</p>
          <ResponsiveContainer width="100%" height={200} className="mt-4">
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-medium text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Dishes & Recent Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Popular Dishes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Popular Dishes</h3>
            <TrendingUp size={18} className="text-slate-400" />
          </div>
          <div className="mt-4 space-y-3">
            {popularDishes.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet</p>
            ) : (
              popularDishes.map((dish) => (
                <div key={dish.id} className="flex items-center gap-3">
                  <img src={dish.image_url || ''} alt={dish.name} className="h-12 w-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{dish.name}</p>
                    <p className="text-xs text-slate-500">{dish.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(dish.revenue)}</p>
                    <div className="flex items-center justify-end gap-0.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs text-slate-500">{dish.rating}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recentOrders.length === 0 ? (
              <EmptyState icon={<ShoppingCart size={24} />} title="No orders yet" description="Orders will appear here once customers start ordering" />
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">#{order.order_number}</p>
                      <p className="text-xs text-slate-500">Table {order.table_number} · {formatRelativeTime(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(order.grand_total)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
