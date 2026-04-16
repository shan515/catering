# Tiffin Service - Supabase Schema

This document defines the SQL schema needed to support the tiffin subscription service. Copy and execute these in the Supabase SQL editor.

## Tables

### 1. tiffin_menus
Stores daily menu templates for the rotating weekly menu.

```sql
CREATE TABLE tiffin_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday, 6=Sunday
  items JSONB DEFAULT '{"starters":[],"main":[],"sweets":[],"drinks":[]}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(day_of_week)
);
```

### 2. tiffin_pricing
Global pricing configuration managed by owner.

```sql
CREATE TABLE tiffin_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_type VARCHAR(20) CHECK (subscription_type IN ('daily','weekly','monthly')),
  price_value DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subscription_type)
);

-- Initialize default pricing (edit these values in admin panel)
INSERT INTO tiffin_pricing (subscription_type, price_value) VALUES
  ('daily', 150.00),
  ('weekly', 950.00),
  ('monthly', 4200.00);
```

### 3. tiffin_addons
Predefined add-on options with fixed pricing.

```sql
CREATE TABLE tiffin_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name)
);

-- Initialize default add-ons
INSERT INTO tiffin_addons (name, price_per_unit) VALUES
  ('Chapatis', 20.00),
  ('Rice', 15.00);
```

### 4. tiffin_customers
Extended customer profile for tiffin subscribers.

```sql
CREATE TABLE tiffin_customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  delivery_instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. tiffin_subscriptions
Tracks all customer subscriptions and their details.

```sql
CREATE TABLE tiffin_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES tiffin_customers(id) ON DELETE CASCADE,
  subscription_type VARCHAR(20) CHECK (subscription_type IN ('daily','weekly','monthly')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active','paused','cancelled')) DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  price_per_day DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. tiffin_orders
Individual daily orders within each subscription.

```sql
CREATE TABLE tiffin_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES tiffin_subscriptions(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  menu_from_id UUID REFERENCES tiffin_menus(id),
  addons_selected JSONB DEFAULT '[]', -- Array of addon IDs: ["uuid1", "uuid2"]
  status VARCHAR(20) CHECK (status IN ('pending','delivered','cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subscription_id, order_date)
);
```

## Setup Instructions

1. Log into your Supabase project
2. Go to SQL Editor
3. Copy each CREATE TABLE statement and execute
4. Copy INSERT statements for tiffin_pricing and tiffin_addons
5. Run Row Level Security setup (below)

## Row Level Security (RLS) Policies

Enable RLS on all tables and add policies:

```sql
-- Enable RLS
ALTER TABLE tiffin_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiffin_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiffin_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiffin_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiffin_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiffin_orders ENABLE ROW LEVEL SECURITY;

-- tiffin_menus: public read, owner write
CREATE POLICY "public_read_menus" ON tiffin_menus FOR SELECT USING (true);
CREATE POLICY "owner_manage_menus" ON tiffin_menus FOR ALL USING (
  auth.uid() = '<OWNER_UID_HERE>' -- Replace with actual owner UID
);

-- tiffin_pricing: public read, owner write
CREATE POLICY "public_read_pricing" ON tiffin_pricing FOR SELECT USING (true);
CREATE POLICY "owner_manage_pricing" ON tiffin_pricing FOR ALL USING (
  auth.uid() = '<OWNER_UID_HERE>'
);

-- tiffin_addons: public read, owner write
CREATE POLICY "public_read_addons" ON tiffin_addons FOR SELECT USING (true);
CREATE POLICY "owner_manage_addons" ON tiffin_addons FOR ALL USING (
  auth.uid() = '<OWNER_UID_HERE>'
);

-- tiffin_customers: users see own profile
CREATE POLICY "users_see_own_profile" ON tiffin_customers FOR SELECT USING (
  auth.uid() = id
);
CREATE POLICY "users_update_own_profile" ON tiffin_customers FOR UPDATE USING (
  auth.uid() = id
);
CREATE POLICY "users_insert_profile" ON tiffin_customers FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- tiffin_subscriptions: users see own subscriptions
CREATE POLICY "users_see_own_subs" ON tiffin_subscriptions FOR SELECT USING (
  customer_id = auth.uid()
);
CREATE POLICY "users_update_own_subs" ON tiffin_subscriptions FOR UPDATE USING (
  customer_id = auth.uid()
);
CREATE POLICY "users_insert_subs" ON tiffin_subscriptions FOR INSERT WITH CHECK (
  customer_id = auth.uid()
);
CREATE POLICY "owner_read_all_subs" ON tiffin_subscriptions FOR SELECT USING (
  auth.uid() = '<OWNER_UID_HERE>'
);

-- tiffin_orders: users see own orders
CREATE POLICY "users_see_own_orders" ON tiffin_orders FOR SELECT USING (
  subscription_id IN (SELECT id FROM tiffin_subscriptions WHERE customer_id = auth.uid())
);
CREATE POLICY "users_update_own_orders" ON tiffin_orders FOR UPDATE USING (
  subscription_id IN (SELECT id FROM tiffin_subscriptions WHERE customer_id = auth.uid())
);
CREATE POLICY "owner_read_all_orders" ON tiffin_orders FOR SELECT USING (
  auth.uid() = '<OWNER_UID_HERE>'
);
```

## Notes

- Replace `<OWNER_UID_HERE>` with the actual Supabase user ID of the owner (found in auth.users table)
- All timestamps use TIMESTAMP with timezone
- Prices are stored as DECIMAL(10,2) for accurate financial calculations
- JSON/JSONB fields store flexible menu items and add-on selections
