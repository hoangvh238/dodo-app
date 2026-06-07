import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/verifyAdminAuth'
import { getApiKey } from '@/lib/config/apiKeys'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'

const BodySchema = z.object({
  provider: z.enum(['anthropic', 'google', 'openai']),
  model:    z.string().max(100),
  text:     z.string().min(1).max(4000),
  /** base64 data URL: "data:<mime>;base64,<data>" */
  imageDataUrl: z.string().max(10_000_000).optional(),
})

const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
  google:    ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
  openai:    ['gpt-4o-mini', 'gpt-4o'],
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminAuth(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Invalid request', detail: (e as Error).message }, { status: 400 })
  }

  // Validate model belongs to provider
  const allowed = PROVIDER_MODELS[body.provider] ?? []
  if (!allowed.includes(body.model)) {
    return NextResponse.json({ error: `Model "${body.model}" not allowed for ${body.provider}` }, { status: 400 })
  }

  const { value: apiKey, source } = await getApiKey(body.provider)
  if (!apiKey) {
    return NextResponse.json({ error: `No API key configured for ${body.provider}`, source: 'none' }, { status: 400 })
  }

  // Build message content
  // Build user content as array of parts accepted by AI SDK
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [{ type: 'text', text: body.text }]
  if (body.imageDataUrl) {
    const match = body.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      parts.unshift({ type: 'image', image: match[2], mediaType: match[1] })
    }
  }

  try {
    const start = Date.now()

    let aiModel: Parameters<typeof generateText>[0]['model']
    if (body.provider === 'anthropic') {
      aiModel = createAnthropic({ apiKey })(body.model)
    } else if (body.provider === 'openai') {
      aiModel = createOpenAI({ apiKey })(body.model)
    } else {
      aiModel = createGoogleGenerativeAI({ apiKey })(body.model)
    }

    const result = await generateText({
      model:           aiModel,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages:        [{ role: 'user', content: parts }] as any,
      maxOutputTokens: 512,
    })

    const elapsed = Date.now() - start

    return NextResponse.json({
      ok:        true,
      provider:  body.provider,
      model:     body.model,
      keySource: source,
      text:      result.text,
      usage:     result.usage,
      elapsed,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const isAuthErr = /api.key|unauthorized|auth|invalid.*key|403|401/i.test(msg)
    return NextResponse.json({
      ok:      false,
      error:   msg,
      isAuthError: isAuthErr,
    }, { status: 200 }) // return 200 so client can display the error nicely
  }
}
