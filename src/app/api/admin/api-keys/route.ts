import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { maskKey, invalidateApiKeyCache } from '@/lib/config/apiKeys'
import { z } from 'zod'

const PROVIDERS = [
  { provider: 'anthropic', dbKey: 'anthropic_api_key', label: 'Anthropic (Claude)',  envVar: 'ANTHROPIC_API_KEY' },
  { provider: 'google',    dbKey: 'google_ai_api_key', label: 'Google (Gemini)',      envVar: 'GOOGLE_API_KEY' },
  { provider: 'openai',    dbKey: 'openai_api_key',    label: 'OpenAI (GPT)',         envVar: 'OPENAI_API_KEY' },
] as const

/** GET — list all providers with masked key values */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: rows } = await db.from('admin_config').select('key, value, updated_at, updated_by')

  const dbMap = Object.fromEntries((rows ?? []).map(r => [r.key, r]))

  const keys = PROVIDERS.map(p => {
    const dbRow   = dbMap[p.dbKey]
    const dbValue = dbRow?.value?.trim() ?? ''
    const envValue= process.env[p.envVar]?.trim() ?? ''

    let source: 'db' | 'env' | 'none'
    let masked: string
    if (dbValue) {
      source = 'db'; masked = maskKey(dbValue)
    } else if (envValue) {
      source = 'env'; masked = maskKey(envValue)
    } else {
      source = 'none'; masked = ''
    }

    return {
      provider:   p.provider,
      label:      p.label,
      dbKey:      p.dbKey,
      source,
      configured: source !== 'none',
      maskedValue: masked,
      updatedAt:  dbRow?.updated_at ?? null,
      updatedBy:  dbRow?.updated_by ?? null,
    }
  })

  return NextResponse.json({ keys })
}

const UpdateSchema = z.object({
  provider: z.enum(['anthropic', 'google', 'openai']),
  value:    z.string().max(500),
})

/** PUT — update a provider key */
export async function PUT(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof UpdateSchema>
  try {
    body = UpdateSchema.parse(await req.json())
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Invalid request', detail: (e as Error).message }, { status: 400 })
  }

  const p     = PROVIDERS.find(x => x.provider === body.provider)!
  const db    = createServiceClient()

  const { error } = await db.from('admin_config').upsert({
    key:        p.dbKey,
    value:      body.value.trim(),
    updated_at: new Date().toISOString(),
    updated_by: admin.email ?? 'unknown',
  }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: 'DB update failed', detail: error.message }, { status: 500 })
  }

  // Invalidate in-process cache so next AI call picks up the new key
  invalidateApiKeyCache(body.provider)

  return NextResponse.json({ success: true })
}
