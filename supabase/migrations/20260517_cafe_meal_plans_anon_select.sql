-- ══════════════════════════════════════════════════════════════════════════════
-- Cafe meal-plan RLS — unblock anon SELECT on cafe_meal_plans
--
-- Problem: 20260422_cafe_meal_plans_anon_rls.sql added anon INSERT/UPDATE/DELETE
-- on cafe_meal_plans and anon SELECT/INSERT/UPDATE/DELETE on
-- cafe_meal_plan_items, BUT did not add an anon SELECT on cafe_meal_plans
-- itself (the migration's preamble assumed one already existed from the
-- Studio-era table creation — it didn't). With RLS enabled and no matching
-- SELECT policy, anon queries silently return `[]`.
--
-- This broke the customer-facing cafezomad pages (apps/website), which read
-- cafe_meal_plans.notes through the anon key to surface today's Breakfast /
-- Lunch / Dinner description.
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_select_meal_plans" ON cafe_meal_plans;
CREATE POLICY "anon_select_meal_plans" ON cafe_meal_plans
  FOR SELECT TO anon USING (true);
