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

-- Phase 30 - Customers. `lib/api/auth.ts`'s `apiGetCustomers()` existed as
-- plumbing since Phase 25 but had no admin-read path under RLS until now -
-- the policy above only ever let a user see their own row. This is a
-- self-referencing policy (a `profiles` policy whose check itself queries
-- `profiles`), which is safe here: the subquery only ever needs to see the
-- *caller's own* row to confirm `role = 'admin'`, and that row is already
-- visible to them via the owner policy above (permissive policies on the
-- same table are combined with OR, not evaluated in isolation).
create policy "Admins can read every profile"
  on profiles for select
  using (exists (select 1 from profiles admin_check where admin_check.id = auth.uid() and admin_check.role = 'admin'));

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

-- Phase 30 - Customers. The admin Customer Detail view calls the exact
-- same `apiGetOrdersForUser(email)` a customer's own `/account` page
-- does, just with someone else's email - without this policy that call
-- would silently return an empty list for any admin viewing a customer
-- who isn't themselves, since the owner-only policy above wouldn't match.
create policy "Admins can read every order"
  on orders for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

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

-- ---------------------------------------------------------------------
-- Media (Backend-Integrated). A public Storage bucket for admin-uploaded
-- images (logo, favicon, product photos), replacing Phase 24's
-- localStorage/base64 store - and the artificial ~4.5MB total / 1MB-per-
-- file caps that store enforced only because localStorage itself is
-- tiny. Real object storage has no equivalent app-level budget; only a
-- generous per-file guard remains client-side (see
-- `src/lib/api/media.ts`'s `MAX_ASSET_SOURCE_BYTES`), to catch obvious
-- mistakes rather than enforce a hard architecture limit. Supabase's own
-- project-level upload limit (50MB by default, raisable in Dashboard >
-- Storage > Settings) is the real ceiling above that.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Media images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Only admins can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Only admins can delete media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- ---------------------------------------------------------------------
-- Phase 33 - Notifications. In-app notification center: one row per
-- notification for a signed-in shopper (order confirmation at minimum,
-- per this phase's scope - `type` is left as free text rather than a
-- constrained enum so a later phase can add another event without a
-- migration). Keyed by `user_email` rather than a `profiles.id` foreign
-- key - same convention `orders` already uses (see its own comment
-- above) - so the owner-only RLS check below matches the exact pattern
-- every other owner-scoped table in this file already uses
-- (`auth.jwt() ->> 'email' = user_email`). Guest checkouts never write
-- here (there's no signed-in owner to write it for) - only the
-- transactional email (sent from `api/resend/`, no database write at
-- all) reaches a guest.
-- ---------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  type text not null,
  title text not null,
  body text not null,
  order_number text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "A signed-in user can read their own notifications"
  on notifications for select
  using (auth.jwt() ->> 'email' = user_email);

create policy "A signed-in user can insert their own notifications"
  on notifications for insert
  with check (auth.jwt() ->> 'email' = user_email);

create policy "A signed-in user can update their own notifications"
  on notifications for update
  using (auth.jwt() ->> 'email' = user_email);

-- ---------------------------------------------------------------------
-- Phase 29 - Inventory. Stock is decremented atomically inside the same
-- transaction as the order insert (a trigger, not a second client-side
-- update) for two reasons:
--
--   1. `orders` is insert-only from the client (see `lib/api/orders.ts`)
--      and the write-gated `products` table only grants UPDATE to
--      admins (the policy above) - a shopper placing an order is never
--      an admin, so a client-side stock update would need its own RLS
--      carve-out just for this one column. A `security definer` trigger
--      sidesteps that entirely.
--   2. Running inside the insert's own transaction is what actually
--      prevents overselling under concurrent checkouts - two shoppers
--      racing for the last unit serialize on this trigger's row lock
--      (`for update`), and the second one gets the "not enough stock"
--      exception below (which rolls back their whole order) instead of
--      both succeeding. The client-side pre-check in `Checkout.tsx`
--      (`checkStockForLines()`) is only a friendly warning shown before
--      attempting the write - this trigger is the real guarantee.
--
-- Only stock-tracked products are touched (`stock is not null` -
-- untracked/unlimited products are skipped, same convention
-- `src/lib/inventory.ts` uses everywhere else).
-- ---------------------------------------------------------------------
create or replace function public.decrement_stock_for_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  line_product_id text;
  line_quantity integer;
  current_stock integer;
begin
  for line in select * from jsonb_array_elements(new.lines)
  loop
    line_product_id := line ->> 'productId';
    line_quantity := (line ->> 'quantity')::integer;

    select stock into current_stock from products where id = line_product_id for update;

    if current_stock is not null then
      if current_stock < line_quantity then
        raise exception 'Not enough stock for product %: % available, % requested',
          line_product_id, current_stock, line_quantity;
      end if;
      update products set stock = current_stock - line_quantity where id = line_product_id;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists orders_decrement_stock on orders;

create trigger orders_decrement_stock
  after insert on orders
  for each row
  execute function public.decrement_stock_for_order();
