'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = ['🏠', '👨‍👩‍👧‍👦', '🏖️', '🍕', '🚗', '💼', '🎉', '🏋️', '🌮', '🎮', '🐕', '🌿']

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          cover_emoji: emoji,
          created_by: user.id,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        })

      if (memberError) throw memberError

      router.push(`/groups/${group.id}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el grupo'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/groups"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo grupo</h1>
          <p className="text-gray-500 text-sm">Crea un espacio para dividir gastos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Emoji picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ícono del grupo</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                  emoji === e
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del grupo *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="ej. Familia García, Casa compartida..."
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Describe el propósito de este grupo..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Creando...' : 'Crear grupo'}
        </button>
      </form>
    </div>
  )
}
