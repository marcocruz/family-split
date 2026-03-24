import { ExpenseWithDetails } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/currency'

interface ExpenseCardProps {
  expense: ExpenseWithDetails
  currentUserId: string
}

export default function ExpenseCard({ expense, currentUserId }: ExpenseCardProps) {
  const isPaidBy = expense.paid_by === currentUserId
  const userSplit = expense.expense_splits.find(s => s.user_id === currentUserId)
  const category = expense.categories

  const formattedDate = new Date(expense.date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{category?.emoji ?? '💰'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-gray-900 truncate">{expense.description}</p>
            <p className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(expense.amount)}</p>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              {formattedDate} · {isPaidBy ? 'Tú pagaste' : `Pagó ${expense.profiles?.full_name ?? 'alguien'}`}
            </p>
            {userSplit && (
              <p className={`text-xs font-medium ${isPaidBy ? 'text-green-600' : 'text-red-500'}`}>
                {isPaidBy
                  ? `+${formatCurrency(expense.amount - userSplit.amount)}`
                  : `-${formatCurrency(userSplit.amount)}`}
              </p>
            )}
          </div>
          {expense.notes && (
            <p className="text-xs text-gray-400 mt-1 italic">{expense.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}
