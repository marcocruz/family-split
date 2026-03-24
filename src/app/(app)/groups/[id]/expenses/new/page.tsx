'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Category, Profile } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ id: string }>
}

interface MemberData {
  user_id: string
  profiles: Profile | null
}

export default function NewExpensePage({ params }: PageProps) {
  const { id: groupId } = use(params)
  const router = useRouter()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'exact'>('equal')
  const [exactAmounts, setExactAmounts] = useState<{ [userId: string]: string }>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const [members, setMembers] = useState<MemberData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      setPaidBy(user.id)

      const [{ data: membersData }, { data: categoriesData }] = await Promise.all([
        supabase.from('group_members').select('user_id, profiles(*)').eq('group_id', groupId),
        supabase.from('categories').select('*').or(`is_default.eq.true,group_id.eq.${groupId}`).order('name'),
      ])

      const memberList = (membersData ?? []) as unknown as MemberData[]
      setMembers(memberList)
      setCategories(categoriesData ?? [])

      // Initialize exact amounts
      const amounts: { [userId: string]: string } = {}
      memberList.forEach(m => { amounts[m.user_id] = '' })
      setExactAmounts(amounts)

      if (categoriesData && categoriesData.length > 0) {
        setCategoryId(categoriesData[0].id)
      }
    }

    loadData()
  }, [groupId])

  const totalAmount = parseFloat(amount) || 0
  const equalShare = members.length > 0 ? totalAmount / members.length : 0

  const exactTotal = Object.values(exactAmounts).reduce(
    (sum, v) => sum + (parseFloat(v) || 0), 0
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount || totalAmount <= 0) return

    if (splitType === 'exact') {
      const diff = Math.abs(exactTotal - totalAmount)
      if (diff > 0.01) {
        setError(`Los montos exactos deben sumar ${totalAmount.toFixed(2)} (actualmente suman ${exactTotal.toFixed(2)})`)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          category_id: categoryId || null,
          description: description.trim(),
          amount: totalAmount,
          paid_by: paidBy,
          split_type: splitType,
          date,
          notes: notes.trim() || null,
          created_by: currentUserId,
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Create splits
      const splits = members.map(m => ({
        expense_id: expense.id,
        user_id: m.user_id,
        amount: splitType === 'equal'
          ? parseFloat((totalAmount / members.length).toFixed(2))
          : parseFloat(exactAmounts[m.user_id] || '0'),
        is_paid: m.user_id === paidBy,
      }))

      const { error: splitsError } = await supabase.from('expense_splits').insert(splits)
      if (splitsError) throw splitsError

      router.push(`/groups/${groupId}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el gasto'
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
          <h1 className="text-2xl font-bold text-gray-900">Nuevo gasto</h1>
          <p className="text-gray-500 text-sm">Agrega un gasto al grupo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="ej. Pizza del viernes, súper semanal..."
            />
          </div>

          {/* Amount */}
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
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category and Who Paid */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién pagó?</label>
            <select
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name ?? m.user_id} {m.user_id === currentUserId ? '(Tú)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Split Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">División</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  splitType === 'equal'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                Igual para todos
              </button>
              <button
                type="button"
                onClick={() => setSplitType('exact')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  splitType === 'exact'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                Montos exactos
              </button>
            </div>
          </div>

          {/* Members split display */}
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {m.profiles?.full_name ?? 'Usuario'} {m.user_id === currentUserId ? '(Tú)' : ''}
                </span>
                {splitType === 'equal' ? (
                  <span className="text-sm font-medium text-gray-900">
                    ${equalShare.toFixed(2)}
                  </span>
                ) : (
                  <input
                    type="number"
                    value={exactAmounts[m.user_id] ?? ''}
                    onChange={e => setExactAmounts(prev => ({ ...prev, [m.user_id]: e.target.value }))}
                    min="0"
                    step="0.01"
                    className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    placeholder="0.00"
                  />
                )}
              </div>
            ))}
            {splitType === 'exact' && totalAmount > 0 && (
              <div className={`flex items-center justify-between pt-2 border-t border-gray-100 text-sm ${Math.abs(exactTotal - totalAmount) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
                <span>Total asignado:</span>
                <span className="font-bold">${exactTotal.toFixed(2)} / ${totalAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Notas adicionales..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !description.trim() || !amount}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Guardando...' : 'Guardar gasto'}
        </button>
      </form>
    </div>
  )
}
