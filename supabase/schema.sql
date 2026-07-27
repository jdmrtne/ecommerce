-- Phase 25 - Backend Integration.
--
-- Run this once against your Supabase project (SQL Editor > New query,
-- paste, Run - or `supabase db reset` / a migration if you're using the
-- Supabase CLI for local dev). It creates every table `lib/api/*`
-- expects, matching the row shapes in `src/lib/api/types.ts` exactly
-- (snake_case columns, mapped to/from this app's camelCase types at the
-- API layer).
--
-- Row Level Security (RLS) is enabled on every table below. Supabase
-- tables are NOT protected by default just because you're using the anon
-- key carefully in your own frontend - anyone with that key (which is
-- public, by design) can query a table directly unless RLS is on. The
-- policies below are deliberately permissive for now (Phase 25 is
-- plumbing only, not wired into any UI yet) but still enforce the
-- baseline that matters: everyone can read the public catalog, but only
-- a signed-in user can touch their own orders/profile.

-- ---------------------------------------------------------------------
-- profiles: one row per Supabase Auth user, holding the app-specific
-- fields (name, role) auth.users doesn't have. id is the same uuid as
-- auth.users.id, so a profile is always 1:1 with an auth account.
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are readable by their own owner"
  on profiles for select
  using (auth.uid() = id);

create policy "A signed-in user can create their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "A signed-in user can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- products: mirrors src/types/product.ts's Product.
-- ---------------------------------------------------------------------
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric not null,
  rating numeric not null default 0,
  tag text check (tag in ('New', 'Limited')),
  created_at timestamptz not null default now(),
  sales_rank integer,
  description text not null default '',
  details jsonb,
  images jsonb,
  variants jsonb,
  stock integer,
  tags jsonb
);

alter table products enable row level security;

create policy "Products are readable by anyone"
  on products for select
  using (true);

-- Phase 27 - Products (Backend-Integrated). Product Manager now writes
-- through the anon key (no service-role key ships to the browser), so
-- write access has to be gated in the database itself rather than left
-- open like the Phase 25 placeholder warned against. Only a signed-in
-- user whose own `profiles.role` is 'admin' may insert/update/delete -
-- everyone else (including signed-out visitors) still gets read-only
-- access via the select policy above.
create policy "Only admins can insert products"
  on products for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Only admins can update products"
  on products for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Only admins can delete products"
  on products for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- ---------------------------------------------------------------------
-- categories: mirrors src/types/product.ts's Category.
-- ---------------------------------------------------------------------
create table if not exists categories (
  id text primary key,
  slug text not null unique,
  label text not null,
  description text not null default '',
  image text,
  icon text not null,
  tone text not null check (tone in ('primary', 'accent')),
  featured boolean,
  item_count integer not null default 0
);

alter table categories enable row level security;

create policy "Categories are readable by anyone"
  on categories for select
  using (true);

-- Same note as products: admin-only write policy belongs to the phase
-- that actually wires Category Manager onto this table.

-- ---------------------------------------------------------------------
-- orders: mirrors src/types/order.ts's Order. lines/shipping are stored
-- as jsonb (a snapshot at the moment the order was placed), matching
-- the existing localStorage-backed Order shape exactly rather than
-- normalizing into separate line-item/address tables - this phase is
-- plumbing, not a data-model redesign.
-- ---------------------------------------------------------------------
create table if not exists orders (
  order_number text primary key,
  user_email text not null,
  placed_at timestamptz not null default now(),
  lines jsonb not null,
  subtotal numeric not null,
  shipping_fee numeric not null,
  total numeric not null,
  shipping jsonb not null
);

alter table orders enable row level security;

create policy "A signed-in user can read their own orders"
  on orders for select
  using (auth.jwt() ->> 'email' = user_email);

create policy "A signed-in user can insert their own orders"
  on orders for insert
  with check (auth.jwt() ->> 'email' = user_email);

-- ---------------------------------------------------------------------
-- site_settings: one row per admin-editable settings group (theme,
-- store, homepage, ...). `value` is a jsonb blob matching that group's
-- own *SettingsOverride shape exactly (see lib/themeSettingsStore.ts,
-- lib/storeSettingsStore.ts, lib/homepageSettingsStore.ts) - a generic
-- key/value settings table, not one table per feature, since every
-- settings editor already shares the same override-over-defaults shape
-- and previously lived in localStorage under a similarly-named key.
--
-- Moving these from localStorage to here is what makes an admin's save
-- visible on *other* devices/browsers, not just the one that saved it -
-- localStorage is inherently per-browser, so a theme/store/homepage
-- change made on the admin's laptop never reached a visitor's phone.
-- ---------------------------------------------------------------------
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

create policy "Settings are readable by anyone"
  on site_settings for select
  using (true);

create policy "Only admins can insert settings"
  on site_settings for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Only admins can update settings"
  on site_settings for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
