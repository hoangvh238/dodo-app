/**
 * /api/ai/chat — Snapaha AI proxy with credit-based billing.
 *
 * Auth: Google access token as Bearer
 * Body: { messages, systemPrompt, tools, model, temperature, maxOutputTokens, requestId? }
 * Response: custom SSE data stream (compatible with ServerProxy.ts parser)
 *
 * Stream format (one JSON value per line, prefix:value):
 *   0:"text"          text delta
 *   5:{id,toolName}   tool-call start
 *   6:{id,delta}      tool-call input delta
 *   7:{id,name,args}  tool-call complete
 *   9:{reason,usage}  step finish
 *   d:{reason,usage}  message finish
 *   3:"error"         error
 *
 * Credit lifecycle:
 *   1. Pre-deduct 1 credit before streaming (reservation, prevents concurrent free-rides).
 *   2. After stream completes, deduct (actual_credits - 1) remaining.
 *   3. If final deduction fails (user ran out mid-stream), emit 3:"low_credits" in stream.
 *
 * Idempotency: X-Request-ID header prevents double-charge on client retry within 5 min.
 *
 * Security: model IDs validated against allowlist — unknown IDs fall back to default.
 */
import { NextRequest, NextResponse } from 'next/server'
import { streamText, jsonSchema } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { verifyGoogleToken, extractBearerToken } from '@/lib/auth/verifyGoogleToken'
import { deductCredits } from '@/lib/credits'
import { calculateCredits } from '@/lib/credits/pricing'
import { createServiceClient } from '@/lib/supabase/service'
import { resolveModelId, getModel } from '@/lib/models'
import { getApiKey } from '@/lib/config/apiKeys'
import { resolveFreeTierModel } from '@/lib/routing/modelRouting'
import { getNineRouterConfig, mapModelIdFor9Router } from '@/lib/routing/nineRouter'
import { SIGNUP_BONUS_CREDITS } from '@/lib/credits/pricing'

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim().replace(/^::ffff:/i, '')
  return req.headers.get('x-real-ip') ?? 'unknown'
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// ─── Idempotency cache (best-effort in-memory, TTL 5 min) ────────────────────
const recentRequestIds = new Map<string, number>()
const IDEMPOTENCY_TTL = 5 * 60 * 1000

function checkAndRegisterRequestId(id: string | null): boolean {
  if (!id) return true  // no ID = allow through
  const now = Date.now()
  // Evict stale entries
  for (const [k, ts] of recentRequestIds) {
    if (now - ts > IDEMPOTENCY_TTL) recentRequestIds.delete(k)
  }
  if (recentRequestIds.has(id)) return false  // duplicate
  recentRequestIds.set(id, now)
  return true
}

// ─── Request schema ───────────────────────────────────────────────────────────
const MessageContentSchema = z.union([
  z.string(),
  z.array(z.union([
    z.object({ type: z.literal('text'),  text: z.string() }),
    z.object({ type: z.literal('image'), image: z.string(), mediaType: z.string().optional() }),
    z.object({ type: z.literal('file'),  data: z.string(), mediaType: z.string() }),
    z.object({ type: z.literal('tool-result'), toolCallId: z.string(), result: z.unknown() }),
    z.object({ type: z.literal('tool-call'),
      toolCallId: z.string(), toolName: z.string(), args: z.record(z.string(), z.unknown()) }),
  ])),
])

const MessageSchema = z.object({
  role:    z.enum(['user', 'assistant', 'system', 'tool']),
  content: MessageContentSchema,
})

const ClientToolSchema = z.object({
  description: z.string().max(500).optional(),
  parameters:  z.record(z.string(), z.unknown()),
})

const RequestSchema = z.object({
  messages:        z.array(MessageSchema).min(1).max(500),
  systemPrompt:    z.string().max(50_000).optional(),
  tools:           z.record(z.string(), ClientToolSchema).optional(),
  model:           z.string().max(100).optional(),
  temperature:     z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().min(1).max(32_000).optional(),
  requestId:       z.string().max(128).optional(),
})

// ─── Model resolver ───────────────────────────────────────────────────────────
async function resolveServerModel(requestedId: string | undefined, via9Router = false) {
  const modelId = resolveModelId(requestedId)
  if (requestedId && requestedId !== modelId) {
    console.warn(`[models] unknown model "${requestedId}" → fallback to "${modelId}"`)
  }

  // Route through 9router when enabled for this request
  if (via9Router) {
    const cfg = await getNineRouterConfig()
    if (cfg.enabled && cfg.url) {
      const mapped = mapModelIdFor9Router(modelId)
      const client = createOpenAI({
        baseURL: cfg.url.replace(/\/$/, '') + '/v1',
        apiKey:  cfg.apiKey || 'sk_9router',
      })
      console.info(`[9router] routing "${modelId}" → "${mapped}" via ${cfg.url}`)
      return { model: client(mapped), modelId: mapped, via9Router: true }
    }
  }

  const meta = getModel(modelId)!
  if (meta.provider === 'anthropic') {
    const { value: apiKey } = await getApiKey('anthropic')
    return { model: createAnthropic({ apiKey })(modelId), modelId, via9Router: false }
  }
  if (meta.provider === 'openai') {
    const { value: apiKey } = await getApiKey('openai')
    return { model: createOpenAI({ apiKey })(modelId), modelId, via9Router: false }
  }
  const { value: apiKey } = await getApiKey('google')
  return { model: createGoogleGenerativeAI({ apiKey })(modelId), modelId, via9Router: false }
}

// ─── Stream encoder ───────────────────────────────────────────────────────────
function line(prefix: string, value: unknown): string {
  return `${prefix}:${JSON.stringify(value)}\n`
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Idempotency check
  const requestId = req.headers.get('X-Request-ID')
  if (!checkAndRegisterRequestId(requestId)) {
    return NextResponse.json({ error: 'Duplicate request', code: 'DUPLICATE_REQUEST' }, { status: 409, headers: CORS })
  }

  // 2. Authenticate
  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401, headers: CORS })
  }
  const identity = await verifyGoogleToken(token)
  if (!identity) {
    return NextResponse.json({ error: 'Invalid or expired token. Please sign in again.' }, { status: 401, headers: CORS })
  }

  // 3. Credit guard — check user has credits
  const db        = createServiceClient()
  const clientIp  = getClientIp(req)
  const { data: userRow } = await db
    .from('users').select('credits, plan_type, signup_ip').eq('google_sub', identity.sub).single()

  if (!userRow) {
    // IP-aware signup bonus: same IP as an existing account → 1/3 bonus
    const { data: ipCount } = await db.rpc('count_ip_accounts', {
      p_ip:          clientIp,
      p_exclude_sub: identity.sub,
    })
    const bonusFactor  = (ipCount && ipCount > 0) ? 1 / 3 : 1.0
    const bonusCredits = Math.max(1, Math.floor(SIGNUP_BONUS_CREDITS * bonusFactor))

    await db.from('users').upsert({
      google_sub: identity.sub, email: identity.email,
      credits: bonusCredits, signup_bonus_granted: true,
      signup_ip: clientIp, ip_bonus_factor: bonusFactor,
    }, { onConflict: 'google_sub' })
    await db.from('credit_transactions').insert({
      user_id: identity.sub, amount: bonusCredits, reason: 'signup_bonus',
    })
  } else {
    // Backfill signup_ip for existing users who don't have it yet (one-time, fire-and-forget)
    if (!userRow.signup_ip && clientIp !== 'unknown') {
      db.from('users')
        .update({ signup_ip: clientIp })
        .eq('google_sub', identity.sub)
        .then(() => {})
    }

    if (userRow.credits < 1) {
      return NextResponse.json({
        error:   'Insufficient credits. Please top up to continue using Snapaha AI.',
        code:    'INSUFFICIENT_CREDITS',
        credits: userRow.credits,
      }, { status: 402, headers: CORS })
    }
  }

  // 4. Parse + validate request
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: CORS })
  }

  // Free-tier: server picks model via weighted routing config (admin-configurable).
  // Each route entry carries its own via9Router flag — respected per-model.
  const isFreeTier = !userRow || userRow.plan_type === 'free' || !userRow.plan_type
  let requestedModel = body.model
  let use9Router     = false

  if (isFreeTier) {
    const resolved = await resolveFreeTierModel()
    if (body.model && body.model !== resolved.modelId) {
      console.info(`[routing] free-tier: "${body.model}" → "${resolved.modelId}" for ${identity.sub}`)
    }
    requestedModel = resolved.modelId
    // Per-entry flag: only use 9router if this specific route entry says so
    // AND 9router is actually configured/enabled globally
    if (resolved.via9Router) {
      const nrCfg = await getNineRouterConfig()
      use9Router  = nrCfg.enabled && !!nrCfg.url
    }
  }

  const { model, modelId } = await resolveServerModel(requestedModel, use9Router)
  const googleSub          = identity.sub

  // 5. Pre-deduct 1 credit (reservation) — prevents concurrent free-rides
  const reserved = await deductCredits({
    googleSub, credits: 1, reason: 'ai_reservation', model: modelId,
  })
  if (!reserved) {
    return NextResponse.json({
      error:   'Insufficient credits. Please top up to continue using Snapaha AI.',
      code:    'INSUFFICIENT_CREDITS',
      credits: 0,
    }, { status: 402, headers: CORS })
  }

  // Convert client tool JSON-Schema objects to AI SDK tool format.
  const sdkTools = body.tools
    ? Object.fromEntries(
        Object.entries(body.tools).map(([name, t]) => [
          name,
          {
            description: t.description,
            inputSchema: jsonSchema(t.parameters as Record<string, unknown>),
          },
        ])
      )
    : undefined

  // 6. Stream — iterate fullStream to build custom SSE response
  const enc = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let inputTokens  = 0
      let outputTokens = 0

      try {
        const streamArgs: Parameters<typeof streamText>[0] = {
          model,
          system:          body.systemPrompt,
          messages:        body.messages as Parameters<typeof streamText>[0]['messages'] & {},
          temperature:     body.temperature,
          maxOutputTokens: body.maxOutputTokens ?? 4096,
        }
        if (sdkTools) (streamArgs as Record<string, unknown>).tools = sdkTools

        const result = streamText(streamArgs)

        for await (const part of result.fullStream) {
          switch (part.type) {
            case 'text-delta':
              controller.enqueue(enc.encode(line('0', part.text)))
              break

            case 'tool-input-start':
              controller.enqueue(enc.encode(line('5', { toolCallId: part.id, toolName: part.toolName })))
              break

            case 'tool-input-delta':
              controller.enqueue(enc.encode(line('6', { toolCallId: part.id, argsTextDelta: part.delta })))
              break

            case 'tool-call': {
              const tc = part as { toolCallId: string; toolName: string; input: Record<string, unknown> }
              controller.enqueue(enc.encode(line('7', { toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.input })))
              break
            }

            case 'finish-step': {
              const usage = {
                inputTokens:  part.usage?.inputTokens  ?? 0,
                outputTokens: part.usage?.outputTokens ?? 0,
              }
              inputTokens  += usage.inputTokens
              outputTokens += usage.outputTokens
              controller.enqueue(enc.encode(line('9', { finishReason: part.finishReason, usage })))
              break
            }

            case 'finish': {
              const usage = {
                inputTokens:  part.totalUsage?.inputTokens  ?? inputTokens,
                outputTokens: part.totalUsage?.outputTokens ?? outputTokens,
              }
              controller.enqueue(enc.encode(line('d', { finishReason: part.finishReason, usage })))

              // 7. Deduct remaining credits (actual_total - 1 reservation already taken)
              const { credits: actualCredits, costUsd } = calculateCredits({
                model: modelId,
                inputTokens:  usage.inputTokens,
                outputTokens: usage.outputTokens,
              })
              const remaining = Math.max(0, actualCredits - 1)

              if (remaining > 0) {
                const ok = await deductCredits({
                  googleSub, credits: remaining,
                  reason:    'ai_usage',
                  model:     modelId,
                  tokensIn:  usage.inputTokens,
                  tokensOut: usage.outputTokens,
                  costUsd,
                })
                if (!ok) {
                  // User ran out of credits mid-stream — warn client
                  controller.enqueue(enc.encode(line('3', 'low_credits')))
                }
              } else {
                // actualCredits == 1, reservation covers it — just log the transaction
                db.from('credit_transactions').insert({
                  user_id:    googleSub,
                  amount:     -1,
                  reason:     'ai_usage',
                  model:      modelId,
                  tokens_in:  usage.inputTokens,
                  tokens_out: usage.outputTokens,
                  cost_usd:   costUsd,
                }).then(({ error: e }) => {
                  if (e) console.error('[credits] tx log failed:', e.message)
                })
                // Refund the reservation record (we'll keep it simple: no refund, just log actual usage separately)
              }
              break
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(enc.encode(line('3', msg)))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
