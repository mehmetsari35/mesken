'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Users, User, Settings } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  const tabs = [
    { href: '/app', label: 'Sohbetler', icon: MessageSquare },
    { href: '/app/people', label: 'Kişiler', icon: Users },
    { href: '/app/profile', label: 'Profil', icon: User },
  ]

  const isTabActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app' || pathname?.startsWith('/chat')
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-900">
      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Bottom navigation */}
      <nav className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900 safe-area-bottom">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = isTabActive(tab.href)
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex flex-col items-center py-3 px-6
                  transition-colors
                  ${
                    isActive
                      ? 'text-emerald-500'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }
                `}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
