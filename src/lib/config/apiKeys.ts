import { createServiceClient } from '@/lib/supabase/service'

const KEY_DB_NAMES = {
  anthropic: 'anthropic_api_key',
  google:    'google_ai_api_key',
  openai:    'openai_api_key',
} as const

const ENV_FALLBACK: Record<string, () => string> = {
  anthropic: () => process.env.ANTHROPIC_API_KEY ?? '',
  google:    () => process.env.GOOGLE_API_KEY    ?? '',
  openai:    () => process.env.OPENAI_API_KEY    ?? '',
}

export type ApiKeyProvider = keyof typeof KEY_DB_NAMES

/** Simple in-process cache — keeps DB round-trips to one per minute. */
const cache: Record<string, { value: string; source: 'db' | 'env' | 'none'; expiresAt: number }> = {}
const TTL_MS = 60_000

export async function getApiKey(
  provider: ApiKeyProvider,
): Promise<{ value: string; source: 'db' | 'env' | 'none' }> {
  const now = Date.now()
  const hit  = cache[provider]
  if (hit && hit.expiresAt > now) return { value: hit.value, source: hit.source }

  try {
    const db = createServiceClient()
    const { data } = await db
      .from('admin_config')
      .select('value')
      .eq('key', KEY_DB_NAMES[provider])
      .single()

    const dbValue = data?.value?.trim() ?? ''
    const envValue = ENV_FALLBACK[provider]()

    let value: string
    let source: 'db' | 'env' | 'none'
    if (dbValue) {
      value = dbValue; source = 'db'
    } else if (envValue) {
      value = envValue; source = 'env'
    } else {
      value = ''; source = 'none'
    }

    cache[provider] = { value, source, expiresAt: now + TTL_MS }
    return { value, source }
  } catch {
    const envValue = ENV_FALLBACK[provider]()
    return { value: envValue, source: envValue ? 'env' : 'none' }
  }
}

export function invalidateApiKeyCache(provider?: ApiKeyProvider) {
  if (provider) delete cache[provider]
  else for (const k of Object.keys(cache)) delete cache[k]
}

/** Mask a key for display: first 8 chars + ****  */
export function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••'
  return key.slice(0, 8) + '••••••••' + key.slice(-4)
}
