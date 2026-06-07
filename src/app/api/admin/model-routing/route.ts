import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { getRoutingConfig, saveRoutingConfig, DEFAULT_ROUTING, type RoutingConfig } from '@/lib/routing/modelRouting'
import { SERVER_MODEL_IDS } from '@/lib/models'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const config = await getRoutingConfig()
  return NextResponse.json(config)
}

const EntrySchema = z.object({
  modelId: z.string().max(100).refine(id => SERVER_MODEL_IDS.has(id), 'Unknown model ID'),
  weight:  z.number().int().min(0).max(100),
  enabled: z.boolean(),
})

const ConfigSchema = z.object({
  entries:  z.array(EntrySchema).min(1).max(20),
  fallback: z.string().max(100).refine(id => SERVER_MODEL_IDS.has(id), 'Unknown fallback model'),
})

export async function PUT(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: RoutingConfig
  try {
    body = ConfigSchema.parse(await req.json())
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Invalid config', detail: (e as Error).message }, { status: 400 })
  }

  // Must have at least one enabled entry or a valid fallback
  const hasEnabled = body.entries.some(e => e.enabled && e.weight > 0)
  if (!hasEnabled) {
    // Allow it — fallback will be used
  }

  await saveRoutingConfig(body, admin.email)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await saveRoutingConfig(DEFAULT_ROUTING, admin.email)
  return NextResponse.json({ success: true, reset: true })
}
