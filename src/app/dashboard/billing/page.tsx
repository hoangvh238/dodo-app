'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UserData {
  credits: number
  plan: string
  expiresAt: string | null
  email?: string
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

const PLAN_COLORS: Record<string, string> = {
  free: 'from-slate-500 to-slate-600',
  pro:  'from-amber-500 to-orange-500',
}

const REASON_LABELS: Record<string, string> = {
  ai_usage:     'AI Request',
  signup_bonus: 'Welcome Bonus',
  topup:        'Top Up',
  refund:       'Refund',
}

export default function BillingPage() {
  const [token, setToken]       = useState<string | null>(null)
  const [user, setUser]         = useState<UserData | null>(null)
  const [txns, setTxns]         = useState<Transaction[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  // Extract token from URL query param (set by Electron)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      sessionStorage.setItem('snapaha_token', t)
      // Remove token from URL bar for security
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      setToken(t)
    } else {
      const stored = sessionStorage.getItem('snapaha_token')
      if (stored) setToken(stored)
      else setError('No auth token. Please open this page from the Snapaha app.')
    }
  }, [])

  const fetchData = useCallback(async (t: string) => {
    setLoading(true)
    try {
      const [creditsRes, usageRes] = await Promise.all([
        fetch('/api/user/credits', { headers: { Authorization: `Bearer ${t}` } }),
        fetch('/api/user/usage?limit=30', { headers: { Authorization: `Bearer ${t}` } }),
      ])
      if (!creditsRes.ok) throw new Error('Failed to fetch credits')
      const credits = await creditsRes.json()
      const usage   = usageRes.ok ? await usageRes.json() : { transactions: [] }
      setUser(credits)
      setTxns(usage.transactions ?? [])
    } catch (e) {
      setError('Failed to load billing data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) fetchData(token)
  }, [token, fetchData])

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">Unable to load</h2>
          <p className="text-white/50 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Gradient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-white">Snap</span>
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Aha</span>
              <span className="text-white/50 font-normal text-base ml-2">Credits</span>
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Credit Balance Card */}
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-white/40 uppercase tracking-widest font-medium">Available Credits</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide bg-gradient-to-r ${PLAN_COLORS[user?.plan ?? 'free']} text-white`}>
                      {user?.plan ?? 'free'}
                    </span>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-black tracking-tighter text-white">
                      {(user?.credits ?? 0).toLocaleString()}
                    </span>
                    <span className="text-white/30 text-lg mb-2">cr</span>
                  </div>
                  <p className="text-white/40 text-sm mt-1">
                    ≈ ${((user?.credits ?? 0) * 0.001).toFixed(2)} USD · ~{Math.floor((user?.credits ?? 0) / 1)} Gemini Flash queries
                  </p>

                  {/* Credit bar */}
                  <div className="mt-6 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((user?.credits ?? 0) / 500) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-white/20 text-xs mt-1.5">500 cr recommended minimum</p>
                </div>
              </div>

              {/* Plan Options */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Plans</h2>
                <div className="grid grid-cols-2 gap-3">
                  <PlanCard
                    name="Free"
                    price="$0"
                    credits="100 cr"
                    description="Signup bonus. Top up anytime."
                    active={user?.plan === 'free'}
                    color="slate"
                  />
                  <PlanCard
                    name="Pro"
                    price="$9/mo"
                    credits="10,000 cr/mo"
                    description="Best for heavy daily use."
                    active={user?.plan === 'pro'}
                    color="amber"
                    badge="COMING SOON"
                  />
                </div>
              </div>

              {/* Pay-as-you-go rates */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-3">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest">Rate Card</h3>
                <div className="space-y-2">
                  {[
                    { model: 'Gemini 2.0 Flash ⚡', rate: '~1 cr/query', note: 'default' },
                    { model: 'Gemini 2.5 Flash',    rate: '~2 cr/query', note: '' },
                    { model: 'Gemini 2.5 Pro',       rate: '~15 cr/query', note: '' },
                    { model: 'Claude Haiku',         rate: '~5 cr/query', note: '' },
                    { model: 'Claude Sonnet',        rate: '~80 cr/query', note: '' },
                    { model: 'GPT-4o mini',          rate: '~2 cr/query', note: '' },
                  ].map(r => (
                    <div key={r.model} className="flex items-center justify-between text-sm">
                      <span className="text-white/60">
                        {r.model}
                        {r.note && <span className="ml-2 text-xs text-amber-400/80 font-medium">({r.note})</span>}
                      </span>
                      <span className="text-white/40 font-mono text-xs">{r.rate}</span>
                    </div>
                  ))}
                </div>
                <p className="text-white/20 text-xs pt-1">1 credit = $0.001 USD. Rates based on avg 2K input + 500 output tokens.</p>
              </div>

              {/* Usage History */}
              {txns.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Recent Activity</h2>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
                    {txns.map((t, i) => (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between px-5 py-3.5 ${i < txns.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">
                            {t.amount > 0 ? '⬆️' : '🤖'}
                          </span>
                          <div>
                            <p className="text-sm text-white/70 font-medium">
                              {REASON_LABELS[t.reason] ?? t.reason}
                              {t.model && (
                                <span className="ml-1.5 text-white/30 font-normal text-xs">
                                  · {MODEL_LABELS[t.model] ?? t.model}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-white/25">
                              {new Date(t.created_at).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                              {t.tokens_in && (
                                <span className="ml-2">{(t.tokens_in + (t.tokens_out ?? 0)).toLocaleString()} tokens</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold font-mono ${t.amount > 0 ? 'text-emerald-400' : 'text-white/50'}`}>
                          {t.amount > 0 ? '+' : ''}{t.amount} cr
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <p className="text-center text-white/20 text-xs pb-4">
                Snapaha · Pay only for what you use · hoangvh238.dev@gmail.com
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function PlanCard({
  name, price, credits, description, active, color, badge,
}: {
  name: string; price: string; credits: string; description: string
  active?: boolean; color: 'slate' | 'amber'; badge?: string
}) {
  return (
    <div className={`relative rounded-xl border p-5 transition-all ${
      active
        ? color === 'amber'
          ? 'border-amber-500/50 bg-amber-500/10'
          : 'border-white/20 bg-white/10'
        : 'border-white/[0.06] bg-white/[0.02]'
    }`}>
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-bold text-amber-400/60 border border-amber-400/20 rounded px-1.5 py-0.5">
          {badge}
        </span>
      )}
      {active && <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-400 border border-emerald-400/30 rounded px-1.5 py-0.5">ACTIVE</span>}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">{name}</p>
        <p className={`text-2xl font-black ${color === 'amber' ? 'text-amber-300' : 'text-white'}`}>{price}</p>
        <p className="text-xs text-white/50 font-medium">{credits}</p>
        <p className="text-xs text-white/30 pt-1">{description}</p>
      </div>
    </div>
  )
}
