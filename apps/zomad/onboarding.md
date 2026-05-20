# Zo House Onboarding — VibeCheck First Contact

**Date**: 2026-03-22 (brainstorm) → 2026-03-29 (spec)
**Status**: Spec
**Companion doc**: [PRD.md](PRD.md) — Zomad Agent product requirements

---

## Overview

2,707 existing Zo World users need to be funneled into Zomad (WhatsApp AI agent). The hook is **VibeCheck** — a personalized alignment score delivered as a shareable PNG card. It's the first message Zomad sends to every citizen.

**The pipeline:**

```
VibeCheck card (WhatsApp or email)
  → Citizen replies / clicks through
  → Zomad session opens
  → Ongoing relationship
```

### How Zomad Already Knows You (Pre-Auth)

VibeCheck is computed **before any authentication**. The phone number in our Master Users sheet is the key — Zomad matches it against:

1. **Zostel API** (`GET /api/v1/stay/my/bookings/list/`) — stays, nights, properties visited
2. **Zo API** (`GET /api/v1/profile/me/`) — membership tier, cultures, events hosted
3. **Supabase** — Luma event RSVPs, founder member status, cafe orders

This data already exists for all 2,707 users. No OTP needed to compute the score — Zomad reads from the systems, generates the card, and sends it.

### The Full Funnel (VibeCheck → Conversation → Tune-In → Agent)

```
1. VIBECHECK (pre-auth):
   Phone number → match against Zostel + Zo API + Supabase
   → Compute VibeCheck → generate PNG card
   → Send via WhatsApp template

2. CONVERSATION (pre-auth):
   Citizen replies → Zomad greets by name (already knows them)
   → Natural conversation: events, house info, questions, interests
   → No gates, no friction — Zomad builds rapport

3. SOFT TUNE-IN NUDGE — "Tune in to unlock your vibe":
   Zomad picks a natural moment based on the conversation:
   → "I can pull that up — tune in to unlock your vibe and I'll handle it"
   → "btw, tune in to unlock your vibe — doors, cafe, bookings, everything"
   → Frames auth as ascending deeper into Zo World, not passing a checkpoint

4. FULL AGENT MODE (post-auth):
   Single OTP → dual tokens (Zostel + Zo API)
   → Unlock doors, book stays, order food, RSVP to events — just ask
```

See [PRD Section 2.3](PRD.md#23-user-context--auth-flow) for the full auth architecture.

## Current User Base

| Tier | Count | Status |
|------|-------|--------|
| T0 Founders | 594 | 61% lapsed, 11% active |
| T3 Stay Guests | 573 | |
| T4 Citizens | 1,540 | |

**Reachability:** 1,180 full (phone + email), 1,102 email-only, 420 wallet-only

**Sources:** Zostel WATI push, Luma RSVPs, direct bookings — no unified onboarding exists today.

---

## VibeCheck — The Hook

Instead of "subscribe to updates", each citizen gets a personalized **VibeCheck card** showing their alignment percentage with Zo World. It gives before it asks — the citizen feels recognized, then the CTA lands.

**Framing:** "Your Zo Transmission Report — how aligned are you with your best life?"

### Zo World Philosophy

Zo World is a **parallel reality where everyone is living their best life**. Zo Houses are physical portals into this reality. Every interaction — attending an event, staying a night, building something, hosting — is a **transmission**. Each one aligns you deeper with Zo.

VibeCheck measures this alignment. Not a loyalty program. Not points. A reflection of how deep into Zo World you've gone.

### Vocabulary

| Say this | NOT this |
|----------|---------|
| used the portal | stayed |
| transmissions | interactions/touchpoints |
| alignment | engagement |
| citizens | users |
| portals | properties/Zo Houses |
| frequency | vibe/energy level |
| the node that validates the signal | contributor/host |

---

## VibeCheck Levels

6 levels mapping to the Zo World flywheel: `Discover → Attend → Stay → Commit → Expand`

| Level | % Range | Status | Meaning | Data Signals |
|-------|---------|--------|---------|-------------|
| **1 - Signal Received** | 5-15% | You've tuned in | First contact — applied, found Zo | Has email/phone, zero events, zero stays |
| **2 - First Transmission** | 15-35% | You showed up IRL | Attended events, felt the frequency | event_count > 0, weighted by culture type |
| **3 - Frequency Lock** | 35-55% | You've used the portal | Stayed at Zo House, experienced the life | stay_count > 0, total_nights, repeat visits |
| **4 - Validator** | 55-75% | You validate the signal | Hosting events, building, contributing | founder/member, events hosted, GitHub, co-hosting |
| **5 - Almost There** | 75-90% | You're very close | Accelerator, residency, deep alignment | accelerator_joined, residency commitment |
| **6 - Portal Opener** | 90-100% | You ARE Zo World | Opening a Zo House — you are the portal | Franchise, new Zo House IP |

### Philosophy

- Nobody hits 100% — always room to level up
- VibeCheck gives before it asks — citizen sees their data, feels recognized, THEN the CTA
- Aspirational, not transactional
- The card is shareable — viral loop when citizens post on socials

---

## Event Culture Weighting

A 13-culture keyword classifier (`scripts/luma-to-zo-migrate.py`) categorizes events. The `founder_profiles` table stores a `cultures` JSON field per user.

**13 Cultures:** games, music-entertainment, tv-cinema, food, business, science-technology, health-fitness, design, literature, sports, travel-adventure, spirituality, photography, follow-your-heart

**Weighting:**

| Culture Group | Examples | VibeCheck Signal | Points/Event |
|---------------|----------|-----------------|-------------|
| Builder | business, science-technology | Strongest — Level 4+ | 5 pts |
| Creator | design, literature, health-fitness | Level 3 | 3 pts |
| Social | food, music-entertainment, games | Level 2-3 | 3 pts |
| Explorer | travel-adventure, sports | Level 2-3 | 3 pts |

**Bonus:** Attending a mix of builder + social events = well-rounded citizen multiplier.

A citizen's culture mix tells their story:
- 5 business + 3 games = "Builder who hangs" (high alignment)
- 10 games + 0 business = "Social regular" (mid alignment)
- 1 music event total = "One-timer" (low alignment)

### Validator Signals

What "building and contributing" means concretely (measurable now):

1. **Builder events attended** — hackathons, demo days, workshops, pitch nights
2. **GitHub contributions** — ZoHouse org (19 repos)
3. **Event co-hosting** — Luma co-host data
4. **Staff/team** — @zo.xyz email holders
5. **Long-term stayers** — 30+ nights = building from inside the portal

---

## VibeCheck Card

- **Format:** PNG per citizen (shareable on socials = viral loop)
- **Web page:** `zo.xyz/u/{zo_pid}` with live profile + form below
- **Shows:** VibeCheck %, level name, key metrics (events, nights, properties), member since, percentile rank
- **Greeting:** Always opens with **"Zo Zo Zo {nickname}!"** — the Zomad signature
- **CTA:** "Keep your profile updated" → form / "Tune in to unlock your vibe" → WhatsApp opt-in
- **Design:** TBD — Zo brand colors, dark mode preferred

---

## Outreach Strategy

### Segments & First Touch

| Segment | Count | Reachability | First Touch |
|---------|-------|-------------|-------------|
| Founders (active) | ~90 | full | WhatsApp template with VibeCheck card |
| Founders (lapsed) | ~504 | mixed | Email with VibeCheck card |
| Stay Guests (active) | ~200 | full | WhatsApp template with VibeCheck card |
| Stay Guests (lapsed) | ~373 | mixed | Email drip with VibeCheck |
| Event Citizens (engaged) | ~385 | email-only mostly | Email with VibeCheck card |
| Event Citizens (one-timer) | ~1,155 | email-only | Single email with VibeCheck card |

### Progressive Journey

```
Has phone? ──YES──→ WhatsApp template (VibeCheck card + "Subscribe")
    │                    │
    NO                   ↓
    │              Reply YES → Zomad session opens ✓
    ↓
Email (VibeCheck card + form link)
    │
    ↓
Form (captures phone + preferences)
    │
    ↓
Phone captured → WhatsApp opt-in template
    │
    ↓
Zomad session opens ✓
```

### Spam Protection

- Never cold-message via WhatsApp — only opted-in citizens get proactive messages
- Wallet-only users (420) skipped for now
- Email-only segments get email first, WhatsApp only after phone capture

---

## Data Enrichment (completed 2026-03-22)

- 174 phone numbers fixed (added "+")
- 194 reachability labels upgraded (email_only → full)
- 39 twitter handles cleaned
- 572 total_nights populated from PMS checkout data
- 17 duplicate groups merged (24 rows cleared)
- Fake phone "123456789" removed

---

## Open Items

1. **Card visual design** — aesthetic direction, dark mode, Zo brand treatment
2. **Email infrastructure** — MoEngage API not working, need alternative (Resend? Postmark?)
3. **Form hosting** — zo.xyz subpage or standalone landing page
4. **Luma co-host data** — need to pull from API for Validator signal enrichment