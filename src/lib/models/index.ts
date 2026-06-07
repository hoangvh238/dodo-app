/**
 * Server-side model registry — single source of truth for:
 *   - Which models are available through Snapaha server
 *   - Which provider handles each model
 *   - Metadata for client display (label, context window, vision support)
 *
 * Security: only models listed here can be requested by clients.
 * Unknown model IDs fall back to DEFAULT_SERVER_MODEL, never forwarded raw.
 */

export type ModelProvider = 'google' | 'anthropic' | 'openai'

export interface ServerModel {
  id:          string
  provider:    ModelProvider
  label:       string
  contextK:    number   // context window in K tokens
  vision:      boolean  // supports image input
  thinking?:   boolean  // supports extended thinking
  tier?:       'free' | 'pro'  // future: gate expensive models behind pro
}

export const SERVER_MODELS: ServerModel[] = [
  // ─── Google Gemini ───────────────────────────────────────────────────────
  { id: 'gemini-2.0-flash',      provider: 'google',    label: 'Gemini 2.0 Flash',      contextK: 1000,  vision: true  },
  { id: 'gemini-2.5-flash',      provider: 'google',    label: 'Gemini 2.5 Flash',      contextK: 1000,  vision: true  },
  { id: 'gemini-2.5-flash-lite', provider: 'google',    label: 'Gemini 2.5 Flash Lite', contextK: 1000,  vision: true  },
  { id: 'gemini-2.5-pro',        provider: 'google',    label: 'Gemini 2.5 Pro',        contextK: 1000,  vision: true,  thinking: true },
  { id: 'gemini-1.5-pro',        provider: 'google',    label: 'Gemini 1.5 Pro',        contextK: 1000,  vision: true  },
  { id: 'gemini-1.5-flash',      provider: 'google',    label: 'Gemini 1.5 Flash',      contextK: 1000,  vision: true  },
  // ─── Anthropic Claude ────────────────────────────────────────────────────
  { id: 'claude-haiku-4-5-20251001', provider: 'anthropic', label: 'Claude Haiku 4.5',  contextK: 200,  vision: true  },
  { id: 'claude-sonnet-4-6',         provider: 'anthropic', label: 'Claude Sonnet 4.6', contextK: 200,  vision: true,  thinking: true },
  { id: 'claude-opus-4-7',           provider: 'anthropic', label: 'Claude Opus 4.7',   contextK: 200,  vision: true,  thinking: true },
  { id: 'claude-opus-4-8',           provider: 'anthropic', label: 'Claude Opus 4.8',   contextK: 200,  vision: true,  thinking: true },
  // ─── OpenAI GPT ──────────────────────────────────────────────────────────
  { id: 'gpt-4o-mini',  provider: 'openai', label: 'GPT-4o mini',  contextK: 128, vision: true  },
  { id: 'gpt-4o',       provider: 'openai', label: 'GPT-4o',       contextK: 128, vision: true  },
  { id: 'gpt-4.1',      provider: 'openai', label: 'GPT-4.1',      contextK: 1000, vision: true },
  { id: 'gpt-4.1-mini', provider: 'openai', label: 'GPT-4.1 mini', contextK: 1000, vision: true },
]

/** Set of valid server model IDs for O(1) lookup */
export const SERVER_MODEL_IDS = new Set(SERVER_MODELS.map(m => m.id))

export const DEFAULT_SERVER_MODEL_ID = 'gemini-2.0-flash'

/** Model enforced for free-tier users regardless of what the client requests. */
export const FREE_TIER_MODEL_ID = 'gemini-2.5-flash'

/** Resolve a client-requested model ID to a validated server model.
 *  Returns DEFAULT_SERVER_MODEL_ID if the requested model is unknown.
 *  Logs a warning when an unknown model is requested (security audit trail). */
export function resolveModelId(requested: string | undefined): string {
  if (!requested) return DEFAULT_SERVER_MODEL_ID
  if (SERVER_MODEL_IDS.has(requested)) return requested
  console.warn(`[models] SECURITY: unknown model requested "${requested}" — falling back to "${DEFAULT_SERVER_MODEL_ID}"`)
  return DEFAULT_SERVER_MODEL_ID
}

/** Find metadata for a model ID */
export function getModel(id: string): ServerModel | undefined {
  return SERVER_MODELS.find(m => m.id === id)
}
