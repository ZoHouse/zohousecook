-- ══════════════════════════════════════════════════════════════════════════════
-- Drag-to-reorder for the cafe menu manager.
--
-- Cafe menu is standardised across properties: BLR and WTF each have their
-- own per-property row for the same "Breakfast" category or "Masala Dosa"
-- item, and the operator UI deduplicates by name (see useCafeMenu.ts). When
-- the operator drags to reorder, the new sort_order has to fan out to every
-- per-property sibling row sharing that name — otherwise the customer at one
-- outlet would see a different order than the other.
--
-- These RPCs take ordered lists of NAMES (not ids) for two reasons:
--   1. The operator UI's mental model IS names — one logical "Breakfast"
--      row that maps to N per-property rows underneath.
--   2. The frontend would otherwise have to round-trip every per-property
--      id, which is just bookkeeping noise.
--
-- Each RPC is one transaction — partial reorders can't leak through.
-- Renumber strategy: sequential 0..N-1. Sparse spacing (10, 20, 30…) would
-- buy us "insert between without rewriting" but we always know the full
-- order from the UI on every drop, so there's nothing to gain.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Categories ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reorder_cafe_menu_categories(p_name_order text[])
RETURNS void AS $$
DECLARE
  v_name text;
  v_index int := 0;
BEGIN
  IF p_name_order IS NULL THEN
    RAISE EXCEPTION 'name_order is required';
  END IF;

  FOREACH v_name IN ARRAY p_name_order LOOP
    -- Match every per-property row whose name equals this name
    -- (case-insensitive + trimmed, same comparison the FE dedup uses).
    UPDATE cafe_menu_categories
      SET sort_order = v_index
      WHERE lower(trim(name)) = lower(trim(v_name));
    v_index := v_index + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reorder_cafe_menu_categories(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_cafe_menu_categories(text[]) TO service_role;

-- ─── Items within a category ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reorder_cafe_menu_items(
  p_category_name text,
  p_item_name_order text[]
)
RETURNS void AS $$
DECLARE
  v_name text;
  v_index int := 0;
  v_cat_ids uuid[];
BEGIN
  IF p_category_name IS NULL OR p_item_name_order IS NULL THEN
    RAISE EXCEPTION 'category_name and item_name_order are required';
  END IF;

  -- Collect every per-property category id sharing this canonical name.
  -- Items live under one of these; we'll renumber within the union.
  SELECT array_agg(id) INTO v_cat_ids
    FROM cafe_menu_categories
    WHERE lower(trim(name)) = lower(trim(p_category_name));

  IF v_cat_ids IS NULL THEN
    -- Nothing matched — silently no-op rather than raise; an operator who
    -- reordered a category that was just renamed should see their reorder
    -- ignored, not blow up the page with a 500.
    RETURN;
  END IF;

  FOREACH v_name IN ARRAY p_item_name_order LOOP
    UPDATE cafe_menu_items
      SET sort_order = v_index
      WHERE category_id = ANY(v_cat_ids)
        AND lower(trim(name)) = lower(trim(v_name))
        AND deleted_at IS NULL;
    v_index := v_index + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reorder_cafe_menu_items(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_cafe_menu_items(text, text[]) TO service_role;
