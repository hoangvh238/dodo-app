import { createServiceClient } from '@/lib/supabase/service'
import { SIGNUP_BONUS_CREDITS } from './pricing'

/** Get user credit balance from DB. Returns null if user not found. */
export async function getUserCredits(googleSub: string): Promise<number | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('users')
    .select('credits')
    .eq('google_sub', googleSub)
    .single()
  if (error || !data) return null
  return data.credits as number
}

/**
 * Deduct credits from user account atomically.
 * Returns false if insufficient credits (will not go below 0).
 */
export async function deductCredits(opts: {
  googleSub: string
  credits: number
  reason: string
  model?: string
  tokensIn?: number
  tokensOut?: number
  costUsd?: number
}): Promise<boolean> {
  const db = createServiceClient()

  // Atomic decrement — only if credits >= amount (prevents negative balance)
  const { data, error } = await db.rpc('deduct_credits', {
    p_google_sub: opts.googleSub,
    p_amount:     opts.credits,
  })

  if (error || !data) {
    console.error('[credits] deduct failed:', error?.message)
    return false
  }

  if (!data) return false  // insufficient credits

  // Log the transaction (fire-and-forget — don't block on this)
  db.from('credit_transactions').insert({
    user_id:   opts.googleSub,
    amount:    -opts.credits,
    reason:    opts.reason,
    model:     opts.model ?? null,
    tokens_in: opts.tokensIn ?? null,
    tokens_out: opts.tokensOut ?? null,
    cost_usd:  opts.costUsd ?? null,
  }).then(({ error: txErr }) => {
    if (txErr) console.error('[credits] tx log failed:', txErr.message)
  })

  return true
}

/**
 * Add credits to user account (signup bonus, topup, admin grant).
 */
export async function addCredits(opts: {
  googleSub: string
  credits: number
  reason: string
}): Promise<boolean> {
  const db = createServiceClient()
  const { error } = await db.rpc('add_credits', {
    p_google_sub: opts.googleSub,
    p_amount:     opts.credits,
  })
  if (error) {
    console.error('[credits] add failed:', error.message)
    return false
  }
  await db.from('credit_transactions').insert({
    user_id: opts.googleSub,
    amount:  opts.credits,
    reason:  opts.reason,
  })
  return true
}

/**
 * Grant signup bonus to a new user (idempotent — only grants once).
 * Returns credits granted (0 if already granted).
 */
export async function grantSignupBonus(googleSub: string): Promise<number> {
  const db = createServiceClient()
  const { data, error } = await db.rpc('grant_signup_bonus', {
    p_google_sub: googleSub,
    p_bonus:      SIGNUP_BONUS_CREDITS,
  })
  if (error) {
    console.error('[credits] signup bonus failed:', error.message)
    return 0
  }
  return data ?? 0
}

/** Upsert user record from Google sign-in. Returns current credits. */
export async function syncGoogleUser(user: {
  googleSub: string
  email: string
  name: string
  picture: string
}): Promise<number> {
  const db = createServiceClient()
  const { data: existing } = await db
    .from('users')
    .select('credits, signup_bonus_granted')
    .eq('google_sub', user.googleSub)
    .single()

  await db.from('users').upsert({
    google_sub:   user.googleSub,
    email:        user.email,
    name:         user.name,
    picture:      user.picture,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'google_sub' })

  // Grant signup bonus on first sync
  if (!existing?.signup_bonus_granted) {
    await grantSignupBonus(user.googleSub)
  }

  const credits = await getUserCredits(user.googleSub)
  return credits ?? SIGNUP_BONUS_CREDITS
}
