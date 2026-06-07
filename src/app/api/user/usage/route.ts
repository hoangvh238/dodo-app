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

  const url    = new URL(req.url)
  const limit  = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20'))
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  const db = createServiceClient()
  const { data, error } = await db
    .from('credit_transactions')
    .select('id, amount, reason, model, tokens_in, tokens_out, cost_usd, created_at')
    .eq('user_id', identity.sub)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: 'Query failed' }, { status: 500, headers: CORS })
  }

  return NextResponse.json({ transactions: data ?? [] }, { headers: CORS })
}
