/*
# Add optional product size variants

1. Modified Tables
- `products`
- Adds `variants` as a JSONB array for optional named price variants.
- Each variant stores a custom `name` and numeric `price`, for example Small and Large.
- Existing `price` remains the fallback price when the variants array is empty.

2. Data Integrity
- New and existing products default to an empty variants array.
- The application validates variant names and prices before saving them.
- No existing product prices or menu data are changed.

3. Security
- No new tables or policies are introduced.
- Existing product RLS policies continue to control public menu reads and admin menu writes in this single-tenant, no-sign-in app.

4. Important Notes
- This is an additive, non-destructive migration.
- Existing orders keep their stored item prices and are not rewritten.
- The column is safe to add repeatedly because it uses an idempotent conditional alteration.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb;
