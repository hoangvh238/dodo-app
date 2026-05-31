-- ============================================================
-- Migration 003: app_releases + app_version_config tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── app_version_config ────────────────────────────────────
-- Stores the active manifest returned by GET /api/version.
-- Only the row with is_active = true is served to clients.

CREATE TABLE IF NOT EXISTS app_version_config (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  min_version    TEXT        NOT NULL,
  latest_version TEXT        NOT NULL,
  download_url   TEXT        NOT NULL,
  release_notes  TEXT        NOT NULL DEFAULT '',
  build_hash     TEXT        NULL,        -- SHA-256 of app.asar; NULL = skip integrity check
  custom_message TEXT        NULL,        -- prominent banner shown in gate / lock screen
  is_blocked     BOOLEAN     NOT NULL DEFAULT false,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_version_config_active_idx
  ON app_version_config(is_active, updated_at DESC);

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_version_config_updated_at ON app_version_config;
CREATE TRIGGER app_version_config_updated_at
  BEFORE UPDATE ON app_version_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── app_releases ──────────────────────────────────────────
-- Stores every published build artefact (file or link URL).
-- Does NOT directly affect /api/version — promote via version-config.

CREATE TABLE IF NOT EXISTS app_releases (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  version       TEXT        NOT NULL,
  platform      TEXT        NOT NULL DEFAULT 'windows',  -- windows | macos | ios | android | web
  channel       TEXT        NOT NULL DEFAULT 'stable',   -- stable | beta | alpha
  file_name     TEXT        NOT NULL DEFAULT '',
  file_size     BIGINT      NOT NULL DEFAULT 0,
  file_url      TEXT        NOT NULL,
  release_notes TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_releases_created_at_idx
  ON app_releases(created_at DESC);

-- ── RLS ───────────────────────────────────────────────────
-- /api/version uses the service role key so it bypasses RLS.
-- The admin dashboard also uses the service role client.
-- Enable RLS but grant full access to the service role implicitly.

ALTER TABLE app_version_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_releases        ENABLE ROW LEVEL SECURITY;

-- Public read on version_config (the /api/version endpoint reads with service key,
-- but a permissive SELECT policy lets anon/authenticated roles read it too if needed).
DROP POLICY IF EXISTS "public can read active version config" ON app_version_config;
CREATE POLICY "public can read active version config"
  ON app_version_config FOR SELECT
  USING (is_active = true);
