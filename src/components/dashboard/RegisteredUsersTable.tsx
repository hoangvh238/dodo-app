'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegUser {
  google_sub: string
  email: string
  name: string | null
  picture: string | null
  app_version: string | null
  os_platform: string | null
  credits: number
  plan_type: string
  created_at: string
  last_seen_at: string
}

interface Props {
  users: RegUser[]
  total: number
  page: number
  search?: string
  limit: number
}

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-slate-700 text-slate-300',
  pro:  'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtRel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 2)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function RegisteredUsersTable({ users, total, page, search, limit }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const [q, setQ]   = useState(search ?? '')
  const [, start]   = useTransition()
  const totalPages  = Math.max(1, Math.ceil(total / limit))

  function navigate(p: number, s?: string) {
    const params = new URLSearchParams()
    if (p > 1) params.set('page', String(p))
    const sq = s !== undefined ? s : q
    if (sq) params.set('search', sq)
    start(() => { router.push(`${pathname}?${params.toString()}`) })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(1, q)
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full bg-[#12122a] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0d0d1a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Platform</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-600">
                  No users found
                </td>
              </tr>
            )}
            {users.map(u => (
              <tr key={u.google_sub} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/registered-users/${encodeURIComponent(u.google_sub)}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center">
                      {u.picture
                        ? <img src={u.picture} alt="" className="w-full h-full object-cover" />
                        : <User size={14} className="text-slate-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">{u.name ?? '—'}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full', PLAN_BADGE[u.plan_type] ?? PLAN_BADGE.free)}>
                    {u.plan_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn('font-mono text-sm font-semibold', u.credits < 10 ? 'text-red-400' : u.credits < 50 ? 'text-amber-400' : 'text-emerald-400')}>
                    {u.credits.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                  {[u.os_platform, u.app_version].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs whitespace-nowrap">{fmt(u.created_at)}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs whitespace-nowrap">
                    <Clock size={12} />
                    {fmtRel(u.last_seen_at)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">
          {total.toLocaleString()} total · page {page} of {totalPages}
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => navigate(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-white/[0.06] text-slate-400 hover:text-slate-100 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => navigate(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-white/[0.06] text-slate-400 hover:text-slate-100 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
