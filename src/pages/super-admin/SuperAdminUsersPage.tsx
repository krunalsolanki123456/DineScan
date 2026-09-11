import { useState, useEffect } from 'react';
import { getAllRestaurants } from '@/lib/services';
import type { Restaurant } from '@/types';
import { Users, Mail, Phone, Building2, Shield, Search } from 'lucide-react';

export default function SuperAdminUsersPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void getAllRestaurants().then(r => setRestaurants(r));
  }, []);

  const users = [
    { name: 'Krunal', email: 'krunal@skrestaurant.com', role: 'Restaurant Owner', restaurant: 'SK Restaurant', status: 'Active' },
    { name: 'Rahul Verma', email: 'manager@skrestaurant.com', role: 'Manager', restaurant: 'SK Restaurant', status: 'Active' },
    { name: 'Amit Kumar', email: 'kitchen@skrestaurant.com', role: 'Kitchen Staff', restaurant: 'SK Restaurant', status: 'Active' },
    { name: 'Priya Sharma', email: 'cashier@skrestaurant.com', role: 'Cashier', restaurant: 'SK Restaurant', status: 'Active' },
    { name: 'Raj Patel', email: 'raj@royalspice.in', role: 'Restaurant Owner', restaurant: 'Royal Spice', status: 'Payment Due' },
    { name: 'Anita Sharma', email: 'anita@foodhouse.com', role: 'Restaurant Owner', restaurant: 'The Food House', status: 'Active' },
    { name: 'Vikram Rao', email: 'vikram@urbancafe.com', role: 'Restaurant Owner', restaurant: 'Urban Cafe', status: 'Expired' },
    { name: 'Platform Owner', email: 'admin@dinescan.com', role: 'Super Admin', restaurant: 'Platform-wide', status: 'Active' },
  ];

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.restaurant.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Users & Owners</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of restaurant owners, managers, and operational staff registered across DineScan.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">User</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Restaurant Affiliation</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-bold text-purple-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {u.restaurant}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : u.status === 'Payment Due'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
