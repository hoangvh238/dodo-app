import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

// Alphabet without ambiguous chars: no O, 0, I, 1, L
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  const pick = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
  return `${pick()}-${pick()}-${pick()}`
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const [{ data: vouchers }, { data: redemptions }] = await Promise.all([
    db.from('vouchers').select('*').order('created_at', { ascending: false }),
    db.from('voucher_redemptions').select('voucher_id, google_sub, ip_address, redeemed_at'),
  ])

  // Attach redemption list per voucher
  const redMap = new Map<string, typeof redemptions>()
  for (const r of redemptions ?? []) {
    const arr = redMap.get(r.voucher_id) ?? []
    arr.push(r)
    redMap.set(r.voucher_id, arr)
  }

  const result = (vouchers ?? []).map(v => ({
    ...v,
    redemptions: redMap.get(v.id) ?? [],
  }))

  return NextResponse.json(result)
}

const CreateSchema = z.object({
  code:      z.string().max(64).optional(),   // omit = auto-generate
  credits:   z.number().int().min(1).max(100_000),
  max_uses:  z.number().int().min(1).nullable().default(1),
  expires_at: z.string().nullable().default(null),
  note:      z.string().max(200).optional().default(''),
})

export async function POST(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof CreateSchema>
  try { body = CreateSchema.parse(await req.json()) }
  catch (e: unknown) { return NextResponse.json({ error: 'Invalid', detail: (e as Error).message }, { status: 400 }) }

  const rawCode = body.code?.trim().toUpperCase() || generateCode()
  // Validate custom code format (only alphanumeric + dash)
  if (!/^[A-Z0-9\-]{4,64}$/.test(rawCode)) {
    return NextResponse.json({ error: 'Code must contain only letters, digits, and dashes (4–64 chars)' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db.from('vouchers').insert({
    code:       rawCode,
    credits:    body.credits,
    max_uses:   body.max_uses,
    expires_at: body.expires_at,
    note:       body.note,
    created_by: admin.email,
  }).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Code already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
