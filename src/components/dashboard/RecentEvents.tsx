import { createServiceClient } from "@/lib/supabase/service";
import { flagEmoji, formatRelative } from "@/lib/utils";

const EVENT_COLORS: Record<string, string> = {
  APP_START:        "bg-emerald-500/10 text-emerald-300",
  APP_QUIT:         "bg-slate-500/10 text-slate-400",
  AI_QUERY:         "bg-blue-500/10 text-blue-300",
  AI_QUERY_SUCCESS: "bg-indigo-500/10 text-indigo-300",
  AI_QUERY_ERROR:   "bg-red-500/10 text-red-300",
  OVERLAY_OPEN:     "bg-violet-500/10 text-violet-300",
  ERROR:            "bg-red-500/10 text-red-300",
};

export default async function RecentEvents() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("events")
    .select("id, event_type, country_code, country, city, created_at, app_version")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-100">Recent Events</h2>
        <span className="text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
          live
        </span>
      </div>

      {!data?.length ? (
        <p className="text-slate-600 text-sm">
          No events yet. Connect the Electron app using the SDK.
        </p>
      ) : (
        <div className="space-y-1">
          {data.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">{flagEmoji(e.country_code ?? "")}</span>
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      EVENT_COLORS[e.event_type] ?? "bg-indigo-500/10 text-indigo-300"
                    }`}
                  >
                    {e.event_type}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {e.city ? `${e.city}, ` : ""}{e.country ?? "Unknown"}
                    {e.app_version ? ` · v${e.app_version}` : ""}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-600 shrink-0 ml-2">
                {formatRelative(e.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
