-- Migration 001: Credits & Subscription System
-- Run this in your Supabase SQL editor

-- ─── Extend users table ──────────────────────────────────────────────────────
-- The users table already exists (created by AuthManager upsert).
-- Add credit and plan columns if not present.
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 100;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'free';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_bonus_granted boolean NOT NULL DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
EXCEPTION WHEN undefined_table THEN
  -- users table doesn't exist yet — create it
  CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub      text UNIQUE NOT NULL,
    email           text,
    name            text,
    picture         text,
    app_version     text,
    os_platform     text,
    last_seen_at    timestamptz DEFAULT now(),
    credits         integer NOT NULL DEFAULT 100,
    plan_type       text NOT NULL DEFAULT 'free',
    plan_expires_at timestamptz,
    signup_bonus_granted boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
  );
END $$;

-- Index for fast lookup by google_sub
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);

-- ─── Credit transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text NOT NULL,          -- google_sub
  amount        integer NOT NULL,       -- positive = credit, negative = debit
  reason        text NOT NULL,          -- 'signup_bonus' | 'ai_usage' | 'topup' | 'refund'
  model         text,                   -- AI model used (for usage records)
  tokens_in     integer,
  tokens_out    integer,
  cost_usd      numeric(10,6),          -- actual cost to us in USD
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

-- ─── Subscriptions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text NOT NULL UNIQUE,    -- google_sub
  plan_type           text NOT NULL,            -- 'free' | 'pro'
  status              text NOT NULL DEFAULT 'active',
  stripe_customer_id  text,
  stripe_sub_id       text,
  period_start        timestamptz,
  period_end          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS: only service role can write, anon can't read ────────────────────────
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — all operations from server use service key
-- No public access policies needed for these tables
