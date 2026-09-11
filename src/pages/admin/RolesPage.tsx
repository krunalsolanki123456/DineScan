import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/types';
import {
  getRestaurantTeam, setUserRoleForRestaurant, removeUserFromRestaurant, type StoredRole,
} from '@/lib/roles';
import { PageHeader } from '@/components/admin/PageBits';
import { Toast } from '@/components/ui';
import {
  Users, Shield, UserPlus, Trash2, Edit3, CheckCircle2,
  Crown, Briefcase, ShoppingBag, ChefHat, X, Key, Copy, Check, Eye, EyeOff, Loader2,
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  super_admin: Crown,
  owner: Shield,
  manager: Briefcase,
  cashier: ShoppingBag,
  kitchen: ChefHat,
  waiter: ShoppingBag,
  custom: Key,
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full access to all features and restaurants',
  owner: 'Full access to this restaurant, manage team',
  manager: 'Menu, orders, tables, reports — no settings',
  cashier: 'View & manage orders, print bills only',
  kitchen: 'Kitchen display only — see preparing orders',
  waiter: 'Floor orders and table management',
  custom: 'Custom granular permissions configured per user',
};

const ALL_ROLES: UserRole[] = ['super_admin', 'owner', 'manager', 'cashier', 'kitchen', 'waiter', 'custom'];

export default function RolesPage() {
  const { restaurant, user, userRole } = useAuth();
  const [team, setTeam] = useState<StoredRole[]>(() =>
    restaurant ? getRestaurantTeam(restaurant.id) : []
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StoredRole | null>(null);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'manager' as UserRole });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; role: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => setTeam(restaurant ? getRestaurantTeam(restaurant.id) : []);

  const handleAdd = async () => {
    if (!restaurant || !user || !form.email.trim()) return;
    if (!form.password.trim() || form.password.length < 6) {
      setToast('Please enter a password with at least 6 characters');
      return;
    }

    setSubmitting(true);
    let userId = `user-${Date.now()}`;
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPassword = form.password.trim();
    const cleanName = form.name.trim() || form.email.split('@')[0];

    try {
      // Use an isolated Supabase client so the current admin is NOT logged out or session corrupted
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: { name: cleanName },
        },
      });

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() || '';
        if (!msg.includes('already registered')) {
          setToast(signUpError.message);
          setSubmitting(false);
          return;
        }
      }

      if (signUpData?.user?.id) {
        userId = signUpData.user.id;
        // Insert membership in Supabase using the newly authenticated tempClient
        await tempClient.from('restaurant_members').insert({
          restaurant_id: restaurant.id,
          user_id: userId,
          role: form.role,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to create user in Supabase:', err);
    }

    setUserRoleForRestaurant(userId, restaurant.id, cleanEmail, cleanName, form.role);
    reload();
    setAddOpen(false);
    setCreatedCredentials({
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: ROLE_LABELS[form.role],
    });
    setForm({ email: '', name: '', password: '', role: 'manager' });
    setSubmitting(false);
  };

  const handleEdit = () => {
    if (!editTarget || !restaurant) return;
    setUserRoleForRestaurant(editTarget.userId, restaurant.id, editTarget.email, editTarget.name || '', form.role);
    reload();
    setEditTarget(null);
    setToast('Role updated successfully');
  };

  const handleRemove = (member: StoredRole) => {
    if (!restaurant) return;
    removeUserFromRestaurant(member.userId, restaurant.id);
    reload();
    setToast(`${member.email} removed from team`);
  };

  const openEdit = (member: StoredRole) => {
    setEditTarget(member);
    setForm(f => ({ ...f, role: member.role }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage your team and control what each member can access."
        actions={
          userRole === 'owner' || userRole === 'super_admin' ? (
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <UserPlus size={17} /> Add Team Member
            </button>
          ) : null
        }
      />

      {/* Permissions Overview */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ALL_ROLES.map(role => {
          const Icon = ROLE_ICONS[role];
          return (
            <div key={role} className={`rounded-2xl border p-4 ${ROLE_COLORS[role]}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} />
                <span className="text-xs font-bold">{ROLE_LABELS[role]}</span>
              </div>
              <p className="text-[11px] leading-4 opacity-80">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Shield size={16}/> Permissions Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Feature</th>
                {ALL_ROLES.map(r => (
                  <th key={r} className="px-3 py-3 text-center font-semibold text-slate-500 whitespace-nowrap">{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                ['Dashboard', true, true, true, false, false],
                ['Orders', true, true, true, true, false],
                ['Print Bill', true, true, true, true, false],
                ['Menu & Categories', true, true, true, false, false],
                ['Tables & QR', true, true, true, true, false],
                ['Offers', true, true, true, false, false],
                ['Customers', true, true, true, false, false],
                ['Reports', true, true, true, false, false],
                ['Manage Roles', true, true, false, false, false],
                ['Appearance', true, true, false, false, false],
                ['Settings', true, true, false, false, false],
                ['Kitchen Display', true, true, true, false, true],
              ].map(([feature, ...perms]) => (
                <tr key={String(feature)} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{String(feature)}</td>
                  {perms.map((allowed, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      {allowed
                        ? <CheckCircle2 size={15} className="mx-auto text-green-500" />
                        : <X size={15} className="mx-auto text-slate-300" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Members */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Users size={16}/> Team Members</h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{team.length} members</span>
        </div>
        {team.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {team.map((member) => {
              const Icon = ROLE_ICONS[member.role];
              return (
                <div key={member.userId} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-600">
                      {(member.name || member.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{member.name || member.email.split('@')[0]}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${ROLE_COLORS[member.role]}`}>
                      <Icon size={11} />{ROLE_LABELS[member.role]}
                    </span>
                    {(userRole === 'owner' || userRole === 'super_admin') && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(member)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleRemove(member)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No team members yet</p>
            <p className="mt-1 text-sm">Add staff members and assign them roles.</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Add Team Member</h3>
              <button onClick={() => setAddOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  placeholder="rahul@gmail.com"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">Login Password</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({...f, password: `Staff@${Math.floor(1000 + Math.random() * 9000)}!`}))}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Min 6 characters (e.g. Rahul@12345)"
                    value={form.password}
                    onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  This password will be used by the staff member to log in to DineScan.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Role</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['manager','cashier','kitchen'] as UserRole[]).map(r => {
                    const Icon = ROLE_ICONS[r];
                    return (
                      <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${form.role === r ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" className="hidden" checked={form.role === r} onChange={() => setForm(f => ({...f, role: r}))}/>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ROLE_COLORS[r]}`}>
                          <Icon size={14}/>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{ROLE_LABELS[r]}</p>
                          <p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[r]}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                disabled={submitting}
                onClick={() => void handleAdd()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin"/> : <UserPlus size={18}/>}
                {submitting ? 'Creating User Account...' : 'Add Member & Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Created Success Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <CheckCircle2 size={32}/>
              </div>
              <h3 className="text-xl font-black text-slate-900">Staff Account Created!</h3>
              <p className="mt-1 text-xs text-slate-500">
                Share these login credentials with <strong>{createdCredentials.name}</strong> so they can log in to DineScan.
              </p>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Assigned Role:</span>
                <span className="font-bold text-brand-600">{createdCredentials.role}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Login URL:</span>
                <span className="font-semibold text-slate-800">{window.location.origin}/login</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Email:</span>
                <span className="font-mono font-bold text-slate-900">{createdCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Password:</span>
                <span className="font-mono font-bold text-slate-900">{createdCredentials.password}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  const text = `DineScan Staff Login\nURL: ${window.location.origin}/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}`;
                  void navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                {copied ? 'Copied Details!' : 'Copy Login Details'}
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Change Role</h3>
              <button onClick={() => setEditTarget(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="space-y-3 p-6">
              <p className="text-sm text-slate-600">Updating role for <strong>{editTarget.email}</strong></p>
              <div className="grid gap-2">
                {ALL_ROLES.map(r => {
                  const Icon = ROLE_ICONS[r];
                  return (
                    <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${form.role === r ? 'border-brand-400 bg-brand-50' : 'border-slate-200'}`}>
                      <input type="radio" className="hidden" checked={form.role === r} onChange={() => setForm(f => ({...f, role: r}))}/>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${ROLE_COLORS[r]}`}><Icon size={13}/></div>
                      <span className="text-sm font-semibold text-slate-900">{ROLE_LABELS[r]}</span>
                    </label>
                  );
                })}
              </div>
              <button onClick={handleEdit} className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white">Update Role</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
