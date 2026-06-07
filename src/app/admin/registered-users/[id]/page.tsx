export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import UserBillingDetail from '@/components/dashboard/UserBillingDetail'

async function getUser(id: string) {
  const db = createServiceClient()
  const [{ data: user }, { data: txns }] = await Promise.all([
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
  return { user, transactions: txns ?? [] }
}

export default async function UserBillingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, transactions } = await getUser(id)
  if (!user) notFound()

  return <UserBillingDetail user={user} transactions={transactions} />
}
