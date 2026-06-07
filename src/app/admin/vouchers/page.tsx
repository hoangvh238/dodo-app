export const dynamic = 'force-dynamic'

import VoucherManager from '@/components/dashboard/VoucherManager'

export default function VouchersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Vouchers</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Create and manage credit voucher codes for users. Each code is single-use per account.
        </p>
      </div>
      <VoucherManager />
    </div>
  )
}
