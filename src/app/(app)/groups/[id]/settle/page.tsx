'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { calculateBalances, getUserDebts } from '@/lib/utils/balance'
import { ExpenseWithDetails, Payment, Profile } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ id: string }>
}

interface MemberData {
  user_id: string
  profiles: Profile | null
}

export default function SettlePage({ params }: PageProps) {
  const { id: groupId } = use(params)
  const router = useRouter()

  const [members, setMembers] = useState<MemberData[]>([])
  const [toUser, setToUser] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestedDebts, setSuggestedDebts] = useState<ReturnType<typeof getUserDebts>['owes']>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const [
        { data: membersData },
        { data: expensesData },
        { data: paymentsData },
      ] = await Promise.all([
        supabase.from('group_members').select('user_id, profiles(*)').eq('group_id', groupId),
        supabase.from('expenses').select('*, categories(*), profiles!expenses_paid_by_fkey(*), expense_splits(*, profiles(*))').eq('group_id', groupId),
        supabase.from('payments').select('*').eq('group_id', groupId),
      ])

      const memberList = (membersData ?? []) as unknown as MemberData[]
      setMembers(memberList.filter(m => m.user_id !== user.id))

      const memberProfiles: { [userId: string]: string } = {}
      memberList.forEach(m => {
        if (m.profiles) memberProfiles[m.user_id] = m.profiles.full_name
      })

      const debts = calculateBalances(
        (expensesData ?? []) as ExpenseWithDetails[],
        paymentsData ?? [] as Payment[],
        memberProfiles
      )

      const { owes } = getUserDebts(user.id, debts)
      setSuggestedDebts(owes)

      if (owes.length > 0) {
        setToUser(owes[0].toUserId)
        setAmount(owes[0].amount.toFixed(2))
      } else if (memberList.length > 0) {
        const firstOther = memberList.find(m => m.user_id !== user.id)
        if (firstOther) setToUser(firstOther.user_id)
      }
    }

    loadData()
  }, [groupId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!toUser || !amount || parseFloat(amount) <= 0) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: paymentError } = await supabase.from('payments').insert({
        group_id: groupId,
        from_user: currentUserId,
        to_user: toUser,
        amount: parseFloat(amount),
        notes: notes.trim() || null,
        date,
        created_by: currentUserId,
      })

      if (paymentError) throw paymentError

      router.push(`/groups/${groupId}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar el pago'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${groupId}`} className="text-gray-400 hover:text-gray-600">
          ← Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrar pago</h1>
          <p className="text-gray-500 text-sm">Salda una deuda con un miembro</p>
        </div>
      </div>

      {/* Suggested debts */}
      {suggestedDebts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">💡 Deudas pendientes</p>
          {suggestedDebts.map(debt => (
            <button
              key={debt.toUserId}
              type="button"
              onClick={() => {
                setToUser(debt.toUserId)
                setAmount(debt.amount.toFixed(2))
              }}
              className="w-full text-left flex items-center justify-between py-1.5 text-sm text-amber-700 hover:text-amber-900"
            >
              <span>Debes a {debt.toUserName}</span>
              <span className="font-bold">{formatCurrency(debt.amount)}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pagar a *</label>
          <select
            value={toUser}
            onChange={e => setToUser(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Seleccionar persona</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles?.full_name ?? 'Usuario'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="ej. Transferencia BBVA..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !toUser || !amount}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Guardando...' : 'Confirmar pago'}
        </button>
      </form>
    </div>
  )
}
