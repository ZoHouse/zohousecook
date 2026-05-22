# PMS admin-write RLS posture — decision needed

**Status:** open question for Samurai
**Raised:** 2026-04-22
**Related PRs:** #49 (narrow unblock for meal plans)

## tl;dr

Every admin-write code path in PMS is hitting `42501 new row violates row-level security policy` because the tables have RLS enabled with only SELECT policies for `anon`. The only reason production appears to work at all is that the order-placement path runs through the `place_cafe_order` RPC, which is SECURITY DEFINER and bypasses RLS. Any write that goes through the Supabase client directly — menu mutations, ingredient CRUD, table creation, meal plans, food-credit wallet creation — silently fails. Users see "Failed to…" toasts (or, in some cases, nothing at all) and assume the feature is buggy.

We need a consistent posture for this. Three options below. Recommendation: **Option B**, with the narrow meal-plan unblock in #49 as a bridge until the broader change lands.

## Evidence

Probed against staging (`elvaqxadfewcsohrswsi`) with the same anon key the deployed PMS uses:

| Table | POST /rest/v1 |
|---|---|
| `cafe_menu_categories` | 401 / 42501 |
| `cafe_menu_items` | 401 / 42501 |
| `cafe_tables` | 401 / 42501 |
| `cafe_ingredients` | 401 / 42501 |
| `cafe_ingredient_stock` | 401 / 42501 |
| `cafe_recipe_items` | 401 / 42501 |
| `cafe_meal_plans` | 401 / 42501 *(fixed by #49)* |
| `cafe_meal_plan_items` | 401 / 42501 *(fixed by #49)* |
| `food_credit_wallets` | 401 / 42501 |

Every table rejects at the "new row violates RLS" step, meaning each has RLS enabled and no INSERT policy for `anon`.

Client code affected (non-exhaustive):
- `useCafeMenu` — `createCategory`, `createItem`, `toggleAvailability`, `updateItem`, `toggleCategory`
- `useIngredients` — `createIngredient`, `updateStock`, `updateIngredient`
- `useCafeMealPlans` — `createPlan`, `updatePlan`, `addItem`, `removeItem`, `copyPlans` *(fixed by #49)*
- `useCafeTables` — create/update/toggle
- `useFoodCredits` — `issueCredit` (creates wallet + transaction)
- `CreateOrderDialog` — direct `cafe_orders` + `cafe_order_items` inserts (also affected by the `20260404` hardening, which removed anon INSERT on orders — this path relies on being re-opened OR rewritten to use `place_cafe_order`)
- `MenuItemForm` — recipe item upserts

Note: `apps/pms/src/configs/supabase.ts` currently does `service_key || anon_key`. If `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` is **set** on Vercel today, writes succeed — but the service key is inlined into the public JS bundle, bypasses ALL RLS, and violates CLAUDE.md RED LINE #1 ("never expose secrets"). If it is **not** set, every admin write has been silently broken since launch. Either way, this is a problem.

## Options

### Option A — permissive anon writes, table by table

Extend the `20260326_cafe_customer_rls.sql` pattern: add `FOR INSERT / UPDATE / DELETE TO anon WITH CHECK (true)` policies on each admin-write table.

**Pros:**
- Zero client code changes.
- Fastest to ship (one migration file).
- Matches the existing precedent in the repo (orders before #20260404, meal plans in #49).

**Cons:**
- The anon key is effectively public — anyone who loads `zozozo.work` can extract it and write to these tables directly. Menu spam, fake food-credit wallets, stock manipulation all become possible by anyone with a browser.
- Moves us in the wrong direction security-wise. #20260404 tightened `cafe_orders` for this exact reason; opening everything else back up re-creates the same hole on the rest of the surface.

**When this makes sense:** as a *temporary bridge* while Option B is built, same as #49 is doing for meal plans. Not as the end state.

### Option B — Supabase-authenticated staff writes (recommended)

Wire PMS sessions to Supabase Auth. Every admin-write table gets policies for the `authenticated` role instead of `anon`. Reads stay on `anon` (keeps the customer `/cafezomad/` path working with the public key).

**Pros:**
- Matches Supabase's intended security model.
- Anyone without a valid Supabase JWT can still browse menus / place orders, but cannot write admin data.
- Consistent with `supabase/migrations/20260330_property_expenses.sql` which already uses `TO authenticated`.
- Each staff session is identifiable in Supabase logs (helps the P&L / audit story later).

**Cons:**
- PMS currently auths via Zostel SSO, not Supabase Auth. We'd need to either (a) exchange the Zostel JWT for a Supabase JWT via a small Edge Function, or (b) do a server-side sign-in-as-anon + upgrade flow. Not trivial, but contained to `libs/auth` + `configs/supabase.ts`.
- The `authenticated` role is still coarse — any signed-in staff can do anything. If we later want property-scoped writes (WTF staff can't edit BLR menu), we'd need to add per-policy checks on a JWT claim. Not required for now but worth designing for.

**When this makes sense:** as the target end state. The Zostel-to-Supabase token bridge is the piece that needs design before we can ship this.

### Option C — push all admin writes behind SECURITY DEFINER RPCs

Same pattern as `place_cafe_order`: no direct table INSERT/UPDATE/DELETE from client, only `supabase.rpc('create_menu_item', …)` etc. RPCs run as `service_role`, do their own authz checks, and return the new row.

**Pros:**
- Strongest security — tables are locked down, RPCs are the only write path, every RPC can enforce its own invariants (daily limits, price freezes, stock minimums, etc.).
- Same path the `20260404` hardening put us on for orders.
- Lets the DB enforce things the client currently trusts (server-side prices, atomic inventory deduction, concurrent-write safety).

**Cons:**
- Big surface. Every admin write becomes a new RPC: `create_menu_item`, `update_menu_item_availability`, `create_ingredient`, `update_ingredient_stock`, `create_meal_plan`, `add_meal_plan_item`, `create_table`, `issue_food_credit`, `revoke_food_credit`, `create_recipe_item`, etc. Plus the client-side hooks need rewriting to call the RPCs.
- Slowest to ship. Probably weeks, not days.

**When this makes sense:** once the cafe graduates from Supabase → Django (per the `zo-house-features.ts` comment: *"When features graduate to Django, this client is removed entirely"*). Doing it now is probably over-engineering for the testing window.

## Recommendation

1. **Land #49 as-is** to unblock meal plans for the testing playbook.
2. **Rotate the service-role key immediately** if `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` is set in Vercel today, and stop setting it. Remove the fallback in `apps/pms/src/configs/supabase.ts` so the code can only use the anon key.
3. **Commit to Option B** for the admin-write story. Design the Zostel-to-Supabase token bridge, ship it, then migrate each admin table's policies from `anon` to `authenticated` in one sweep. Drop the stopgap anon-write policies from #49 and friends at the same time.
4. **Revisit Option C** post-graduation to Django, not now.

## What I need from Samurai

- Confirmation / redirection on the recommended path (B, or a different call).
- Confirmation of current Vercel env state re: `NEXT_PUBLIC_SUPABASE_SERVICE_KEY`.
- Priority call: do we want another short-term unblock PR (Option A for the remaining admin tables, similar to #49) while Option B is designed, or hold until B is ready?
