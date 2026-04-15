# zo.house — standalone marketing app

Public-facing recruiting page for **Zo House** at https://zo.house. Shows a live 3D village of the current residents, takes applications, and pushes them into the existing sales triage pipeline.

This is a separate NX app (`apps/house`) in the `zohousecook` monorepo. It deploys to its own Vercel project so marketing can ship independently of `zozozo.work`.

---

## 1. What the page does

| Section | Data source | Notes |
|---|---|---|
| Hero + radio gate | static | "Tap to tune in" → LoadingScreen → main page. Radio pill calls `zo-radio-production.up.railway.app` |
| Program accordion | static | Build Sprints · Mentor Sessions · Founder Dinners · Demo Days |
| The Village (3D) | **live** | 35 procedural plots (BLR 15 + WTF 20). Houses light up for current residents, empty plots read "Claim your slot" |
| Track Record scroll | static | Dubai / Singapore / SF pop-up photos |
| Mission Houses | static | WTFxZo + BLRxZo property cards |
| CTA → Apply | live | Phone OTP login (Zo API) → form → inserts into `pipeline_leads` |

---

## 2. Repo layout

```
apps/house/
├── project.json                         NX build/serve config (port 4210)
├── next.config.js                       env vars, image domains, transpilePackages
├── tailwind.config.js / postcss.config.js
├── public/                              (NOT served by Vercel — see gotcha #1)
├── .env.local                           (gitignored)
└── src/
    ├── pages/
    │   ├── _app.tsx                     ZoAuthProvider wrapper + fonts
    │   ├── _document.tsx                CDN-hosted favicon in <head>
    │   ├── index.tsx                    main page + SSR residents fetch
    │   ├── apply.tsx                    redirect → "/?apply=1" (modal opens)
    │   └── api/apply.ts                 server-side: validates + inserts into pipeline_leads
    ├── components/
    │   ├── Village.tsx                  react-three-fiber village
    │   ├── ApplyModal.tsx               overlay form
    │   ├── LoginModal.tsx               phone-OTP modal
    │   ├── common/MetaTags.tsx
    │   └── helpers/house/               BlurFade, HyperText, TextReveal, FrequencyGate,
    │                                    LoadingScreen, HouseWrapper, ZoRadioPill,
    │                                    ProgramAccordion, TrackRecordScroll, MissionHouses,
    │                                    MobileWaitlistBar
    ├── hooks/
    │   ├── useRadioSync.ts              copied from apps/website — talks to zo-radio Railway
    │   └── useZoAuth.tsx                phone-only auth provider + context
    ├── lib/
    │   ├── auth.ts                      request OTP + verify OTP, localStorage session
    │   └── residents.ts                 server-side Supabase client; fetches current stays
    ├── config/house-media.ts             all CDN asset URLs
    └── styles/globals.css                shiny-gold class + section-padding
```

### Why components are copied, not imported from `apps/website`

apps/website's `_app.tsx` pulls the whole Zo admin stack (Wagmi, RainbowKit, Ant Design, etc.). The standalone marketing page doesn't need any of that. We copy the handful of presentational components we need and keep the bundle tiny.

---

## 3. Running locally

```bash
# from mono-front-main/ repo root
yarn install

# dev server on :4210
npx nx serve house
```

`.env.local` required:

```
SUPABASE_URL=https://elvaqxadfewcsohrswsi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-side-only service role key>
APP_ID=c26ea3e427cf42a88a18
API_BASE_URL=https://api.io.zo.xyz
MEDIA_BASE_URL=https://cdn.zo.xyz
NEXT_PUBLIC_ZO_CLIENT_KEY_WEB=1482d843137574f36f74
```

Service role key ≠ anon key. Service role has RLS bypass and is only read inside `getServerSideProps` / API routes. **Never ship it with `NEXT_PUBLIC_`.**

---

## 4. Live resident data — how it flows

```
eZee Absolute PMS (Zostel's SaaS)
           │
           │  scraped via Playwright
           ▼
Railway service: ezee-pms-sync (FastAPI)
  project id: 0d480a6f-0a1b-4c1f-9469-7ddaf4ce8131
  https://ezee-pms-sync-production.up.railway.app
  schedule: hourly polling 9am-9pm IST + full daily summary at 9:30am IST
           │
           │  upsert on tranunkid (service role)
           ▼
Supabase table: public.pms_bookings
  columns we read: property_id (BLRxZo/WTFxZo), gname, arrivaldate,
                   departuredate, cancellationno, noshowuser, updated_at
           │
           │  getServerSideProps on every page load
           │  (cached at Vercel edge for 5min, SWR 10min)
           ▼
apps/house → src/lib/residents.ts → fetchResidents()
           │
           ▼
<Village blr={...} wtf={...} syncedAt={...} />
```

### Manual sync trigger

```bash
curl -X POST https://ezee-pms-sync-production.up.railway.app/sync-all
curl -X POST https://ezee-pms-sync-production.up.railway.app/sync/WTFxZo
curl -X POST https://ezee-pms-sync-production.up.railway.app/sync/BLRxZo
```

### Service source code

Repo: [`ZoHouse/ezee-pms-sync`](https://github.com/ZoHouse/ezee-pms-sync). The Dockerfile + railway.json live on the local Railway deploy but aren't merged to main yet — if you need to change the sync service, either edit and `railway up` from a fresh clone, or push the Dockerfile to the repo first.

---

## 5. Phone OTP login

Minimal implementation — no Wagmi, no RainbowKit, no React Query.

```
LoginModal  →  POST api.io.zo.xyz/api/v1/auth/login/mobile/otp/   { mobile_number, mobile_country_code }
            ←  OTP sent to phone
LoginModal  →  POST api.io.zo.xyz/api/v1/auth/login/mobile/        { mobile_number, mobile_country_code, otp }
            ←  { user, token, valid_till }
            →  localStorage: zo-house-token, zo-house-user, zo-house-expiry
            →  onSuccess callback fires (opens ApplyModal)
```

Headers on every Zo API call:

- `client-key: 1482d843137574f36f74`
- `client-device-id: <random, per-browser, persisted>`
- `client-device-secret: <random, per-browser, persisted>`

Session load on page mount is handled by `ZoAuthProvider` in `_app.tsx`. Expired tokens are cleared automatically.

---

## 6. Apply form — where it lands

Applications land in the **existing** `public.pipeline_leads` table. This is the sales team's admin triage table with AI scoring, stage transitions, Telegram integration, etc. No new table, no new UI needed — zo.house applications automatically show up in the admin app filtered by `source=zo.house`.

### Field mapping (in `src/pages/api/apply.ts`)

| Form field | `pipeline_leads` column |
|---|---|
| name | `full_name` |
| email | `email` |
| phone | `phone` |
| socials (x.com/handle) | `twitter` (handle extracted, raw in `notes` if no match) |
| building | `what_building` |
| problem | `motivation` |
| whyJoin | `what_you_bring` |
| preferredProperty (WTFxZo/BLRxZo/Either) | `preferred_property` |
| stage (Idea/Prototype/Launched/Growing) | in `notes` as "Builder stage: X" |
| role (Founder/Engineer/…) | `lead_tags: [role]` |
| heardFrom | `referral_source` |
| city | in `notes` as "City: X" |
| *auto* | `stage = "applied"` |
| *auto* | `lead_type = "membership"` |
| *auto* | **`source = "zo.house"`** ← filter by this |
| zo user (if logged in) | `member_id` = user's Zo PID |

The Zo auth token is verified server-side by calling `/api/v1/profile/me/` — that's how we get the `member_id`. If verification fails we still accept the application (email + phone are identity enough), `member_id` is left null.

### Find zo.house applications

```sql
SELECT full_name, email, preferred_property, what_building, motivation, created_at
FROM pipeline_leads
WHERE source = 'zo.house' AND stage = 'applied'
ORDER BY created_at DESC;
```

Or via admin UI: filter `source=zo.house` on the leads pipeline page.

---

## 7. Deployment (Vercel)

Separate project from `zozozo-website`. Same repo, different build target.

| Field | Value |
|---|---|
| Vercel project | `zo-house` |
| Project ID | `prj_wGOm2k3TZGkXBzwgmR3QRWqfZqhG` |
| Team | `samurais-dojo` (`team_lqfETp19zJBHMlhW2mowk0Qc`) |
| GitHub repo | `ZoHouse/zohousecook` |
| Auto-deploy branch | `main` (production). Pushes to feature branches = Vercel previews |
| Build command | `npx nx build house --configuration=production` |
| Install command | `yarn install --frozen-lockfile` |
| Output directory | `dist/apps/house/.next` |
| Root directory | `/` (monorepo root) |
| Ignored Build Step | `git diff HEAD^ HEAD --quiet apps/house libs` |
| Domains | `zo.house` (A record) + `www.zo.house` (CNAME, 308 redirect → apex) |

### Env vars on Vercel

Project → Settings → Environment Variables. Same values as `.env.local`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ID`
- `API_BASE_URL`
- `MEDIA_BASE_URL`
- `NEXT_PUBLIC_ZO_CLIENT_KEY_WEB`

### Manual deploy (if GitHub auto-deploy is off)

The monorepo's root `.vercel/project.json` is linked to `mono-front-main` (the website project). To deploy zo-house you have to temporarily swap that link:

```bash
cd mono-front-main/

cp .vercel/project.json .vercel/project.json.bak
echo '{"projectId":"prj_wGOm2k3TZGkXBzwgmR3QRWqfZqhG","orgId":"team_lqfETp19zJBHMlhW2mowk0Qc","projectName":"zo-house"}' > .vercel/project.json

vercel deploy --prod

mv .vercel/project.json.bak .vercel/project.json
```

This bypasses GitHub and uploads your local tree directly to the zo-house project.

### DNS

Registrar: Namecheap. Records required:

| Type | Host | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

SSL is auto-issued by Vercel (Let's Encrypt) once DNS resolves. Cert auto-renews.

---

## 8. Secrets

| Secret | Location | Purpose |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env + `.env.local` | SSR Supabase read/write |
| `APP_ID` + `NEXT_PUBLIC_ZO_CLIENT_KEY_WEB` | Vercel env + `.env.local` | Zo API client headers |
| eZee PMS credentials | Railway ezee-pms-sync env | PMS scraping |
| Vercel API token | `~/Library/Application Support/com.vercel.cli/auth.json` | CLI deploys |
| Railway API token | `~/.railway/config.json` | CLI access |

**Never commit `.env.local`.** It's in `.gitignore`.

---

## 9. Known gotchas

1. **`public/` folder is NOT served.** Vercel's `outputDirectory` points at `.next` and doesn't pick up sibling `public/`. Static assets (favicon, any future images) are hosted on `cdn.zo.xyz`. Use the upload script at `scripts/cdn-upload.py` if you need to add new ones.
2. **`proxy.cdn.zo.xyz` auto-transcodes videos to 640×360/~2MB.** Use `cdn.zo.xyz` (no proxy) for originals. Already configured in `src/config/house-media.ts`.
3. **RLS blocks anon reads on `pms_bookings`.** Don't try to hit Supabase from the client — use `getServerSideProps` + service role key.
4. **Branch switching wipes uncommitted `apps/house` files.** If the dev server 500s with "ENOENT apps/house/src/pages", you've switched away from `feat/zo-house-standalone` (or a branch that has the app merged). Switch back or commit/stash first.
5. **HyperText scramble** looks broken on italic serif ("Civilisation" rendered as "Ci ilisa" mid-animation). CTA heading uses plain `<span>` instead of `<HyperText>`.
6. **Tagline copy intentional**: "The *Civilisation* Is Recruiting / Waiting" in hero and CTA kept the old recruiting name because that gold-italic flourish is the tagline. Brand name everywhere else = "Zo House". Don't rebrand those two headings.

---

## 10. Branches & PR

Working branch: `feat/zo-house-standalone`
Open PR: [#8 feat(house): standalone zo.house marketing app](https://github.com/ZoHouse/zohousecook/pull/8)

Once merged to `main`, Vercel production deploys automatically (normally). For now we deploy via the manual `vercel deploy --prod` flow in section 7.
