import { DebtEntry, ExpenseWithDetails, Payment } from '@/lib/supabase/types'

interface BalanceMap {
  [userId: string]: {
    [otherUserId: string]: number // positive = otherUser owes userId
  }
}

/**
 * Calcula balances entre miembros de un grupo.
 * Retorna una lista de deudas simplificadas (quién debe a quién y cuánto).
 */
export function calculateBalances(
  expenses: ExpenseWithDetails[],
  payments: Payment[],
  memberProfiles: { [userId: string]: string } // userId -> name
): DebtEntry[] {
  const balanceMap: BalanceMap = {}

  // Initialize balance map for all members
  const allUserIds = Object.keys(memberProfiles)
  for (const userId of allUserIds) {
    balanceMap[userId] = {}
    for (const otherId of allUserIds) {
      if (userId !== otherId) {
        balanceMap[userId][otherId] = 0
      }
    }
  }

  // Process expenses
  for (const expense of expenses) {
    const paidBy = expense.paid_by
    if (!balanceMap[paidBy]) continue

    for (const split of expense.expense_splits) {
      const splitUserId = split.user_id
      if (splitUserId === paidBy) continue
      if (!balanceMap[paidBy]) continue

      // paidBy is owed money by splitUserId
      const amount = split.amount
      if (balanceMap[paidBy][splitUserId] !== undefined) {
        balanceMap[paidBy][splitUserId] += amount
      }
      if (balanceMap[splitUserId]?.[paidBy] !== undefined) {
        balanceMap[splitUserId][paidBy] -= amount
      }
    }
  }

  // Process payments (settlements)
  for (const payment of payments) {
    const { from_user, to_user, amount } = payment
    if (balanceMap[from_user]?.[to_user] !== undefined) {
      // from_user paid to_user, so to_user is owed less
      balanceMap[to_user][from_user] -= amount
      balanceMap[from_user][to_user] += amount
    }
  }

  // Convert to simplified debt entries
  const debts: DebtEntry[] = []
  const processed = new Set<string>()

  for (const userId of allUserIds) {
    for (const otherId of allUserIds) {
      if (userId === otherId) continue
      const key = [userId, otherId].sort().join('-')
      if (processed.has(key)) continue
      processed.add(key)

      const netAmount = (balanceMap[userId]?.[otherId] ?? 0)

      if (Math.abs(netAmount) < 0.01) continue

      if (netAmount > 0) {
        // otherId owes userId
        debts.push({
          fromUserId: otherId,
          fromUserName: memberProfiles[otherId] ?? 'Desconocido',
          toUserId: userId,
          toUserName: memberProfiles[userId] ?? 'Desconocido',
          amount: netAmount,
        })
      } else if (netAmount < 0) {
        // userId owes otherId
        debts.push({
          fromUserId: userId,
          fromUserName: memberProfiles[userId] ?? 'Desconocido',
          toUserId: otherId,
          toUserName: memberProfiles[otherId] ?? 'Desconocido',
          amount: Math.abs(netAmount),
        })
      }
    }
  }

  return debts
}

/**
 * Calcula el balance neto de un usuario en un grupo.
 * Positivo = te deben, negativo = debes.
 */
export function getUserNetBalance(
  userId: string,
  debts: DebtEntry[]
): number {
  let balance = 0
  for (const debt of debts) {
    if (debt.toUserId === userId) {
      balance += debt.amount
    } else if (debt.fromUserId === userId) {
      balance -= debt.amount
    }
  }
  return balance
}

/**
 * Obtiene las deudas específicas de un usuario
 */
export function getUserDebts(
  userId: string,
  debts: DebtEntry[]
): { owes: DebtEntry[]; owed: DebtEntry[] } {
  return {
    owes: debts.filter(d => d.fromUserId === userId),
    owed: debts.filter(d => d.toUserId === userId),
  }
}
