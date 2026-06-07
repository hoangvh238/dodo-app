'use client'

import { useState, useCallback } from 'react'
import {
  Plus, Copy, CheckCircle2, Trash2, Loader2, ToggleLeft, ToggleRight,
  Ticket, Users, Coins, RefreshCw, ChevronDown, ChevronRight,
  AlertTriangle, Wand2, Calendar, Infinity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Redemption {
  voucher_id:  string
  google_sub:  string
  ip_address:  string | null
  redeemed_at: string
}

interface Voucher {
  id:          string
  code:        string
  credits:     number
  max_uses:    number | null
  used_count:  number
  expires_at:  string | null
  is_active:   boolean
  note:        string | null
  created_by:  string | null
  created_at:  string
  redemptions: Redemption[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className={cn('p-1 transition-colors', className)}
      title="Copy"
    >
      {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  )
}

function StatusBadge({ v }: { v: Voucher }) {
  const expired   = v.expires_at && new Date(v.expires_at) < new Date()
  const exhausted = v.max_uses !== null && v.used_count >= v.max_uses
  if (!v.is_active) return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">inactive</span>
  if (expired)      return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">expired</span>
  if (exhausted)    return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">exhausted</span>
  return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">active</span>
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Voucher row ──────────────────────────────────────────────────────────────

interface RowProps {
  v:        Voucher
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  busy:     boolean
}

function VoucherRow({ v, onToggle, onDelete, busy }: RowProps) {
  const [open, setOpen] = useState(false)
  const pct = v.max_uses ? Math.round((v.used_count / v.max_uses) * 100) : 0

  return (
    <div className={cn('rounded-xl border transition-colors', v.is_active ? 'border-white/[0.08] bg-white/[0.015]' : 'border-white/[0.04] bg-transparent opacity-60')}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Expand */}
        <button onClick={() => setOpen(o => !o)} className="text-slate-700 hover:text-slate-400 shrink-0">
          {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
        </button>

        {/* Code */}
        <div className="flex items-center gap-1.5 min-w-[160px]">
          <code className="text-sm font-mono font-bold text-indigo-300 tracking-wider">{v.code}</code>
          <CopyBtn text={v.code} className="text-slate-700 hover:text-slate-300" />
        </div>

        {/* Credits */}
        <div className="flex items-center gap-1 w-24 shrink-0">
          <Coins size={12} className="text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">{v.credits.toLocaleString()}</span>
        </div>

        {/* Usage bar */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{v.used_count} / {v.max_uses === null ? '∞' : v.max_uses} used</span>
            {v.max_uses && <span>{pct}%</span>}
          </div>
          {v.max_uses && (
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-red-500' : 'bg-indigo-500')} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          )}
        </div>

        {/* Expiry */}
        <div className="w-24 shrink-0 text-xs text-slate-500 text-center">
          {v.expires_at ? fmtDate(v.expires_at) : <Infinity size={13} className="mx-auto text-slate-700"/>}
        </div>

        {/* Note */}
        <div className="w-32 shrink-0 truncate text-xs text-slate-600 text-center" title={v.note ?? ''}>
          {v.note || '—'}
        </div>

        {/* Status */}
        <div className="w-20 shrink-0 flex justify-center">
          <StatusBadge v={v} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggle(v.id, !v.is_active)}
            disabled={busy}
            title={v.is_active ? 'Deactivate' : 'Activate'}
            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-30"
          >
            {v.is_active ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
          </button>
          <button
            onClick={() => { if (confirm(`Delete voucher ${v.code}?`)) onDelete(v.id) }}
            disabled={busy}
            className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-30"
          >
            <Trash2 size={13}/>
          </button>
        </div>
      </div>

      {/* Redemption history */}
      {open && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          {v.redemptions.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-2">No redemptions yet</p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Redemption history</p>
              {v.redemptions.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-500 bg-black/20 rounded-lg px-3 py-1.5 font-mono">
                  <span className="text-slate-400 truncate flex-1">{r.google_sub}</span>
                  <span className="text-slate-700">{r.ip_address ?? '—'}</span>
                  <span>{new Date(r.redeemed_at).toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Create form ──────────────────────────────────────────────────────────────

interface CreateFormProps {
  onCreated: (v: Voucher) => void
}

function CreateForm({ onCreated }: CreateFormProps) {
  const [code,     setCode]     = useState('')
  const [credits,  setCredits]  = useState(100)
  const [maxUses,  setMaxUses]  = useState<number | ''>(1)
  const [unlimited, setUnlimited] = useState(false)
  const [expiry,   setExpiry]   = useState('')
  const [note,     setNote]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code:       code.trim() || undefined,
          credits,
          max_uses:   unlimited ? null : (typeof maxUses === 'number' ? maxUses : 1),
          expires_at: expiry || null,
          note,
        }),
      })
      const d = await res.json()
      if (!res.ok) { setErr(d.error ?? 'Failed'); return }
      onCreated({ ...d, redemptions: [] })
      setCode(''); setCredits(100); setMaxUses(1); setUnlimited(false); setExpiry(''); setNote('')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleCreate} className="rounded-xl border border-white/[0.08] bg-[#0d0d1a] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Plus size={14} className="text-indigo-400"/> Create Voucher
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Code */}
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs text-slate-500">Code <span className="text-slate-700">(leave blank to auto-generate)</span></label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''))}
              placeholder="e.g. SNAP-2024-PROMO"
              maxLength={64}
              className="flex-1 bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-indigo-500/50"
            />
            <button type="button" onClick={() => {
              const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
              const pick = () => Array.from({length:4}, () => a[Math.floor(Math.random()*a.length)]).join('')
              setCode(`${pick()}-${pick()}-${pick()}`)
            }} className="px-3 py-2 rounded-lg border border-white/[0.08] text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] flex items-center gap-1.5 text-xs transition-colors">
              <Wand2 size={12}/> Generate
            </button>
          </div>
        </div>

        {/* Credits */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Credits to award</label>
          <input
            type="number" min={1} max={100000}
            value={credits}
            onChange={e => setCredits(parseInt(e.target.value) || 1)}
            className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
          <p className="text-[11px] text-slate-700">${(credits * 0.001).toFixed(2)} value</p>
        </div>

        {/* Max uses */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-500">Max uses</label>
            <button type="button" onClick={() => setUnlimited(v => !v)} className={cn('text-[11px] flex items-center gap-1', unlimited ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400')}>
              <Infinity size={11}/> Unlimited
            </button>
          </div>
          <input
            type="number" min={1}
            value={unlimited ? '' : maxUses}
            onChange={e => setMaxUses(parseInt(e.target.value) || '')}
            disabled={unlimited}
            placeholder={unlimited ? '∞' : '1'}
            className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 disabled:opacity-40"
          />
        </div>

        {/* Expiry */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={11}/> Expires</label>
          <input
            type="datetime-local"
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Note / campaign</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={200}
            placeholder="e.g. Launch promo Jan 2025"
            className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
          <AlertTriangle size={12}/> {err}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {saving ? <Loader2 size={14} className="animate-spin"/> : <Ticket size={14}/>}
        {saving ? 'Creating…' : 'Create voucher'}
      </button>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VoucherManager() {
  const [vouchers, setVouchers] = useState<Voucher[] | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [busyId,   setBusyId]   = useState<string | null>(null)
  const [filter,   setFilter]   = useState<'all' | 'active' | 'inactive'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vouchers')
      if (res.ok) setVouchers(await res.json())
    } finally { setLoading(false) }
  }, [])

  // Load on mount
  useState(() => { load() })

  async function handleToggle(id: string, active: boolean) {
    setBusyId(id)
    try {
      await fetch(`/api/admin/vouchers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      })
      setVouchers(vs => vs?.map(v => v.id === id ? { ...v, is_active: active } : v) ?? null)
    } finally { setBusyId(null) }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      await fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' })
      setVouchers(vs => vs?.filter(v => v.id !== id) ?? null)
    } finally { setBusyId(null) }
  }

  function handleCreated(v: Voucher) {
    setVouchers(vs => [v, ...(vs ?? [])])
  }

  // Stats
  const all         = vouchers ?? []
  const totalActive = all.filter(v => v.is_active).length
  const totalGiven  = all.reduce((s, v) => s + v.used_count * v.credits, 0)
  const totalCodes  = all.length

  const filtered = all.filter(v => {
    if (filter === 'active')   return v.is_active
    if (filter === 'inactive') return !v.is_active
    return true
  })

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Vouchers', value: totalCodes,    icon: Ticket,  color: 'text-indigo-400' },
          { label: 'Active',         value: totalActive,   icon: ToggleRight, color: 'text-emerald-400' },
          { label: 'Credits Given',  value: totalGiven.toLocaleString(), icon: Coins, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-4 flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-white/[0.04]', s.color)}><s.icon size={16}/></div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      <CreateForm onCreated={handleCreated} />

      {/* Voucher list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize',
                  filter === f ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' : 'border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                )}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-30 transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''}/>
            Refresh
          </button>
        </div>

        {/* Table header */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-700">
            <div className="w-4"/>
            <div className="min-w-[160px]">Code</div>
            <div className="w-24">Credits</div>
            <div className="flex-1">Usage</div>
            <div className="w-24 text-center">Expires</div>
            <div className="w-32 text-center">Note</div>
            <div className="w-20 text-center">Status</div>
            <div className="w-14"/>
          </div>
        )}

        {loading && !vouchers && (
          <div className="text-center py-12 text-slate-600">
            <Loader2 size={20} className="animate-spin mx-auto mb-2"/>
            Loading…
          </div>
        )}

        {vouchers && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600 border border-dashed border-white/[0.06] rounded-xl">
            <Ticket size={24} className="mx-auto mb-2 opacity-30"/>
            No vouchers yet
          </div>
        )}

        {filtered.map(v => (
          <VoucherRow
            key={v.id}
            v={v}
            onToggle={handleToggle}
            onDelete={handleDelete}
            busy={busyId === v.id}
          />
        ))}
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2 text-xs text-slate-700 border border-white/[0.04] rounded-xl px-4 py-3">
        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-500/50"/>
        <span>
          Rate limited: max 5 failed attempts per user per 30 min.
          Redemption is atomic (row-lock prevents double-spend).
          1 account = 1 redemption per voucher code.
          Accounts sharing the same IP at signup receive 1/3 of the free credit bonus.
        </span>
      </div>
    </div>
  )
}
