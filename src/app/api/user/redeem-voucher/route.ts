import { NextRequest, NextResponse } from 'next/server'
import { verifyGoogleToken, extractBearerToken } from '@/lib/auth/verifyGoogleToken'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// ─── Brute-force guard ────────────────────────────────────────────────────────
// 5 failed attempts per user per 30 minutes → 429
const failMap = new Map<string, { count: number; resetAt: number }>()
const MAX_FAILS    = 5
const WINDOW_MS    = 30 * 60 * 1000

function checkRateLimit(sub: string): boolean {
  const now  = Date.now()
  const entry = failMap.get(sub)
  if (!entry || now > entry.resetAt) {
    failMap.set(sub, { count: 0, resetAt: now + WINDOW_MS })
    return true
  }
  return entry.count < MAX_FAILS
}

function recordFailure(sub: string) {
  const now   = Date.now()
  const entry = failMap.get(sub) ?? { count: 0, resetAt: now + WINDOW_MS }
  entry.count++
  failMap.set(sub, entry)
}

function clearFailures(sub: string) {
  failMap.delete(sub)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
const BodySchema = z.object({
  code: z.string().min(1).max(64).transform(s => s.trim().toUpperCase()),
})

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim().replace(/^::ffff:/i, '')
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(req: NextRequest) {
  // Auth
  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return NextResponse.json({ error: 'Missing auth' }, { status: 401, headers: CORS })

  const identity = await verifyGoogleToken(token)
  if (!identity) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS })

  // Rate limit
  if (!checkRateLimit(identity.sub)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again in 30 minutes.' },
      { status: 429, headers: CORS },
    )
  }

  // Parse body
  let body: z.infer<typeof BodySchema>
  try { body = BodySchema.parse(await req.json()) }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: CORS }) }

  const clientIp = getClientIp(req)
  const db       = createServiceClient()

  // Ensure user exists (they might not have used AI chat yet)
  const { data: user } = await db.from('users').select('google_sub').eq('google_sub', identity.sub).single()
  if (!user) {
    return NextResponse.json({ error: 'Account not found. Open SnapAha and sign in first.' }, { status: 404, headers: CORS })
  }

  // Atomic redemption via RPC (handles locking, expiry, max_uses, uniqueness)
  const { data, error } = await db.rpc('redeem_voucher', {
    p_code:        body.code,
    p_google_sub:  identity.sub,
    p_ip:          clientIp,
  })

  if (error) {
    console.error('[voucher] RPC error:', error.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: CORS })
  }

  const result = data as { ok: boolean; error?: string; credits_added?: number; new_balance?: number; note?: string }

  if (!result.ok) {
    recordFailure(identity.sub)
    const msg: Record<string, string> = {
      invalid_code: 'Invalid voucher code.',
      expired:      'This voucher has expired.',
      exhausted:    'This voucher has been fully redeemed.',
      already_used: 'You have already redeemed this voucher.',
    }
    return NextResponse.json(
      { error: msg[result.error ?? ''] ?? 'Redemption failed.' },
      { status: 400, headers: CORS },
    )
  }

  clearFailures(identity.sub)
  return NextResponse.json({
    ok:            true,
    credits_added: result.credits_added,
    new_balance:   result.new_balance,
    note:          result.note ?? null,
  }, { headers: CORS })
}
