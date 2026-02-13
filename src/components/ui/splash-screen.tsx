'use client'

import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Logo */}
      <div className="relative mb-8">
        {/* Glow effect */}
        <div className="absolute inset-0 h-24 w-24 rounded-3xl bg-emerald-500 blur-2xl opacity-40 animate-pulse" />

        {/* Logo container */}
        <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          {/* Inner shine */}
          <div className="absolute inset-1 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />

          {/* Letter M with gradient */}
          <span className="relative text-4xl font-black text-white drop-shadow-lg" style={{ fontFamily: 'system-ui' }}>
            M
          </span>
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-4xl font-bold text-zinc-100 tracking-tight mb-3">
        MESKEN
      </h1>

      {/* Tagline */}
      <p className="text-base text-zinc-400 text-center max-w-xs px-6">
        Özel alanın. Güvenli ve özel mesajlaşma platformu.
      </p>

      {/* Creator credit */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center">
        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
          <span>👉</span>
          <span>Created by</span>
          <span className="text-zinc-400 font-medium">Mehmet Sarı</span>
        </p>
      </div>
    </div>
  )
}
