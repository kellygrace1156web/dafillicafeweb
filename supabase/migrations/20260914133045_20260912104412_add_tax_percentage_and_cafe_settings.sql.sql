/*
# Add product tax percentage and cafe location/social settings

1. Modified Tables
- `products`
  - `tax_percentage` (numeric, default 0): per-product tax rate as a percentage (0–100).

2. New Settings (site_settings rows)
- `cafe_address`, `instagram_url`, `tiktok_url`, `facebook_url`

3. Security
- No new tables. Existing `site_settings` RLS policies already allow anon/authenticated CRUD.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tax_percentage numeric(5,2) NOT NULL DEFAULT 0;

INSERT INTO site_settings (key, value)
VALUES
  ('cafe_address', 'I-8 Markaz, Islamabad'),
  ('instagram_url', ''),
  ('tiktok_url', ''),
  ('facebook_url', '')
ON CONFLICT (key) DO NOTHING;