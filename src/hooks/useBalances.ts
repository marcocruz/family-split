import { useMemo } from 'react'
import { calculateBalances, getUserNetBalance, getUserDebts } from '@/lib/utils/balance'
import { ExpenseWithDetails, Payment, DebtEntry } from '@/lib/supabase/types'

interface UseBalancesInput {
  expenses: ExpenseWithDetails[]
  payments: Payment[]
  memberProfiles: { [userId: string]: string }
  currentUserId: string
}

interface UseBalancesOutput {
  debts: DebtEntry[]
  myNetBalance: number
  myOwes: DebtEntry[]
  myOwed: DebtEntry[]
  totalOwe: number
  totalOwed: number
}

export function useBalances({
  expenses,
  payments,
  memberProfiles,
  currentUserId,
}: UseBalancesInput): UseBalancesOutput {
  const debts = useMemo(
    () => calculateBalances(expenses, payments, memberProfiles),
    [expenses, payments, memberProfiles]
  )

  const myNetBalance = useMemo(
    () => getUserNetBalance(currentUserId, debts),
    [currentUserId, debts]
  )

  const { owes: myOwes, owed: myOwed } = useMemo(
    () => getUserDebts(currentUserId, debts),
    [currentUserId, debts]
  )

  const totalOwe = useMemo(
    () => myOwes.reduce((sum, d) => sum + d.amount, 0),
    [myOwes]
  )

  const totalOwed = useMemo(
    () => myOwed.reduce((sum, d) => sum + d.amount, 0),
    [myOwed]
  )

  return { debts, myNetBalance, myOwes, myOwed, totalOwe, totalOwed }
}
