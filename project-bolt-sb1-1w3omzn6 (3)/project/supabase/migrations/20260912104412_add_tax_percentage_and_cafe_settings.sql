/*
# Add product tax percentage and cafe location/social settings

1. Modified Tables
- `products`
  - `tax_percentage` (numeric, default 0): per-product tax rate as a percentage (0–100).
    When 0, the global default tax rate (10%) is used at checkout. When non-zero,
    that specific rate is applied to that product's line item in the cart and receipt.

2. New Settings (site_settings rows)
- `cafe_address`: physical address of the cafe, displayed on receipts and the website.
- `instagram_url`: full URL to the cafe's Instagram profile.
- `tiktok_url`: full URL to the cafe's TikTok profile.
- `facebook_url`: full URL to the cafe's Facebook page.

3. Security
- No new tables. Existing `site_settings` RLS policies already allow anon/authenticated CRUD.
- No changes to RLS.

4. Important Notes
- Existing products get `tax_percentage = 0`, meaning they use the global 10% default.
- The admin can override per-product tax from the Add/Edit Product modal.
- Cafe address defaults to "I-8 Markaz, Islamabad" if not set.
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