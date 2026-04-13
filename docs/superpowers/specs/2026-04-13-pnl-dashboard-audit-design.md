# P&L Dashboard Audit & Real-Time Accuracy — Design

**Date:** 2026-04-13
**Owner:** Samurai
**App:** `apps/pms` (zozozo.work/pm, zo.xyz/pm)
**Feature status:** testing (Zo House only — BNGHO812 Koramangala, BNGS531 Whitefield)

---

## Context

The P&L dashboard inside PMS shipped as one commit on 2026-03-30 (`f1aa31b`). Every figure on it is one of: manually entered, fetched-on-mount with no refresh, or derived from a data source that silently disagrees with reality. Nobody on the team can currently open the dashboard and trust the EBITDA number.

This spec defines the audit fixes and accuracy guarantees needed before this becomes the operational source of truth for how each house is performing.

## Goals

1. Every figure on the dashboard is as real-time as possible (manual refresh, fresh on click).
2. Every figure has a clear, documented data source.
3. Stay revenue uses accrual accounting so month boundaries don't distort the picture.
4. The cafe revenue figure is honest about its incompleteness until Cafe Zomad takes over from Fudr.
5. Other revenue breaks out Events / Activations / Sponsorships so the business can see which streams move.
6. EBITDA derivation is auditable — a reader can click through from the top-level number to every expense and every booking that fed it.

## Non-Goals

- No automatic polling or websocket subscriptions. Manual refresh only.
- No combined "all properties" rollup. Per-property only.
- No YoY / prior-period comparison charts. Three views: Today, WTD, MTD.
- No EBITDA target or progress bar. Raw number only.
- No Fudr API integration. Cafe uses whatever is in `cafe_orders` and shows a warning badge until Cafe Zomad switchover.
- No new expense reconciliation pipeline (bank statements, accounting system). Out of scope.

## Decisions Locked In

| Area | Decision | Rationale |
|---|---|---|
| Stay revenue source | Zostel API `/api/v1/admin/pm/bookings/` | Origin of every booking. All downstream systems (ops-backend, `pms_bookings`) are mirrors. |
| Stay revenue basis | Accrual — nights-in-range × nightly rate | Matches when revenue is earned, not when cash arrived. Standard hotel P&L. |
| Stay revenue inclusions | Net room revenue + extra bed charges, exclusive of GST | Pure stay-experience revenue, comparable to benchmarks. |
| Cafe revenue | Supabase `cafe_orders`, `payment_status='paid'` | Historical Fudr data already backfilled. Live Fudr sync out of scope. |
| Cafe warning | ⚠️ badge + tooltip: "Cafe Zomad pending — MTD reflects migrated data only" | Honest display when data is incomplete. |
| Other revenue | Three separate lines: Events, Activations, Sponsorships | Requires `subcategory` field on expense form. |
| Expenses | Supabase `property_expenses`, daily entry | Current operational discipline confirmed — entry is reliable. |
| EBITDA target | None displayed | Raw number only. |
| Date views | Today, WTD, MTD (three tabs) | Near-term ops views only. No custom picker, no trends. |
| Property scope | Per-property only, operator selector | No combined rollup. |
| Refresh | Manual refresh button with "Updated HH:MM:SS" timestamp | No auto-polling. |
| Architecture | Hybrid — Zostel live for stay, Supabase RPC for non-stay rollup | Avoids new sync pipeline. Each data source queried where it lives. |

---

## Architecture

```
Frontend: apps/pms/src/pages/pnl/index.tsx
  ├─ Header: [Today] [WTD] [MTD] tabs  |  [Refresh ↻] button  |  "Updated 14:32:05"
  │
  ├─ useStayRevenue(operator, range)
  │    → calls useQueryApi('ADMIN_PM_BOOKINGS', { operator, overlap })
  │    → returns raw bookings overlapping [range.start, range.end]
  │    → pipes through computeStayAccrual()
  │    → returns { total_paise, breakdown[] }
  │
  ├─ usePnlNonStay(operator, range)
  │    → calls Supabase RPC: property_pnl_non_stay_summary(property_id, start, end)
  │    → returns one row: { cafe_revenue, events_revenue, activations_revenue,
  │                         sponsorships_revenue, expenses_by_category[] }
  │
  └─ PnlSummary renders when both hooks have settled
       Per-section loading/error so Zostel outage ≠ blank cafe numbers
```

**Math location principle:** Stay revenue requires nightly accrual math that depends on booking line-item data only Zostel has, so it computes client-side after fetch. Cafe, expense, and other-revenue rollups are pure SQL aggregations and belong in Postgres — one indexed RPC call replaces three table scans.

---

## Data Flow

### Stay Revenue — Accrual Math

**Input:** Zostel booking list for operator, filtered by `check_in <= range.end AND check_out > range.start` (overlap filter).

**Per-booking computation:**

```
nights_total = days_between(booking.check_in, booking.check_out)
nights_in_range = days_between(
    max(booking.check_in, range.start),
    min(booking.check_out, range.end)
)
earnable_total = (booking.room_total - gst_component) + extra_bed_charges_net_of_gst
nightly_rate = earnable_total / nights_total
revenue_in_range = nightly_rate × nights_in_range
```

**Filter:** Booking must not have `status IN (cancelled, refunded)` AS OF the query time. A booking cancelled today loses revenue from yesterday too — this is the correct behavior because a refunded night was never earned. This is a known trade-off: late cancellations cause historical MTD figures to shift. Flagged as "known behavior" in dashboard tooltip.

**Open question — Zostel field mapping:**
The exact Zostel response fields for `room_total`, `extra_bed_charges`, `gst_component`, `status` need verification against the live API response. Implementation plan must begin with inspecting a real Zostel booking payload for both properties and documenting the field-level mapping. The `computeStayAccrual` function is written against a typed `ZostelBooking` interface, and the adapter from raw API → typed interface is the first thing to nail down.

**Testing:** `computeStayAccrual` is a pure function. Unit tests cover:
- Single-night booking fully inside range
- Multi-night booking spanning range start (partial overlap at start)
- Multi-night booking spanning range end (partial overlap at end)
- Multi-night booking fully containing range (pure pass-through: range-length nights × nightly_rate)
- Multi-night booking fully outside range (zero)
- Cancelled booking (zero)
- Booking with extra bed charges
- Zero-night edge case (shouldn't happen but defensive)

### Non-Stay Rollup — Supabase RPC

**New RPC:** `property_pnl_non_stay_summary(p_property_id uuid, p_start date, p_end date)`

**Returns one row:**
```sql
  cafe_revenue        bigint  -- paise, SUM(cafe_orders.total) WHERE payment_status='paid'
  events_revenue      bigint  -- paise, property_expenses WHERE type='revenue' AND subcategory='events'
  activations_revenue bigint  -- paise, property_expenses WHERE type='revenue' AND subcategory='activations'
  sponsorships_revenue bigint -- paise, property_expenses WHERE type='revenue' AND subcategory='sponsorships'
  expenses_by_category jsonb  -- [{ category, total_paise }, ...], type='expense', soft-deleted excluded
```

**Filter rules:**
- All date filters on `date` column (not `created_at`) — matches accrual intent for stay revenue.
- `deleted_at IS NULL` for property_expenses.
- `cafe_orders.property_id` maps via `src/lib/cafe/operator-map.ts`.

**RPC is a thin read-only SQL function.** No side effects. Safe to call from client with anon key since it only reads data already gated by RLS policies on `cafe_orders` and `property_expenses`.

---

## Schema Changes

### 1. `property_expenses` — add subcategory
```sql
ALTER TABLE property_expenses
  ADD COLUMN subcategory text;

-- Backfill existing type='revenue' rows (likely few/none)
-- Leave NULL for expense rows, optional
```

Frontend form adds a subcategory dropdown that appears only when `type='revenue'` is selected: `[Events, Activations, Sponsorships]`.

### 2. New Supabase RPC
`property_pnl_non_stay_summary` as specified above. Plain SQL function, not a stored procedure. Exposed via Supabase RPC endpoint.

### 3. No new tables
No sync tables, no snapshot tables, no cache tables.

---

## Component Changes

### `src/pages/pnl/index.tsx`
- Replace `[MTD | Last Month]` tabs with `[Today | WTD | MTD]`
- Add Refresh button + "Updated HH:MM:SS" timestamp display
- Remove EBITDA target progress bar UI
- Wire both hooks to refetch in parallel on refresh click

### `src/components/pnl/PnlSummary.tsx`
- Break "Other Revenue" into three lines: Events, Activations, Sponsorships
- Add ⚠️ warning badge next to Cafe Revenue tile with tooltip
- Remove hardcoded `EBITDA_TARGET_PAISE` constant
- Render accrual breakdown expandable section: click Stay Revenue to see per-booking breakdown (booking_id, guest_name, nights_in_range, nightly_rate, revenue_in_range)

### `src/components/sidebars/ExpenseForm.tsx` (or wherever the expense form lives)
- Add conditional subcategory dropdown for `type='revenue'`
- Required if type=revenue, hidden if type=expense
- Validate amount is in paise (×100 from rupee input) — add explicit "₹" label on input, hidden paise conversion, validated before write

### New files
- `src/hooks/pnl/useStayRevenue.ts` (split from `usePnlRevenue`)
- `src/hooks/pnl/usePnlNonStay.ts`
- `src/lib/pnl/compute-stay-accrual.ts` (pure function)
- `src/lib/pnl/date-ranges.ts` — produces `{ start, end }` for Today / WTD / MTD in IST
- `src/lib/pnl/compute-stay-accrual.test.ts` — unit tests
- `supabase/migrations/YYYYMMDDHHMMSS_pnl_non_stay_summary.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_property_expenses_subcategory.sql`

### Files to delete/collapse
- `src/hooks/pnl/usePnlRevenue.ts` — replaced by the split hooks above

---

## Date Range Semantics

All ranges in IST (Asia/Kolkata). Day boundary = local midnight.

| View | start | end |
|---|---|---|
| Today | today 00:00 IST | today 23:59:59 IST (i.e., next local midnight exclusive) |
| WTD | Monday 00:00 IST of current week | now |
| MTD | 1st of current month 00:00 IST | now |

Stored as `Date` objects, converted to `YYYY-MM-DD` for Supabase and ISO for Zostel API. All conversion logic in `src/lib/pnl/date-ranges.ts` with unit tests.

---

## Error Handling & Loading States

- **Zostel API fails:** Stay revenue section shows error state with retry button. Cafe/expenses still render.
- **Supabase RPC fails:** Non-stay section shows error state with retry button. Stay still renders.
- **Both fail:** Full-page error with global retry.
- **Partial Zostel data** (API returns 200 but missing `paid_amount` / `total`): Log to Sentry with booking_id, exclude from calculation, surface a "N bookings excluded due to missing data" warning on the UI.
- **Date range computes to zero nights** (e.g., Today before first booking check-in): render "₹0" — valid state, not an error.
- **Manual refresh in flight:** Button disabled, spinner on button. Both hooks refetch in parallel.

---

## Testing Strategy

1. **Unit tests for `computeStayAccrual`** — cover all 8 cases listed above.
2. **Unit tests for `date-ranges.ts`** — boundary cases (first/last day of month, first day of week, DST — though IST has no DST so skip).
3. **RPC test** — seed `cafe_orders` + `property_expenses` in a Supabase test schema, call RPC, assert totals. Run in CI via Supabase CLI.
4. **Manual smoke test** — Compare the accrual-computed Stay Revenue MTD against a hand-calculated number for a known week using 5-10 real bookings. Required before merging.
5. **Cross-reference** — Once deployed, compare dashboard EBITDA against whatever finance reconciliation currently exists (even if it's a Google Sheet). Flag any >2% drift for investigation.

---

## Rollout Plan

1. Ship the Zostel booking field audit first (standalone PR): fetch one real booking payload per property, document field mapping, commit as `docs/zo-houses/operations/zostel-booking-field-map.md`.
2. Schema migrations (subcategory + RPC) — standalone PR, reviewed by infra team.
3. `computeStayAccrual` + unit tests + date-ranges lib — standalone PR, purely additive.
4. Refactor hooks (`usePnlRevenue` → split) + render changes — main PR.
5. Manual smoke test on staging before merge.
6. Deploy; watch Sentry for 24h.

No feature flag. Feature is already gated to two operator codes (BNGHO812, BNGS531) via `zo-house-features.ts`; rollout is to those two accounts only.

---

## Open Questions for Implementation

1. **Zostel field mapping:** Which exact response fields represent `room_total`, `extra_bed_charges`, `gst_component`, `status`, `check_in`, `check_out`? Requires inspecting a live API response. Blocks step 1 of rollout.
2. **Expense subcategory backfill:** Are there existing `type='revenue'` rows in `property_expenses` that need backfilling to a subcategory? Check before migration.
3. **Cafe operator → property UUID mapping:** Confirmed in `src/lib/cafe/operator-map.ts` for both houses; RPC should use the same source.
4. **Refresh button placement:** Top-right of dashboard header, or in each section card? UX call — default to top-right global refresh unless the team prefers per-section.

---

## Out of Scope (Explicit Non-Goals)

- Fudr live API integration
- Automatic polling / websocket realtime
- Cross-property rollup view
- YoY or prior-month trend charts
- EBITDA target / variance
- Budget entry
- Per-guest profitability
- Audit log of who changed which expense when (nice-to-have, defer)
- Receipt image upload
- Bank / accounting reconciliation
