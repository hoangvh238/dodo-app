export const dynamic = "force-dynamic";
import EventsTable from "@/components/dashboard/EventsTable";
import { createServiceClient } from "@/lib/supabase/service";

async function getEvents(page: number, type?: string) {
  const supabase = createServiceClient();
  const limit  = 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("event_type", type);

  const { data, count } = await query;
  return { data: data ?? [], total: count ?? 0 };
}

async function getEventTypes(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("get_distinct_event_types");
  return (data ?? []).map((r: { event_type: string }) => r.event_type);
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const type = params.type;

  const [{ data, total }, eventTypes] = await Promise.all([
    getEvents(page, type),
    getEventTypes(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Events</h1>
        <p className="text-slate-400 text-sm mt-0.5">{total.toLocaleString()} total events</p>
      </div>
      <EventsTable
        events={data}
        total={total}
        page={page}
        eventTypes={eventTypes}
        currentType={type}
      />
    </div>
  );
}
