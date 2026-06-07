'use client'

import { useState, useRef } from 'react'
import {
  Send, ImagePlus, X, CheckCircle2, XCircle, Loader2,
  Zap, Clock, Hash, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProviderOption {
  provider: 'anthropic' | 'google' | 'openai'
  label: string
  configured: boolean
  models: { id: string; label: string; vision: boolean }[]
  color: string
  icon: string
}

const PROVIDERS: ProviderOption[] = [
  {
    provider:   'anthropic',
    label:      'Anthropic',
    configured: false,
    color:      'indigo',
    icon:       '🤖',
    models: [
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5',  vision: true },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6', vision: true },
    ],
  },
  {
    provider:   'google',
    label:      'Google',
    configured: false,
    color:      'emerald',
    icon:       '✨',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', vision: true },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', vision: true },
      { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   vision: true },
    ],
  },
  {
    provider:   'openai',
    label:      'OpenAI',
    configured: false,
    color:      'violet',
    icon:       '⚡',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', vision: true },
      { id: 'gpt-4o',      label: 'GPT-4o',      vision: true },
    ],
  },
]

const COLOR_BTN: Record<string, string> = {
  indigo:  'bg-indigo-600/80 hover:bg-indigo-600',
  emerald: 'bg-emerald-600/80 hover:bg-emerald-600',
  violet:  'bg-violet-600/80 hover:bg-violet-600',
}
const COLOR_TEXT: Record<string, string> = {
  indigo:  'text-indigo-400',
  emerald: 'text-emerald-400',
  violet:  'text-violet-400',
}

interface TestResult {
  ok: boolean
  text?: string
  error?: string
  isAuthError?: boolean
  usage?: { inputTokens: number; outputTokens: number }
  elapsed?: number
  model?: string
  keySource?: 'db' | 'env' | 'none'
}

interface ProviderCardProps {
  p: ProviderOption
  configured: boolean
}

function ProviderCard({ p, configured }: ProviderCardProps) {
  const [model,       setModel]       = useState(p.models[0].id)
  const [text,        setText]        = useState('Say hello in one sentence.')
  const [imageDataUrl, setImage]      = useState<string | null>(null)
  const [imageName,   setImageName]   = useState<string | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState<TestResult | null>(null)
  const [showModels,  setShowModels]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedModel = p.models.find(m => m.id === model) ?? p.models[0]

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Max image size: 5 MB'); return }
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImage(null)
    setImageName(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSend() {
    if (!text.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/test-key', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          provider:     p.provider,
          model,
          text:         text.trim(),
          imageDataUrl: imageDataUrl ?? undefined,
        }),
      })
      const data: TestResult = await res.json()
      if (!res.ok && res.status === 401) {
        setResult({ ok: false, error: 'Admin session expired — please refresh' })
      } else {
        setResult(data)
      }
    } catch {
      setResult({ ok: false, error: 'Network error — check if dev server is running' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      'rounded-xl border bg-[#0d0d1a] flex flex-col',
      configured ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="text-xl">{p.icon}</span>
          <div>
            <p className="font-semibold text-slate-200 text-sm">{p.label}</p>
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModels(v => !v)}
                className={cn('flex items-center gap-1 text-xs mt-0.5 transition-colors', COLOR_TEXT[p.color])}
              >
                {selectedModel.label}
                <ChevronDown size={11} />
              </button>
              {showModels && (
                <div className="absolute top-full left-0 mt-1 z-20 min-w-[180px] rounded-lg border border-white/[0.08] bg-[#12122a] shadow-xl overflow-hidden">
                  {p.models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m.id); setShowModels(false) }}
                      className={cn(
                        'flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors',
                        m.id === model ? 'text-slate-100 bg-white/[0.04]' : 'text-slate-400',
                      )}
                    >
                      {m.label}
                      {m.vision && <span className="text-[10px] text-slate-600 ml-2">vision</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={cn('w-2 h-2 rounded-full', configured ? 'bg-emerald-400' : 'bg-red-400/60')} />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {!configured && (
          <div className="text-xs text-slate-600 text-center py-2">
            Configure an API key above to enable testing
          </div>
        )}

        {/* Image preview */}
        {imageDataUrl && (
          <div className="relative w-fit">
            <img
              src={imageDataUrl}
              alt="upload preview"
              className="h-24 w-auto rounded-lg border border-white/[0.08] object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 transition-colors"
            >
              <X size={10} className="text-white" />
            </button>
            <p className="text-[10px] text-slate-600 mt-1 truncate max-w-[160px]">{imageName}</p>
          </div>
        )}

        {/* Text input */}
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={!configured || loading}
            rows={3}
            placeholder="Type a test message…"
            className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-white/20 disabled:opacity-50"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend() }}
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-slate-700">⌘↵</span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!configured || !selectedModel.vision || loading}
            title={selectedModel.vision ? 'Attach image' : 'Model does not support vision'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ImagePlus size={13} />
            {imageDataUrl ? 'Change image' : 'Add image'}
          </button>
          <button
            onClick={handleSend}
            disabled={!configured || loading || !text.trim()}
            className={cn(
              'ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
              COLOR_BTN[p.color],
            )}
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> Testing…</>
              : <><Send size={13} /> Send</>
            }
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={cn(
            'rounded-lg border text-xs overflow-hidden',
            result.ok
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-red-500/20 bg-red-500/5',
          )}>
            {/* Status bar */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 border-b',
              result.ok ? 'border-emerald-500/10' : 'border-red-500/10',
            )}>
              {result.ok
                ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                : <XCircle      size={13} className="text-red-400 shrink-0" />
              }
              <span className={result.ok ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                {result.ok ? 'Success' : result.isAuthError ? 'Auth error — check your API key' : 'Error'}
              </span>
              {result.ok && (
                <div className="ml-auto flex items-center gap-3 text-slate-500">
                  {result.elapsed && (
                    <span className="flex items-center gap-1"><Clock size={11} />{result.elapsed}ms</span>
                  )}
                  {result.usage && (
                    <span className="flex items-center gap-1">
                      <Hash size={11} />
                      {result.usage.inputTokens}↑ {result.usage.outputTokens}↓
                    </span>
                  )}
                  {result.keySource && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                      result.keySource === 'db' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-500',
                    )}>
                      {result.keySource}
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Body text */}
            <div className="px-3 py-2.5 leading-relaxed whitespace-pre-wrap text-slate-300 max-h-48 overflow-y-auto">
              {result.ok ? result.text : result.error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  configuredProviders: Set<'anthropic' | 'google' | 'openai'>
}

export default function ApiKeyTester({ configuredProviders }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap size={15} className="text-amber-400" />
        <h2 className="text-sm font-semibold text-slate-300">Live API Test</h2>
        <span className="text-xs text-slate-600">— runs server-side, keys never touch the browser</span>
      </div>

      {/* Cards grid */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
        {PROVIDERS.map(p => (
          <ProviderCard
            key={p.provider}
            p={p}
            configured={configuredProviders.has(p.provider)}
          />
        ))}
      </div>

      <p className="text-xs text-slate-700">
        Each test call goes through <code className="text-slate-500">/api/admin/test-key</code> — the raw key is fetched server-side and never returned to the browser.
        Max image size: 5 MB. Max response: 512 tokens.
      </p>
    </div>
  )
}
