# /earn — Builder Reputation Feature Spec

**Date:** 2026-05-06
**App:** `apps/earn/`
**Status:** Proposal — pending PM sign-off
**One-liner:** Turn `/earn` into the place where Zo *sees, ranks, and celebrates* what builders ship — across GitHub, X, and the products they launch.

---

## Why

`/earn` today shows bounties and Luma events. It tells you *what's available*, not *who's shipping*. Builders have no profile, no public score, no reason to come back unless a new bounty drops.

We want builders on a **path** — connect their accounts once, and Zo automatically tracks their development life: PRs merged, releases shipped, products launched, posts about building. That activity becomes a public score and a personal dashboard. The leaderboard creates a sprint feeling; the dashboard shows progress over time.

This is also the data layer for everything downstream: gating bounties by reputation, $Zo emissions per ship, founder-builder matching. We're not building those now — we're building the spine they sit on.

---

## Who it's for (citizen subsets)

| Subset | What they get |
|---|---|
| **Builders** | Public profile, leaderboard rank, personal dashboard, lifetime title that grows |
| **Founders / sponsors** | A way to *see* who actually ships before handing out bounties or grants (v2 surface) |
| **Zo Universe** | A reputation graph — the foundation for $Zo emissions tied to verifiable shipping |

---

## What we're building (v1)

### 1. Account connection
- **GitHub OAuth** + **X OAuth** on the builder profile.
- Tokens stored encrypted, refresh handled, one row per provider per builder (`BuilderAccount` table).

### 2. Auto-detected products
- Any GitHub repo with a `homepage` URL is treated as a launched product.
- Builder gets a list and toggles each one **public** or **private**.
- Private products are hidden from public profile/leaderboard but still count in the builder's own dashboard.

### 3. Three-axis score (rolling 7 days)

| Axis | What feeds it |
|---|---|
| **Ship** | Merged PRs to default branch, releases, npm publishes, new product launches, commits (lower weight) |
| **Reach** | Stars + forks earned, X posts (keyword-filtered to building-related), engagement on those posts |
| **Consistency** | Active days in window, current streak, week-over-week stability |

- **Window:** rolling 7 days for the leaderboard. Old activity decays out.
- **X filter:** keyword-based (`ship`, `build`, `deploy`, `launch`, `code`, repo links, code screenshots). Cheap, dumb, good enough for v1.

### 4. Two tracks visible to builders
- **Lifetime title** — never lost. "Zo Newbie" → "Zo Shipper" → "Zo Architect" → … Earned by cumulative XP.
- **Current rank** — rolling 7d, can fall. This is the leaderboard.

### 5. Surfaces

Login on `/earn` stays as it is today (phone-OTP via `ZoAuth`). **GitHub and X are not login methods** — they are connections managed only on the builder's profile page. `/earn` itself remains the bounties home; the leaderboard lives at its own URL.

- **`/earn` (existing — unchanged behavior)**
  Open Quests grid + Luma feed. We add a small **rank chip in the navbar** ("You're #14 this week" → links to `/earn/leaderboard`) when the builder is logged in and has a score. That's the only visible touch on this page.

- **`/earn/leaderboard` (new, public)**
  Top 100, sortable by Ship / Reach / Consistency. Logged-in builder sees their row highlighted in place plus a greeting strip above the table: `@handle — you're #14 this week.` If they haven't connected anything yet: soft nudge — *"Connect GitHub on your profile to start scoring"* → `/earn/profile`.

- **`/earn/profile` (new, private — self only)**
  - Account connections: **Connect GitHub** / **Connect X** buttons. This is the only place these exist.
  - Their week panel: 3 axis scores, current streak, lifetime title, "what would lift your rank" hints.
  - Their last 20 ships, reverse-chrono.
  - Product list with public/private toggles.
  - Link to their public profile for sharing.

- **`/earn/builders/[handle]` (new, public)** — Contribution heatmap, public products, lifetime stats, recent ships, badges. The shareable Zo identity.

### 6. Connect flow — return to profile

Connecting GitHub or X is a profile action, so OAuth lands back on the profile, not the home:

1. Builder is on `/earn/profile` → clicks **Connect GitHub**.
2. GitHub OAuth → redirect URL is `/earn/profile?connected=github`.
3. Backend creates `BuilderAccount` row, kicks off first ingest in the background.
4. Profile re-renders with: `Pulling your last 30 days…` and skeletons on the score/ships panels.
5. As ingest finishes (usually 5-15s), panels fill in live (poll or subscription).
6. Same flow for X via `/earn/profile?connected=x`.

Key rule: **OAuth returns to the profile page**, so the builder sees their own data lighting up exactly where they triggered it.

---

## Data model (additions to existing Prisma schema)

```prisma
model BuilderAccount {
  id           String   @id @default(uuid())
  userId       String
  provider     String   // 'github' | 'x'
  providerId   String   // their id on that platform
  handle       String
  accessToken  String   // encrypted
  refreshToken String?  // encrypted
  scope        String?
  connectedAt  DateTime @default(now())
  @@unique([userId, provider])
}

model BuilderShip {
  id          String   @id @default(uuid())
  userId      String
  source      String   // 'github' | 'x' | 'zo-bounty'
  kind        String   // 'pr_merged' | 'release' | 'commit' | 'product_launch' | 'x_post' | 'star_earned' | 'npm_publish'
  ref         String?  // canonical URL
  repo        String?
  metadata    Json?
  isPrivate   Boolean  @default(false)  // for products toggled private
  occurredAt  DateTime
  ingestedAt  DateTime @default(now())
  @@index([userId, occurredAt])
  @@index([kind, occurredAt])
}

model BuilderStats {
  userId            String   @id
  shipScore         Int      // 7d
  reachScore        Int      // 7d
  consistencyScore  Int      // 7d
  lifetimeXp        Int
  lifetimeTitle     String
  streakDays        Int
  lastShipAt        DateTime?
  computedAt        DateTime
}

model BuilderProduct {
  id          String   @id @default(uuid())
  userId      String
  repoFullName String   // 'owner/repo'
  homepageUrl String
  name        String
  isPublic    Boolean  @default(true)
  detectedAt  DateTime @default(now())
  @@unique([userId, repoFullName])
}
```

`EarnProfile` already has `xp`, `level`, `title`, `streak` — those become the lifetime track. New stats live in `BuilderStats`.

---

## Ingest pipeline

| Source | Mechanism | Frequency |
|---|---|---|
| GitHub | Webhook (real-time) + 6h polling fallback | live |
| X | Polling user timeline | every 30 min |
| Product detection | Scan connected GitHub repos for `homepage` field | nightly |

All raw events normalized into `BuilderShip`. Scorer runs on every new event + a nightly recompute for streaks and decay. Results cached in `BuilderStats` so `/earn` reads are O(1).

---

## Out of scope (v1) — parked

- **Bounty/grant gating by reputation** — building the data, using it later
- **$Zo emissions per ship** — flagged for Token team, schema is ready
- **More sources** — npm direct, Vercel, Product Hunt, Farcaster, LinkedIn (auto-detection from GitHub already covers npm/deploys partially)
- **LLM-based X post relevance** — keyword filter is v1; upgrade if noise becomes a problem
- **Founder-facing reputation views** — Founders need this for bounty/grant decisions, but it's a separate UI

---

## Rollout phases

**Phase 1 (this sprint, ~1 week)** — Schema + GitHub OAuth + GitHub ingest + basic scorer + leaderboard read API.
**Phase 2 (~1 week)** — X OAuth + X ingest + keyword filter + product detection + private/public toggle.
**Phase 3 (~3-4 days)** — `/earn/leaderboard` page (top 100, sortable, highlighted self-row, greeting strip) + navbar rank chip on `/earn` + `/earn/profile` page with connect buttons, week panel, last 20 ships, product toggles + post-OAuth `?connected=` return flow with live skeleton fill + public `/earn/builders/[handle]`.
**Phase 4 (polish)** — Decay tuning, streak math, lifetime titles ladder, badges.

---

## Open questions for PM

1. **Title ladder** — what are the lifetime title tiers and the XP thresholds? ("Zo Newbie" → ? → ? → ?)
2. **Anti-gaming** — how aggressive should we be? (e.g., commit-spam detection, X post-spam dampening, weight caps per kind per day)
3. **Privacy default for newly detected products** — public or private by default?
4. **Should the leaderboard show *all* builders or only those who've shipped in the last 7d?** (Affects how "alive" the page feels.)
5. **Top-N cap** — leaderboard shows top 100? top 50? infinite scroll?

---

## Success metrics (how we know it worked)

- **% of /earn visitors who connect at least GitHub** within 30 days of launch
- **Median ships per active builder per week** — is the score actually pulling activity up?
- **Leaderboard churn** — top 10 turnover week-over-week. Healthy churn means it's a real sprint, not a frozen ranking.
- **Repeat visit rate** — do builders come back to check their rank?

---

## Connection to Zo Universe

| Surface | Connects | $Zo touchpoint |
|---|---|---|
| Public leaderboard | Builder ↔ Community | Reputation visible, primes future $Zo emissions |
| Personal dashboard | Builder ↔ Self | Motivation loop |
| Lifetime title | Builder ↔ Zo Universe | Permanent on-graph identity |
| Builder profile | Founder ↔ Builder (v2) | Future: gating bounties / grants |

Every `BuilderShip` is a candidate for $Zo emission. Schema is shaped so the Token team can wire that up later without migrations.
