-- ============================================================
-- Do It Analytics — Supabase schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Events: every action tracked from the app
CREATE TABLE IF NOT EXISTS events (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   TEXT        NOT NULL,
  event_type   TEXT        NOT NULL,
  event_data   JSONB       NOT NULL DEFAULT '{}',
  ip_address   TEXT,
  country      TEXT,
  country_code CHAR(2),
  region       TEXT,
  city         TEXT,
  latitude     FLOAT8,
  longitude    FLOAT8,
  app_version  TEXT,
  os_platform  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions: one per app launch / unique session ID
CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT        PRIMARY KEY,
  ip_address   TEXT,
  country      TEXT,
  country_code CHAR(2),
  region       TEXT,
  city         TEXT,
  latitude     FLOAT8,
  longitude    FLOAT8,
  user_agent   TEXT,
  app_version  TEXT,
  os_platform  TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  events_count INTEGER     NOT NULL DEFAULT 0
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS events_session_id_idx    ON events(session_id);
CREATE INDEX IF NOT EXISTS events_event_type_idx    ON events(event_type);
CREATE INDEX IF NOT EXISTS events_created_at_idx    ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS events_country_idx       ON events(country);
CREATE INDEX IF NOT EXISTS sessions_country_idx     ON sessions(country);
CREATE INDEX IF NOT EXISTS sessions_last_seen_idx   ON sessions(last_seen_at DESC);

-- Auto-increment events_count on sessions when an event is inserted
CREATE OR REPLACE FUNCTION increment_session_events()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions SET events_count = events_count + 1
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_increment_events
AFTER INSERT ON events
FOR EACH ROW EXECUTE FUNCTION increment_session_events();

-- ============================================================
-- Row Level Security
-- The service role key bypasses RLS (used in API routes).
-- Anon key (used for browser reads) is restricted to read-only.
-- ============================================================
ALTER TABLE events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users (dashboard) can read everything
CREATE POLICY "auth read events"    ON events    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read sessions"  ON sessions  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- App Releases — version-tagged build artifacts
-- ============================================================

CREATE TABLE IF NOT EXISTS app_releases (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  version       TEXT        NOT NULL,
  platform      TEXT        NOT NULL CHECK (platform IN ('ios','android','windows','macos','web')),
  channel       TEXT        NOT NULL DEFAULT 'stable' CHECK (channel IN ('stable','beta','alpha')),
  file_name     TEXT        NOT NULL,
  file_size     BIGINT      NOT NULL DEFAULT 0,
  file_url      TEXT        NOT NULL,
  release_notes TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS releases_platform_idx  ON app_releases(platform);
CREATE INDEX IF NOT EXISTS releases_created_at_idx ON app_releases(created_at DESC);

ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage releases
CREATE POLICY "auth read releases"   ON app_releases FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert releases" ON app_releases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth delete releases" ON app_releases FOR DELETE TO authenticated USING (true);

-- Storage bucket for app release files
-- Run in Supabase dashboard: Storage > New Bucket > "app-releases" (public)

-- Service role can do everything (no policy needed — bypasses RLS)

-- ============================================================
-- App Version Config — single active row drives the update gate
-- in all Electron clients. Update via Supabase dashboard or API.
--
-- Columns:
--   min_version    — oldest build still allowed to run (blocks older clients)
--   latest_version — newest available build (shown in update gate)
--   download_url   — direct link to the installer
--   release_notes  — plain text shown in the "What's new" box
--   build_hash     — SHA-256 of app.asar for the official build
--                    (leave NULL to skip integrity check)
--   custom_message — optional announcement shown prominently in the gate
--                    (e.g. "Critical security update — please update now.")
--   is_active      — only the row with is_active=true is served
--   updated_at     — bumped on every UPDATE for cache-busting ordering
-- ============================================================

CREATE TABLE IF NOT EXISTS app_version_config (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  min_version    TEXT        NOT NULL,
  latest_version TEXT        NOT NULL,
  download_url   TEXT        NOT NULL,
  release_notes  TEXT        NOT NULL DEFAULT '',
  build_hash     TEXT,
  custom_message TEXT,
  -- Hard-locks the entire app when true. All clients show a full-screen
  -- unbypassable gate; hotkeys are disabled; tray shows only Download + Quit.
  is_blocked     BOOLEAN     NOT NULL DEFAULT false,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: keep updated_at current on every update
CREATE OR REPLACE FUNCTION touch_version_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_version_config_updated_at
BEFORE UPDATE ON app_version_config
FOR EACH ROW EXECUTE FUNCTION touch_version_config_updated_at();

CREATE INDEX IF NOT EXISTS version_config_active_idx ON app_version_config(is_active, updated_at DESC);

ALTER TABLE app_version_config ENABLE ROW LEVEL SECURITY;

-- Public GET (anon) — read-only, only active rows
CREATE POLICY "anon read active version"
  ON app_version_config FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated dashboard users can manage all rows
CREATE POLICY "auth manage version config"
  ON app_version_config FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Seed the initial row (edit values before running) ──────────────────────
-- INSERT INTO app_version_config (min_version, latest_version, download_url, release_notes, build_hash, custom_message, is_blocked)
-- VALUES (
--   '1.0.0',
--   '1.0.0',
--   'https://github.com/hoangvh238/dodo-releases/releases/latest',
--   'Initial release.',
--   NULL,   -- SHA-256 of app.asar (set after build)
--   NULL,   -- custom announcement message
--   false   -- set to true to hard-lock ALL clients immediately
-- );
--
-- To close beta and block all clients, run:
-- UPDATE app_version_config SET
--   is_blocked     = true,
--   custom_message = 'Beta đã kết thúc. Vui lòng tải phiên bản mới tại website để tiếp tục.',
--   download_url   = 'https://yourdomain.com/download'
-- WHERE is_active = true;
