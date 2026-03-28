We're adding something new to Zo House Cook.

## Step 1: Find the owner

Check the team docs in `.claude/docs/teams/` to find which team owns this area. If it spans teams, identify the primary owner.

Teams and their apps:
- **Cafe Ops** (`.claude/docs/teams/cafe-ops.md`) — `apps/pms/` — menu, kitchen, orders, tables, inventory, meal plans, payments
- **Sales & Growth** (`.claude/docs/teams/sales-growth.md`) — `apps/admin/` — leads, campaigns, events, insights
- **Infra & Platform** (`.claude/docs/teams/infra-platform.md`) — `libs/*`, NX config, deployment, auth
- **$Zo Token** (`.claude/docs/teams/zo-token.md`) — `apps/dashboard/`, `apps/website/` — token analytics, web3
- **Social & Content** (`.claude/docs/teams/social-content.md`) — content calendar, platforms

## Step 2: Load context

Read that team's doc. Pay attention to:
- **Patterns to follow** — use existing patterns, don't invent new ones
- **Known gaps** — maybe this feature closes one
- **Watch out for** — avoid known pitfalls

## Step 3: Propose

Share your approach in 2-3 sentences:
- Which app and files you'll create or modify
- Which existing patterns you'll follow
- Any new dependencies (must justify — check antd/MUI first)

**Wait for approval before writing code.**

## Step 4: Build

Write the code. Follow the data fetching pattern:
- Page (`src/pages/...`) -> Hook (`src/hooks/...`) -> Supabase client or API route

## Step 5: Verify

- Run `npx nx build <app>` — must pass clean
- If you added a navigation link, verify the page renders (no 404s)
- If you modified a shared lib, build affected apps
- If you added a new env var, document it in CLAUDE.md

## Step 6: Update docs

- Add new files/routes to the team doc's ownership section
- If this closes a known gap, mark it complete
- If you made a non-obvious decision, add it to the Decisions section with today's date
