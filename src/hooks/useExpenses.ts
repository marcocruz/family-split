import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExpenseWithDetails } from '@/lib/supabase/types'

export function useExpenses(groupId: string) {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadExpenses = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('expenses')
        .select('*, categories(*), profiles!expenses_paid_by_fkey(*), expense_splits(*, profiles(*))')
        .eq('group_id', groupId)
        .order('date', { ascending: false })

      if (err) throw err
      setExpenses((data ?? []) as ExpenseWithDetails[])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const addExpense = async (data: {
    description: string
    amount: number
    categoryId?: string
    paidBy: string
    splitType: 'equal' | 'exact'
    splits: { userId: string; amount: number }[]
    date: string
    notes?: string
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        group_id: groupId,
        category_id: data.categoryId || null,
        description: data.description,
        amount: data.amount,
        paid_by: data.paidBy,
        split_type: data.splitType,
        date: data.date,
        notes: data.notes || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (expenseError) throw expenseError

    const splitInserts = data.splits.map(s => ({
      expense_id: expense.id,
      user_id: s.userId,
      amount: s.amount,
      is_paid: s.userId === data.paidBy,
    }))

    const { error: splitsError } = await supabase.from('expense_splits').insert(splitInserts)
    if (splitsError) throw splitsError

    await loadExpenses()
    return expense
  }

  const deleteExpense = async (expenseId: string) => {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (err) throw err
    await loadExpenses()
  }

  return { expenses, loading, error, loadExpenses, addExpense, deleteExpense }
}
