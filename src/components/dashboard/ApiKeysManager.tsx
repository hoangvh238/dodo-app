'use client'

import { useState } from 'react'
import { Eye, EyeOff, Save, CheckCircle, XCircle, AlertTriangle, Key, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeyEntry {
  provider: 'anthropic' | 'google' | 'openai'
  label: string
  placeholder: string
  source: 'db' | 'env' | 'none'
  configured: boolean
  maskedValue: string
  updatedAt: string | null
  updatedBy: string | null
}

interface Props { initialKeys: KeyEntry[] }

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  db:   { label: 'DB override', className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
  env:  { label: 'Env var',     className: 'bg-slate-700 text-slate-400' },
  none: { label: 'Not set',     className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
}

const PROVIDER_ICONS: Record<string, string> = {
  anthropic: '🤖',
  google:    '✨',
  openai:    '⚡',
}

function KeyCard({ entry, onSaved }: { entry: KeyEntry; onSaved: (updated: KeyEntry) => void }) {
  const [value,   setValue]   = useState('')
  const [show,    setShow]    = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave() {
    if (!value.trim()) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: entry.provider, value: value.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error ?? 'Failed' }); return }
      setMsg({ type: 'ok', text: 'Saved — new key active within 60 s' })
      setValue('')
      setEditing(false)
      onSaved({ ...entry, source: 'db', configured: true, maskedValue: value.slice(0, 8) + '••••••••' + value.slice(-4), updatedAt: new Date().toISOString(), updatedBy: 'you' })
    } finally { setSaving(false) }
  }

  async function handleClear() {
    if (!confirm(`Clear the DB key for ${entry.label}? The env var fallback will be used if set.`)) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: entry.provider, value: '' }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error ?? 'Failed' }); return }
      setMsg({ type: 'ok', text: 'Cleared — env var will be used as fallback' })
      setEditing(false)
      onSaved({ ...entry, source: 'env', maskedValue: '(env)' })
    } finally { setSaving(false) }
  }

  const badge = SOURCE_BADGE[entry.source]

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{PROVIDER_ICONS[entry.provider]}</span>
          <div>
            <h3 className="font-semibold text-slate-200">{entry.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {entry.configured
                ? entry.maskedValue
                : 'No key configured'
              }
            </p>
          </div>
        </div>
        <span className={cn('text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0', badge.className)}>
          {badge.label}
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {entry.configured
          ? <CheckCircle size={14} className="text-emerald-400" />
          : <XCircle    size={14} className="text-red-400" />
        }
        <span className="text-xs text-slate-400">
          {entry.configured
            ? entry.source === 'db'
              ? `DB key set${entry.updatedAt ? ' · updated ' + new Date(entry.updatedAt).toLocaleDateString() : ''}${entry.updatedBy ? ' by ' + entry.updatedBy : ''}`
              : 'Using environment variable (read-only from dashboard)'
            : 'Required for this provider — AI requests will fail'
          }
        </span>
      </div>

      {/* Warning if no key */}
      {!entry.configured && (
        <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>Set this key to enable {entry.label.split('(')[1]?.replace(')', '') ?? entry.label} models for all users.</span>
        </div>
      )}

      {/* Input form */}
      {(editing || !entry.configured) ? (
        <div className="space-y-3">
          <div className="relative">
            <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={entry.placeholder}
              className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {msg && (
            <p className={cn('text-xs px-3 py-2 rounded-lg', msg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
              {msg.text}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !value.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving…' : 'Save key'}
            </button>
            {entry.configured && (
              <button
                onClick={() => { setEditing(false); setValue(''); setMsg(null) }}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm rounded-lg transition-colors border border-white/[0.06] hover:bg-white/[0.04]"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(true); setMsg(null) }}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
          >
            Update key
          </button>
          {entry.source === 'db' && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-4 py-2 text-sm text-red-400/70 hover:text-red-400 rounded-lg border border-red-500/20 hover:bg-red-950/20 transition-colors"
            >
              Clear DB override
            </button>
          )}
        </div>
      )}

      {msg && !editing && (
        <p className={cn('text-xs px-3 py-2 rounded-lg', msg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
          {msg.text}
        </p>
      )}
    </div>
  )
}

export default function ApiKeysManager({ initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys)

  function handleSaved(updated: KeyEntry) {
    setKeys(k => k.map(e => e.provider === updated.provider ? updated : e))
  }

  const allConfigured = keys.every(k => k.configured)

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-400/80 space-y-1">
          <p className="font-semibold text-amber-400">Security notice</p>
          <p>Keys saved here are stored encrypted in the database accessible only to the service role. They are never exposed to browser clients or returned by any API. Env var fallbacks remain as backup if no DB key is set.</p>
        </div>
      </div>

      {allConfigured && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle size={15} />
          All providers configured — AI features fully operational
        </div>
      )}

      {keys.map(k => (
        <KeyCard key={k.provider} entry={k} onSaved={handleSaved} />
      ))}

      <p className="text-xs text-slate-600 pb-2">
        DB values take precedence over environment variables. After saving, the in-process cache refreshes within 60 seconds.
        To set via env var instead, add the variable to your deployment and leave the DB field empty.
      </p>
    </div>
  )
}
