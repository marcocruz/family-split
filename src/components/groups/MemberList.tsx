import { Profile } from '@/lib/supabase/types'

interface Member {
  user_id: string
  role: string
  profiles: Profile | null
}

interface MemberListProps {
  members: Member[]
  currentUserId?: string
}

export default function MemberList({ members, currentUserId }: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map(member => (
        <div key={member.user_id} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
              {(member.profiles?.full_name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {member.profiles?.full_name ?? 'Usuario'}
                {member.user_id === currentUserId && (
                  <span className="ml-1 text-xs text-gray-400">(Tú)</span>
                )}
              </p>
              <p className="text-xs text-gray-400">{member.profiles?.phone ?? ''}</p>
            </div>
          </div>
          {member.role === 'admin' && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
