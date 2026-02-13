'use client'

import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <header className="flex-shrink-0 pt-safe">
        <div className="px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-500 tracking-tight">
            MESKEN
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Özel alanın.</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col px-6 pb-safe-extra">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h2 className="text-2xl font-semibold text-zinc-100">{title}</h2>
            )}
            {subtitle && (
              <p className="text-zinc-400 mt-2">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
