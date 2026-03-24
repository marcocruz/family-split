import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Group, GroupWithMembers } from '@/lib/supabase/types'

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = memberGroups?.map(m => m.group_id) ?? []

      if (groupIds.length === 0) {
        setGroups([])
        return
      }

      const { data, error: err } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false })

      if (err) throw err
      setGroups(data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar grupos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const createGroup = async (data: {
    name: string
    description?: string
    cover_emoji?: string
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ ...data, created_by: user.id })
      .select()
      .single()

    if (groupError) throw groupError

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
    })

    await loadGroups()
    return group
  }

  const getGroupWithMembers = async (groupId: string): Promise<GroupWithMembers | null> => {
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('groups')
      .select('*, group_members(*, profiles(*))')
      .eq('id', groupId)
      .single()

    if (err) return null
    return data as GroupWithMembers
  }

  return { groups, loading, error, loadGroups, createGroup, getGroupWithMembers }
}
