export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import AiUsageDashboard from '@/components/dashboard/AiUsageDashboard'

async function getAiUsage(days: number) {
  const db    = createServiceClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: rows } = await db
    .from('credit_transactions')
    .select('user_id, amount, model, tokens_in, tokens_out, cost_usd, created_at')
    .lt('amount', 0)
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  const txns = rows ?? []

  // Daily buckets
  const daily: Record<string, { credits: number; requests: number; costUsd: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    daily[d.toISOString().slice(0, 10)] = { credits: 0, requests: 0, costUsd: 0 }
  }
  for (const r of txns) {
    const day = r.created_at.slice(0, 10)
    if (day in daily) {
      daily[day].credits  += Math.abs(r.amount)
      daily[day].requests += 1
      daily[day].costUsd  += parseFloat(r.cost_usd ?? '0')
    }
  }

  // Model breakdown
  const modelMap: Record<string, { credits: number; requests: number; tokensIn: number; tokensOut: number; costUsd: number }> = {}
  for (const r of txns) {
    const m = r.model ?? 'unknown'
    if (!modelMap[m]) modelMap[m] = { credits: 0, requests: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 }
    modelMap[m].credits  += Math.abs(r.amount)
    modelMap[m].requests += 1
    modelMap[m].tokensIn  += r.tokens_in  ?? 0
    modelMap[m].tokensOut += r.tokens_out ?? 0
    modelMap[m].costUsd  += parseFloat(r.cost_usd ?? '0')
  }

  // Top users
  const userMap: Record<string, { credits: number; requests: number; costUsd: number }> = {}
  for (const r of txns) {
    const uid = r.user_id
    if (!userMap[uid]) userMap[uid] = { credits: 0, requests: 0, costUsd: 0 }
    userMap[uid].credits  += Math.abs(r.amount)
    userMap[uid].requests += 1
    userMap[uid].costUsd  += parseFloat(r.cost_usd ?? '0')
  }

  const topUserIds = Object.entries(userMap).sort((a, b) => b[1].credits - a[1].credits).slice(0, 20).map(([uid]) => uid)
  const { data: userRows } = topUserIds.length > 0
    ? await db.from('users').select('google_sub, email, name, picture').in('google_sub', topUserIds)
    : { data: [] }
  const userInfoMap = Object.fromEntries((userRows ?? []).map(u => [u.google_sub, u]))

  const topUsers = Object.entries(userMap)
    .sort((a, b) => b[1].credits - a[1].credits)
    .slice(0, 20)
    .map(([uid, s]) => ({ userId: uid, email: userInfoMap[uid]?.email ?? uid, name: userInfoMap[uid]?.name ?? null, picture: userInfoMap[uid]?.picture ?? null, ...s }))

  const totalCredits  = txns.reduce((s, r) => s + Math.abs(r.amount), 0)
  const totalRequests = txns.length
  const totalCostUsd  = txns.reduce((s, r) => s + parseFloat(r.cost_usd ?? '0'), 0)
  const uniqueUsers   = new Set(txns.map(r => r.user_id)).size

  return {
    days,
    summary: { totalCredits, totalRequests, totalCostUsd, uniqueUsers },
    daily:   Object.entries(daily).map(([date, v]) => ({ date, ...v })),
    modelBreakdown: Object.entries(modelMap).map(([model, s]) => ({ model, ...s })).sort((a, b) => b.credits - a.credits),
    topUsers,
  }
}

export default async function AiUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const params = await searchParams
  const days   = Math.min(90, Math.max(7, parseInt(params.days ?? '30')))
  const data   = await getAiUsage(days)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">AI Usage</h1>
        <p className="text-slate-500 text-sm mt-0.5">Credit consumption, costs, and model breakdown</p>
      </div>
      <AiUsageDashboard data={data} />
    </div>
  )
}
