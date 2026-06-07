'use client'

import { useState, useEffect, useRef } from 'react'
import { Ticket, Loader2, CheckCircle2, AlertTriangle, Coins, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// The overlay app stores the Google access token in localStorage under this key.
// Update to match your overlay's actual key if different.
const TOKEN_KEYS = ['snapaha_access_token', 'google_access_token', 'auth_token']

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  for (const k of TOKEN_KEYS) {
    const t = localStorage.getItem(k)
    if (t) return t
  }
  return null
}

// Auto-format input as XXXX-XXXX-XXXX
function formatCode(raw: string): string {
  const clean = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 12)
  const parts = [clean.slice(0, 4), clean.slice(4, 8), clean.slice(8, 12)].filter(Boolean)
  return parts.join('-')
}

type State =
  | { phase: 'idle' }
  | { phase: 'no_token' }
  | { phase: 'ready'; token: string }
  | { phase: 'loading' }
  | { phase: 'success'; credits_added: number; new_balance: number; note: string | null }
  | { phase: 'error'; message: string }

export default function RedeemPage() {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const [code,  setCode]  = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = getStoredToken()
    // Also check URL param ?t= (overlay can pass token when opening the web view)
    const urlToken = new URLSearchParams(window.location.search).get('t')
    const token = urlToken || t
    if (token) {
      setState({ phase: 'ready', token })
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setState({ phase: 'no_token' })
    }
  }, [])

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    if (state.phase !== 'ready') return
    const token = state.token
    setState({ phase: 'loading' })

    try {
      const res = await fetch('/api/user/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code }),
      })
      const d = await res.json()
      if (!res.ok) {
        setState({ phase: 'error', message: d.error ?? 'Redemption failed.' })
        return
      }
      setState({ phase: 'success', credits_added: d.credits_added, new_balance: d.new_balance, note: d.note })
      setCode('')
    } catch {
      setState({ phase: 'error', message: 'Network error. Please try again.' })
    }
  }

  function tryAgain() {
    const t = getStoredToken() || new URLSearchParams(window.location.search).get('t')
    setState(t ? { phase: 'ready', token: t } : { phase: 'no_token' })
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-2">
            <Ticket size={24} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Redeem Voucher</h1>
          <p className="text-slate-500 text-sm">Enter your code to receive free credits</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d1a] p-6 shadow-2xl">

          {/* No token */}
          {state.phase === 'no_token' && (
            <div className="text-center space-y-4 py-4">
              <AlertTriangle size={32} className="text-amber-400 mx-auto" />
              <div>
                <p className="text-slate-200 font-medium">Not signed in</p>
                <p className="text-slate-500 text-sm mt-1">
                  Open SnapAha overlay first, then return here.
                  Or sign in via the overlay to get your access token.
                </p>
              </div>
              <div className="text-xs text-slate-700 bg-black/30 rounded-xl px-4 py-3 space-y-1 text-left">
                <p className="text-slate-600 font-semibold mb-1">How to redeem:</p>
                <p>1. Open the SnapAha overlay app</p>
                <p>2. Go to Profile → Redeem Code</p>
                <p>3. Or open this page from within the overlay</p>
              </div>
            </div>
          )}

          {/* Loading spinner while detecting token */}
          {state.phase === 'idle' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-slate-600" />
            </div>
          )}

          {/* Redemption form */}
          {(state.phase === 'ready' || state.phase === 'loading') && (
            <form onSubmit={handleRedeem} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">Voucher Code</label>
                <input
                  ref={inputRef}
                  value={code}
                  onChange={e => setCode(formatCode(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength={14}
                  spellCheck={false}
                  autoComplete="off"
                  className={cn(
                    'w-full bg-[#12122a] border rounded-xl px-4 py-3.5 text-xl font-mono font-bold tracking-[0.2em] text-slate-100',
                    'text-center placeholder:text-slate-700 placeholder:text-base placeholder:tracking-normal',
                    'focus:outline-none focus:border-indigo-500/60 border-white/[0.08]',
                    'transition-colors',
                  )}
                  disabled={state.phase === 'loading'}
                />
              </div>

              <button
                type="submit"
                disabled={state.phase === 'loading' || code.replace(/-/g, '').length < 12}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
              >
                {state.phase === 'loading'
                  ? <><Loader2 size={16} className="animate-spin"/> Checking…</>
                  : <><Ticket size={16}/> Redeem Code <ArrowRight size={14}/></>
                }
              </button>
            </form>
          )}

          {/* Success */}
          {state.phase === 'success' && (
            <div className="text-center space-y-5 py-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>

              <div>
                <p className="text-slate-100 font-semibold text-lg">Code Redeemed!</p>
                {state.note && <p className="text-slate-500 text-sm mt-0.5">{state.note}</p>}
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[11px] text-slate-600 uppercase tracking-wide">Added</p>
                  <p className="text-2xl font-bold text-amber-400 flex items-center gap-1.5">
                    <Coins size={18}/>+{state.credits_added.toLocaleString()}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]"/>
                <div className="text-center">
                  <p className="text-[11px] text-slate-600 uppercase tracking-wide">New balance</p>
                  <p className="text-2xl font-bold text-slate-200">{state.new_balance.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={tryAgain}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Redeem another code →
              </button>
            </div>
          )}

          {/* Error */}
          {state.phase === 'error' && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-slate-100 font-medium">Redemption Failed</p>
                <p className="text-red-400 text-sm mt-1">{state.message}</p>
              </div>
              <button
                onClick={tryAgain}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Try again →
              </button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-700">
          One redemption per account · Codes are case-insensitive · No expiry unless stated
        </p>
      </div>
    </div>
  )
}
