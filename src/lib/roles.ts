import type { Permission, UserRole, StaffRole, GranularPermission, LegacyPermission } from '@/types';

// Backward compatibility & synonym mapping between dot-notation and legacy underscore-notation
const PERMISSION_EQUIVALENTS: Record<string, string[]> = {
  'dashboard.view': ['view_dashboard'],
  'view_dashboard': ['dashboard.view'],

  'orders.view': ['view_orders'],
  'view_orders': ['orders.view'],
  'orders.create': ['manage_orders'],
  'orders.accept': ['manage_orders'],
  'orders.update_status': ['manage_orders'],
  'orders.cancel': ['manage_orders'],
  'manage_orders': ['orders.view', 'orders.create', 'orders.accept', 'orders.update_status', 'orders.cancel'],

  'kitchen.view': ['view_kitchen'],
  'view_kitchen': ['kitchen.view'],
  'kitchen.update_status': ['view_kitchen'],

  'menu.view': ['manage_menu'],
  'menu.create': ['manage_menu'],
  'menu.edit': ['manage_menu'],
  'menu.delete': ['manage_menu'],
  'manage_menu': ['menu.view', 'menu.create', 'menu.edit', 'menu.delete'],

  'categories.view': ['manage_categories'],
  'categories.create': ['manage_categories'],
  'categories.edit': ['manage_categories'],
  'categories.delete': ['manage_categories'],
  'manage_categories': ['categories.view', 'categories.create', 'categories.edit', 'categories.delete'],

  'tables.view': ['manage_tables'],
  'tables.create': ['manage_tables'],
  'tables.edit': ['manage_tables'],
  'tables.delete': ['manage_tables'],
  'tables.generate_qr': ['manage_tables'],
  'manage_tables': ['tables.view', 'tables.create', 'tables.edit', 'tables.delete', 'tables.generate_qr'],

  'offers.view': ['manage_offers'],
  'offers.create': ['manage_offers'],
  'offers.edit': ['manage_offers'],
  'offers.delete': ['manage_offers'],
  'manage_offers': ['offers.view', 'offers.create', 'offers.edit', 'offers.delete'],

  'customers.view': ['view_customers'],
  'customers.edit': ['view_customers'],
  'view_customers': ['customers.view', 'customers.edit'],

  'feedback.view': ['view_reports'],
  'reports.view': ['view_reports'],
  'reports.export': ['view_reports'],
  'view_reports': ['feedback.view', 'reports.view', 'reports.export'],

  'restaurant_profile.view': ['manage_profile'],
  'restaurant_profile.edit': ['manage_profile'],
  'manage_profile': ['restaurant_profile.view', 'restaurant_profile.edit'],

  'appearance.view': ['manage_appearance'],
  'appearance.edit': ['manage_appearance'],
  'manage_appearance': ['appearance.view', 'appearance.edit'],

  'settings.view': ['manage_settings'],
  'settings.edit': ['manage_settings'],
  'manage_settings': ['settings.view', 'settings.edit'],

  'staff.view': ['manage_roles'],
  'staff.create': ['manage_roles'],
  'staff.edit': ['manage_roles'],
  'staff.delete': ['manage_roles'],
  'staff.permissions': ['manage_roles'],
  'manage_roles': ['staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.permissions'],

  'billing.view': ['manage_restaurant'],
  'manage_restaurant': ['billing.view', 'manage_settings', 'manage_profile'],
};

// ============ GRANULAR PERMISSIONS MATRIX ============
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'dashboard.view', 'view_dashboard',
    'orders.view', 'orders.create', 'orders.accept', 'orders.update_status', 'orders.cancel', 'view_orders', 'manage_orders', 'print_bill',
    'kitchen.view', 'kitchen.update_status', 'view_kitchen',
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'manage_menu',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete', 'manage_categories',
    'tables.view', 'tables.create', 'tables.edit', 'tables.delete', 'tables.generate_qr', 'manage_tables',
    'offers.view', 'offers.create', 'offers.edit', 'offers.delete', 'manage_offers',
    'customers.view', 'customers.edit', 'view_customers',
    'feedback.view', 'reports.view', 'reports.export', 'view_reports',
    'restaurant_profile.view', 'restaurant_profile.edit', 'manage_profile',
    'appearance.view', 'appearance.edit', 'manage_appearance',
    'settings.view', 'settings.edit', 'manage_settings',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.permissions', 'manage_roles',
    'billing.view', 'manage_restaurant',
  ],
  owner: [
    'dashboard.view', 'view_dashboard',
    'orders.view', 'orders.create', 'orders.accept', 'orders.update_status', 'orders.cancel', 'view_orders', 'manage_orders', 'print_bill',
    'kitchen.view', 'kitchen.update_status', 'view_kitchen',
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'manage_menu',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete', 'manage_categories',
    'tables.view', 'tables.create', 'tables.edit', 'tables.delete', 'tables.generate_qr', 'manage_tables',
    'offers.view', 'offers.create', 'offers.edit', 'offers.delete', 'manage_offers',
    'customers.view', 'customers.edit', 'view_customers',
    'feedback.view', 'reports.view', 'reports.export', 'view_reports',
    'restaurant_profile.view', 'restaurant_profile.edit', 'manage_profile',
    'appearance.view', 'appearance.edit', 'manage_appearance',
    'settings.view', 'settings.edit', 'manage_settings',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.permissions', 'manage_roles',
    'billing.view', 'manage_restaurant',
  ],
  manager: [
    'dashboard.view', 'view_dashboard',
    'orders.view', 'orders.create', 'orders.accept', 'orders.update_status', 'orders.cancel', 'view_orders', 'manage_orders', 'print_bill',
    'kitchen.view', 'kitchen.update_status', 'view_kitchen',
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'manage_menu',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete', 'manage_categories',
    'tables.view', 'tables.create', 'tables.edit', 'tables.delete', 'tables.generate_qr', 'manage_tables',
    'offers.view', 'offers.create', 'offers.edit', 'offers.delete', 'manage_offers',
    'customers.view', 'customers.edit', 'view_customers',
    'feedback.view', 'reports.view', 'view_reports',
    'restaurant_profile.view', 'manage_profile',
    'staff.view',
  ],
  kitchen: [
    'dashboard.view', 'view_dashboard',
    'orders.view', 'view_orders',
    'kitchen.view', 'kitchen.update_status', 'view_kitchen',
  ],
  cashier: [
    'dashboard.view', 'view_dashboard',
    'orders.view', 'orders.create', 'orders.update_status', 'view_orders', 'manage_orders', 'print_bill',
    'customers.view', 'view_customers',
    'tables.view',
  ],
  waiter: [
    'dashboard.view', 'view_dashboard',
    'orders.view', 'orders.create', 'view_orders',
    'tables.view',
  ],
  custom: [],
};

// Module grouping for permission editor UI
export interface PermissionModuleGroup {
  module: string;
  label: string;
  permissions: { key: GranularPermission; label: string; description: string }[];
}

export const PERMISSION_GROUPS: PermissionModuleGroup[] = [
  {
    module: 'ORDERS',
    label: 'Orders',
    permissions: [
      { key: 'orders.view', label: 'View Orders', description: 'Can view customer table and takeaway orders' },
      { key: 'orders.create', label: 'Create Orders', description: 'Can place new orders on behalf of customers' },
      { key: 'orders.accept', label: 'Accept Orders', description: 'Can accept newly arrived orders' },
      { key: 'orders.update_status', label: 'Update Status', description: 'Can transition order statuses (Preparing, Ready, Served)' },
      { key: 'orders.cancel', label: 'Cancel Orders', description: 'Can cancel or void active orders' },
    ],
  },
  {
    module: 'KITCHEN',
    label: 'Kitchen Display',
    permissions: [
      { key: 'kitchen.view', label: 'View Kitchen Display', description: 'Can access live Kitchen Display System (KDS)' },
      { key: 'kitchen.update_status', label: 'Update Kitchen Items', description: 'Can mark items as preparing or ready' },
    ],
  },
  {
    module: 'MENU',
    label: 'Menu Management',
    permissions: [
      { key: 'menu.view', label: 'View Menu Items', description: 'Can view restaurant menu catalogue' },
      { key: 'menu.create', label: 'Add Item', description: 'Can add new food items to the menu' },
      { key: 'menu.edit', label: 'Edit Item', description: 'Can update prices, descriptions, and images' },
      { key: 'menu.delete', label: 'Delete Item', description: 'Can delete items from the menu' },
    ],
  },
  {
    module: 'CATEGORIES',
    label: 'Categories',
    permissions: [
      { key: 'categories.view', label: 'View Categories', description: 'Can view menu categories' },
      { key: 'categories.create', label: 'Add Category', description: 'Can add new categories' },
      { key: 'categories.edit', label: 'Edit Category', description: 'Can edit category details' },
      { key: 'categories.delete', label: 'Delete Category', description: 'Can delete categories' },
    ],
  },
  {
    module: 'TABLES',
    label: 'Tables & QR Codes',
    permissions: [
      { key: 'tables.view', label: 'View Tables', description: 'Can see table statuses and seating layout' },
      { key: 'tables.create', label: 'Add Table', description: 'Can add new tables' },
      { key: 'tables.edit', label: 'Edit Table', description: 'Can modify seats, names, and area' },
      { key: 'tables.delete', label: 'Delete Table', description: 'Can remove tables' },
      { key: 'tables.generate_qr', label: 'Download QR Codes', description: 'Can export and print table QR codes' },
    ],
  },
  {
    module: 'OFFERS',
    label: 'Offers & Coupons',
    permissions: [
      { key: 'offers.view', label: 'View Offers', description: 'Can view active discounts' },
      { key: 'offers.create', label: 'Create Offer', description: 'Can create promotional codes' },
      { key: 'offers.edit', label: 'Edit Offer', description: 'Can update coupons' },
      { key: 'offers.delete', label: 'Delete Offer', description: 'Can deactivate or delete coupons' },
    ],
  },
  {
    module: 'CUSTOMERS',
    label: 'Customer CRM',
    permissions: [
      { key: 'customers.view', label: 'View Customers', description: 'Can view customer list, spend, and visit history' },
      { key: 'customers.edit', label: 'Edit Customer', description: 'Can update customer records' },
    ],
  },
  {
    module: 'REPORTS',
    label: 'Analytics & Reports',
    permissions: [
      { key: 'reports.view', label: 'View Reports', description: 'Can view sales charts and metrics' },
      { key: 'reports.export', label: 'Export Data', description: 'Can download CSV/PDF reports' },
      { key: 'feedback.view', label: 'View Feedback', description: 'Can review guest ratings and comments' },
    ],
  },
  {
    module: 'STAFF',
    label: 'Staff & Permissions',
    permissions: [
      { key: 'staff.view', label: 'View Staff', description: 'Can view staff list and roles' },
      { key: 'staff.create', label: 'Invite Staff', description: 'Can send invitations to new team members' },
      { key: 'staff.edit', label: 'Edit Staff Role', description: 'Can change staff roles and active status' },
      { key: 'staff.delete', label: 'Remove Staff', description: 'Can delete staff accounts from the restaurant' },
      { key: 'staff.permissions', label: 'Manage Roles', description: 'Can configure custom roles and permission matrix' },
    ],
  },
  {
    module: 'SETTINGS',
    label: 'Restaurant Settings',
    permissions: [
      { key: 'restaurant_profile.view', label: 'View Profile', description: 'Can see restaurant contact and location info' },
      { key: 'restaurant_profile.edit', label: 'Edit Profile', description: 'Can update restaurant timing, address, and info' },
      { key: 'appearance.view', label: 'View Appearance', description: 'Can view theme and menu branding settings' },
      { key: 'appearance.edit', label: 'Edit Appearance', description: 'Can customize theme colors and card styles' },
      { key: 'settings.view', label: 'View Settings', description: 'Can see tax, GST, and ordering configurations' },
      { key: 'settings.edit', label: 'Edit Settings', description: 'Can change taxes, auto-accept, and order rules' },
      { key: 'billing.view', label: 'View Billing & Subscriptions', description: 'Can view subscription plan, invoices, and payment history' },
    ],
  },
];

// Check if a role has a given permission
export function can(role: UserRole, permission: Permission, customPermissions?: Permission[]): boolean {
  if (role === 'super_admin' || role === 'owner') return true;

  const roleBase = ROLE_PERMISSIONS[role] ?? [];
  const allUserPerms = new Set<string>([...roleBase, ...(customPermissions || [])]);

  // Direct check
  if (allUserPerms.has(permission)) return true;

  // Check equivalents
  const equivalents = PERMISSION_EQUIVALENTS[permission] || [];
  return equivalents.some(eq => allUserPerms.has(eq));
}

export function hasPermission(role: UserRole, permission: Permission, customPermissions?: Permission[]): boolean {
  return can(role, permission, customPermissions);
}

export function isPlatformOwner(userRole: UserRole, platformRole?: string): boolean {
  return userRole === 'super_admin' || platformRole === 'PLATFORM_OWNER';
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Nav items permission mapping
export const NAV_PERMISSIONS: Record<string, Permission | null> = {
  '/admin/dashboard':  'dashboard.view',
  '/admin/orders':     'orders.view',
  '/admin/menu':       'menu.view',
  '/admin/categories': 'categories.view',
  '/admin/tables':     'tables.view',
  '/admin/offers':     'offers.view',
  '/admin/customers':  'customers.view',
  '/admin/feedback':   'feedback.view',
  '/admin/reports':    'reports.view',
  '/admin/staff':      'staff.view',
  '/admin/roles':      'staff.permissions',
  '/admin/profile':    'restaurant_profile.view',
  '/admin/appearance': 'appearance.view',
  '/admin/billing':    'billing.view',
  '/admin/settings':   'settings.view',
  '/kitchen':          'kitchen.view',
};

// localStorage key for storing roles per restaurant
const ROLE_STORAGE_KEY = 'dinescan_restaurant_roles';

export interface StoredRole {
  restaurantId: string;
  userId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status?: 'active' | 'invited' | 'deactivated';
  customPermissions?: Permission[];
  lastLogin?: string;
}

export function getStoredRoles(): StoredRole[] {
  try {
    return JSON.parse(localStorage.getItem(ROLE_STORAGE_KEY) || '[]') as StoredRole[];
  } catch { return []; }
}

export function saveStoredRoles(roles: StoredRole[]): void {
  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
}

export function getUserRoleForRestaurant(userId: string, restaurantId: string, email?: string | null): UserRole {
  const stored = getStoredRoles();
  const found = stored.find(r =>
    r.restaurantId === restaurantId &&
    (r.userId === userId || (email && r.email.toLowerCase() === email.toLowerCase()))
  );
  return found?.role ?? 'owner';
}

export function getUserCustomPermissions(userId: string, restaurantId: string, email?: string | null): Permission[] {
  const stored = getStoredRoles();
  const found = stored.find(r =>
    r.restaurantId === restaurantId &&
    (r.userId === userId || (email && r.email.toLowerCase() === email.toLowerCase()))
  );
  return found?.customPermissions ?? [];
}

export function getRestaurantIdsForUser(userId: string, email?: string | null): string[] {
  const stored = getStoredRoles();
  return stored
    .filter(r => r.userId === userId || (email && r.email.toLowerCase() === email.toLowerCase()))
    .map(r => r.restaurantId);
}

export function setUserRoleForRestaurant(
  userId: string,
  restaurantId: string,
  email: string,
  name: string,
  role: UserRole,
  customPermissions?: Permission[],
  phone?: string
): void {
  const stored = getStoredRoles();
  const normalizedEmail = email.toLowerCase().trim();
  const idx = stored.findIndex(r =>
    r.restaurantId === restaurantId &&
    (r.userId === userId || r.email.toLowerCase() === normalizedEmail)
  );
  const entry: StoredRole = {
    restaurantId,
    userId,
    email: normalizedEmail,
    name,
    phone,
    role,
    status: 'active',
    customPermissions,
    lastLogin: new Date().toISOString(),
  };
  if (idx >= 0) stored[idx] = entry;
  else stored.push(entry);
  saveStoredRoles(stored);
}

export function getRestaurantTeam(restaurantId: string): StoredRole[] {
  return getStoredRoles().filter(r => r.restaurantId === restaurantId);
}

export function removeUserFromRestaurant(userId: string, restaurantId: string): void {
  const stored = getStoredRoles().filter(r => !(r.userId === userId && r.restaurantId === restaurantId));
  saveStoredRoles(stored);
}
