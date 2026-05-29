"use client";
import { useRouter } from "next/navigation";
import { formatDate, flagEmoji } from "@/lib/utils";
import type { Event } from "@/types/analytics";

interface Props {
  events: Event[];
  total: number;
  page: number;
  eventTypes: string[];
  currentType?: string;
}

const LIMIT = 50;

export default function EventsTable({ events, total, page, eventTypes, currentType }: Props) {
  const router = useRouter();
  const totalPages = Math.ceil(total / LIMIT);

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", params.page);
    if (params.type) sp.set("type", params.type);
    router.push(`/events?${sp.toString()}`);
  }

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-700 flex-wrap">
        <select
          value={currentType ?? ""}
          onChange={(e) => navigate({ type: e.target.value || undefined, page: "1" })}
          className="bg-bg-base border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand"
        >
          <option value="">All event types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500 ml-auto">
          {total.toLocaleString()} results · page {page} of {totalPages}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-medium">Time</th>
              <th className="text-left px-5 py-3 font-medium">Event</th>
              <th className="text-left px-5 py-3 font-medium">Location</th>
              <th className="text-left px-5 py-3 font-medium">Version</th>
              <th className="text-left px-5 py-3 font-medium">OS</th>
              <th className="text-left px-5 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-sm">
                  No events yet
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {formatDate(e.created_at)}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand/15 text-brand">
                    {e.event_type}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-300 whitespace-nowrap">
                  {e.country_code && <span className="mr-1">{flagEmoji(e.country_code)}</span>}
                  {e.city && `${e.city}, `}{e.country ?? "—"}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">{e.app_version ?? "—"}</td>
                <td className="px-5 py-3 text-xs text-slate-400">{e.os_platform ?? "—"}</td>
                <td className="px-5 py-3 text-xs text-slate-500 font-mono max-w-xs truncate">
                  {Object.keys(e.event_data).length > 0
                    ? JSON.stringify(e.event_data)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-slate-700">
          <button
            onClick={() => navigate({ page: String(page - 1), type: currentType })}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => navigate({ page: String(page + 1), type: currentType })}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
