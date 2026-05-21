# Cafe Dashboard — Split Food Credits into Staff vs Customer

**Created:** 2026-05-22
**Status:** Design approved by cafe ops, ready to build
**Owner:** Cafe Ops

## Summary

The cafe dashboard's "Food Credits Used" stat lumps together two very different things: food credits spent by **staff** (a team meal perk — an internal cost) and food credits spent by **customers** (real revenue). Splitting them lets the operator see true **net revenue** = cash + customer credits, excluding staff meals.

## Why

`useCafeAnalytics` reports `food_credits_used` as one number — the sum of `cafe_orders.food_credit_applied_paise` for today's non-cancelled orders. But staff eating on their credits is not income; it's a staffing cost. Without the split, "Food Credits Used" overstates how much real value the cafe moved, and the operator can't read net revenue off the dashboard.

## What we're building

The "Food Credits Used" card stays a single card showing the total (unchanged at a glance). It becomes **tappable** — tapping opens a small breakdown modal:

```
Food Credits Used — ₹1,240.00
  Staff credits        ₹890.00   — team meals, not revenue
  Customer credits     ₹350.00   — counts as revenue
  ─────────────────────────────
  Net Revenue          ₹438.20   — cash collected + customer credits
```

- **Staff credits** — food credits spent on orders whose phone number belongs to a staff member.
- **Customer credits** — all other food-credit spend.
- **Net Revenue** — `total_revenue` (cash) + customer credits. Excludes staff credits. This is the number cafe ops asked to see.

The dashboard's other cards (Orders, Revenue, Avg Order, Active Orders) are unchanged.

## How "staff" is identified

Confirmed with cafe ops: **everyone on the Staff page counts as staff** — every role (Owner, Property Manager, Chef, Housekeeping, Kitchen Staff).

The Staff page already fetches this list from the Zostel backend via `ADMIN_ASSOCIATION`:

```
useQueryApi("ADMIN_ASSOCIATION", …, `limit=1000&model=Operator&value=${selectedOperator.id}`)
```

Each association row carries `user.mobile`. The dashboard runs the same query for the current property's operator, collects every `user.mobile`, and normalises each with the existing `normalizePhone()` helper (`apps/pms/src/lib/cafe/phone-normalize.ts` — last 10 digits) into a `Set<string>`.

For each non-cancelled order today: `normalizePhone(order.customer_phone)` is checked against that set.
- In the set → the order's `food_credit_applied_paise` goes to **staff credits**.
- Not in the set, or the order has no phone → **customer credits**.

No database change — orders already store `customer_phone`; the staff list already exists.

## Architecture

```
[Dashboard page  /cafe]
        │
        ├─ useCafeAnalytics(propertyId)
        │     ├─ supabase: today's cafe_orders  (existing)
        │     ├─ useQueryApi ADMIN_ASSOCIATION for selectedOperator  (NEW)
        │     │      → staff phone Set (normalised)
        │     └─ splits food_credit_applied_paise by phone-in-staff-set
        │            → staff_food_credits, customer_food_credits
        │
        └─ "Food Credits Used" card → onClick → breakdown Modal
```

## Components / files

| File | Change |
|---|---|
| `apps/pms/src/types/cafe.ts` | `DailyAnalytics` gains `staff_food_credits: number` and `customer_food_credits: number` (paise). `food_credits_used` stays = their sum. |
| `apps/pms/src/hooks/cafe/useCafeAnalytics.ts` | Pulls `selectedOperator` via `useAssociation()`; fetches staff associations via `useQueryApi("ADMIN_ASSOCIATION", …)`; builds the normalised staff-phone `Set`; splits the per-order `food_credit_applied_paise` into the two buckets. |
| `apps/pms/src/pages/cafe/index.tsx` | "Food Credits Used" card becomes clickable; adds an Ant Design `Modal` showing Staff credits / Customer credits / Net Revenue. |

## Data flow & edge cases

- **Order with no `customer_phone`** — cannot be matched to staff → counts as customer credits. (Acceptable; expected to be a small slice. Flagged to ops.)
- **Staff list still loading / fails to load** — `staffPhones` is an empty set → all credits fall into customer credits, total still correct. The breakdown is transiently "all customer" until the staff list resolves, then recomputes. The dashboard never breaks.
- **Phone format mismatch** — orders and staff records may store phones differently (+91, spaces). Both sides run through `normalizePhone()` (last 10 digits) so they compare cleanly.
- **`food_credits_used` total** — unchanged: it equals `staff_food_credits + customer_food_credits`. Existing card display is unaffected.
- **Per-property** — the staff query is scoped to the current dashboard property's operator, matching the per-property dashboard.

## Out of scope

- Per-staff-member credit breakdown (who specifically). The split is staff-total vs customer-total only.
- Historical / date-range analytics. This is the existing "today" dashboard.
- Any change to how food credits are issued or to the Staff page.

## Testing

- The split logic (given orders + a staff-phone set → staff/customer totals) is a pure computation — unit-testable.
- Manual: on `/cafe`, tap "Food Credits Used" → breakdown shows; staff credits + customer credits sum to the card total; Net Revenue = Revenue card + customer credits.
