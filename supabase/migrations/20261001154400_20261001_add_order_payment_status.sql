/*
# Add persisted order payment status

1. Modified Tables
- `orders`
- Adds `payment_status` as a required text field with the safe default `unpaid`.
- Existing orders remain available and are treated as unpaid until an admin marks them paid.

2. Data Integrity
- Restricts `payment_status` to the two supported values: `paid` and `unpaid`.
- The default prevents newly-created orders from having an unknown payment state.

3. Security
- No new tables or policies are introduced.
- The existing orders RLS policies continue to govern reads and updates for this single-tenant, no-sign-in cafe app.

4. Important Notes
- This migration is additive and does not delete or rename any existing data.
- It is safe to apply more than once.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('paid', 'unpaid'));
  END IF;
END $$;
