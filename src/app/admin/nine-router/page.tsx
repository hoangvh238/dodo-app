export const dynamic = 'force-dynamic'

import NineRouterPanel from '@/components/dashboard/NineRouterPanel'
import { createServiceClient } from '@/lib/supabase/service'

async function getInitialConfig() {
  const db = createServiceClient()
  const { data: rows } = await db
    .from('admin_config')
    .select('key, value')
    .in('key', ['nine_router_url', 'nine_router_api_key', 'nine_router_enabled'])

  const m = Object.fromEntries((rows ?? []).map(r => [r.key, r.value?.trim() ?? '']))
  return {
    url:     m['nine_router_url']     || process.env.NINE_ROUTER_URL     || '',
    apiKey:  m['nine_router_api_key'] || process.env.NINE_ROUTER_API_KEY || 'sk_9router',
    enabled: m['nine_router_enabled'] === 'true' || process.env.NINE_ROUTER_ENABLED === 'true',
  }
}

export default async function NineRouterPage() {
  const config = await getInitialConfig()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          9Router
          <span className="text-xs font-normal text-slate-500 bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-full">
            free-tier AI routing
          </span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Route free-tier requests through 9router — 40+ providers, auto-fallback, token compression.
        </p>
      </div>
      <NineRouterPanel initialConfig={config} />
    </div>
  )
}
