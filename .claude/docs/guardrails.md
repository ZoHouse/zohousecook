# Guardrails

Hard rules that Claude Code must NEVER break. These are non-negotiable — no exceptions, no "just this once", no workarounds. If a guardrail blocks you, stop and ask the user.

---

## RED LINES — Instant Stop

These will break production, lose data, or compromise security. If you're about to do any of these, **stop immediately**.

### 1. Never expose secrets
- Never commit `.env`, `.env.local`, `.env.production`, or any file containing API keys, tokens, or passwords
- Never hardcode secrets in source code — use environment variables
- Never log secrets (API keys, tokens, passwords) even in error messages
- Never include secrets in error responses sent to the client
- If you see a secret in code, flag it immediately and help move it to env vars

### 2. Never destroy production data
- Never run `DELETE` or `DROP` SQL without a `WHERE` clause
- Never truncate tables in production
- Never run destructive Supabase operations without the user explicitly approving
- Never delete Supabase tables directly
- Always use soft deletes (mark as deleted) over hard deletes where possible

### 3. Never break auth boundaries
- Customer routes (`/cafe/order/*`) must NEVER require admin authentication
- Admin routes must NEVER be accessible without proper auth via `libs/auth/`
- API routes that handle payments (Razorpay) must validate signatures — never skip verification
- Never store raw passwords — auth system handles all auth
- Never expose user phone numbers in client-side responses beyond what's needed for the UI

### 4. Never force push main
- `git push --force` on main/master is forbidden — it destroys other people's work
- `git reset --hard` on main is forbidden
- If you need to undo a commit on main, use `git revert` instead

### 5. Never ship without building
- `npx nx build <app>` must pass before any commit that will be pushed
- TypeScript errors are not warnings — they are blockers
- A broken build blocks the entire team's deploys on Vercel

---

## YELLOW LINES — Proceed with Caution

These won't break production immediately but can cause serious problems. Always flag to the user before crossing.

### 6. Schema changes need approval
- Any change to the Supabase database schema affects the entire system
- Adding a column is safe. Removing or renaming a column can break everything.
- Always propose schema changes before making them
- Test migrations in a staging environment first

### 7. Shared library changes ripple
- `libs/auth/` — affects all 11 apps' authentication. Breaking this locks out everyone.
- `libs/moal/` — affects UI components across all apps.
- `libs/utils/` — affects utilities used everywhere.
- `libs/definitions/` — affects shared types across all apps.
- Per-app `next.config.js` — affects that app's build and routing.
- **Rule:** Read the file fully before editing. Propose changes. Be precise.

### 8. Payment code is sacred
- Payment routes handle real money
- Never modify payment verification logic without explicit approval
- Never skip Razorpay signature validation
- Never change price calculation logic in `apps/pms/src/lib/cafe/order-calculator.ts` without double-checking the math
- All prices are in **paise** (1/100 of a rupee). Getting the unit wrong means charging 100x too much or too little.
- Test payment changes against known good values before shipping

### 9. Don't cross team boundaries silently
- If you're working on cafe code and need to change an admin app component, stop and mention it
- If a fix requires changing shared lib code, flag it — all apps depend on it
- If you need to modify another team's app, explain why and get approval
- Cross-team changes should be logged in `.claude/docs/decisions.md`

### 10. External API calls need protection
- Razorpay, Meta Ads, Supabase, OpenAI — all have rate limits
- Never call external APIs in a loop without throttling
- Never send real emails/SMS in development — check the environment first
- Webhook handlers must return quickly (< 5s) — don't do heavy processing inline
- Always handle API failures gracefully — the external service being down shouldn't crash the app

### 11. Vercel deploys require the assetPrefix guard
- Every `apps/<app>/.env.production` is committed and sets `NEXT_ASSET_PREFIX=https://static.cdn.zo.xyz` for AWS — this is correct for AWS, catastrophic for Vercel
- Before any new app deploys to Vercel, `apps/<app>/next.config.js` MUST include the `isVercelDeployment` guard that force-empties `assetPrefix` when `VERCEL=1` (see `apps/website/next.config.js` and `apps/pms/next.config.js` for the canonical pattern)
- Symptoms of missing guard: blank pages, `_next` chunks 403 from `static.cdn.zo.xyz`, "infinite loop detected" overlay
- Full playbook + project map in `.claude/docs/vercel-deployment.md`

---

## GREEN LINES — Always Do

Positive guardrails — things that must always be true.

### 11. Every navigation link has a page
- Before adding a navigation link, the page must already exist
- Before removing a page, the navigation link must be removed in the same commit
- Test by mentally clicking every link after changes

### 12. Every API route handles errors
- All API routes should have try/catch with proper error responses
- Return `{ error: string }` with appropriate HTTP status codes
- Never swallow errors silently — at minimum `console.error`

### 13. Types are enforced
- New API request/response shapes get type definitions
- Don't use `any` — if the type is complex, define it
- Shared types go in `libs/definitions/`, app-specific types stay in the app
- Frontend types must match what the API actually returns

### 14. Errors are handled
- API routes: try/catch, return `{ error: string }` with correct HTTP status
- Hooks: expose `error` state alongside `loading` and `data`
- Never swallow errors silently — at minimum `console.error`
- User-facing errors should be human-readable, not stack traces

### 15. Mobile works
- Customer ordering page (`/cafe/order/[tableId]`) is mobile-first — test mental model at 375px width
- Use safe-area padding for notched phones (`env(safe-area-inset-*)`)
- Touch targets minimum 44px
- No horizontal scroll on mobile

---

## SCOPE GUARDRAILS — Stay in Your Lane

### Per-team boundaries

| If you're working on... | You can freely modify... | You need approval for... |
|--------------------------|--------------------------|--------------------------|
| Cafe code | `apps/pms/src/pages/cafe/`, `apps/pms/src/components/cafe/`, `apps/pms/src/hooks/cafe/`, `apps/pms/src/types/cafe.ts`, `apps/pms/src/lib/cafe/` | Shared libs, payment verification, auth changes |
| Sales code | `apps/admin/src/pages/insights/`, `apps/admin/src/pages/events/`, `apps/admin/src/pages/users/`, `apps/admin/src/components/` | Shared libs, other apps |
| Infra code | `libs/*`, `nx.json`, `vercel.json`, deployment scripts | Any shared lib change affects ALL apps — always flag |
| $Zo code | `apps/dashboard/`, `apps/website/` (web3 features), `libs/utils/web3/` | Shared libs, wallet-related changes |
| Social code | Relevant app directory for social features | Shared libs, cross-app changes |

### Dependency guardrail
Before adding ANY new npm package:
1. Can antd, MUI, or an existing dep do this? -> Use existing
2. Does an existing dependency cover this? -> Use existing
3. Is it absolutely necessary? -> Justify in commit message
4. Is it maintained and < 50KB gzipped? -> Proceed
5. None of the above? -> Don't add it
6. Add to `transpilePackages` in `next.config.js` if it needs transpilation

### File creation guardrail
Before creating ANY new file:
1. Does a similar file already exist? -> Modify it instead
2. Does it follow the project's file naming convention? (kebab-case)
3. Is it in the right app/lib directory for its team?
4. If it's a component, is it using antd/MUI components?
5. If it's a new page, does the navigation link exist (or will it in this commit)?

---

---

## ZO UNIVERSE GUARDRAILS — Citizen & Connection Integrity

These guardrails protect the integrity of the Zo Universe model (`.claude/docs/zo-universe.md`). They ensure that tools serve citizens correctly and that value flows remain traceable.

### 16. Every tool must identify its citizens
- Before building any new feature or app, identify which citizen subsets (Founders, Builders, Operators, Residents, Community) it serves.
- If a feature doesn't serve at least one subset clearly, question whether it should exist.
- Document the citizen mapping in the design doc or PR description.

### 17. $Zo flows must be traceable
- Any feature that involves value exchange (food credits, bounty payouts, payments, reputation) must have a clear $Zo trace.
- Never build a value exchange without a way to track it — even if the tracking is a simple database column or event log.
- Food credits = $Zo. Bounty payouts = $Zo. Reputation changes = $Zo signal. Don't treat these as isolated systems.
- If modifying an existing $Zo flow (food credits, payments, reputation), verify the trace still works end-to-end.

### 18. Connection surfaces must be preserved
- Never refactor a feature in a way that removes its connection surfaces (exported types, clean APIs, observable events) without providing replacements.
- New features should expose typed interfaces that other tools can consume, even if no consumer exists yet.
- Hardcoding user-type assumptions (e.g., "only admins use this") closes off connection surfaces. Use role-based access instead.
- When in doubt, export the type, expose the hook, and document the surface.

### 19. Cross-subset interactions need $Zo awareness
- When a feature creates an interaction between two citizen subsets (e.g., Founder posts bounty -> Builder claims it), ask: "Is this $Zo-traceable?"
- If the interaction involves real value (money, credits, reputation), the $Zo Token team should be aware — flag it.
- Even if full $Zo integration isn't built yet, leave the data shape ready for it (e.g., include `zo_amount`, `from_citizen`, `to_citizen` fields in the schema).

### 20. New tools must fit the universe
- Any new app or major feature must be mapped onto the Zo Universe before building:
  - Which citizen subsets does it connect?
  - What does it produce that other tools can consume?
  - What does it consume from other tools?
  - Where does $Zo flow in or out?
- This mapping goes in the design doc (Architect output) and should be reviewed before implementation.
- Update `.claude/docs/zo-universe.md` connection map when new tools are added.

---

## Enforcement

These guardrails are enforced at multiple levels:

1. **Hooks** (`.claude/settings.json`) — Automated checks on commit, push, and file changes
2. **Agent definitions** (`.claude/agents/`) — Every agent reads and respects guardrails, including Zo Universe consciousness
3. **Review agent** (`/review`) — Checks all guardrails including Zo Universe integrity before approving changes
4. **Ship command** (`/ship`) — Pre-push checklist verifies compliance
5. **Zo Universe model** (`.claude/docs/zo-universe.md`) — Reference for citizen subsets, tool mapping, and $Zo flows
6. **This document** — Read by Claude Code at the start of every relevant session

If a guardrail feels wrong for a specific situation, don't silently break it. Say: "This guardrail blocks what we need to do: [which one]. Here's why I think we should make an exception: [reason]." Let the user decide.
