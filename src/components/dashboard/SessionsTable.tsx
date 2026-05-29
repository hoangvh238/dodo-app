"use client";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-medium">Session ID</th>
              <th className="text-left px-5 py-3 font-medium">Location</th>
              <th className="text-left px-5 py-3 font-medium">IP</th>
              <th className="text-left px-5 py-3 font-medium">OS / Version</th>
              <th className="text-left px-5 py-3 font-medium">Last Seen</th>
              <th className="text-left px-5 py-3 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-sm">
                  No sessions yet
                </td>
              </tr>
            )}
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-400 max-w-[140px] truncate">
                  {s.id}
                </td>
                <td className="px-5 py-3 text-xs text-slate-300 whitespace-nowrap">
                  {s.country_code && <span className="mr-1">{flagEmoji(s.country_code)}</span>}
                  {s.city && `${s.city}, `}{s.country ?? "—"}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400 font-mono">{s.ip_address}</td>
                <td className="px-5 py-3 text-xs text-slate-400">
                  {s.os_platform ?? "—"}{s.app_version ? ` · v${s.app_version}` : ""}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true })}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(s.started_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-slate-700">
          <button
            onClick={() => router.push(`/sessions?page=${page - 1}`)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">{page} / {totalPages}</span>
          <button
            onClick={() => router.push(`/sessions?page=${page + 1}`)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
