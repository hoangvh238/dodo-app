-- ============================================================
-- Migration 004: beta_config table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS beta_config (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phase        TEXT        NOT NULL DEFAULT 'open',  -- 'open' | 'coming_soon' | 'closed'
  launch_date  TIMESTAMPTZ,                           -- target v1.0 date; null = no countdown
  announcement TEXT,                                 -- shown on homepage beta section
  beta_slots   INT         NOT NULL DEFAULT 10000,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS beta_config_updated_at ON beta_config;
CREATE TRIGGER beta_config_updated_at
  BEFORE UPDATE ON beta_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE beta_config ENABLE ROW LEVEL SECURITY;

-- Allow public read of active config (homepage uses this)
DROP POLICY IF EXISTS "public can read active beta config" ON beta_config;
CREATE POLICY "public can read active beta config"
  ON beta_config FOR SELECT
  USING (is_active = true);

-- Seed default row
INSERT INTO beta_config (phase, announcement)
VALUES ('open', 'Early access is live. Download free and help shape DoDo v1.0.')
ON CONFLICT DO NOTHING;
