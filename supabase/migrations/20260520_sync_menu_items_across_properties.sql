-- 2026-05-20: One-time backfill — ensure every cafe menu item exists in BOTH
-- Zo House kitchens (BLRxZo + WTFxZo) so the menu structure is standardised.
-- Per-kitchen availability stays independent (is_available is property-local).
--
-- Design: docs/superpowers/specs/2026-05-20-cafe-menu-sync-design.md
--
-- Before this migration ~140 items lived in only one kitchen (102 BLR-only,
-- 38 WTF-only) — created before createItem's cross-property fan-out existed.
--
-- This migration is PURELY ADDITIVE: only INSERTs, never UPDATE/DELETE. It is
-- safe to re-run — the NOT EXISTS guard means a second run inserts nothing.
-- Synced rows start is_available = false; each kitchen switches on what it
-- actually serves. Duplicate-name cleanup is handled separately (soft-delete).

-- Properties
--   BLRxZo : f8113423-fb4b-4c43-91d7-e281bdd2f81a
--   WTFxZo : 19736bbd-e9d8-4de5-881c-ecd2adc1e9f9

-- Reusable: copy every non-deleted item from p_source into p_target where the
-- target kitchen has no non-deleted row with the same (case-insensitive,
-- trimmed) name. Source is de-duplicated by normalised name first, so an item
-- that appears twice in the source kitchen is synced only once.
CREATE OR REPLACE FUNCTION pg_temp.sync_menu_items(p_source uuid, p_target uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted integer;
BEGIN
  WITH source_items AS (
    SELECT DISTINCT ON (lower(btrim(src.name)))
      src.name, src.description, src.price, src.image_url, src.diet,
      src.daily_limit, src.customizations, src.sort_order,
      src.calories, src.protein, src.carbs, src.fats, src.fibre, src.sugar,
      src.recipe, src.ingredients,
      src.category_id
    FROM cafe_menu_items src
    WHERE src.property_id = p_source
      AND src.deleted_at IS NULL
    ORDER BY lower(btrim(src.name)), src.created_at
  ),
  ins AS (
    INSERT INTO cafe_menu_items (
      property_id, category_id, name, description, price, image_url, diet,
      is_available, daily_limit, customizations, sort_order,
      calories, protein, carbs, fats, fibre, sugar, recipe, ingredients
    )
    SELECT
      p_target,
      tgt_cat.id,
      s.name, s.description, s.price, s.image_url, s.diet,
      false,  -- synced rows start OFF — the target kitchen turns on what it serves
      s.daily_limit, s.customizations, s.sort_order,
      s.calories, s.protein, s.carbs, s.fats, s.fibre, s.sugar,
      s.recipe, s.ingredients
    FROM source_items s
    JOIN cafe_menu_categories src_cat ON src_cat.id = s.category_id
    JOIN cafe_menu_categories tgt_cat
      ON tgt_cat.property_id = p_target
     AND lower(btrim(tgt_cat.name)) = lower(btrim(src_cat.name))
    WHERE NOT EXISTS (
      SELECT 1 FROM cafe_menu_items existing
      WHERE existing.property_id = p_target
        AND existing.deleted_at IS NULL
        AND lower(btrim(existing.name)) = lower(btrim(s.name))
    )
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  RAISE NOTICE 'sync_menu_items: % rows inserted into %', v_inserted, p_target;
  RETURN v_inserted;
END;
$$;

-- BLR-only items → create their WTF rows
SELECT pg_temp.sync_menu_items(
  'f8113423-fb4b-4c43-91d7-e281bdd2f81a',  -- source: BLR
  '19736bbd-e9d8-4de5-881c-ecd2adc1e9f9'   -- target: WTF
);

-- WTF-only items → create their BLR rows
SELECT pg_temp.sync_menu_items(
  '19736bbd-e9d8-4de5-881c-ecd2adc1e9f9',  -- source: WTF
  'f8113423-fb4b-4c43-91d7-e281bdd2f81a'   -- target: BLR
);

-- Verification — must return 0 rows: every non-deleted item name now exists
-- in both kitchens.
DO $$
DECLARE
  v_unmatched integer;
BEGIN
  SELECT count(*) INTO v_unmatched FROM (
    SELECT lower(btrim(name)) AS n
    FROM cafe_menu_items
    WHERE deleted_at IS NULL
      AND property_id IN ('f8113423-fb4b-4c43-91d7-e281bdd2f81a',
                          '19736bbd-e9d8-4de5-881c-ecd2adc1e9f9')
    GROUP BY lower(btrim(name))
    HAVING count(DISTINCT property_id) <> 2
  ) unmatched;

  IF v_unmatched <> 0 THEN
    RAISE EXCEPTION 'menu sync incomplete: % item name(s) still not in both kitchens', v_unmatched;
  END IF;
  RAISE NOTICE 'menu sync verified: every item name exists in both BLR and WTF';
END;
$$;
