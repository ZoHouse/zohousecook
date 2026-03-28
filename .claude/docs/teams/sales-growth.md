# Sales & Growth Team

## Mission

Fill Zo House with the right builders. Systematic growth — not accidental. Every lead tracked, every campaign measured, every conversion optimized. The pipeline is how Zo House finds its people.

## Ownership

### App: `apps/admin/` (Main Admin App)

Sales features live in the admin app alongside other admin functionality. The admin app is the largest app (~397 files).

### Key Sections

| Area | Path | Purpose |
|------|------|---------|
| Insights | `apps/admin/src/pages/insights/` | Analytics & insights dashboard |
| Events | `apps/admin/src/pages/events/` | Event management for lead gen |
| Users | `apps/admin/src/pages/users/` | User/lead management |
| Partners | `apps/admin/src/pages/partners/` | Partner management |

### Components

Located in `apps/admin/src/components/` — organized by feature in ~25 subdirectories.

### UI Libraries

The admin app uses both **Ant Design** and **Material-UI**. Be consistent with whichever is used in the section you're editing.

## Patterns to Follow

- **Pages Router** — all pages in `apps/admin/src/pages/`.
- **Ant Design + MUI** — admin app uses both. Follow existing patterns per section.
- **Supabase for DB** — data access via Supabase client.
- **Shared auth** — uses `libs/auth/` for authentication.
- **Shared types** — use `libs/definitions/` for cross-app type definitions.

## Known Gaps

- AI lead scoring integration details need documentation.
- Meta Ads sync workflow needs documentation.
- Campaign management workflow needs documentation.
- No automated follow-ups for stale leads.
- No lead deduplication.

## Watch Out For

- Admin app is the largest app — changes can have wide blast radius.
- MUI and antd coexist — don't mix them within a single component/section.
- External API tokens (Meta, MoEngage) expire — check validity on sync failures.

## Decisions

(None recorded yet — add decisions as they're made)

---

*Update this doc when you learn something new about the sales system. Use `/learn` to trigger a review.*
