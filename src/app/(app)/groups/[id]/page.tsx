'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { calculateBalances, getUserDebts } from '@/lib/utils/balance'
import { Group, ExpenseWithDetails, Payment, Profile, Category } from '@/lib/supabase/types'

interface GroupPageProps {
  params: Promise<{ id: string }>
}

interface MemberData {
  user_id: string
  role: string
  profiles: Profile | null
}

export default function GroupDetailPage({ params }: GroupPageProps) {
  const { id } = use(params)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<MemberData[]>([])
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'gastos' | 'balances'>('gastos')

  useEffect(() => {
    async function loadGroup() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const [
        { data: groupData },
        { data: membersData },
        { data: expensesData },
        { data: paymentsData },
        { data: categoriesData },
      ] = await Promise.all([
        supabase.from('groups').select('*').eq('id', id).single(),
        supabase.from('group_members').select('*, profiles(*)').eq('group_id', id),
        supabase.from('expenses').select('*, categories(*), profiles!expenses_paid_by_fkey(*), expense_splits(*, profiles(*))').eq('group_id', id).order('date', { ascending: false }),
        supabase.from('payments').select('*').eq('group_id', id),
        supabase.from('categories').select('*').or('is_default.eq.true,group_id.eq.' + id),
      ])

      setGroup(groupData)
      setMembers((membersData ?? []) as MemberData[])
      setExpenses((expensesData ?? []) as ExpenseWithDetails[])
      setPayments(paymentsData ?? [])
      setCategories(categoriesData ?? [])
      setLoading(false)
    }

    loadGroup()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Grupo no encontrado</p>
        <Link href="/groups" className="text-green-600 hover:text-green-700 mt-2 inline-block">
          Volver a grupos
        </Link>
      </div>
    )
  }

  const memberProfiles: { [userId: string]: string } = {}
  members.forEach(m => {
    if (m.profiles) memberProfiles[m.user_id] = m.profiles.full_name
  })

  const debts = calculateBalances(expenses, payments, memberProfiles)
  const { owes, owed } = getUserDebts(currentUserId, debts)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/groups" className="text-gray-400 hover:text-gray-600">←</Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{group.cover_emoji ?? '🏠'}</span>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {members.length} miembro{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href={`/groups/${id}/expenses/new`}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          + Gasto
        </Link>
      </div>

      {/* My Balance Summary */}
      {(owes.length > 0 || owed.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm">Tu balance en este grupo</h3>
          {owed.map(d => (
            <div key={`owed-${d.fromUserId}`} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{d.fromUserName} te debe</span>
              <span className="text-green-600 font-semibold">{formatCurrency(d.amount)}</span>
            </div>
          ))}
          {owes.map(d => (
            <div key={`owes-${d.toUserId}`} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Debes a {d.toUserName}</span>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-semibold">{formatCurrency(d.amount)}</span>
                <Link
                  href={`/groups/${id}/settle`}
                  className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors"
                >
                  Saldar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('gastos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'gastos'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Gastos ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'balances'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Balances
        </button>
      </div>

      {/* Tab content: Gastos */}
      {activeTab === 'gastos' && (
        <div>
          {expenses.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
              <div className="text-4xl mb-3">🧾</div>
              <p className="text-gray-600 font-medium mb-1">No hay gastos aún</p>
              <p className="text-gray-400 text-sm mb-4">Agrega el primer gasto del grupo</p>
              <Link
                href={`/groups/${id}/expenses/new`}
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Agregar gasto
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map(expense => {
                const userSplit = expense.expense_splits.find(s => s.user_id === currentUserId)
                const isPaidBy = expense.paid_by === currentUserId
                const category = categories.find(c => c.id === expense.category_id)

                return (
                  <div key={expense.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{category?.emoji ?? '💰'}</span>
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(expense.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            {' · '}
                            {isPaidBy ? 'Tú pagaste' : `Pagó ${expense.profiles?.full_name ?? 'alguien'}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                        {userSplit && (
                          <p className={`text-xs mt-0.5 ${isPaidBy ? 'text-green-600' : 'text-red-500'}`}>
                            {isPaidBy ? `te deben ${formatCurrency(expense.amount - userSplit.amount)}` : `debes ${formatCurrency(userSplit.amount)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab content: Balances */}
      {activeTab === 'balances' && (
        <div>
          {debts.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-700 font-medium">¡Todo saldado!</p>
              <p className="text-gray-400 text-sm mt-1">No hay deudas pendientes en este grupo</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {debts.map((debt, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">{debt.fromUserName}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-900">{debt.toUserName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-500">{formatCurrency(debt.amount)}</span>
                    {debt.fromUserId === currentUserId && (
                      <Link
                        href={`/groups/${id}/settle`}
                        className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 transition-colors font-medium"
                      >
                        Saldar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
