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

-- Service role can do everything (no policy needed — bypasses RLS)
