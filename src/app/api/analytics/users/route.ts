import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page   = parseInt(searchParams.get("page")   ?? "1");
  const limit  = parseInt(searchParams.get("limit")  ?? "50");
  const search = searchParams.get("search") ?? null;

  const offset  = (page - 1) * limit;
  const supabase = createServiceClient();

  const [{ data }, { data: countRaw }] = await Promise.all([
    supabase.rpc("get_ip_users", {
      p_limit:  limit,
      p_offset: offset,
      p_search: search,
    }),
    supabase.rpc("count_ip_users", { p_search: search }),
  ]);

  const total = Number(countRaw ?? 0);

  return NextResponse.json({ data: data ?? [], total, page, limit });
}
