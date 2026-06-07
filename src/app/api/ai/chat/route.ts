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
import { resolveModelId, getModel, FREE_TIER_MODEL_ID } from '@/lib/models'
import { getApiKey } from '@/lib/config/apiKeys'

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
async function resolveServerModel(requestedId: string | undefined) {
  const modelId = resolveModelId(requestedId)
  if (requestedId && requestedId !== modelId) {
    console.warn(`[models] unknown model "${requestedId}" → fallback to "${modelId}"`)
  }
  const meta = getModel(modelId)!
  if (meta.provider === 'anthropic') {
    const { value: apiKey } = await getApiKey('anthropic')
    return { model: createAnthropic({ apiKey })(modelId), modelId }
  }
  if (meta.provider === 'openai') {
    const { value: apiKey } = await getApiKey('openai')
    return { model: createOpenAI({ apiKey })(modelId), modelId }
  }
  const { value: apiKey } = await getApiKey('google')
  return { model: createGoogleGenerativeAI({ apiKey })(modelId), modelId }
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
  const db = createServiceClient()
  const { data: userRow } = await db
    .from('users').select('credits, plan_type').eq('google_sub', identity.sub).single()

  if (!userRow) {
    // Auto-create user with signup bonus
    await db.from('users').upsert({
      google_sub: identity.sub, email: identity.email,
      credits: 50, signup_bonus_granted: true,
    }, { onConflict: 'google_sub' })
    await db.from('credit_transactions').insert({
      user_id: identity.sub, amount: 50, reason: 'signup_bonus',
    })
  } else if (userRow.credits < 1) {
    return NextResponse.json({
      error:   'Insufficient credits. Please top up to continue using Snapaha AI.',
      code:    'INSUFFICIENT_CREDITS',
      credits: userRow.credits,
    }, { status: 402, headers: CORS })
  }

  // 4. Parse + validate request
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: CORS })
  }

  // Free-tier users are restricted to the free model — silently override any other selection.
  const isFreeTier = !userRow || userRow.plan_type === 'free' || !userRow.plan_type
  const requestedModel = isFreeTier ? FREE_TIER_MODEL_ID : body.model
  if (isFreeTier && body.model && body.model !== FREE_TIER_MODEL_ID) {
    console.info(`[models] free-tier override: "${body.model}" → "${FREE_TIER_MODEL_ID}" for ${identity.sub}`)
  }

  const { model, modelId } = await resolveServerModel(requestedModel)
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
