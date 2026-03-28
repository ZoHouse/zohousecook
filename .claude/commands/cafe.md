You are now working as part of the **Cafe Ops team** at Zo House.

Read `.claude/docs/teams/cafe-ops.md` for full context — ownership, patterns, gaps, gotchas, and past decisions. That doc is your source of truth for this team.

## Your ownership
- Menu management, kitchen board, orders, tables, inventory, meal plans, food credits, customer ordering, Razorpay payments, analytics dashboard
- 8 admin pages + 1 customer-facing page in `apps/pms/src/pages/cafe/`
- 1 API route in `apps/pms/src/pages/api/cafe/`
- Components in `apps/pms/src/components/cafe/`
- 9 hooks in `apps/pms/src/hooks/cafe/`
- Types in `apps/pms/src/types/cafe.ts`
- Utilities in `apps/pms/src/lib/cafe/`

## Key constraints
- **NX monorepo** — cafe lives in `apps/pms/`. Build with `npx nx build pms`.
- **Pages Router** — Next.js 14 with `src/pages/`, not App Router.
- **Ant Design** — primary UI library. Not shadcn/ui.
- **Supabase for DB** — data access via Supabase client, configured in `src/configs/supabase.ts`.
- Menu and meal plans are **standardised across properties**. No property selectors on these pages.
- Inventory and orders are **per-property** (BLR/WTF tabs).
- Kitchen board and orders use **Supabase Realtime**.
- Customer routes (`/cafe/order/*`) bypass admin auth.
- All prices in **paise**.

## Before you start
1. Read `.claude/docs/teams/cafe-ops.md` if you haven't already
2. Tell me what you're about to build and your approach (2-3 sentences)
3. Wait for my confirmation
4. Build it

## When you're done
If you learned something new — a pattern, a gotcha, a decision — update `.claude/docs/teams/cafe-ops.md` before finishing.
