import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Building2, Download, Calendar } from 'lucide-react';

export default function SuperAdminReportsPage() {
  const [timeframe, setTimeframe] = useState('monthly');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated revenue metrics, restaurant expansion trends, and churn analytics.
          </p>
        </div>

        <button
          onClick={() => alert('Platform CSV report exported.')}
          className="flex items-center gap-1.5 rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 transition"
        >
          <Download size={14} /> Export Platform Analytics
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400">Total Subscription Revenue</p>
          <p className="mt-2 text-3xl font-black text-slate-900">₹11,986</p>
          <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={13} /> +18.4% from last month
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400">Average Revenue Per Restaurant</p>
          <p className="mt-2 text-3xl font-black text-slate-900">₹2,996</p>
          <p className="mt-1 text-xs text-slate-500 font-medium">ARPU across all tiers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400">Churn / Expired Rate</p>
          <p className="mt-2 text-3xl font-black text-amber-600">25%</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">1 overdue/expired tenant</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Monthly Revenue Inflow (2026)</h3>
        <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2">
          {[
            { month: 'Apr', amount: 4200, height: '35%' },
            { month: 'May', amount: 5800, height: '50%' },
            { month: 'Jun', amount: 7200, height: '60%' },
            { month: 'Jul', amount: 8900, height: '75%' },
            { month: 'Aug', amount: 10400, height: '88%' },
            { month: 'Sep', amount: 11986, height: '100%' },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-500">₹{bar.amount}</span>
              <div
                style={{ height: bar.height }}
                className="w-full bg-gradient-to-t from-purple-700 to-indigo-500 rounded-t-xl"
              />
              <span className="text-xs font-bold text-slate-600">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
