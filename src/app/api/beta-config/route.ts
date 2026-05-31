import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("beta_config")
      .select("phase, launch_date, announcement, beta_slots")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const payload = data ?? { phase: "open", launch_date: null, announcement: null, beta_slots: 10000 };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { phase: "open", launch_date: null, announcement: null, beta_slots: 10000 },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
