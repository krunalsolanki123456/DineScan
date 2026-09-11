import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getSubscriptions, updateSubscriptionStatus, getAllRestaurants } from '@/lib/services';
import type { RestaurantSubscription, SubscriptionStatus, Restaurant } from '@/types';
import { Toast } from '@/components/ui';
import {
  Layers, Search, CheckCircle2, AlertTriangle, AlertOctagon,
  Clock, ArrowUpRight, Calendar, Edit3, X,
} from 'lucide-react';

export default function SuperAdminSubscriptionsPage() {
  const navigate = useNavigate();
  const { inspectRestaurant } = useAuth();
  const [subscriptions, setSubscriptions] = useState<RestaurantSubscription[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState<RestaurantSubscription | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        getSubscriptions(),
        getAllRestaurants(),
      ]);
      setSubscriptions(s);
      setRestaurants(r);
    } catch {
      setToast('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: SubscriptionStatus) => {
    try {
      await updateSubscriptionStatus(id, newStatus);
      setToast(`Subscription updated to ${newStatus}`);
      setSelectedSub(null);
      void loadData();
    } catch {
      setToast('Failed to update subscription');
    }
  };

  const handleInspect = async (restaurantId: string) => {
    const r = restaurants.find(item => item.id === restaurantId);
    if (r) {
      await inspectRestaurant(r);
      navigate('/admin/dashboard');
    }
  };

  const filtered = subscriptions.filter(s => {
    if (statusFilter === 'all') return true;
    return s.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor restaurant subscription lifecycles, renewal dates, and access statuses.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'past_due', label: 'Payment Due' },
          { id: 'expired', label: 'Expired' },
          { id: 'suspended', label: 'Suspended' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === tab.id
                ? 'bg-white font-bold text-purple-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Restaurant</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Billing Cycle</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Next Billing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : (
                filtered.map(sub => {
                  const rest = restaurants.find(r => r.id === sub.restaurant_id);
                  const planName = sub.plan?.name || (sub.restaurant_id === 'food-house' ? 'Business' : sub.restaurant_id === 'royal-spice' ? 'Starter' : 'Pro');

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{rest?.name || sub.restaurant_id}</p>
                        <p className="text-xs text-slate-400">{rest?.city || 'Gujarat'}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-purple-700">
                        {planName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">
                        {sub.billing_cycle}
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900">
                        ₹{sub.amount}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(sub.next_billing_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : sub.status === 'PAST_DUE'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleInspect(sub.restaurant_id)}
                            className="rounded-lg bg-purple-50 p-1.5 text-purple-700 hover:bg-purple-100 transition"
                            title="Inspect Restaurant"
                          >
                            <ArrowUpRight size={14} />
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

      {/* Update Status Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl space-y-3">
            <button
              onClick={() => setSelectedSub(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-slate-900">Change Subscription Status</h3>
            <p className="text-xs text-slate-500">
              Select the new access status for this restaurant:
            </p>

            <div className="space-y-2 pt-2">
              {(['ACTIVE', 'PAST_DUE', 'EXPIRED', 'SUSPENDED'] as SubscriptionStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(selectedSub.id, st)}
                  className={`w-full rounded-xl p-2.5 text-xs font-bold text-left border transition flex items-center justify-between ${
                    selectedSub.status === st
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{st}</span>
                  {selectedSub.status === st && <CheckCircle2 size={15} className="text-purple-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
