/**
 * Credit pricing formula for Snapaha pay-as-you-go.
 *
 * 1 Credit = $0.001 USD (0.1 cent)
 * Free signup bonus: 100 credits ($0.10 value, ~100 basic queries on Gemini Flash)
 *
 * Strategy: 2.5–3× markup over provider cost to cover:
 *   - Infrastructure (Vercel, Supabase)
 *   - Bandwidth & egress
 *   - Support overhead
 *   - Profit margin
 *
 * No loss guarantee: minimum deduction is 1 credit per request.
 */

export const SIGNUP_BONUS_CREDITS = 100

/** Markup multiplier applied on top of raw provider cost */
const MARKUP = 3.0

/**
 * Provider cost in USD per 1M tokens.
 * Source: official pricing pages as of 2026-06.
 */
const PROVIDER_COST: Record<string, { input: number; output: number }> = {
  // Google Gemini
  'gemini-2.0-flash':      { input: 0.075,  output: 0.30  },
  'gemini-2.5-flash':      { input: 0.15,   output: 0.60  },
  'gemini-2.5-flash-lite': { input: 0.075,  output: 0.30  },
  'gemini-2.5-pro':        { input: 1.25,   output: 10.00 },
  'gemini-1.5-pro':        { input: 1.25,   output: 5.00  },
  'gemini-1.5-flash':      { input: 0.075,  output: 0.30  },
  // Anthropic Claude
  'claude-haiku-4-5-20251001': { input: 0.80,  output: 4.00  },
  'claude-sonnet-4-6':         { input: 3.00,  output: 15.00 },
  'claude-opus-4-7':           { input: 15.00, output: 75.00 },
  'claude-opus-4-8':           { input: 15.00, output: 75.00 },
  // OpenAI
  'gpt-4o-mini':  { input: 0.15,  output: 0.60  },
  'gpt-4o':       { input: 2.50,  output: 10.00 },
  'gpt-4.1':      { input: 2.00,  output: 8.00  },
  'gpt-4.1-mini': { input: 0.40,  output: 1.60  },
}

const DEFAULT_COST = { input: 0.15, output: 0.60 }  // Gemini Flash equivalent

/**
 * Calculate credits to deduct for an AI request.
 * Formula: ceil((inputTokens × inputRate + outputTokens × outputRate) × MARKUP)
 * Minimum: 1 credit per request (never free, never a loss).
 */
export function calculateCredits(opts: {
  model: string
  inputTokens: number
  outputTokens: number
}): { credits: number; costUsd: number } {
  const cost = PROVIDER_COST[opts.model] ?? DEFAULT_COST
  const rawCostUsd = (
    (opts.inputTokens  / 1_000_000) * cost.input +
    (opts.outputTokens / 1_000_000) * cost.output
  )
  const ourCostUsd = rawCostUsd * MARKUP
  const credits    = Math.max(1, Math.ceil(ourCostUsd / 0.001))  // $0.001 per credit
  return { credits, costUsd: rawCostUsd }
}

/** Human-readable credit value in USD */
export function creditsToUsd(credits: number): string {
  return `$${(credits * 0.001).toFixed(3)}`
}

