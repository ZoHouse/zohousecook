-- ══════════════════════════════════════════════════════════════════════════════
-- Cafe meal-plan RLS — unblock anon INSERT/UPDATE/DELETE
--
-- Problem: cafe_meal_plans and cafe_meal_plan_items were created via Supabase
-- Studio (not git migrations) with RLS enabled and only SELECT policies for
-- anon. The admin Meal Plan page in PMS uses the anon key, so every createPlan
-- / updatePlan / addItem / removeItem call was failing with
-- `42501 new row violates row-level security policy`. The hook's silentRefetch
-- then saw no new row, and the UI showed nothing — easy to mistake for a
-- "meal didn't save" bug.
--
-- Fix: mirror the permissive anon-write pattern used by 20260326 for
-- cafe_orders (before 20260404 tightened it). Meal plans are menu-scheduling
-- metadata — same trust level as categories/items, which anon can already
-- read broadly.
--
-- Scope: narrow unblock for meal plan CRUD. Broader PMS admin RLS audit
-- (menu, ingredients, tables, food credits) is a separate decision.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cafe_meal_plans ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_insert_meal_plans" ON cafe_meal_plans;
CREATE POLICY "anon_insert_meal_plans" ON cafe_meal_plans
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meal_plans" ON cafe_meal_plans;
CREATE POLICY "anon_update_meal_plans" ON cafe_meal_plans
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meal_plans" ON cafe_meal_plans;
CREATE POLICY "anon_delete_meal_plans" ON cafe_meal_plans
  FOR DELETE TO anon USING (true);

-- ── cafe_meal_plan_items ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_select_meal_plan_items" ON cafe_meal_plan_items;
CREATE POLICY "anon_select_meal_plan_items" ON cafe_meal_plan_items
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_meal_plan_items" ON cafe_meal_plan_items;
CREATE POLICY "anon_insert_meal_plan_items" ON cafe_meal_plan_items
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meal_plan_items" ON cafe_meal_plan_items;
CREATE POLICY "anon_update_meal_plan_items" ON cafe_meal_plan_items
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meal_plan_items" ON cafe_meal_plan_items;
CREATE POLICY "anon_delete_meal_plan_items" ON cafe_meal_plan_items
  FOR DELETE TO anon USING (true);
