-- ============================================================
-- Migration 002: Performance indexes + IP user tracking
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS sessions_ip_address_idx ON sessions(ip_address);
CREATE INDEX IF NOT EXISTS events_ip_address_idx   ON events(ip_address);
CREATE INDEX IF NOT EXISTS events_created_at_brin  ON events USING brin(created_at);

-- ── RPC: aggregated event type counts ────────────────────
CREATE OR REPLACE FUNCTION get_event_type_counts(
  from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  to_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(event_type TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT event_type, COUNT(*) AS cnt
  FROM events
  WHERE created_at BETWEEN from_date AND to_date
  GROUP BY event_type
  ORDER BY cnt DESC;
$$;

-- ── RPC: daily event counts ───────────────────────────────
CREATE OR REPLACE FUNCTION get_events_over_time(
  from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  to_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(day TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    to_char(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
    COUNT(*) AS cnt
  FROM events
  WHERE created_at BETWEEN from_date AND to_date
  GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
  ORDER BY day;
$$;

-- ── RPC: top countries ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_countries(lim INT DEFAULT 10)
RETURNS TABLE(country TEXT, country_code TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT country, country_code, COUNT(*) AS cnt
  FROM sessions
  WHERE country IS NOT NULL AND country <> ''
  GROUP BY country, country_code
  ORDER BY cnt DESC
  LIMIT lim;
$$;

-- ── RPC: distinct event types (no full scan) ──────────────
CREATE OR REPLACE FUNCTION get_distinct_event_types()
RETURNS TABLE(event_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT event_type FROM events ORDER BY event_type;
$$;

-- ── RPC: paginated IP users ───────────────────────────────
CREATE OR REPLACE FUNCTION get_ip_users(
  p_limit  INT  DEFAULT 50,
  p_offset INT  DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE(
  ip_address    TEXT,
  country       TEXT,
  country_code  TEXT,
  region        TEXT,
  city          TEXT,
  latitude      FLOAT8,
  longitude     FLOAT8,
  session_count BIGINT,
  total_events  BIGINT,
  first_seen    TIMESTAMPTZ,
  last_seen     TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    ip_address,
    MAX(country)       AS country,
    MAX(country_code)  AS country_code,
    MAX(region)        AS region,
    MAX(city)          AS city,
    MAX(latitude)      AS latitude,
    MAX(longitude)     AS longitude,
    COUNT(*)           AS session_count,
    SUM(events_count)  AS total_events,
    MIN(started_at)    AS first_seen,
    MAX(last_seen_at)  AS last_seen
  FROM sessions
  WHERE
    ip_address IS NOT NULL
    AND ip_address NOT IN ('', 'unknown', '127.0.0.1', '::1', 'localhost')
    AND (
      p_search IS NULL
      OR ip_address    ILIKE '%' || p_search || '%'
      OR city          ILIKE '%' || p_search || '%'
      OR country       ILIKE '%' || p_search || '%'
    )
  GROUP BY ip_address
  ORDER BY MAX(last_seen_at) DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;

-- ── RPC: count unique IP users ────────────────────────────
CREATE OR REPLACE FUNCTION count_ip_users(p_search TEXT DEFAULT NULL)
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(DISTINCT ip_address)
  FROM sessions
  WHERE
    ip_address IS NOT NULL
    AND ip_address NOT IN ('', 'unknown', '127.0.0.1', '::1', 'localhost')
    AND (
      p_search IS NULL
      OR ip_address ILIKE '%' || p_search || '%'
      OR city       ILIKE '%' || p_search || '%'
      OR country    ILIKE '%' || p_search || '%'
    );
$$;

-- ── RPC: single IP user profile ───────────────────────────
CREATE OR REPLACE FUNCTION get_ip_user_profile(p_ip TEXT)
RETURNS TABLE(
  ip_address    TEXT,
  country       TEXT,
  country_code  TEXT,
  region        TEXT,
  city          TEXT,
  latitude      FLOAT8,
  longitude     FLOAT8,
  session_count BIGINT,
  total_events  BIGINT,
  first_seen    TIMESTAMPTZ,
  last_seen     TIMESTAMPTZ,
  versions      TEXT[],
  platforms     TEXT[]
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    ip_address,
    MAX(country)                                                      AS country,
    MAX(country_code)                                                 AS country_code,
    MAX(region)                                                       AS region,
    MAX(city)                                                         AS city,
    MAX(latitude)                                                     AS latitude,
    MAX(longitude)                                                    AS longitude,
    COUNT(*)                                                          AS session_count,
    SUM(events_count)                                                 AS total_events,
    MIN(started_at)                                                   AS first_seen,
    MAX(last_seen_at)                                                 AS last_seen,
    array_agg(DISTINCT app_version) FILTER (WHERE app_version IS NOT NULL) AS versions,
    array_agg(DISTINCT os_platform) FILTER (WHERE os_platform IS NOT NULL) AS platforms
  FROM sessions
  WHERE ip_address = p_ip
  GROUP BY ip_address;
$$;

-- ── RPC: sessions for a given IP ─────────────────────────
CREATE OR REPLACE FUNCTION get_sessions_for_ip(
  p_ip     TEXT,
  p_limit  INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id           TEXT,
  app_version  TEXT,
  os_platform  TEXT,
  started_at   TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  events_count INT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, app_version, os_platform, started_at, last_seen_at, events_count
  FROM sessions
  WHERE ip_address = p_ip
  ORDER BY last_seen_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ── RPC: event type breakdown for an IP ──────────────────
CREATE OR REPLACE FUNCTION get_event_types_for_ip(p_ip TEXT)
RETURNS TABLE(event_type TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT e.event_type, COUNT(*) AS cnt
  FROM events e
  WHERE e.ip_address = p_ip
  GROUP BY e.event_type
  ORDER BY cnt DESC
  LIMIT 20;
$$;

-- ── RPC: daily events for a user (last 30 days) ──────────
CREATE OR REPLACE FUNCTION get_user_events_over_time(p_ip TEXT)
RETURNS TABLE(day TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    to_char(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
    COUNT(*) AS cnt
  FROM events
  WHERE ip_address = p_ip
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
  ORDER BY day;
$$;
