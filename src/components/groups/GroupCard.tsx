import Link from 'next/link'
import { Group } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/currency'

interface GroupCardProps {
  group: Group
  memberCount?: number
  balance?: number
}

export default function GroupCard({ group, memberCount, balance }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{group.cover_emoji ?? '🏠'}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{group.name}</h3>
            {memberCount !== undefined && (
              <p className="text-xs text-gray-400">{memberCount} miembro{memberCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {balance !== undefined && (
          <div className="text-right">
            <p className={`font-bold text-sm ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </p>
            <p className="text-xs text-gray-400">{balance >= 0 ? 'te deben' : 'debes'}</p>
          </div>
        )}
      </div>
    </Link>
  )
}
