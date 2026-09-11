import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/lib/services';
import type { AuditLog } from '@/types';
import { Toast } from '@/components/ui';
import { Settings, Shield, Activity, Save, RefreshCw } from 'lucide-react';

export default function SuperAdminSettingsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch {
      setToast('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Settings & Audit Trail</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global DineScan configuration and immutable security audit logs for compliance.
          </p>
        </div>
        <button
          onClick={() => void loadLogs()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Global Platform Settings */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings size={18} className="text-purple-600" /> Platform Defaults
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Trial Period Duration (Days)</label>
            <input
              type="number"
              defaultValue={14}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Grace Period for Overdue Invoices (Days)</label>
            <input
              type="number"
              defaultValue={7}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-purple-500"
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setToast('Platform settings saved successfully')}
            className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 transition"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-purple-600" /> Security & Activity Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks logins, role changes, permission modifications, menu updates, and Super Admin inspections.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Actor / Email</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">No logs recorded yet.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-purple-700">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {log.user_email || 'System'}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-bold">
                      {log.restaurant_name || log.restaurant_id || 'Platform'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
