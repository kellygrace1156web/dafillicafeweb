/*
# Da Filli Cafe - Database Schema

1. New Tables
- `categories`: Menu categories (Hot Coffee, Cold Beverages, Fast Food, Desserts, Deals)
  - id (uuid PK), name (text), slug (text unique), sort_order (int), created_at
- `products`: Menu items belonging to a category
  - id (uuid PK), category_id (FK -> categories), name, description, price (numeric), image_url, is_veg (bool), is_in_stock (bool), sort_order (int), created_at
- `orders`: Customer orders
  - id (uuid PK), customer_name, phone, order_type (dine-in/takeaway/delivery), table_number, address, items (jsonb), subtotal, tax, total, status (pending/preparing/completed), created_at

2. Security
- This is a no-auth public ordering app. All tables use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the data is intentionally public/shared.
- RLS enabled on all three tables.
- 4 policies per table (select/insert/update/delete).

3. Seed Data
- 5 categories with sort ordering.
- ~20 products across categories with real image URLs, veg/non-veg flags, and prices.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  is_veg boolean NOT NULL DEFAULT true,
  is_in_stock boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  order_type text NOT NULL DEFAULT 'dine-in',
  table_number text DEFAULT '',
  address text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE TO anon, authenticated USING (true);

-- Products policies
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

-- Orders policies
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);

-- Seed categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Hot Coffee', 'hot-coffee', 1),
  ('Cold Beverages', 'cold-beverages', 2),
  ('Fast Food', 'fast-food', 3),
  ('Desserts', 'desserts', 4),
  ('Deals', 'deals', 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed products
INSERT INTO products (category_id, name, description, price, image_url, is_veg, is_in_stock, sort_order)
SELECT c.id, v.name, v.description, v.price, v.image_url, v.is_veg, v.is_in_stock, v.sort_order
FROM (VALUES
  -- Hot Coffee
  ('hot-coffee', 'Cappuccino', 'Rich espresso topped with steamed milk foam and a dusting of cocoa', 180, 'https://images.pexels.com/photos/19252265/pexels-photo-19252265.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 1),
  ('hot-coffee', 'Caffè Latte', 'Smooth espresso blended with silky steamed milk and light foam', 190, 'https://images.pexels.com/photos/2226091/pexels-photo-2226091.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 2),
  ('hot-coffee', 'Mocha Latte', 'Espresso with chocolate syrup, steamed milk, and whipped cream', 210, 'https://images.pexels.com/photos/2112749/pexels-photo-2112749.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 3),
  ('hot-coffee', 'Americano', 'Double shot of espresso diluted with hot water for a clean, bold flavour', 150, 'https://images.pexels.com/photos/302893/pexels-photo-302893.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 4),
  ('hot-coffee', 'Flat White', 'Double ristretto with velvety micro-foam steamed milk', 200, 'https://images.pexels.com/photos/22608957/pexels-photo-22608957.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 5),
  ('hot-coffee', 'Espresso', 'A concentrated single shot of our finest dark roast', 120, 'https://images.pexels.com/photos/12975714/pexels-photo-12975714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 6),
  ('hot-coffee', 'Filter Coffee', 'Traditional slow-drip brewed coffee, full-bodied and aromatic', 130, 'https://images.pexels.com/photos/13384965/pexels-photo-13384965.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 7),
  ('hot-coffee', 'Hazelnut Latte', 'Creamy latte infused with roasted hazelnut syrup', 220, 'https://images.pexels.com/photos/25482738/pexels-photo-25482738.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, false, 8),
  -- Cold Beverages
  ('cold-beverages', 'Iced Americano', 'Chilled espresso over ice with cold water — crisp and refreshing', 170, 'https://images.pexels.com/photos/4869290/pexels-photo-4869290.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 1),
  ('cold-beverages', 'Iced Latte', 'Espresso and cold milk poured over ice with a smooth finish', 190, 'https://images.pexels.com/photos/4312366/pexels-photo-4312366.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 2),
  ('cold-beverages', 'Cold Brew', 'Slow-steeped 18-hour cold brew for a naturally sweet, low-acid taste', 210, 'https://images.pexels.com/photos/33720736/pexels-photo-33720736.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 3),
  ('cold-beverages', 'Iced Milk Tea', 'Refreshing iced tea with milk and a hint of caramel syrup', 160, 'https://images.pexels.com/photos/8980388/pexels-photo-8980388.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 4),
  ('cold-beverages', 'Frappé Mocha', 'Blended ice, coffee, and chocolate topped with whipped cream', 230, 'https://images.pexels.com/photos/38719180/pexels-photo-38719180.png?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 5),
  ('cold-beverages', 'Iced Caramel Macchiato', 'Vanilla, milk, espresso, and caramel drizzle over ice', 240, 'https://images.pexels.com/photos/14121816/pexels-photo-14121816.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 6),
  ('cold-beverages', 'Vietnamese Iced Coffee', 'Bold dark roast with sweetened condensed milk over ice', 200, 'https://images.pexels.com/photos/4869289/pexels-photo-4869289.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 7),
  ('cold-beverages', 'Cold Coffee Float', 'Creamy blended cold coffee with a scoop of vanilla ice cream', 250, 'https://images.pexels.com/photos/33029962/pexels-photo-33029962.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 8),
  -- Fast Food
  ('fast-food', 'Crispy Chicken Burger', 'Juicy fried chicken fillet, lettuce, and mayo in a toasted brioche bun', 320, 'https://images.pexels.com/photos/34407059/pexels-photo-34407059.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', false, true, 1),
  ('fast-food', 'Double Cheeseburger', 'Two beef patties, melted cheddar, pickles, and house sauce', 380, 'https://images.pexels.com/photos/4109233/pexels-photo-4109233.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', false, true, 2),
  ('fast-food', 'Gourmet Beef Burger', 'Premium beef patty with bacon, cheese, and golden fries', 450, 'https://images.pexels.com/photos/10701942/pexels-photo-10701942.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', false, true, 3),
  ('fast-food', 'Classic Cheeseburger', 'Single patty, cheese, onion, and tomato on a sesame bun', 290, 'https://images.pexels.com/photos/24595881/pexels-photo-24595881.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', false, true, 4),
  ('fast-food', 'Loaded Fries', 'Crispy fries topped with cheese sauce, jalapeños, and herbs', 220, 'https://images.pexels.com/photos/38896819/pexels-photo-38896819.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 5),
  ('fast-food', 'Veg Club Sandwich', 'Triple-decker with grilled veggies, cheese, and mint chutney', 250, 'https://images.pexels.com/photos/39303848/pexels-photo-39303848.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 6),
  ('fast-food', 'Chicken Wings Platter', '8-spice fried chicken wings with dip and celery sticks', 350, 'https://images.pexels.com/photos/11519277/pexels-photo-11519277.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', false, true, 7),
  ('fast-food', 'Margherita Pizza', 'Classic pizza with mozzarella, basil, and tomato sauce', 400, 'https://images.pexels.com/photos/9650079/pexels-photo-9650079.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 8),
  -- Desserts
  ('desserts', 'Chocolate Lava Cake', 'Warm molten chocolate cake with a gooey centre and vanilla scoop', 280, 'https://images.pexels.com/photos/39240989/pexels-photo-39240989.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 1),
  ('desserts', 'Berry Cheesecake', 'Creamy New York cheesecake topped with fresh mixed berries', 300, 'https://images.pexels.com/photos/5112529/pexels-photo-5112529.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 2),
  ('desserts', 'Tiramisu', 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone', 290, 'https://images.pexels.com/photos/38794905/pexels-photo-38794905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 3),
  ('desserts', 'Red Velvet Slice', 'Moist red velvet cake with layers of cream cheese frosting', 270, 'https://images.pexels.com/photos/39240986/pexels-photo-39240986.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 4),
  ('desserts', 'Assorted Pastry Box', 'Selection of mini cream pastries and fruit tarts', 320, 'https://images.pexels.com/photos/8250338/pexels-photo-8250338.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 5),
  ('desserts', 'Dessert Platter', 'Trio of cheesecake, chocolate cake, and tiramisu on one plate', 380, 'https://images.pexels.com/photos/32318140/pexels-photo-32318140.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 6),
  -- Deals
  ('deals', 'Coffee Combo', 'Any hot coffee + a slice of cake of your choice', 350, 'https://images.pexels.com/photos/13384965/pexels-photo-13384965.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 1),
  ('deals', 'Burger Meal Deal', 'Cheeseburger + loaded fries + iced latte', 550, 'https://images.pexels.com/photos/39041314/pexels-photo-39041314.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', false, true, 2),
  ('deals', 'Family Feast', '2 burgers + 2 sides + 4 cold coffees — perfect for sharing', 1200, 'https://images.pexels.com/photos/32524109/pexels-photo-32524109.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', false, true, 3),
  ('deals', 'Sweet Tooth Special', 'Dessert platter + 2 cappuccinos', 600, 'https://images.pexels.com/photos/13926721/pexels-photo-13926721.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true, true, 4)
) AS v(slug, name, description, price, image_url, is_veg, is_in_stock, sort_order)
JOIN categories c ON c.slug = v.slug
ON CONFLICT DO NOTHING;