# Zomad

WhatsApp-native AI agent for Zo World citizens.

One number. Every property. Every service. Every citizen.

## What is Zomad?

Zomad is a conversational agent that serves as a citizen's single interface to all of Zo World — from discovering properties and booking trips to unlocking doors and ordering from Cafe Zomad. It replaces templated drip campaigns with intelligent, context-aware conversations.

## Capabilities

### Zo World Network (108+ properties)
- Search and book stays across Zostel Hostels, Zostel Homes, and Zo Houses
- Book trips, treks, and experiences
- Check availability and pricing
- Manage bookings, payments, cancellations
- Discover destinations and events

### Zo House Portal (the cult layer)
- Unlock doors via smart locks
- Order from Cafe Zomad
- Request room service and housekeeping
- Host and RSVP to events
- Book coworking spaces, podcast studios, event venues
- Check $Zo balance and VibeCheck (journey-based alignment score)
- Apply for residency cohorts

### VibeCheck — First Contact
Zomad's first message to every citizen is their **VibeCheck card** — a personalized alignment score (0-100%) showing how deep into Zo World they've gone. 6 levels from Signal Received to Portal Opener. Delivered as a shareable PNG. It gives before it asks — the user feels recognized, then the conversation begins.

### Proactive Engagement
- **VibeCheck card** as first-contact opener for all citizens
- Pre-arrival guides for Zo House bookings
- Welcome onboarding on check-in
- Event reminders
- NPS and referral nudges
- Re-engagement for inactive citizens

## Architecture

```
WhatsApp (citizen)
  → Meta WhatsApp Business API
    → Zomad Agent (Python/FastAPI)
      → Zostel API (api.zostel.com) — bookings, stays, payments, properties
      → Zo API (api.io.zo.xyz) — auth, locks, housekeeping, $Zo, events
      → Supabase — cafe, IoT, Luma event sync
```

### Identity Model

| Layer | Who | Capabilities |
|---|---|---|
| **Explorer** | Anyone who messages | Discovery, search, booking, FAQs |
| **Citizen** | Has Zo account | + bookings, events, $Zo, referrals |
| **Resident** | Checked in at Zo House | + door unlock, cafe, housekeeping, IoT |

### Lifecycle Stages

Aware → Applied → Offered → Converted → Retained

## Tech Stack

- **Runtime:** Python / FastAPI
- **LLM:** Claude API (Anthropic)
- **WhatsApp:** Meta Business API
- **Backends:** Zostel API, Zo API (CAS), Supabase
- **Auth:** ZoPassport SDK (OTP via WhatsApp)

## Docs

- [PRD](PRD.md) — Full product requirements document
- [Onboarding](ONBOARDING.md) — VibeCheck first-contact and user onboarding spec

## Phased Rollout

1. **Phase 1** — Zo Houses (BLRxZo, WTFxZo): auth, locks, cafe, housekeeping, events, FAQ
2. **Phase 2** — Zo World Network: property search, bookings, payments, trips
3. **Phase 3** — Lifecycle Engine: proactive outreach, nurture flows, referrals
4. **Phase 4** — Intelligence: personalization, multi-language, voice, $Zo earning