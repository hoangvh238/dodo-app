'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyPoint { date: string; credits: number; requests: number; costUsd: number }
interface ModelEntry  { model: string; credits: number; requests: number; tokensIn: number; tokensOut: number; costUsd: number }
interface TopUser     { userId: string; email: string; name: string | null; picture: string | null; credits: number; requests: number; costUsd: number }

interface Data {
  days: number
  summary: { totalCredits: number; totalRequests: number; totalCostUsd: number; uniqueUsers: number }
  daily: DailyPoint[]
  modelBreakdown: ModelEntry[]
  topUsers: TopUser[]
}

const MODEL_LABELS: Record<string, string> = {
  'gemini-2.0-flash':      'Gemini Flash',
  'gemini-2.5-flash':      'Gemini 2.5 Flash',
  'gemini-2.5-pro':        'Gemini 2.5 Pro',
  'claude-haiku-4-5-20251001': 'Claude Haiku',
  'claude-sonnet-4-6':     'Claude Sonnet',
  'gpt-4o-mini':           'GPT-4o mini',
  'gpt-4o':                'GPT-4o',
}

const BAR_COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8']

const DAYS_OPTIONS = [7, 14, 30, 60, 90]

export default function AiUsageDashboard({ data }: { data: Data }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [, start] = useTransition()

  function setDays(d: number) {
    start(() => { router.push(`${pathname}?days=${d}`) })
  }

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-5">
      {/* Day filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">Period:</span>
        {DAYS_OPTIONS.map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              data.days === d
                ? 'bg-indigo-600/80 text-white'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200',
            )}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Credits Consumed', value: data.summary.totalCredits.toLocaleString(), sub: `≈ $${(data.summary.totalCredits * 0.001).toFixed(2)} revenue` },
          { label: 'AI Requests',      value: data.summary.totalRequests.toLocaleString(), sub: `avg ${data.summary.totalRequests > 0 ? (data.summary.totalCredits / data.summary.totalRequests).toFixed(1) : 0} cr each` },
          { label: 'Provider Cost',    value: `$${data.summary.totalCostUsd.toFixed(2)}`,   sub: `margin $${((data.summary.totalCredits * 0.001) - data.summary.totalCostUsd).toFixed(2)}` },
          { label: 'Active Users',     value: data.summary.uniqueUsers.toString(),           sub: `past ${data.days} days` },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Daily credits chart */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Daily Credit Consumption</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.daily} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#818cf8' }}
              formatter={(v: number) => [`${v.toLocaleString()} cr`, 'Credits']}
              labelFormatter={fmtDate}
            />
            <Area type="monotone" dataKey="credits" stroke="#818cf8" strokeWidth={2} fill="url(#areaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Model breakdown */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Model Breakdown</h3>
          {data.modelBreakdown.length === 0
            ? <p className="text-slate-600 text-sm py-8 text-center">No data</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.modelBreakdown.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="model" tickFormatter={m => MODEL_LABELS[m] ?? m} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip
                      contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v.toLocaleString()} cr`, 'Credits']}
                    />
                    <Bar dataKey="credits" radius={[0, 4, 4, 0]}>
                      {data.modelBreakdown.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {data.modelBreakdown.slice(0, 6).map((m, i) => (
                    <div key={m.model} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        <span className="text-slate-400">{MODEL_LABELS[m.model] ?? m.model}</span>
                      </span>
                      <span className="text-slate-500">{m.requests.toLocaleString()} req · {m.credits.toLocaleString()} cr</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

        {/* Top users */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-slate-300">Top Consumers</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {data.topUsers.slice(0, 10).map((u, i) => (
              <Link
                key={u.userId}
                href={`/admin/registered-users/${encodeURIComponent(u.userId)}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-xs text-slate-600 w-4 shrink-0">{i + 1}</span>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center">
                  {u.picture
                    ? <img src={u.picture} alt="" className="w-full h-full object-cover" />
                    : <User size={12} className="text-slate-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 font-medium truncate">{u.name ?? u.email}</p>
                  <p className="text-xs text-slate-600 truncate">{u.requests} requests</p>
                </div>
                <span className="text-sm font-bold font-mono text-indigo-400 shrink-0">{u.credits.toLocaleString()} cr</span>
              </Link>
            ))}
            {data.topUsers.length === 0 && (
              <p className="px-5 py-8 text-center text-slate-600 text-sm">No usage data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
