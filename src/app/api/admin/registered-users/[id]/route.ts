import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createServiceClient()

  const [{ data: user, error: userError }, { data: txns, error: txnError }] = await Promise.all([
    db.from('users')
      .select('google_sub, email, name, picture, app_version, os_platform, credits, plan_type, plan_expires_at, signup_bonus_granted, created_at, last_seen_at')
      .eq('google_sub', id)
      .single(),
    db.from('credit_transactions')
      .select('id, amount, reason, model, tokens_in, tokens_out, cost_usd, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user, transactions: txns ?? [] })
}
