import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { ping9Router, fetchNineRouterModels, invalidateNineRouterCache } from '@/lib/routing/nineRouter'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: rows } = await db
    .from('admin_config')
    .select('key, value, updated_at, updated_by')
    .in('key', ['nine_router_url', 'nine_router_api_key', 'nine_router_enabled'])

  const dbMap = Object.fromEntries((rows ?? []).map(r => [r.key, r]))

  const url     = dbMap['nine_router_url']?.value?.trim()     ?? process.env.NINE_ROUTER_URL     ?? ''
  const apiKey  = dbMap['nine_router_api_key']?.value?.trim() ?? process.env.NINE_ROUTER_API_KEY ?? 'sk_9router'
  const enabled = dbMap['nine_router_enabled']?.value === 'true' || process.env.NINE_ROUTER_ENABLED === 'true'

  // Ping if URL is set
  const pingResult = url ? await ping9Router(url) : { ok: false, error: 'Not configured' }

  // Fetch models if reachable
  const models = pingResult.ok ? await fetchNineRouterModels() : []

  return NextResponse.json({
    url,
    apiKey: apiKey ? apiKey.slice(0, 8) + '••••' : '',
    enabled,
    updatedAt:  dbMap['nine_router_url']?.updated_at ?? null,
    updatedBy:  dbMap['nine_router_url']?.updated_by ?? null,
    ping:       pingResult,
    models:     models.slice(0, 50),
  })
}

const ConfigSchema = z.object({
  url:     z.string().max(500),
  apiKey:  z.string().max(200),
  enabled: z.boolean(),
})

export async function PUT(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof ConfigSchema>
  try { body = ConfigSchema.parse(await req.json()) }
  catch (e: unknown) { return NextResponse.json({ error: 'Invalid', detail: (e as Error).message }, { status: 400 }) }

  const db = createServiceClient()
  const now = new Date().toISOString()

  await Promise.all([
    db.from('admin_config').upsert({ key: 'nine_router_url',     value: body.url.trim(),    description: '9router server URL', is_secret: false, updated_at: now, updated_by: admin.email }, { onConflict: 'key' }),
    db.from('admin_config').upsert({ key: 'nine_router_api_key', value: body.apiKey.trim(), description: '9router API key',    is_secret: true,  updated_at: now, updated_by: admin.email }, { onConflict: 'key' }),
    db.from('admin_config').upsert({ key: 'nine_router_enabled', value: String(body.enabled), description: '9router enabled',  is_secret: false, updated_at: now, updated_by: admin.email }, { onConflict: 'key' }),
  ])

  invalidateNineRouterCache()
  return NextResponse.json({ success: true })
}
