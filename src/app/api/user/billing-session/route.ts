/**
 * POST /api/user/billing-session
 * Exchange a Google access token for a short-lived (10 min) HMAC-signed session ID.
 * The session ID is safe to embed in a URL — it doesn't expose the raw Google token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyGoogleToken, extractBearerToken } from '@/lib/auth/verifyGoogleToken'
import { createBillingSession } from '@/lib/auth/billingSession'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401, headers: CORS })

  const identity = await verifyGoogleToken(token)
  if (!identity) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401, headers: CORS })

  const sid = await createBillingSession(identity.sub, identity.email)
  return NextResponse.json({ sid }, { headers: CORS })
}
