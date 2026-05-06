-- ============================================================
-- Builder Reputation feature — schema for /earn
-- Spec: docs/superpowers/specs/2026-05-06-earn-builder-reputation.md
-- Run in Supabase SQL editor against the same DB the earn app uses.
-- All tables reference `public.users(id)` which already exists.
-- ============================================================

-- 1. Connected accounts (GitHub, X). One row per (user, provider).
--    Tokens are stored as text; encrypt/decrypt happens in the app layer.
CREATE TABLE IF NOT EXISTS builder_accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider       text NOT NULL,            -- 'github' | 'x'
  provider_id    text NOT NULL,            -- their ID on that platform
  handle         text NOT NULL,
  access_token   text NOT NULL,
  refresh_token  text,
  scope          text,
  connected_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
CREATE INDEX IF NOT EXISTS builder_accounts_user_idx
  ON builder_accounts(user_id);

-- 2. Normalized ship event stream. One row = one shippable thing.
CREATE TABLE IF NOT EXISTS builder_ships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source       text NOT NULL,             -- 'github' | 'x' | 'zo-bounty'
  kind         text NOT NULL,             -- 'pr_merged' | 'release' | 'commit' | 'product_launch' | 'x_post' | 'star_earned' | 'npm_publish' | 'repo_created'
  ref          text,                      -- canonical URL
  repo         text,                      -- 'owner/name' for github events
  metadata     jsonb,
  is_private   boolean NOT NULL DEFAULT false,
  occurred_at  timestamptz NOT NULL,
  ingested_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS builder_ships_user_time_idx
  ON builder_ships(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS builder_ships_kind_time_idx
  ON builder_ships(kind, occurred_at DESC);

-- 3. Stats cache. One row per builder, recomputed by the scorer.
CREATE TABLE IF NOT EXISTS builder_stats (
  user_id            text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ship_score         int NOT NULL DEFAULT 0,
  reach_score        int NOT NULL DEFAULT 0,
  consistency_score  int NOT NULL DEFAULT 0,
  lifetime_xp        int NOT NULL DEFAULT 0,
  lifetime_title     text NOT NULL DEFAULT 'Zo Newbie',
  streak_days        int NOT NULL DEFAULT 0,
  last_ship_at       timestamptz,
  computed_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS builder_stats_ship_idx
  ON builder_stats(ship_score DESC);
CREATE INDEX IF NOT EXISTS builder_stats_reach_idx
  ON builder_stats(reach_score DESC);
CREATE INDEX IF NOT EXISTS builder_stats_consistency_idx
  ON builder_stats(consistency_score DESC);

-- 4. Auto-detected products (GitHub repos with a homepage URL).
--    is_public toggle lives here.
CREATE TABLE IF NOT EXISTS builder_products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_full_name  text NOT NULL,           -- 'owner/repo'
  homepage_url    text NOT NULL,
  name            text NOT NULL,
  language        text,
  stars           int NOT NULL DEFAULT 0,
  is_public       boolean NOT NULL DEFAULT true,
  detected_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, repo_full_name)
);
CREATE INDEX IF NOT EXISTS builder_products_user_idx
  ON builder_products(user_id);

-- ============================================================
-- After this runs, add the corresponding Prisma models to
-- apps/earn/prisma/schema.prisma and run `npx prisma generate`
-- to update the typed client. No `prisma migrate` needed since
-- tables already exist.
-- ============================================================
