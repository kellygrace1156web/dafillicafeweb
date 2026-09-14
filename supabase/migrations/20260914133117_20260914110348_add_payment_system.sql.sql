/*
# Add Payment System to Orders and Settings

1. Modified Tables
- `orders` table: add `payment_method` (text, default 'cash'), `transaction_id` (text, nullable), `payment_screenshot_url` (text, nullable) columns.
  - `payment_method` stores 'cash' or 'online'.
  - `transaction_id` stores the customer-provided TID for online payments.
  - `payment_screenshot_url` stores a URL to the uploaded receipt screenshot (for future Supabase Storage integration).
2. New Settings
- `site_settings` rows inserted for `payment_config` — a JSON blob containing:
  - cash_enabled (boolean), online_enabled (boolean)
  - easypaisa_name, easypaisa_number
  - jazzcash_name, jazzcash_number
  - bank_name, bank_title, bank_iban
3. Security
- No new tables; existing RLS policies on `orders` (anon CRUD) cover the new columns.
- `site_settings` existing policies cover the new key.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS payment_screenshot_url text;

INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'payment_config',
  '{"cash_enabled":true,"online_enabled":true,"easypaisa_name":"Admin","easypaisa_number":"0300-1234567","jazzcash_name":"Admin","jazzcash_number":"0300-1234567","bank_name":"HBL","bank_title":"Da Filli Cafe","bank_iban":"PK00 HABB 0000 0000 0000 0000"}',
  now()
)
ON CONFLICT (key) DO NOTHING;