Pre-push checklist. Run through this before any commit.

## 1. Build check
Run `npx nx build <app>` for the app you modified — must pass clean. No warnings treated as errors, no missing imports, no type errors.

Common builds:
- `npx nx build pms` — PMS (cafe, IoT, housekeeping)
- `npx nx build admin` — Admin (trips, bookings, events)
- `npx nx build dashboard` — Dashboard (founder metrics)
- `npx nx build website` — Website (public + web3)

## 2. Navigation audit
If you touched navigation config (`configs/navigationLinks.json` or equivalent):
- Verify every link has a working page
- No new links pointing to routes that don't exist

## 3. No orphan dependencies
If you added a package:
- Can an existing dep (antd, MUI, etc.) do this? If yes, remove the new dep.
- If justified, document why in the commit message.
- Ensure it's added to `transpilePackages` in the app's `next.config.js` if needed.

## 4. Auth check
- Admin routes: wrapped in auth via `libs/auth/`
- Customer routes (`/cafe/order/*`): NOT behind admin auth
- New API routes: auth checked before processing

## 5. Shared lib impact
If you modified anything in `libs/`:
- All 11 apps may be affected — build at least the major ones (pms, admin, dashboard)
- Check for type breakage across apps

## 6. Team doc updated?
If you built something new or learned something, the relevant `.claude/docs/teams/*.md` should reflect it:
- New files/routes added to ownership
- Known gaps closed
- New patterns documented
- New gotchas recorded

## 7. Commit message
Format: `type(scope): description`
- Types: feat, fix, refactor, chore, docs
- Scope: cafe, sales, infra, zo, social, pms, admin, or omit for cross-cutting
- Description: what AND why. Not "update menu" — instead "add availability toggle so kitchen can 86 items in real time"

Tell me the commit message and I'll confirm before you commit.
