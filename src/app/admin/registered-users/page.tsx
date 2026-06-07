export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import RegisteredUsersTable from '@/components/dashboard/RegisteredUsersTable'

async function getUsers(
  offset: number,
  limit: number,
  search?: string,
) {
  const db = createServiceClient()

  let query = db
    .from('users')
    .select(
      'google_sub, email, name, picture, app_version, os_platform, credits, plan_type, created_at, last_seen_at',
      { count: 'exact' },
    )
    .order('last_seen_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }

  const { data, count } = await query
  return { data: data ?? [], total: count ?? 0 }
}

export default async function RegisteredUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page   = Math.max(1, parseInt(params.page ?? '1'))
  const search = params.search
  const limit  = 50
  const offset = (page - 1) * limit

  const { data, total } = await getUsers(offset, limit, search)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Registered Users</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {total.toLocaleString()} users signed in via Google OAuth
        </p>
      </div>
      <RegisteredUsersTable users={data} total={total} page={page} search={search} limit={limit} />
    </div>
  )
}
