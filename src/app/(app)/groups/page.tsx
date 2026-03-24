'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Group } from '@/lib/supabase/types'

interface GroupWithCount extends Group {
  memberCount: number
  expenseCount: number
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGroups() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = memberGroups?.map(m => m.group_id) ?? []

      if (groupIds.length === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false })

      const groupsWithCount: GroupWithCount[] = await Promise.all(
        (groupsData ?? []).map(async group => {
          const [{ count: memberCount }, { count: expenseCount }] = await Promise.all([
            supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', group.id),
            supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('group_id', group.id),
          ])
          return { ...group, memberCount: memberCount ?? 0, expenseCount: expenseCount ?? 0 }
        })
      )

      setGroups(groupsWithCount)
      setLoading(false)
    }

    loadGroups()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis grupos</h1>
          <p className="text-gray-500 text-sm mt-1">{groups.length} grupos activos</p>
        </div>
        <Link
          href="/groups/new"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          + Nuevo grupo
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <p className="text-gray-700 font-medium text-lg mb-2">No tienes grupos</p>
          <p className="text-gray-400 text-sm mb-6">
            Crea un grupo familiar o de amigos para empezar a dividir gastos
          </p>
          <Link
            href="/groups/new"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Crear mi primer grupo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map(group => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{group.cover_emoji ?? '🏠'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{group.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{group.memberCount}</p>
                  <p className="text-xs text-gray-400">miembros</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{group.expenseCount}</p>
                  <p className="text-xs text-gray-400">gastos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
