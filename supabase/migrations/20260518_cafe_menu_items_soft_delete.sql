-- 2026-05-18: Soft-delete support for cafe_menu_items.
-- Adds a nullable deleted_at timestamp. The application filters out rows
-- where deleted_at IS NOT NULL from menu/listing queries, but preserves
-- the row so that historical order items (cafe_order_items.menu_item_id)
-- continue to resolve correctly and order history doesn't break.
-- Deletion of a menu item happens by setting deleted_at to NOW().

ALTER TABLE cafe_menu_items
ADD COLUMN deleted_at timestamptz NULL;

COMMENT ON COLUMN cafe_menu_items.deleted_at IS
  'When set, the item is hidden from the live menu but preserved for order history. NULL means active.';
