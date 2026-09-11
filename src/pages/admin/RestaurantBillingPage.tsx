import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSubscriptionByRestaurant, getPaymentsByRestaurant, updateSubscription } from '@/lib/services';
import type { RestaurantSubscription, Payment } from '@/types';
import { PageHeader } from '@/components/admin/PageBits';
import { Toast } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard, CheckCircle2, AlertTriangle, AlertOctagon,
  Calendar, FileText, Download, Clock, ShieldCheck, Sparkles,
  ArrowUpRight, X, Check, RefreshCw, FlaskConical,
} from 'lucide-react';

export default function RestaurantBillingPage() {
  const { restaurant, subscription, refreshSubscription } = useAuth();
  const [sub, setSub] = useState<RestaurantSubscription | null>(subscription);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!restaurant?.id) return;
    setLoading(true);
    void Promise.all([
      getSubscriptionByRestaurant(restaurant.id).then(s => setSub(s)),
      getPaymentsByRestaurant(restaurant.id).then(p => setPayments(p)),
    ]).finally(() => setLoading(false));
  }, [restaurant?.id]);

  const planName = sub?.plan?.name || (restaurant?.id === 'food-house' ? 'Business' : restaurant?.id === 'royal-spice' ? 'Starter' : 'Pro');
  const planPrice = sub?.amount || (planName === 'Business' ? 9990 : planName === 'Starter' ? 299 : 599);
  const subStatus = sub?.status || (restaurant?.status === 'past_due' ? 'PAST_DUE' : restaurant?.status === 'expired' ? 'EXPIRED' : 'ACTIVE');

  const daysUntilExpiry = sub?.expires_at
    ? Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7 && subStatus === 'ACTIVE';

  const handleSimulateStatus = async (
    targetStatus: 'ACTIVE' | 'PAST_DUE' | 'EXPIRED',
    daysOffset: number,
    label: string
  ) => {
    if (!restaurant?.id) return;
    setSimulating(true);
    try {
      const targetDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString();
      await updateSubscription(restaurant.id, {
        status: targetStatus,
        expires_at: targetDate,
        next_billing_date: targetDate,
      });
      await refreshSubscription();
      const updated = await getSubscriptionByRestaurant(restaurant.id);
      setSub(updated);
      setToast(`Simulation: ${label} applied! Look at the top banner & status below.`);
    } catch {
      setToast('Failed to simulate subscription status');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscriptions"
        description="Manage your DineScan subscription plan, view payment cycles, and download invoices."
      />

      {/* Subscription Status Alert Banners */}
      {isExpiringSoon && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800">
              <Clock size={20} />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">Contract Renewal Notice</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Your DineScan subscription expires in <strong>{daysUntilExpiry} day{daysUntilExpiry === 1 ? '' : 's'}</strong> ({sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}). Renew early to avoid service interruption.
              </p>
            </div>
          </div>
          <button
            onClick={() => setToast('Payment gateway opened. Simulating online contract renewal...')}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shrink-0"
          >
            Renew Early
          </button>
        </div>
      )}

      {subStatus === 'PAST_DUE' && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">Payment Due Notice</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Your monthly billing invoice is past due. Please complete payment to avoid service interruption.
              </p>
            </div>
          </div>
          <button
            onClick={() => setToast('Payment gateway opened. Simulating online payment...')}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shrink-0"
          >
            Pay ₹{planPrice} Now
          </button>
        </div>
      )}

      {subStatus === 'EXPIRED' && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 sm:p-5 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-200/80 text-rose-800">
              <AlertOctagon size={20} />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">Subscription Expired</p>
              <p className="text-xs text-rose-800 mt-0.5">
                Your DineScan subscription has expired. Orders and live menu functionality are currently restricted.
              </p>
            </div>
          </div>
          <button
            onClick={() => setToast('Renewing subscription... Simulating online checkout...')}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shrink-0"
          >
            Renew Plan
          </button>
        </div>
      )}

      {/* Contract & Expiry Live Testing Simulator */}
      <div className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <FlaskConical size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Contract Expiry Testing Simulator
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">
                  Testing Controls
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any button to test and see how the alerts, banners, and contract expiry warnings appear across the dashboard.
              </p>
            </div>
          </div>
          {simulating && (
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 animate-pulse">
              <RefreshCw size={12} className="animate-spin" /> Updating...
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulateStatus('ACTIVE', 300, 'Healthy Active Contract (300 Days)')}
            className="flex flex-col items-start rounded-xl border border-emerald-200 bg-white p-3 text-left hover:border-emerald-400 hover:bg-emerald-50/50 transition shadow-xs group"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              🟢 Active (Healthy)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Expires in 300 days (Normal state, no warning banners)
            </span>
          </button>

          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulateStatus('ACTIVE', 3, 'Expiring in 3 Days')}
            className="flex flex-col items-start rounded-xl border border-amber-200 bg-white p-3 text-left hover:border-amber-400 hover:bg-amber-50/50 transition shadow-xs group"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              ⚠️ Expiring in 3 Days
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Shows top Orange Banner (Advance notice)
            </span>
          </button>

          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulateStatus('EXPIRED', -1, 'Contract Expired')}
            className="flex flex-col items-start rounded-xl border border-rose-200 bg-white p-3 text-left hover:border-rose-400 hover:bg-rose-50/50 transition shadow-xs group"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              ⛔ Expired Contract
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Shows Sticky Red Banner (Access locked)
            </span>
          </button>

          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulateStatus('PAST_DUE', 5, 'Payment Past Due')}
            className="flex flex-col items-start rounded-xl border border-amber-200 bg-white p-3 text-left hover:border-amber-400 hover:bg-amber-50/50 transition shadow-xs group"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              🟡 Past Due Invoice
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Shows Amber Banner (Payment overdue notice)
            </span>
          </button>
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                <Sparkles size={13} /> Current Plan
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                DineScan {planName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Designed for high-growth restaurants with digital ordering
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{planPrice}
                <span className="text-sm font-semibold text-slate-400">/{sub?.billing_cycle || 'month'}</span>
              </p>
              <span
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  subStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : subStatus === 'PAST_DUE'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${subStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {subStatus}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <p className="font-semibold text-slate-400 text-xs">Billing Cycle</p>
              <p className="mt-1 font-bold text-slate-800 capitalize">{sub?.billing_cycle || 'Monthly'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-400 text-xs">Next Billing Date</p>
              <p className="mt-1 font-bold text-slate-800">
                {sub?.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '25 Oct 2026'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-400 text-xs">Expiry Date</p>
              <p className="mt-1 font-bold text-slate-800">
                {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '25 Oct 2026'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setToast('Plan change request submitted to platform administrator')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              Change Plan
            </button>
            <button
              onClick={() => setToast('Invoice statements sent to restaurant email')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              Email Invoices
            </button>
          </div>
        </div>

        {/* Plan Features Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xs">
          <h3 className="text-base font-bold flex items-center gap-2">
            <ShieldCheck size={18} className="text-orange-400" />
            Plan Benefits
          </h3>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Check size={15} className="text-emerald-400 shrink-0" />
              <span>Unlimited Digital Menu Items</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={15} className="text-emerald-400 shrink-0" />
              <span>Table QR Ordering System</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={15} className="text-emerald-400 shrink-0" />
              <span>Live Kitchen Display System (KDS)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={15} className="text-emerald-400 shrink-0" />
              <span>Staff Role-Based Permissions</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={15} className="text-emerald-400 shrink-0" />
              <span>Analytics & CSV Report Export</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Payment & Invoice History</h3>
          <p className="text-xs text-slate-500 mt-0.5">All billing statements and payment transaction receipts</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {payment.invoice_number}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(payment.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ₹{payment.amount}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {payment.payment_method}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          payment.payment_status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : payment.payment_status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedInvoice(payment)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <FileText size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <img src="/dinescan-logo-horizontal.png" alt="DineScan" className="h-8 w-auto" />
                <span className="text-xs font-bold text-slate-400">TAX INVOICE</span>
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-900">
                Invoice {selectedInvoice.invoice_number}
              </h3>
              <p className="text-xs text-slate-500">
                Issued on {new Date(selectedInvoice.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </p>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Billed To:</span>
                <span className="font-bold text-slate-900">{restaurant?.name || 'SK Restaurant'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subscription Plan:</span>
                <span className="font-semibold text-slate-800">DineScan {planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-emerald-600">{selectedInvoice.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-xs text-slate-700">{selectedInvoice.transaction_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-slate-900">
                <span>Total Paid:</span>
                <span>₹{selectedInvoice.amount}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                <Download size={14} /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
