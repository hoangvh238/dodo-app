import { createServiceClient } from "@/lib/supabase/service";
import { formatDate, flagEmoji } from "@/lib/utils";

export default async function RecentEvents() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("events")
    .select("id, event_type, country_code, country, created_at, app_version")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-slate-100 mb-4">Recent Events</h2>
      {!data?.length ? (
        <p className="text-slate-500 text-sm">No events yet. Connect the Electron app using the SDK.</p>
      ) : (
        <div className="space-y-2">
          {data.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{flagEmoji(e.country_code ?? "")}</span>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-200 truncate block">{e.event_type}</span>
                  <span className="text-xs text-slate-500">{e.country ?? "Unknown"}</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 shrink-0 ml-2">{formatDate(e.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
