import { useState, useRef, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, CreditCard, Layers,
  Receipt, Users, BarChart3, Settings, Shield,
  LogOut, Menu, X, ChevronLeft, ChevronRight, Bell, Search,
  ArrowUpRight, AlertTriangle,
} from 'lucide-react';

interface SuperNavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: SuperNavItem[] = [
  { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/super-admin/restaurants', label: 'Restaurants', icon: Building2 },
  { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: Layers },
  { to: '/super-admin/payments', label: 'Payments', icon: Receipt, badge: 'High' },
  { to: '/super-admin/plans', label: 'Plans', icon: CreditCard },
  { to: '/super-admin/users', label: 'Platform Users', icon: Users },
  { to: '/super-admin/reports', label: 'Platform Reports', icon: BarChart3 },
  { to: '/super-admin/settings', label: 'Platform Settings', icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="border-b border-purple-900/40 bg-purple-950 px-4 py-4 flex items-center justify-between">
        {collapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-800 text-white font-black text-sm">
            DS
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-black">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">DineScan</span>
                <span className="rounded bg-purple-600/80 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-purple-200">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] text-purple-300 font-medium">Platform Management</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-slate-900">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-purple-700 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={19} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && item.badge && (
              <span className="rounded-full bg-rose-500/20 text-rose-300 px-2 py-0.5 text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Quick Actions */}
      <div className="border-t border-slate-800 bg-slate-900 px-3 py-3 space-y-1">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <ArrowUpRight size={16} className="shrink-0" />
          {!collapsed && <span>Restaurant Admin View</span>}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-100 flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={cn('relative hidden lg:flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300', sidebarWidth)}>
          <SidebarContent />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-16 -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 shadow-sm transition hover:text-white"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 text-white">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 lg:px-6 min-h-[58px]">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Menu size={20} />
              </button>
              <div>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  DineScan Cloud Platform
                </span>
                <span className="hidden sm:inline ml-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                  Super Admin
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search restaurants, invoices..."
                    className="w-52 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs placeholder-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 lg:w-64"
                  />
                </div>
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 hover:bg-slate-50 transition"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 text-white font-black text-xs">
                    SA
                  </div>
                  <div className="hidden sm:block text-left pr-2">
                    <p className="text-xs font-bold text-slate-900 leading-tight">Platform Owner</p>
                    <p className="text-[10px] text-purple-700 font-semibold leading-tight">admin@dinescan.com</p>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl animate-in fade-in-50 zoom-in-95">
                    <div className="border-b border-slate-100 px-4 py-2">
                      <p className="text-xs font-bold text-slate-900">Platform Administrator</p>
                      <p className="text-[11px] text-slate-500">{user?.email || 'admin@dinescan.com'}</p>
                    </div>
                    <NavLink
                      to="/super-admin/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Settings size={14} /> Platform Settings & Audit
                    </NavLink>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
