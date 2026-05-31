import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const revalidate = 60;

const DRIVE_PATTERNS = [
  /drive\.usercontent\.google\.com\/download[^?]*\?.*[?&]id=([a-zA-Z0-9_-]{10,})/,
  /drive\.google\.com\/uc[^?]*\?.*[?&]id=([a-zA-Z0-9_-]{10,})/,
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/,
];

function resolveDownloadUrl(raw: string): string {
  for (const re of DRIVE_PATTERNS) {
    const m = raw.match(re);
    if (m) {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
      return `${base}/api/download/drive/${m[1]}`;
    }
  }
  // Already a proxy path — make absolute
  if (raw.startsWith("/api/download/drive/")) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return `${base}${raw}`;
  }
  return raw;
}

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("app_version_config")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error("[version] no active config:", error?.message);
    return NextResponse.json({ error: "No version config found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      minVersion:    data.min_version,
      latestVersion: data.latest_version,
      downloadUrl:   resolveDownloadUrl(data.download_url ?? ""),
      releaseNotes:  data.release_notes  ?? "",
      buildHash:     data.build_hash     ?? null,
      customMessage: data.custom_message ?? null,
      blocked:       data.is_blocked     ?? false,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
