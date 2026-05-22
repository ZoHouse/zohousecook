# Zomad Agent — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-28
**Status:** Draft
**Author:** Samurai × Claude
**Audience:** Zo World Engineering & Product Team

---

## 1. What is Zomad Agent?

Zomad is a WhatsApp-native AI agent that serves as a citizen's single interface to all of Zo World — from first discovery to active residency to alumni re-engagement.

### The Problem

Zo World has 600k+ users across Zostel properties, 6 audience types, 50+ touchpoints (per the ZoHouses Touchpoint Map), and no unified conversational layer. Citizens bounce between apps, websites, forms, and Telegram groups. Staff handle repetitive questions manually. The Touchpoint Map calls for MoEngage + WhatsApp automation flows — but templated drip campaigns don't match Zo's culture.

### The Solution

One WhatsApp number. Citizens message it for anything — booking a trip, unlocking their door, hosting an event, checking their $Zo balance, or asking "what's happening at BLRxZo tonight?" The agent knows who you are, where you are in your journey, and what you need next.

### Not a Chatbot

Chatbots follow scripts. Zomad is an agent — it reasons, takes actions (books rooms, unlocks doors, fires API calls), maintains memory across conversations, and adapts to context. It replaces MoEngage as the engagement engine: every lifecycle touchpoint that would have been a templated drip sequence becomes a conversation instead.

**Concrete example of agent reasoning:** A citizen says "I want to extend my stay by 2 nights." A chatbot would say "please visit zostel.com to modify your booking." Zomad checks the current booking end date, queries availability for the extension dates, verifies the same room type is still available, calculates the price delta, and replies: "I can extend your stay at BLRxZo through April 5th — same Bored Room, ₹7,000 for 2 more nights. Want me to book it?"

---

## 2. Identity & Lifecycle Model

The agent operates across two dimensions — **who you are** (identity) and **where you are in your journey** (lifecycle stage).

### 2.1 Identity (auto-detected from phone number)

| Layer | Who | How detected |
|---|---|---|
| **Explorer** | Anyone who messages | Default — no match in Zo user DB |
| **Citizen** | Has a Zo World account | WhatsApp number matches Zo user DB |
| **Resident** | Currently checked in at a Zo House | Active booking with `checked_in` status at a Zo House property |

Transitions are automatic. An Explorer who books becomes a Citizen. A Citizen who checks in at a Zo House becomes a Resident. A Resident who checks out drops back to Citizen. The agent's greeting, tone, and available actions shift accordingly.

### 2.2 Lifecycle Stage (drives proactive behavior)

From the ZoHouses Touchpoint Map — 5 stages, mapped to what Zomad handles:

| Stage | Agent Role | Example Interactions |
|---|---|---|
| **Aware** | Greeter & guide | "What is Zo House?", share listings, answer pricing, capture phone/email |
| **Applied** | Nurture & follow-up | "Your residency application status", "3 spots left in Cohort 7", waitlist position |
| **Offered** | Conversion closer | "Your cohort offer expires in 48hrs", answer objections, deposit payment link |
| **Converted** | Onboarding concierge | First-7-days guide, lock setup walkthrough, house rules, intro to community, cafe menu |
| **Retained** | Relationship keeper | NPS collection, "refer a friend for priority access", alumni events, renewal nudges |

### 2.3 User Context & Auth Flow

Zomad has **three phases** of relationship with each citizen — recognize, converse, then unlock full agent powers through a soft tune-in nudge.

#### Phase 1: Pre-Auth — Zomad Already Knows You

The phone number from WhatsApp is the key. Before any OTP, Zomad can:

1. **Match identity** — phone number lookup against Zo user DB and Zostel profiles
2. **Read history** — stays, bookings, events attended, membership tier, $Zo balance
3. **Compute VibeCheck** — journey-based alignment score from all available data
4. **Greet by name** — "Zo Zo Zo Priya! You've attended 12 events and stayed 7 nights at BLRxZo."

**Canonical greeting:** Every VibeCheck message and first-contact opens with **"Zo Zo Zo {nickname}!"** — this is the Zomad signature. Not "Hey", not "Hi". Always "Zo Zo Zo".

This powers the VibeCheck first-contact card (see [ONBOARDING.md](ONBOARDING.md)) and lets Zomad have a personalized conversation from message one — no login required.

**Data sources (read-only, server-side lookups):**
- Zostel API: booking history, stays, profile (`GET /api/v1/profile/me/`, `GET /api/v1/stay/my/bookings/list/`)
- Zo API: membership, events, cultures (`GET /api/v1/profile/me/`, `GET /api/v1/bookings/experience/all/inventory/`)
- Supabase: Luma RSVPs, founder member status, cafe history

#### Phase 2: Conversation — Build Rapport

After the citizen replies to their VibeCheck card, Zomad has a natural conversation. Answer questions, share what's happening at the house, talk about events, explore their interests. No gates, no friction.

This phase can last one message or ten — Zomad reads the vibe and waits for a natural moment to nudge.

#### Phase 3: Soft Tune-In Nudge — Unlock Full Agent

Zomad doesn't demand auth. It earns it by showing value first, then softly nudges at a natural moment in the conversation:

**Canonical CTA:** *"Tune in to unlock your vibe"*

**Nudge triggers (conversational, not mechanical):**
- Citizen asks about their booking → "I can pull that up for you — tune in to unlock your vibe and I'll handle it"
- Citizen asks about events → "I can RSVP you right now — just tune in and I've got you"
- After a few messages of good conversation → "btw, tune in to unlock your vibe — I can unlock your door, order food, book stays. Quick OTP, 5 seconds"
- Citizen is at the house → "Want the full portal experience? Tune in and I'm your house concierge — doors, cafe, everything"

**The nudge is contextual, not templated.** Zomad picks the moment based on what the citizen is talking about — it surfaces a capability that requires auth. "Tune in to unlock your vibe" frames auth as ascending deeper into Zo World, not passing a checkpoint.

#### Tune-In Flow (single OTP, dual tokens)

```
Citizen says yes to tune-in nudge
  → Zo API: POST /api/v1/auth/request-otp/mobile/ → OTP sent
  → Citizen replies with 6-digit code
  → Zo API: POST /api/v1/auth/login/mobile/otp/ → Zo bearer token
  → Zostel bridge: POST /api/v1/auth/request-otp/zostel/ → bridge OTP (auto)
  → Zostel API: POST /api/v1/auth/activate/ → Zostel token
  → Both tokens stored in citizen_sessions, auto-refreshed forever
  → "You're in! I can now unlock your door, book stays, order food — just ask."

NEW USER (no phone match):
  → "Welcome to Zo World! Want me to set you up? Quick OTP and you're in."
  → OR: POST /api/v1/auth/login/magic/whatsapp/ → WhatsApp magic link
```

**Sessions are persistent.** Once a citizen tunes in, they stay tuned in to Zomad permanently — tokens are auto-refreshed in the background using refresh tokens. The citizen never needs to OTP again unless they explicitly log out or their refresh token is revoked. This means:

- Citizen messages Zomad 3 weeks later → still authenticated, full agent mode immediately
- Token expires → Zomad auto-refreshes silently, citizen never notices
- Refresh token revoked (security event, password change) → Zomad: "Hey, I need to re-verify you — quick OTP?"

The dual-token architecture is invisible to the citizen — they do one OTP once, the agent handles both sessions forever. See Section 4.5 for full auth architecture.

**The full funnel:**
```
VibeCheck card (pre-auth, Zomad knows you)
  → Citizen replies
  → Conversation (rapport, questions, discovery)
  → Soft nudge ("Tune in to unlock your vibe")
  → OTP (5 seconds)
  → Full agent mode (unlock, book, order, everything)
```

No app download. No separate login page. The phone number IS the identity.

---

## 3. Capability Architecture

### 3.1 Layer 1 — Zo World Network (all 108+ properties, all verticals)

The agent is your travel companion across the full Zo ecosystem — Zostel Hostels, Zostel Homes, Zostel Trips, and Zo Houses.

| Capability | Description | API System | Key Endpoints |
|---|---|---|---|
| **Search properties** | Find stays by city, dates, budget, type | Zostel | `GET /api/v1/stay/operators/`, `GET /api/v1/discover/destinations/` |
| **Check availability** | Real-time room/bed availability | Zostel | `POST /api/v1/stay/availability/` |
| **Check pricing** | Dynamic pricing with coupon support | Zostel | `GET /api/v1/stay/offered/pricing/` |
| **Book a stay** | Create booking via agent API | Zostel | `POST /api/v1/stay/agent/{code}/bookings/` |
| **Apply coupon** | Discount codes on bookings | Zostel | `POST /api/v1/stay/agent/{code}/bookings/apply_coupon/` |
| **View my bookings** | List all upcoming and past bookings | Zostel | `GET /api/v1/stay/my/bookings/list/`, `GET /api/v1/stay/my/bookings/next/` |
| **Cancel booking** | Cancel with policy details | Zostel | `POST /api/v2/stay/bookings/{code}/cancel/`, `GET /api/v2/stay/bookings/{code}/cancellation-details/` |
| **Pay for booking** | Razorpay payment processing | Zostel | `POST /api/v2/payment/process-order/`, `POST /api/v2/payment/payment-response/` |
| **Payment status** | Check payment/order status | Zostel | `GET /api/v2/payment/order-status/` |
| **Book trips & experiences** | Treks, activities, group experiences | Zostel | `POST /api/v1/activity/bookings/`, `GET /api/v1/discover/experiences/` |
| **Discover destinations** | Popular destinations, regional search | Zostel | `GET /api/v1/discover/destinations/popular/`, `POST /api/v1/discover/search/places/` |
| **Browse experiences** | Activities at destinations | Zostel | `GET /api/v1/discover/experience/{code}/`, `GET /api/v1/discover/experience/{code}/activities/` |
| **Login / link account** | OTP or WhatsApp magic link | Zostel + Zo API | `POST /api/v1/auth/login/magic/whatsapp/`, `POST /api/v1/auth/request-otp/mobile/` |
| **My profile** | View and update profile | Zostel + Zo API | `GET /api/v1/profile/me/`, `POST /api/v1/profile/me/` |
| **Wallet & credits** | Check balance, transaction history | Zostel | `GET /api/v1/wallet/{type}/details/`, `GET /api/v1/wallet/{type}/transactions/` |
| **Subscription plans** | View/manage membership tiers | Zostel | `GET /api/v1/subscription/plans/`, `GET /api/v1/subscription/my/plan/` |
| **Submit review** | Post-stay feedback | Zostel | `POST /api/v1/feedback/zobu/review/` |
| **Property reviews** | Read reviews for a property | Zostel | `GET /api/v1/feedback/operator/{code}/reviews/` |
| **Referral** | Get referral info and queue | Zostel | `GET /api/v1/profile/referral/`, `GET /api/v1/profile/referral/queue/` |
| **Blog & content** | Destination guides, travel content | Zostel | `GET /api/v1/blog/posts/`, `GET /api/v1/blog/destination/{slug}/` |
| **Currency conversion** | International pricing | Zostel | `GET /api/v1/stay/currencies/{source}/conversion-rates/{target}/` |
| **Cancellation policy** | Per-operator policies | Zostel | `GET /api/v1/stay/operators/{slug}/cancellation-policy/` |
| **Check-in passcode** | Guest self-check-in | Zostel | `POST /api/v1/stay/guest/passcode/` |
| **Get available rooms** | Agent-specific room list | Zostel | `GET /api/v1/stay/agent/{code}/rooms/` |

### 3.2 Layer 2 — Zo Houses (the portal)

Zo Houses are culty hacker houses where the vibe creates the culture, the culture brews the community, and the community is the ultimate portal to Zo World. The agent unlocks a different mode when you're a Zo House citizen.

| Capability | Description | API System | Key Endpoints |
|---|---|---|---|
| **Check estate access** | Verify user has access to house | Zo API | `GET /api/v1/housekeeping/estates/{code}/access/` |
| **Unlock main door** | Smart lock, geofence-verified | Zo API | `POST /api/v1/housekeeping/estates/{code}/unlock/` |
| **Unlock room** | Specific room/space unlock | Zo API | `POST /api/v1/housekeeping/estates/{code}/unlock-space/` |
| **List accessible rooms** | What spaces can I unlock? | Zo API | `GET /api/v1/housekeeping/estates/{code}/accessible-spaces/` |
| **Poll unlock status** | Check if door actually opened | Zo API | `GET /api/v1/housekeeping/unlocks/{id}/` |
| **Order from cafe** | Cafe Zomad food ordering | Supabase | `INSERT cafe_orders`, `INSERT cafe_order_items` |
| **View cafe menu** | Per-property menus | Supabase | `SELECT cafe_menu_items`, `SELECT cafe_menu_categories` |
| **Check food credits** | Meal plan balance | Supabase | `SELECT food_credit_wallets` |
| **Request housekeeping** | Cleaning, supplies, maintenance | Zo API | `POST /api/v1/cas/housekeeping/tasks/from-template/` |
| **View housekeeping tasks** | Track request status | Zo API | `GET /api/v1/cas/housekeeping/tasks/{operatorId}` |
| **Discover events** | What's happening at the house | Zo API | `GET /api/v1/bookings/experience/all/inventory/?categories=closed-irl,open-irl` |
| **RSVP to events** | Register for house events | Zo API | `POST /api/v1/bookings/experience/bookings/` |
| **Host an event** | Create events at the house | Zo API | `POST /api/v1/cas/events/` + Luma sync via Supabase Edge Functions |
| **Book coworking / studio** | Flo Zone, podcast studio, event spaces | Zo API | `POST /api/v1/cas/utility/bookings/{operatorId}` |
| **$Zo balance** | Token economy balance | Zo API | `GET /api/v1/webthree/ledger/balance/` |
| **$Zo transactions** | Token earning/spending history | Zo API | `GET /api/v1/webthree/ledger/transactions/` |
| **$Zo airdrop summary** | Total tokens earned | Zo API | `GET /api/v1/webthree/token-airdrops/summary/` |
| **VibeCheck** | Journey-based alignment score (0-100%, 6 levels) | Computed from Zostel + Zo API + Supabase data | See Section 9 |
| **Apply for residency** | Cohort application | Zo API | `POST /api/v1/zoworld/membership/applications/` |
| **Franchise inquiry** | Zo House IP for new city | Zo API | `POST /api/v1/zoworld/partnerships/applications/` |
| **House announcements** | Bulletins and updates | Zo API | `GET /api/v1/cas/bulletins/{operatorId}` |
| **Community rituals** | Weekly showcase, demo day, poker night, founder dinners | Knowledge base | Agent awareness of house calendar |
| **Connect wallet** | Web3 wallet for $Zo | Zo API | `POST /api/v1/auth/login/web3/`, `POST /api/v1/auth/user/web3-wallets/` |
| **IoT control** | Lights, ambiance presets | Supabase | IoT device tables, WLED presets (social, focus, party, calm, night, off) |

### 3.3 Layer 3 — Proactive Outreach (agent-initiated)

The agent doesn't just respond — it reaches out based on lifecycle triggers. This replaces MoEngage drip sequences with conversational engagement.

**Zo House properties — full proactive engagement:**

| Trigger | Agent Action | Data Source |
|---|---|---|
| **First contact (any citizen)** | **VibeCheck card — personalized alignment score as PNG + conversation opener** | **Computed from user data across all systems** |
| Booking confirmed | Pre-arrival guide (directions, what to pack, house rules) | Zostel booking webhook |
| Check-in detected | Welcome + lock setup + cafe menu + today's events | CAS visit creation |
| 24hrs before event RSVP'd | Reminder with details | CAS event booking data |
| Cohort offer sent | Follow-up conversation (not template) | Membership application status |
| 7 days post-checkout | NPS collection + referral ask | Booking checkout date |
| 60 days inactive (Citizen) | Re-engagement — what's new, upcoming events | User activity check |
| Waitlist position change | Update with context | Application status |
| $Zo milestone reached | Celebration + next tier info | Web3 ledger |
| Achievement/badge unlocked | Congratulations message | CAS rewards |

**Zostel/Zostel Homes/Trips — reactive only (no transactional duplicates):**

WATI already handles transactional messages (booking confirmations, check-in alerts, payment receipts) for Zostel properties. Zomad does NOT duplicate these. However, Zomad still proactively engages Zostel guests for:

| Trigger | Agent Action |
|---|---|
| Event discovery | "There's a trek leaving from Zostel Manali this weekend" |
| Trip recommendations | Based on past bookings and preferences |
| Referral nudges | "Your friend just booked — you earned credits" |
| Re-engagement | "Haven't traveled in a while — here's what's new" |
| NPS & feedback | Post-stay review requests |
| Subscription upsell | Membership tier benefits |

**The split:**

| | WATI (Zostel existing) | Zomad Agent |
|---|---|---|
| Booking confirmation | Yes | No (knows it, won't duplicate) |
| Check-in/out alerts | Yes | No |
| Payment receipts | Yes | No |
| Relationship & engagement | No | Yes |
| Event discovery | No | Yes |
| Referral & earnings | No | Yes |
| Re-engagement | No | Yes |

### 3.4 Knowledge Base (what the agent KNOWS)

The agent maintains a structured knowledge base covering:

- **All 108+ properties** — locations, amenities, capacity, pricing, photos, ratings, cancellation policies
- **Zo House specifics** — house rules per property, community rituals, space booking info, WiFi passwords
- **Destinations** — popular destinations, regional guides, travel content from blog
- **Events** — current and upcoming events across the network (Luma sync for Zo Houses)
- **Cafe menus** — per-property menus for Zo Houses (Supabase)
- **Zo World culture** — $Zo tokenomics, VibeCheck levels, membership tiers
- **FAQ** — parking, laundry, guest policies, cancellation, payment methods, check-in times
- **Experiences & trips** — available treks, activities, group experiences

---

## 4. Architecture

### 4.1 WhatsApp Infrastructure

**Zomad uses the Meta WhatsApp Business API** — not Baileys (the unofficial WhatsApp Web protocol used by the existing zo-bot for staff operations). For a citizen-facing product at scale, the official Business API is required for:
- Reliability and no ban risk
- Template message support (proactive outreach)
- Business verification and trust badges
- Higher rate limits (80+ messages/second at scale tier)

**Prerequisites:**
- Meta Business verification for Zo World
- WhatsApp Business API account setup (via Meta Cloud API or BSP)
- Template message pre-approval for proactive outreach messages

**WATI coexistence:** Zostel currently uses WATI (a WhatsApp Business API provider) for transactional messages. Zomad has its own **separate WhatsApp number**:
- **WATI number** — continues handling Zostel transactional messages (booking confirmations, check-in alerts, payment receipts)
- **Zomad number** — dedicated number for the conversational agent

Citizens interact with two Zo-branded WhatsApp accounts, each with a distinct purpose: WATI is the "receipt printer," Zomad is the "concierge." The Zomad number should be branded clearly (e.g., "Zomad — Zo World" with the Zo logo as profile picture).

### 4.2 High-Level Flow

```
WhatsApp (citizen)
  → Meta WhatsApp Business API webhook (new Zomad number)
    → Zomad Agent (Python/FastAPI)
      → Identity resolver (phone → Zo user → context layer + lifecycle stage)
      → Conversation memory (per-citizen thread history)
      → LLM reasoning (intent detection + response generation)
      → Tool executor:
          ├── Zostel API (api.zostel.com) — bookings, stays, payments, properties, trips
          ├── Zo API (api.io.zo.xyz) — auth, locks, housekeeping, $Zo, events, CAS
          └── Supabase — cafe, IoT, resident pipeline, Luma sync
      → Response formatter (WhatsApp message types)
    → Meta WhatsApp Business API (reply)
```

### 4.3 Three Backend Systems

| System | Base URL | What It Owns |
|---|---|---|
| **Zostel API** | `api.zostel.com` | Bookings, availability, pricing, check-in/out, payments, properties/operators, destinations, trips/experiences, activities, subscriptions, wallet/credits, user profile (PMS side), reviews, blog, discovery. **Source of truth for all booking/stay data.** |
| **Zo API (CAS)** | `api.io.zo.xyz` | Auth (OTP login), smart locks/access/unlock, housekeeping tasks, $Zo tokens/web3/ledger, CAS events & experience bookings, shadow bookings, membership/partnership applications, cultures, showcases, NFT airdrops, profiles (Zo side), rewards/vibe |
| **Supabase** | `elvaqxadfewcsohrswsi.supabase.co` | Cafe orders/menu/tables, IoT devices (cameras, lights, locks status), resident pipeline leads, Luma event sync (webhooks + scheduled), food credit wallets, founder members |

### 4.4 Pre-Built Agent Endpoints (Zostel)

Zostel backend already has purpose-built WhatsApp agent APIs:

```
POST /api/v1/auth/login/magic/whatsapp/                    → WhatsApp-native login
GET  /api/v1/stay/agent/{api_user_code}/rooms/              → Get rooms for agent display
POST /api/v1/stay/agent/{api_user_code}/bookings/           → Create booking as agent
POST /api/v1/stay/agent/{api_user_code}/bookings/apply_coupon/ → Apply coupon as agent
```

These are first-class agent integration points — Zomad plugs directly into them.

### 4.5 Auth Architecture

Two authentication flows running in parallel:

**Zostel session (for booking operations):**
```
1. Zo API: POST /api/v1/auth/request-otp/zostel/ → bridge OTP
2. Zostel API: POST /api/v1/auth/activate/ → Zostel token
3. Store token with expiry, auto-refresh
```

**Zo API session (for CAS operations — locks, housekeeping, $Zo):**
```
1. POST /api/v1/auth/request-otp/mobile/ → send OTP
2. POST /api/v1/auth/login/mobile/otp/ → Zo bearer token
3. Token stored, auto-refresh via refresh token
```

**Headers:**
```
Zostel: { authorization: "Bearer {token}", client-app-id: "com.zostel.app.ios", client-user-id: "{device_uuid}" }
Zo API: { Authorization: "Bearer {token}", client-device-id: "{id}", client-device-secret: "{secret}" }
```

### 4.6 Core Components

| Component | Purpose | Tech |
|---|---|---|
| **Webhook receiver** | Ingest WhatsApp messages from Meta Business API | FastAPI (existing zo-bot pattern) |
| **Identity resolver** | Phone number → Zo user lookup → context layer + lifecycle stage | Zostel profile API + Zo API profile |
| **Conversation memory** | Message history, preferences, last actions per citizen | SQLite or Supabase (per-citizen thread) |
| **LLM brain** | Intent detection, reasoning, multi-turn conversation, response generation | Claude API (direct Anthropic SDK) |
| **Tool executor** | Python functions mapped to API endpoints — the agent's hands | Typed tool functions per capability |
| **Knowledge base** | Property info, house rules, FAQs, menus, event calendar | Vector store or structured lookup, refreshed periodically |
| **Outbound scheduler** | Proactive messages based on lifecycle triggers | Cron jobs polling booking/event state, webhook listeners |
| **Response formatter** | Convert LLM output to WhatsApp-native message types | Text, buttons, list messages, media cards |
| **Zostel sync bridge** | Maintain Zostel ↔ CAS shadow booking sync (like ZoWorldmobile does) | Background sync process |

### 4.7 Data Model

Zomad maintains its own state across three schemas:

**Citizen sessions** (per phone number):
```
citizen_sessions:
  phone_number: string (primary key)
  zo_user_id: string (nullable — null for Explorers)
  zo_token: string (Zo API bearer token)
  zo_token_expiry: datetime
  zo_refresh_token: string
  zostel_token: string (Zostel API bearer token)
  zostel_token_expiry: datetime
  identity_layer: enum (explorer, citizen, resident)
  lifecycle_stage: enum (aware, applied, offered, converted, retained)
  active_booking_code: string (nullable)
  active_estate_code: string (nullable — e.g., BNGHO812)
  last_interaction: datetime
  created_at: datetime
```

**Conversation threads** (message history per citizen):
```
conversation_messages:
  id: uuid
  phone_number: string (FK → citizen_sessions)
  role: enum (citizen, agent, system)
  content: text
  message_type: enum (text, button_response, list_response, location, media)
  whatsapp_message_id: string
  tool_calls: json (nullable — API calls the agent made)
  created_at: datetime
```

**Citizen profile cache** (enriched from APIs, refreshed periodically):
```
citizen_profiles:
  phone_number: string (FK → citizen_sessions)
  name: string
  email: string
  membership_tier: enum (citizen, member, founder)
  vibe_score: integer
  zo_balance: decimal
  total_bookings: integer
  last_property_visited: string
  preferences: json (food, room type, etc. — learned from conversations)
  updated_at: datetime
```

**Storage:** Supabase for all three tables (consistent with existing Zo House feature stack). SQLite acceptable for local MVP on zo-pc.

### 4.8 Error Handling & Escalation

**Graceful degradation by system:**

| Failure | Agent Behavior |
|---|---|
| Zostel API down | "Booking service is temporarily unavailable. I'll try again in a few minutes and let you know." Cache last-known property/pricing data. |
| Zo API down | "I can't check your lock access right now. Please try the Zo Club app or contact front desk." |
| Supabase down | "Cafe ordering is temporarily offline. You can order directly at the counter." |
| LLM timeout/error | Fall back to keyword-based intent matching for common actions (unlock, book, menu). Queue for retry. |
| Payment link expired | Detect expired state, auto-generate new payment link: "Your payment link expired — here's a fresh one." |

**Human escalation protocol:**

```
Trigger conditions:
  → Citizen explicitly asks for a human ("talk to someone", "help", "manager")
  → 3+ failed attempts at same action (e.g., unlock fails 3x)
  → Agent confidence below threshold (can't determine intent after 2 clarifying questions)
  → Sensitive topics: complaints, refund disputes, safety concerns

Escalation flow:
  → Agent: "Let me connect you with the team. Someone will respond shortly."
  → Create ticket in CAS comms thread: POST /api/v1/cas/comms/threads/{operatorId}
  → For Zo House: notify staff via internal channels
  → For Zostel: route to existing support team
  → Agent stays in loop — summarizes conversation context for staff
```

**Conversation guardrails:**
- Agent never guesses pricing, availability, or booking status — always calls the API
- If an API response is ambiguous, agent asks the citizen to confirm rather than assuming
- Agent acknowledges when it can't help: "I'm not sure about that. Let me connect you with someone who can help."

### 4.9 Smart Lock Flow (from ZoWorldmobile, adapted for WhatsApp)

The mobile app's lock flow works like this — Zomad replicates it:

```
1. Citizen: "unlock my door"
2. Agent: GET /api/v1/housekeeping/estates/{code}/access/
   → Verify has_access = true (active booking + checked in)
3. Agent: GET /api/v1/housekeeping/estates/{code}/accessible-spaces/
   → List spaces citizen can unlock
4. If multiple spaces: "Which door? [Main entrance] [Room 011]" (WhatsApp buttons)
5. Agent: POST /api/v1/housekeeping/estates/{code}/unlock/
   → For estate door (no body needed if proximity-based)
   → OR POST /unlock-space/ with { space: "<space_uuid>" } for room
6. Poll: GET /api/v1/housekeeping/unlocks/{id}/ every 1s
   → status: "success" → "Door unlocked ✓"
   → status: "failed" → "Couldn't unlock — try again or contact front desk"
```

**Geofence note:** The mobile app verifies proximity client-side (Haversine formula, within `accessible_distance` meters). For WhatsApp, geofence verification must happen server-side or be skipped with alternative verification (e.g., OTP confirmation before unlock).

### 4.10 Booking Flow (via agent endpoints)

```
1. Citizen: "I want to stay at Zostel Manali next weekend"
2. Agent: GET /api/v1/stay/operators/ → find Manali properties
3. Agent: POST /api/v1/stay/availability/ → check dates
4. Agent: GET /api/v1/stay/agent/{code}/rooms/ → available rooms with pricing
5. Present options as WhatsApp list message
6. Citizen picks a room
7. Agent: POST /api/v1/stay/agent/{code}/bookings/ → create booking
8. Agent: POST /api/v2/payment/process-order/ → generate Razorpay link
9. Send payment link via WhatsApp
10. Webhook: POST /api/v2/payment/payment-response/ → confirm
11. Agent: "Booked! Your booking code is {code}. Check-in is at 2pm."
```

### 4.11 Cafe Order Flow (Zo House only)

```
1. Resident: "I want to order food"
2. Agent: SELECT cafe_menu_items + cafe_menu_categories (Supabase) → filtered by property
3. Present menu as WhatsApp list message grouped by category
4. Resident picks items, confirms
5. Agent: INSERT cafe_orders + cafe_order_items (Supabase)
6. Agent: Check food_credit_wallets for balance → offer credit payment or UPI/Razorpay
7. Agent: "Order placed! Kitchen is making your [items]. We'll let you know when it's ready."
8. Supabase realtime subscription → notify when kitchen_status changes
```

---

## 5. Audience Types & Channel Strategy

From the ZoHouses Touchpoint Map — 6 audience types, with Zomad's role for each:

| Audience Type | Scale | Zomad's Role | Primary Channel |
|---|---|---|---|
| **Residency Applicants** | 800+ per cohort | Application nurture → offer → onboarding | WhatsApp (Zomad) |
| **IP Franchise Prospects** | Pipeline TBD | Inquiry → proposal → conversion | WhatsApp (Zomad) + Email |
| **Founder Members (NFT)** | 501 holders | Community engagement, event invites | Telegram (organic) + WhatsApp (Zomad) |
| **Premium Stay Guests** | High volume | Booking support, upsell, post-stay engagement | WhatsApp (Zomad) |
| **Zostel Base** | 600,000 | Re-engagement, discovery, referrals (email-first for cold segments) | Email first → WhatsApp (Zomad) for warm |
| **Event Attendees** | Variable | Event reminders, RSVP, follow-up | WhatsApp (Zomad) |

**Spam protection:** Zomad never cold-messages the 600k Zostel base via WhatsApp. Only citizens who have initiated a conversation or opted in receive proactive messages. Cold re-engagement for T3 passive users goes through email only.

---

## 6. WhatsApp Message Types

Zomad uses the full range of WhatsApp Business API message types:

| Type | Use Case | Example |
|---|---|---|
| **Text** | General conversation, answers, updates | "Your booking at Zostel Goa is confirmed for March 30" |
| **Buttons** (max 3) | Quick actions, confirmations | [Unlock Door] [View Menu] [My Bookings] |
| **List messages** (max 10 sections) | Property search results, menu items, room options | Section: "Zostel Manali" → Row: "6-bed dorm — ₹599/night" |
| **Media (image)** | Property photos, event posters, QR codes | Property hero image with pricing overlay |
| **Media (document)** | Booking confirmation PDF, invoice | Razorpay receipt |
| **Location** | Property directions, nearby recommendations | Pin drop for Zo House Koramangala |
| **Template messages** | Proactive outreach (requires pre-approval) | "Hey {name}, there's a founder dinner at BLRxZo this Friday" |
| **Interactive CTA** | Payment links, deep links | [Pay ₹3,500 →] linking to Razorpay |

**Pagination strategy:** WhatsApp list messages are limited to 10 sections × 10 rows. For results exceeding this (e.g., searching "hostels in India" returns 108+ properties), the agent filters aggressively (by dates, budget, destination) before presenting results. If results still exceed 10, the agent shows the top 10 with a "Show more options" button that loads the next page.

---

## 7. Phased Rollout

### Phase 1 — Foundation (Zo Houses only)

**Focus:** BLRxZo (Koramangala) and WTFxZo (Whitefield) residents and citizens.

**Capabilities:**
- Auth (OTP login via WhatsApp)
- Unlock doors (smart lock integration)
- View bookings (Zostel PMS → shadow CAS)
- Cafe ordering (Supabase menu + orders)
- Room service / housekeeping requests
- House FAQ & knowledge base
- Event listing and RSVP

**Why start here:** Zo Houses have the highest engagement density, the most integrated tech stack (locks, cafe, IoT, events), and the most demanding users who will stress-test the agent and give rapid feedback.

### Phase 2 — Zo World Network

**Expand to:**
- Property search and discovery across all 108+ properties
- Booking creation via agent endpoints
- Payment processing (Razorpay links)
- Trip and experience booking
- Wallet and credits
- Post-stay reviews

### Phase 3 — Lifecycle Engine

**Add:**
- Proactive outreach (pre-arrival, welcome, NPS, re-engagement)
- Residency application nurture
- Franchise inquiry handling
- Referral engine
- Subscription management
- Zostel base re-engagement (warm segments only)

### Phase 4 — Intelligence

**Add:**
- Personalized recommendations (based on booking history, preferences, VibeCheck)
- Multi-language support
- Voice message understanding
- $Zo economy integration (earn tokens through agent interactions)
- Cross-property context (agent remembers your preferences across stays)

---

## 8. API Reference — Complete Endpoint Map

### 8.1 Zostel API (`api.zostel.com`)

#### Authentication
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login/magic/whatsapp/` | WhatsApp magic link login |
| POST | `/api/v1/auth/activate/` | Account activation |
| POST | `/api/v1/auth/request-otp/` | Request OTP |
| POST | `/api/v1/auth/request-otp/mobile/` | Request OTP via SMS |
| POST | `/api/v1/auth/verify-otp/mobile/` | Verify mobile OTP |
| POST | `/api/v1/auth/login/` | Standard login |
| POST | `/api/v1/auth/check/` | Check if account exists |
| POST | `/api/v1/auth/device/register/` | Register device |

#### Agent-Specific (pre-built for WhatsApp bot)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/stay/agent/{api_user_code}/rooms/` | Get rooms for agent |
| POST | `/api/v1/stay/agent/{api_user_code}/bookings/` | Create booking as agent |
| POST | `/api/v1/stay/agent/{api_user_code}/bookings/apply_coupon/` | Apply coupon as agent |

#### Bookings & Stays
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/stay/my/bookings/list/` | My bookings (paginated) |
| GET | `/api/v1/stay/my/bookings/next/` | Next upcoming booking |
| GET | `/api/v1/stay/bookings/{code}/` | Booking details |
| POST | `/api/v1/stay/bookings/` | Create booking (direct) |
| POST | `/api/v2/stay/bookings/{code}/cancel/` | Cancel booking |
| GET | `/api/v2/stay/bookings/{code}/cancellation-details/` | Cancellation policy details |
| POST | `/api/v1/stay/bookings/apply_coupon/` | Apply coupon |
| GET | `/api/v1/stay/checkin/{code}/` | Check-in status |
| POST | `/api/v1/stay/guest/passcode/` | Guest self-check-in passcode |

#### Availability & Pricing
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/stay/availability/` | Check availability + pricing |
| GET | `/api/v1/stay/offered/pricing/` | Offered pricing |
| GET | `/api/v1/stay/offered/rooms/` | Offered rooms |
| GET | `/api/v1/stay/offered/availability/` | Offered availability |
| GET | `/api/v1/stay/region/availability/` | Regional availability |

#### Properties & Destinations
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/stay/operators/` | List all properties |
| GET | `/api/v1/stay/operators/{slug}/` | Property details |
| GET | `/api/v1/stay/operators/{slug}/cancellation-policy/` | Cancellation policy |
| GET | `/api/v1/stay/operators/tag/{tag}/` | Properties by tag |
| GET | `/api/v1/stay/tags/` | All tags |
| GET | `/api/v1/stay/currencies/` | Supported currencies |
| GET | `/api/v1/stay/currencies/{source}/conversion-rates/{target}/` | Exchange rate |

#### Discovery & Content
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/discover/home/` | Home page content |
| GET | `/api/v1/discover/explore/` | Explore content |
| GET | `/api/v1/discover/destinations/` | List destinations |
| GET | `/api/v1/discover/destinations/popular/` | Popular destinations |
| GET | `/api/v1/discover/destinations/{slug}/` | Destination details |
| POST | `/api/v1/discover/search/places/` | Search places |
| GET | `/api/v1/discover/experiences/` | List experiences |
| GET | `/api/v1/discover/experience/{code}/` | Experience details |
| GET | `/api/v1/discover/experience/{code}/activities/` | Experience activities |
| GET | `/api/v1/discover/playlists/` | Curated playlists |

#### Activities & Experiences
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/activity/availability/` | Activity availability |
| GET | `/api/v1/activity/pricing/` | Activity pricing |
| POST | `/api/v1/activity/bookings/` | Book activity |
| GET | `/api/v1/activity/bookings/{code}/` | Activity booking details |
| POST | `/api/v1/activity/bookings/apply_coupon/` | Apply coupon to activity |
| GET | `/api/v1/activity/schedule/` | Activity schedule |

#### Payments
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v2/payment/process-order/` | Create payment order |
| POST | `/api/v2/payment/payment-response/` | Payment confirmation |
| GET | `/api/v2/payment/order-status/` | Order status |
| GET | `/api/v2/payment/exchange/currencies/` | Supported currencies |
| GET | `/api/v2/payment/exchange/rate/` | Exchange rate |

#### User Profile
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/profile/me/` | My profile |
| GET | `/api/v1/profile/me/passport/` | Travel passport/history |
| GET | `/api/v1/profile/referral/` | Referral info |
| GET | `/api/v1/profile/referral/queue/` | Referral queue |
| GET | `/api/v1/profile/locations/countries/` | Countries list |

#### Wallet & Credits
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/wallet/{type}/details/` | Wallet balance |
| GET | `/api/v1/wallet/{type}/transactions/` | Transaction history |

#### Subscription
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/subscription/plans/` | Available plans |
| GET | `/api/v1/subscription/my/plan/` | My subscription |
| POST | `/api/v1/subscription/process/` | Process subscription |
| POST | `/api/v1/subscription/my/plan/cancel/` | Cancel subscription |

#### Feedback & Reviews
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/feedback/zobu/review/` | Submit review |
| GET | `/api/v1/feedback/operator/{code}/reviews/` | Property reviews |
| GET | `/api/v1/feedback/operator/{code}/rating/` | Property rating |

#### Blog
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/blog/posts/` | Blog posts |
| GET | `/api/v1/blog/destination/{slug}/` | Destination blogs |

#### WhatsApp Integration (existing)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/whatsapp/incoming/message/{token}/` | Incoming message webhook |
| POST | `/api/v1/whatsapp/send/message/context/` | Send contextual message |

#### Leads
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/supply/leads/{group_slug}/` | Create lead |
| GET | `/api/v1/supply/lead/{group_slug}/mine/` | My leads |

### 8.2 Zo API (`api.io.zo.xyz`)

#### Authentication
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/request-otp/mobile/` | Request OTP |
| POST | `/api/v1/auth/login/mobile/otp/` | Login with OTP |
| POST | `/api/v1/auth/request-otp/zostel/` | Bridge OTP for Zostel session |
| POST | `/api/v1/auth/login/web3/` | Web3 wallet login |
| POST | `/api/v1/auth/user/web3-wallets/` | Manage wallets |
| POST | `/api/v1/auth/user/merge/` | Merge accounts |

#### Smart Locks & Access
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/housekeeping/estates/{code}/access/` | Check estate access (has_access, location, distance) |
| POST | `/api/v1/housekeeping/estates/{code}/unlock/` | Unlock estate main door |
| POST | `/api/v1/housekeeping/estates/{code}/unlock-space/` | Unlock specific room |
| GET | `/api/v1/housekeeping/estates/{code}/accessible-spaces/` | List unlockable spaces |
| GET | `/api/v1/housekeeping/unlocks/{id}/` | Poll unlock status |

#### Housekeeping
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/cas/housekeeping/tasks/{operatorId}` | List tasks |
| POST | `/api/v1/cas/housekeeping/tasks/from-template/` | Create task from template |
| GET | `/api/v1/cas/housekeeping/tasks/templates/{operatorId}` | Available templates |
| GET | `/api/v1/cas/housekeeping/tasks/schedules/{operatorId}` | Task schedules |

#### Events & Experiences (CAS)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/bookings/experience/all/inventory/` | List events (by category) |
| POST | `/api/v1/bookings/experience/bookings/` | Create event booking / RSVP |
| GET | `/api/v1/bookings/experience/availability/{id}` | Event availability |
| GET | `/api/v1/bookings/experience/pricing/{id}` | Event pricing |
| POST | `/api/v1/cas/events/` | Create event |
| GET | `/api/v1/cas/calendar-events/{operatorId}` | Calendar events |

#### $Zo Tokens & Web3
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/webthree/ledger/balance/` | $Zo balance |
| GET | `/api/v1/webthree/ledger/transactions/` | Transaction history |
| GET | `/api/v1/webthree/token-airdrops/summary/` | Total earned |

#### Bookings (CAS shadow)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/cas/stay/bookings/` | Create shadow booking (Zostel → CAS sync) |
| GET | `/api/v1/cas/stay/bookings/{operatorId}` | List CAS bookings |

#### Profile
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/profile/me/` | Zo profile |
| POST | `/api/v1/profile/me/` | Update profile |
| GET | `/api/v1/cas/cultures/?limit=50` | Culture list |

#### Membership & Partnerships
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/zoworld/membership/applications/` | Residency application |
| POST | `/api/v1/zoworld/partnerships/applications/` | Franchise inquiry |

#### Rewards & Vibe
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/cas/rewards/vibe-curators/` | Vibe Score data |

#### Bulletins & Comms
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/cas/bulletins/{operatorId}` | House announcements |
| GET | `/api/v1/cas/comms/threads/{operatorId}` | Communication threads |

#### Utility Bookings
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/cas/utility/bookings/{operatorId}` | Book coworking/studio/event space |

### 8.3 Supabase (`elvaqxadfewcsohrswsi.supabase.co`)

#### Cafe Zomad
| Operation | Table | Purpose |
|---|---|---|
| SELECT | `cafe_menu_items` | Menu items |
| SELECT | `cafe_menu_categories` | Menu categories |
| SELECT | `cafe_tables` | Table setup per property |
| INSERT | `cafe_orders` | Create order |
| INSERT | `cafe_order_items` | Order line items |
| SELECT | `cafe_orders` (realtime) | Track order status |
| SELECT | `food_credit_wallets` | Food credit balance |
| SELECT | `food_credit_transactions` | Credit history |

#### IoT
| Operation | Table | Purpose |
|---|---|---|
| SELECT | IoT device tables | Device status (cameras, lights, locks) |
| UPDATE | WLED preset tables | Set light presets (social, focus, party, calm, night, off) |

#### Luma Event Sync
| Operation | Table/Function | Purpose |
|---|---|---|
| SELECT | `luma_inventory_map` | Luma → CAS event mapping (3400+ records) |
| Edge Function | `luma-webhook` | Luma event → CAS booking sync |
| Edge Function | `zo-to-luma-sync` | CAS → Luma push sync |

#### Residents Pipeline
| Operation | Table | Purpose |
|---|---|---|
| SELECT | `pipeline_leads` | Residency application status |

---

## 9. VibeCheck & $Zo Economy

### VibeCheck — First Contact Mechanism

VibeCheck is the first message Zomad sends to every citizen. It's a journey-based alignment score (0-100%) that reflects how deep into Zo World someone has gone. Delivered as a shareable PNG card via WhatsApp template message.

**VibeCheck is NOT the Zo API Vibe Score** (0-1000, 7 protocol domains). That's an internal system. VibeCheck is a citizen-facing, journey-based score computed from user data across Zostel bookings, Zo API profile, and Supabase event/stay history.

**6 Levels:**

| Level | VibeCheck % | Zo World Status | Meaning |
|---|---|---|---|
| **1 - Signal Received** | 5-15% | You've tuned in | First contact — applied, found Zo |
| **2 - First Transmission** | 15-35% | You showed up IRL | Attended events, felt the frequency |
| **3 - Frequency Lock** | 35-55% | You've used the portal | Stayed at Zo House, experienced the life |
| **4 - Validator** | 55-75% | You're the node that validates the signal | Hosting events, building, contributing to the network |
| **5 - Almost There** | 75-90% | You're very close | Accelerator, residency, deep alignment |
| **6 - Portal Opener** | 90-100% | You ARE Zo World | Opening a Zo House — you are the portal now |

**Data signals per level:**
- Level 1: Has email/phone, zero events, zero stays
- Level 2: event_count > 0, weighted by culture type (builder events > social events)
- Level 3: stay_count > 0, total_nights, repeat visits
- Level 4: founder/member, events hosted, GitHub contributions, co-hosting
- Level 5: accelerator joined, residency, deep commitment signals
- Level 6: Opening a Zo House, franchise partnership

**First-contact flow:**
```
1. Zomad computes VibeCheck from user data (Zostel stays, Zo API profile, Supabase events)
2. Generates personalized PNG card (VibeCheck %, level name, key metrics, percentile rank)
3. Sends WhatsApp template message with card: "Your Zo Transmission Report"
4. User replies → 24-hour session window opens → Zomad is live as their agent
5. CTA: "Keep your profile updated" / "Get personalized updates" → full opt-in
```

**Philosophy:**
- Nobody hits 100% — always room to level up
- VibeCheck gives before it asks — user sees their data, feels recognized, THEN the CTA
- Aspirational, not transactional
- The card is shareable (viral loop — citizens post their VibeCheck on socials)

### $Zo Token Actions (27 tracked)

| Tier | Actions | Value |
|---|---|---|
| **Tier 1** (highest) | Check-in, unlock room, host event, kitchen duty | GPS-verified, highest $Zo |
| **Tier 2** | Host/join audio rooms, create content, votes | Location-weighted |
| **Tier 3** | Book stay, book experience, complete task | Standard |
| **Tier 4** | Profile completion, identity verification, wallet connect | One-time |

Zomad can surface $Zo context alongside VibeCheck: "Your VibeCheck is 62% — you're a Validator. You've earned 245 $Zo so far. Attending tonight's poker night would boost your Frequency Lock score."

---

## 10. Technical Constraints & Considerations

### WhatsApp Business API Limits
- **Template messages** (proactive/outbound): Require pre-approval from Meta, 24-hour window for session messages after user interaction
- **Session messages** (reactive): Free-form within 24 hours of last user message
- **Rate limits**: Vary by business tier (typically 80 messages/second at scale)
- **Message types**: Text, image, document, location, buttons (max 3), lists (max 10 sections × 10 rows)

### Geofence for Lock Unlock
- Mobile app uses client-side Haversine formula (within `accessible_distance` meters)
- WhatsApp has no location-sharing requirement — options:
  - a) Request location share before unlock (WhatsApp supports location messages)
  - b) Skip geofence, rely on booking + check-in status as sufficient auth
  - c) OTP confirmation as alternative to proximity check
- **Recommendation:** Option (a) — request location, verify server-side. Falls back to (c) if user declines location share.

### Zostel ↔ CAS Booking Sync
- ZoWorldmobile does this client-side (fetch Zostel bookings → create CAS shadow bookings)
- Zomad should replicate this server-side as a background sync for Zo House residents
- Room mapping table (Zostel room IDs → CAS inventory PIDs) must be maintained
- Without shadow CAS booking, lock access won't work

### Conversation Memory
- WhatsApp conversations are long-lived — citizens may message weeks apart
- Agent needs persistent per-citizen context (last booking, preferences, lifecycle stage)
- Storage: SQLite for MVP, Supabase for scale
- LLM context window: Include last N messages + citizen profile + current booking state

### Multi-Property Context
- Zo Houses have estate codes (BLR = `BNGHO812`, WTF = `BNGS531`)
- Agent must resolve which property a resident is at based on active booking
- Citizens may have bookings across multiple properties — agent handles disambiguation

---

## 11. Success Metrics

| Metric | Target (Phase 1) | How Measured |
|---|---|---|
| **Response time** | < 5 seconds for 90% of messages | WhatsApp message timestamps |
| **Resolution rate** | 80% of queries resolved without staff escalation | Conversation analysis |
| **Door unlocks via agent** | 50%+ of daily unlocks go through Zomad (vs. app) | Unlock API logs |
| **Cafe orders via agent** | 30%+ of Zo House cafe orders | Supabase order source tracking |
| **Booking conversion** | 10%+ of conversations that discuss availability → booking | Booking creation with agent source |
| **NPS improvement** | +5 points vs. pre-Zomad baseline | Post-stay survey |
| **Staff escalation reduction** | 40% fewer front-desk questions | Staff ticket tracking |
| **Monthly active conversations** | 500+ unique citizens/month (Phase 1) | WhatsApp analytics |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **LLM hallucination** (wrong pricing, fake availability) | Guest books non-existent room | All booking/pricing data comes from API calls, never from LLM memory. LLM formats, APIs provide facts. |
| **Lock unlock without proximity** | Security concern | Require location share or OTP before unlock. Log all unlock attempts with immutable audit trail. |
| **WhatsApp template rejection** (Meta review) | Can't send proactive messages | Submit templates early, keep them generic, avoid promotional language in template text |
| **Zostel API downtime** | Can't check availability or book | Graceful degradation: "Booking service is temporarily unavailable. I'll notify you when it's back." Cache property/destination data locally. |
| **Dual-token auth complexity** | Session management bugs | Single auth manager class that handles both Zostel + Zo API tokens, auto-refresh, and error recovery |
| **600k Zostel base spam risk** | WhatsApp account flagged | Never cold-message. Only proactive outreach to opted-in citizens. T3 passive users get email only. |
| **Cafe order errors** | Wrong food delivered | Confirmation step with full order summary before submission. Cancel window of 2 minutes. |

---

## 13. Out of Scope (for now)

- **Voice calls** — WhatsApp voice/video integration
- **Group chat** — Agent in Zo House WhatsApp groups
- **Telegram/Discord bot** — WhatsApp only for Phase 1
- **Staff-facing features** — Zomad is citizen-facing only
- **Payment processing** — Zomad sends Razorpay links, doesn't process payments in-chat
- **Content creation** — No meme generation, social posting, etc.
- **Audio rooms** — WebRTC rooms are app-only (no WhatsApp equivalent)

---

## 14. Glossary

| Term | Definition |
|---|---|
| **Citizen** | Any Zo World user with an account |
| **Resident** | Citizen currently checked in at a Zo House |
| **Explorer** | Non-authenticated WhatsApp user |
| **Estate** | Physical Zo House property (e.g., BLRxZo Koramangala) |
| **Estate code** | Property identifier (e.g., `BNGHO812` for BLR, `BNGS531` for WTF) |
| **CAS** | Core Activity System — Zo's internal platform for locks, housekeeping, events, $Zo |
| **Shadow booking** | CAS copy of a Zostel PMS booking — enables lock access and housekeeping |
| **Operator** | Property in Zostel's system — each has a unique slug and code |
| **WATI** | Zostel's existing WhatsApp Business API tool for transactional messages |
| **Zomad** | The agent. Named after Zo + nomad. |
| **$Zo** | Zo World's token — earned through actions, spent on perks |
| **VibeCheck** | Journey-based alignment score (0-100%, 6 levels) — Zomad's first-contact mechanism. Distinct from the internal Zo API Vibe Score (0-1000). |
| **WATI** | Zostel's existing WhatsApp tool for transactional messages (separate number from Zomad) |

---

*This document is the single source of truth for the Zomad Agent product. All implementation plans, sprint scopes, and technical decisions should reference this PRD.*