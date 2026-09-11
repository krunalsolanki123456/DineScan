import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getAllRestaurants, getSubscriptions, getPayments } from '@/lib/services';
import type { Restaurant, RestaurantSubscription, Payment } from '@/types';
import {
  Building2, CheckCircle2, AlertTriangle, AlertOctagon,
  Clock, DollarSign, TrendingUp, Users, ArrowUpRight,
  Sparkles, ShieldCheck, ChevronRight,
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { inspectRestaurant } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subscriptions, setSubscriptions] = useState<RestaurantSubscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      getAllRestaurants().then(r => setRestaurants(r)),
      getSubscriptions().then(s => setSubscriptions(s)),
      getPayments().then(p => setPayments(p)),
    ]).finally(() => setLoading(false));
  }, []);

  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter(r => r.status === 'active').length;
  const trialRestaurants = subscriptions.filter(s => s.status === 'TRIAL').length;
  const paidRestaurants = payments.filter(p => p.payment_status === 'PAID').length;
  const paymentDueCount = payments.filter(p => p.payment_status === 'PENDING').length;
  const overdueCount = payments.filter(p => p.payment_status === 'OVERDUE').length;
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED').length;

  // Revenue calculation
  const totalRevenue = payments
    .filter(p => p.payment_status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const mrr = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + (s.billing_cycle === 'yearly' ? Math.round(Number(s.amount) / 12) : Number(s.amount)), 0);

  const handleInspect = async (r: Restaurant) => {
    await inspectRestaurant(r);
    navigate('/admin/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-extrabold text-purple-700">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time multi-restaurant SaaS performance, revenue metrics, and operational health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/super-admin/payments')}
            className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-800 transition"
          >
            Manage Payments
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Total Restaurants</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalRestaurants}</p>
          <p className="mt-1 text-[11px] text-slate-400">Onboarded tenants</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Active Restaurants</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{activeRestaurants}</p>
          <p className="mt-1 text-[11px] text-slate-400">Serving orders</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Trial Accounts</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{trialRestaurants}</p>
          <p className="mt-1 text-[11px] text-slate-400">Free evaluation</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Payment Due</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{paymentDueCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Pending settlement</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Overdue Invoices</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{overdueCount}</p>
          <p className="mt-1 text-[11px] text-rose-500 font-semibold">Action required</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Expired Plans</p>
          <p className="mt-1 text-2xl font-black text-slate-600">{expiredCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Access locked</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 shadow-xs">
          <p className="text-xs font-bold text-purple-700">Monthly Rec. Revenue</p>
          <p className="mt-1 text-2xl font-black text-purple-900">₹{mrr.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-purple-600">MRR Run-rate</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xs font-bold text-emerald-700">Total Collected</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-emerald-600">Net platform revenue</p>
        </div>
      </div>

      {/* Visual Progress / Plan Distribution */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900">Subscription & Revenue Breakdown</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">Starter Plan (₹299/mo)</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {subscriptions.filter(s => s.plan_id === 'plan-starter').length} Restaurants
              </p>
              <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">Pro Plan (₹599/mo)</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {subscriptions.filter(s => s.plan_id === 'plan-pro').length} Restaurants
              </p>
              <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">Business Plan (₹999/mo)</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {subscriptions.filter(s => s.plan_id === 'plan-business').length} Restaurants
              </p>
              <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Overall Payment Health</span>
              <span className="font-bold text-emerald-600">80% In Good Standing</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div style={{ width: '60%' }} className="bg-emerald-500" title="Paid" />
              <div style={{ width: '20%' }} className="bg-amber-400" title="Pending" />
              <div style={{ width: '20%' }} className="bg-rose-500" title="Overdue" />
            </div>
            <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Pending Due</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Overdue</span>
            </div>
          </div>
        </div>

        {/* Quick Inspection Action Card */}
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-900 to-indigo-950 p-6 text-white shadow-xs flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-slate-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Inspection Mode
            </span>
            <h3 className="mt-3 text-lg font-bold">Inspect Any Restaurant</h3>
            <p className="mt-1.5 text-xs text-purple-200 leading-relaxed">
              Open and view any restaurant's live orders, menu, and kitchen in Super Admin inspection mode without modifying user sessions.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {restaurants.slice(0, 3).map(r => (
              <button
                key={r.id}
                onClick={() => handleInspect(r)}
                className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition text-left"
              >
                <span>{r.name}</span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Restaurants & Overdue Alert Split */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Restaurants Quick List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-sm font-bold text-slate-900">Registered Restaurants</h3>
            <button
              onClick={() => navigate('/super-admin/restaurants')}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {restaurants.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-xs font-black text-orange-700">
                    {r.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-400 truncate">{r.email || r.phone || r.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : r.status === 'past_due'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {r.status?.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleInspect(r)}
                    className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue / Attention Required */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" />
              Payments Requiring Attention
            </h3>
            <button
              onClick={() => navigate('/super-admin/payments')}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {payments
              .filter(p => p.payment_status === 'OVERDUE' || p.payment_status === 'PENDING')
              .map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50/50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {payment.restaurant?.name || 'Restaurant'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          payment.payment_status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {payment.payment_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Invoice {payment.invoice_number} • Due: {new Date(payment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-base font-black text-slate-900">₹{payment.amount}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
