-- Migration 002: Atomic credit management functions

-- ─── deduct_credits ───────────────────────────────────────────────────────────
-- Atomically deducts credits from a user.
-- Returns TRUE if successful, FALSE if insufficient credits.
CREATE OR REPLACE FUNCTION deduct_credits(
  p_google_sub text,
  p_amount     integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
BEGIN
  SELECT credits INTO v_current FROM users WHERE google_sub = p_google_sub FOR UPDATE;
  IF NOT FOUND OR v_current < p_amount THEN
    RETURN false;
  END IF;
  UPDATE users SET credits = credits - p_amount WHERE google_sub = p_google_sub;
  RETURN true;
END;
$$;

-- ─── add_credits ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_credits(
  p_google_sub text,
  p_amount     integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET credits = credits + p_amount WHERE google_sub = p_google_sub;
END;
$$;

-- ─── grant_signup_bonus ───────────────────────────────────────────────────────
-- Grants signup bonus ONCE per user. Returns credits granted (0 if already granted).
CREATE OR REPLACE FUNCTION grant_signup_bonus(
  p_google_sub text,
  p_bonus      integer DEFAULT 100
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already boolean;
BEGIN
  SELECT signup_bonus_granted INTO v_already FROM users WHERE google_sub = p_google_sub;
  IF NOT FOUND OR v_already THEN
    RETURN 0;
  END IF;
  UPDATE users
    SET credits = credits + p_bonus,
        signup_bonus_granted = true
  WHERE google_sub = p_google_sub;
  RETURN p_bonus;
END;
$$;
