import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  getRestaurantById, getSubscriptionByRestaurant,
  getPaymentsByRestaurant, getStaffByRestaurant, getAuditLogs,
} from '@/lib/services';
import type { Restaurant, RestaurantSubscription, Payment, RestaurantMember, AuditLog } from '@/types';
import {
  Building2, ArrowLeft, ArrowUpRight, CheckCircle2,
  AlertTriangle, AlertOctagon, Mail, Phone, MapPin,
  Calendar, CreditCard, Users, UtensilsCrossed, Table2,
  FileText, Activity, ShieldCheck,
} from 'lucide-react';

export default function SuperAdminRestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { inspectRestaurant } = useAuth();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [subscription, setSubscription] = useState<RestaurantSubscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [staff, setStaff] = useState<RestaurantMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'subscription' | 'payments' | 'usage' | 'activity'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void Promise.all([
      getRestaurantById(id).then(r => setRestaurant(r)),
      getSubscriptionByRestaurant(id).then(s => setSubscription(s)),
      getPaymentsByRestaurant(id).then(p => setPayments(p)),
      getStaffByRestaurant(id).then(st => setStaff(st)),
      getAuditLogs(id).then(l => setAuditLogs(l)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const handleInspect = async () => {
    if (!restaurant) return;
    await inspectRestaurant(restaurant);
    navigate('/admin/dashboard');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-bold text-slate-700">Restaurant not found.</p>
        <button
          onClick={() => navigate('/super-admin/restaurants')}
          className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  const planName = subscription?.plan?.name || (restaurant.id === 'food-house' ? 'Business' : restaurant.id === 'royal-spice' ? 'Starter' : 'Pro');

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/super-admin/restaurants')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition w-fit"
        >
          <ArrowLeft size={16} /> Back to Directory
        </button>

        <button
          onClick={handleInspect}
          className="flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-800 transition"
        >
          <ArrowUpRight size={15} />
          <span>Open Restaurant in Super Admin Mode</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-black text-orange-700 overflow-hidden">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              restaurant.name[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{restaurant.name}</h1>
              <span className="rounded-md bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                Plan: {planName}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  restaurant.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : restaurant.status === 'past_due'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {restaurant.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Mail size={12} /> {restaurant.email || 'hello@restaurant.com'}</span>
              <span className="flex items-center gap-1"><Phone size={12} /> {restaurant.phone || '+91 98765 43210'}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {restaurant.address || 'Ahmedabad'}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap border-b border-slate-100 text-xs font-bold text-slate-500 gap-1 sm:gap-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'staff', label: `Staff (${staff.length})` },
            { id: 'subscription', label: 'Subscription' },
            { id: 'payments', label: `Payments (${payments.length})` },
            { id: 'usage', label: 'Usage Limits' },
            { id: 'activity', label: 'Audit Activity' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-3 transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-700 font-extrabold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Location & Tax</h3>
            <div className="mt-3 space-y-2 text-xs">
              <p><strong className="text-slate-700">Address:</strong> {restaurant.address || 'SG Highway'}</p>
              <p><strong className="text-slate-700">City / State:</strong> {restaurant.city || 'Ahmedabad'}, {restaurant.state || 'Gujarat'}</p>
              <p><strong className="text-slate-700">Pincode:</strong> {restaurant.pincode || '380015'}</p>
              <p><strong className="text-slate-700">GST Number:</strong> {restaurant.gst_number || '24AAACS1234F1Z1'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Operating Timings</h3>
            <div className="mt-3 space-y-2 text-xs">
              <p><strong className="text-slate-700">Opening Time:</strong> {restaurant.opening_time}</p>
              <p><strong className="text-slate-700">Closing Time:</strong> {restaurant.closing_time}</p>
              <p><strong className="text-slate-700">Food Preference:</strong> {restaurant.food_preference}</p>
              <p><strong className="text-slate-700">Cuisines:</strong> {restaurant.cuisines || 'Multi-Cuisine'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Registration</h3>
            <div className="mt-3 space-y-2 text-xs">
              <p><strong className="text-slate-700">Restaurant ID:</strong> <span className="font-mono">{restaurant.id}</span></p>
              <p><strong className="text-slate-700">Joined:</strong> {new Date(restaurant.created_at).toLocaleDateString()}</p>
              <p><strong className="text-slate-700">Digital Menu Slug:</strong> /menu/{restaurant.slug}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map(m => (
                <tr key={m.id} className="py-2.5">
                  <td className="py-2.5 font-bold text-slate-900">{m.full_name}</td>
                  <td className="py-2.5 text-slate-600">{m.email}</td>
                  <td className="py-2.5 font-semibold capitalize">{m.role}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Subscription Terms</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold">Active Plan</p>
              <p className="text-base font-bold text-slate-900 mt-1">{planName}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Amount</p>
              <p className="text-base font-bold text-slate-900 mt-1">₹{subscription?.amount || 599}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Billing Cycle</p>
              <p className="text-base font-bold text-slate-900 mt-1 capitalize">{subscription?.billing_cycle || 'Monthly'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Status</p>
              <p className="text-base font-bold text-emerald-600 mt-1">{subscription?.status || 'ACTIVE'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th className="py-2">Invoice #</th>
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Method</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(p => (
                <tr key={p.id} className="py-2.5">
                  <td className="py-2.5 font-bold text-slate-900">{p.invoice_number}</td>
                  <td className="py-2.5 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-2.5 font-bold text-slate-900">₹{p.amount}</td>
                  <td className="py-2.5 text-slate-600">{p.payment_method}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                      {p.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-slate-400 font-semibold">Menu Items</p>
            <p className="text-2xl font-black text-slate-900 mt-1">20</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Limit: Unlimited (Pro)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-slate-400 font-semibold">Tables</p>
            <p className="text-2xl font-black text-slate-900 mt-1">12</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Limit: 50 Tables</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-slate-400 font-semibold">Staff Accounts</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{staff.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Limit: 10 Staff</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-slate-400 font-semibold">Total Orders Processed</p>
            <p className="text-2xl font-black text-slate-900 mt-1">8</p>
            <p className="text-[11px] text-slate-500 mt-0.5">All-time volume</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Audit Logs for this Restaurant</h3>
          <div className="space-y-2 text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="rounded-lg border border-slate-100 p-3 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{log.action}</p>
                  <p className="text-[11px] text-slate-500">By: {log.user_email || 'admin'} • Module: {log.module}</p>
                </div>
                <span className="text-[11px] text-slate-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
