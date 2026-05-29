import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Revalidate every 60s so Vercel edge cache stays fresh without hitting Supabase on every request
export const revalidate = 60;

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
      downloadUrl:   data.download_url,
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
