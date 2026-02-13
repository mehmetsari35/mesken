'use client'

import { Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} animate-spin text-emerald-500`} />
      {text && <p className="text-sm text-zinc-400">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-900">
        {content}
      </div>
    )
  }

  return content
}
