export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/service";
import StatsCards from "@/components/dashboard/StatsCards";
import ActivityChart from "@/components/dashboard/ActivityChart";
import RegionBreakdown from "@/components/dashboard/RegionBreakdown";
import TopEvents from "@/components/dashboard/TopEvents";
import RecentEvents from "@/components/dashboard/RecentEvents";
import type { OverviewStats } from "@/types/analytics";

async function getStats(): Promise<OverviewStats> {
  const supabase = createServiceClient();
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const ago24h = new Date(Date.now() - 86400 * 1000).toISOString();
  const ago30d = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const now    = new Date().toISOString();

  const [
    { count: totalEvents },
    { count: totalSessions },
    { count: todayEvents },
    { count: activeSessions },
    { data: eventTypesRaw },
    { data: countriesRaw },
    { data: timeSeriesRaw },
    { data: uniqueUsersRaw },
  ] = await Promise.all([
    supabase.from("events").select("*",   { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*",   { count: "exact", head: true }).gte("created_at", today.toISOString()),
    supabase.from("sessions").select("*", { count: "exact", head: true }).gte("last_seen_at", ago24h),
    supabase.rpc("get_event_type_counts", { from_date: ago30d, to_date: now }),
    supabase.rpc("get_top_countries",     { lim: 10 }),
    supabase.rpc("get_events_over_time",  { from_date: ago30d, to_date: now }),
    supabase.rpc("count_ip_users",        { p_search: null }),
  ]);

  const topEventTypes = (eventTypesRaw ?? []).map(
    (r: { event_type: string; cnt: number }) => ({ type: r.event_type, count: Number(r.cnt) })
  );
  const topCountries = (countriesRaw ?? []).map(
    (r: { country: string; country_code: string; cnt: number }) => ({
      country: r.country, country_code: r.country_code, count: Number(r.cnt),
    })
  );
  const eventsOverTime = (timeSeriesRaw ?? []).map(
    (r: { day: string; cnt: number }) => ({ date: r.day, count: Number(r.cnt) })
  );

  return {
    totalEvents:         totalEvents  ?? 0,
    totalSessions:       totalSessions ?? 0,
    uniqueUsers:         typeof uniqueUsersRaw === "number" ? uniqueUsersRaw : 0,
    uniqueCountries:     topCountries.length,
    todayEvents:         todayEvents  ?? 0,
    activeSessionsLast24h: activeSessions ?? 0,
    topEventTypes,
    eventsOverTime,
    topCountries,
  };
}

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Last 30 days · real-time events from Do It app</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ActivityChart data={stats.eventsOverTime} />
        </div>
        <TopEvents data={stats.topEventTypes} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RegionBreakdown data={stats.topCountries} />
        <RecentEvents />
      </div>
    </div>
  );
}
