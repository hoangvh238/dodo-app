-- ============================================================
-- Migration 006: Google-authenticated users table
-- Stores signed-in user profiles linked from the Electron app
-- via Google OAuth. Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  google_sub   TEXT        UNIQUE NOT NULL,   -- Google's stable user ID
  email        TEXT        NOT NULL,
  name         TEXT,
  picture      TEXT,                          -- Google avatar URL
  app_version  TEXT,                          -- version at last sign-in
  os_platform  TEXT,                          -- win32 / darwin / linux
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup by google_sub (upsert key)
CREATE INDEX IF NOT EXISTS users_google_sub_idx  ON public.users(google_sub);
CREATE INDEX IF NOT EXISTS users_email_idx        ON public.users(email);
CREATE INDEX IF NOT EXISTS users_last_seen_at_idx ON public.users(last_seen_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Only service role can write (app uses service role key from main process)
-- Authenticated dashboard users can read everything
CREATE POLICY "auth read users"
  ON public.users FOR SELECT TO authenticated USING (true);

-- Service role bypasses RLS automatically — no insert/update policy needed

-- ── Column: add google_sub to sessions ───────────────────────────────────────
-- Links a session to an identified user when they sign in mid-session.
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS google_sub TEXT REFERENCES public.users(google_sub) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS sessions_google_sub_idx ON public.sessions(google_sub);

-- ── RPC: user list for dashboard ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_registered_users(
  p_limit  INT  DEFAULT 50,
  p_offset INT  DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE(
  google_sub    TEXT,
  email         TEXT,
  name          TEXT,
  picture       TEXT,
  app_version   TEXT,
  os_platform   TEXT,
  session_count BIGINT,
  total_events  BIGINT,
  created_at    TIMESTAMPTZ,
  last_seen_at  TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    u.google_sub,
    u.email,
    u.name,
    u.picture,
    u.app_version,
    u.os_platform,
    COUNT(DISTINCT s.id)  AS session_count,
    COALESCE(SUM(s.events_count), 0) AS total_events,
    u.created_at,
    u.last_seen_at
  FROM public.users u
  LEFT JOIN public.sessions s ON s.google_sub = u.google_sub
  WHERE (
    p_search IS NULL
    OR u.email ILIKE '%' || p_search || '%'
    OR u.name  ILIKE '%' || p_search || '%'
  )
  GROUP BY u.google_sub, u.email, u.name, u.picture, u.app_version, u.os_platform, u.created_at, u.last_seen_at
  ORDER BY u.last_seen_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ── RPC: count registered users ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION count_registered_users(p_search TEXT DEFAULT NULL)
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)
  FROM public.users
  WHERE (
    p_search IS NULL
    OR email ILIKE '%' || p_search || '%'
    OR name  ILIKE '%' || p_search || '%'
  );
$$;
