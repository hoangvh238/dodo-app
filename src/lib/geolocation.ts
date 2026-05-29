import type { GeoLocation } from "@/types/analytics";

const LOCAL_PREFIXES = [
  "127.", "::1", "::ffff:127.",
  "192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.",
  "172.2", "172.3", "fc00:", "fd",
];

function isLocal(ip: string): boolean {
  return LOCAL_PREFIXES.some((p) => ip.startsWith(p));
}

// In-memory cache: ip → { data, expiresAt }
const geoCache = new Map<string, { data: GeoLocation | null; expiresAt: number }>();
const GEO_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  if (isLocal(ip)) {
    return { ip, country: "Local", countryCode: "LO", region: "Local Network", city: "Local", latitude: 0, longitude: 0 };
  }

  const cached = geoCache.get(ip);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,timezone,isp`
    );
    if (!res.ok) { geoCache.set(ip, { data: null, expiresAt: Date.now() + GEO_TTL_MS }); return null; }

    const d = await res.json() as Record<string, unknown>;
    if (d["status"] !== "success") { geoCache.set(ip, { data: null, expiresAt: Date.now() + GEO_TTL_MS }); return null; }

    const geo: GeoLocation = {
      ip,
      country:     d["country"]     as string,
      countryCode: d["countryCode"] as string,
      region:      d["regionName"]  as string,
      city:        d["city"]        as string,
      latitude:    d["lat"]         as number,
      longitude:   d["lon"]         as number,
      timezone:    d["timezone"]    as string | undefined,
      isp:         d["isp"]         as string | undefined,
    };
    geoCache.set(ip, { data: geo, expiresAt: Date.now() + GEO_TTL_MS });
    return geo;
  } catch {
    return null;
  }
}

export function extractIp(request: Request): string {
  // Vercel / reverse proxy
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "127.0.0.1";
}
