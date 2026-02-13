'use client'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  // Generate consistent color based on name
  const colors = [
    'bg-emerald-600',
    'bg-blue-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-orange-600',
    'bg-teal-600',
    'bg-cyan-600',
    'bg-indigo-600',
  ]

  const colorIndex = name
    ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length
    : 0

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`
        ${sizes[size]}
        ${colors[colorIndex]}
        rounded-full
        flex items-center justify-center
        font-semibold text-white
        ${className}
      `}
    >
      {initials}
    </div>
  )
}
