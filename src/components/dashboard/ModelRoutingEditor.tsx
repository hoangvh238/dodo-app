'use client'

import { useState, useCallback } from 'react'
import {
  Save, RotateCcw, Plus, Trash2, Loader2, CheckCircle2,
  GripVertical, AlertTriangle, Zap, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RouteEntry { modelId: string; weight: number; enabled: boolean }
interface RoutingConfig { entries: RouteEntry[]; fallback: string }

interface ModelMeta {
  id: string; label: string; provider: 'google' | 'anthropic' | 'openai'
  contextK: number; vision: boolean; thinking?: boolean
}

// ─── Static model catalogue (mirrors server registry) ─────────────────────────

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
  google:    { label: 'Google',    icon: '✨', color: '#34d399', bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  anthropic: { label: 'Anthropic', icon: '🤖', color: '#818cf8', bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  ring: 'ring-indigo-500/30'  },
  openai:    { label: 'OpenAI',    icon: '⚡', color: '#a78bfa', bg: 'bg-violet-500/10',  text: 'text-violet-400',  ring: 'ring-violet-500/30'  },
}

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
          const meta = MODEL_MAP[e.modelId]
          const pct  = total > 0 ? (e.weight / total) * 100 : 0
          const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
          return (
            <div
              key={e.modelId}
              className="flex items-center justify-center text-[11px] font-semibold text-white transition-all duration-300 overflow-hidden relative group"
              style={{ width: `${pct}%`, background: cfg.color + '33', borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.3)' : 'none' }}
              title={`${meta?.label ?? e.modelId}: ${pct.toFixed(1)}%`}
            >
              <div className="absolute inset-0" style={{ background: cfg.color, opacity: 0.18 }} />
              {pct > 8 && (
                <span className="relative z-10 truncate px-1.5" style={{ color: cfg.color }}>
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
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: cfg.color }} />
              <span className="text-slate-400">{meta?.label ?? e.modelId}</span>
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
  entry:    RouteEntry
  total:    number
  onChange: (updated: RouteEntry) => void
  onRemove: () => void
  canRemove: boolean
}

function ModelRow({ entry, total, onChange, onRemove, canRemove }: RowProps) {
  const meta = MODEL_MAP[entry.modelId]
  const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
  const pct  = total > 0 && entry.enabled ? ((entry.weight / total) * 100).toFixed(1) : '0'

  return (
    <div className={cn(
      'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150',
      entry.enabled
        ? 'border-white/[0.08] bg-white/[0.02]'
        : 'border-white/[0.04] bg-transparent opacity-50',
    )}>
      {/* Drag handle */}
      <GripVertical size={14} className="text-slate-700 shrink-0 cursor-grab" />

      {/* Toggle */}
      <button
        onClick={() => onChange({ ...entry, enabled: !entry.enabled })}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors shrink-0',
          entry.enabled ? 'bg-emerald-500' : 'bg-white/10',
        )}
        aria-label="toggle"
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
            <span className="text-[10px] text-slate-700">{meta?.contextK}K ctx</span>
          </div>
        </div>
      </div>

      {/* Percentage badge */}
      <div className="w-12 text-right shrink-0">
        <span className={cn('text-sm font-bold font-mono', entry.enabled ? cfg.text : 'text-slate-700')}>
          {pct}%
        </span>
      </div>

      {/* Weight slider + input */}
      <div className="flex items-center gap-2 w-48 shrink-0">
        <input
          type="range"
          min={0}
          max={100}
          value={entry.weight}
          onChange={e => onChange({ ...entry, weight: parseInt(e.target.value) })}
          disabled={!entry.enabled}
          className="flex-1 accent-indigo-500 disabled:opacity-30 cursor-pointer"
        />
        <input
          type="number"
          min={0}
          max={100}
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
          title="Remove"
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

interface AddModelProps {
  usedIds: Set<string>
  onAdd:   (modelId: string) => void
}

function AddModelPicker({ usedIds, onAdd }: AddModelProps) {
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
        <Plus size={14} />
        Add model to distribution
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
                    <button
                      key={m.id}
                      onClick={() => { onAdd(m.id); setOpen(false) }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <span>{m.label}</span>
                      <div className="flex items-center gap-1.5">
                        {m.thinking && <span className="text-[10px] text-amber-400/70">thinking</span>}
                        <span className="text-[10px] text-slate-600">{m.contextK}K</span>
                      </div>
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

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className="text-amber-400" />
        <span className="text-xs font-semibold text-slate-400">Simulation — next {N} requests</span>
        <span className="text-[10px] text-slate-600 ml-auto">(random sample)</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {active.map(e => {
          const n    = counts[e.modelId] ?? 0
          const meta = MODEL_MAP[e.modelId]
          const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
          return Array.from({ length: n }).map((_, i) => (
            <div
              key={`${e.modelId}-${i}`}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ring-1 transition-all"
              style={{ background: cfg.color + '22', outline: `1px solid ${cfg.color}55`, color: cfg.color }}
              title={meta?.label ?? e.modelId}
            >
              {cfg.icon}
            </div>
          ))
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {active.map(e => {
          const n    = counts[e.modelId] ?? 0
          const meta = MODEL_MAP[e.modelId]
          const cfg  = meta ? PROVIDER_CONFIG[meta.provider] : PROVIDER_CONFIG.google
          return (
            <span key={e.modelId} className="text-xs" style={{ color: cfg.color }}>
              {cfg.icon} {meta?.label ?? e.modelId}: {n}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

interface Props { initialConfig: RoutingConfig }

export default function ModelRoutingEditor({ initialConfig }: Props) {
  const [entries,  setEntries]  = useState<RouteEntry[]>(initialConfig.entries)
  const [fallback, setFallback] = useState(initialConfig.fallback)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [dirty,    setDirty]    = useState(false)

  const activeTotal = entries.filter(e => e.enabled).reduce((s, e) => s + e.weight, 0)
  const usedIds     = new Set(entries.map(e => e.modelId))

  function update(index: number, updated: RouteEntry) {
    setEntries(es => es.map((e, i) => i === index ? updated : e))
    setDirty(true)
    setMsg(null)
  }

  function remove(index: number) {
    setEntries(es => es.filter((_, i) => i !== index))
    setDirty(true)
    setMsg(null)
  }

  function addModel(modelId: string) {
    setEntries(es => [...es, { modelId, weight: 50, enabled: true }])
    setDirty(true)
    setMsg(null)
  }

  function normalize() {
    const active = entries.filter(e => e.enabled)
    if (active.length === 0) return
    const equalWeight = Math.floor(100 / active.length)
    setEntries(es => es.map(e => e.enabled ? { ...e, weight: equalWeight } : e))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/model-routing', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ entries, fallback }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error ?? 'Save failed' }); return }
      setMsg({ type: 'ok', text: 'Saved — new distribution active within 60 s' })
      setDirty(false)
    } finally { setSaving(false) }
  }

  async function handleReset() {
    if (!confirm('Reset to default (100% Gemini 2.0 Flash)?')) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/model-routing', { method: 'DELETE' })
      if (res.ok) {
        setEntries([{ modelId: 'gemini-2.0-flash', weight: 100, enabled: true }])
        setFallback('gemini-2.0-flash')
        setMsg({ type: 'ok', text: 'Reset to default' })
        setDirty(false)
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-300/70">
          Free-tier users (plan = <code className="text-indigo-300">free</code>) have their model overridden by this distribution.
          Requests are routed randomly by weight. Pro users keep their selected model.
          Changes take effect within 60 s (in-process cache TTL).
        </p>
      </div>

      {/* Distribution bar */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Distribution Preview</h3>
          <span className="text-xs text-slate-600">
            {entries.filter(e => e.enabled).length} active · total weight {activeTotal}
          </span>
        </div>
        <DistributionBar entries={entries} />
      </div>

      {/* Model rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-slate-300">Models</h3>
          <button
            onClick={normalize}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            Equalize weights
          </button>
        </div>

        {entries.map((e, i) => (
          <ModelRow
            key={e.modelId}
            entry={e}
            total={activeTotal}
            onChange={u => update(i, u)}
            onRemove={() => remove(i)}
            canRemove={entries.length > 1}
          />
        ))}

        <AddModelPicker usedIds={usedIds} onAdd={addModel} />
      </div>

      {/* Simulation */}
      <SimulationWidget entries={entries} />

      {/* Fallback model */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-400">Fallback Model</h3>
        </div>
        <p className="text-xs text-slate-600">Used when all entries are disabled or weights are zero.</p>
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
          {saving
            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
            : <><Save size={14} /> Save distribution</>
          }
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm rounded-xl border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
        >
          <RotateCcw size={13} />
          Reset to default
        </button>

        {msg && (
          <div className={cn(
            'flex items-center gap-2 text-sm px-3 py-2 rounded-xl',
            msg.type === 'ok' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10',
          )}>
            {msg.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {msg.text}
          </div>
        )}
      </div>
    </div>
  )
}
