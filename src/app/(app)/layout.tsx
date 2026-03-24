import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userId={session.user.id} userEmail={session.user.email ?? ''} />
      <main className="lg:pl-64">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
