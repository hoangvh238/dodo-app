import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ip: string }> }
) {
  const { ip: encodedIp } = await params;
  const ip = decodeURIComponent(encodedIp);
  const { searchParams } = new URL(request.url);
  const sessionPage   = parseInt(searchParams.get("spage") ?? "1");
  const sessionLimit  = 10;
  const sessionOffset = (sessionPage - 1) * sessionLimit;

  const supabase = createServiceClient();

  const [
    { data: profileRaw },
    { data: sessions },
    { data: eventTypes },
    { data: activityRaw },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.rpc("get_ip_user_profile", { p_ip: ip }),
    supabase.rpc("get_sessions_for_ip", {
      p_ip:     ip,
      p_limit:  sessionLimit,
      p_offset: sessionOffset,
    }),
    supabase.rpc("get_event_types_for_ip", { p_ip: ip }),
    supabase.rpc("get_user_events_over_time", { p_ip: ip }),
    supabase
      .from("events")
      .select("id,event_type,event_data,created_at,app_version,os_platform")
      .eq("ip_address", ip)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!profileRaw || (Array.isArray(profileRaw) && profileRaw.length === 0)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

  const eventTypeList = (eventTypes ?? []).map(
    (r: { event_type: string; cnt: number }) => ({ type: r.event_type, count: Number(r.cnt) })
  );

  const activity = (activityRaw ?? []).map(
    (r: { day: string; cnt: number }) => ({ date: r.day, count: Number(r.cnt) })
  );

  return NextResponse.json({
    profile,
    sessions: sessions ?? [],
    eventTypes: eventTypeList,
    activity,
    recentEvents: recentEvents ?? [],
  });
}
