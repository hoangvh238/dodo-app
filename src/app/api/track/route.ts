import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getGeoLocation, extractIp } from "@/lib/geolocation";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Analytics-Key",
    },
  });
}

interface EventPayload {
  sessionId: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  appVersion?: string;
  osPlatform?: string;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("X-Analytics-Key");
  if (apiKey !== process.env.ANALYTICS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept both batch format { batch: [...] } and legacy single-event format
  const events: EventPayload[] = Array.isArray(body.batch)
    ? (body.batch as EventPayload[])
    : [body as unknown as EventPayload];

  if (events.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  // Validate: all events must have sessionId + eventType
  const valid = events.filter((e) => e.sessionId && e.eventType);
  if (valid.length === 0) {
    return NextResponse.json({ error: "Missing sessionId or eventType" }, { status: 400 });
  }

  // Geolocate once — all events in this batch share the same client IP
  const ip = extractIp(request);
  const geo = await getGeoLocation(ip);

  const geoFields = {
    ip_address:   ip,
    country:      geo?.country      ?? null,
    country_code: geo?.countryCode  ?? null,
    region:       geo?.region       ?? null,
    city:         geo?.city         ?? null,
    latitude:     geo?.latitude     ?? null,
    longitude:    geo?.longitude    ?? null,
  };

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Bulk insert all events in one query
  const eventRows = valid.map((e) => ({
    session_id:  e.sessionId,
    event_type:  e.eventType,
    event_data:  e.eventData ?? {},
    app_version: e.appVersion ?? null,
    os_platform: e.osPlatform ?? null,
    ...geoFields,
  }));

  const { error: evErr } = await supabase.from("events").insert(eventRows);
  if (evErr) console.error("[track] events insert error:", evErr.message);

  // Upsert the session using the last event's metadata (most up-to-date)
  const last = valid[valid.length - 1];
  const { error: sessErr } = await supabase.from("sessions").upsert(
    {
      id:          last.sessionId,
      app_version: last.appVersion ?? null,
      os_platform: last.osPlatform ?? null,
      last_seen_at: now,
      ...geoFields,
    },
    { onConflict: "id" }
  );
  if (sessErr) console.error("[track] session upsert error:", sessErr.message);

  return NextResponse.json(
    { ok: true, inserted: eventRows.length },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
