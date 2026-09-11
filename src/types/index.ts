// ============ ROLES & PERMISSIONS ============
export type PlatformRole = 'PLATFORM_OWNER' | 'USER';

export type StaffRole = 'owner' | 'manager' | 'kitchen' | 'cashier' | 'waiter' | 'custom';
export type UserRole = StaffRole | 'super_admin';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Platform Owner',
  owner: 'Restaurant Owner',
  manager: 'Manager',
  kitchen: 'Kitchen Staff',
  cashier: 'Cashier',
  waiter: 'Waiter',
  custom: 'Custom Role',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  owner: 'bg-orange-100 text-orange-700 border-orange-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  cashier: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  kitchen: 'bg-amber-100 text-amber-700 border-amber-200',
  waiter: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  custom: 'bg-slate-100 text-slate-700 border-slate-200',
};

// Granular permissions supporting both modern dot-notation and backward-compatible underscore notation
export type GranularPermission =
  | 'dashboard.view'
  | 'orders.view'
  | 'orders.create'
  | 'orders.accept'
  | 'orders.update_status'
  | 'orders.cancel'
  | 'kitchen.view'
  | 'kitchen.update_status'
  | 'menu.view'
  | 'menu.create'
  | 'menu.edit'
  | 'menu.delete'
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  | 'tables.view'
  | 'tables.create'
  | 'tables.edit'
  | 'tables.delete'
  | 'tables.generate_qr'
  | 'offers.view'
  | 'offers.create'
  | 'offers.edit'
  | 'offers.delete'
  | 'customers.view'
  | 'customers.edit'
  | 'feedback.view'
  | 'reports.view'
  | 'reports.export'
  | 'restaurant_profile.view'
  | 'restaurant_profile.edit'
  | 'appearance.view'
  | 'appearance.edit'
  | 'settings.view'
  | 'settings.edit'
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.delete'
  | 'staff.permissions'
  | 'billing.view';

export type LegacyPermission =
  | 'view_dashboard' | 'view_orders' | 'manage_orders' | 'print_bill'
  | 'manage_menu' | 'manage_categories' | 'manage_tables'
  | 'manage_offers' | 'view_customers' | 'view_reports'
  | 'manage_roles' | 'manage_profile' | 'manage_appearance'
  | 'manage_settings' | 'view_kitchen' | 'manage_restaurant';

export type Permission = GranularPermission | LegacyPermission;

// ============ SUBSCRIPTIONS & BILLING ============
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'FAILED' | 'REFUNDED';

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  monthly_price: number;
  yearly_price: number;
  table_limit: number;
  staff_limit: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSubscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: 'monthly' | 'yearly';
  starts_at: string;
  expires_at: string;
  next_billing_date: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  invoice_number: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_method: string;
  transaction_id: string | null;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  restaurant?: {
    name: string;
    slug: string;
    owner_name?: string;
    email?: string;
  };
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  restaurant_id: string | null;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
  user_email?: string;
  restaurant_name?: string;
}

export interface RestaurantMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: StaffRole;
  status: 'active' | 'invited' | 'deactivated';
  invited_by?: string | null;
  joined_at: string;
  full_name: string;
  email: string;
  phone?: string | null;
  custom_permissions?: Permission[];
  last_login?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
}

// ============ RESTAURANT ============
export type RestaurantStatus = 'active' | 'trial' | 'past_due' | 'expired' | 'suspended';

export interface Restaurant {
  id: string;
  owner_id: string | null;
  owner_user_id?: string | null;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  type: string;
  food_preference: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  opening_time: string;
  closing_time: string;
  rating: number;
  cuisines: string | null;
  is_open: boolean;
  status?: RestaurantStatus;
  primary_color: string;
  secondary_color: string;
  card_style: string;
  corner_radius: number;
  show_ratings: boolean;
  show_prep_time: boolean;
  show_description: boolean;
  show_discount: boolean;
  show_restaurant_info: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  discount_price: number | null;
  food_type: string;
  spice_level: string;
  prep_time: number;
  rating: number;
  is_available: boolean;
  is_featured: boolean;
  is_recommended: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemAddon {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  seats: number;
  area: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string | null;
  restaurant_id: string;
  table_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  table_number: string | null;
  status: string;
  items_total: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  grand_total: number;
  special_instructions: string | null;
  estimated_prep_time: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  price: number;
  addons: string | null;
  special_instructions: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  restaurant_id: string;
  name: string;
  coupon_code: string;
  discount_type: string;
  discount_value: number;
  minimum_order: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  restaurant_id: string;
  name: string | null;
  phone: string | null;
  total_orders: number;
  total_spend: number;
  last_order_at: string | null;
  favorite_dish: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  customer_name: string | null;
  food_rating: number;
  service_rating: number;
  overall_rating: number;
  comment: string | null;
  created_at: string;
}

export interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  accept_table_orders: boolean;
  allow_customer_notes: boolean;
  require_customer_name: boolean;
  require_phone_number: boolean;
  auto_accept_orders: boolean;
  gst_percentage: number;
  service_charge_percentage: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  addons: MenuItemAddon[];
  special_instructions: string;
  unit_price: number;
}

export const ORDER_STATUSES = [
  'new',
  'accepted',
  'preparing',
  'ready',
  'served',
  'cancelled',
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  accepted: 'bg-amber-100 text-amber-700 border-amber-200',
  preparing: 'bg-orange-100 text-orange-700 border-orange-200',
  ready: 'bg-green-100 text-green-700 border-green-200',
  served: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export interface AppNotification {
  id: string;
  restaurant_id: string;
  title: string;
  message: string;
  type: 'order' | 'table' | 'system';
  order_id?: string;
  order_number?: string;
  table_number?: string;
  amount?: number;
  created_at: string;
  read: boolean;
}

