interface Member {
  userId: string
  name: string
}

interface SplitCalculatorProps {
  members: Member[]
  totalAmount: number
  splitType: 'equal' | 'exact'
  exactAmounts: { [userId: string]: string }
  onExactAmountChange: (userId: string, value: string) => void
}

export default function SplitCalculator({
  members,
  totalAmount,
  splitType,
  exactAmounts,
  onExactAmountChange,
}: SplitCalculatorProps) {
  const equalShare = members.length > 0 ? totalAmount / members.length : 0
  const exactTotal = Object.values(exactAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
  const remaining = totalAmount - exactTotal
  const isBalanced = Math.abs(remaining) < 0.01

  return (
    <div className="space-y-3">
      {members.map(member => (
        <div key={member.userId} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-700">{member.name}</span>
          </div>

          {splitType === 'equal' ? (
            <div className="text-right">
              <span className="font-semibold text-gray-900 text-sm">
                ${equalShare.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={exactAmounts[member.userId] ?? ''}
                onChange={e => onExactAmountChange(member.userId, e.target.value)}
                min="0"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      ))}

      {splitType === 'exact' && totalAmount > 0 && (
        <div className={`flex items-center justify-between pt-2 border-t text-sm ${
          isBalanced ? 'text-green-600 border-green-200' : 'text-red-500 border-red-200'
        }`}>
          <span className="font-medium">
            {isBalanced ? '✓ Montos correctos' : `Faltan $${Math.abs(remaining).toFixed(2)}`}
          </span>
          <span className="font-bold">
            ${exactTotal.toFixed(2)} / ${totalAmount.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
