import { useState, useRef, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { updateRestaurant } from '@/lib/services';
import { cn } from '@/lib/utils';
import { ROLE_COLORS, ROLE_LABELS } from '@/types';
import type { Permission } from '@/types';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, FolderTree,
  Table2, Tag, Users, MessageSquare, BarChart3, Store,
  Palette, Settings, ChefHat, LogOut, ChevronLeft, ChevronRight,
  Bell, Search, Menu, X, User, Shield, ChevronDown,
  Building2, Check, CreditCard, AlertTriangle, AlertOctagon,
  ArrowLeft,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  permission?: Permission | null;
}

const navItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, permission: 'orders.view' },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed, permission: 'menu.view' },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree, permission: 'categories.view' },
  { to: '/admin/tables', label: 'Tables & QR', icon: Table2, permission: 'tables.view' },
  { to: '/admin/offers', label: 'Offers', icon: Tag, permission: 'offers.view' },
  { to: '/admin/customers', label: 'Customers', icon: Users, permission: 'customers.view' },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare, permission: 'feedback.view' },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
];

const managementItems: NavItem[] = [
  { to: '/admin/staff', label: 'Staff & Permissions', icon: Users, permission: 'staff.view' },
  { to: '/admin/profile', label: 'Restaurant Profile', icon: Store, permission: 'restaurant_profile.view' },
  { to: '/admin/appearance', label: 'Appearance', icon: Palette, permission: 'appearance.view' },
  { to: '/admin/billing', label: 'Billing & Plans', icon: CreditCard, permission: 'billing.view' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings.view' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const {
    restaurant,
    restaurants,
    user,
    userRole,
    can,
    signOut,
    switchRestaurant,
    inspectedRestaurant,
    inspectRestaurant,
    isPlatformOwner,
    subscription,
  } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [restaurantSwitcherOpen, setRestaurantSwitcherOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(restaurant?.is_open ?? true);

  const switcherRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setRestaurantSwitcherOpen(false);
      }
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

  // Filter nav items strictly according to user permissions
  const visibleNavItems = navItems.filter(item => !item.permission || can(item.permission));
  const visibleManagementItems = managementItems.filter(item => !item.permission || can(item.permission));

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="border-b border-slate-100 flex items-center justify-center px-4 py-4">
        {collapsed ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
            <img src="/favicon.png" alt="DineScan" className="h-9 w-9 object-contain" />
          </div>
        ) : (
          <img src="/dinescan-logo-horizontal.png" alt="DineScan" className="h-14 w-auto object-contain" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {visibleManagementItems.length > 0 && (
          <div className="mt-6">
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Management</p>
            )}
            <div className="space-y-1">
              {visibleManagementItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <item.icon size={20} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-1">
        {can('kitchen.view') && (
          <NavLink
            to="/kitchen"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <ChefHat size={20} className="shrink-0 text-amber-500" />
            {!collapsed && <span>Kitchen Display</span>}
          </NavLink>
        )}

        {isPlatformOwner && (
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
          >
            <Shield size={18} className="shrink-0" />
            {!collapsed && <span>Super Admin</span>}
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 flex-col">
      {/* 1. Super Admin Inspection Banner */}
      {inspectedRestaurant && (
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium shadow-md shrink-0 z-50">
          <div className="flex items-center gap-2.5">
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs">
              Super Admin Mode
            </span>
            <span>
              Viewing <strong>{inspectedRestaurant.name}</strong> as Platform Inspector
            </span>
          </div>
          <button
            onClick={async () => {
              await inspectRestaurant(null);
              navigate('/super-admin/dashboard');
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-bold text-purple-900 shadow-sm transition hover:bg-purple-50"
          >
            <ArrowLeft size={14} />
            <span>Return to Super Admin</span>
          </button>
        </div>
      )}

      {/* 2. Past Due Warning Banner */}
      {subscription?.status === 'PAST_DUE' && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 flex items-center justify-between text-xs font-medium shrink-0 z-40">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Payment is due. Please complete payment to avoid service interruption.</span>
          </div>
          <NavLink to="/admin/billing" className="font-bold underline hover:text-amber-950">
            View Billing
          </NavLink>
        </div>
      )}

      {/* 3. Expired Subscription Banner */}
      {subscription?.status === 'EXPIRED' && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2 flex items-center justify-between text-xs font-medium shrink-0 z-40">
          <div className="flex items-center gap-2">
            <AlertOctagon size={16} className="text-rose-600 shrink-0" />
            <span>Your DineScan subscription has expired. Operational access is locked.</span>
          </div>
          <NavLink to="/admin/billing" className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700">
            Renew Now
          </NavLink>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={cn('relative hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-300', sidebarWidth)}>
          <SidebarContent />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-16 -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-slate-600"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-white">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
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
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-2.5 py-2 sm:px-4 sm:py-3 lg:px-6 min-h-[56px] sm:min-h-[62px] gap-2">
            {/* Left: Mobile Menu + Restaurant Header Brand */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Menu size={19} />
              </button>

              {/* Restaurant Header Display / Switcher (only clickable if user has multiple authorized restaurants) */}
              <div className="relative min-w-0" ref={switcherRef}>
                <button
                  onClick={() => {
                    if (restaurants.length > 1) {
                      setRestaurantSwitcherOpen(!restaurantSwitcherOpen);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 sm:gap-2.5 rounded-xl border border-slate-200 bg-slate-50/90 px-2 sm:px-3 py-1 sm:py-1.5 text-left transition max-w-full',
                    restaurants.length > 1 ? 'hover:border-orange-300 hover:bg-orange-50/60 cursor-pointer' : 'cursor-default'
                  )}
                >
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-100 text-xs font-black text-orange-700">
                    {restaurant?.logo_url ? (
                      <img src={restaurant.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      restaurant?.name?.[0] || 'R'
                    )}
                  </div>
                  <div className="min-w-0 max-w-[90px] min-[360px]:max-w-[120px] min-[420px]:max-w-[160px] sm:max-w-[200px] md:max-w-[240px]">
                    <p className="truncate text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {restaurant?.name || 'SK Restaurant'}
                    </p>
                    <p className={`truncate text-[9px] sm:text-[10px] font-semibold leading-tight ${ROLE_COLORS[userRole]?.split(' ')[1] || 'text-slate-500'}`}>
                      {ROLE_LABELS[userRole]}
                    </p>
                  </div>
                  {restaurants.length > 1 && (
                    <ChevronDown size={13} className={cn('shrink-0 text-slate-400 transition-transform duration-200 sm:w-3.5 sm:h-3.5', restaurantSwitcherOpen && 'rotate-180 text-orange-600')} />
                  )}
                </button>

                {/* Dropdown Menu (only if multiple authorized restaurants exist) */}
                {restaurantSwitcherOpen && restaurants.length > 1 && (
                  <div className="absolute left-0 top-full z-50 mt-1.5 w-64 sm:w-72 max-w-[calc(100vw-20px)] rounded-2xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Your Authorized Restaurants
                    </div>
                    <div className="max-h-64 overflow-y-auto px-1 space-y-0.5">
                      {restaurants.map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            switchRestaurant(r.id);
                            setRestaurantSwitcherOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 sm:gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition',
                            restaurant?.id === r.id ? 'bg-orange-50/80 font-semibold text-orange-950' : 'hover:bg-slate-50 text-slate-800'
                          )}
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-100 text-xs font-black text-orange-600">
                            {r.logo_url ? (
                              <img src={r.logo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              r.name[0]
                            )}
                          </div>
                          <span className="flex-1 truncate">{r.name}</span>
                          {restaurant?.id === r.id && <Check size={15} className="shrink-0 text-orange-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Search + Active Status + Notification + User Profile */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-40 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-10 pr-4 text-sm placeholder-slate-400 transition focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 lg:w-56"
                  />
                </div>
              </div>

              {/* Active (OPEN/CLOSED) Status Toggle */}
              {can('settings.edit') && (
                <button
                  onClick={async () => {
                    const next = !isOpen;
                    setIsOpen(next);
                    if (restaurant) {
                      try {
                        await updateRestaurant(restaurant.id, { is_open: next });
                      } catch {}
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition shrink-0 shadow-sm',
                    isOpen
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  )}
                  title={isOpen ? 'Restaurant is ACTIVE / OPEN (Click to change)' : 'Restaurant is CLOSED (Click to change)'}
                >
                  <span className={cn('h-2 w-2 rounded-full shrink-0', isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
                  <span>{isOpen ? 'ACTIVE' : 'CLOSED'}</span>
                </button>
              )}

              {/* Notification Bell */}
              <button
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/60 text-slate-600 transition hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                title="Notifications"
              >
                <Bell size={17} className="sm:w-[19px] sm:h-[19px]" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
              </button>

              {/* User Dropdown Profile */}
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs sm:text-sm font-semibold text-orange-700 transition hover:bg-orange-200"
                >
                  {(user?.email?.[0] || 'U').toUpperCase()}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg animate-in fade-in-50 zoom-in-95">
                    <div className="border-b border-slate-100 px-4 py-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_COLORS[userRole]}`}>
                        {ROLE_LABELS[userRole]}
                      </span>
                    </div>

                    {isPlatformOwner && (
                      <button
                        onClick={() => {
                          navigate('/super-admin/dashboard');
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-50"
                      >
                        <Shield size={16} /> Super Admin Portal
                      </button>
                    )}

                    {can('restaurant_profile.view') && (
                      <button
                        onClick={() => {
                          navigate('/admin/profile');
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User size={16} /> Profile
                      </button>
                    )}

                    {can('staff.view') && (
                      <button
                        onClick={() => {
                          navigate('/admin/staff');
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Shield size={16} /> Staff & Permissions
                      </button>
                    )}

                    {can('billing.view') && (
                      <button
                        onClick={() => {
                          navigate('/admin/billing');
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <CreditCard size={16} /> Billing & Plans
                      </button>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100 mt-1"
                    >
                      <LogOut size={16} /> Logout
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
