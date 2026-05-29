export const dynamic = "force-dynamic";
import GeoMap from "@/components/dashboard/GeoMap";
import { createServiceClient } from "@/lib/supabase/service";
import type { GeoPoint } from "@/types/analytics";

async function getGeoPoints(): Promise<GeoPoint[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("sessions")
    .select("latitude, longitude, country, city")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const clusters: Record<string, GeoPoint> = {};
  for (const s of data ?? []) {
    const key = `${(s.latitude as number).toFixed(1)},${(s.longitude as number).toFixed(1)}`;
    if (!clusters[key]) {
      clusters[key] = { lat: s.latitude as number, lon: s.longitude as number, country: s.country ?? "Unknown", city: s.city ?? "Unknown", count: 0 };
    }
    clusters[key].count++;
  }
  return Object.values(clusters).sort((a, b) => b.count - a.count);
}

export default async function MapPage() {
  const points = await getGeoPoints();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Geographic Map</h1>
        <p className="text-slate-400 text-sm mt-0.5">{points.length} unique locations · IP-based geolocation</p>
      </div>
      <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        <GeoMap points={points} />
      </div>
    </div>
  );
}
