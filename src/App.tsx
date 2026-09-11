import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { NotificationProvider } from '@/lib/notification-context';
import { ThemeProvider } from '@/lib/theme-context';
import { FloatingThemeSwitcher } from '@/components/ui/ThemeColorPicker';
import type { Permission } from '@/types';
import AdminLayout from '@/components/admin/AdminLayout';
import SuperAdminLayout from '@/components/super-admin/SuperAdminLayout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import RestaurantSelectPage from '@/pages/auth/RestaurantSelectPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';

// Restaurant Admin Pages
import DashboardPage from '@/pages/admin/DashboardPage';
import MenuManagementPage from '@/pages/admin/MenuManagementPage';
import CategoriesPage from '@/pages/admin/CategoriesPage';
import TablesPage from '@/pages/admin/TablesPage';
import OrdersPage from '@/pages/admin/OrdersPage';
import OffersPage from '@/pages/admin/OffersPage';
import CustomersPage from '@/pages/admin/CustomersPage';
import FeedbackPage from '@/pages/admin/FeedbackPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import RolesPage from '@/pages/admin/RolesPage';
import StaffManagementPage from '@/pages/admin/StaffManagementPage';
import RestaurantBillingPage from '@/pages/admin/RestaurantBillingPage';
import ProfilePage from '@/pages/admin/ProfilePage';
import AppearancePage from '@/pages/admin/AppearancePage';
import SettingsPage from '@/pages/admin/SettingsPage';

// Customer & Kitchen Pages
import MenuPage from '@/pages/customer/MenuPage';
import ItemDetailPage from '@/pages/customer/ItemDetailPage';
import CartPage from '@/pages/customer/CartPage';
import OrderTrackingPage from '@/pages/customer/OrderTrackingPage';
import KitchenPage from '@/pages/kitchen/KitchenPage';

// Super Admin Platform Pages
import SuperAdminDashboardPage from '@/pages/super-admin/SuperAdminDashboardPage';
import SuperAdminRestaurantsPage from '@/pages/super-admin/SuperAdminRestaurantsPage';
import SuperAdminRestaurantDetailPage from '@/pages/super-admin/SuperAdminRestaurantDetailPage';
import SuperAdminSubscriptionsPage from '@/pages/super-admin/SuperAdminSubscriptionsPage';
import SuperAdminPaymentsPage from '@/pages/super-admin/SuperAdminPaymentsPage';
import SuperAdminPlansPage from '@/pages/super-admin/SuperAdminPlansPage';
import SuperAdminUsersPage from '@/pages/super-admin/SuperAdminUsersPage';
import SuperAdminReportsPage from '@/pages/super-admin/SuperAdminReportsPage';
import SuperAdminSettingsPage from '@/pages/super-admin/SuperAdminSettingsPage';

import { ShieldAlert, AlertOctagon } from 'lucide-react';

function ForbiddenPage({ message, returnTo }: { message?: string; returnTo?: string }) {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const home = returnTo || (userRole === 'kitchen' ? '/kitchen' : userRole === 'cashier' ? '/admin/orders' : '/admin/dashboard');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4 shadow-xs">
        <ShieldAlert size={36} />
      </div>
      <h1 className="text-3xl font-black text-slate-900">403</h1>
      <p className="mt-1 text-base font-bold text-slate-800">Access Denied</p>
      <p className="mt-1.5 max-w-md text-sm text-slate-500">
        {message || "You don't have permission to access this section."}
      </p>
      <button
        onClick={() => navigate(home)}
        className="mt-6 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-700 transition"
      >
        Return to My Workspace
      </button>
    </div>
  );
}

function SuspendedPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 mb-4">
        <AlertOctagon size={36} />
      </div>
      <h1 className="text-2xl font-black">Account Suspended</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400 leading-relaxed">
        Your DineScan account has been suspended. Please contact DineScan support or your platform administrator.
      </p>
      <button
        onClick={async () => {
          await signOut();
          navigate('/login');
        }}
        className="mt-6 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
      >
        Sign Out
      </button>
    </div>
  );
}

function ProtectedRoute({ requireRestaurant = true }: { requireRestaurant?: boolean }) {
  const { user, restaurant, loading, isPlatformOwner } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  // Super Admin can proceed without restaurant requirement
  if (isPlatformOwner) return <Outlet />;

  if (requireRestaurant && !restaurant) return <Navigate to="/onboarding" replace />;

  if (restaurant?.status === 'suspended') {
    return <SuspendedPage />;
  }

  return <Outlet />;
}

function SuperAdminRoute() {
  const { user, isPlatformOwner, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-purple-800 border-t-purple-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!isPlatformOwner) {
    return (
      <ForbiddenPage
        message="Only DineScan Platform Owners can access the Super Admin Portal."
        returnTo="/admin/dashboard"
      />
    );
  }

  return (
    <SuperAdminLayout>
      <Outlet />
    </SuperAdminLayout>
  );
}

function RoleRoute({
  permission,
  children,
}: {
  permission?: Permission;
  children: React.ReactNode;
}) {
  const { can, userRole, subscription } = useAuth();
  const location = useLocation();

  // Expired Subscription restriction on operational routes
  if (
    subscription?.status === 'EXPIRED' &&
    !['/admin/billing', '/admin/profile'].includes(location.pathname)
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-3">
          <AlertOctagon size={28} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Operational Access Restricted</h2>
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-500">
          This restaurant's subscription has expired. Orders, menu editing, and live table features are locked until the plan is renewed.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => window.location.href = '/admin/billing'}
            className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
          >
            Go to Billing & Renew
          </button>
        </div>
      </div>
    );
  }

  if (permission && !can(permission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

function AdminShell() {
  const { userRole } = useAuth();
  if (userRole === 'kitchen') {
    return <Navigate to="/kitchen" replace />;
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated routes that do not require an active restaurant yet */}
      <Route element={<ProtectedRoute requireRestaurant={false} />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/select-restaurant" element={<RestaurantSelectPage />} />
      </Route>

      {/* Super Admin Platform Routes */}
      <Route element={<SuperAdminRoute />}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
        <Route path="/super-admin/restaurants" element={<SuperAdminRestaurantsPage />} />
        <Route path="/super-admin/restaurants/:id" element={<SuperAdminRestaurantDetailPage />} />
        <Route path="/super-admin/subscriptions" element={<SuperAdminSubscriptionsPage />} />
        <Route path="/super-admin/payments" element={<SuperAdminPaymentsPage />} />
        <Route path="/super-admin/plans" element={<SuperAdminPlansPage />} />
        <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
        <Route path="/super-admin/reports" element={<SuperAdminReportsPage />} />
        <Route path="/super-admin/settings" element={<SuperAdminSettingsPage />} />
      </Route>

      {/* Authenticated Restaurant Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/admin/dashboard" element={<RoleRoute permission="dashboard.view"><DashboardPage /></RoleRoute>} />
          <Route path="/admin/orders" element={<RoleRoute permission="orders.view"><OrdersPage /></RoleRoute>} />
          <Route path="/admin/menu" element={<RoleRoute permission="menu.view"><MenuManagementPage /></RoleRoute>} />
          <Route path="/admin/categories" element={<RoleRoute permission="categories.view"><CategoriesPage /></RoleRoute>} />
          <Route path="/admin/tables" element={<RoleRoute permission="tables.view"><TablesPage /></RoleRoute>} />
          <Route path="/admin/offers" element={<RoleRoute permission="offers.view"><OffersPage /></RoleRoute>} />
          <Route path="/admin/customers" element={<RoleRoute permission="customers.view"><CustomersPage /></RoleRoute>} />
          <Route path="/admin/feedback" element={<RoleRoute permission="feedback.view"><FeedbackPage /></RoleRoute>} />
          <Route path="/admin/reports" element={<RoleRoute permission="reports.view"><ReportsPage /></RoleRoute>} />
          <Route path="/admin/staff" element={<RoleRoute permission="staff.view"><StaffManagementPage /></RoleRoute>} />
          <Route path="/admin/roles" element={<RoleRoute permission="staff.permissions"><StaffManagementPage /></RoleRoute>} />
          <Route path="/admin/billing" element={<RoleRoute permission="billing.view"><RestaurantBillingPage /></RoleRoute>} />
          <Route path="/admin/profile" element={<RoleRoute permission="restaurant_profile.view"><ProfilePage /></RoleRoute>} />
          <Route path="/admin/appearance" element={<RoleRoute permission="appearance.view"><AppearancePage /></RoleRoute>} />
          <Route path="/admin/settings" element={<RoleRoute permission="settings.view"><SettingsPage /></RoleRoute>} />
        </Route>
        <Route path="/kitchen" element={<RoleRoute permission="kitchen.view"><KitchenPage /></RoleRoute>} />
      </Route>

      {/* Public Customer QR Menu & Cart Routes */}
      <Route path="/menu/:restaurantSlug" element={<MenuPage />} />
      <Route path="/menu/:restaurantSlug/item/:itemId" element={<ItemDetailPage />} />
      <Route path="/menu/:restaurantSlug/cart" element={<CartPage />} />
      <Route path="/order/:orderId" element={<OrderTrackingPage />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <AppRoutes />
              <FloatingThemeSwitcher />
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
