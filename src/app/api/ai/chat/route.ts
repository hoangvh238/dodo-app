/**
 * /api/ai/chat — Snapaha AI proxy with credit-based billing.
 *
 * Auth: Google access token as Bearer
 * Body: { messages, systemPrompt, tools, model, temperature, maxOutputTokens }
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
 * Credit deduction happens after completion via onFinish.
 * Tools are declared to the model but not executed server-side —
 * the client executes them and sends results in the next request.
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

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
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

// Tools sent by the client as plain JSON Schema objects (no zod, safe to accept from untrusted source)
const ClientToolSchema = z.object({
  description: z.string().max(500).optional(),
  parameters:  z.record(z.string(), z.unknown()),
})

const RequestSchema = z.object({
  messages:       z.array(MessageSchema).min(1).max(500),
  systemPrompt:   z.string().max(50_000).optional(),
  tools:          z.record(z.string(), ClientToolSchema).optional(),
  model:          z.string().max(100).optional(),
  temperature:    z.number().min(0).max(2).optional(),
  maxOutputTokens:z.number().min(1).max(32_000).optional(),
})

// ─── Model resolver ───────────────────────────────────────────────────────────
function resolveServerModel(requestedId: string | undefined) {
  const modelId = resolveModelId(requestedId)
  const meta    = getModel(modelId)!
  if (meta.provider === 'anthropic') {
    return { model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })(modelId), modelId }
  }
  if (meta.provider === 'openai') {
    return { model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })(modelId), modelId }
  }
  return { model: createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY! })(modelId), modelId }
}

// ─── Stream encoder ───────────────────────────────────────────────────────────
// Encodes values into the Vercel AI data stream format that ServerProxy.ts parses.
function line(prefix: string, value: unknown): string {
  return `${prefix}:${JSON.stringify(value)}\n`
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Authenticate
  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401, headers: CORS })
  }
  const identity = await verifyGoogleToken(token)
  if (!identity) {
    return NextResponse.json({ error: 'Invalid or expired token. Please sign in again.' }, { status: 401, headers: CORS })
  }

  // 2. Check / auto-create user + credit guard
  const db = createServiceClient()
  const { data: userRow } = await db
    .from('users').select('credits').eq('google_sub', identity.sub).single()

  if (!userRow) {
    await db.from('users').upsert({
      google_sub: identity.sub, email: identity.email,
      credits: 100, signup_bonus_granted: true,
    }, { onConflict: 'google_sub' })
    await db.from('credit_transactions').insert({
      user_id: identity.sub, amount: 100, reason: 'signup_bonus',
    })
  } else if (userRow.credits < 1) {
    return NextResponse.json({
      error:   'Insufficient credits. Please top up to continue using Snapaha AI.',
      code:    'INSUFFICIENT_CREDITS',
      credits: userRow.credits,
    }, { status: 402, headers: CORS })
  }

  // 3. Parse + validate request
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: CORS })
  }

  const { model, modelId } = resolveServerModel(body.model)
  const googleSub          = identity.sub

  // Convert client tool JSON-Schema objects to AI SDK tool format.
  // No execute function — tools run on the client, results come back as messages.
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

  // 4. Call streamText and iterate fullStream to build custom SSE response
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

              // Deduct credits after streaming is complete
              const { credits, costUsd } = calculateCredits({
                model:  modelId,
                inputTokens:  usage.inputTokens,
                outputTokens: usage.outputTokens,
              })
              deductCredits({
                googleSub, credits,
                reason:    'ai_usage',
                model:     modelId,
                tokensIn:  usage.inputTokens,
                tokensOut: usage.outputTokens,
                costUsd,
              }).catch(err => console.error('[credits] deduct failed:', err))
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
