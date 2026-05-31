export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/service";
import UsersTable from "@/components/dashboard/UsersTable";
import type { IpUser } from "@/types/analytics";

async function getUsers(page: number, search?: string): Promise<{ data: IpUser[]; total: number }> {
  const supabase = createServiceClient();
  const limit  = 50;
  const offset = (page - 1) * limit;

  const [{ data }, { data: countRaw }] = await Promise.all([
    supabase.rpc("get_ip_users", {
      p_limit:  limit,
      p_offset: offset,
      p_search: search ?? null,
    }),
    supabase.rpc("count_ip_users", { p_search: search ?? null }),
  ]);

  const total = typeof countRaw === "number" ? countRaw : 0;
  return { data: (data ?? []) as IpUser[], total };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page   = parseInt(params.page ?? "1");
  const search = params.search;

  const { data, total } = await getUsers(page, search);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Users</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {total.toLocaleString()} unique users tracked by IP address
        </p>
      </div>
      <UsersTable users={data} total={total} page={page} search={search} />
    </div>
  );
}
