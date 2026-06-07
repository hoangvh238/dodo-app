import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const BodySchema = z.object({
  amount: z.number().int().min(-100_000).max(100_000).refine(n => n !== 0, 'Amount cannot be zero'),
  reason: z.enum(['admin_grant', 'admin_deduct', 'topup', 'refund', 'adjustment']),
  note:   z.string().max(200).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Invalid request', detail: (e as Error).message }, { status: 400 })
  }

  const db = createServiceClient()

  // Verify user exists
  const { data: user, error: findError } = await db
    .from('users').select('credits').eq('google_sub', id).single()
  if (findError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Apply credit change via RPC (handles atomicity)
  const rpcName  = body.amount > 0 ? 'add_credits' : 'deduct_credits'
  const absAmount = Math.abs(body.amount)

  const { data: ok, error: rpcError } = body.amount > 0
    ? await db.rpc('add_credits',    { p_google_sub: id, p_amount: absAmount })
    : await db.rpc('deduct_credits', { p_google_sub: id, p_amount: absAmount })

  if (rpcError) {
    return NextResponse.json({ error: 'Credit update failed', detail: rpcError.message }, { status: 500 })
  }
  if (body.amount < 0 && !ok) {
    return NextResponse.json({ error: 'Insufficient credits — would go negative' }, { status: 422 })
  }

  // Log the transaction
  await db.from('credit_transactions').insert({
    user_id: id,
    amount:  body.amount,
    reason:  body.reason,
    model:   null,
    tokens_in:  null,
    tokens_out: null,
    cost_usd:   null,
  })

  // Return updated balance
  const { data: updated } = await db.from('users').select('credits').eq('google_sub', id).single()
  return NextResponse.json({ success: true, newBalance: updated?.credits ?? 0, rpcUsed: rpcName })
}
