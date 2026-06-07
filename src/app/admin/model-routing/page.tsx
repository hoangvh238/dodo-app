export const dynamic = 'force-dynamic'

import ModelRoutingEditor from '@/components/dashboard/ModelRoutingEditor'
import { getRoutingConfig } from '@/lib/routing/modelRouting'

export default async function ModelRoutingPage() {
  const config = await getRoutingConfig()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Model Routing</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Configure how free-tier AI requests are distributed across providers and models.
        </p>
      </div>
      <ModelRoutingEditor initialConfig={config} />
    </div>
  )
}
