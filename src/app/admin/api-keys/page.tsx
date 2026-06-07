export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import ApiKeysManager from '@/components/dashboard/ApiKeysManager'
import ApiKeyTester from '@/components/dashboard/ApiKeyTester'
import { maskKey } from '@/lib/config/apiKeys'

const PROVIDERS = [
  { provider: 'anthropic' as const, dbKey: 'anthropic_api_key', label: 'Anthropic (Claude)',  envVar: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-api03-...' },
  { provider: 'google'    as const, dbKey: 'google_ai_api_key', label: 'Google (Gemini)',      envVar: 'GOOGLE_API_KEY',    placeholder: 'AIzaSy...' },
  { provider: 'openai'    as const, dbKey: 'openai_api_key',    label: 'OpenAI (GPT)',         envVar: 'OPENAI_API_KEY',    placeholder: 'sk-proj-...' },
]

async function getKeyStatuses() {
  const db = createServiceClient()
  const { data: rows } = await db.from('admin_config').select('key, value, updated_at, updated_by')
  const dbMap = Object.fromEntries((rows ?? []).map(r => [r.key, r]))

  return PROVIDERS.map(p => {
    const dbRow    = dbMap[p.dbKey]
    const dbValue  = dbRow?.value?.trim() ?? ''
    const envValue = process.env[p.envVar]?.trim() ?? ''

    let source: 'db' | 'env' | 'none'
    let maskedValue: string
    if (dbValue) {
      source = 'db'; maskedValue = maskKey(dbValue)
    } else if (envValue) {
      source = 'env'; maskedValue = maskKey(envValue)
    } else {
      source = 'none'; maskedValue = ''
    }

    return {
      provider:    p.provider,
      label:       p.label,
      placeholder: p.placeholder,
      source,
      configured:  source !== 'none',
      maskedValue,
      updatedAt:   dbRow?.updated_at ?? null,
      updatedBy:   dbRow?.updated_by ?? null,
    }
  })
}

export default async function ApiKeysPage() {
  const keys = await getKeyStatuses()
  const configuredProviders = new Set(
    keys.filter(k => k.configured).map(k => k.provider)
  ) as Set<'anthropic' | 'google' | 'openai'>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">API Keys</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Configure provider API keys. DB values override environment variables at runtime.
        </p>
      </div>

      <ApiKeysManager initialKeys={keys} />

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      <ApiKeyTester configuredProviders={configuredProviders} />
    </div>
  )
}
