-- 2026-05-18: Reconcile recipe drift across BLR/WTF.
--
-- Bug: each menu item exists once per property (cafe_menu_items has a
-- per-property row for "Coffee" at BLR + another for "Coffee" at WTF). The
-- staff MenuItemForm.saveRecipeRows always wrote recipes against ONE row's
-- id (whichever the deduped staff UI happened to render). The other
-- property's row got zero recipe entries. inventory-deduct.ts looks up
-- recipes by exact menu_item_id, so orders at the "empty" side were
-- skipped with reason='no recipe' and silently deducted zero inventory.
--
-- May 2026 audit (live data) found 25 items in this state, including:
--   tea, scrambled eggs, french toast, cold coffee, hot chocolate,
--   maggie, banana shake, rajma chawal, english breakfast (non-veg),
--   chicken burrito bowl, garlic noodles, pasta variants, mango lassi,
--   etc.
--
-- The code fix (MenuItemForm.saveRecipeRows fan-out via
-- findSiblingMenuItemIds) stops new drift. This script heals the
-- historical drift.
--
-- Strategy: for each (item name, category name) group with more than one
-- row, pick the canonical source = the row with the most recipe entries.
-- Replace every other sibling's recipes with the canonical set.
-- "Replace" = DELETE then INSERT so siblings converge exactly to source.
--
-- Scoping by category-name AS WELL AS item-name is important: legacy
-- FUDR-imported items in archived categories ("Beverages", "Breakfast",
-- etc.) share names with standardised-menu items ("Vegetarian",
-- "Non-Vegetarian", etc.) for a few overlap cases (plain paratha, roti,
-- rice, upma, poha, paneer bhurji, lunch). We must NOT propagate recipes
-- across category eras — those legacy rows are kept for order-history
-- sanity and should not have their recipes mutated.
--
-- Idempotent: re-running on already-converged data is a no-op because
-- every sibling's recipes are deleted-and-replaced with the source's
-- exact set, so subsequent runs see no asymmetry to fix.

DO $$
DECLARE
  grp RECORD;
  src_id uuid;
  src_recipe_count int;
BEGIN
  FOR grp IN
    SELECT lower(mi.name) AS lname, lower(mc.name) AS lcat
    FROM cafe_menu_items mi
    JOIN cafe_menu_categories mc ON mc.id = mi.category_id
    GROUP BY lower(mi.name), lower(mc.name)
    HAVING COUNT(*) > 1
  LOOP
    -- Canonical source = sibling with the most recipe rows. Ties broken
    -- by mi.id for determinism.
    SELECT mi.id INTO src_id
    FROM cafe_menu_items mi
    JOIN cafe_menu_categories mc ON mc.id = mi.category_id
    LEFT JOIN cafe_recipe_items ri ON ri.menu_item_id = mi.id
    WHERE lower(mi.name) = grp.lname
      AND lower(mc.name) = grp.lcat
    GROUP BY mi.id
    ORDER BY COUNT(ri.id) DESC, mi.id
    LIMIT 1;

    SELECT COUNT(*) INTO src_recipe_count
    FROM cafe_recipe_items WHERE menu_item_id = src_id;

    -- Skip groups where the canonical source has zero recipes — no source
    -- of truth to propagate. (Leaves them in a recognisable state for
    -- staff to seed recipes manually.)
    IF src_recipe_count = 0 THEN
      CONTINUE;
    END IF;

    -- Wipe siblings' recipes
    DELETE FROM cafe_recipe_items
    WHERE menu_item_id IN (
      SELECT sib.id
      FROM cafe_menu_items sib
      JOIN cafe_menu_categories sc ON sc.id = sib.category_id
      WHERE lower(sib.name) = grp.lname
        AND lower(sc.name) = grp.lcat
        AND sib.id <> src_id
    );

    -- Copy source's recipes to siblings
    INSERT INTO cafe_recipe_items (menu_item_id, ingredient_id, quantity, unit)
    SELECT sib.id, ri.ingredient_id, ri.quantity, ri.unit
    FROM cafe_menu_items sib
    JOIN cafe_menu_categories sc ON sc.id = sib.category_id
    CROSS JOIN cafe_recipe_items ri
    WHERE lower(sib.name) = grp.lname
      AND lower(sc.name) = grp.lcat
      AND sib.id <> src_id
      AND ri.menu_item_id = src_id;
  END LOOP;
END $$;
