-- Phase 27 - Products (Backend-Integrated).
--
-- Seeds the "products" table (see schema.sql) with the same 24-product
-- placeholder catalog this template previously shipped as static data in
-- src/data/products.ts (ALL_PRODUCTS) - generated directly from that file
-- so the two never drift. Run once against a fresh Supabase project,
-- after schema.sql, to give the storefront/admin something real to read
-- immediately (Supabase SQL Editor > New query, paste, Run - or include
-- as a migration if you use the Supabase CLI).
--
-- Safe to re-run: "on conflict (id) do update" makes this idempotent
-- rather than erroring (or duplicating rows) on a second run.
--
-- Replace this catalog with your own products afterwards via the admin
-- Product Manager (/admin/products) - src/data/products.ts itself is no
-- longer read by the storefront as of this phase (see MASTER_HANDOFF.md).

insert into products
  (id, name, category, price, rating, tag, created_at, sales_rank, description, details, images, variants, stock, tags)
values
  ('p-a1', 'Product 1', 'category-a', 999, 4.8, 'New', '2026-07-10'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-a2', 'Product 2', 'category-a', 1299, 4.9, null, '2026-02-14'::timestamptz, 2, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-a3', 'Product 3', 'category-a', 799, 4.6, null, '2026-03-02'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-a4', 'Product 4', 'category-a', 1499, 4.7, null, '2026-05-18'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-a5', 'Product 5', 'category-a', 649, 4.5, null, '2026-01-20'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-a6', 'Product 6', 'category-a', 899, 4.4, null, '2026-04-11'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-b1', 'Product 7', 'category-b', 550, 4.7, 'New', '2026-07-12'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-b2', 'Product 8', 'category-b', 2200, 5, null, '2026-01-05'::timestamptz, 1, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-b3', 'Product 9', 'category-b', 1900, 4.8, null, '2026-06-01'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-b4', 'Product 10', 'category-b', 3200, 4.9, null, '2026-03-22'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-b5', 'Product 11', 'category-b', 950, 4.6, null, '2026-02-08'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-b6', 'Product 12', 'category-b', 1550, 4.7, null, '2026-05-29'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-c1', 'Product 13', 'category-c', 1750, 4.8, 'New', '2026-07-08'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-c2', 'Product 14', 'category-c', 1050, 4.9, null, '2026-01-15'::timestamptz, 3, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-c3', 'Product 15', 'category-c', 1150, 4.7, null, '2026-04-19'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-c4', 'Product 16', 'category-c', 1100, 4.6, null, '2026-02-27'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-c5', 'Product 17', 'category-c', 850, 4.5, null, '2026-06-14'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-c6', 'Product 18', 'category-c', 990, 4.4, null, '2026-03-09'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-d1', 'Product 19', 'category-d', 450, 4.6, 'New', '2026-07-15'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-d2', 'Product 20', 'category-d', 350, 4.9, null, '2026-01-30'::timestamptz, 4, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-d3', 'Product 21', 'category-d', 380, 4.7, null, '2026-05-05'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-d4', 'Product 22', 'category-d', 600, 4.5, null, '2026-02-18'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-d5', 'Product 23', 'category-d', 440, 4.4, null, '2026-06-22'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null),
  ('p-d6', 'Product 24', 'category-d', 340, 4.8, null, '2026-04-03'::timestamptz, null, 'Product description goes here. Replace with your own product details.', '["Sample detail line 1","Sample detail line 2","Sample detail line 3","Sample detail line 4"]'::jsonb, null, null, null, null)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  rating = excluded.rating,
  tag = excluded.tag,
  created_at = excluded.created_at,
  sales_rank = excluded.sales_rank,
  description = excluded.description,
  details = excluded.details,
  images = excluded.images,
  variants = excluded.variants,
  stock = excluded.stock,
  tags = excluded.tags;
