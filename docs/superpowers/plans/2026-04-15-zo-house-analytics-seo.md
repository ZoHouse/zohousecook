# Zo House Analytics + SEO Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire end-to-end analytics, SEO, identity, and lifecycle plumbing into `apps/house` so zo.house ranks for hacker-house / founder-residency intent in India and captures every interested founder as an OTP-verified MoEngage contact.

**Architecture:** Layered on top of the existing `apps/house` Next.js Pages Router app (no UX redesign). One `lib/analytics.ts` wrapper fans events to GA4 + PostHog + MoEngage + Meta Pixel; a Meta CAPI server route (`/api/meta/track`) duplicates conversions with `event_id` matching for in-app browser survival; a Zomad handoff route (`/api/lifecycle/zomad-handoff`) queues to Supabase until Sai's intake endpoint is live. Hub + 7 SEO cluster pages converge on the same OTP modal with `referral_source` attribution baked in.

**Tech Stack:** Next.js 14.2.1 Pages Router, TypeScript, Tailwind, Supabase (service-role from API routes), Jest for unit tests, Vercel deployment, NX monorepo (target: `apps/house`).

**Spec:** `docs/superpowers/specs/2026-04-15-zo-house-analytics-seo-design.md`

---

## File Structure

### New files

```
apps/house/src/lib/
  analytics/
    track.ts                  # Single track() wrapper, fans to GA4+PostHog+MoEngage+Meta Pixel
    identity.ts               # Anonymous ID, identify(), reset(), edge cases (§7.2)
    hash.ts                   # SHA256 helper for E.164 phone + email
    consent.ts                # Google Consent Mode v2 wrapper
    utm.ts                    # First-touch UTM capture + persistence
    events.ts                 # Typed event names + property contracts (one source of truth)
  meta/
    pixel.ts                  # Client-side fbq wrapper with event_id + standard event mapping
    capi.ts                   # Server-side helper used by /api/meta/track
    audiences.ts              # Marketing API helpers (POST hashed users to Custom Audience)
  seo/
    json-ld.ts                # Organization, LocalBusiness×2, FAQ, BreadcrumbList builders
    sitemap.ts                # URL list + lastmod helper
  zomad/
    handoff.ts                # Zomad intake POST + queue-on-failure helper

apps/house/src/pages/
  hacker-house.tsx
  hacker-house-bangalore.tsx
  network-school-alternative.tsx
  vs-network-school.tsx
  founder-residency.tsx
  founder-coliving.tsx
  post-accelerator.tsx
  privacy.tsx
  sitemap.xml.tsx             # Dynamic sitemap
  api/
    robots.ts                 # robots.txt (Vercel doesn't serve apps/house/public/)
    meta/
      track.ts                # CAPI conversion forwarder
    lifecycle/
      zomad-handoff.ts        # Queue + try Zomad intake
      zomad-replay.ts         # Vercel cron drain (gated by env var)
    sms/
      fallback.ts             # DLT-templated fallback SMS via Zo API

apps/house/src/components/
  seo/
    JsonLd.tsx                # Renders structured data tags
    SeoHead.tsx               # Wraps MetaTags + JSON-LD per page
  cluster/
    ClusterPageLayout.tsx     # Shared layout for all 7 cluster pages
    ClusterHero.tsx
    InternalLinkBlock.tsx
  vs-ns/
    ComparisonTable.tsx
    Footnotes.tsx
    SourcesBlock.tsx

apps/house/src/types/
  analytics.ts                # Event payload types matching spec §6
  identity.ts                 # User identity types

apps/house/src/__tests__/
  lib/
    analytics/
      track.test.ts
      identity.test.ts
      hash.test.ts
      utm.test.ts
    meta/
      pixel.test.ts
      capi.test.ts
    seo/
      json-ld.test.ts
      sitemap.test.ts
    zomad/
      handoff.test.ts
  pages/
    api/
      meta/track.test.ts
      lifecycle/zomad-handoff.test.ts
      lifecycle/zomad-replay.test.ts
      robots.test.ts

supabase/migrations/
  20260415000001_zomad_handoff_queue.sql

docs/superpowers/specs/
  2026-04-15-zo-house-analytics-seo-design.md   # already exists (the spec)
```

### Modified files

```
apps/house/src/pages/_app.tsx            # Init analytics + consent + SDKs
apps/house/src/pages/_document.tsx       # Inline GA4 + Pixel tags
apps/house/src/pages/index.tsx           # Wrap with SeoHead, wire events on village clicks + scrolls
apps/house/src/pages/api/apply.ts        # Fire apply_submit_success on success path
apps/house/src/components/common/MetaTags.tsx   # Always emit canonical + per-page title/description
apps/house/src/components/ApplyModal.tsx        # Wire apply_field_focus/blur, apply_submit_attempt, apply_submit_error
apps/house/src/components/LoginModal.tsx        # Wire otp_requested, otp_verified, otp_failed → triggers Zomad handoff
apps/house/src/components/Village.tsx           # Wire village_slot_click
apps/house/src/hooks/useZoAuth.tsx              # Hook into otp_verified → identify() + Meta Lead + Zomad handoff
package.json (workspace root)            # Add @vercel/analytics @vercel/speed-insights posthog-js
apps/house/jest.config.ts                # Confirm jsdom env for component tests
```

### Environment variables (Vercel)

Already present (do not change): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ID`, `API_BASE_URL`, `MEDIA_BASE_URL`, `NEXT_PUBLIC_ZO_CLIENT_KEY_WEB`.

New (Samurai/Boldrin/Fang/perf marketer provide):
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (Samurai)
- `NEXT_PUBLIC_POSTHOG_KEY` (Samurai)
- `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com` (or eu.i)
- `NEXT_PUBLIC_MOENGAGE_APP_ID` (Fang)
- `NEXT_PUBLIC_MOENGAGE_DATA_CENTER` (Fang — `dc1` | `dc2` | `dc3` | etc.)
- `NEXT_PUBLIC_META_PIXEL_ID` (perf marketer)
- `META_CAPI_ACCESS_TOKEN` (perf marketer)
- `META_DATASET_ID` (perf marketer — same as Pixel ID for most setups)
- `META_TEST_EVENT_CODE` (perf marketer — for verification only, blank in prod)
- `META_AUDIENCE_COLD_LOOKALIKE_SEED_ID` (perf marketer — Custom Audience IDs)
- `META_AUDIENCE_REENGAGEMENT_ID`
- `META_AUDIENCE_SUPPRESSION_ID`
- `META_MARKETING_API_TOKEN` (perf marketer — System User token)
- `MOENGAGE_EXPORT_API_KEY` (Fang — when audited)
- `MOENGAGE_EXPORT_API_HOST` (Fang)
- `ZOMAD_INTAKE_URL` (Sai)
- `ZOMAD_INTAKE_TOKEN` (Sai)
- `ZOMAD_INTAKE_LIVE` = `false` initially, flipped to `true` when Sai signals
- `ZOMAD_QUEUE_DRAIN` = `false` initially, flipped to `true` after cutover
- `ZO_API_SMS_FALLBACK_TEMPLATE_ID_WAITLIST` (DLT-approved)
- `ZO_API_SMS_FALLBACK_TEMPLATE_ID_APPLIED` (DLT-approved)
- `CRON_SECRET` (Vercel cron auth)
- `SLACK_WEBHOOK_IDENTITY_ALERTS` (Sai/Fang daily identity_collision pings)

---

## Chunk 1: Tracking Foundation + Identity Model

This chunk installs Vercel Analytics + Speed Insights, GA4, PostHog, and the MoEngage Web SDK; builds the `lib/analytics/track.ts` fan-out wrapper; implements the identity model (anonymous → identify on `otp_verified` → alias on Zo profile fetch); and wires the first set of engagement events from existing components. Output: every event in §6 of the spec fires to all four tools with consistent identity.

### Task 1.1: Add Vercel Analytics + Speed Insights packages and fix jest config

**Files:**
- Modify: `package.json` (workspace root)
- Modify: `apps/house/jest.config.ts` (currently has `displayName: "dashboard"` — copy-paste bug from another app)

- [ ] **Step 1: Install packages from workspace root and capture peer-dep warnings**

Run: `npm install @vercel/analytics @vercel/speed-insights posthog-js 2>&1 | tee /tmp/zh-install.log`
Expected: packages added; check `/tmp/zh-install.log` for any `peer dep` or `ERESOLVE` warnings. If ERESOLVE blocks, surface to Samurai before proceeding (NX monorepo has 11 apps and React peer-dep collisions are possible).

- [ ] **Step 2: Verify NX picks up the packages and house still builds**

Run: `npx nx build house --skip-nx-cache`
Expected: SUCCESS (or only failures unrelated to these packages).

- [ ] **Step 3: Fix the copy-paste bug in `apps/house/jest.config.ts`**

The current file says `displayName: "dashboard"` and `coverageDirectory: "../../coverage/apps/dashboard"`. Change to:

```ts
/* eslint-disable */
export default {
  displayName: "house",
  preset: "../../jest.preset.js",
  testEnvironment: "jsdom",
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "@nx/react/plugins/jest",
    "^.+\\.[tj]sx?$": ["babel-jest", { presets: ["@nx/next/babel"] }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../coverage/apps/house",
};
```

`testEnvironment: "jsdom"` is set globally (instead of per-file pragmas) so all subsequent tests get a real `window`/`localStorage`. Per-file `@jest-environment jsdom` pragmas in tests are still safe as no-ops.

- [ ] **Step 4: Smoke-test jest can find house tests**

Run: `npx jest --listTests --config apps/house/jest.config.ts 2>&1 | head -20`
Expected: lists at least the existing house test files (or empty if none yet — fine, we add them next).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json apps/house/jest.config.ts
git commit -m "build(house): add analytics packages, fix jest displayName"
```

### Task 1.2: Define event types (single source of truth)

**Files:**
- Create: `apps/house/src/types/analytics.ts`
- Test: `apps/house/src/__tests__/types/analytics-types.test.ts` (compile-time only — TypeScript noop)

- [ ] **Step 1: Create the typed event contract**

Create `apps/house/src/types/analytics.ts`:

```ts
// Internal event names (snake_case, past tense for completed actions).
// Mapping to vendor names happens in lib/meta/pixel.ts (Meta) and
// lib/analytics/track.ts (no rename for GA4/PostHog/MoEngage).

export type EventName =
  | "page_view"
  | "scroll_milestone"
  | "village_slot_click"
  | "zo_radio_play"
  | "external_link_click"
  | "vs_ns_section_view"
  | "cta_click"
  | "apply_modal_open"
  | "waitlist_modal_open"
  | "otp_requested"
  | "otp_verified"
  | "otp_failed"
  | "apply_field_focus"
  | "apply_field_blur"
  | "apply_submit_attempt"
  | "apply_submit_success"
  | "apply_submit_error"
  | "identity_collision";

export type CtaPlacement =
  | "hero"
  | "inline"
  | "sticky"
  | "empty_slot"
  | "nav";

export type CtaIntent = "apply" | "waitlist";

export interface EventProps {
  page_view: {
    url: string;
    referrer: string | null;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    search_keyword?: string;
  };
  scroll_milestone: { percent: 25 | 50 | 75 | 100; page_path: string };
  village_slot_click: {
    island: "blr" | "wtf";
    slot_index: number;
    occupied: boolean;
  };
  zo_radio_play: Record<string, never>;
  external_link_click: { destination_url: string; placement: string };
  vs_ns_section_view: { section_id: string };
  cta_click: { placement: CtaPlacement; intent: CtaIntent };
  apply_modal_open: { trigger: "cta" | "deeplink" };
  waitlist_modal_open: { trigger: "cta" | "sticky" | "deeplink" };
  otp_requested: { channel: CtaIntent; phone_country_code: string };
  otp_verified: { channel: CtaIntent };
  otp_failed: { channel: CtaIntent; error_code: string };
  apply_field_focus: { field: string };
  apply_field_blur: { field: string; was_filled: boolean };
  apply_submit_attempt: Record<string, never>;
  apply_submit_success: {
    role: string;
    preferred_property: string;
    has_socials: boolean;
    has_building_text: boolean;
  };
  apply_submit_error: { error_code: string };
  identity_collision: {
    phone_hash: string;
    returned_member_phone_hash: string;
    member_id: string;
  };
}

export type TrackArg<E extends EventName> = EventProps[E] extends Record<
  string,
  never
>
  ? [E]
  : [E, EventProps[E]];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit -p apps/house/tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/house/src/types/analytics.ts
git commit -m "feat(house): typed event contract"
```

### Task 1.3: SHA256 hash helper

**Files:**
- Create: `apps/house/src/lib/analytics/hash.ts`
- Test: `apps/house/src/__tests__/lib/analytics/hash.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/house/src/__tests__/lib/analytics/hash.test.ts`:

```ts
import { hashE164Phone, hashEmail } from "../../../lib/analytics/hash";

describe("hashE164Phone", () => {
  it("hashes a phone number deterministically", async () => {
    const a = await hashE164Phone("+919876543210");
    const b = await hashE164Phone("+919876543210");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("normalises whitespace before hashing", async () => {
    const a = await hashE164Phone(" +91 98765 43210 ");
    const b = await hashE164Phone("+919876543210");
    expect(a).toBe(b);
  });

  it("throws on non-E.164 input", async () => {
    await expect(hashE164Phone("9876543210")).rejects.toThrow();
  });
});

describe("hashEmail", () => {
  it("lowercases and trims before hashing", async () => {
    const a = await hashEmail(" Foo@BAR.com ");
    const b = await hashEmail("foo@bar.com");
    expect(a).toBe(b);
  });

  it("throws on missing @", async () => {
    await expect(hashEmail("notanemail")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/house/src/__tests__/lib/analytics/hash.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write minimal implementation**

Create `apps/house/src/lib/analytics/hash.ts`:

```ts
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  // Browser Web Crypto + Node 19+ both expose globalThis.crypto.subtle.
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashE164Phone(phone: string): Promise<string> {
  const stripped = phone.replace(/\s+/g, "");
  if (!/^\+\d{8,15}$/.test(stripped)) {
    throw new Error(`hashE164Phone: input is not E.164: ${phone}`);
  }
  return sha256Hex(stripped);
}

export async function hashEmail(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase();
  if (!normalised.includes("@")) {
    throw new Error(`hashEmail: input is not an email: ${email}`);
  }
  return sha256Hex(normalised);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest apps/house/src/__tests__/lib/analytics/hash.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/house/src/lib/analytics/hash.ts apps/house/src/__tests__/lib/analytics/hash.test.ts
git commit -m "feat(house): SHA256 hash helpers for PII"
```

### Task 1.4: First-touch UTM capture

**Files:**
- Create: `apps/house/src/lib/analytics/utm.ts`
- Test: `apps/house/src/__tests__/lib/analytics/utm.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { captureFirstTouch, getFirstTouch } from "../../../lib/analytics/utm";

describe("captureFirstTouch / getFirstTouch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists UTM params from URL on first call", () => {
    captureFirstTouch(
      "https://zo.house/?utm_source=meta&utm_medium=paid_social&utm_campaign=vsns_drop"
    );
    expect(getFirstTouch()).toEqual({
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: "vsns_drop",
    });
  });

  it("does not overwrite first touch on subsequent calls", () => {
    captureFirstTouch("https://zo.house/?utm_source=twitter");
    captureFirstTouch("https://zo.house/?utm_source=email");
    expect(getFirstTouch()?.utm_source).toBe("twitter");
  });

  it("ignores URLs with no UTM params", () => {
    captureFirstTouch("https://zo.house/");
    expect(getFirstTouch()).toBeNull();
  });

  it("captures fbclid into _fbc cookie format", () => {
    captureFirstTouch("https://zo.house/?fbclid=AbCdEf123");
    const fbc = getFirstTouch()?.fbc;
    expect(fbc).toMatch(/^fb\.1\.\d+\.AbCdEf123$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/house/src/__tests__/lib/analytics/utm.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write the implementation**

```ts
const STORAGE_KEY = "zo_house_first_touch";

export interface FirstTouch {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbc?: string;
  captured_at: string;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function captureFirstTouch(href: string): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  const url = new URL(href);
  const params = url.searchParams;
  const captured: FirstTouch = { captured_at: new Date().toISOString() };

  let hasAny = false;
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) {
      captured[k] = v;
      hasAny = true;
    }
  }

  const fbclid = params.get("fbclid");
  if (fbclid) {
    // Meta's documented format is fb.<subdomain_index>.<creation_time_ms>.<fbclid>.
    // subdomain_index = 1 for root domain (zo.house). Use 2 for one-level subdomain
    // if we ever serve the funnel from a subdomain. Currently always root.
    captured.fbc = `fb.1.${Date.now()}.${fbclid}`;
    hasAny = true;
  }

  if (hasAny) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  }
}

// Note: captureFirstTouch is a no-op once first-touch is set. SPA route changes
// after the first hard nav will not overwrite first-touch attribution. This is
// by design — the user's TRUE first touch is the marketing entry point.
// Cluster pages are intended to be entered directly from search/ads, so each
// hard-nav landing captures its own first-touch. If a user lands on `/`
// without UTMs and later navigates to `/vs-network-school?utm_source=x` via
// internal SPA link, the UTM on the internal link is intentionally ignored.

export function getFirstTouch(): FirstTouch | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FirstTouch;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest apps/house/src/__tests__/lib/analytics/utm.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/house/src/lib/analytics/utm.ts apps/house/src/__tests__/lib/analytics/utm.test.ts
git commit -m "feat(house): first-touch UTM + fbclid capture"
```

### Task 1.5: Identity model (anonymous + identify + reset)

**Files:**
- Create: `apps/house/src/lib/analytics/identity.ts`
- Test: `apps/house/src/__tests__/lib/analytics/identity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {
  getOrCreateAnonymousId,
  getCurrentIdentity,
  setIdentity,
  resetIdentity,
  detectPhoneSwitch,
  ANON_KEY,
  IDENTITY_KEY,
} from "../../../lib/analytics/identity";

describe("identity model", () => {
  beforeEach(() => localStorage.clear());

  it("creates a UUID anonymous id on first call and persists it", () => {
    const a = getOrCreateAnonymousId();
    const b = getOrCreateAnonymousId();
    expect(a).toBe(b);
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(localStorage.getItem(ANON_KEY)).toBe(a);
  });

  it("setIdentity stores phone_hash + raw phone + traits", () => {
    setIdentity({
      phone_hash: "abc123",
      phone_e164: "+919876543210",
      email: "x@y.com",
      full_name: "Test",
    });
    expect(getCurrentIdentity()?.phone_hash).toBe("abc123");
    expect(getCurrentIdentity()?.phone_e164).toBe("+919876543210");
  });

  it("resetIdentity clears identity but keeps anonymous id intact for new session", () => {
    const anon = getOrCreateAnonymousId();
    setIdentity({ phone_hash: "abc", phone_e164: "+919876543210" });
    resetIdentity();
    expect(getCurrentIdentity()).toBeNull();
    // After reset the next anonymous id should be NEW (per §7.2 "different phone re-verify")
    const newAnon = getOrCreateAnonymousId();
    expect(newAnon).not.toBe(anon);
  });

  it("detectPhoneSwitch returns true if a different phone_hash is set", () => {
    setIdentity({ phone_hash: "first", phone_e164: "+919000000001" });
    expect(detectPhoneSwitch("first")).toBe(false);
    expect(detectPhoneSwitch("different")).toBe(true);
  });

  it("detectPhoneSwitch returns false when no identity yet", () => {
    expect(detectPhoneSwitch("anything")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/house/src/__tests__/lib/analytics/identity.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write the implementation**

```ts
export const ANON_KEY = "zo_house_aid";
export const IDENTITY_KEY = "zo_house_identity";

export interface Identity {
  phone_hash: string;
  phone_e164: string;
  email?: string;
  full_name?: string;
  zo_pid?: string;
}

function uuidv4(): string {
  // Use crypto.randomUUID where available; fall back for older Safari.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older Safari / environments.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = localStorage.getItem(ANON_KEY);
  if (existing) return existing;
  const id = uuidv4();
  localStorage.setItem(ANON_KEY, id);
  return id;
}

export function getCurrentIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
}

export function setIdentity(identity: Identity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export function resetIdentity(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(IDENTITY_KEY);
  // Per §7.2: returning user verifies a different phone → new anonymous id
  // (otherwise the prior session's events would attach to the new identity).
  localStorage.removeItem(ANON_KEY);
}

export function detectPhoneSwitch(newPhoneHash: string): boolean {
  const current = getCurrentIdentity();
  if (!current) return false;
  return current.phone_hash !== newPhoneHash;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest apps/house/src/__tests__/lib/analytics/identity.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/house/src/lib/analytics/identity.ts apps/house/src/__tests__/lib/analytics/identity.test.ts
git commit -m "feat(house): identity model with phone-switch detection"
```

### Task 1.6: Consent Mode v2 wrapper

The default-granted consent state is set in `_document.tsx` inline (so it runs before any GA4/Pixel SDK loads — Task 1.8). This `consent.ts` wrapper exists to UPDATE consent later (e.g. when the DPDP banner ships in §15 Day 30) and to mirror the same shape the inline script uses. Both code paths call `window.gtag()` (defined inline in `_document.tsx`) so dataLayer entries are consistent — Arguments objects, not literal Arrays.

**Files:**
- Create: `apps/house/src/lib/analytics/consent.ts`
- Test: `apps/house/src/__tests__/lib/analytics/consent.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {
  initConsent,
  updateConsent,
  hasConsent,
  ConsentCategory,
} from "../../../lib/analytics/consent";

describe("consent", () => {
  let gtagCalls: unknown[][];

  beforeEach(() => {
    gtagCalls = [];
    (window as any).gtag = (...args: unknown[]) => gtagCalls.push(args);
  });

  it("initConsent emits default = granted via gtag (per §13.2 launch posture)", () => {
    initConsent();
    expect(gtagCalls[0]).toEqual([
      "consent",
      "default",
      {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        wait_for_update: 500,
      },
    ]);
  });

  it("updateConsent emits an update event via gtag", () => {
    initConsent();
    updateConsent({ analytics_storage: "denied" });
    expect(gtagCalls[1]).toEqual([
      "consent",
      "update",
      { analytics_storage: "denied" },
    ]);
  });

  it("hasConsent reflects the latest state", () => {
    initConsent();
    expect(hasConsent("analytics_storage" as ConsentCategory)).toBe(true);
    updateConsent({ analytics_storage: "denied" });
    expect(hasConsent("analytics_storage" as ConsentCategory)).toBe(false);
  });

  it("no-ops gracefully when gtag is not yet loaded (e.g. GA4 env var missing)", () => {
    delete (window as any).gtag;
    expect(() => initConsent()).not.toThrow();
    expect(hasConsent("analytics_storage" as ConsentCategory)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/house/src/__tests__/lib/analytics/consent.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
export type ConsentCategory =
  | "ad_storage"
  | "analytics_storage"
  | "ad_user_data"
  | "ad_personalization";

export type ConsentValue = "granted" | "denied";

let currentState: Record<ConsentCategory, ConsentValue> = {
  ad_storage: "granted",
  analytics_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
};

function callGtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  // gtag is defined inline in _document.tsx as part of the consent default block,
  // BEFORE GA4 loads. If it's missing (e.g. GA4 env var not set), no-op.
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

export function initConsent(): void {
  // The DEFAULT consent state is also pushed inline in _document.tsx so it
  // applies before SDKs load. This call is here so the in-app state mirror
  // stays in sync and so test environments can drive the wrapper directly.
  callGtag("consent", "default", { ...currentState, wait_for_update: 500 });
}

export function updateConsent(
  partial: Partial<Record<ConsentCategory, ConsentValue>>
): void {
  currentState = { ...currentState, ...partial };
  callGtag("consent", "update", partial);
}

export function hasConsent(category: ConsentCategory): boolean {
  return currentState[category] === "granted";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest apps/house/src/__tests__/lib/analytics/consent.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/house/src/lib/analytics/consent.ts apps/house/src/__tests__/lib/analytics/consent.test.ts
git commit -m "feat(house): consent mode v2 wrapper (default granted)"
```

### Task 1.7: Track wrapper (the fan-out)

**Files:**
- Create: `apps/house/src/lib/analytics/track.ts`
- Test: `apps/house/src/__tests__/lib/analytics/track.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
/**
 * @jest-environment jsdom
 */
import { track, _setDestinationsForTest } from "../../../lib/analytics/track";

describe("track()", () => {
  const ga4 = jest.fn();
  const posthog = jest.fn();
  const moengage = jest.fn();
  const metaPixel = jest.fn();

  beforeEach(() => {
    ga4.mockClear();
    posthog.mockClear();
    moengage.mockClear();
    metaPixel.mockClear();
    _setDestinationsForTest({ ga4, posthog, moengage, metaPixel });
  });

  it("fans out a typed event to all four destinations", () => {
    track("village_slot_click", {
      island: "blr",
      slot_index: 3,
      occupied: true,
    });
    expect(ga4).toHaveBeenCalledWith("village_slot_click", {
      island: "blr",
      slot_index: 3,
      occupied: true,
    });
    expect(posthog).toHaveBeenCalledWith("village_slot_click", expect.any(Object));
    expect(moengage).toHaveBeenCalledWith("village_slot_click", expect.any(Object));
    expect(metaPixel).toHaveBeenCalled();
  });

  it("supports zero-prop events", () => {
    track("zo_radio_play");
    expect(ga4).toHaveBeenCalledWith("zo_radio_play", {});
  });

  it("isolates failures across destinations (one throwing does not break others)", () => {
    ga4.mockImplementation(() => {
      throw new Error("ga4 down");
    });
    expect(() =>
      track("scroll_milestone", { percent: 50, page_path: "/" })
    ).not.toThrow();
    expect(posthog).toHaveBeenCalled();
    expect(moengage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/house/src/__tests__/lib/analytics/track.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
import type { EventName, EventProps, TrackArg } from "../../types/analytics";

export interface Destinations {
  ga4: (event: string, props: Record<string, unknown>) => void;
  posthog: (event: string, props: Record<string, unknown>) => void;
  moengage: (event: string, props: Record<string, unknown>) => void;
  metaPixel: (event: string, props: Record<string, unknown>) => void;
}

let destinations: Destinations = {
  ga4: () => {},
  posthog: () => {},
  moengage: () => {},
  metaPixel: () => {},
};

export function _setDestinationsForTest(d: Destinations): void {
  destinations = d;
}

export function setDestinations(d: Destinations): void {
  destinations = d;
}

function safeCall(
  name: keyof Destinations,
  fn: () => void
): void {
  try {
    fn();
  } catch (err) {
    // Per §13.3: one tool failing must not break others.
    // eslint-disable-next-line no-console
    console.warn(`[analytics] ${name} failed:`, err);
  }
}

export function track<E extends EventName>(...args: TrackArg<E>): void {
  const event = args[0] as E;
  const props = (args[1] ?? {}) as EventProps[E];
  const propsRecord = props as unknown as Record<string, unknown>;

  safeCall("ga4", () => destinations.ga4(event, propsRecord));
  safeCall("posthog", () => destinations.posthog(event, propsRecord));
  safeCall("moengage", () => destinations.moengage(event, propsRecord));
  safeCall("metaPixel", () => destinations.metaPixel(event, propsRecord));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest apps/house/src/__tests__/lib/analytics/track.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/house/src/lib/analytics/track.ts apps/house/src/__tests__/lib/analytics/track.test.ts
git commit -m "feat(house): track() fan-out wrapper with failure isolation"
```

### Task 1.8: Wire real destinations (GA4 + PostHog + MoEngage + Pixel adapters)

**Files:**
- Create: `apps/house/src/lib/analytics/destinations.ts` (no separate test file; covered by integration in Task 1.10)
- Modify: `apps/house/src/pages/_document.tsx` (inject GA4 gtag + Pixel base + MoEngage snippet)
- Modify: `apps/house/src/pages/_app.tsx` (init PostHog + Vercel Analytics + Speed Insights + setDestinations)

- [ ] **Step 1: Add destination adapters with per-tool isolation**

Per spec §13.3, each destination must check its own globals at call time so a missing env var (e.g. PostHog key not yet provided by Samurai) does not silently disable other working destinations. The `init` function is therefore unconditional — it always sets the destinations and lets each adapter no-op gracefully when its global isn't present.

Create `apps/house/src/lib/analytics/destinations.ts`:

```ts
import posthog from "posthog-js";
import { setDestinations } from "./track";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    Moengage?: {
      track_event: (event: string, props: Record<string, unknown>) => void;
      add_unique_user_id: (id: string) => void;
      add_mobile: (mobile: string) => void;
      add_email: (email: string) => void;
      add_first_name: (name: string) => void;
      add_user_attribute: (key: string, value: unknown) => void;
      destroy_session: () => void;
    };
  }
}

const META_STANDARD_EVENT: Record<string, string | undefined> = {
  page_view: "PageView",
  cta_click: undefined, // gated on intent below
  otp_verified: "Lead",
  apply_submit_success: "CompleteRegistration",
  vs_ns_section_view: "ViewContent",
};

export function initDestinations(opts: {
  posthogKey?: string;
  posthogHost?: string;
}): void {
  // PostHog only inits if a key is provided. Other destinations check their own
  // globals at call time (window.gtag, window.fbq, window.Moengage), so missing
  // env vars for one tool never silently disable others.
  if (opts.posthogKey) {
    posthog.init(opts.posthogKey, {
      api_host: opts.posthogHost || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false, // we fire page_view ourselves
      session_recording: { maskAllInputs: true },
    });
  }

  setDestinations({
    ga4: (event, props) => {
      window.gtag?.("event", event, props);
    },
    posthog: (event, props) => {
      // posthog.capture is safe even if init() never ran — it queues internally.
      posthog.capture?.(event, props);
    },
    moengage: (event, props) => {
      window.Moengage?.track_event(event, props);
    },
    metaPixel: (event, props) => {
      const meta = META_STANDARD_EVENT[event];
      if (event === "cta_click" && (props as { intent?: string }).intent === "apply") {
        window.fbq?.("track", "InitiateCheckout", props);
      } else if (meta) {
        window.fbq?.("track", meta, props);
      }
      // Internal event names also fire as custom events for full visibility.
      window.fbq?.("trackCustom", event, props);
    },
  });
}
```

- [ ] **Step 2: Inject GA4 + Pixel + MoEngage tags via `_document.tsx`**

Replace `apps/house/src/pages/_document.tsx`:

```tsx
import { Html, Head, Main, NextScript } from "next/document";

const FAVICON_URL =
  "https://cdn.zo.xyz/gallery/media/images/96402471-9ce9-40f4-9530-e6f36a0beb65_20260414182119.svg";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const MOENGAGE_APP_ID = process.env.NEXT_PUBLIC_MOENGAGE_APP_ID;
const MOENGAGE_DC = process.env.NEXT_PUBLIC_MOENGAGE_DATA_CENTER || "dc1";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href={FAVICON_URL} type="image/svg+xml" />
        <link rel="shortcut icon" href={FAVICON_URL} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={FAVICON_URL} />
        <meta name="theme-color" content="#d4af37" />

        {/* Consent Mode v2 default — must come BEFORE GA4 + Pixel.
           The `function gtag(){...}` declaration becomes window.gtag (script
           tags share global scope), and the GA4 block below uses
           `window.gtag = window.gtag || ...` which short-circuits to preserve
           THIS function. Result: every consent.ts wrapper call also flows
           through the same gtag, so dataLayer entries are consistent. */}
        {(GA4_ID || META_PIXEL_ID) && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent','default',{
  ad_storage:'granted',
  analytics_storage:'granted',
  ad_user_data:'granted',
  ad_personalization:'granted',
  wait_for_update:500
});
              `.trim(),
            }}
          />
        )}

        {/* GA4 */}
        {GA4_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
gtag('js', new Date());
gtag('config', '${GA4_ID}', { send_page_view: false });
                `.trim(),
              }}
            />
          </>
        )}

        {/* Meta Pixel base */}
        {META_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
              `.trim(),
            }}
          />
        )}

        {/* MoEngage Web SDK */}
        {MOENGAGE_APP_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function(i,s,o,g,r,a,m,n){i.moengage_object=r;t={};q=function(f){return function(){
(i.moengage_q=i.moengage_q||[]).push({f:f,a:arguments})}};f=['track_event','add_user_attribute',
'add_first_name','add_last_name','add_email','add_mobile','add_user_name','add_gender',
'add_birthday','destroy_session','add_unique_user_id','update_unique_user_id','moe_events',
'call_web_push','track','location_type_attribute'];h={onsite:["getData","registerCallback"]};
for(k in f){t[f[k]]=q(f[k])}for(k in h)for(l in h[k]){null==t[k]&&(t[k]={}),t[k][h[k][l]]=q(k+"."+h[k][l])}
a=s.createElement(o);m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);
i.moe=i.moe||function(){n=arguments[0];return t};i[r]=t})(window,document,'script',
'https://cdn.moengage.com/webpush/moe_webSdk.min.latest.js','Moengage');
Moengage = moe({app_id: '${MOENGAGE_APP_ID}', debug_logs: 0, cluster: '${MOENGAGE_DC}'});
              `.trim(),
            }}
          />
        )}
      </Head>
      <body style={{ background: "#000" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

- [ ] **Step 3: Init PostHog + Vercel Analytics in `_app.tsx`**

Replace `apps/house/src/pages/_app.tsx`:

```tsx
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ZoAuthProvider } from "../hooks/useZoAuth";
import { initDestinations } from "../lib/analytics/destinations";
import { initConsent } from "../lib/analytics/consent";
import { captureFirstTouch, getFirstTouch } from "../lib/analytics/utm";
import { getOrCreateAnonymousId } from "../lib/analytics/identity";
import { track } from "../lib/analytics/track";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // One-time init.
  useEffect(() => {
    initConsent();

    // initDestinations always runs — each adapter checks its own globals at
    // call time so a missing env var for one tool never disables the others
    // (per spec §13.3 failure isolation).
    initDestinations({
      posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });

    // Anonymous ID generated lazily on first event.
    getOrCreateAnonymousId();

    captureFirstTouch(window.location.href);
  }, []);

  // Fire page_view on every route change AND on first paint.
  useEffect(() => {
    const fire = (url: string) => {
      const ft = getFirstTouch();
      track("page_view", {
        url,
        referrer: document.referrer || null,
        utm_source: ft?.utm_source,
        utm_medium: ft?.utm_medium,
        utm_campaign: ft?.utm_campaign,
        utm_content: ft?.utm_content,
        utm_term: ft?.utm_term,
      });
    };
    fire(window.location.href);
    router.events.on("routeChangeComplete", fire);
    return () => router.events.off("routeChangeComplete", fire);
  }, [router.events]);

  return (
    <ZoAuthProvider>
      <Head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
      <VercelAnalytics />
      <SpeedInsights />
    </ZoAuthProvider>
  );
}
```

- [ ] **Step 4: Verify build still passes**

Run: `npx nx build house --skip-nx-cache`
Expected: SUCCESS (env vars may be empty in CI but the conditional rendering should not throw).

- [ ] **Step 5: Commit**

```bash
git add apps/house/src/lib/analytics/destinations.ts apps/house/src/pages/_document.tsx apps/house/src/pages/_app.tsx
git commit -m "feat(house): wire GA4 + PostHog + MoEngage + Pixel + Vercel Analytics"
```

### Task 1.9: Identity stitching on OTP verification

**Important — actual file layout:** `requestOtp` and `verifyOtp` live in `apps/house/src/components/LoginModal.tsx` (lines 17 and 34). `useZoAuth.tsx` only manages the modal open/close + session callback; it does NOT call the auth API. The identity chain is wired into `LoginModal.tsx`. The `intent` ("apply" | "waitlist") is passed from the modal opener (`showLoginModal({ intent, onSuccess })`) → stored in a ref in `useZoAuth` → passed as a prop to `LoginModal`.

**Files:**
- Create: `apps/house/src/lib/analytics/identify-chain.ts`
- Modify: `apps/house/src/hooks/useZoAuth.tsx` (add `intent` to ShowLoginOptions, pass through to LoginModal)
- Modify: `apps/house/src/components/LoginModal.tsx` (accept `intent` prop, fire `otp_requested`/`otp_verified`/`otp_failed`, call identifyOnOtpVerified before onSuccess)
- Test: `apps/house/src/__tests__/lib/analytics/identity-stitch.test.ts`

- [ ] **Step 1: Add an identify-chain helper**

Create `apps/house/src/lib/analytics/identify-chain.ts`:

```ts
import posthog from "posthog-js";
import {
  setIdentity,
  resetIdentity,
  detectPhoneSwitch,
} from "./identity";
import { hashE164Phone } from "./hash";
import { track } from "./track";

interface IdentifyArgs {
  phone_e164: string;
  email?: string;
  full_name?: string;
}

export async function identifyOnOtpVerified(
  args: IdentifyArgs
): Promise<{ phone_hash: string }> {
  const phone_hash = await hashE164Phone(args.phone_e164);

  // Per §7.2 — different phone re-verify on same device.
  if (detectPhoneSwitch(phone_hash)) {
    posthog.reset?.();
    if (typeof window !== "undefined" && window.Moengage) {
      window.Moengage.destroy_session();
    }
    resetIdentity();
  }

  // PostHog identify.
  posthog.identify?.(phone_hash, {
    ...(args.email ? { email_provided: true } : {}),
  });

  // MoEngage identify.
  if (typeof window !== "undefined" && window.Moengage) {
    window.Moengage.add_unique_user_id(phone_hash);
    window.Moengage.add_mobile(args.phone_e164);
    if (args.email) window.Moengage.add_email(args.email);
    if (args.full_name) window.Moengage.add_first_name(args.full_name);
  }

  // GA4 user_id (read env directly so callers don't have to thread it).
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  if (typeof window !== "undefined" && window.gtag && ga4Id) {
    window.gtag("config", ga4Id, { user_id: phone_hash });
  }

  setIdentity({
    phone_hash,
    phone_e164: args.phone_e164,
    email: args.email,
    full_name: args.full_name,
  });

  return { phone_hash };
}

/**
 * Tag the PostHog person and MoEngage user with their Zo PID after the apply
 * form fetches the Zo profile. Uses `posthog.people.set(...)` (a property tag)
 * rather than `posthog.alias(...)` (which merges two distinct_ids and could
 * silently merge cross-app users if a PostHog person already exists with
 * distinct_id=member_id from another zo.xyz app).
 *
 * Per §7.2 collision rule: if the Zo profile's phone differs from the
 * OTP-verified phone, do NOT tag — fire identity_collision instead.
 */
export async function tagZoProfileIfMatching(
  member_id: string,
  expectedPhoneHash: string,
  returnedPhoneE164?: string
): Promise<void> {
  if (returnedPhoneE164) {
    const returned_member_phone_hash = await hashE164Phone(returnedPhoneE164);
    if (returned_member_phone_hash !== expectedPhoneHash) {
      track("identity_collision", {
        phone_hash: expectedPhoneHash,
        returned_member_phone_hash,
        member_id,
      });
      return;
    }
  }
  posthog.people?.set?.({ zo_pid: member_id });
  if (typeof window !== "undefined" && window.Moengage) {
    window.Moengage.add_user_attribute("zo_pid", member_id);
  }
}
```

- [ ] **Step 2: Write a focused unit test**

Create `apps/house/src/__tests__/lib/analytics/identity-stitch.test.ts`:

```ts
import {
  identifyOnOtpVerified,
  tagZoProfileIfMatching,
} from "../../../lib/analytics/identify-chain";
import { _setDestinationsForTest } from "../../../lib/analytics/track";

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
    people: { set: jest.fn() },
  },
}));

import posthog from "posthog-js";

describe("identify chain", () => {
  beforeEach(() => {
    localStorage.clear();
    (posthog.identify as jest.Mock).mockClear();
    (posthog.reset as jest.Mock).mockClear();
    (posthog.people.set as jest.Mock).mockClear();
    (window as any).Moengage = {
      add_unique_user_id: jest.fn(),
      add_mobile: jest.fn(),
      add_email: jest.fn(),
      add_first_name: jest.fn(),
      add_user_attribute: jest.fn(),
      destroy_session: jest.fn(),
    };
    (window as any).gtag = jest.fn();
    _setDestinationsForTest({
      ga4: jest.fn(),
      posthog: jest.fn(),
      moengage: jest.fn(),
      metaPixel: jest.fn(),
    });
  });

  it("identifies user on OTP verified with phone hash", async () => {
    const { phone_hash } = await identifyOnOtpVerified({
      phone_e164: "+919876543210",
      email: "x@y.com",
      full_name: "Test",
    });
    expect(phone_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(posthog.identify).toHaveBeenCalledWith(phone_hash, expect.any(Object));
    expect((window as any).Moengage.add_unique_user_id).toHaveBeenCalledWith(
      phone_hash
    );
    expect((window as any).Moengage.add_mobile).toHaveBeenCalledWith(
      "+919876543210"
    );
  });

  it("on phone switch, calls posthog.reset() and clears MoEngage session", async () => {
    await identifyOnOtpVerified({ phone_e164: "+919876543210" });
    (posthog.reset as jest.Mock).mockClear();
    (window as any).Moengage.destroy_session.mockClear();

    await identifyOnOtpVerified({ phone_e164: "+919999999999" });
    expect(posthog.reset).toHaveBeenCalled();
    expect((window as any).Moengage.destroy_session).toHaveBeenCalled();
  });

  it("tagZoProfileIfMatching tags when phones match", async () => {
    const { phone_hash } = await identifyOnOtpVerified({
      phone_e164: "+919876543210",
    });
    await tagZoProfileIfMatching("pid_xyz", phone_hash, "+919876543210");
    expect(posthog.people.set).toHaveBeenCalledWith({ zo_pid: "pid_xyz" });
    expect((window as any).Moengage.add_user_attribute).toHaveBeenCalledWith(
      "zo_pid",
      "pid_xyz"
    );
  });

  it("tagZoProfileIfMatching fires identity_collision event when phones differ", async () => {
    const trackSpy = jest.fn();
    _setDestinationsForTest({
      ga4: trackSpy,
      posthog: jest.fn(),
      moengage: jest.fn(),
      metaPixel: jest.fn(),
    });
    const { phone_hash } = await identifyOnOtpVerified({
      phone_e164: "+919876543210",
    });
    await tagZoProfileIfMatching("pid_xyz", phone_hash, "+919999999999");
    expect(posthog.people.set).not.toHaveBeenCalled();
    expect(trackSpy).toHaveBeenCalledWith(
      "identity_collision",
      expect.objectContaining({ member_id: "pid_xyz" })
    );
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest apps/house/src/__tests__/lib/analytics/identity-stitch.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 4: Thread `intent` through `useZoAuth.tsx` → `LoginModal.tsx`**

In `apps/house/src/hooks/useZoAuth.tsx`:

1. Extend `ShowLoginOptions`:
   ```ts
   interface ShowLoginOptions {
     intent?: "apply" | "waitlist"; // default "apply"
     onSuccess?: (session: StoredSession) => void;
   }
   ```
2. Add a ref to capture intent: `const intentRef = useRef<"apply" | "waitlist">("apply");`
3. In `showLoginModal`, set `intentRef.current = opts?.intent ?? "apply";`
4. Pass to LoginModal: `<LoginModal intent={intentRef.current} onClose={...} onSuccess={handleSuccess} />`

- [ ] **Step 5: Wire OTP events + identify chain into `LoginModal.tsx`**

In `apps/house/src/components/LoginModal.tsx`:

1. Add `intent` prop:
   ```tsx
   interface LoginModalProps {
     intent?: "apply" | "waitlist"; // default "apply"
     onClose: () => void;
     onSuccess: (session: StoredSession) => void;
   }
   export function LoginModal({ intent = "apply", onClose, onSuccess }: LoginModalProps) {
   ```
2. Add imports at top:
   ```ts
   import { track } from "../lib/analytics/track";
   import { identifyOnOtpVerified } from "../lib/analytics/identify-chain";
   ```
3. Inside `requestOtp`, immediately before `setLoading(true)` for the API call, fire:
   ```ts
   track("otp_requested", { channel: intent, phone_country_code: countryCode });
   ```
4. Inside `requestOtp`, wrap the `requestMobileOtp` call in try/catch so network errors also emit `otp_failed`:
   ```ts
   let res: { ok: boolean; error?: string };
   try {
     res = await requestMobileOtp(mobile, countryCode);
   } catch (err) {
     setLoading(false);
     track("otp_failed", { channel: intent, error_code: "network" });
     setError("Network error. Try again.");
     return;
   }
   setLoading(false);
   if (res.ok) {
     setStep("otp");
   } else {
     track("otp_failed", { channel: intent, error_code: res.error || "request_failed" });
     setError(res.error || "Could not send OTP");
   }
   ```
   Apply the same pattern to `verifyOtp` (wrap `verifyMobileOtp` in try/catch and fire `otp_failed` with `error_code: "network"` on throw).
5. Inside `verifyOtp`, on success (after `res.ok && res.session` is true, BEFORE `onSuccess(res.session)`). Fire `otp_verified` FIRST so it always emits on successful OTP regardless of identity-write outcome:
   ```ts
   const e164 = `+${countryCode}${mobile}`;
   track("otp_verified", { channel: intent });
   try {
     await identifyOnOtpVerified({ phone_e164: e164 });
   } catch (err) {
     // Identity write should never block login. Log and continue.
     console.warn("identifyOnOtpVerified failed", err);
   }
   onSuccess(res.session);
   ```
6. In the verify failure branch:
   ```ts
   track("otp_failed", { channel: intent, error_code: res.error || "verify_failed" });
   ```

- [ ] **Step 6: Manual smoke test**

Run: `npx nx serve house --port 4205`
Open `http://localhost:4205`, click Apply, complete a real OTP. In the browser console verify:
- `localStorage.zo_house_aid` exists
- `localStorage.zo_house_identity` exists with phone_hash
- Network: PostHog `/i/v0/e/` shows the identify call (if PostHog key is set in `.env.local`)
- Network: `otp_requested`, `otp_verified` fire to all enabled destinations

- [ ] **Step 7: Commit**

```bash
git add apps/house/src/lib/analytics/identify-chain.ts \
        apps/house/src/__tests__/lib/analytics/identity-stitch.test.ts \
        apps/house/src/hooks/useZoAuth.tsx \
        apps/house/src/components/LoginModal.tsx
git commit -m "feat(house): identity stitching + OTP events on verify"
```

### Task 1.10: Wire engagement events from existing components

**Important — actual file layout:**
- `Village.tsx` `PlotData` (line 11) does NOT carry `island` or `slot_index`. We need to extend it.
- Occupied plots currently have NO click handler — only the empty-plot "Claim your slot" button is clickable. `village_slot_click` for `occupied: true` requires adding a click handler. For v1 we scope `village_slot_click` to fire only on empty-plot claim (the conversion-relevant case). Adding occupied-plot interaction is out of scope.
- `onClaim` is currently zero-arg — we need to extend its signature.

**Files:**
- Modify: `apps/house/src/components/Village.tsx` (extend PlotData, change buildPlots, change onClaim signature, fire `village_slot_click` on empty-plot claim)
- Modify: `apps/house/src/pages/index.tsx` (use new `onClaim` signature, add `useScrollMilestones`, wire `cta_click`)
- Create: `apps/house/src/hooks/useScrollMilestones.ts`
- Modify: `apps/house/src/components/helpers/house/ZoRadioPill.tsx` (fire `zo_radio_play`)
- Modify: `apps/house/src/components/ApplyModal.tsx` (fire form events)

- [ ] **Step 1: Extend Village PlotData + buildPlots + onClaim**

In `apps/house/src/components/Village.tsx`:

1. Extend `PlotData` interface (line 11):
   ```ts
   interface PlotData {
     position: [number, number, number];
     resident?: Resident;
     isEmpty?: boolean;
     scale?: number;
     rotation?: number;
     island: "blr" | "wtf";
     slot_index: number;
   }
   ```
2. In `buildPlots`, populate `island` and `slot_index` for both clusters:
   ```ts
   // BLR plot — inside the Array.from callback (around line 38):
   return {
     position: [x, 0, z] as [number, number, number],
     resident,
     isEmpty: !resident,
     scale: (resident ? 0.9 : 0.7) + jitter(i, 3) * 0.3,
     rotation: jitter(i, 4) * 2,
     island: "blr",
     slot_index: i,
   };
   // WTF plot (around line 58) — same pattern with island: "wtf", slot_index: i
   ```
3. Find the component prop signature for the Village (likely `onClaim?: () => void`) and change to:
   ```ts
   onClaim?: (info: { island: "blr" | "wtf"; slot_index: number }) => void;
   ```
4. Find the empty-plot click handler (the "Claim your slot" button). When it fires:
   ```ts
   import { track } from "../lib/analytics/track";

   const handleClaim = (plot: PlotData) => {
     track("village_slot_click", {
       island: plot.island,
       slot_index: plot.slot_index,
       occupied: false,
     });
     onClaim?.({ island: plot.island, slot_index: plot.slot_index });
   };
   ```
5. Update the empty-plot button `onClick` to pass the plot: `onClick={() => handleClaim(plot)}`.

- [ ] **Step 2: Update `index.tsx` to consume the new `onClaim` signature**

In `apps/house/src/pages/index.tsx`, find where `<Village onClaim={...}>` is rendered and update:

```tsx
<Village
  residents={residents}
  onClaim={(info) => {
    // info is now { island, slot_index } — pass through to apply if needed.
    // village_slot_click already fired inside Village.tsx; do NOT also fire
    // cta_click with placement="empty_slot" here. Empty-slot intent is wholly
    // owned by Village. Step 4 below only wires hero/inline/sticky/nav CTAs.
    goToApply();
  }}
/>
```

- [ ] **Step 3: Wire scroll milestones in index.tsx**

In `apps/house/src/pages/index.tsx`, add a `useScrollMilestones()` hook usage:

Create `apps/house/src/hooks/useScrollMilestones.ts`:

```ts
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { track } from "../lib/analytics/track";

const MILESTONES = [25, 50, 75, 100] as const;

export function useScrollMilestones(): void {
  const router = useRouter();
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    fired.current.clear();
    const onScroll = () => {
      const scrolled =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight;
      const percent = Math.floor(scrolled * 100);
      for (const m of MILESTONES) {
        if (percent >= m && !fired.current.has(m)) {
          fired.current.add(m);
          track("scroll_milestone", { percent: m, page_path: router.pathname });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [router.pathname]);
}
```

In `index.tsx`, inside the `House` component, call `useScrollMilestones()`.

- [ ] **Step 4: Wire CTA clicks**

In `index.tsx`, find every place that calls `goToApply()` directly from a CTA button (NOT the empty-plot path — that fires `village_slot_click` inside Village.tsx). Wrap each named handler with track:

```ts
import { track } from "../lib/analytics/track";

const handleHeroApply = () => {
  track("cta_click", { placement: "hero", intent: "apply" });
  goToApply();
};
const handleInlineApply = () => {
  track("cta_click", { placement: "inline", intent: "apply" });
  goToApply();
};
// Note: no handleEmptySlotClaim — that path is owned by Village.tsx.
// `nav` and `sticky` placements are wired in Chunk 4 (sticky waitlist button).
```

Replace inline `onClick={() => goToApply()}` calls with these named handlers. Keep the same touch-target sizing.

- [ ] **Step 5: Wire ZoRadio play**

Locate `ZoRadioPill.tsx` (it's exported from `apps/house/src/components/helpers/house`). Find the play handler (likely calls `audio.play()` or `tuneIn()`). Add:

```ts
import { track } from "../../../lib/analytics/track";
// inside handler:
track("zo_radio_play");
```

- [ ] **Step 6: Wire apply form events**

In `apps/house/src/components/ApplyModal.tsx`:

```tsx
import { track } from "../lib/analytics/track";

// On every text input:
onFocus={() => track("apply_field_focus", { field: "name" })}
onBlur={(e) => track("apply_field_blur", { field: "name", was_filled: !!e.target.value.trim() })}

// On submit handler:
const onSubmit = async () => {
  track("apply_submit_attempt");
  try {
    const res = await fetch("/api/apply", { ... });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      track("apply_submit_error", { error_code: err.error || "http_" + res.status });
      return;
    }
    // apply_submit_success is fired by the API itself via a server-side track
    // (see Task 4.7); no client-side fire here to avoid double-counting.
  } catch (err) {
    track("apply_submit_error", { error_code: "network" });
  }
};
```

- [ ] **Step 7: Manual smoke test**

Run: `npx nx serve house --port 4205`
Visit the page. In the browser console, look for `track:` debug logs (or watch the network tab for PostHog `/i/v0/e/` calls). Verify that scrolling, clicking empty village plots, clicking Apply, and focusing the apply form fields all fire events.

- [ ] **Step 8: Commit**

```bash
git add apps/house/src/components/Village.tsx \
        apps/house/src/pages/index.tsx \
        apps/house/src/hooks/useScrollMilestones.ts \
        apps/house/src/components/ApplyModal.tsx \
        apps/house/src/components/helpers/house/ZoRadioPill.tsx
git commit -m "feat(house): wire engagement + CTA + apply-form events"
```

### Task 1.11: Chunk 1 verification

- [ ] **Step 1: Run all tests**

Run: `npx jest apps/house/src/__tests__/lib`
Expected: all tests in lib/analytics PASS.

- [ ] **Step 2: Build the app**

Run: `npx nx build house --skip-nx-cache`
Expected: SUCCESS.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p apps/house/tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npx nx lint house`
Expected: pass (or only warnings unrelated to this work).

- [ ] **Step 5: Deploy a Vercel preview to verify SDKs load with real env vars**

Push the branch and let Vercel build the preview for `zo-house` project. Open the preview URL, then in browser console verify:
- `window.gtag` exists (if `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set in Vercel)
- `window.fbq` exists (if `NEXT_PUBLIC_META_PIXEL_ID` is set)
- `window.Moengage` exists (if `NEXT_PUBLIC_MOENGAGE_APP_ID` is set)
- `window.posthog` exists

If env vars aren't set yet (Boldrin/Fang/Samurai blocking — see §14 of spec), the tools will silently no-op without breaking the page. That's the safe fallback.
