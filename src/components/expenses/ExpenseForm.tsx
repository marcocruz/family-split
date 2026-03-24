'use client'

import { useState } from 'react'
import { Category, Profile } from '@/lib/supabase/types'

interface ExpenseFormData {
  description: string
  amount: number
  categoryId: string
  paidBy: string
  splitType: 'equal' | 'exact'
  splits: { userId: string; amount: number }[]
  date: string
  notes?: string
}

interface ExpenseFormProps {
  members: { user_id: string; profiles: Profile | null }[]
  categories: Category[]
  currentUserId: string
  onSubmit: (data: ExpenseFormData) => Promise<void>
  loading?: boolean
}

export default function ExpenseForm({
  members,
  categories,
  currentUserId,
  onSubmit,
  loading = false,
}: ExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<'equal' | 'exact'>('equal')
  const [exactAmounts, setExactAmounts] = useState<{ [userId: string]: string }>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const totalAmount = parseFloat(amount) || 0
  const equalShare = members.length > 0 ? totalAmount / members.length : 0
  const exactTotal = Object.values(exactAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (splitType === 'exact' && Math.abs(exactTotal - totalAmount) > 0.01) {
      setError(`Los montos deben sumar $${totalAmount.toFixed(2)}`)
      return
    }

    const splits = members.map(m => ({
      userId: m.user_id,
      amount: splitType === 'equal'
        ? parseFloat((totalAmount / members.length).toFixed(2))
        : parseFloat(exactAmounts[m.user_id] || '0'),
    }))

    await onSubmit({
      description,
      amount: totalAmount,
      categoryId,
      paidBy,
      splitType,
      splits,
      date,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="ej. Pizza, súper..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién pagó?</label>
        <select
          value={paidBy}
          onChange={e => setPaidBy(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          {members.map(m => (
            <option key={m.user_id} value={m.user_id}>
              {m.profiles?.full_name ?? 'Usuario'} {m.user_id === currentUserId ? '(Tú)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">División</label>
        <div className="flex gap-2 mb-3">
          {(['equal', 'exact'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                splitType === type
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {type === 'equal' ? 'Igual para todos' : 'Montos exactos'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {members.map(m => (
            <div key={m.user_id} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {m.profiles?.full_name ?? 'Usuario'} {m.user_id === currentUserId ? '(Tú)' : ''}
              </span>
              {splitType === 'equal' ? (
                <span className="text-sm font-medium">${equalShare.toFixed(2)}</span>
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
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Notas adicionales..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || !description || !amount}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? 'Guardando...' : 'Guardar gasto'}
      </button>
    </form>
  )
}
