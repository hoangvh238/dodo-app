/**
 * 9router client integration.
 *
 * 9router exposes an OpenAI-compatible /v1/chat/completions endpoint.
 * When configured, free-tier AI calls are routed through it so 9router
 * handles provider selection, fallback, and token compression across
 * 40+ providers (Kiro AI, OpenCode Free, Vertex AI, etc.).
 *
 * Config precedence: admin_config DB → env vars → disabled
 *
 * Env vars:
 *   NINE_ROUTER_URL=http://localhost:20128   (or 9router cloud endpoint)
 *   NINE_ROUTER_API_KEY=sk_9router           (default key from 9router dashboard)
 *   NINE_ROUTER_ENABLED=true
 *
 * Vercel deployment trick:
 *   Set NINE_ROUTER_URL to the 9router cloud service URL (no self-hosting needed).
 *   Server-side AI SDK calls go directly to that URL.
 *   The /api/9router/[...path] proxy route lets the browser + iframe use a
 *   same-origin URL without CORS issues and without exposing the API key.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { createOpenAI } from '@ai-sdk/openai'

export interface NineRouterConfig {
  enabled:  boolean
  url:      string   // e.g. "http://localhost:20128"
  apiKey:   string   // e.g. "sk_9router"
}

const CACHE_TTL_MS = 30_000
let cache: { config: NineRouterConfig; expiresAt: number } | null = null

export async function getNineRouterConfig(): Promise<NineRouterConfig> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.config

  const envUrl     = process.env.NINE_ROUTER_URL?.trim()     ?? ''
  const envKey     = process.env.NINE_ROUTER_API_KEY?.trim() ?? 'sk_9router'
  const envEnabled = process.env.NINE_ROUTER_ENABLED === 'true'

  try {
    const db = createServiceClient()
    const { data: rows } = await db
      .from('admin_config')
      .select('key, value')
      .in('key', ['nine_router_url', 'nine_router_api_key', 'nine_router_enabled'])

    const dbMap = Object.fromEntries((rows ?? []).map(r => [r.key, r.value?.trim() ?? '']))

    const url     = dbMap['nine_router_url']     || envUrl
    const apiKey  = dbMap['nine_router_api_key'] || envKey
    const enabled = dbMap['nine_router_enabled'] === 'true' || (dbMap['nine_router_enabled'] === '' && envEnabled)

    const config: NineRouterConfig = { enabled: enabled && !!url, url, apiKey }
    cache = { config, expiresAt: now + CACHE_TTL_MS }
    return config
  } catch {
    const config: NineRouterConfig = { enabled: envEnabled && !!envUrl, url: envUrl, apiKey: envKey }
    cache = { config, expiresAt: now + CACHE_TTL_MS }
    return config
  }
}

export function invalidateNineRouterCache() {
  cache = null
}

/**
 * Build an AI SDK model via 9router's OpenAI-compatible endpoint.
 * The model ID is passed through to 9router, which maps it to the best
 * available free provider.
 */
export async function createNineRouterModel(modelId: string) {
  const cfg = await getNineRouterConfig()
  if (!cfg.enabled || !cfg.url) return null

  const client = createOpenAI({
    baseURL: cfg.url.replace(/\/$/, '') + '/v1',
    apiKey:  cfg.apiKey || 'sk_9router',
  })

  return { model: client(modelId), modelId }
}

/**
 * Fetch available models from 9router's /v1/models endpoint.
 * Returns [] on failure (9router offline or not configured).
 */
export async function fetchNineRouterModels(): Promise<{ id: string; created?: number }[]> {
  const cfg = await getNineRouterConfig()
  if (!cfg.url) return []

  try {
    const res = await fetch(cfg.url.replace(/\/$/, '') + '/v1/models', {
      headers: { Authorization: `Bearer ${cfg.apiKey || 'sk_9router'}` },
      signal:  AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const data = await res.json() as { data?: { id: string; created?: number }[] }
    return data.data ?? []
  } catch { return [] }
}

/**
 * Ping 9router to verify it's reachable.
 * Returns latency in ms or null if unreachable.
 */
export async function ping9Router(url?: string): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const cfg = await getNineRouterConfig()
  const base = (url ?? cfg.url).replace(/\/$/, '')
  if (!base) return { ok: false, error: 'No URL configured' }

  const start = Date.now()
  try {
    const res = await fetch(base + '/v1/models', {
      headers: { Authorization: `Bearer ${cfg.apiKey || 'sk_9router'}` },
      signal:  AbortSignal.timeout(5000),
    })
    return { ok: res.ok, latencyMs: Date.now() - start }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unreachable', latencyMs: Date.now() - start }
  }
}

/**
 * Map our internal model IDs to the best 9router-compatible model name.
 * 9router accepts standard OpenAI/Anthropic/Google model IDs.
 */
export function mapModelIdFor9Router(modelId: string): string {
  // 9router understands most standard model IDs directly.
  // Provide aliases for any that need remapping.
  const aliases: Record<string, string> = {
    'gemini-2.0-flash':      'gemini-2.0-flash',
    'gemini-2.5-flash':      'gemini-2.5-flash',
    'gemini-2.5-pro':        'gemini-2.5-pro',
    'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
    'claude-sonnet-4-6':     'claude-sonnet-4-6',
    'gpt-4o-mini':           'gpt-4o-mini',
    'gpt-4o':                'gpt-4o',
  }
  return aliases[modelId] ?? modelId
}
