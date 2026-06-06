-- ============================================================
-- Migration 007: AI usage & cost tracking
-- Goals:
--   1. Fix geo aggregation (use most-recent session, not MAX())
--   2. Add RPCs to aggregate token usage from event_data JSONB
--   3. Add cost estimation helpers (Claude pricing)
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Indexes to accelerate event_data JSON queries ─────────
CREATE INDEX IF NOT EXISTS events_event_type_created_idx
  ON events(event_type, created_at DESC);

-- ── Fix: get_ip_users — geo from most-recent session ──────
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
  WITH agg AS (
    SELECT
      ip_address,
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
        OR ip_address ILIKE '%' || p_search || '%'
        OR city        ILIKE '%' || p_search || '%'
        OR country     ILIKE '%' || p_search || '%'
      )
    GROUP BY ip_address
  ),
  latest_geo AS (
    SELECT DISTINCT ON (ip_address)
      ip_address,
      country, country_code, region, city, latitude, longitude
    FROM sessions
    WHERE ip_address IS NOT NULL
      AND ip_address NOT IN ('', 'unknown', '127.0.0.1', '::1', 'localhost')
    ORDER BY ip_address, last_seen_at DESC
  )
  SELECT
    a.ip_address,
    g.country, g.country_code, g.region, g.city, g.latitude, g.longitude,
    a.session_count,
    a.total_events,
    a.first_seen,
    a.last_seen
  FROM agg a
  LEFT JOIN latest_geo g USING (ip_address)
  ORDER BY a.last_seen DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;

-- ── Fix: get_ip_user_profile — geo from most-recent session ─
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
  WITH agg AS (
    SELECT
      ip_address,
      COUNT(*)           AS session_count,
      SUM(events_count)  AS total_events,
      MIN(started_at)    AS first_seen,
      MAX(last_seen_at)  AS last_seen,
      array_agg(DISTINCT app_version) FILTER (WHERE app_version IS NOT NULL) AS versions,
      array_agg(DISTINCT os_platform) FILTER (WHERE os_platform IS NOT NULL) AS platforms
    FROM sessions
    WHERE ip_address = p_ip
    GROUP BY ip_address
  ),
  latest_geo AS (
    SELECT DISTINCT ON (ip_address)
      ip_address, country, country_code, region, city, latitude, longitude
    FROM sessions
    WHERE ip_address = p_ip
    ORDER BY ip_address, last_seen_at DESC
  )
  SELECT
    a.ip_address,
    g.country, g.country_code, g.region, g.city, g.latitude, g.longitude,
    a.session_count, a.total_events, a.first_seen, a.last_seen,
    a.versions, a.platforms
  FROM agg a
  LEFT JOIN latest_geo g USING (ip_address);
$$;

-- ── Claude model pricing (USD per 1M tokens) ──────────────
-- Used for cost estimation in RPCs below.
-- Update these when Anthropic changes pricing.
CREATE OR REPLACE FUNCTION claude_input_price_per_mtok(model_name TEXT)
RETURNS FLOAT8 LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN model_name ILIKE '%opus%'   THEN 15.0
    WHEN model_name ILIKE '%sonnet%' THEN 3.0
    WHEN model_name ILIKE '%haiku%'  THEN 0.8
    ELSE 3.0  -- default to Sonnet pricing
  END;
$$;

CREATE OR REPLACE FUNCTION claude_output_price_per_mtok(model_name TEXT)
RETURNS FLOAT8 LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN model_name ILIKE '%opus%'   THEN 75.0
    WHEN model_name ILIKE '%sonnet%' THEN 15.0
    WHEN model_name ILIKE '%haiku%'  THEN 4.0
    ELSE 15.0  -- default to Sonnet pricing
  END;
$$;

-- ── RPC: AI usage aggregated by IP ────────────────────────
-- Reads event_data JSONB from ai_query_success events.
-- Expected event_data shape: { model, input_tokens, output_tokens, duration_ms }
CREATE OR REPLACE FUNCTION get_ai_usage_for_ip(p_ip TEXT)
RETURNS TABLE(
  model          TEXT,
  query_count    BIGINT,
  input_tokens   BIGINT,
  output_tokens  BIGINT,
  total_tokens   BIGINT,
  estimated_cost_usd FLOAT8
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(event_data->>'model', 'unknown')          AS model,
    COUNT(*)                                            AS query_count,
    COALESCE(SUM((event_data->>'input_tokens')::BIGINT), 0)  AS input_tokens,
    COALESCE(SUM((event_data->>'output_tokens')::BIGINT), 0) AS output_tokens,
    COALESCE(
      SUM((event_data->>'input_tokens')::BIGINT) +
      SUM((event_data->>'output_tokens')::BIGINT), 0
    )                                                   AS total_tokens,
    ROUND((
      COALESCE(SUM((event_data->>'input_tokens')::BIGINT), 0)  / 1000000.0
        * claude_input_price_per_mtok(COALESCE(event_data->>'model', 'sonnet'))
      +
      COALESCE(SUM((event_data->>'output_tokens')::BIGINT), 0) / 1000000.0
        * claude_output_price_per_mtok(COALESCE(event_data->>'model', 'sonnet'))
    )::NUMERIC, 6)::FLOAT8                              AS estimated_cost_usd
  FROM events
  WHERE ip_address = p_ip
    AND event_type = 'ai_query_success'
    AND event_data ? 'model'
  GROUP BY event_data->>'model'
  ORDER BY query_count DESC;
$$;

-- ── RPC: AI usage summary across all users ────────────────
CREATE OR REPLACE FUNCTION get_ai_usage_summary(
  from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  to_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  model              TEXT,
  query_count        BIGINT,
  unique_users       BIGINT,
  input_tokens       BIGINT,
  output_tokens      BIGINT,
  total_tokens       BIGINT,
  estimated_cost_usd FLOAT8
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(event_data->>'model', 'unknown')               AS model,
    COUNT(*)                                                 AS query_count,
    COUNT(DISTINCT ip_address)                               AS unique_users,
    COALESCE(SUM((event_data->>'input_tokens')::BIGINT), 0)  AS input_tokens,
    COALESCE(SUM((event_data->>'output_tokens')::BIGINT), 0) AS output_tokens,
    COALESCE(
      SUM((event_data->>'input_tokens')::BIGINT) +
      SUM((event_data->>'output_tokens')::BIGINT), 0
    )                                                        AS total_tokens,
    ROUND((
      COALESCE(SUM((event_data->>'input_tokens')::BIGINT), 0)  / 1000000.0
        * claude_input_price_per_mtok(COALESCE(event_data->>'model', 'sonnet'))
      +
      COALESCE(SUM((event_data->>'output_tokens')::BIGINT), 0) / 1000000.0
        * claude_output_price_per_mtok(COALESCE(event_data->>'model', 'sonnet'))
    )::NUMERIC, 4)::FLOAT8                                   AS estimated_cost_usd
  FROM events
  WHERE event_type = 'ai_query_success'
    AND created_at BETWEEN from_date AND to_date
    AND event_data ? 'model'
  GROUP BY event_data->>'model'
  ORDER BY total_tokens DESC;
$$;

-- ── RPC: per-user AI cost summary (for users table) ───────
-- Returns one row per IP with aggregated AI costs across all models.
CREATE OR REPLACE FUNCTION get_ai_cost_per_user(
  from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  to_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  ip_address         TEXT,
  query_count        BIGINT,
  total_tokens       BIGINT,
  estimated_cost_usd FLOAT8
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    ip_address,
    COUNT(*)                                                 AS query_count,
    COALESCE(
      SUM((event_data->>'input_tokens')::BIGINT) +
      SUM((event_data->>'output_tokens')::BIGINT), 0
    )                                                        AS total_tokens,
    ROUND(SUM(
      (COALESCE((event_data->>'input_tokens')::BIGINT, 0) / 1000000.0
        * claude_input_price_per_mtok(COALESCE(event_data->>'model', 'sonnet')))
      +
      (COALESCE((event_data->>'output_tokens')::BIGINT, 0) / 1000000.0
        * claude_output_price_per_mtok(COALESCE(event_data->>'model', 'sonnet')))
    )::NUMERIC, 6)::FLOAT8                                   AS estimated_cost_usd
  FROM events
  WHERE event_type = 'ai_query_success'
    AND created_at BETWEEN from_date AND to_date
    AND ip_address IS NOT NULL
    AND ip_address NOT IN ('', 'unknown', '127.0.0.1', '::1', 'localhost')
  GROUP BY ip_address
  ORDER BY estimated_cost_usd DESC;
$$;

-- ── RPC: daily AI cost trend (last 30 days) ───────────────
CREATE OR REPLACE FUNCTION get_ai_cost_over_time(
  from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  to_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(day TEXT, query_count BIGINT, total_tokens BIGINT, estimated_cost_usd FLOAT8)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    to_char(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
    COUNT(*)                                                                  AS query_count,
    COALESCE(
      SUM((event_data->>'input_tokens')::BIGINT) +
      SUM((event_data->>'output_tokens')::BIGINT), 0
    )                                                                         AS total_tokens,
    ROUND(SUM(
      (COALESCE((event_data->>'input_tokens')::BIGINT, 0) / 1000000.0
        * claude_input_price_per_mtok(COALESCE(event_data->>'model', 'sonnet')))
      +
      (COALESCE((event_data->>'output_tokens')::BIGINT, 0) / 1000000.0
        * claude_output_price_per_mtok(COALESCE(event_data->>'model', 'sonnet')))
    )::NUMERIC, 6)::FLOAT8                                                    AS estimated_cost_usd
  FROM events
  WHERE event_type = 'ai_query_success'
    AND created_at BETWEEN from_date AND to_date
    AND event_data ? 'model'
  GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
  ORDER BY day;
$$;
