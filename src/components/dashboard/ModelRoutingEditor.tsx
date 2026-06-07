'use client'

import { useState } from 'react'
import {
  Save, RotateCcw, Plus, Trash2, Loader2, CheckCircle2,
  GripVertical, AlertTriangle, Zap, Info, Network,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RouteEntry { modelId: string; weight: number; enabled: boolean; via9Router: boolean }
interface RoutingConfig { entries: RouteEntry[]; fallback: string }

interface ModelMeta {
  id: string; label: string; provider: 'google' | 'anthropic' | 'openai'
  contextK: number; vision: boolean; thinking?: boolean
}

// ─── Static model catalogue ───────────────────────────────────────────────────

const ALL_MODELS: ModelMeta[] = [
  { id: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash',      provider: 'google',    contextK: 1000, vision: true  },
  { id: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash',      provider: 'google',    contextK: 1000, vision: true  },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', provider: 'google',    contextK: 1000, vision: true  },
  { id: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro',        provider: 'google',    contextK: 1000, vision: true, thinking: true },
  { id: 'gemini-1.5-pro',        label: 'Gemini 1.5 Pro',        provider: 'google',    contextK: 1000, vision: true  },
  { id: 'gemini-1.5-flash',      label: 'Gemini 1.5 Flash',      provider: 'google',    contextK: 1000, vision: true  },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5',  provider: 'anthropic', contextK: 200,  vision: true  },
  { id: 'claude-sonnet-4-6',     label: 'Claude Sonnet 4.6',     provider: 'anthropic', contextK: 200,  vision: true, thinking: true },
  { id: 'claude-opus-4-7',       label: 'Claude Opus 4.7',       provider: 'anthropic', contextK: 200,  vision: true, thinking: true },
  { id: 'gpt-4o-mini',           label: 'GPT-4o mini',           provider: 'openai',    contextK: 128,  vision: true  },
  { id: 'gpt-4o',                label: 'GPT-4o',                provider: 'openai',    contextK: 128,  vision: true  },
  { id: 'gpt-4.1-mini',          label: 'GPT-4.1 mini',          provider: 'openai',    contextK: 1000, vision: true  },
]

const MODEL_MAP = Object.fromEntries(ALL_MODELS.map(m => [m.id, m]))

// ─── Provider styling ─────────────────────────────────────────────────────────

const PROVIDER_CONFIG = {
  google:    { label: 'Google',    icon: '✨', color: '#34d399', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  anthropic: { label: 'Anthropic', icon: '🤖', color: '#818cf8', bg: 'bg-indigo-500/10',  text: 'text-indigo-400'  },
  openai:    { label: 'OpenAI',    icon: '⚡', color: '#a78bfa', bg: 'bg-violet-500/10',  text: 'text-violet-400'  },
}

// 9router brand colour
const NR_COLOR = '#f59e0b'

// ─── Distribution bar ─────────────────────────────────────────────────────────

function DistributionBar({ entries }: { entries: RouteEntry[] }) {
  const active = entries.filter(e => e.enabled && e.weight > 0)
  const total  = active.reduce((s, e) => s + e.weight, 0)

  if (active.length === 0) {
    return (
      <div className="h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
        <span className="text-xs text-slate-600">No models enabled — fallback will be used</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="flex h-10 rounded-xl overflow-hidden gap-0.5">
        {active.map((e, i) => {
          const meta  = MODEL_MAP[e.modelId]
          const pct   = total > 0 ? (e.weight / total) * 100 : 0
          const cfg   = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
          // 9router entries get a diagonal-stripe overlay
          return (
            <div
              key={e.modelId}
              className="relative flex items-center justify-center text-[11px] font-semibold text-white transition-all duration-300 overflow-hidden"
              style={{
                width:       `${pct}%`,
                background:  e.via9Router ? `repeating-linear-gradient(45deg, ${cfg.color}30, ${cfg.color}30 4px, ${NR_COLOR}25 4px, ${NR_COLOR}25 8px)` : cfg.color + '33',
                borderLeft:  i > 0 ? '1px solid rgba(0,0,0,0.3)' : 'none',
              }}
              title={`${meta?.label ?? e.modelId}: ${pct.toFixed(1)}%${e.via9Router ? ' (via 9router)' : ''}`}
            >
              <div className="absolute inset-0" style={{ background: e.via9Router ? NR_COLOR : cfg.color, opacity: 0.18 }} />
              {pct > 8 && (
                <span className="relative z-10 truncate px-1.5 flex items-center gap-1" style={{ color: e.via9Router ? NR_COLOR : cfg.color }}>
                  {e.via9Router && <span className="font-black text-[9px]">9R·</span>}
                  {pct >= 15 ? (meta?.label ?? e.modelId) : `${Math.round(pct)}%`}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {active.map(e => {
          const meta = MODEL_MAP[e.modelId]
          const pct  = total > 0 ? (e.weight / total) * 100 : 0
          const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
          return (
            <div key={e.modelId} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: e.via9Router ? NR_COLOR : cfg.color }} />
              <span className="text-slate-400">{meta?.label ?? e.modelId}</span>
              {e.via9Router && <span className="text-[10px] font-bold px-1 rounded" style={{ background: NR_COLOR + '25', color: NR_COLOR }}>9R</span>}
              <span className="text-slate-600 font-mono">{Math.round(pct)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Model row ────────────────────────────────────────────────────────────────

interface RowProps {
  entry:       RouteEntry
  total:       number
  nrConnected: boolean
  onChange:    (updated: RouteEntry) => void
  onRemove:    () => void
  canRemove:   boolean
}

function ModelRow({ entry, total, nrConnected, onChange, onRemove, canRemove }: RowProps) {
  const meta = MODEL_MAP[entry.modelId]
  const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
  const pct  = total > 0 && entry.enabled ? ((entry.weight / total) * 100).toFixed(1) : '0'

  return (
    <div className={cn(
      'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150',
      entry.enabled
        ? entry.via9Router
          ? 'border-amber-500/25 bg-amber-500/[0.04]'
          : 'border-white/[0.08] bg-white/[0.02]'
        : 'border-white/[0.04] bg-transparent opacity-50',
    )}>
      {/* Drag handle */}
      <GripVertical size={14} className="text-slate-700 shrink-0 cursor-grab" />

      {/* Enable toggle */}
      <button
        onClick={() => onChange({ ...entry, enabled: !entry.enabled })}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors shrink-0',
          entry.enabled ? 'bg-emerald-500' : 'bg-white/10',
        )}
        aria-label="toggle model"
      >
        <span className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
          entry.enabled ? 'translate-x-4' : 'translate-x-0.5',
        )} />
      </button>

      {/* Model info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base shrink-0">{cfg.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{meta?.label ?? entry.modelId}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded', cfg.bg, cfg.text)}>
              {cfg.label}
            </span>
            {meta?.thinking && <span className="text-[10px] text-amber-400/70">thinking</span>}
            {meta?.vision   && <span className="text-[10px] text-slate-600">vision</span>}
            <span className="text-[10px] text-slate-700">{meta?.contextK}K</span>
          </div>
        </div>
      </div>

      {/* ── 9Router toggle ── */}
      <div className="shrink-0 flex flex-col items-center gap-1" title={!nrConnected ? 'Configure 9router first in the 9Router page' : entry.via9Router ? 'Routing via 9router' : 'Direct provider call'}>
        <button
          onClick={() => onChange({ ...entry, via9Router: !entry.via9Router })}
          disabled={!entry.enabled}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all border',
            entry.via9Router
              ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
              : 'border-white/[0.06] text-slate-600 hover:text-slate-300 hover:border-white/10',
            !entry.enabled && 'opacity-30 cursor-not-allowed',
          )}
        >
          <Network size={11} />
          9R
        </button>
        <span className="text-[9px] text-slate-700">
          {entry.via9Router ? 'via 9router' : 'direct'}
        </span>
      </div>

      {/* Percentage */}
      <div className="w-11 text-right shrink-0">
        <span className={cn(
          'text-sm font-bold font-mono',
          entry.enabled ? (entry.via9Router ? 'text-amber-400' : cfg.text) : 'text-slate-700',
        )}>
          {pct}%
        </span>
      </div>

      {/* Weight slider + input */}
      <div className="flex items-center gap-2 w-44 shrink-0">
        <input
          type="range"
          min={0} max={100}
          value={entry.weight}
          onChange={e => onChange({ ...entry, weight: parseInt(e.target.value) })}
          disabled={!entry.enabled}
          className={cn('flex-1 disabled:opacity-30 cursor-pointer', entry.via9Router ? 'accent-amber-500' : 'accent-indigo-500')}
        />
        <input
          type="number"
          min={0} max={100}
          value={entry.weight}
          onChange={e => onChange({ ...entry, weight: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
          disabled={!entry.enabled}
          className="w-12 text-center bg-[#12122a] border border-white/[0.08] rounded-lg px-1 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 disabled:opacity-30"
        />
      </div>

      {/* Remove */}
      {canRemove ? (
        <button
          onClick={onRemove}
          className="shrink-0 p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={13} />
        </button>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  )
}

// ─── Add model picker ─────────────────────────────────────────────────────────

function AddModelPicker({ usedIds, onAdd }: { usedIds: Set<string>; onAdd: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const available = ALL_MODELS.filter(m => !usedIds.has(m.id))
  if (available.length === 0) return null

  const byProvider = available.reduce<Record<string, ModelMeta[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/[0.12] text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/[0.02] text-sm transition-all"
      >
        <Plus size={14} /> Add model
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-20 w-80 rounded-xl border border-white/[0.08] bg-[#12122a] shadow-2xl overflow-hidden">
            {Object.entries(byProvider).map(([provider, models]) => {
              const cfg = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG]
              return (
                <div key={provider}>
                  <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{cfg.label}</span>
                  </div>
                  {models.map(m => (
                    <button key={m.id} onClick={() => { onAdd(m.id); setOpen(false) }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <span>{m.label}</span>
                      <span className="text-[10px] text-slate-600">{m.contextK}K</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Simulation widget ────────────────────────────────────────────────────────

function SimulationWidget({ entries }: { entries: RouteEntry[] }) {
  const active = entries.filter(e => e.enabled && e.weight > 0)
  const total  = active.reduce((s, e) => s + e.weight, 0)
  if (total === 0) return null

  const N = 20
  const counts: Record<string, number> = {}
  for (let i = 0; i < N; i++) {
    let r = Math.random() * total
    for (const e of active) {
      r -= e.weight
      if (r <= 0) { counts[e.modelId] = (counts[e.modelId] ?? 0) + 1; break }
    }
  }

  const via9R    = active.filter(e => e.via9Router).reduce((s, e) => s + (counts[e.modelId] ?? 0), 0)
  const direct   = N - via9R

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-amber-400" />
          <span className="text-xs font-semibold text-slate-400">Simulation — next {N} requests</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1" style={{ color: NR_COLOR }}>
            <Network size={11}/> {via9R} via 9router
          </span>
          <span className="text-slate-500">{direct} direct</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {active.map(e => {
          const n    = counts[e.modelId] ?? 0
          const meta = MODEL_MAP[e.modelId]
          const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
          return Array.from({ length: n }).map((_, i) => (
            <div
              key={`${e.modelId}-${i}`}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold relative transition-all"
              style={{
                background: e.via9Router ? NR_COLOR + '22' : cfg.color + '22',
                outline:    `1px solid ${e.via9Router ? NR_COLOR : cfg.color}55`,
                color:      e.via9Router ? NR_COLOR : cfg.color,
              }}
              title={`${meta?.label ?? e.modelId}${e.via9Router ? ' via 9router' : ''}`}
            >
              {e.via9Router
                ? <Network size={12}/>
                : <span>{cfg.icon}</span>
              }
            </div>
          ))
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {active.map(e => {
          const n    = counts[e.modelId] ?? 0
          const meta = MODEL_MAP[e.modelId]
          const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
          const color = e.via9Router ? NR_COLOR : cfg.color
          return (
            <span key={e.modelId} className="text-xs flex items-center gap-1" style={{ color }}>
              {e.via9Router ? <Network size={10}/> : cfg.icon}
              {meta?.label ?? e.modelId}: {n}
              {e.via9Router && <span className="text-[9px] font-bold">9R</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

interface Props {
  initialConfig:   RoutingConfig
  nrConfigured?:   boolean   // whether 9router is configured (from parent server component)
}

export default function ModelRoutingEditor({ initialConfig, nrConfigured = false }: Props) {
  const [entries,  setEntries]  = useState<RouteEntry[]>(
    initialConfig.entries.map(e => ({ ...e, via9Router: e.via9Router ?? false }))
  )
  const [fallback, setFallback] = useState(initialConfig.fallback)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [dirty,    setDirty]    = useState(false)

  const activeTotal  = entries.filter(e => e.enabled).reduce((s, e) => s + e.weight, 0)
  const usedIds      = new Set(entries.map(e => e.modelId))
  const via9RCount   = entries.filter(e => e.enabled && e.via9Router).length

  function update(index: number, updated: RouteEntry) {
    setEntries(es => es.map((e, i) => i === index ? updated : e))
    setDirty(true); setMsg(null)
  }
  function remove(index: number) {
    setEntries(es => es.filter((_, i) => i !== index))
    setDirty(true); setMsg(null)
  }
  function addModel(modelId: string) {
    setEntries(es => [...es, { modelId, weight: 50, enabled: true, via9Router: false }])
    setDirty(true); setMsg(null)
  }
  function normalize() {
    const active = entries.filter(e => e.enabled)
    if (active.length === 0) return
    const w = Math.floor(100 / active.length)
    setEntries(es => es.map(e => e.enabled ? { ...e, weight: w } : e))
    setDirty(true)
  }
  function setAll9R(val: boolean) {
    setEntries(es => es.map(e => ({ ...e, via9Router: val })))
    setDirty(true); setMsg(null)
  }

  async function handleSave() {
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/model-routing', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, fallback }),
      })
      const d = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: d.error ?? 'Save failed' }); return }
      setMsg({ type: 'ok', text: 'Saved — active within 60 s' }); setDirty(false)
    } finally { setSaving(false) }
  }

  async function handleReset() {
    if (!confirm('Reset to default?')) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/model-routing', { method: 'DELETE' })
      if (res.ok) {
        setEntries([{ modelId: 'gemini-2.0-flash', weight: 100, enabled: true, via9Router: false }])
        setFallback('gemini-2.0-flash'); setMsg({ type: 'ok', text: 'Reset to default' }); setDirty(false)
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Info */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-300/70">
          Free-tier requests are routed here by weight. Toggle <span className="font-bold text-amber-400">9R</span> on individual models to send them through 9router (free providers, auto-fallback) instead of calling the provider directly.
          Pro users bypass this entirely.
        </p>
      </div>

      {/* 9router status banner */}
      {!nrConfigured && via9RCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs text-amber-400">
          <AlertTriangle size={13} className="shrink-0"/>
          {via9RCount} model{via9RCount > 1 ? 's' : ''} set to route via 9router but 9router is not configured.
          <a href="/admin/nine-router" className="underline ml-1 hover:text-amber-300">Configure it →</a>
        </div>
      )}
      {nrConfigured && via9RCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400">
          <Network size={13} className="shrink-0"/>
          9router connected — {via9RCount} model{via9RCount > 1 ? 's' : ''} will route through it
        </div>
      )}

      {/* Distribution bar */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Distribution Preview</h3>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: NR_COLOR }}/> 9router</span>
            <span>{entries.filter(e => e.enabled).length} active · weight {activeTotal}</span>
          </div>
        </div>
        <DistributionBar entries={entries} />
      </div>

      {/* Model rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-slate-300">Models</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setAll9R(true)}  className="text-xs px-2 py-1 rounded-lg border border-amber-500/20 text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1"><Network size={11}/> All via 9R</button>
            <button onClick={() => setAll9R(false)} className="text-xs px-2 py-1 rounded-lg border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors">All direct</button>
            <button onClick={normalize}             className="text-xs px-2 py-1 rounded-lg border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors">Equalize</button>
          </div>
        </div>

        {/* Column header */}
        <div className="flex items-center gap-3 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-700">
          <div className="w-4 shrink-0"/>
          <div className="w-9 shrink-0"/>
          <div className="flex-1">Model</div>
          <div className="w-14 text-center shrink-0">Route</div>
          <div className="w-11 text-right shrink-0">%</div>
          <div className="w-44 text-center shrink-0">Weight</div>
          <div className="w-7 shrink-0"/>
        </div>

        {entries.map((e, i) => (
          <ModelRow
            key={e.modelId}
            entry={e}
            total={activeTotal}
            nrConnected={nrConfigured}
            onChange={u => update(i, u)}
            onRemove={() => remove(i)}
            canRemove={entries.length > 1}
          />
        ))}

        <AddModelPicker usedIds={usedIds} onAdd={addModel} />
      </div>

      {/* Simulation */}
      <SimulationWidget entries={entries} />

      {/* Fallback */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-400">Fallback Model</h3>
        </div>
        <p className="text-xs text-slate-600">Used when all entries are disabled. Always calls provider directly.</p>
        <select
          value={fallback}
          onChange={e => { setFallback(e.target.value); setDirty(true) }}
          className="bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 w-full"
        >
          {ALL_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label} ({m.provider})</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saving ? <><Loader2 size={14} className="animate-spin"/> Saving…</> : <><Save size={14}/> Save distribution</>}
        </button>
        <button onClick={handleReset} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm rounded-xl border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
          <RotateCcw size={13}/> Reset
        </button>
        {msg && (
          <div className={cn('flex items-center gap-2 text-sm px-3 py-2 rounded-xl', msg.type==='ok' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
            {msg.type==='ok' ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>} {msg.text}
          </div>
        )}
      </div>
    </div>
  )
}
