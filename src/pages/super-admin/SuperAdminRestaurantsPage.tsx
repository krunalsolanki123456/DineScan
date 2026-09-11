import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getAllRestaurants, updateRestaurantStatus, getSubscriptions, getPayments } from '@/lib/services';
import type { Restaurant, RestaurantStatus, RestaurantSubscription, Payment } from '@/types';
import { Toast } from '@/components/ui';
import {
  Building2, Search, ArrowUpRight, Eye, ShieldAlert,
  CheckCircle2, AlertTriangle, AlertOctagon, Filter,
  Phone, Mail, MapPin, MoreHorizontal,
} from 'lucide-react';

export default function SuperAdminRestaurantsPage() {
  const navigate = useNavigate();
  const { inspectRestaurant } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subscriptions, setSubscriptions] = useState<RestaurantSubscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, s, p] = await Promise.all([
        getAllRestaurants(),
        getSubscriptions(),
        getPayments(),
      ]);
      setRestaurants(r);
      setSubscriptions(s);
      setPayments(p);
    } catch {
      setToast('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleInspect = async (r: Restaurant) => {
    await inspectRestaurant(r);
    navigate('/admin/dashboard');
  };

  const handleToggleSuspension = async (r: Restaurant) => {
    const nextStatus: RestaurantStatus = r.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateRestaurantStatus(r.id, nextStatus);
      setToast(`${r.name} is now ${nextStatus}`);
      void loadData();
    } catch {
      setToast('Failed to update status');
    }
  };

  // Filter logic
  const filtered = restaurants.filter(r => {
    const term = search.toLowerCase();
    const matchSearch =
      r.name.toLowerCase().includes(term) ||
      (r.email && r.email.toLowerCase().includes(term)) ||
      (r.phone && r.phone.includes(term)) ||
      (r.city && r.city.toLowerCase().includes(term));

    if (!matchSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return r.status === 'active';
    if (statusFilter === 'trial') return r.status === 'trial';
    if (statusFilter === 'past_due') return r.status === 'past_due';
    if (statusFilter === 'expired') return r.status === 'expired';
    if (statusFilter === 'suspended') return r.status === 'suspended';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Restaurant Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage all platform restaurant accounts, inspect active dashboards, and control subscription statuses.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'past_due', label: 'Payment Due' },
            { id: 'expired', label: 'Expired' },
            { id: 'suspended', label: 'Suspended' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 transition ${
                statusFilter === f.id
                  ? 'bg-white font-bold text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, owner, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Restaurant</th>
                <th className="px-4 py-3">Owner Contact</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading restaurant directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No restaurants match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map(r => {
                  const sub = subscriptions.find(s => s.restaurant_id === r.id);
                  const planLabel = r.id === 'food-house' ? 'Business' : r.id === 'royal-spice' ? 'Starter' : 'Pro';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-black text-orange-700 overflow-hidden">
                            {r.logo_url ? (
                              <img src={r.logo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              r.name[0]
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{r.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} /> {r.city || 'Gujarat'}, {r.type}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">{r.email || 'hello@restaurant.com'}</p>
                        <p className="text-slate-400 mt-0.5">{r.phone || '+91 98765 00000'}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-bold text-purple-700">
                          {planLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            r.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.status === 'past_due'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              r.status === 'active' ? 'bg-emerald-500' : r.status === 'past_due' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                          {r.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-semibold ${
                            r.status === 'suspended' ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {r.status === 'suspended' ? 'Suspended' : 'Operational'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open Restaurant (Super Admin Inspection Mode) */}
                          <button
                            onClick={() => handleInspect(r)}
                            className="flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                            title="Inspect in Super Admin Mode"
                          >
                            <ArrowUpRight size={13} />
                            <span>Open</span>
                          </button>

                          <button
                            onClick={() => navigate(`/super-admin/restaurants/${r.id}`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="View Detail"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => handleToggleSuspension(r)}
                            className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                              r.status === 'suspended'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-rose-600'
                            }`}
                            title="Toggle Suspension"
                          >
                            {r.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
