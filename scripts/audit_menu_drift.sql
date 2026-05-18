-- 2026-05-18: Read-only audit of menu drift across BLR/WTF.
--
-- This is NOT a migration — run it manually in the Supabase SQL editor
-- (or via psql) when you want a fresh report on which items are out of
-- sync between properties.
--
-- Why no auto-heal: prices/descriptions/images can legitimately differ
-- if the operator wants premium pricing at one house, or if a property
-- has its own photo. There's no `updated_at` on cafe_menu_items to pick
-- a most-recent canonical side automatically, so heal-by-default is
-- unsafe. The fix path is:
--   1. Read this report, decide which side is canonical per disputed item.
--   2. Open /pm/cafe/menu, find the item, edit it to the canonical value.
--   3. The fan-out (useCafeMenu.updateItem after 2026-05-18) propagates
--      the edit to every sibling automatically.
--
-- Sibling = same item name (case-insensitive) + same category name
-- (case-insensitive). This excludes FUDR-archived legacy items kept for
-- order-history sanity.

WITH item_with_cat AS (
  SELECT mi.id, mi.name, mi.property_id, mi.price, mi.image_url,
         mi.description, mi.diet, mi.daily_limit, mi.is_available,
         mi.calories, mi.protein, mi.carbs, mi.fats, mi.fibre, mi.sugar,
         lower(trim(mi.name)) AS lname,
         lower(trim(mc.name)) AS lcat
  FROM cafe_menu_items mi
  JOIN cafe_menu_categories mc ON mc.id = mi.category_id
)
, groups AS (
  SELECT lname, lcat, COUNT(*) AS n_rows,
         COUNT(DISTINCT price) AS distinct_prices,
         COUNT(DISTINCT image_url) AS distinct_images,
         COUNT(DISTINCT description) AS distinct_descs,
         COUNT(DISTINCT diet) AS distinct_diets,
         COUNT(DISTINCT is_available) AS distinct_avail,
         COUNT(DISTINCT calories) AS distinct_cal,
         COUNT(DISTINCT protein) AS distinct_protein,
         COUNT(DISTINCT carbs) AS distinct_carbs,
         COUNT(DISTINCT fats) AS distinct_fats,
         COUNT(DISTINCT fibre) AS distinct_fibre,
         COUNT(DISTINCT sugar) AS distinct_sugar,
         MAX(price) - MIN(price) AS price_delta_paise,
         BOOL_OR(is_available) AS any_live
  FROM item_with_cat
  GROUP BY lname, lcat
  HAVING COUNT(*) > 1
)
SELECT
  lname AS item_name,
  lcat AS category,
  any_live AS at_least_one_live,
  n_rows,
  CASE WHEN distinct_prices > 1 THEN '🔴 price: ₹' || (price_delta_paise/100)::text || ' delta' ELSE '' END AS price_drift,
  -- availability is per-outlet by design (each kitchen runs its own inventory
  -- and may hide an item locally), so divergence here is NOT drift.
  CASE WHEN distinct_avail > 1 THEN 'ℹ︎ per-outlet (expected)' ELSE '' END AS availability_by_outlet,
  CASE WHEN distinct_diets > 1 THEN '🔴 diet (allergen!)' ELSE '' END AS diet_drift,
  CASE WHEN distinct_cal > 1 OR distinct_protein > 1 OR distinct_carbs > 1
         OR distinct_fats > 1 OR distinct_fibre > 1 OR distinct_sugar > 1
       THEN '🟡 macros' ELSE '' END AS macros_drift,
  CASE WHEN distinct_images > 1 THEN '🟡 image' ELSE '' END AS image_drift,
  CASE WHEN distinct_descs > 1 THEN '🟢 description' ELSE '' END AS desc_drift
FROM groups
WHERE distinct_prices > 1
   OR distinct_diets > 1
   OR distinct_cal > 1 OR distinct_protein > 1 OR distinct_carbs > 1
   OR distinct_fats > 1 OR distinct_fibre > 1 OR distinct_sugar > 1
   OR distinct_images > 1
   OR distinct_descs > 1
ORDER BY any_live DESC, price_delta_paise DESC NULLS LAST, lname;
