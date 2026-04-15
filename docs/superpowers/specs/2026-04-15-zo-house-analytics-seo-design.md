---
date: 2026-04-15
status: Draft (awaiting spec review + Samurai approval)
author: Samurai × Claude
audience: Zo House Eng (Sai), Performance Marketing (Boldrin's team), MoEngage Ops (Fang), BD (Boldrin)
related-projects:
  - apps/house (zo.house standalone marketing app, github.com/ZoHouse/zohousecook, branch feat/zo-house-standalone, PR #8)
  - Zomad Agent (zohouse/zomad/PRD.md — Sai owns)
  - MoEngage Basic plan (Fang owns workspace)
---

# Zo House — Analytics, SEO, and Founder-Funnel Conversion

## 1. Purpose

Make `zo.house` the default landing page in India for hacker house / founder residency / Network School alternative search intent, and capture every interested founder as an OTP-verified contact in MoEngage so they can be nurtured to apply.

This document specifies the analytics, SEO, identity, attribution, and lifecycle architecture layered on top of the existing `apps/house` marketing app. It does not change the existing apply form schema, the `pipeline_leads` mapping, or the 3D Village UX. Page tracking, page expansion (cluster pages), and conversion plumbing are layered in.

## 2. Goals and Non-Goals

### Goals

- **G1.** Within 90 days, rank top-3 on Google India for at least 4 of: `hacker house bangalore`, `hacker house koramangala`, `founder residency india`, `network school alternative india`, `founder coliving india`, `builder residency bangalore`.
- **G2.** Capture every interested founder as an OTP-verified MoEngage contact, even those who do not submit the apply form. The conversion event is `otp_verified` (not `apply_submitted`).
- **G3.** Wire end-to-end attribution so we can see which keyword, channel, ad creative, and on-page interaction predicts a converting founder. Optimization must be data-driven, not guesswork.
- **G4.** Survive Instagram in-app browser cookie blocking and iOS14 ITP via server-side conversion forwarding (Meta Conversions API).
- **G5.** Lay the foundation for behavior-triggered nurture in MoEngage by Day 30 once 4 weeks of PostHog data exist.

### Non-goals

- Not building paid ad infrastructure (Google Ads, TikTok ads). Meta Ads only for v1.
- Not redesigning the existing 3D Village or hero copy. The "Civilisation Is Recruiting" anchor stays.
- Not changing the `pipeline_leads` schema or apply form fields.
- Not adding Sentry. Error tracking is a separate concern.
- Not changing zo.house's domain or hosting (stays on Vercel project `zo-house`).

## 3. Funnel Definition

The funnel spine. Every event maps to one of these stages, and the conversion event is exactly one stage.

```
1. land            → page_view {url, referrer, utm_*, search_keyword?}
2. engage          → village_slot_click | zo_radio_play | scroll_milestone | vs_ns_section_view
3. capture_intent  → cta_click {placement, intent: apply | waitlist}
4. otp_request     → otp_requested {channel: apply | waitlist, phone_country_code}
5. otp_verify      → otp_verified {channel}                         ← CONVERSION
6. enrich          → apply_submit_success | waitlist_only           ← post-conversion
7. nurture         → MoEngage email/push + Zomad WhatsApp conversation
8. activate        → applied_user_clicked_back | sales_replied (manual at first)
```

**Why `otp_verified` is the conversion event:** The phone number is the lead. Once verified and in MoEngage with valid phone + segment, the founder is recoverable through email, push, and (once Zomad is live) WhatsApp conversation. The apply form is enrichment — useful, not the conversion. Treating `apply_submitted` as conversion would write off ~50% of qualified intent that bails on the form's eight fields.

## 4. SEO Architecture

### 4.1 URL map (hub + 7 cluster pages)

Cluster pages converge on the same OTP modal as the hero. Each pre-fills `referral_source` so MoEngage segments and apply-form analytics can attribute downstream conversions to the originating SEO intent.

| URL | Primary keyword | Role | OTP CTA priority |
|---|---|---|---|
| `zo.house` | "Zo House" (brand) | Mythic hero, brand anchor, lit Village | Apply, Waitlist secondary |
| `zo.house/hacker-house` | hacker house | Generic head term, manifesto framing | Apply, Waitlist secondary |
| `zo.house/hacker-house-bangalore` | hacker house bangalore + Koramangala/Whitefield | Local SEO winner (low competition in India) | Apply, Waitlist secondary |
| `zo.house/network-school-alternative` | network school alternative + network school india | Sentiment-wave converter | Waitlist primary, Apply secondary |
| `zo.house/vs-network-school` | vs network school + comparison-stage queries | **Viral SEO weapon** — controversial comparison | Waitlist primary |
| `zo.house/founder-residency` | founder residency india + builder residency | Antler/EF gap capture | Apply, Waitlist secondary |
| `zo.house/founder-coliving` | founder coliving india + coliving for founders | Comparison-stage searchers | Apply, Waitlist secondary |
| `zo.house/post-accelerator` | after YC + after Antler + after Entrepreneurs First | Post-program founder void | Apply primary |

Each subpage is ~500-800 words bespoke copy with the primary keyword in H1, in two H2s, and naturally in body. Each embeds the Village component (proof the residence is real). Each links internally to 2-3 sibling cluster pages to circulate link equity around the hub.

### 4.2 Robots, sitemap, structured data

- `pages/api/robots.ts` returns `robots.txt`. Vercel does not serve `apps/house/public/` because `outputDirectory=dist/apps/house/.next`, so a serverless route is required.
- `pages/sitemap.xml.tsx` returns the sitemap dynamically, listing all 8 URLs with `lastmod` from build time.
- Submit sitemap to Google Search Console and Bing Webmaster Tools on launch.

JSON-LD on every page (`<script type="application/ld+json">`):

- `Organization` — Zo House, founded year, social links, logo on cdn.zo.xyz.
- `LocalBusiness` × 2 — BLRxZo (Koramangala address with lat/lng, opening hours), WTFxZo (Whitefield address with lat/lng). Critical for Google Maps Pack on "hacker house bangalore" queries.
- `FAQPage` on cluster pages where Q&A copy exists.
- `BreadcrumbList` on every subpage.

### 4.3 Canonical strategy

- Each URL is its own canonical (no duplicate canonicalization).
- `MetaTags` component currently makes `canonical` an optional prop and never passes it. Change: always emit `<link rel="canonical" href={absoluteUrl}>`.
- `www.zo.house` is already 308 → apex.
- Trailing slashes: enforce no trailing slash (Next.js default), redirect `/foo/` → `/foo` server-side.

### 4.4 Per-page meta defaults

The `MetaTags` component is upgraded so each page passes a unique `title`, `description`, and (where applicable) `image`. Defaults stay as fallback. Example for `/vs-network-school`:

```tsx
<MetaTags
  title="Zo House vs Network School: Why founders pick Bangalore over Forest City"
  description="Cost, location, safety, community, crypto requirements, and visa friction — a founder's comparison of Zo House (Bangalore) and Network School (Malaysia)."
  image="https://cdn.zo.xyz/.../vs-ns-comparison-card.jpg"
  canonical="https://zo.house/vs-network-school"
/>
```

## 5. Analytics Tool Stack

Each tool has one job. No tool does two jobs and no job is owned by two tools.

| Tool | Job | Reader |
|---|---|---|
| Vercel Analytics | Audience: who, where, what device, page views | Samurai (traffic glance) |
| Vercel Speed Insights | Core Web Vitals (LCP, INP, CLS) per page | Perf reviews, Meta Quality Score |
| Google Search Console | Queries Google sees, impressions, CTR, ranking position per URL | Weekly SEO loop (Samurai + Boldrin) |
| GA4 | Source-of-truth pageviews + funnel + Search Console join + future paid attribution | Weekly funnel review |
| PostHog | Session replays + funnel exploration + heatmaps + (later) A/B | Live debugging, conversion drop diagnosis |
| MoEngage Basic | Lead system of record + segments + email + push + in-app | Sales handoff + lifecycle (Fang) |
| Meta Pixel | Client-side conversion + audience seeding | Perf marketer |
| Meta Conversions API (CAPI) | Server-side event forwarding (survives in-app browser cookie blocking + ITP) | — |
| Meta Marketing API | Programmatic audience sync from MoEngage segments | Perf marketer |
| Zomad Agent (when live) | WhatsApp-native AI conversation across Aware → Applied → Offered lifecycle | Sai owns the agent |

**No double-counting.** Every event fires through one wrapper (`lib/analytics.ts`) which fans out to GA4, PostHog, MoEngage, and Meta Pixel. Vercel Analytics auto-tracks page views independently. CAPI fires server-side from `/api/meta/track` matched by `event_id` for dedup.

### 5.1 Install order

Sequential because each layer depends on the prior.

1. Vercel Analytics + Speed Insights — `npm i @vercel/analytics @vercel/speed-insights`, mount in `_app.tsx`.
2. GA4 + Search Console — create properties, add gtag in `_document.tsx`, verify ownership via DNS TXT on `zo.house`.
3. PostHog — `npm i posthog-js`, init in `_app.tsx`, autocapture off (named events only).
4. MoEngage Web SDK — paste snippet in `_document.tsx`, configure App ID + workspace.
5. `lib/analytics.ts` wrapper — single `track(eventName, props)` fans out to GA4 + PostHog + MoEngage.
6. Meta Pixel — paste in `_document.tsx`, init with Pixel ID.
7. Meta CAPI server route — `pages/api/meta/track.ts` forwards conversion events with hashed PII + matching `event_id`.
8. Meta Marketing API — store System User token in Vercel env, build `lib/meta/audiences.ts` for programmatic audience management.
9. Wire all events listed in §6 to `track()`.
10. Build `/api/lifecycle/zomad-handoff` route (calls Zomad intake when Sai delivers the contract — see §11).

## 6. Event Taxonomy

Naming convention: `snake_case`, verb-noun, past tense for completed actions. Every event has a stable name and a defined property set. No ad-hoc property keys.

```
// passive (auto-fire)
page_view                  { url, referrer, utm_source?, utm_medium?, utm_campaign?, utm_content?, utm_term?, search_keyword? }
scroll_milestone           { percent: 25 | 50 | 75 | 100, page_path }

// engagement
village_slot_click         { island: "blr" | "wtf", slot_index: number, occupied: boolean }
zo_radio_play              {}
external_link_click        { destination_url, placement }
vs_ns_section_view         { section_id: string }   // /vs-network-school only, fires on IntersectionObserver

// CTA + capture
cta_click                  { placement: "hero" | "inline" | "sticky" | "empty_slot" | "nav", intent: "apply" | "waitlist" }
// Diagnostic-only — NOT in funnel. Used to detect deeplink opens (no preceding cta_click).
apply_modal_open           { trigger: "cta" | "deeplink" }
waitlist_modal_open        { trigger: "cta" | "sticky" | "deeplink" }

// OTP (the conversion stage)
otp_requested              { channel: "apply" | "waitlist", phone_country_code: string }
otp_verified               { channel: "apply" | "waitlist" }   ← CONVERSION
otp_failed                 { channel, error_code }

// apply form (post-conversion enrichment)
apply_field_focus          { field: string }
apply_field_blur           { field: string, was_filled: boolean }
apply_submit_attempt       {}
apply_submit_success       { role, preferred_property, has_socials: boolean, has_building_text: boolean }
apply_submit_error         { error_code }
```

### 6.1 Event-name mapping to vendor standards

Meta's optimizer needs *Meta-standard* event names. Same firing, two names sent.

| Internal event | Meta standard event | When |
|---|---|---|
| `page_view` | `PageView` | Every page load |
| `cta_click` (intent=apply) | `InitiateCheckout` | Apply CTA tapped |
| `otp_verified` | **`Lead`** | The conversion. Pixel + CAPI both fire with same `event_id`. Meta optimizes against this. |
| `apply_submit_success` | `CompleteRegistration` | Enrichment — informs lookalike training |
| `vs_ns_section_view` | `ViewContent` (content_id=section) | Engagement signal for retargeting |

GA4 and PostHog use the internal event names directly. MoEngage uses internal event names.

### 6.2 Funnel definitions

Defined in GA4 Explore + PostHog Insights:

```
Acquisition → Engagement → Conversion → Enrichment
page_view → cta_click → otp_requested → otp_verified → apply_submit_success
                                      ↘ waitlist_only (no apply_submit within 24h)
```

Modal-open events (`apply_modal_open`, `waitlist_modal_open`) are diagnostic-only — they exist to detect deeplinked opens (no preceding `cta_click`) and are explicitly excluded from this funnel. Building a funnel that includes modal-open will produce inflated drop-off because users go directly from `cta_click` → `otp_requested` once the modal renders.

**Future-looking note:** `vs_ns_section_view` is currently scoped only to `/vs-network-school`. If we later want section-level engagement on other cluster pages, we will introduce a generic `section_view { page_path, section_id }` event rather than per-page variants.

## 7. Identity Model

The same person needs one ID across MoEngage, PostHog, GA4, and Meta. This is the part most teams get wrong; broken identity stitching means broken funnels, no MoEngage ↔ PostHog session-replay join, and Meta cannot dedup Pixel + CAPI.

```
1. First page load
   - Generate anonymous_id = UUIDv4. Store in localStorage as `zo_house_aid`.
   - Init PostHog with this distinct_id.
   - Init MoEngage with this anonymousId.
   - GA4 client_id is its own value; capture as event property so downstream join is possible.
   - Capture fbclid from URL params (Meta click ID), persist as cookie `_fbc` per Meta convention.
   - Capture _fbp cookie (Meta Pixel sets this).

2. otp_verified fires (the conversion moment)
   - Compute phone_hash = SHA256(E.164 phone). Used as the cross-tool identity.
   - PostHog: posthog.identify(phone_hash, { ...traits })
   - MoEngage:
       Moengage.add_unique_user_id(phone_hash)
       Moengage.add_mobile(raw_phone_e164)
       Moengage.add_first_name(...) if known
       Moengage.add_email(...) if known
   - GA4: gtag('config', GA_ID, { user_id: phone_hash })
   - Pixel: fbq('track', 'Lead', { event_id: <UUIDv4> })
   - CAPI: POST /api/meta/track {
       event_name: "Lead",
       event_id: <same UUID>,
       user_data: {
         em: SHA256(email_lowercased) if email,
         ph: SHA256(E.164 phone),
         external_id: phone_hash,
         fbc: _fbc, fbp: _fbp,
         client_ip_address: request.ip,
         client_user_agent: request.userAgent,
       },
       custom_data: { value: 1, currency: "INR", referral_source }
     }
   - All identify calls happen BEFORE the otp_verified event fires, so the event attaches to the identified user.

3. Apply form submitted (Zo profile fetched, member_id known)
   - PostHog: posthog.alias(member_id, phone_hash)
   - MoEngage: Moengage.add_user_attribute("zo_pid", member_id)
   - Enables later joining MoEngage data with pipeline_leads on member_id.
```

### 7.1 PII handling

| Field | MoEngage | pipeline_leads | PostHog | GA4 | Meta CAPI |
|---|---|---|---|---|---|
| Raw phone (E.164) | ✅ | ✅ | ❌ | ❌ | ✅ (hashed) |
| Phone hash (SHA256) | ✅ (as user_id) | — | ✅ (distinct_id) | ✅ (user_id) | ✅ (ph + external_id) |
| Email | ✅ | ✅ | ❌ | ❌ | ✅ (hashed em) |
| Name | ✅ | ✅ | ❌ | ❌ | ❌ |
| Zo PID | ✅ | ✅ | ✅ (alias) | ❌ | ❌ |

Rule: behavior tools (PostHog, GA4) get hashes only. Contact tools (MoEngage, pipeline_leads) get raw values. Meta gets hashes for matching, raw IP/UA for attribution. No raw phone or email is ever sent to PostHog or GA4.

### 7.2 Identity edge cases

| Case | Behavior |
|---|---|
| User logs out | `posthog.reset()` clears distinct_id; MoEngage `Moengage.destroy_session()`; Meta `_fbp/_fbc` retained per Meta's own ad-attribution lifecycle |
| Returning user verifies a different phone (shared device, family number) | Detect via `phone_hash !== current localStorage zo_house_aid_owner_hash`. Call `posthog.reset()` then re-`identify()` with new phone_hash. New PostHog session, new MoEngage user. Old user is not aliased into new (preserves both data streams) |
| Apply form Zo profile fetch returns a `member_id` whose recorded phone differs from the OTP-verified phone | Do NOT `posthog.alias()`. Log warning event `identity_collision { phone_hash, returned_member_phone_hash, member_id }` to PostHog and a daily Slack alert to Sai/Fang. Treat as orphan member_id; flag for sales review |
| Same phone re-verifies in a new browser | New `zo_house_aid` UUID generated, `identify(phone_hash)` resolves to same MoEngage/PostHog user (correct merge) |
| User clears localStorage | New anonymous_id; subsequent OTP re-identifies to existing MoEngage/PostHog user via phone_hash (correct merge) |

## 8. Meta Integration Detail

Meta is the primary acquisition channel — Instagram Ads via the Meta dev platform. The integration must survive Instagram in-app browser cookie blocking, must give the optimizer high-quality `Lead` events, and must enable programmatic audience sync from MoEngage.

### 8.1 Pixel + CAPI dedup

Every conversion event fires twice — once client-side via Pixel (`fbq('track', ...)`) and once server-side via CAPI (`POST .../events`). Both calls carry the same `event_id` (UUIDv4 generated on the client and passed to the server). Meta deduplicates within 48h on `(event_name, event_id, user_data hashes)`.

Why both: Pixel alone loses 30-50% of conversions to in-app browsers and ITP. CAPI alone loses real-time client-side audience signals. Together: full attribution, audience seeding, and optimizer accuracy.

### 8.2 Audience flywheel

Meta does not accept CSV uploads via the Marketing API; instead the integration POSTs hashed user identifiers (em + ph SHA256) to a Custom Audience via the `/{custom_audience_id}/users` endpoint. The MoEngage → Meta sync is a Vercel cron that pulls segment members from MoEngage's Export API, hashes them, and POSTs to the audience.

| Audience purpose | Source | Sync mechanism |
|---|---|---|
| Cold acquisition (top of funnel) | 1% Lookalike India seeded from MoEngage segment "applied + qualified" | Vercel cron (weekly): MoEngage Export API → SHA256 hash em+ph → Meta Marketing API `POST /{audience_id}/users` → Meta builds Lookalike from seed |
| Retargeting (mid funnel) | Pixel/CAPI website visitors: `PageView` in last 14 days AND no `Lead` event | Pixel + CAPI events feed Meta Custom Audience automatically; configured in Meta Ads Manager |
| Re-engagement (bottom funnel) | MoEngage `waitlist_only` segment, age > 7 days | Vercel cron (weekly): MoEngage Export API → SHA256 hash em+ph → Meta Marketing API `POST /{audience_id}/users` (same mechanism as cold) |
| Suppression | MoEngage segment "applied + scheduled call" | Same cron mechanism, pushed to a Suppression audience excluded from every campaign |

**Dependency:** MoEngage Export API access in the Basic plan must be confirmed by Fang in the §10.1 audit. If the Export API is not available on Basic, the cold/re-engagement/suppression syncs cannot run programmatically, and Fang must do manual CSV exports + uploads via Ads Manager UI weekly until the plan is upgraded. Spec ships with this fallback documented but does not assume it.

### 8.3 Page UX hardening for Instagram in-app browser

| Issue | Fix | Owner |
|---|---|---|
| Hero video autoplay flaky on iOS in-app | Static poster image on mobile, click-to-play; video desktop only | Claude |
| OTP SMS auto-fill broken | `<input autocomplete="one-time-code" inputmode="numeric">` on OTP field | Claude |
| LCP > 2.0s on 4G mobile (hurts Meta landing-page experience score + Google CWV — see §8.4) | Pre-render hero text, lazy-load 3D Village below the fold, `next/image` with priority on hero only, video < 500KB or replaced with poster on mobile | Claude |
| "Open in browser" hint for stuck users | Inline link near OTP field if SMS auto-fill fails | Claude |
| Phone country code default | `+91` default, country picker secondary | Claude |
| 48px touch targets minimum | All CTAs, OTP buttons | Claude |

### 8.4 Performance budget

- LCP < 2.0s on 4G mobile.
- INP < 200ms.
- CLS < 0.1.
- Hero image < 200KB. Hero video (desktop only) < 500KB.
- Total JS bundle on first load < 200KB gzip.

These thresholds keep the page comfortably inside Google Core Web Vitals "good" (LCP < 2.5s, INP < 200ms, CLS < 0.1), which feeds Search ranking. Meta's published landing-page-experience signal includes load speed as one factor among many; there is no specific Meta-stated LCP/CPC threshold, but slower pages correlate with lower landing-page experience scores in Meta Quality Ranking. Hitting the budget above means we are safe on both Google ranking and Meta delivery quality.

## 9. UTM and Attribution Convention

```
utm_source     meta | twitter | instagram | linkedin | reddit | hn | direct | search
utm_medium     organic | paid | paid_social | email | push | social | drip | referral
utm_campaign   {{campaign.name}}     ← Meta dynamic param for paid_social
utm_content    {{ad.name}}           ← Meta dynamic param
utm_term       {{adset.name}} | <keyword for paid search>
```

`utm_*` is captured on the first `page_view` and persisted in localStorage as `zo_house_first_touch_*`. If a user converts in a later session, MoEngage attributes the lead to the original first-touch.

`referral_source` on the apply form / `pipeline_leads` is auto-derived from the page slug the user was on when they hit Apply (e.g. `/vs-network-school` → `referral_source = "vs-network-school"`). This is independent of UTM and tells us which cluster page actually drives applies.

## 10. MoEngage Lifecycle

### 10.1 Plan-feature audit (Fang, before integration)

Before integration, Fang confirms which features the Basic plan exposes. Assumed available: Web SDK, custom events + properties, segments, basic flows/journeys, push, email, in-app messaging, webhooks. Assumed NOT available: WhatsApp send (separate Business addon), predictive segments, RFM, AI send-time. Spec is built around the assumed-available list. If a feature is missing, the corresponding nurture step is dropped or moved to Zomad/server-side.

### 10.2 Segments

```
Segment: applied
  Definition: otp_verified AND apply_submit_success within same session
  Updated by: MoEngage event ingestion

Segment: waitlist_only
  Definition: otp_verified AND NOT apply_submit_success within 24h
  Updated by: MoEngage scheduled segmentation
```

### 10.3 Channel split

| Channel | Owner | Purpose |
|---|---|---|
| Email | MoEngage (Fang configures templates + flow) | Day 3 founder spotlight, Day 7 scarcity, Day 2/7 applied |
| Push (web SDK + future PWA) | MoEngage (Fang) | Day 7 scarcity nudge |
| In-app message | MoEngage (Fang) | "Ready to apply?" when waitlist_only user revisits zo.house |
| WhatsApp | **Zomad Agent** (Sai builds, see §11) | Day 0 conversational greeting + ongoing lifecycle conversation |
| SMS | Server-side via Zo API (transactional only) | OTP delivery; v1 fallback for Day 0 confirm if Zomad not yet live |

MoEngage does not own WhatsApp in this design. Zomad is the WhatsApp engagement engine and replaces what would have been a MoEngage WhatsApp drip.

### 10.4 v1 nurture sequences (B-tier — fixed time-based drip)

**`waitlist_only` segment:**

| Day | Channel | Owner | Message intent |
|---|---|---|---|
| 0 instant (T+0s) | SMS via Zo API | Transactional | OTP only (always — same SMS the user is waiting for) |
| 0 (T+90s, only if Zomad not live) | SMS via Zo API (DLT-approved fallback template) | Transactional | One-line "You're on the Zo House waitlist; we'll be in touch soon." Fires only when `ZOMAD_INTAKE_LIVE=false`. Separate DLT template ID from OTP. |
| 0 (T+30s, when Zomad live) | WhatsApp via Zomad | Sai's Zomad agent | Conversational greeting, surface founder testimonials, capture preferences |
| 3 | Email | MoEngage / Fang | Founder spotlight (one resident, photo, what they're building), CTA: Apply |
| 7 | Push + Email | MoEngage / Fang | Scarcity: "3 spots opened this week" |
| 7+ | WhatsApp via Zomad (when live) | Zomad reasoning | Continues conversation contextually based on email engagement signals |
| 14 | Email | MoEngage / Fang | "Want a 15min call?" Calendly link |

**SMS rule:** at most one non-OTP SMS per user. The 90-second-delayed fallback only fires when Zomad is not live; once Zomad is live and the queue drains, the fallback SMS is skipped (the WhatsApp greeting replaces it). DLT template registered separately so Indian carrier compliance is clean.

**`applied` segment:**

| Day | Channel | Owner | Message intent |
|---|---|---|---|
| 0 (T+30s) | WhatsApp via Zomad (or DLT-approved SMS fallback at T+90s when Zomad not live) | Sai / Zomad | "Application received. Team reviews within 48h. Want a walkthrough?" |
| 2 | Email (only if no human reply yet) | MoEngage / Fang | Day-at-Zo-House video |
| 7 | Push + Email | MoEngage / Fang | Calendly "schedule your call" |
| Ongoing | WhatsApp via Zomad (when live) | Zomad reasoning | Status questions, reschedules, objections |

### 10.5 v2 evolution (Day 30, behavior-triggered)

After 4 weeks of PostHog data exists, evolve to behavior-triggered branches:

- `waitlist_only` user revisits site → instant in-app: "Ready to apply?"
- Reads `/vs-network-school` for > 30s → trigger Network-School-anchored email variant.
- Day 3 email unopened → swap to Zomad WhatsApp on Day 7.
- Female founder (self-identified or inferred) → women-founder testimonial drip variant (responding to NS women's safety gap).
- Founder from `post-accelerator` referral → variant emphasizing post-program transition.

v2 is documented but not built in v1. Decision to evolve is data-driven, made on Day 30.

### 10.6 Content artifacts (Fang owns; one-time write)

- 5 email templates (HTML, brand-aligned), one per Day-row in §10.4:
  - `waitlist-day-3-founder-spotlight`
  - `waitlist-day-7-scarcity` (paired with `scarcity-3-spots` push)
  - `waitlist-day-14-call-offer`
  - `applied-day-2-day-at-zh`
  - `applied-day-7-schedule-call` (paired with `schedule-call` push)
- 5 founder spotlight blurbs (rotated in `waitlist-day-3-founder-spotlight`).
- 2 push templates: `scarcity-3-spots` (paired with waitlist Day 7 email), `schedule-call` (paired with applied Day 7 email).
- 1 in-app web message template: `ready-to-apply` (fires when `waitlist_only` user revisits zo.house).

## 11. Zomad Handoff Contract

Zo House requires Zomad to take over WhatsApp the moment a founder verifies OTP on zo.house. Sai owns the Zomad agent. The contract below is what zo.house's `/api/lifecycle/zomad-handoff` route POSTs to Zomad's intake endpoint.

```
POST {ZOMAD_INTAKE_URL}/lifecycle/handoff
Headers:
  Authorization: Bearer <ZOMAD_INTAKE_TOKEN>
  Content-Type: application/json

Body:
{
  phone: "+919XXXXXXXXX",
  full_name: string | null,
  lifecycle_stage: "aware" | "applied",
  source: "zo.house",
  referral_source: "/vs-network-school" | "/founder-residency" | "/" | string,
  utm: { source, medium, campaign, content, term },
  first_touch_at: ISO8601,
  metadata: { otp_channel: "apply" | "waitlist" }
}

Response: 200 { conversation_id: string }
```

**Behavior expected from Zomad on receipt:**

- `aware` stage: WhatsApp greeting within 30 seconds, surface founder testimonials, answer questions, capture lifestyle preferences.
- `applied` stage: WhatsApp confirmation, set 48h human-reply expectation, handle status questions and objections.

**v1 fallback (until Zomad intake is live):** `/api/lifecycle/zomad-handoff` returns 200 immediately and queues the handoff payload to a Supabase table `zomad_handoff_queue` for later replay. Day 0 confirmation is sent as transactional SMS via Zo API (DLT-approved fallback template, see §10.4 SMS rule). When Zomad is live, the queue replays per §11.1.

### 11.1 Queue replay specification

When Sai signals Zomad intake is live, Samurai (or Claude on his behalf) flips Vercel env var `ZOMAD_QUEUE_DRAIN=true` and a Vercel cron starts draining `zomad_handoff_queue`.

| Parameter | Value | Why |
|---|---|---|
| Replay batch size | 20 handoffs per run | Conservative; tunable once Zomad intake throughput is known |
| Replay interval | Every 60s while queue non-empty, otherwise idle | Predictable load on Zomad |
| Idempotency key | `(phone, first_touch_at)` unique constraint on `zomad_handoff_queue` | Prevents double-fire on cron crash mid-batch; replay safe |
| Max-age cutoff: `aware` | 7 days | Cold intent past 7d is not worth re-engaging via WhatsApp; row is marked `expired` instead of replayed |
| Max-age cutoff: `applied` | 30 days | Higher intent justifies longer staleness window |
| Cutover trigger | Sai signals Zomad intake live + tested → Samurai sets `ZOMAD_QUEUE_DRAIN=true` in Vercel | Single human in the loop; reversible if Zomad is unstable |
| Reverse-out | Set `ZOMAD_QUEUE_DRAIN=false` and pause cron; in-flight rows return to queue | Allows pause without losing data |
| Failure handling | Per-row retry: 3 attempts with exponential backoff (1m, 5m, 30m), then mark row `failed` and surface in weekly Fang/Sai review | Bounded retry; no infinite reprocessing |

`zomad_handoff_queue` schema (Supabase migration to be created):
```sql
CREATE TABLE zomad_handoff_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  first_touch_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued', -- queued | sent | expired | failed
  attempts int NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  conversation_id text, -- from Zomad response on success
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone, first_touch_at)
);
CREATE INDEX zomad_handoff_queue_status_created_at ON zomad_handoff_queue (status, created_at);
```

## 12. /vs-network-school — The Viral SEO Weapon

The single most important page after the hero. Designed as a comparison/manifesto hybrid intended to go viral on X India tech twitter and capture the "Network School alternative" search intent.

### 12.1 Structure (~1200 words)

1. Hero: *"Network School wants you to fly to Forest City. Zo House is 12km from where you live."*
2. Big comparison table (12 rows, screenshot-ready for X embed). **Every adversarial row carries a footnote anchor that resolves to a public source in §12.1.1. Samurai writes the body and assembles the source list before launch — no row ships without a citation.**

| | Zo House | Network School | Source |
|---|---|---|---|
| Location | Bangalore (Koramangala + Whitefield) | Forest City, Malaysia | NS public site [1] |
| Distance from real city | 0 | 30+ min, border crossing | NS site + map [1] |
| Cost / month | ₹35-50K | $1,000-2,000 USD + flights | NS pricing page (current as of launch) [2] |
| Crypto required | No | Implicit (community profile) | NS marketing materials [3] |
| Women's safety designed-in | Yes (resident testimonials linked below) | Public concerns raised in resident essays | Public Medium essays [4][5] |
| Local food and culture | Bangalore | Mall food court | Resident essays [4][5] |
| Capital connections | Indian VCs in our network | Crypto-native founder network | NS public pitch [3] |
| Visa / border friction | None for Indians | Visa + frequent border crossing | Public regional info [6] |
| Apply process | Phone OTP, 5 min | Application + non-refundable fee, short payment window | NS apply page (current as of launch) [2] |
| Community age | Mixed, post-accelerator focus | Mostly crypto early-stage | NS public roster + materials [3] |
| Application count | 1,200+ | Not disclosed | — |
| Move-in | This month | Next cohort start | NS schedule page [2] |

#### 12.1.1 Sources block (Samurai writes, link-checked at launch)

Cited URLs go here. Each cited row above resolves to a public, link-checked source. Sources are recorded with `archive.org` snapshot URLs alongside live URLs so claims remain defensible if NS pages change after launch. Examples:
- [1] Network School official site location/about page (live + archive.org snapshot)
- [2] Network School pricing/apply page (live + archive.org snapshot at time of launch)
- [3] Network School founder/community public materials
- [4] Public Medium essay by [author] — quotes anchor only direct statements from the essay
- [5] Public Medium essay by [author] — same rule
- [6] Public visa/border crossing info for Forest City / Johor / Singapore corridor

3. Three founder testimonials — quotes from existing residents on why India over Forest City. Quotes attributed by full name with the resident's permission (recorded in advance).
4. Sticky waitlist CTA at end + sticky bar on scroll.
5. OG card: the comparison table itself, screenshot-formatted (1200×630, perfect for X embeds).
6. Internal link block: "More on what makes Zo House different → /founder-residency, /post-accelerator, /hacker-house-bangalore."

**Pre-launch checklist (Samurai owns):**
- All `[N]` source markers resolve to a real link.
- Every adversarial cell has at least one citation in §12.1.1.
- Pricing/apply rows cite a Network School page snapshot timestamped within 7 days of launch (archive.org).
- All resident testimonials have written/recorded consent on file.
- Legal counsel review (optional but recommended given scale of intended distribution).

### 12.2 Viral launch sequence (Boldrin executes, week 2)

| Day | Action | Owner |
|---|---|---|
| 0 | Page goes live + sitemap submission to Google Search Console | Samurai |
| 1 | Samurai posts X thread — opener pulls hero line, 6-8 tweets quote table rows, last tweet links page | Samurai |
| 2 | IG carousel — table screenshots as slides, link in bio + Reels CTA | Boldrin |
| 3 | LinkedIn long-form — same content, professional framing for India tech audience | Boldrin |
| 4-7 | Perf marketer runs $200 boost on best-performing organic post | Perf marketer |
| Ongoing | Anyone landing `/vs-network-school` enters Meta retargeting audience for 14 days | Auto via Pixel + CAPI |

## 13. Performance, Privacy, Error Handling

### 13.1 Performance budget

See §8.4. Enforced via Vercel Speed Insights weekly review. If LCP > 2.0s on mobile, perf review is escalated immediately.

### 13.2 Privacy

- Google Consent Mode v2 implemented: GA4 + Meta Pixel respect consent flags. **Default consent: granted, with explicit risk acceptance per §16 row 7 (DPDP).** India's DPDP Act 2023 rules are notified; notice + consent for personal data processing is required. We are launching with default-granted consent as a stated business risk. DPDP-compliant consent banner is a Day 30 deliverable, owner: Samurai (also reflected in §15 Day 30 block). Trigger to prioritize earlier: any DPIA-relevant complaint, EU traffic > 5% MAU, DPDP Board enforcement notice, or material legal counsel guidance.
- No PII (raw phone, email, name) sent to GA4 or PostHog. See §7.1.
- MoEngage and Meta CAPI receive PII per their compliance posture (MoEngage stores in workspace; Meta hashes PII before transmission).
- Privacy policy page stub at `/privacy` lists all tools and data uses. Fang and Samurai sign off on copy.

### 13.3 Error handling

- `lib/analytics.ts` `track()` swallows errors per destination (one tool failing does not break others).
- `/api/meta/track` returns 200 even on Meta API failure (don't break the conversion UX); failures logged to Vercel function logs and surfaced weekly.
- `/api/lifecycle/zomad-handoff` returns 200 immediately, queues to Supabase if Zomad endpoint times out > 3s.
- OTP modal failures surface to user with retry button; `otp_failed` event fires with `error_code`.

### 13.4 Testing

- Unit tests for `lib/analytics.ts` track() fan-out (mock each destination).
- Unit tests for identity stitching: anonymous → identify → alias.
- Unit tests for `/api/meta/track` payload shape (hash format, event_id passthrough).
- Manual E2E test on launch: verify a real OTP capture lands in (1) PostHog with phone_hash, (2) MoEngage with raw phone, (3) GA4 funnel, (4) Meta Events Manager (Pixel + CAPI matched). Also verify Search Console picks up sitemap.

## 14. Owners and Handoff Matrix

| Task | Owner | Dependency |
|---|---|---|
| Page integration code (Pixel, CAPI, GA4, PostHog, MoEngage SDK, robots, sitemap, JSON-LD, all 7 cluster pages, /vs-NS, /api/meta/track, /api/lifecycle/zomad-handoff, identity model, Supabase migration for `zomad_handoff_queue`) | Claude | — |
| Meta Pixel ID + System User token for Marketing API + Custom Audience IDs (cold/retarget/re-engage/suppression) | Perf marketer (via Boldrin) | Blocks Meta wiring (Pixel ID needed Day 1; audience IDs needed before §8.2 cron ships) |
| MoEngage Basic plan feature audit (confirms: Web SDK ✓, segments ✓, email ✓, push ✓, in-app web ✓, webhooks ✓, **Export API**) | Fang | **Day 0 deliverable** — blocks spec assumptions (§10.3, §8.2). If any feature missing, document fallback in §16 |
| MoEngage Web SDK App ID + Workspace key | Fang | Day 1 — blocks MoEngage SDK install |
| MoEngage Export API access (or written confirmation it exists in Basic) | Fang | Before Week 2 — blocks §8.2 audience cron; fallback is manual CSV export until plan upgrade |
| Zomad Agent intake endpoint URL + Bearer token + Aware/Applied conversation prompts tuned for zo.house funnel | Sai | Blocks WhatsApp layer (v1 ships email+push without it; queue replays per §11.1 when ready) |
| Transactional SMS DLT-approved templates: OTP (existing) + waitlist-fallback + applied-fallback | Claude (code) + Samurai (DLT registration via Zo API team) | Blocks v1 fallback per §10.4 SMS rule |
| GA4 Measurement ID + Search Console DNS TXT verify | Samurai (zo.xyz DNS) | Blocks GA4 + GSC |
| PostHog project key + session_recording config enabled | Samurai (create new project) | Blocks PostHog session replays |
| MoEngage segments, 5 email templates, 2 push templates, 1 in-app template, 5 founder spotlight blurbs | Fang | Drips can launch a few days after page |
| `/vs-network-school` body + comparison table copy | Samurai | Page launches week 2 |
| 6 cluster page bodies (~500 words each) | Boldrin + Samurai (Claude can draft v0) | Cluster pages launch over weeks 2-3 |
| Meta ad creatives (video walkthrough, founder spotlights, comparison table screenshots) | Perf marketer (via Boldrin) | After tracking verified |
| Meta campaign config (audiences, conversion event = Lead, budgets) | Perf marketer | After tracking verified |
| Verify zo.house in Search Console + submit sitemap | Samurai | Within 24h of launch |
| Weekly SEO loop (review GSC + GA4 weekly) | Samurai + Boldrin | Ongoing |
| Weekly funnel review (PostHog + MoEngage) | Samurai + Fang | Ongoing |

## 15. Phased Rollout

```
Week 1 (this week)
  - Claude ships: full tracking integration (Pixel + CAPI, GA4, PostHog, MoEngage SDK,
    identity model, robots, sitemap, JSON-LD, canonical strategy, MetaTags upgrade)
  - Claude ships: /vs-network-school stub structure (Samurai fills body)
  - Claude ships: /api/lifecycle/zomad-handoff with v1 fallback queue (`zomad_handoff_queue` table + replay cron disabled until §11.1 cutover)
  - Claude + Samurai: register DLT-approved fallback SMS templates with Zo API team (waitlist-fallback, applied-fallback) per §10.4 SMS rule
  - Fang: MoEngage segments + email/push templates v1 (the Day-0 transactional SMS itself is server-side, not MoEngage)
  - Perf marketer: Pixel ID + Meta token + Custom Audience IDs delivered

Week 2
  - Claude ships: 5 remaining cluster pages with stub copy + per-page MetaTags + JSON-LD
  - Samurai + Boldrin: write /vs-network-school body
  - Page goes live + GSC sitemap submitted + viral launch X thread
  - Fang: full 4-touch waitlist drip + 3-touch applied drip live
  - Perf marketer: first cold campaign launches against 1% Lookalike India

Weeks 3-4
  - Samurai + Boldrin: cluster page bodies finalized
  - Perf marketer: retargeting + re-engagement audiences active
  - Weekly SEO + funnel reviews start
  - Sai delivers Zomad intake endpoint; queued WhatsApp handoffs replay

Day 30
  - Review PostHog session replays + funnel data
  - Decide on v2 behavior-triggered nurture upgrade for MoEngage
  - Decide on first PostHog A/B test (probably hero copy or sticky CTA placement)
  - Confirm SEO ranking trajectory; double down on best-performing cluster page
  - Samurai: ship DPDP-compliant consent banner (per §13.2 + §16 row 7)
```

## 16. Open Questions and Risks

| # | Topic | Question / Risk | Mitigation |
|---|---|---|---|
| 1 | MoEngage Basic feature surface | Some assumed features (e.g. webhooks, in-app on web) may not be in Basic | Fang audit before integration; spec drops/migrates affected steps if missing |
| 2 | Zomad availability | Sai's Zomad agent timing not pinned | v1 fallback queue + transactional SMS for Day 0; spec ships without Zomad dependency |
| 3 | Meta in-app browser extreme cases | Some Android in-app browsers strip more aggressively than iOS | CAPI handles attribution; Pixel may still under-fire — accept and monitor |
| 4 | `/vs-network-school` PR / legal risk | Public comparison naming Network School may invite legal pushback | Use only public/cited claims; Samurai writes the body to keep tone defensible |
| 5 | LocalBusiness JSON-LD address accuracy | Map Pack ranking depends on exact NAP consistency with GMB | Cross-check addresses with Google Business Profile listings before deploy |
| 6 | Cluster page content scale | 6 bodies × 500 words = real writing time | Claude drafts v0 in week 2; Samurai + Boldrin polish |
| 7 | DPDP default-granted consent | Launching with consent default = granted, banner deferred | Day 30 banner deliverable per §13.2 (owner: Samurai). Prioritize earlier on any DPIA-relevant complaint, EU traffic > 5% MAU, DPDP Board enforcement notice, or material legal counsel guidance |

## 17. References

- Existing apps/house spec & docs: `apps/house/README.md`
- `MetaTags` component to upgrade: `apps/house/src/components/common/MetaTags.tsx`
- `pipeline_leads` schema: per memory `reference_pipeline_leads_table.md`
- Zomad Agent canonical PRD: `zohouse/zomad/PRD.md` (Sai owns; if not in implementer's workspace, ask Sai for the GitHub URL)
- Earlier Zomad design draft (superseded): `docs/superpowers/specs/2026-03-28-zomad-agent-design.md`
- Memory: `project_zo_house_standalone.md` (Vercel project, branch state, gotchas)
- Memory: `feedback_vercel_public_not_served.md` (why robots/sitemap go through API routes, not public/)
- Vercel project: `zo-house` (`prj_wGOm2k3TZGkXBzwgmR3QRWqfZqhG`)
- Branch: `feat/zo-house-standalone` (PR #8 open)
- Live URL: https://zo.house + https://www.zo.house (308 → apex)
