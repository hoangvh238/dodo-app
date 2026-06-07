/**
 * GET /api/user/billing-data?sid=<billing_session_id>
 * Returns credits + recent transactions for the billing dashboard page.
 * Accepts the short-lived HMAC session token instead of a raw Google token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyBillingSession } from '@/lib/auth/billingSession'
import { createServiceClient } from '@/lib/supabase/service'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const sid = new URL(req.url).searchParams.get('sid')
  if (!sid) return NextResponse.json({ error: 'Missing session' }, { status: 401, headers: CORS })

  const session = await verifyBillingSession(sid)
  if (!session) return NextResponse.json({ error: 'Invalid or expired session. Please re-open from the app.' }, { status: 401, headers: CORS })

  const db = createServiceClient()

  const [creditsRes, txnsRes] = await Promise.all([
    db.from('users')
      .select('credits, plan_type, plan_expires_at, email')
      .eq('google_sub', session.sub)
      .single(),
    db.from('credit_transactions')
      .select('id, amount, reason, model, tokens_in, tokens_out, cost_usd, created_at')
      .eq('user_id', session.sub)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (creditsRes.error || !creditsRes.data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS })
  }

  return NextResponse.json({
    credits:      creditsRes.data.credits,
    plan:         creditsRes.data.plan_type ?? 'free',
    expiresAt:    creditsRes.data.plan_expires_at ?? null,
    email:        creditsRes.data.email ?? session.email,
    transactions: txnsRes.data ?? [],
  }, { headers: CORS })
}
