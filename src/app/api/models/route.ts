/**
 * GET /api/models — Public endpoint returning available server-side models.
 * No auth required. Cached at CDN edge for 1 hour.
 *
 * Clients use this to build their model picker instead of hardcoding the list.
 * Only models in this list can be requested via /api/ai/chat.
 */
import { NextResponse } from 'next/server'
import { SERVER_MODELS, DEFAULT_SERVER_MODEL_ID } from '@/lib/models'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET() {
  return NextResponse.json({
    models:  SERVER_MODELS,
    default: DEFAULT_SERVER_MODEL_ID,
  }, {
    headers: {
      ...CORS,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
