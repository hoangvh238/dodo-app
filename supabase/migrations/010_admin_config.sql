-- ============================================================
-- Migration 010: Admin configuration table
-- Stores sensitive runtime config (API keys, etc.) accessible
-- only via service role. Authenticated users cannot read.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_config (
  key         TEXT        PRIMARY KEY,
  value       TEXT        NOT NULL DEFAULT '',
  description TEXT,
  is_secret   BOOLEAN     NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT        -- email of admin who last changed this value
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service role (bypasses RLS) can access.
-- This prevents dashboard users from reading raw API keys.

-- Seed default key slots (empty — admin fills them in via UI)
INSERT INTO public.admin_config (key, description) VALUES
  ('anthropic_api_key', 'Anthropic Claude API key (sk-ant-...)'),
  ('google_ai_api_key', 'Google Gemini API key'),
  ('openai_api_key',    'OpenAI API key (sk-...)')
ON CONFLICT (key) DO NOTHING;
