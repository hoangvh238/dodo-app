"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, flagEmoji } from "@/lib/utils";
import type { Session } from "@/types/analytics";
import { formatDistanceToNow } from "date-fns";

interface Props {
  sessions: Session[];
  total: number;
  page: number;
}

const LIMIT = 50;

export default function SessionsTable({ sessions, total, page }: Props) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const totalPages = Math.ceil(total / LIMIT);

  function goTo(p: number) {
    startT(() => router.push(`/admin/sessions?page=${p}`));
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <span className="text-xs text-slate-600">
          {total.toLocaleString()} sessions
        </span>
        <span className="text-xs text-slate-600">page {page} of {totalPages || 1}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Session ID", "Location", "IP", "OS / Version", "Events", "Last Seen", "Started"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-slate-600 text-sm">
                  No sessions yet
                </td>
              </tr>
            )}
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-500 max-w-[140px] truncate">
                  {s.id.slice(0, 18)}…
                </td>
                <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {s.country_code && <span className="mr-1">{flagEmoji(s.country_code)}</span>}
                  {s.city && `${s.city}, `}{s.country ?? "—"}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                  {s.ip_address ?? "—"}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {s.os_platform ?? "—"}{s.app_version ? ` · v${s.app_version}` : ""}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-semibold text-slate-300 tabular-nums">
                    {s.events_count}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true })}
                </td>
                <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap">
                  {formatDate(s.started_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/[0.06] text-slate-400 hover:text-slate-100 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={13} /> Previous
          </button>
          <span className="text-xs text-slate-600">{page} / {totalPages}</span>
          <button
            onClick={() => goTo(page + 1)}
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
