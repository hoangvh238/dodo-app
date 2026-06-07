-- Migration 011: Voucher codes + IP-based signup bonus detection

-- ─── Voucher codes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouchers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        UNIQUE NOT NULL,          -- stored UPPERCASE, trimmed
  credits     INT         NOT NULL CHECK (credits > 0),
  max_uses    INT         DEFAULT 1,                -- NULL = unlimited
  used_count  INT         NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  note        TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code     ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active   ON vouchers(is_active, expires_at);

-- No user-facing RLS — service role only
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- ─── Redemption history ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id  UUID        NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  google_sub  TEXT        NOT NULL,
  ip_address  TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(voucher_id, google_sub)   -- 1 use per user per voucher (DB-enforced)
);

CREATE INDEX IF NOT EXISTS idx_vr_voucher ON voucher_redemptions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vr_user    ON voucher_redemptions(google_sub);

ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- ─── IP tracking on users ─────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip         TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_bonus_factor   NUMERIC NOT NULL DEFAULT 1.0;

CREATE INDEX IF NOT EXISTS idx_users_signup_ip ON users(signup_ip) WHERE signup_ip IS NOT NULL;

-- ─── Atomic voucher redemption RPC ───────────────────────────────────────────
-- SECURITY DEFINER: bypasses RLS so it can read/write vouchers table.
-- Uses FOR UPDATE row lock to prevent race-condition double-redemptions.
CREATE OR REPLACE FUNCTION redeem_voucher(
  p_code       TEXT,
  p_google_sub TEXT,
  p_ip         TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row    vouchers%ROWTYPE;
  v_used   BOOLEAN;
  v_bal    INT;
BEGIN
  -- Lock the row to prevent concurrent redemptions of the same code
  SELECT * INTO v_row
  FROM   vouchers
  WHERE  code = UPPER(TRIM(p_code))
    AND  is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'invalid_code');
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < NOW() THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'expired');
  END IF;

  IF v_row.max_uses IS NOT NULL AND v_row.used_count >= v_row.max_uses THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'exhausted');
  END IF;

  -- One use per user (unique constraint is the hard guard; this is a friendlier check)
  SELECT EXISTS(
    SELECT 1 FROM voucher_redemptions
    WHERE  voucher_id = v_row.id AND google_sub = p_google_sub
  ) INTO v_used;

  IF v_used THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'already_used');
  END IF;

  -- Record
  INSERT INTO voucher_redemptions(voucher_id, google_sub, ip_address)
  VALUES (v_row.id, p_google_sub, p_ip);

  UPDATE vouchers SET used_count = used_count + 1 WHERE id = v_row.id;

  -- Credit the user
  UPDATE users
     SET credits = credits + v_row.credits
   WHERE google_sub = p_google_sub
  RETURNING credits INTO v_bal;

  INSERT INTO credit_transactions(user_id, amount, reason)
  VALUES (p_google_sub, v_row.credits, 'voucher');

  RETURN jsonb_build_object(
    'ok',            TRUE,
    'credits_added', v_row.credits,
    'new_balance',   v_bal,
    'note',          v_row.note
  );
END;
$$;

-- ─── IP-aware signup helper ───────────────────────────────────────────────────
-- Returns how many other users signed up from the same IP.
-- Used by the app server to decide the signup bonus factor.
CREATE OR REPLACE FUNCTION count_ip_accounts(p_ip TEXT, p_exclude_sub TEXT)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INT
  FROM   users
  WHERE  signup_ip = p_ip
    AND  google_sub <> p_exclude_sub;
$$;
