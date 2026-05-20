# Cafe Menu Sync — Standardise Items Across BLR + WTF

**Created:** 2026-05-20
**Status:** Design approved by cafe ops, ready for implementation plan
**Owner:** Cafe Ops

## Summary

A one-time data backfill so every cafe menu item exists in **both** Zo House kitchens — BLRxZo and WTFxZo. Today 140 items live in only one kitchen. After this sync, the menu *structure* is truly standardised across both properties; per-kitchen *availability* (the on/off switch) stays independent.

## Why

The cafe menu is meant to be standardised — the same item list at every property — with each kitchen independently controlling what's available day-to-day (their inventory and capacity differ). The `createItem` flow already enforces this for new items: adding an item creates a row for every property.

But 140 items predate that behavior and exist in only one kitchen:

| | Count |
|---|---|
| Distinct item names in BLR | 243 |
| Distinct item names in WTF | 179 |
| Shared by both | ~141 |
| **Only in BLR** (missing from WTF) | **102** |
| **Only in WTF** (missing from BLR) | **38** |

This surfaced when the menu admin page became property-scoped (per-kitchen availability fix): a WTF-only item like "Egg fried rice" correctly stopped appearing under BLR — revealing it was never a BLR item. The old all-properties-merged view had hidden the inconsistency.

## Data model context

- `cafe_menu_items` — one row per (item, property). Columns include `name`, `description`, `price`, `image_url`, `diet`, `is_available`, `daily_limit`, `customizations`, `sort_order`, `calories`, `protein`, `carbs`, `fats`, `fibre`, `sugar`, `recipe`, `ingredients`, `category_id`, `property_id`, `deleted_at`.
- `cafe_menu_categories` — one row per (category, property). **All 16 categories already exist in both BLR and WTF with matching names** — verified 2026-05-20. So category resolution during the sync is always clean; no categories need creating.
- Property UUIDs: BLR = `f8113423-fb4b-4c43-91d7-e281bdd2f81a`, WTF = `19736bbd-e9d8-4de5-881c-ecd2adc1e9f9`.
- `cafe_order_items` snapshots `name` and `price` at order time and references `menu_item_id`. Menu deletes are soft (`deleted_at`), so order history is never affected by menu changes.

## What the sync does

A one-time migration that, for every item name present in one kitchen but not the other, inserts the missing row.

**For each of the 102 BLR-only items → insert a WTF row. For each of the 38 WTF-only items → insert a BLR row.** Each inserted row:

| Field | Value |
|---|---|
| `property_id` | the target kitchen |
| `category_id` | the target kitchen's category whose name matches the source row's category (case-insensitive) |
| `is_available` | **`false`** — the target kitchen explicitly switches on what it serves |
| `name`, `description`, `price`, `image_url`, `diet`, `daily_limit`, `customizations`, `sort_order`, `calories`, `protein`, `carbs`, `fats`, `fibre`, `sugar`, `recipe`, `ingredients` | copied verbatim from the source row |
| `deleted_at` | `null` |
| `id`, `created_at` | new (DB-generated) |

### Decisions (confirmed with cafe ops)

- **New synced rows start `is_available = false`.** A kitchen that's missing an item may not actually make it; defaulting to off prevents customers from ordering a dish the kitchen can't fulfil. Each kitchen turns on what it serves.
- **Duplicates handled separately, after the sync.** ~12 near-duplicate item names exist (`omlette`/`omelette`, `veg pakoda`/`veg pakora`, `crisp - puffy…`/`crisp -puffy…`, etc.). Cleaning them needs human judgment (which spelling stays) and is safe to do anytime via the existing soft-delete. The sync does not attempt to dedupe — it treats each distinct name independently. Cleanup is a follow-up: cafe ops picks which of each pair to keep; deleting one soft-deletes it in both kitchens.

### Matching rule

Two items are "the same item" when their `name` matches **case-insensitively, trimmed** (`lower(trim(name))`). This is the same rule `useCafeMenu` and `menu-siblings.ts` already use elsewhere. An item is "missing from kitchen X" when no non-deleted `cafe_menu_items` row exists in property X with that normalized name.

Soft-deleted rows (`deleted_at IS NOT NULL`) are ignored on both sides — they don't count as "present", and they aren't created.

## How it ships

A SQL migration file in `supabase/migrations/` (e.g. `20260520_sync_menu_items_across_properties.sql`). Samurai applies it through the same migration path as every other cafe migration. Cafe ops needs no DB access for this.

The migration is **purely additive** — only `INSERT`s, no `UPDATE` or `DELETE`. Worst case of a bad row is an extra menu item that can be deleted normally. It is also **idempotent-friendly**: it inserts only where a matching row does not already exist, so re-running it is safe (inserts nothing the second time).

## Going forward

No repeat needed. `createItem` in `useCafeMenu.ts` already inserts a row for every property when an item is added. This migration is strictly a one-time fix for the 140 pre-existing items. Once it runs, BLR and WTF have identical item lists, and they stay identical as items are added/edited/deleted (all of which cascade across properties).

## Out of scope

- **Duplicate-name cleanup** — separate follow-up, cafe-ops-driven, via soft-delete.
- **Per-property availability** — already shipped (menu toggle is per-kitchen).
- **Any change to `createItem` / `updateItem` / `deleteItem`** — they already cascade correctly; untouched.
- **Schema changes** — none. The sync only inserts rows into the existing table.

## Verification

After the migration runs:

```sql
-- Should return 0 — every non-deleted item name exists in both properties.
WITH names AS (
  SELECT DISTINCT lower(trim(name)) AS n, property_id
  FROM cafe_menu_items WHERE deleted_at IS NULL
    AND property_id IN ('f8113423-fb4b-4c43-91d7-e281bdd2f81a',
                        '19736bbd-e9d8-4de5-881c-ecd2adc1e9f9')
)
SELECT n FROM names GROUP BY n HAVING COUNT(DISTINCT property_id) <> 2;
```

Spot-check: "Egg fried rice" should now have two rows — the original WTF row (`is_available` unchanged) and a new BLR row (`is_available = false`).
