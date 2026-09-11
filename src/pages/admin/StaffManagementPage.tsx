import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getStaffByRestaurant, inviteStaff, updateStaffMember, deleteStaffMember } from '@/lib/services';
import { ROLE_COLORS, ROLE_LABELS, type StaffRole, type RestaurantMember, type GranularPermission } from '@/types';
import { PERMISSION_GROUPS } from '@/lib/roles';
import { PageHeader } from '@/components/admin/PageBits';
import { Toast } from '@/components/ui';
import {
  Users, UserPlus, Shield, CheckCircle2,
  Trash2, Edit3, X, Mail, Phone, Check,
  ChevronDown, ChevronUp, UserCheck, Clock,
  Search, Filter, Sparkles, Plus, RefreshCw,
  ChefHat, Receipt, UtensilsCrossed, Briefcase, KeyRound
} from 'lucide-react';

const ROLE_OPTIONS: { role: StaffRole; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  {
    role: 'manager',
    label: 'Manager',
    desc: 'Full operational control over orders, menu, tables, reports, and customers.',
    icon: Briefcase,
    color: 'border-blue-200 bg-blue-50/50 text-blue-700',
  },
  {
    role: 'kitchen',
    label: 'Kitchen Staff',
    desc: 'Live Kitchen Display (KDS) access and real-time dish status updates.',
    icon: ChefHat,
    color: 'border-amber-200 bg-amber-50/50 text-amber-700',
  },
  {
    role: 'cashier',
    label: 'Cashier',
    desc: 'Order bills, payment settlements, and customer profiles access.',
    icon: Receipt,
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
  },
  {
    role: 'waiter',
    label: 'Waiter',
    desc: 'Table status management, taking orders, and dining floor assistance.',
    icon: UtensilsCrossed,
    color: 'border-cyan-200 bg-cyan-50/50 text-cyan-700',
  },
  {
    role: 'custom',
    label: 'Custom Role',
    desc: 'Hand-pick specific granular permissions tailored to your exact workflow.',
    icon: KeyRound,
    color: 'border-purple-200 bg-purple-50/50 text-purple-700',
  },
];

const SAMPLE_STAFF = [
  { fullName: 'Rohan Verma', email: 'rohan.verma@dinescan.com', phone: '+91 98765 43210', role: 'manager' as StaffRole },
  { fullName: 'Chef Sanjeev', email: 'kitchen.sanjeev@dinescan.com', phone: '+91 98111 22334', role: 'kitchen' as StaffRole },
  { fullName: 'Pooja Sharma', email: 'pooja.cashier@dinescan.com', phone: '+91 98222 33445', role: 'cashier' as StaffRole },
  { fullName: 'Vikram Singh', email: 'vikram.waiter@dinescan.com', phone: '+91 98333 44556', role: 'waiter' as StaffRole },
];

export default function StaffManagementPage() {
  const { restaurant, can } = useAuth();
  const [staffList, setStaffList] = useState<RestaurantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<RestaurantMember | null>(null);
  const [roleMatrixOpen, setRoleMatrixOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invited' | 'deactivated'>('all');

  // Invite / Edit Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'manager' as StaffRole,
    status: 'active' as 'active' | 'invited',
    customPermissions: [] as GranularPermission[],
  });

  const loadStaff = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const data = await getStaffByRestaurant(restaurant.id);
      setStaffList(data);
    } catch {
      setToast('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaff();
  }, [restaurant?.id]);

  const handleOpenInvite = () => {
    setEditingMember(null);
    setForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'manager',
      status: 'active',
      customPermissions: [],
    });
    setInviteModalOpen(true);
  };

  const handleOpenEdit = (member: RestaurantMember) => {
    setEditingMember(member);
    setForm({
      fullName: member.full_name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      status: member.status === 'invited' ? 'invited' : 'active',
      customPermissions: (member.custom_permissions || []) as GranularPermission[],
    });
    setInviteModalOpen(true);
  };

  const handleTogglePermission = (key: GranularPermission) => {
    setForm(prev => {
      const exists = prev.customPermissions.includes(key);
      const next = exists
        ? prev.customPermissions.filter(k => k !== key)
        : [...prev.customPermissions, key];
      return { ...prev, customPermissions: next };
    });
  };

  const handleToggleGroup = (groupPermissions: { key: GranularPermission }[]) => {
    setForm(prev => {
      const groupKeys = groupPermissions.map(p => p.key);
      const allSelected = groupKeys.every(k => prev.customPermissions.includes(k));
      let next: GranularPermission[];
      if (allSelected) {
        next = prev.customPermissions.filter(k => !groupKeys.includes(k));
      } else {
        const set = new Set([...prev.customPermissions, ...groupKeys]);
        next = Array.from(set);
      }
      return { ...prev, customPermissions: next };
    });
  };

  const handleAutofillSample = () => {
    const randomSample = SAMPLE_STAFF[Math.floor(Math.random() * SAMPLE_STAFF.length)];
    const uniqueSuffix = Math.floor(100 + Math.random() * 900);
    const emailParts = randomSample.email.split('@');
    setForm(prev => ({
      ...prev,
      fullName: randomSample.fullName,
      email: `${emailParts[0]}${uniqueSuffix}@${emailParts[1]}`,
      phone: randomSample.phone,
      role: randomSample.role,
      status: 'active',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    if (!form.email.trim()) {
      setToast('Please enter an email address');
      return;
    }

    try {
      if (editingMember) {
        await updateStaffMember(editingMember.id, {
          full_name: form.fullName,
          phone: form.phone,
          role: form.role,
          status: form.status,
          custom_permissions: form.role === 'custom' ? form.customPermissions : [],
        });
        setToast(`Updated ${form.fullName || form.email} successfully`);
      } else {
        await inviteStaff({
          restaurant_id: restaurant.id,
          full_name: form.fullName.trim() || form.email.split('@')[0],
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          role: form.role,
          status: form.status,
          custom_permissions: form.role === 'custom' ? form.customPermissions : [],
        });
        setToast(`Staff member ${form.fullName || form.email} added successfully`);
      }
      setInviteModalOpen(false);
      void loadStaff();
    } catch (err: unknown) {
      setToast((err as Error)?.message || 'Operation failed');
    }
  };

  const handleDelete = async (member: RestaurantMember) => {
    if (member.role === 'owner') {
      setToast('Cannot remove the restaurant owner account');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${member.full_name || member.email}?`)) return;

    try {
      await deleteStaffMember(member.id);
      setToast(`Removed ${member.full_name || member.email}`);
      void loadStaff();
    } catch {
      setToast('Failed to remove staff member');
    }
  };

  const handleToggleStatus = async (member: RestaurantMember) => {
    if (member.role === 'owner') return;
    const nextStatus = member.status === 'active' ? 'deactivated' : 'active';
    try {
      await updateStaffMember(member.id, { status: nextStatus });
      setToast(`${member.full_name || member.email} is now ${nextStatus}`);
      void loadStaff();
    } catch {
      setToast('Failed to update status');
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(member => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (member.full_name || '').toLowerCase().includes(query);
        const matchesEmail = (member.email || '').toLowerCase().includes(query);
        const matchesPhone = (member.phone || '').toLowerCase().includes(query);
        const matchesRole = (ROLE_LABELS[member.role] || member.role).toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesRole) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && member.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  // KPI Calculations
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.status === 'active').length;
  const pendingInvites = staffList.filter(s => s.status === 'invited').length;
  const distinctRoles = new Set(staffList.map(s => s.role)).size;

  const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Staff & Permissions"
        description="Manage team members, assign operational roles, and customize granular permissions."
        actions={
          can('staff.create') ? (
            <button
              onClick={handleOpenInvite}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 active:scale-95 transition cursor-pointer"
            >
              <UserPlus size={18} />
              <span>+ Add / Invite Staff</span>
            </button>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Total Staff</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{totalStaff}</p>
          <p className="mt-1 text-xs text-slate-400">Team members</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Active Staff</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">{activeStaff}</p>
          <p className="mt-1 text-xs text-slate-400">Operational accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Pending Invitations</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-600">{pendingInvites}</p>
          <p className="mt-1 text-xs text-slate-400">Awaiting acceptance</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Configured Roles</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Shield size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-purple-700">{distinctRoles}</p>
          <p className="mt-1 text-xs text-slate-400">Access levels in use</p>
        </div>
      </div>

      {/* Staff List Table Container */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Restaurant Staff Directory</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {filteredStaff.length} {filteredStaff.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add, search, edit, or configure access rights for everyone on your team.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoleMatrixOpen(!roleMatrixOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Shield size={14} className="text-orange-600" />
              <span>{roleMatrixOpen ? 'Hide Roles Matrix' : 'View Roles Matrix'}</span>
              {roleMatrixOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {can('staff.create') && (
              <button
                onClick={handleOpenInvite}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-95 transition cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Staff</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="border-b border-slate-100 bg-slate-50/40 p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, phone, or role..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2 text-xs sm:text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="deactivated">Deactivated</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="flex items-center gap-1 rounded-xl bg-slate-200/80 hover:bg-slate-300 px-2.5 py-2 text-xs font-bold text-slate-700 transition"
                  title="Reset all filters"
                >
                  <RefreshCw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
              <Filter size={12} /> Roles:
            </span>
            <button
              onClick={() => setRoleFilter('all')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({totalStaff})
            </button>
            {(['owner', 'manager', 'kitchen', 'cashier', 'waiter', 'custom'] as StaffRole[]).map(role => {
              const count = staffList.filter(s => s.role === role).length;
              const isSelected = roleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {ROLE_LABELS[role]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Expandable Role Matrix Preview */}
        {roleMatrixOpen && (
          <div className="border-b border-slate-200/80 bg-slate-50/80 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Default Roles Permission Overview
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <p className="font-bold text-sm text-slate-900">Restaurant Owner</p>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Full complete control across all modules, team, billing, and settings.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <p className="font-bold text-sm text-slate-900">Manager</p>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Menu, orders, tables, categories, offers, customers, and reports.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <p className="font-bold text-sm text-slate-900">Kitchen Staff</p>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Kitchen Display System (KDS), view incoming orders, update dish statuses.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <p className="font-bold text-sm text-slate-900">Cashier</p>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Orders management, print bills, customer view, and table statuses.</p>
              </div>
            </div>
          </div>
        )}

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Staff Member</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                      <span>Loading team members...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {hasActiveFilters ? (
                      <div className="space-y-3">
                        <p className="text-slate-600 font-semibold">No staff members match the selected filters.</p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setRoleFilter('all');
                            setStatusFilter('all');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <RefreshCw size={13} />
                          <span>Clear Filters</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                          <Users size={24} />
                        </div>
                        <p className="text-slate-700 font-bold">No staff members found.</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Start adding managers, chefs, cashiers, and waiters to your restaurant team directory.
                        </p>
                        {can('staff.create') && (
                          <button
                            onClick={handleOpenInvite}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-700"
                          >
                            <Plus size={15} />
                            <span>Add First Staff Member</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-700 ring-2 ring-orange-200/50">
                          {member.full_name?.[0] || member.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{member.full_name || 'Staff Member'}</p>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 text-slate-600">
                              <Mail size={12} className="text-slate-400" /> {member.email}
                            </span>
                            {member.phone && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Phone size={12} className="text-slate-400" /> {member.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : member.status === 'invited'
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {member.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {member.last_login ? 'Active recently' : 'Never logged in'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {member.role !== 'owner' ? (
                        <div className="flex items-center justify-end gap-1">
                          {can('staff.edit') && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(member)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                                title="Edit Role & Permissions"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(member)}
                                className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                                  member.status === 'active'
                                    ? 'text-slate-600 hover:bg-slate-100'
                                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                                title="Deactivate or Reactivate"
                              >
                                {member.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </>
                          )}
                          {can('staff.delete') && (
                            <button
                              onClick={() => handleDelete(member)}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                              title="Remove Staff"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Primary Owner</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite / Add Staff Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingMember ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingMember
                      ? 'Update role assignment or granular module permissions'
                      : `Add to ${restaurant?.name || 'Restaurant'} and configure access`}
                  </p>
                </div>
              </div>

              {/* Demo quick auto-fill button for fast testing */}
              {!editingMember && (
                <button
                  type="button"
                  onClick={handleAutofillSample}
                  className="flex items-center gap-1 rounded-xl bg-orange-50 border border-orange-200 px-2.5 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 transition cursor-pointer"
                  title="Auto-fill sample data for rapid testing"
                >
                  <Sparkles size={13} />
                  <span>Sample Data</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Verma"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingMember}
                    placeholder="rohan@restaurant.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Initial Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: 'active' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer ${
                      form.status === 'active'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Active Immediately</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: 'invited' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer ${
                      form.status === 'invited'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock size={16} />
                    <span>Send Invite Pending</span>
                  </button>
                </div>
              </div>

              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                  Select Staff Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = form.role === opt.role;
                    return (
                      <button
                        type="button"
                        key={opt.role}
                        onClick={() => setForm({ ...form, role: opt.role })}
                        className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-200'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                            <Icon size={16} className={isSelected ? 'text-orange-600' : 'text-slate-500'} />
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && <Check size={16} className="text-orange-600 font-bold" />}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Permission Matrix */}
              {form.role === 'custom' && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Select Custom Granular Permissions
                      </p>
                      <p className="text-[11px] text-slate-500">Pick the exact capabilities this team member should have.</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      {form.customPermissions.length} selected
                    </span>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {PERMISSION_GROUPS.map(group => {
                      const allInGroup = group.permissions.every(p => form.customPermissions.includes(p.key));
                      return (
                        <div key={group.module} className="rounded-lg bg-white border border-slate-200/80 p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black text-slate-800 tracking-wider">
                              {group.label.toUpperCase()}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleToggleGroup(group.permissions)}
                              className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
                            >
                              {allInGroup ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.permissions.map(perm => (
                              <label
                                key={perm.key}
                                className="flex items-start gap-2 cursor-pointer text-xs select-none p-1.5 rounded-md hover:bg-slate-50 transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={form.customPermissions.includes(perm.key)}
                                  onChange={() => handleTogglePermission(perm.key)}
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-400"
                                />
                                <div>
                                  <span className="font-semibold text-slate-800">{perm.label}</span>
                                  <p className="text-[10px] text-slate-500 leading-tight">{perm.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 active:scale-95 transition cursor-pointer"
                >
                  {editingMember ? 'Save Changes' : 'Add Staff Member'}
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
