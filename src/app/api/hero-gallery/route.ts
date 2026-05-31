import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("hero_gallery")
      .select("id, title, file_url, file_type, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json([], { headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
