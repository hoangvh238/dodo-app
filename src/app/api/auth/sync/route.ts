import { NextRequest, NextResponse } from 'next/server'
import { verifyGoogleToken, extractBearerToken } from '@/lib/auth/verifyGoogleToken'
import { syncGoogleUser } from '@/lib/credits'
import { createServiceClient } from '@/lib/supabase/service'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/** Called by Electron after Google sign-in to sync user and get credits */
export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401, headers: CORS })
  }

  const identity = await verifyGoogleToken(token)
  if (!identity) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS })
  }

  let name = identity.email
  let picture = ''
  try {
    const body = await req.json()
    if (body.name)    name    = body.name
    if (body.picture) picture = body.picture
  } catch { /* optional body */ }

  const credits = await syncGoogleUser({
    googleSub: identity.sub,
    email:     identity.email,
    name,
    picture,
  })

  // Get plan info
  const db = createServiceClient()
  const { data: user } = await db
    .from('users')
    .select('plan_type, plan_expires_at, created_at')
    .eq('google_sub', identity.sub)
    .single()

  return NextResponse.json({
    credits,
    plan:      user?.plan_type  ?? 'free',
    expiresAt: user?.plan_expires_at ?? null,
    sub:       identity.sub,
    email:     identity.email,
  }, { headers: CORS })
}
