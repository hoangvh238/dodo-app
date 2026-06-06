"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, flagEmoji } from "@/lib/utils";
import type { Event } from "@/types/analytics";

interface Props {
  events:      Event[];
  total:       number;
  page:        number;
  eventTypes:  string[];
  currentType?: string;
}

const LIMIT = 50;

const EVENT_BADGE: Record<string, string> = {
  APP_START:         "bg-emerald-500/10 text-emerald-300",
  APP_QUIT:          "bg-slate-500/10 text-slate-400",
  AI_QUERY:          "bg-blue-500/10 text-blue-300",
  AI_QUERY_SUCCESS:  "bg-indigo-500/10 text-indigo-300",
  AI_QUERY_ERROR:    "bg-red-500/10 text-red-300",
  OVERLAY_OPEN:      "bg-violet-500/10 text-violet-300",
  OVERLAY_CLOSE:     "bg-purple-500/10 text-purple-300",
  ERROR:             "bg-red-500/10 text-red-300",
};

function eventBadgeClass(type: string) {
  return EVENT_BADGE[type] ?? "bg-indigo-500/10 text-indigo-300";
}

export default function EventsTable({ events, total, page, eventTypes, currentType }: Props) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const totalPages = Math.ceil(total / LIMIT);

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", params.page);
    if (params.type) sp.set("type", params.type);
    startT(() => router.push(`/admin/events?${sp.toString()}`));
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
      {/* Filters */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] flex-wrap">
        <select
          value={currentType ?? ""}
          onChange={(e) => navigate({ type: e.target.value || undefined, page: "1" })}
          className="bg-white/5 border border-white/[0.06] text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
        >
          <option value="">All event types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-slate-600 ml-auto">
          {total.toLocaleString()} events · page {page} of {totalPages || 1}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Time", "Event", "Location", "Version", "OS", "Data"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-600 text-sm">
                  No events yet
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(e.created_at)}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${eventBadgeClass(e.event_type)}`}>
                    {e.event_type}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {e.country_code && <span className="mr-1">{flagEmoji(e.country_code)}</span>}
                  {e.city && `${e.city}, `}{e.country ?? "—"}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">{e.app_version ?? "—"}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{e.os_platform ?? "—"}</td>
                <td className="px-5 py-3 text-[10px] text-slate-600 font-mono max-w-xs">
                  {Object.keys(e.event_data ?? {}).length > 0 ? (
                    <span className="break-all line-clamp-3 leading-relaxed">
                      {JSON.stringify(e.event_data)}
                    </span>
                  ) : "—"}
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
            onClick={() => navigate({ page: String(page - 1), type: currentType })}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/[0.06] text-slate-400 hover:text-slate-100 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={13} /> Previous
          </button>
          <span className="text-xs text-slate-600">{page} / {totalPages}</span>
          <button
            onClick={() => navigate({ page: String(page + 1), type: currentType })}
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
