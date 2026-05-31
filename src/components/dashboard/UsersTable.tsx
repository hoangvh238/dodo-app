"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, ChevronLeft, ChevronRight, UserCircle2, Globe, Clock } from "lucide-react";
import { flagEmoji, formatRelative } from "@/lib/utils";
import type { IpUser } from "@/types/analytics";

interface Props {
  users:  IpUser[];
  total:  number;
  page:   number;
  search?: string;
}

const LIMIT = 50;

function maskIp(ip: string) {
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  const v6 = ip.split(":");
  if (v6.length > 2) return `${v6[0]}:${v6[1]}:****`;
  return ip;
}

export default function UsersTable({ users, total, page, search }: Props) {
  const router      = useRouter();
  const [, startT]  = useTransition();
  const [q, setQ]   = useState(search ?? "");
  const totalPages  = Math.ceil(total / LIMIT);

  function navigate(params: { page?: number; search?: string }) {
    const sp = new URLSearchParams();
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    if (params.search) sp.set("search", params.search);
    startT(() => router.push(`/admin/users?${sp.toString()}`));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: q || undefined, page: 1 });
  }

  function openUser(ip: string) {
    router.push(`/admin/users/${encodeURIComponent(ip)}`);
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by IP, city, or country…"
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </form>
        <span className="text-xs text-slate-600 ml-auto">
          {total.toLocaleString()} users · page {page} of {totalPages || 1}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["User", "Location", "Sessions", "Events", "First Seen", "Last Active"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <UserCircle2 size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No users found</p>
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr
                key={user.ip_address}
                onClick={() => openUser(user.ip_address)}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors group"
              >
                {/* User (masked IP) */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <UserCircle2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-300 group-hover:text-indigo-300 transition-colors">
                        {maskIp(user.ip_address)}
                      </p>
                      {user.city && (
                        <p className="text-[10px] text-slate-600">{user.city}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Location */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {user.country_code && (
                      <span className="text-base">{flagEmoji(user.country_code)}</span>
                    )}
                    <div>
                      <p className="text-xs text-slate-300">{user.country ?? "Unknown"}</p>
                      {user.region && (
                        <p className="text-[10px] text-slate-600">{user.region}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Sessions */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-bold">
                      {user.session_count > 99 ? "99+" : user.session_count}
                    </span>
                    <span className="text-[10px] text-slate-600">sessions</span>
                  </div>
                </td>

                {/* Events */}
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold text-slate-200 tabular-nums">
                    {Number(user.total_events).toLocaleString()}
                  </span>
                </td>

                {/* First Seen */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Globe size={11} />
                    {formatRelative(user.first_seen)}
                  </div>
                </td>

                {/* Last Active */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={11} />
                    {formatRelative(user.last_seen)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
          <button
            onClick={() => navigate({ page: page - 1, search: search })}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/[0.06] text-slate-400 hover:text-slate-100 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={13} /> Previous
          </button>
          <span className="text-xs text-slate-600">{page} / {totalPages}</span>
          <button
            onClick={() => navigate({ page: page + 1, search: search })}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/[0.06] text-slate-400 hover:text-slate-100 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
