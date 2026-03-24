'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  userId: string
  userEmail: string
}

const navItems = [
  { href: '/dashboard', label: 'Inicio', emoji: '🏠' },
  { href: '/groups', label: 'Grupos', emoji: '👨‍👩‍👧‍👦' },
]

export default function Navbar({ userId, userEmail }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-gray-900">FamilySplit</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Gastos compartidos</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm text-gray-600 truncate flex-1">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full text-left text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            {loggingOut ? 'Cerrando...' : '← Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 safe-area-inset-bottom">
        <div className="flex">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <span className="text-xl">{item.emoji}</span>
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium text-gray-400"
          >
            <span className="text-xl">🚪</span>
            Salir
          </button>
        </div>
      </nav>
    </>
  )
}
