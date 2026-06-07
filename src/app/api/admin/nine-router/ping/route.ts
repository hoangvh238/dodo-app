import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { ping9Router } from '@/lib/routing/nineRouter'

export async function POST(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json().catch(() => ({}))
  const result  = await ping9Router(url)
  return NextResponse.json(result)
}
