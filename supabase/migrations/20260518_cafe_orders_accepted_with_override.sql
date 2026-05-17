-- 2026-05-18: Track orders accepted via the chef's Override & Accept path.
-- Set to true when the kitchen lacks sufficient stock for at least one
-- ingredient at accept time but the chef chooses to accept anyway.
-- Used for ops reporting (chronic understock detection).

ALTER TABLE cafe_orders
ADD COLUMN accepted_with_override boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN cafe_orders.accepted_with_override IS
  'true when the chef accepted this order via Override & Accept (insufficient stock at accept time). Defaults to false. Used for ops reporting only.';
