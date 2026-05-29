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
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ago24h = new Date(Date.now() - 86400 * 1000).toISOString();
  const ago30d = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

  const [
    { count: totalEvents },
    { count: totalSessions },
    { count: todayEvents },
    { count: activeSessions },
    { data: eventTypesRaw },
    { data: countriesRaw },
    { data: timeSeriesRaw },
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    supabase.from("sessions").select("*", { count: "exact", head: true }).gte("last_seen_at", ago24h),
    supabase.from("events").select("event_type").gte("created_at", ago30d),
    supabase.from("sessions").select("country, country_code").not("country", "is", null),
    supabase.from("events").select("created_at").gte("created_at", ago30d).order("created_at"),
  ]);

  const typeMap: Record<string, number> = {};
  for (const e of eventTypesRaw ?? []) {
    typeMap[e.event_type] = (typeMap[e.event_type] ?? 0) + 1;
  }
  const topEventTypes = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([type, count]) => ({ type, count }));

  const countryMap: Record<string, { country: string; country_code: string; count: number }> = {};
  for (const s of countriesRaw ?? []) {
    if (!s.country) continue;
    const key = s.country_code ?? s.country;
    if (!countryMap[key]) countryMap[key] = { country: s.country, country_code: s.country_code ?? "", count: 0 };
    countryMap[key].count++;
  }
  const topCountries = Object.values(countryMap).sort((a, b) => b.count - a.count).slice(0, 10);

  const dateMap: Record<string, number> = {};
  for (const e of timeSeriesRaw ?? []) {
    const d = (e.created_at as string).slice(0, 10);
    dateMap[d] = (dateMap[d] ?? 0) + 1;
  }
  const eventsOverTime = Object.entries(dateMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

  return {
    totalEvents: totalEvents ?? 0,
    totalSessions: totalSessions ?? 0,
    uniqueCountries: Object.keys(countryMap).length,
    todayEvents: todayEvents ?? 0,
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
        <p className="text-slate-400 text-sm mt-0.5">Last 30 days · real-time events from Do It app</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ActivityChart data={stats.eventsOverTime} />
        </div>
        <div>
          <TopEvents data={stats.topEventTypes} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RegionBreakdown data={stats.topCountries} />
        <RecentEvents />
      </div>
    </div>
  );
}
