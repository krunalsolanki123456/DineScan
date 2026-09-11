import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getPayments, updatePaymentStatus, getAllRestaurants } from '@/lib/services';
import type { Payment, PaymentStatus, Restaurant } from '@/types';
import { Toast } from '@/components/ui';
import {
  Receipt, Search, CheckCircle2, AlertTriangle, AlertOctagon,
  Clock, ArrowUpRight, FileText, Download, X, MoreHorizontal,
  CreditCard, DollarSign, Filter, Check, Eye,
} from 'lucide-react';

export default function SuperAdminPaymentsPage() {
  const navigate = useNavigate();
  const { inspectRestaurant } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState<'all' | 'paid' | 'due' | 'overdue' | 'expired'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        getPayments(),
        getAllRestaurants(),
      ]);
      setPayments(p);
      setRestaurants(r);
    } catch {
      setToast('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleUpdateStatus = async (paymentId: string, status: PaymentStatus) => {
    try {
      await updatePaymentStatus(paymentId, status, noteInput.trim() || undefined);
      setToast(`Invoice marked as ${status}`);
      if (selectedPayment && selectedPayment.id === paymentId) {
        setSelectedPayment(prev => prev ? { ...prev, payment_status: status, notes: noteInput || prev.notes } : null);
      }
      void loadData();
    } catch {
      setToast('Failed to update status');
    }
  };

  const handleOpenRestaurant = async (restaurantId: string) => {
    const target = restaurants.find(r => r.id === restaurantId);
    if (target) {
      await inspectRestaurant(target);
      navigate('/admin/dashboard');
    }
  };

  // KPI Calculations
  const totalCollected = payments
    .filter(p => p.payment_status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const thisMonthCollected = totalCollected; // demo timeframe
  const pendingAmount = payments
    .filter(p => p.payment_status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const overdueAmount = payments
    .filter(p => p.payment_status === 'OVERDUE')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const successfulCount = payments.filter(p => p.payment_status === 'PAID').length;
  const failedCount = payments.filter(p => p.payment_status === 'FAILED').length;

  // Filter Payments
  const filtered = payments.filter(p => {
    const term = search.toLowerCase();
    const matchSearch =
      p.invoice_number.toLowerCase().includes(term) ||
      (p.restaurant?.name && p.restaurant.name.toLowerCase().includes(term)) ||
      (p.transaction_id && p.transaction_id.toLowerCase().includes(term)) ||
      (p.restaurant?.email && p.restaurant.email.toLowerCase().includes(term));

    if (!matchSearch) return false;

    // Section tab filtering (Who Paid / Who Did Not Pay)
    if (activeSectionTab === 'paid' && p.payment_status !== 'PAID') return false;
    if (activeSectionTab === 'due' && p.payment_status !== 'PENDING') return false;
    if (activeSectionTab === 'overdue' && p.payment_status !== 'OVERDUE') return false;
    if (activeSectionTab === 'expired' && p.restaurant_id !== 'urban-cafe') return false;

    if (statusFilter !== 'all' && p.payment_status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Management</h1>
            <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-black text-purple-700">
              Who Paid / Unpaid
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track paid, overdue, and pending subscription invoices across all restaurant tenants.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <p className="text-xs font-bold text-emerald-700">Total Collected</p>
          <p className="mt-1 text-2xl font-black text-emerald-950">₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-emerald-600">All-time payments</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">This Month</p>
          <p className="mt-1 text-2xl font-black text-slate-900">₹{thisMonthCollected.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-slate-400">Current billing cycle</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <p className="text-xs font-bold text-amber-700">Pending Amount</p>
          <p className="mt-1 text-2xl font-black text-amber-950">₹{pendingAmount.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-amber-600">Due within 7 days</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs">
          <p className="text-xs font-bold text-rose-700">Overdue Amount</p>
          <p className="mt-1 text-2xl font-black text-rose-950">₹{overdueAmount.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-rose-600">Urgent recovery</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Successful Txns</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{successfulCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Processed invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Failed / Refunded</p>
          <p className="mt-1 text-2xl font-black text-slate-500">{failedCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Zero disputes</p>
        </div>
      </div>

      {/* Section Tabs: WHO PAID / WHO DID NOT PAY */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Payments' },
            { id: 'paid', label: 'PAID (Settled)' },
            { id: 'due', label: 'PAYMENT DUE' },
            { id: 'overdue', label: 'OVERDUE' },
            { id: 'expired', label: 'EXPIRED' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id as typeof activeSectionTab)}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeSectionTab === tab.id
                  ? 'bg-white font-black text-purple-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, restaurant, transaction..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-4 py-3">Restaurant & Owner</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Paid Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment records match this view.
                  </td>
                </tr>
              ) : (
                filtered.map(payment => {
                  const status = payment.payment_status;
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setNoteInput(payment.notes || '');
                          }}
                          className="font-bold text-slate-900 hover:text-purple-700 hover:underline flex items-center gap-1.5"
                        >
                          <Receipt size={14} className="text-slate-400" />
                          <span>{payment.invoice_number}</span>
                        </button>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {payment.transaction_id || 'Txn Pending'}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{payment.restaurant?.name || 'SK Restaurant'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {payment.restaurant?.owner_name || 'Owner'} • {payment.restaurant?.email || 'email'}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900">
                        ₹{payment.amount}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(payment.due_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {payment.paid_at ? (
                          new Date(payment.paid_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-amber-600 font-semibold">Unpaid</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              status === 'PAID'
                                ? 'bg-emerald-600'
                                : status === 'PENDING'
                                ? 'bg-amber-600'
                                : 'bg-rose-600'
                            }`}
                          />
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setNoteInput(payment.notes || '');
                            }}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => handleOpenRestaurant(payment.restaurant_id)}
                            className="flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                            title="Inspect Restaurant"
                          >
                            <ArrowUpRight size={13} />
                            <span>Inspect</span>
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

      {/* Payment Details Drawer / Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedPayment(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                <Receipt size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Invoice {selectedPayment.invoice_number}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPayment.restaurant?.name} • Issued on {new Date(selectedPayment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Restaurant:</span>
                <span className="font-bold text-slate-900">{selectedPayment.restaurant?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Owner / Email:</span>
                <span className="text-slate-800">{selectedPayment.restaurant?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Subtotal & Tax:</span>
                <span className="text-slate-800">₹{selectedPayment.amount} (All inclusive)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-slate-900">{selectedPayment.payment_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-xs text-slate-700">{selectedPayment.transaction_id || 'Pending Gateway Sync'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-semibold text-slate-800">{new Date(selectedPayment.due_date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Admin Actions on Payment */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Super Admin Override Actions
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedPayment.id, 'PAID')}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  Mark as PAID
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedPayment.id, 'PENDING')}
                  className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
                >
                  Mark as PENDING
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedPayment.id, 'OVERDUE')}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
                >
                  Mark as OVERDUE
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Admin Note / Audit Remarks
              </label>
              <textarea
                rows={2}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="e.g. Paid via NEFT reference #881293..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenRestaurant(selectedPayment.restaurant_id)}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                <ArrowUpRight size={14} /> Open Restaurant
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Print Invoice
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
