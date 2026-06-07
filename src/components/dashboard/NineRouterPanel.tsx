'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Save, Loader2, CheckCircle2, XCircle, Zap, RefreshCw,
  Copy, ExternalLink, Terminal, AlertTriangle, Info,
  ChevronDown, ChevronRight, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Config { url: string; apiKey: string; enabled: boolean }
interface PingResult { ok: boolean; latencyMs?: number; error?: string }
interface ModelEntry  { id: string; created?: number }

// ─── Deploy option cards ──────────────────────────────────────────────────────
const DEPLOY_OPTIONS = [
  {
    name:     'Vercel — Cloud endpoint',
    icon:     '▲',
    cmd:      'NINE_ROUTER_URL=https://9router.com\nNINE_ROUTER_API_KEY=sk_9router\nNINE_ROUTER_ENABLED=true',
    desc:     'Use 9router\'s cloud service — no extra deployment. Just set env vars in Vercel dashboard.',
    url:      'https://9router.com',
    badge:    'recommended',
    badgeCls: 'bg-indigo-500/20 text-indigo-400',
    note:     'Server calls go directly to 9router cloud; browser calls route through /api/9router (built-in proxy) so no CORS, no extra server needed.',
  },
  {
    name:     'Railway (free)',
    icon:     '🚂',
    cmd:      'docker run -d -p 20128:20128 decolua/9router:latest',
    desc:     'Self-host on Railway free tier — gets a public HTTPS URL automatically',
    url:      'https://your-app.railway.app',
    badge:    'free self-host',
    badgeCls: 'bg-emerald-500/20 text-emerald-400',
    link:     'https://railway.app',
    note:     'Deploy the Docker image, copy the generated URL, paste below.',
  },
  {
    name:     'Local dev',
    icon:     '💻',
    cmd:      'npm run dev:all',
    desc:     'Starts Next.js + 9router together on localhost',
    url:      'http://localhost:20128',
    badge:    'dev only',
    badgeCls: 'bg-slate-700 text-slate-400',
    note:     '',
  },
]

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ ok, pinging }: { ok?: boolean; pinging: boolean }) {
  if (pinging) return <Loader2 size={12} className="animate-spin text-slate-500" />
  if (ok === true)  return <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"/><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"/></span>
  if (ok === false) return <span className="relative flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"/></span>
  return <span className="relative flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600"/></span>
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="p-1 text-slate-600 hover:text-slate-300 transition-colors">
      {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
interface Props { initialConfig: Config }

export default function NineRouterPanel({ initialConfig }: Props) {
  const [url,     setUrl]     = useState(initialConfig.url)
  const [apiKey,  setApiKey]  = useState(initialConfig.apiKey || 'sk_9router')
  const [enabled, setEnabled] = useState(initialConfig.enabled)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState<{type:'ok'|'err'; text:string}|null>(null)
  const [dirty,   setDirty]   = useState(false)

  const [ping,    setPing]    = useState<PingResult|null>(null)
  const [pinging, setPinging] = useState(false)
  const [models,  setModels]  = useState<ModelEntry[]>([])
  const [showModels, setShowModels] = useState(false)
  const [showIframe, setShowIframe] = useState(false)
  const [deployOpen, setDeployOpen] = useState(!initialConfig.url)

  const doSave = useCallback(async (cfg: Config) => {
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/nine-router', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const d = await res.json()
      if (!res.ok) { setMsg({type:'err', text: d.error ?? 'Save failed'}); return false }
      setMsg({type:'ok', text: 'Saved — active in ~30 s'}); setDirty(false); return true
    } finally { setSaving(false) }
  }, [])

  const doPing = useCallback(async (testUrl?: string) => {
    const target = testUrl ?? url
    if (!target) return
    setPinging(true); setPing(null); setModels([])
    try {
      const res = await fetch('/api/admin/nine-router/ping', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      })
      const d: PingResult = await res.json()
      setPing(d)
      if (d.ok) {
        // Also fetch models
        const r2 = await fetch('/api/admin/nine-router')
        if (r2.ok) { const d2 = await r2.json(); setModels(d2.models ?? []) }
      }
    } finally { setPinging(false) }
  }, [url])

  // Ping on mount if URL is set
  useEffect(() => { if (initialConfig.url) doPing(initialConfig.url) }, []) // eslint-disable-line

  function mark() { setDirty(true); setMsg(null) }

  async function handleSave() {
    const ok = await doSave({ url: url.trim(), apiKey: apiKey.trim(), enabled })
    if (ok) doPing()
  }

  // iframe always goes through our built-in proxy route (/api/9router)
  // so it works even when 9router is a remote cloud endpoint
  const iframeUrl = url.trim() ? '/api/9router' : ''
  const externalUrl = url.trim().replace(/\/$/, '')

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Status bar */}
      <div className={cn(
        'flex items-center gap-3 px-5 py-3.5 rounded-xl border',
        enabled && ping?.ok  ? 'border-emerald-500/30 bg-emerald-500/5' :
        enabled && ping?.ok === false ? 'border-red-500/20 bg-red-500/5' :
        'border-white/[0.06] bg-white/[0.02]',
      )}>
        <StatusDot ok={ping?.ok} pinging={pinging} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-200">
            {pinging ? 'Checking connection…' :
             ping?.ok  ? `Connected · ${ping.latencyMs}ms` :
             ping?.ok === false ? `Offline — ${ping.error ?? 'unreachable'}` :
             'Not tested yet'}
          </span>
          {ping?.ok && url && (
            <span className="text-xs text-slate-500 ml-3">{url}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full',
            enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500',
          )}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={() => doPing()}
            disabled={pinging || !url}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-30 transition-colors"
          >
            <RefreshCw size={12} className={pinging ? 'animate-spin' : ''} />
            Ping
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Config panel */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Activity size={14} className="text-indigo-400" /> Configuration
          </h3>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">9Router URL</label>
            <input
              value={url}
              onChange={e => { setUrl(e.target.value); mark() }}
              placeholder="http://localhost:20128"
              className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">API Key</label>
            <input
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); mark() }}
              placeholder="sk_9router"
              className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-indigo-500/50"
            />
            <p className="text-[11px] text-slate-600">Default: <code>sk_9router</code> (from 9router dashboard)</p>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between py-2 border-t border-white/[0.06]">
            <div>
              <p className="text-sm font-medium text-slate-300">Enable for free-tier</p>
              <p className="text-xs text-slate-600">Route all free-tier requests through 9router</p>
            </div>
            <button
              onClick={() => { setEnabled(v => !v); mark() }}
              className={cn('relative w-11 h-6 rounded-full transition-colors', enabled ? 'bg-emerald-500' : 'bg-white/10')}
            >
              <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform', enabled ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>

          {msg && (
            <div className={cn('flex items-center gap-2 text-xs px-3 py-2 rounded-lg', msg.type==='ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
              {msg.type==='ok' ? <CheckCircle2 size={13}/> : <XCircle size={13}/>} {msg.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
            {saving ? 'Saving…' : 'Save'}
          </button>

          {/* Env var hint */}
          <div className="text-[11px] text-slate-700 border-t border-white/[0.04] pt-3 space-y-1">
            <p>Or set env vars (Vercel dashboard → Settings → Env):</p>
            <code className="block bg-black/30 rounded px-2 py-1 text-[10px]">NINE_ROUTER_URL=https://…</code>
            <code className="block bg-black/30 rounded px-2 py-1 text-[10px]">NINE_ROUTER_API_KEY=sk_9router</code>
            <code className="block bg-black/30 rounded px-2 py-1 text-[10px]">NINE_ROUTER_ENABLED=true</code>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Available models */}
          {models.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
              <button
                onClick={() => setShowModels(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-300">Available Models</span>
                  <span className="text-xs text-slate-600 bg-white/[0.04] px-2 py-0.5 rounded-full">{models.length}</span>
                </div>
                {showModels ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>}
              </button>
              {showModels && (
                <div className="grid grid-cols-2 gap-1 px-4 pb-4 max-h-64 overflow-y-auto">
                  {models.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/[0.02] rounded-lg px-3 py-1.5 truncate font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"/>
                      {m.id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deploy guide */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
            <button
              onClick={() => setDeployOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-amber-400" />
                <span className="text-sm font-semibold text-slate-300">Deployment options</span>
              </div>
              {deployOpen ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>}
            </button>
            {deployOpen && (
              <div className="px-5 pb-5 space-y-3">
                {/* Vercel proxy info banner */}
                <div className="flex items-start gap-2 text-xs text-indigo-300/80 bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-3 py-2.5">
                  <Info size={12} className="shrink-0 mt-0.5 text-indigo-400"/>
                  <span>
                    <strong>Built-in proxy:</strong> all browser calls automatically go through <code className="text-indigo-300">/api/9router/…</code> — a Next.js serverless route built into this app. Zero CORS issues, API key never exposed to the browser. You only need to provide a 9router URL (cloud or self-hosted).
                  </span>
                </div>

                {DEPLOY_OPTIONS.map((opt, i) => (
                  <div key={opt.name} className={cn(
                    'rounded-xl border bg-white/[0.02] p-4 space-y-2',
                    i === 0 ? 'border-indigo-500/30' : 'border-white/[0.06]',
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{opt.icon}</span>
                        <span className="text-sm font-semibold text-slate-200">{opt.name}</span>
                      </div>
                      <span className={cn('text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full', opt.badgeCls)}>
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                    {opt.note && (
                      <p className="text-[11px] text-slate-600 italic">{opt.note}</p>
                    )}
                    <div className="flex items-start gap-2 bg-black/40 rounded-lg px-3 py-2 font-mono text-xs text-slate-300">
                      <pre className="flex-1 whitespace-pre-wrap break-all">{opt.cmd}</pre>
                      <CopyBtn text={opt.cmd} />
                    </div>
                    {'link' in opt && opt.link && (
                      <a
                        href={opt.link as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Open {opt.name} <ExternalLink size={11}/>
                      </a>
                    )}
                    <button
                      onClick={() => { setUrl(opt.url); mark() }}
                      className="text-xs text-slate-600 hover:text-slate-300 transition-colors block"
                    >
                      → Use URL: <code>{opt.url}</code>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Info size={13} className="text-indigo-400"/>
              <span className="text-xs font-semibold text-slate-400">How it works</span>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              {[
                ['Free-tier request', 'Client sends model: "free" → server picks from routing config'],
                ['9Router enabled',   'Instead of calling provider directly, routes to 9router /v1/chat/completions'],
                ['Auto-fallback',     '9router tries Kiro AI → OpenCode Free → Vertex AI → cheap providers'],
                ['Token compression', 'RTK filter cuts input tokens 20–40%, Caveman mode cuts output 65%'],
                ['Pro users',         'Always use their selected model directly (bypass 9router)'],
              ].map(([step, desc]) => (
                <div key={step} className="flex gap-2">
                  <span className="text-slate-600 shrink-0 font-medium w-36">{step}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 9Router Dashboard iframe */}
      {iframeUrl && ping?.ok && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <button
            onClick={() => setShowIframe(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-[#0d0d1a] hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌐</span>
              <span className="text-sm font-semibold text-slate-300">9Router Dashboard</span>
              <span className="text-xs text-slate-600">via proxy → {externalUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs text-slate-500 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/[0.06]"
              >
                Open tab <ExternalLink size={11}/>
              </a>
              {showIframe ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>}
            </div>
          </button>

          {showIframe && (
            <div className="bg-white rounded-b-xl overflow-hidden" style={{ height: 700 }}>
              <iframe
                src={iframeUrl}
                className="w-full h-full border-0"
                title="9Router Dashboard"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          )}
        </div>
      )}

      {/* Not connected + iframe unavailable hint */}
      {iframeUrl && ping?.ok === false && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-dashed border-white/[0.08] text-slate-600 text-sm">
          <XCircle size={16} className="text-red-500/50 shrink-0"/>
          Dashboard requires 9router to be reachable at <code className="text-slate-500">{externalUrl}</code>
        </div>
      )}
    </div>
  )
}
