-- ============================================================================
-- DineScan Multi-Restaurant SaaS Schema Upgrade
-- ============================================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  phone text,
  avatar_url text,
  platform_role text NOT NULL DEFAULT 'USER' CHECK (platform_role IN ('PLATFORM_OWNER', 'USER')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_profiles" ON profiles;
CREATE POLICY "read_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'PLATFORM_OWNER')
  );

DROP POLICY IF EXISTS "update_profiles" ON profiles;
CREATE POLICY "update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 2. EXTEND RESTAURANTS WITH STATUS AND OWNER_USER_ID
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'past_due', 'expired', 'suspended'));

-- 3. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  monthly_price numeric NOT NULL DEFAULT 0,
  yearly_price numeric NOT NULL DEFAULT 0,
  table_limit integer NOT NULL DEFAULT 10,
  staff_limit integer NOT NULL DEFAULT 3,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_plans" ON subscription_plans;
CREATE POLICY "read_plans" ON subscription_plans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "manage_plans_platform_owner" ON subscription_plans;
CREATE POLICY "manage_plans_platform_owner" ON subscription_plans FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'PLATFORM_OWNER')
  );

-- 4. RESTAURANT SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  next_billing_date timestamptz NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_restaurant_subscriptions" ON restaurant_subscriptions;
CREATE POLICY "read_restaurant_subscriptions" ON restaurant_subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'PLATFORM_OWNER') OR
    EXISTS (SELECT 1 FROM restaurant_members WHERE restaurant_id = restaurant_subscriptions.restaurant_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_subscriptions.restaurant_id AND owner_id = auth.uid())
  );

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES restaurant_subscriptions(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'OVERDUE', 'FAILED', 'REFUNDED')),
  payment_method text DEFAULT 'UPI',
  transaction_id text,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_payments" ON payments;
CREATE POLICY "read_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'PLATFORM_OWNER') OR
    EXISTS (SELECT 1 FROM restaurant_members WHERE restaurant_id = payments.restaurant_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM restaurants WHERE id = payments.restaurant_id AND owner_id = auth.uid())
  );

-- 6. PERMISSIONS & ROLES
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key text NOT NULL UNIQUE,
  module text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system_role boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES restaurant_roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- 7. RESTAURANT MEMBERS EXTENSIONS
ALTER TABLE restaurant_members ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'deactivated'));
ALTER TABLE restaurant_members ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE restaurant_members ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();
ALTER TABLE restaurant_members ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE restaurant_members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE restaurant_members ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE restaurant_members ADD COLUMN IF NOT EXISTS custom_permissions text[] DEFAULT '{}';

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  action text NOT NULL,
  module text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_audit_logs" ON audit_logs;
CREATE POLICY "read_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'PLATFORM_OWNER') OR
    EXISTS (SELECT 1 FROM restaurant_members WHERE restaurant_id = audit_logs.restaurant_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM restaurants WHERE id = audit_logs.restaurant_id AND owner_id = auth.uid())
  );

-- Indexes for performance & security
CREATE INDEX IF NOT EXISTS idx_payments_restaurant ON payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_subs_restaurant ON restaurant_subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON restaurant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_audit_restaurant ON audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_restaurant ON restaurant_members(restaurant_id);
