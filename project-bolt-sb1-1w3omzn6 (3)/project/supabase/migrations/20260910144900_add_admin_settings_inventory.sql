/*
# Add cafe settings and inventory quantities

1. New Tables
- `site_settings`
- `key` (text primary key): setting identifier.
- `value` (text): setting value, including the cafe WhatsApp number.
- `updated_at` (timestamp): last update time.

2. Modified Tables
- `products`
- `stock_quantity` (integer): current quantity used for inventory reporting and low-stock warnings.

3. Security
- Enable RLS on `site_settings`.
- Allow anonymous and authenticated clients to read and update the single-tenant cafe settings because this app has no sign-in flow.
- Keep the existing public/shared product access model.

4. Important Notes
- Existing products receive a stock quantity of 20 when no quantity has been recorded.
- The WhatsApp number is stored under the `whatsapp_number` key and may remain empty until the owner configures it.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 20;

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_site_settings" ON site_settings;
CREATE POLICY "anon_select_site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_site_settings" ON site_settings;
CREATE POLICY "anon_insert_site_settings" ON site_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_site_settings" ON site_settings;
CREATE POLICY "anon_update_site_settings" ON site_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_site_settings" ON site_settings;
CREATE POLICY "anon_delete_site_settings" ON site_settings FOR DELETE TO anon, authenticated USING (true);

INSERT INTO site_settings (key, value)
VALUES ('whatsapp_number', '')
ON CONFLICT (key) DO NOTHING;
