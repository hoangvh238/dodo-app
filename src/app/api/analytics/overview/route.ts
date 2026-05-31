import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { OverviewStats } from "@/types/analytics";

export async function GET() {
  const supabase = createServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();
  const ago24h = new Date(Date.now() - 86400 * 1000).toISOString();
  const ago30d = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const now = new Date().toISOString();

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
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("sessions").select("*", { count: "exact", head: true }).gte("last_seen_at", ago24h),
    supabase.rpc("get_event_type_counts", { from_date: ago30d, to_date: now }),
    supabase.rpc("get_top_countries", { lim: 10 }),
    supabase.rpc("get_events_over_time", { from_date: ago30d, to_date: now }),
    supabase.rpc("count_ip_users", { p_search: null }),
  ]);

  const topEventTypes = (eventTypesRaw ?? []).map(
    (r: { event_type: string; cnt: number }) => ({ type: r.event_type, count: r.cnt })
  );

  const topCountries = (countriesRaw ?? []).map(
    (r: { country: string; country_code: string; cnt: number }) => ({
      country: r.country,
      country_code: r.country_code,
      count: r.cnt,
    })
  );

  const eventsOverTime = (timeSeriesRaw ?? []).map(
    (r: { day: string; cnt: number }) => ({ date: r.day, count: r.cnt })
  );

  const stats: OverviewStats = {
    totalEvents: totalEvents ?? 0,
    totalSessions: totalSessions ?? 0,
    uniqueUsers: typeof uniqueUsersRaw === "number" ? uniqueUsersRaw : 0,
    uniqueCountries: topCountries.length,
    todayEvents: todayEvents ?? 0,
    activeSessionsLast24h: activeSessions ?? 0,
    topEventTypes,
    eventsOverTime,
    topCountries,
  };

  return NextResponse.json(stats);
}
