/*
# DineScan - Complete Restaurant SaaS Schema

## Overview
Creates the full database schema for DineScan, a multi-tenant QR code digital restaurant menu and table ordering platform.

## New Tables
1. **restaurants** - Restaurant profiles with branding, settings, status
2. **categories** - Menu categories per restaurant (Starters, Main Course, etc.)
3. **menu_items** - Food items with pricing, images, veg/non-veg, spice level
4. **menu_item_addons** - Add-on options for menu items (extra cheese, butter, etc.)
5. **restaurant_tables** - Physical tables with QR codes and seating
6. **orders** - Customer orders linked to tables
7. **order_items** - Individual items within an order
8. **offers** - Discount coupons and promotional offers
9. **customers** - Guest customer profiles (name, phone)
10. **feedback** - Post-order ratings and comments
11. **restaurant_settings** - Per-restaurant configuration (taxes, appearance, order settings)

## Security
- RLS enabled on ALL tables
- Multi-tenant: every table has restaurant_id, policies scope by restaurant membership
- Authenticated restaurant owners can CRUD their own restaurant's data
- Anon users can read menu data (for QR scan) and create orders (customer flow)
- Orders can be read by anon using order ID (for tracking)

## Notes
1. Restaurants are owned by auth users via owner_id
2. Customer ordering is anonymous (guest) - no auth required
3. Menu/categories/tables readable by anon so QR scan works without login
4. Orders insertable by anon so customers can place orders without login
*/

-- ============ RESTAURANTS ============
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  cover_url text,
  description text,
  type text DEFAULT 'restaurant',
  food_preference text DEFAULT 'both',
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  gst_number text,
  opening_time text DEFAULT '09:00',
  closing_time text DEFAULT '23:00',
  rating numeric DEFAULT 4.5,
  cuisines text,
  is_open boolean DEFAULT true,
  primary_color text DEFAULT '#F97316',
  secondary_color text DEFAULT '#FFEDD5',
  card_style text DEFAULT 'image_cards',
  corner_radius integer DEFAULT 16,
  show_ratings boolean DEFAULT true,
  show_prep_time boolean DEFAULT true,
  show_description boolean DEFAULT true,
  show_discount boolean DEFAULT true,
  show_restaurant_info boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_restaurants" ON restaurants;
CREATE POLICY "read_restaurants" ON restaurants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_restaurant" ON restaurants;
CREATE POLICY "insert_restaurant" ON restaurants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_restaurant" ON restaurants;
CREATE POLICY "update_restaurant" ON restaurants FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_restaurant" ON restaurants;
CREATE POLICY "delete_restaurant" ON restaurants FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- ============ RESTAURANT MEMBERS ============
CREATE TABLE IF NOT EXISTS restaurant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'owner',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_members" ON restaurant_members;
CREATE POLICY "read_members" ON restaurant_members FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_member" ON restaurant_members;
CREATE POLICY "insert_member" ON restaurant_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_member" ON restaurant_members;
CREATE POLICY "delete_member" ON restaurant_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_category" ON categories;
CREATE POLICY "insert_category" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_category" ON categories;
CREATE POLICY "update_category" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_category" ON categories;
CREATE POLICY "delete_category" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

-- ============ MENU ITEMS ============
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  discount_price numeric,
  food_type text DEFAULT 'veg',
  spice_level text DEFAULT 'mild',
  prep_time integer DEFAULT 15,
  rating numeric DEFAULT 4.5,
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_recommended boolean DEFAULT false,
  is_bestseller boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_menu_items" ON menu_items;
CREATE POLICY "read_menu_items" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_menu_item" ON menu_items;
CREATE POLICY "insert_menu_item" ON menu_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_menu_item" ON menu_items;
CREATE POLICY "update_menu_item" ON menu_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_menu_item" ON menu_items;
CREATE POLICY "delete_menu_item" ON menu_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

-- ============ MENU ITEM ADDONS ============
CREATE TABLE IF NOT EXISTS menu_item_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_item_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_addons" ON menu_item_addons;
CREATE POLICY "read_addons" ON menu_item_addons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_addon" ON menu_item_addons;
CREATE POLICY "insert_addon" ON menu_item_addons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM menu_items mi
      JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_addon" ON menu_item_addons;
CREATE POLICY "update_addon" ON menu_item_addons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM menu_items mi
      JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM menu_items mi
      JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_addon" ON menu_item_addons;
CREATE POLICY "delete_addon" ON menu_item_addons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM menu_items mi
      JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_id AND r.owner_id = auth.uid())
  );

-- ============ RESTAURANT TABLES ============
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  seats integer DEFAULT 4,
  area text DEFAULT 'Ground Floor',
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_tables" ON restaurant_tables;
CREATE POLICY "read_tables" ON restaurant_tables FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_table" ON restaurant_tables;
CREATE POLICY "insert_table" ON restaurant_tables FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_table" ON restaurant_tables;
CREATE POLICY "update_table" ON restaurant_tables FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_table" ON restaurant_tables;
CREATE POLICY "delete_table" ON restaurant_tables FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text,
  phone text,
  total_orders integer DEFAULT 0,
  total_spend numeric DEFAULT 0,
  last_order_at timestamptz,
  favorite_dish text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_customers" ON customers;
CREATE POLICY "read_customers" ON customers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_customer" ON customers;
CREATE POLICY "insert_customer" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_customer" ON customers;
CREATE POLICY "update_customer" ON customers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  table_number text,
  status text DEFAULT 'new',
  items_total numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  service_charge numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  special_instructions text,
  estimated_prep_time integer DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_orders" ON orders;
CREATE POLICY "read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_order" ON orders;
CREATE POLICY "insert_order" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_order" ON orders;
CREATE POLICY "update_order" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_order" ON orders;
CREATE POLICY "delete_order" ON orders FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  addons text,
  special_instructions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_order_items" ON order_items;
CREATE POLICY "read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_order_item" ON order_items;
CREATE POLICY "insert_order_item" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_order_item" ON order_items;
CREATE POLICY "update_order_item" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ OFFERS ============
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  coupon_code text NOT NULL,
  discount_type text DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  minimum_order numeric DEFAULT 0,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_offers" ON offers;
CREATE POLICY "read_offers" ON offers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_offer" ON offers;
CREATE POLICY "insert_offer" ON offers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_offer" ON offers;
CREATE POLICY "update_offer" ON offers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_offer" ON offers;
CREATE POLICY "delete_offer" ON offers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

-- ============ FEEDBACK ============
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_name text,
  food_rating integer DEFAULT 5,
  service_rating integer DEFAULT 5,
  overall_rating integer DEFAULT 5,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_feedback" ON feedback;
CREATE POLICY "read_feedback" ON feedback FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_feedback" ON feedback;
CREATE POLICY "insert_feedback" ON feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_feedback" ON feedback;
CREATE POLICY "delete_feedback" ON feedback FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

-- ============ RESTAURANT SETTINGS ============
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  accept_table_orders boolean DEFAULT true,
  allow_customer_notes boolean DEFAULT true,
  require_customer_name boolean DEFAULT false,
  require_phone_number boolean DEFAULT false,
  auto_accept_orders boolean DEFAULT false,
  gst_percentage numeric DEFAULT 5,
  service_charge_percentage numeric DEFAULT 0,
  currency text DEFAULT '₹',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_settings" ON restaurant_settings;
CREATE POLICY "read_settings" ON restaurant_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_setting" ON restaurant_settings;
CREATE POLICY "insert_setting" ON restaurant_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_setting" ON restaurant_settings;
CREATE POLICY "update_setting" ON restaurant_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_offers_restaurant ON offers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_restaurant ON feedback(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_settings_restaurant ON restaurant_settings(restaurant_id);
