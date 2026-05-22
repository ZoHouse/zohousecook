# Food Credits — search by name + per-person credit summary

**Created:** 2026-05-22
**Status:** Design approved by cafe ops, ready to build
**Owner:** Cafe Ops

## Summary

Two changes to `/cafe/food-credits`:

1. **Find people by name** — search currently only works if you type an exact 10-digit phone number. Make it a live search over name *or* phone, with a dropdown of matches to pick from.
2. **Credit summary** — when a person is open, show a clear highlighted strip with: balance left, how much was last credited, and when.

## Why

An operator remembers a person by name, not by their phone number. Today, if you don't have the exact number you can't find anyone. And while the per-wallet transaction history already lists every top-up, the operator wants the key facts — current balance, last top-up amount, last top-up date — readable at a glance instead of scanning a table.

## Part 1 — Search by name or phone

The search box becomes an Ant Design `AutoComplete`. As the operator types (≥2 characters), a debounced query hits `food_credit_wallets` matching **name OR phone**, and a dropdown lists up to 10 matches:

```
Damodar Mai   · 8327714844 · 40 $food
Damini R.     · 9900112233 ·  0 $food
```

- Picking a match loads that person's wallet (existing `searchByPhone` flow).
- Typing a full 10-digit phone still also runs `searchByPhone` directly — preserving the existing "no wallet yet → issue first credit" (`customerMatch`) path for brand-new people.
- The query string is sanitised (commas/parentheses stripped) before being placed in the PostgREST `.or()` filter.

## Part 2 — Credit summary strip

When a wallet is open, a highlighted strip sits just under the name/phone header, above the transaction table:

```
┌────────────────────────────────────────────────┐
│  Balance left     Last credited      When        │
│  40 $food         100 $food          20 May 2026 │
└────────────────────────────────────────────────┘
```

- **Balance left** — `wallet.balance`
- **Last credited** — `amount` of the most recent `issue`-type transaction
- **When** — `created_at` date of that transaction

All three are derived from data **already loaded** (`wallet` + `transactions`) — no new database calls. If the person has never been credited (no `issue` transaction), "Last credited" / "When" show "—".

## Components / files

| File | Change |
|---|---|
| `apps/pms/src/hooks/cafe/useFoodCredits.ts` | Add `searchWallets(query)` → returns up to 10 `{ id, phone, name, balance }` matches by name/phone. Export a `WalletSearchResult` type. |
| `apps/pms/src/pages/cafe/food-credits.tsx` | Search `Input` → `AutoComplete` with debounced options from `searchWallets`; pick → `searchByPhone`. Add the credit-summary strip to the wallet detail card. |

No database changes. No schema changes.

## Data flow & edge cases

- **Query < 2 chars** — no search; dropdown stays empty.
- **Wallet with no name** — option shows phone only; name searches won't match it (expected).
- **Special characters** in the query (`,` `(` `)`) — stripped before the `.or()` filter so PostgREST syntax can't break.
- **Phone vs name in one box** — the `.or()` filter matches `name ILIKE %q%` and (when the query has ≥2 digits) `phone ILIKE %digits%`, so one box serves both.
- **Person never credited** — `transactions.find(t => t.type === 'issue')` is undefined → summary shows "—" for last-credited fields; balance still shows.
- **Selecting from the dropdown** vs typing a full phone — both end at the same `searchByPhone(phone)` call, so the wallet detail renders identically.

## Out of scope

- Searching people who have only placed orders but have no wallet (they have no credit history to summarise). The existing exact-phone `customerMatch` path already covers issuing them their first credit.
- Any change to issuing/revoking credits, the stats cards, or the recent-activity table.

## Testing

- `searchWallets` is a thin query wrapper; verify manually: typing a partial name returns matching wallets; commas in the query don't error.
- Manual: open `/cafe/food-credits`, type a partial name → dropdown lists matches → pick one → wallet opens with the summary strip showing balance, last-credited amount, and date.
