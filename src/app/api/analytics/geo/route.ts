import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { GeoPoint } from "@/types/analytics";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("latitude, longitude, country, city")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cluster nearby points (round to 1 decimal = ~11km)
  const clusters: Record<string, GeoPoint> = {};
  for (const s of data ?? []) {
    const key = `${(s.latitude as number).toFixed(1)},${(s.longitude as number).toFixed(1)}`;
    if (!clusters[key]) {
      clusters[key] = {
        lat: s.latitude as number,
        lon: s.longitude as number,
        country: s.country ?? "Unknown",
        city: s.city ?? "Unknown",
        count: 0,
      };
    }
    clusters[key].count++;
  }

  const points = Object.values(clusters).sort((a, b) => b.count - a.count);
  return NextResponse.json(points);
}
