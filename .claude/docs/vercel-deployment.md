# Vercel Deployment — zo.xyz monorepo

This monorepo deploys to **two** Vercel projects in the `samurais-dojo` team. A third Vercel project (`zozozo-earn`) exists but lives in a separate repo. Everything else (admin, ops, checkin, payments, comic, meme, dashboard, web-checkin) deploys to **AWS ECS Fargate only** — not Vercel — even though `vercel.json` contains rewrite stubs for some of those paths. Those stubs are stale and can be ignored.

## Project ↔ App map

| Vercel project | App in repo | Domain | Build command |
|---|---|---|---|
| `zozozo-website` | `apps/website` | `zozozo.work` (root + most paths) | `npx nx build website --configuration=production && cp -r dist/apps/website/public/. dist/apps/website/.next/` |
| `zozozo-pm` | `apps/pms` | `zozozo.work/pm` (via rewrite in root `vercel.json`) | `npx nx build pms --configuration=production && cp -r dist/apps/pms/public/. dist/apps/pms/.next/` |
| `zo-house` | `apps/house` | `zo.house` (separate apex domain) | `npx nx build house --configuration=production` |
| `zozozo-earn` | _separate repo_ | `zozozo.work/earn` (via rewrite) | N/A here |

Both projects share `outputDirectory: dist/apps/<app>/.next` and the cp-public-into-.next pattern (see `feedback_zozozo_public_folder_404_root_cause` memory for why).

## The NEXT_ASSET_PREFIX trap (read this before any deploy)

Every `apps/<app>/.env.production` in this repo is **committed** and contains:

```
NEXT_ASSET_PREFIX = https://static.cdn.zo.xyz
NEXT_BASE_PATH =
```

This is **correct for the AWS deploy** of zo.xyz where chunks really do live on `static.cdn.zo.xyz`. It is **wrong for any Vercel deploy** — Vercel must serve chunks from the deployment itself, otherwise every `_next/static/*` request 403s from S3/CloudFront and the page renders blank (citizens see the ant-spin loader forever; auth guards trip with "infinite loop detected").

**Code-level guardrail** (already in place): `apps/website/next.config.js` and `apps/pms/next.config.js` both check `process.env.VERCEL === "1" || process.env.VERCEL_ENV` and force `assetPrefix=""` when true. Look for the `isVercelDeployment` constant.

**Rule for any new Vercel-deployed app from this repo:** copy that guard into the app's `next.config.js` before the first deploy. Without it, the next CI build silently bakes the wrong asset prefix.

## Deploy playbook (manual prebuilt — the reliable path)

Git-push-triggered builds on Vercel Hobby have been flaky in this org (BLOCKED state, dropped routes, etc. — see memories `feedback_vercel_hobby_plan_manual_deploy` and `feedback_vercel_blocked_retry_before_plan_conclusion`). The reliable deploy path is **manual prebuilt** from a local CLI:

```sh
# from repos/zo.xyz/ — root of the monorepo, NOT inside apps/<app>/
# (see feedback_vercel_website_local_cli_relocate_link memory for why)

# 0. ALWAYS pull main first. `vercel --prod` and `vercel build` upload
#    the local working tree, not git-main. If local is behind main, the
#    deploy ships stale code (incident 2026-05-22: deployed zo-house from
#    16e99c1 while main was at 4b8ca9c → /live + /build 404'd).
git pull --ff-only origin main

# 1. Link to the target project
rm -rf .vercel
vercel link --project zozozo-pm --yes   # or zozozo-website, zo-house

# 2. Pull production env vars to .vercel/.env.production.local
vercel pull --yes --environment=production

# 3. Build with Vercel's build system (sets VERCEL=1, triggers our guard)
vercel build --prod

# 4. Deploy the prebuilt output
vercel deploy --prebuilt --prod
```

Verify after every deploy:

```sh
# assetPrefix in HTML should be the basePath ("/pm" or ""), NOT the cdn URL
curl -s https://zozozo.work/pm | grep -oE '"assetPrefix":"[^"]*"' | head -1

# a chunk URL should return 200, not 403
curl -sI https://zozozo.work/pm/_next/static/chunks/main-*.js
```

If you see `"assetPrefix":"https://static.cdn.zo.xyz"` in the HTML, the guard didn't fire — check that `isVercelDeployment` is present in `apps/<app>/next.config.js`.

## Switching projects when working on multiple apps

The `.vercel/` directory is per-link, so when you switch from working on website to working on pms, you must relink:

```sh
rm -rf .vercel
vercel link --project <new-project> --yes
vercel pull --yes --environment=production   # NEVER skip — old env.production.local poisons the new build
```

The relink + re-pull rule comes from `feedback_vercel_env_file_leak_on_relink` — without re-pulling, `NEXT_BASE_PATH` and friends from the previous project's env leak into the new build.

If you back up `.vercel/` with `cp -r .vercel .vercel-backup` before relinking, restore with `rm -rf .vercel && mv .vercel-backup .vercel` when done.

## Rewrites in root `vercel.json`

Only the rewrites that map to a Vercel project that actually exists are live:

- `/pm → https://zozozo-pm-samurais-dojo.vercel.app/pm` ✅
- `/earn → https://zozozo-earn-samurais-dojo.vercel.app/earn` ✅

The rewrites for `/admin`, `/ops`, `/checkin`, `/payments`, `/comic`, `/meme`, `/social-engine` point to Vercel projects that do **not exist** as of 2026-05-17. Those paths return 404. They are intentional placeholders that may become real later, or stale config from an old plan. Don't waste cycles wiring env vars for projects that don't exist; revisit per-rewrite when a real Vercel project lands.

## The Hobby-plan stall pattern (2026-05-22 incident)

Around 2026-05-22, **both auto-deploys (webhook-triggered) and manual `vercel --prod`** to `zozozo-website`, `zozozo-pm`, and `zo-house` started landing as deploys with **status=UNKNOWN, build=0ms** — the deploy slot is created and assets upload, but the build phase never starts. The targetUrl on the failure links to `vercel.com/samurais-dojo?upgradeToPro=github-private-org-to-hobby`.

Symptoms (apply to all three projects):
- `vercel ls <project>` shows the new deploy with status `UNKNOWN`, duration `--`.
- `vercel inspect dpl_…` shows `Builds: . [0ms]` and empty log stream.
- `vercel promote` and `vercel alias set` reject with "deployment is not ready".
- Production alias stays on the previous Ready deploy — so the site doesn't break, it just goes stale.

Stalls **clear spontaneously** after some delay (in the 2026-05-22 case: ~6+ hours of stall, then queue resumed and the most recent push built normally — earlier UNKNOWN slots stayed UNKNOWN forever, the system just moved on).

**What to do when you hit it:**
1. Don't keep retrying — every retry creates another UNKNOWN slot that won't be processed.
2. Verify the site is still serving via the previous Ready deploy: `curl -s https://<domain> | grep buildId`.
3. Set a 30-min check; if the queue is still stuck and the change is urgent, escalate to upgrading the plan.

The block is *plan-level*, not transient quota. Permanent fix is upgrade Hobby → Pro.

## Media on apps/house (don't repeat the public/ trap)

Per the project's "don't put runtime media in `apps/<app>/public/`" rule, `apps/house` learned this twice on 2026-05-22:
- PR #132 shipped 20 JPGs under `apps/house/public/{programming,houses}/` + `daypass-bg.jpg` → all 404'd on prod.
- Fix (`48dab34`): upload to Zo CAS via `POST /api/v1/cas/media/`, reference `https://proxy.cdn.zo.xyz/gallery/media/images/<uuid>_<ts>.jpg` URLs directly.

For `apps/house`, **all media goes through Zo CAS / cdn.zo.xyz**. Don't bundle via JS imports either — `apps/house/index.d.ts` types `*.jpg` as plain `string` (not Next's `StaticImageData`), so `.src` won't work; and CDN delivery is auto-WebP-transcoded by proxy.cdn anyway.

## "I'm about to deploy a new app to Vercel" — checklist

1. Add the `isVercelDeployment` guard to the app's `next.config.js` (copy from `apps/website/next.config.js` or `apps/pms/next.config.js`)
2. Create the Vercel project (`vercel link --yes`, name it `zozozo-<app>`)
3. Set the `NEXT_BASE_PATH` env var on the new project for production (e.g. `/admin`)
4. If the app has any other env file pattern that might leak, audit it
5. Add a rewrite entry to root `vercel.json` if traffic should reach it via `zozozo.work/<path>`
6. Run the manual prebuilt deploy (above)
7. Verify assetPrefix + chunk 200 (above)
8. Update this doc's project ↔ app map table

## Related memories

- `feedback_apps_env_production_asset_prefix_trap` — the original incident write-up for the `.env.production` booby trap
- `feedback_zozozo_chunk_403_check_env_leak_first` — older variant: local CLI deploy from inside `apps/website/` leaks env
- `feedback_vercel_env_file_leak_on_relink` — why you must re-pull env after relinking
- `feedback_vercel_website_local_cli_relocate_link` — why CLI deploys run from the repo root, not `apps/<app>/`
- `feedback_vercel_hobby_plan_manual_deploy` — why we don't trust git-triggered Vercel builds
- `feedback_zozozo_public_folder_404_root_cause` — why `outputDirectory` is `dist/apps/<app>/.next` plus a manual `cp` of `public/`
