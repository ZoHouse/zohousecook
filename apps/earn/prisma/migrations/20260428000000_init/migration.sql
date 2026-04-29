-- Earn app — initial schema (idempotent).
-- The `public.users` table already exists and is owned by the broader Zo
-- platform. Earn does NOT create or alter it. We only reference it via FK.

CREATE TABLE IF NOT EXISTS "earn_profiles" (
  "user_id"     TEXT PRIMARY KEY,
  "handle"      TEXT NOT NULL UNIQUE,
  "title"       TEXT NOT NULL DEFAULT 'Zo Newbie',
  "level"       INTEGER NOT NULL DEFAULT 1,
  "xp"          INTEGER NOT NULL DEFAULT 0,
  "xp_max"      INTEGER NOT NULL DEFAULT 500,
  "streak"      INTEGER NOT NULL DEFAULT 0,
  "quests_done" INTEGER NOT NULL DEFAULT 0,
  "combo"       INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "earn_profiles_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "bounties" (
  "id"            TEXT PRIMARY KEY,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "reward"        TEXT NOT NULL,
  "reward_amount" INTEGER NOT NULL DEFAULT 0,
  "tags"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "deadline"      TEXT,
  "source"        TEXT NOT NULL,
  "source_id"     TEXT NOT NULL,
  "url"           TEXT,
  "image_url"     TEXT,
  "applicants"    INTEGER NOT NULL DEFAULT 0,
  "status"        TEXT NOT NULL DEFAULT 'open',
  "color"         TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "bounties_source_source_id_key" ON "bounties"("source", "source_id");
CREATE INDEX IF NOT EXISTS "bounties_status_created_at_idx" ON "bounties"("status", "created_at");
CREATE INDEX IF NOT EXISTS "bounties_source_idx" ON "bounties"("source");

CREATE TABLE IF NOT EXISTS "projects" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "color"       TEXT,
  "members"     INTEGER NOT NULL DEFAULT 0,
  "status"      TEXT NOT NULL DEFAULT 'active',
  "url"         TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "grants" (
  "id"          TEXT PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "amount"      TEXT NOT NULL,
  "description" TEXT,
  "color"       TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "applications" (
  "id"         TEXT PRIMARY KEY,
  "user_id"    TEXT NOT NULL,
  "bounty_id"  TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'applied',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "applications_user_fk"   FOREIGN KEY ("user_id")   REFERENCES "users"("id")    ON DELETE CASCADE,
  CONSTRAINT "applications_bounty_fk" FOREIGN KEY ("bounty_id") REFERENCES "bounties"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "applications_user_bounty_key" ON "applications"("user_id", "bounty_id");
CREATE INDEX IF NOT EXISTS "applications_bounty_idx" ON "applications"("bounty_id");

CREATE TABLE IF NOT EXISTS "achievements" (
  "id"          TEXT PRIMARY KEY,
  "label"       TEXT NOT NULL,
  "description" TEXT,
  "icon"        TEXT,
  "color"       TEXT,
  "sort_order"  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "user_achievements" (
  "user_id"        TEXT NOT NULL,
  "achievement_id" TEXT NOT NULL,
  "unlocked_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "achievement_id"),
  CONSTRAINT "user_achievements_user_fk"        FOREIGN KEY ("user_id")        REFERENCES "users"("id")        ON DELETE CASCADE,
  CONSTRAINT "user_achievements_achievement_fk" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "season_nodes" (
  "id"         INTEGER PRIMARY KEY,
  "label"      TEXT NOT NULL,
  "category"   TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id"         TEXT PRIMARY KEY,
  "name"       TEXT NOT NULL,
  "user_id"    TEXT,
  "bounty_id"  TEXT,
  "source"     TEXT,
  "properties" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "analytics_events_name_created_idx" ON "analytics_events"("name", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_user_idx"         ON "analytics_events"("user_id");

-- Seed: 8 achievements
INSERT INTO "achievements"("id","label","description","icon","color","sort_order") VALUES
  ('first-blood',  'First Blood',   'First quest claimed',     'IconSwords',   '#FF9E4C', 1),
  ('centurion',    'Centurion',     '100 contributions',       'IconShield',   '#6A77DD', 2),
  ('streak-7',     'Week Warrior',  '7-day streak',            'IconFlame',    '#FFD600', 3),
  ('whale',        'Whale',         'Earn $10k+',              'IconDiamond',  '#9803CE', 4),
  ('legendary',    'Legendary',     'Claim a legendary quest', 'IconCrown',    '#CFFF50', 5),
  ('sharpshooter', 'Sharpshooter',  '5 wins in a row',         'IconTarget',   '#66DF48', 6),
  ('guild-master', 'Guild Master',  'Invite 10 builders',      'IconMedal',    '#FF2F8E', 7),
  ('apex',         'Apex',          'Reach level 50',          'IconTrophy',   '#FF4545', 8)
ON CONFLICT ("id") DO NOTHING;

-- Seed: 10 season-path nodes
INSERT INTO "season_nodes"("id","label","category","sort_order") VALUES
  (1,  'Intro',       'onboarding', 1),
  (2,  'First Blood', 'onboarding', 2),
  (3,  'Solana',      'chain',      3),
  (4,  'React',       'engineering',4),
  (5,  'Layer3',      'chain',      5),
  (6,  'Content',     'content',    6),
  (7,  'Design',      'design',     7),
  (8,  'AI Agents',   'ai',         8),
  (9,  'Web3',        'chain',      9),
  (10, 'Boss',        'milestone',  10)
ON CONFLICT ("id") DO NOTHING;
