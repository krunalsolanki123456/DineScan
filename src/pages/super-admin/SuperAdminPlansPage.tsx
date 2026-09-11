import { useState, useEffect } from 'react';
import { getPlans, createPlan, updatePlan } from '@/lib/services';
import type { SubscriptionPlan } from '@/types';
import { Toast } from '@/components/ui';
import {
  CreditCard, Plus, Check, Edit3, Shield,
  Sparkles, CheckCircle2, X,
} from 'lucide-react';

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState({
    name: '',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    tableLimit: 10,
    staffLimit: 3,
    features: 'Digital Menu, QR Codes, Basic Reports',
  });
  const [toast, setToast] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch {
      setToast('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      tableLimit: 25,
      staffLimit: 5,
      features: 'Digital Menu, Table QR Codes, Live Orders, Staff Accounts',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      monthlyPrice: plan.monthly_price,
      yearlyPrice: plan.yearly_price,
      tableLimit: plan.table_limit,
      staffLimit: plan.staff_limit,
      features: plan.features.join(', '),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const featArray = form.features.split(',').map(f => f.trim()).filter(Boolean);

    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, {
          name: form.name,
          monthly_price: Number(form.monthlyPrice),
          yearly_price: Number(form.yearlyPrice),
          table_limit: Number(form.tableLimit),
          staff_limit: Number(form.staffLimit),
          features: featArray,
        });
        setToast(`Plan ${form.name} updated`);
      } else {
        await createPlan({
          name: form.name,
          monthly_price: Number(form.monthlyPrice),
          yearly_price: Number(form.yearlyPrice),
          table_limit: Number(form.tableLimit),
          staff_limit: Number(form.staffLimit),
          features: featArray,
        });
        setToast(`Plan ${form.name} created`);
      }
      setModalOpen(false);
      void loadPlans();
    } catch {
      setToast('Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure platform SaaS tier pricing, limits, and featured capabilities.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-800 transition"
        >
          <Plus size={16} />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition ${
              plan.code === 'PRO'
                ? 'border-purple-300 bg-gradient-to-b from-purple-50/50 to-white ring-2 ring-purple-500/20'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-black text-purple-800">
                  {plan.code}
                </span>
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="text-slate-400 hover:text-slate-800 transition p-1"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              <h2 className="mt-3 text-xl font-black text-slate-900">{plan.name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">₹{plan.monthly_price}</span>
                <span className="text-xs text-slate-400 font-semibold">/month</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                or ₹{plan.yearly_price}/year (billed annually)
              </p>

              <div className="mt-5 space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Table Limit:</span>
                  <span className="font-bold text-purple-700">{plan.table_limit} Tables</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Staff Limit:</span>
                  <span className="font-bold text-purple-700">{plan.staff_limit} Members</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Features Included:</p>
                {plan.features.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-600">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleOpenEdit(plan)}
              className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              Configure Plan
            </button>
          </div>
        ))}
      </div>

      {/* Create / Edit Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              {editingPlan ? 'Edit Plan' : 'Create New Subscription Plan'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Enterprise"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.monthlyPrice}
                    onChange={e => setForm({ ...form, monthlyPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.yearlyPrice}
                    onChange={e => setForm({ ...form, yearlyPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Table Limit</label>
                  <input
                    type="number"
                    required
                    value={form.tableLimit}
                    onChange={e => setForm({ ...form, tableLimit: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Staff Limit</label>
                  <input
                    type="number"
                    required
                    value={form.staffLimit}
                    onChange={e => setForm({ ...form, staffLimit: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Features (comma separated)</label>
                <textarea
                  rows={3}
                  value={form.features}
                  onChange={e => setForm({ ...form, features: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-2 font-bold text-white hover:bg-purple-800"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
