-- RLS policies for customer-facing cafezomad pages (anon key access)
-- Run this in the Supabase Dashboard SQL Editor

-- READ access for menu browsing (all public cafe data)
CREATE POLICY "anon_select_properties" ON cafe_properties FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_categories" ON cafe_menu_categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_items" ON cafe_menu_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_tables" ON cafe_tables FOR SELECT TO anon USING (true);

-- READ access for order tracking
CREATE POLICY "anon_select_orders" ON cafe_orders FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_order_items" ON cafe_order_items FOR SELECT TO anon USING (true);

-- WRITE access for placing orders
CREATE POLICY "anon_insert_orders" ON cafe_orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_order_items" ON cafe_order_items FOR INSERT TO anon WITH CHECK (true);
