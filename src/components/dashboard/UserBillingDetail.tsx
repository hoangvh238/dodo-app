'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, CreditCard, User, Clock, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserRow {
  google_sub: string
  email: string
  name: string | null
  picture: string | null
  app_version: string | null
  os_platform: string | null
  credits: number
  plan_type: string
  plan_expires_at: string | null
  signup_bonus_granted: boolean
  created_at: string
  last_seen_at: string
}

interface Transaction {
  id: string
  amount: number
  reason: string
  model: string | null
  tokens_in: number | null
  tokens_out: number | null
  cost_usd: string | null
  created_at: string
}

const MODEL_LABELS: Record<string, string> = {
  'gemini-2.0-flash':      'Gemini 2.0 Flash',
  'gemini-2.5-flash':      'Gemini 2.5 Flash',
  'gemini-2.5-pro':        'Gemini 2.5 Pro',
  'claude-haiku-4-5-20251001': 'Claude Haiku',
  'claude-sonnet-4-6':     'Claude Sonnet',
  'gpt-4o-mini':           'GPT-4o mini',
  'gpt-4o':                'GPT-4o',
}

const REASON_LABELS: Record<string, string> = {
  ai_usage:     'AI Request',
  ai_reservation: 'Reservation',
  signup_bonus: 'Signup Bonus',
  topup:        'Top Up',
  refund:       'Refund',
  admin_grant:  'Admin Grant',
  admin_deduct: 'Admin Deduct',
  adjustment:   'Adjustment',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props { user: UserRow; transactions: Transaction[] }

export default function UserBillingDetail({ user, transactions }: Props) {
  const [credits, setCredits] = useState(user.credits)
  const [txns, setTxns]       = useState(transactions)
  const [amount, setAmount]   = useState('')
  const [reason, setReason]   = useState<'admin_grant' | 'admin_deduct' | 'topup' | 'refund' | 'adjustment'>('admin_grant')
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const usageOnly  = txns.filter(t => t.amount < 0 && t.reason === 'ai_usage')
  const totalSpent = usageOnly.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalCost  = usageOnly.reduce((s, t) => s + parseFloat(t.cost_usd ?? '0'), 0)

  async function handleCreditChange(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(amount)
    if (!n || isNaN(n)) return
    const sign = reason === 'admin_deduct' ? -n : n
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/registered-users/${encodeURIComponent(user.google_sub)}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: sign, reason, note }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error ?? 'Failed' }); return }
      setCredits(data.newBalance)
      setAmount('')
      setNote('')
      setMsg({ type: 'ok', text: `Balance updated to ${data.newBalance.toLocaleString()} cr` })
      // Refresh transactions
      const r2 = await fetch(`/api/admin/registered-users/${encodeURIComponent(user.google_sub)}`)
      if (r2.ok) { const d2 = await r2.json(); setTxns(d2.transactions ?? []) }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/admin/registered-users" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <ChevronLeft size={16} /> Registered Users
      </Link>

      {/* Profile header */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center">
          {user.picture
            ? <img src={user.picture} alt="" className="w-full h-full object-cover" />
            : <User size={24} className="text-slate-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-100">{user.name ?? '—'}</h2>
          <p className="text-slate-400 text-sm">{user.email}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={12} />Joined {fmt(user.created_at)}</span>
            <span className="flex items-center gap-1"><Clock size={12} />Last seen {fmt(user.last_seen_at)}</span>
            {user.app_version && <span>v{user.app_version}</span>}
            {user.os_platform && <span>{user.os_platform}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={cn(
            'text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full',
            user.plan_type === 'pro' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700 text-slate-300',
          )}>
            {user.plan_type}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Current Balance', value: credits.toLocaleString() + ' cr', sub: `≈ $${(credits * 0.001).toFixed(2)} USD`, color: credits < 10 ? 'text-red-400' : credits < 50 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'Total Spent',     value: totalSpent.toLocaleString() + ' cr', sub: `${usageOnly.length} requests`, color: 'text-slate-100' },
          { label: 'Provider Cost',   value: `$${totalCost.toFixed(4)}`, sub: 'before markup', color: 'text-slate-100' },
          { label: 'Transactions',    value: txns.length.toString(), sub: 'last 100', color: 'text-slate-100' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Credit adjustment */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Adjust Credits</h3>
          </div>
          <form onSubmit={handleCreditChange} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Action</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as typeof reason)}
                className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
              >
                <option value="admin_grant">Grant credits</option>
                <option value="admin_deduct">Deduct credits</option>
                <option value="topup">Top-up (paid)</option>
                <option value="refund">Refund</option>
                <option value="adjustment">Manual adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Amount</label>
              <input
                type="number"
                min="1"
                max="100000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Note (optional)</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Reason…"
                className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            {msg && (
              <p className={cn('text-xs px-3 py-2 rounded-lg', msg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                {msg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving || !amount}
              className="w-full py-2 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Apply'}
            </button>
          </form>
        </div>

        {/* Transactions list */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Transaction History</h3>
            <span className="text-xs text-slate-600">{txns.length} records</span>
          </div>
          <div className="overflow-y-auto max-h-[440px] divide-y divide-white/[0.04]">
            {txns.length === 0 && (
              <p className="px-5 py-8 text-center text-slate-600 text-sm">No transactions yet</p>
            )}
            {txns.map(t => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    t.amount > 0 ? 'bg-emerald-500/20' : 'bg-slate-700/60',
                  )}>
                    {t.amount > 0
                      ? <ArrowUpRight size={12} className="text-emerald-400" />
                      : <ArrowDownRight size={12} className="text-slate-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 font-medium leading-tight">
                      {REASON_LABELS[t.reason] ?? t.reason}
                      {t.model && <span className="text-slate-600 font-normal ml-1.5 text-xs">· {MODEL_LABELS[t.model] ?? t.model}</span>}
                    </p>
                    <p className="text-xs text-slate-600">
                      {fmtTs(t.created_at)}
                      {t.tokens_in != null && (
                        <span className="ml-2">{((t.tokens_in) + (t.tokens_out ?? 0)).toLocaleString()} tok</span>
                      )}
                      {t.cost_usd && parseFloat(t.cost_usd) > 0 && (
                        <span className="ml-2">${parseFloat(t.cost_usd).toFixed(5)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  'text-sm font-bold font-mono shrink-0 ml-4',
                  t.amount > 0 ? 'text-emerald-400' : 'text-slate-400',
                )}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
