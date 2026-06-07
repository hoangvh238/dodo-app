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
  if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401, headers: CORS })

  const identity = await verifyGoogleToken(token)
  if (!identity) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS })

  const db = createServiceClient()

  // Verify user exists
  const { data: userRow } = await db.from('users').select('credits').eq('google_sub', identity.sub).single()
  if (!userRow) {
    // New user with no history — return empty summary
    const emptyDaily = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
      return { date: d.toISOString().slice(0, 10), credits: 0 }
    })
    return NextResponse.json({
      daily: emptyDaily, totalCreditsUsed: 0, totalRequests: 0,
      totalTokensIn: 0, totalTokensOut: 0, weekCredits: 0, modelBreakdown: [],
    }, { headers: CORS })
  }

  // Fetch last 30 days of transactions for this user
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error } = await db
    .from('credit_transactions')
    .select('amount, reason, model, tokens_in, tokens_out, created_at')
    .eq('user_id', identity.sub)
    .lt('amount', 0)              // only deductions (usage), not top-ups
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500, headers: CORS })

  const transactions = rows ?? []

  // Build daily buckets for last 7 days
  const daily: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)   // "YYYY-MM-DD"
    daily[key] = 0
  }
  for (const row of transactions) {
    const day = row.created_at.slice(0, 10)
    if (day in daily) daily[day] += Math.abs(row.amount)
  }

  // Model usage breakdown
  const modelMap: Record<string, { credits: number; requests: number; tokensIn: number; tokensOut: number }> = {}
  for (const row of transactions) {
    const m = row.model ?? 'unknown'
    if (!modelMap[m]) modelMap[m] = { credits: 0, requests: 0, tokensIn: 0, tokensOut: 0 }
    modelMap[m].credits  += Math.abs(row.amount)
    modelMap[m].requests += 1
    modelMap[m].tokensIn  += row.tokens_in  ?? 0
    modelMap[m].tokensOut += row.tokens_out ?? 0
  }
  const modelBreakdown = Object.entries(modelMap)
    .map(([model, s]) => ({ model, ...s }))
    .sort((a, b) => b.credits - a.credits)

  // Totals
  const totalCreditsUsed = transactions.reduce((s, r) => s + Math.abs(r.amount), 0)
  const totalRequests    = transactions.length
  const totalTokensIn    = transactions.reduce((s, r) => s + (r.tokens_in  ?? 0), 0)
  const totalTokensOut   = transactions.reduce((s, r) => s + (r.tokens_out ?? 0), 0)

  // Last 7 days total
  const weekCredits = Object.values(daily).reduce((s, v) => s + v, 0)

  return NextResponse.json({
    daily:             Object.entries(daily).map(([date, credits]) => ({ date, credits })),
    totalCreditsUsed,
    totalRequests,
    totalTokensIn,
    totalTokensOut,
    weekCredits,
    modelBreakdown:    modelBreakdown.slice(0, 5),
  }, { headers: CORS })
}
