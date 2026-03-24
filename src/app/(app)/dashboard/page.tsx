'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { Group, Expense, Profile } from '@/lib/supabase/types'

interface DashboardData {
  groups: Group[]
  recentExpenses: (Expense & { groups: { name: string } | null; profiles: { full_name: string } | null })[]
  profile: Profile | null
  totalOwed: number
  totalOwe: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    groups: [],
    recentExpenses: [],
    profile: null,
    totalOwed: 0,
    totalOwe: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Load groups
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = memberGroups?.map((m: { group_id: string }) => m.group_id) ?? []

      let groups: Group[] = []
      if (groupIds.length > 0) {
        const { data: groupsData } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false })
        groups = groupsData ?? []
      }

      // Load recent expenses
      let recentExpenses: DashboardData['recentExpenses'] = []
      if (groupIds.length > 0) {
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*, groups(name), profiles!expenses_paid_by_fkey(full_name)')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false })
          .limit(5)
        recentExpenses = (expensesData ?? []) as DashboardData['recentExpenses']
      }

      // Calculate what you owe and what you're owed
      let totalOwed = 0
      let totalOwe = 0

      if (groupIds.length > 0) {
        // Get expenses in user's groups
        const { data: groupExpenses } = await supabase
          .from('expenses')
          .select('id, paid_by')
          .in('group_id', groupIds)

        if (groupExpenses && groupExpenses.length > 0) {
          const expenseIds = groupExpenses.map((e: { id: string; paid_by: string }) => e.id)
          const expensePaidByMap: { [id: string]: string } = {}
          groupExpenses.forEach((e: { id: string; paid_by: string }) => {
            expensePaidByMap[e.id] = e.paid_by
          })

          const { data: splits } = await supabase
            .from('expense_splits')
            .select('amount, user_id, expense_id')
            .in('expense_id', expenseIds)
            .eq('is_paid', false)

          if (splits) {
            for (const split of splits as { amount: number; user_id: string; expense_id: string }[]) {
              const paidBy = expensePaidByMap[split.expense_id]
              if (split.user_id === user.id && paidBy !== user.id) {
                totalOwe += split.amount
              } else if (split.user_id !== user.id && paidBy === user.id) {
                totalOwed += split.amount
              }
            }
          }
        }
      }

      setData({ groups, recentExpenses, profile, totalOwed, totalOwe })
      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const netBalance = data.totalOwed - data.totalOwe

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {data.profile?.full_name?.split(' ')[0] ?? 'Usuario'}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tus gastos compartidos</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-xl p-5 text-white ${netBalance >= 0 ? 'bg-green-600' : 'bg-red-500'}`}>
          <p className="text-sm opacity-90 mb-1">Balance neto</p>
          <p className="text-2xl font-bold">{formatCurrency(Math.abs(netBalance))}</p>
          <p className="text-sm opacity-75 mt-1">
            {netBalance >= 0 ? 'Te deben en total' : 'Debes en total'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Te deben</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalOwed)}</p>
          <p className="text-sm text-gray-400 mt-1">por cobrar</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Debes</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(data.totalOwe)}</p>
          <p className="text-sm text-gray-400 mt-1">por pagar</p>
        </div>
      </div>

      {/* Groups Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Tus grupos</h2>
          <Link
            href="/groups/new"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            + Nuevo grupo
          </Link>
        </div>

        {data.groups.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
            <p className="text-gray-600 font-medium mb-2">No tienes grupos aún</p>
            <p className="text-gray-400 text-sm mb-4">Crea un grupo para empezar a dividir gastos</p>
            <Link
              href="/groups/new"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Crear primer grupo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.groups.map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{group.cover_emoji ?? '🏠'}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-400">{group.currency}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {data.recentExpenses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Actividad reciente</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {data.recentExpenses.map(expense => (
              <div key={expense.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{expense.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {expense.groups?.name} · Pagó {expense.profiles?.full_name ?? 'Alguien'}
                  </p>
                </div>
                <span className="font-semibold text-gray-900 text-sm">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
