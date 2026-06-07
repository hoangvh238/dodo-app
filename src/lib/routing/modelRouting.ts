/**
 * Free-tier model routing — weighted random selection.
 *
 * Admin configures a list of { modelId, weight, enabled } entries via the
 * dashboard. On each request the server picks a model proportionally to its
 * weight from the enabled set.
 *
 * Config is cached in-process for CACHE_TTL_MS to avoid a DB round-trip on
 * every AI request.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { SERVER_MODEL_IDS, DEFAULT_SERVER_MODEL_ID } from '@/lib/models'

export interface RouteEntry {
  modelId:    string
  weight:     number   // 1–100 (relative weight, does not have to sum to 100)
  enabled:    boolean
  via9Router: boolean  // route this model through 9router instead of direct provider
}

export interface RoutingConfig {
  entries:  RouteEntry[]
  fallback: string   // used when all entries are disabled or config missing
}

export const DEFAULT_ROUTING: RoutingConfig = {
  fallback: DEFAULT_SERVER_MODEL_ID,
  entries: [
    { modelId: 'gemini-2.0-flash', weight: 100, enabled: true, via9Router: false },
  ],
}

const DB_KEY   = 'model_routing'
const CACHE_TTL_MS = 60_000

let cache: { config: RoutingConfig; expiresAt: number } | null = null

export async function getRoutingConfig(): Promise<RoutingConfig> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.config

  try {
    const db = createServiceClient()
    const { data } = await db
      .from('admin_config')
      .select('value')
      .eq('key', DB_KEY)
      .single()

    if (data?.value) {
      const parsed = JSON.parse(data.value) as RoutingConfig
      // Validate all modelIds still exist in registry; backfill via9Router for old configs
      parsed.entries = parsed.entries
        .filter(e => SERVER_MODEL_IDS.has(e.modelId))
        .map(e => ({ ...e, via9Router: e.via9Router ?? false }))
      cache = { config: parsed, expiresAt: now + CACHE_TTL_MS }
      return parsed
    }
  } catch { /* fall through to default */ }

  cache = { config: DEFAULT_ROUTING, expiresAt: now + CACHE_TTL_MS }
  return DEFAULT_ROUTING
}

export async function saveRoutingConfig(config: RoutingConfig, updatedBy: string): Promise<void> {
  const db = createServiceClient()
  await db.from('admin_config').upsert({
    key:        DB_KEY,
    value:      JSON.stringify(config),
    description: 'Free-tier model routing weights',
    is_secret:  false,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  }, { onConflict: 'key' })
  // Invalidate cache immediately
  cache = null
}

/**
 * Pick a model for a free-tier request using weighted random selection.
 * Returns { modelId, via9Router } so the caller knows whether to route through 9router.
 * Falls back to the configured fallback (direct, no 9router) if all entries are disabled.
 */
export async function resolveFreeTierModel(): Promise<{ modelId: string; via9Router: boolean }> {
  const config  = await getRoutingConfig()
  const active  = config.entries.filter(e => e.enabled && e.weight > 0)
  if (active.length === 0) return { modelId: config.fallback, via9Router: false }

  const total = active.reduce((s, e) => s + e.weight, 0)
  let rand    = Math.random() * total

  for (const entry of active) {
    rand -= entry.weight
    if (rand <= 0) return { modelId: entry.modelId, via9Router: entry.via9Router ?? false }
  }

  const last = active[active.length - 1]
  return { modelId: last.modelId, via9Router: last.via9Router ?? false }
}

export function invalidateRoutingCache() {
  cache = null
}
