import { NextRequest, NextResponse } from 'next/server'
import { verifyGoogleToken, extractBearerToken } from '@/lib/auth/verifyGoogleToken'
import { createServiceClient } from '@/lib/supabase/service'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401, headers: CORS })
  }

  const identity = await verifyGoogleToken(token)
  if (!identity) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('users')
    .select('credits, plan_type, plan_expires_at')
    .eq('google_sub', identity.sub)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS })
  }

  return NextResponse.json({
    credits:   data.credits,
    plan:      data.plan_type,
    expiresAt: data.plan_expires_at ?? null,
  }, { headers: CORS })
}
