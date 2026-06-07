import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(req.url)
  const limit  = Math.min(100, parseInt(url.searchParams.get('limit')  ?? '50'))
  const offset = parseInt(url.searchParams.get('offset') ?? '0')
  const search = url.searchParams.get('search') ?? undefined

  const db = createServiceClient()

  let query = db
    .from('users')
    .select(
      'google_sub, email, name, picture, app_version, os_platform, credits, plan_type, plan_expires_at, signup_bonus_granted, created_at, last_seen_at',
      { count: 'exact' },
    )
    .order('last_seen_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}
