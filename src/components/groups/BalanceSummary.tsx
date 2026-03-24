import { DebtEntry } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'

interface BalanceSummaryProps {
  debts: DebtEntry[]
  currentUserId: string
  groupId: string
}

export default function BalanceSummary({ debts, currentUserId, groupId }: BalanceSummaryProps) {
  if (debts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-gray-600 font-medium">Todo saldado</p>
        <p className="text-gray-400 text-sm">No hay deudas pendientes</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {debts.map((debt, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div className="text-sm">
            <span className="font-medium text-gray-900">{debt.fromUserName}</span>
            <span className="text-gray-400 mx-2">→</span>
            <span className="font-medium text-gray-900">{debt.toUserName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-500">{formatCurrency(debt.amount)}</span>
            {debt.fromUserId === currentUserId && (
              <Link
                href={`/groups/${groupId}/settle`}
                className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-100 font-medium"
              >
                Saldar
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
