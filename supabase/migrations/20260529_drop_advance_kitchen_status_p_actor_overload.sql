-- Cafe — remove the duplicate advance_kitchen_status overload
--
-- ROOT CAUSE of "kitchen Accept snaps back to New":
-- The live DB ended up with TWO advance_kitchen_status functions:
--   1. advance_kitchen_status(uuid, text, text)        -- 20260518 migration
--   2. advance_kitchen_status(uuid, text, text, text)  -- p_actor, added
--      directly to the DB, never tracked in a migration
--
-- The kitchen board calls supabase.rpc('advance_kitchen_status', {
--   p_order_id, p_expected_status, p_next_status }) with exactly 3 named
-- params. Because the 4-arg overload's p_actor has a DEFAULT, BOTH functions
-- satisfy a 3-arg call. PostgREST cannot disambiguate and returns
-- HTTP 300 Multiple Choices, so every Accept / Start Preparing / Mark Ready
-- RPC errors out — and useCafeRealtimeOrders.advanceStatus then reverts its
-- optimistic update, making the card flip back to "Accept".
--
-- Resolution (per team decision 2026-05-29): the migration-defined 3-arg
-- version is canonical. Nothing in the codebase references p_actor, so the
-- untracked 4-arg overload is dropped. After this runs, the 3-arg call
-- resolves to a single function and the board advances normally.
--
-- Idempotent: IF EXISTS guards a re-run / a DB that never had the overload.

DROP FUNCTION IF EXISTS advance_kitchen_status(uuid, text, text, text);

-- Sanity: the canonical 3-arg function must still exist after this. If the
-- 20260518 migration was applied, this is a no-op confirmation. (Left as a
-- comment — re-run 20260518_advance_kitchen_status_rpc.sql if it is missing.)
