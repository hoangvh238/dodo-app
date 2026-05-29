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

  const [
    { count: totalEvents },
    { count: totalSessions },
    { count: todayEvents },
    { count: activeSessions },
    { data: eventTypes },
    { data: countries },
    { data: timeSeries },
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("sessions").select("*", { count: "exact", head: true }).gte("last_seen_at", ago24h),
    supabase
      .from("events")
      .select("event_type")
      .gte("created_at", ago30d)
      .order("event_type"),
    supabase
      .from("sessions")
      .select("country, country_code")
      .not("country", "is", null),
    supabase
      .from("events")
      .select("created_at")
      .gte("created_at", ago30d)
      .order("created_at"),
  ]);

  // Aggregate event types
  const typeMap: Record<string, number> = {};
  for (const e of eventTypes ?? []) {
    typeMap[e.event_type] = (typeMap[e.event_type] ?? 0) + 1;
  }
  const topEventTypes = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => ({ type, count }));

  // Aggregate countries
  const countryMap: Record<string, { country: string; country_code: string; count: number }> = {};
  for (const s of countries ?? []) {
    if (!s.country) continue;
    const key = s.country_code ?? s.country;
    if (!countryMap[key]) {
      countryMap[key] = { country: s.country, country_code: s.country_code ?? "", count: 0 };
    }
    countryMap[key].count++;
  }
  const topCountries = Object.values(countryMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Events over time (daily buckets)
  const dateMap: Record<string, number> = {};
  for (const e of timeSeries ?? []) {
    const d = e.created_at.slice(0, 10);
    dateMap[d] = (dateMap[d] ?? 0) + 1;
  }
  const eventsOverTime = Object.entries(dateMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  const stats: OverviewStats = {
    totalEvents: totalEvents ?? 0,
    totalSessions: totalSessions ?? 0,
    uniqueCountries: Object.keys(countryMap).length,
    todayEvents: todayEvents ?? 0,
    activeSessionsLast24h: activeSessions ?? 0,
    topEventTypes,
    eventsOverTime,
    topCountries,
  };

  return NextResponse.json(stats);
}
