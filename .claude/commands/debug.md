Something's broken. Let's fix it systematically.

## Step 1: What's the symptom?

Read the error carefully. Don't guess — understand what it's actually saying.

## Step 2: Which team's area?

Check `.claude/docs/teams/` to load the right context. Read the **"Watch out for"** section first — this might be a known gotcha that saves you 20 minutes.

Teams and their apps:
- **Cafe:** `apps/pms/src/pages/cafe/*`, `apps/pms/src/hooks/cafe/`, `apps/pms/src/components/cafe/`
- **Sales:** `apps/admin/src/pages/insights/*`, `apps/admin/src/pages/events/*`, `apps/admin/src/pages/users/*`
- **Infra:** `libs/*`, `nx.json`, `vercel.json`, deployment configs
- **$Zo:** `apps/dashboard/`, `apps/website/` (web3 features), `libs/utils/web3/`
- **Social:** Check team doc for current app location

## Step 3: Trace the data flow

Follow the chain:
1. **Page component** (`apps/<app>/src/pages/...`) — is it rendering? Check for client-side errors.
2. **Hook** (`src/hooks/...`) — is it fetching? Check the URL, params, error handling.
3. **API route** (`src/pages/api/...`) — is it responding? curl it directly.
4. **Supabase query** — is the query correct? Check the Supabase dashboard.
5. **Shared lib** (`libs/...`) — did a shared library change break something?

## Step 4: Check the obvious

- Is the build passing? (`npx nx build <app>`)
- Is the API route returning data? (`curl -s http://localhost:<port>/api/...`)
- Is NX cache stale? (`npx nx reset`)
- Is there a TypeScript error hiding? (`npx tsc --noEmit`)
- Are transpile packages configured? (Check `next.config.js`)

## Step 5: Fix and learn

- Fix the root cause, not the symptom
- If this was a non-obvious bug, add it to the team doc's **"Watch out for"** section
- If the fix reveals a pattern that should be followed, add to **"Patterns to follow"**
- If you had to make a trade-off, log it in **"Decisions"** with date and reasoning
