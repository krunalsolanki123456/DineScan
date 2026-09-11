import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSubscriptionByRestaurant, getPaymentsByRestaurant } from '@/lib/services';
import type { RestaurantSubscription, Payment } from '@/types';
import { PageHeader } from '@/components/admin/PageBits';
import { Toast } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard, CheckCircle2, AlertTriangle, AlertOctagon,
  Calendar, FileText, Download, Clock, ShieldCheck, Sparkles,
  ArrowUpRight, X, Check,
} from 'lucide-react';

export default function RestaurantBillingPage() {
  const { restaurant, subscription } = useAuth();
  const [sub, setSub] = useState<RestaurantSubscription | null>(subscription);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscriptions"
        description="Manage your DineScan subscription plan, view payment cycles, and download invoices."
      />

      {/* Subscription Status Alert Banners */}
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
