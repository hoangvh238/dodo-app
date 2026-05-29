export const dynamic = "force-dynamic";
import SessionsTable from "@/components/dashboard/SessionsTable";
import { createServiceClient } from "@/lib/supabase/service";

async function getSessions(page: number) {
  const supabase = createServiceClient();
  const limit = 50;
  const offset = (page - 1) * limit;
  const { data, count } = await supabase
    .from("sessions")
    .select("*", { count: "exact" })
    .order("last_seen_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return { data: data ?? [], total: count ?? 0 };
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const { data, total } = await getSessions(page);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Sessions</h1>
        <p className="text-slate-400 text-sm mt-0.5">{total.toLocaleString()} total sessions</p>
      </div>
      <SessionsTable sessions={data} total={total} page={page} />
    </div>
  );
}
