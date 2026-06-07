/**
 * Transparent proxy to the 9router server.
 *
 * Vercel trick: instead of running 9router as a separate process, all
 * traffic goes through this serverless route which forwards to the
 * configured NINE_ROUTER_URL (can be the 9router cloud service, a Railway
 * app, or even localhost:3002 in dev).
 *
 * Usage from client / AI SDK:
 *   baseURL = "/api/9router/v1"
 *
 * This keeps the browser from ever hitting the external 9router URL directly
 * (avoids CORS, hides credentials, works on Vercel with zero extra deployment).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getNineRouterConfig } from '@/lib/routing/nineRouter'

export const dynamic = 'force-dynamic'

const BLOCKED_REQUEST_HEADERS  = new Set(['host', 'connection', 'transfer-encoding', 'te', 'trailer', 'upgrade'])
const BLOCKED_RESPONSE_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive'])

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const cfg = await getNineRouterConfig()

  if (!cfg.url) {
    return NextResponse.json(
      { error: '9router not configured. Set NINE_ROUTER_URL or configure it in the admin panel.' },
      { status: 503 },
    )
  }

  const { path } = await params
  const upstream   = cfg.url.replace(/\/$/, '')
  const targetPath = '/' + path.join('/')
  const search     = req.nextUrl.search ?? ''
  const targetUrl  = upstream + targetPath + search

  // Forward headers, inject auth
  const headers = new Headers()
  for (const [k, v] of req.headers) {
    if (!BLOCKED_REQUEST_HEADERS.has(k.toLowerCase())) headers.set(k, v)
  }
  headers.set('host', new URL(upstream).host)
  if (cfg.apiKey) headers.set('authorization', `Bearer ${cfg.apiKey}`)

  // Forward body for POST/PUT/PATCH
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method)
  const body    = hasBody ? await req.arrayBuffer() : undefined

  try {
    const upRes = await fetch(targetUrl, {
      method:  req.method,
      headers,
      body:    body ?? undefined,
      // @ts-expect-error — Node fetch duplex for streaming
      duplex: 'half',
    })

    // Pass response headers through (minus hop-by-hop)
    const resHeaders = new Headers()
    for (const [k, v] of upRes.headers) {
      if (!BLOCKED_RESPONSE_HEADERS.has(k.toLowerCase())) resHeaders.set(k, v)
    }
    // Allow browser / AI SDK to read it
    resHeaders.set('access-control-allow-origin', '*')

    return new NextResponse(upRes.body, {
      status:  upRes.status,
      headers: resHeaders,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Proxy error: ${msg}` }, { status: 502 })
  }
}

export const GET    = proxy
export const POST   = proxy
export const PUT    = proxy
export const PATCH  = proxy
export const DELETE = proxy

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
