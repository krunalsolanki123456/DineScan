import { useEffect, useMemo, useState } from 'react';
import {
  Users, Phone, ShoppingBag, WalletCards, RefreshCw,
  Search, Star, Clock, Utensils, Award, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getCustomers } from '@/lib/services';
import type { Customer } from '@/types';
import { PageHeader } from '@/components/admin/PageBits';
import { StatCard } from '@/components/ui';
import { demoCustomers } from '@/data/demo';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomersPage() {
  const { restaurant } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const r = await getCustomers(restaurant.id);
      setCustomers(r.length ? r : demoCustomers.map(x => ({ ...x, restaurant_id: restaurant.id })));
    } catch {
      setCustomers(demoCustomers.map(x => ({ ...x, restaurant_id: restaurant.id })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [restaurant?.id]);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.favorite_dish || '').toLowerCase().includes(q)
      );
    });
  }, [customers, search]);

  const totalSpend = useMemo(() => customers.reduce((s, c) => s + Number(c.total_spend || 0), 0), [customers]);
  const totalOrders = useMemo(() => customers.reduce((s, c) => s + Number(c.total_orders || 0), 0), [customers]);
  const repeatCustomers = useMemo(() => customers.filter(c => Number(c.total_orders || 0) > 1).length, [customers]);
  const repeatRate = customers.length ? Math.round((repeatCustomers / customers.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Guests"
        description="Guest profiles, live dine-in orders, and customer ordering history."
        actions={
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-orange-600' : ''} />
            <span>Refresh List</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Customers" value={customers.length} icon={<Users size={20} />} accent="orange" />
        <StatCard title="Total Orders" value={totalOrders} icon={<ShoppingBag size={20} />} accent="blue" />
        <StatCard title="Customer Spend" value={formatCurrency(totalSpend)} icon={<WalletCards size={20} />} accent="green" />
        <StatCard title="Repeat Guest Rate" value={`${repeatRate}%`} icon={<Award size={20} />} accent="purple" />
      </div>

      {/* Main Customers Directory Table Container */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Header with Search and count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-4 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Customer Directory</h2>
            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700 border border-orange-200">
              {filtered.length} {filtered.length === 1 ? 'Guest' : 'Guests'}
            </span>
          </div>

          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, or dish..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs sm:text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Customer / Guest</th>
                <th className="px-4 py-3.5">Mobile Phone</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Total Spend</th>
                <th className="px-4 py-3.5">Last Ordered</th>
                <th className="px-4 py-3.5">Favorite Dish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                      <span>Loading customer profiles...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <p className="text-slate-600 font-semibold">No customers found.</p>
                      <p className="text-xs text-slate-400">
                        When customers order from table QR codes, their profiles and history automatically appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const ordersCount = Number(c.total_orders) || 1;
                  const isNew = ordersCount === 1;
                  const isVip = ordersCount >= 5;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-700 ring-2 ring-orange-200/50">
                            {(c.name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{c.name || 'Guest User'}</p>
                              {isVip ? (
                                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                  ⭐ VIP
                                </span>
                              ) : isNew ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  New Guest
                                </span>
                              ) : (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                  Repeat Guest
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">ID: {c.id.slice(0, 16)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700">
                            <Phone size={12} className="text-slate-400" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                          <ShoppingBag size={12} className="text-slate-500" />
                          {ordersCount} {ordersCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(Number(c.total_spend) || 0)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-500">
                        {c.last_order_at ? (
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {formatDate(c.last_order_at)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {c.favorite_dish ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50/70 border border-orange-200/80 px-2.5 py-1 text-xs font-semibold text-orange-800">
                            <Utensils size={12} className="text-orange-600" />
                            {c.favorite_dish}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
