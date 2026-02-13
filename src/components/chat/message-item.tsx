'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Play, Pause, Check, CheckCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { MessageWithSender } from '@/types/database'

interface MessageItemProps {
  message: MessageWithSender
  isOwn: boolean
  showSender?: boolean
  onGetVoiceUrl?: (path: string) => Promise<string | null>
}

export function MessageItem({
  message,
  isOwn,
  showSender = false,
  onGetVoiceUrl,
}: MessageItemProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load voice URL when needed
  useEffect(() => {
    if (message.type === 'voice' && message.voice_path && onGetVoiceUrl) {
      onGetVoiceUrl(message.voice_path).then(setVoiceUrl)
    }
  }, [message.type, message.voice_path, onGetVoiceUrl])

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const progress =
      (audioRef.current.currentTime / audioRef.current.duration) * 100
    setAudioProgress(progress)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setAudioProgress(0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formattedTime = format(new Date(message.created_at), 'HH:mm', {
    locale: tr,
  })

  // System message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-zinc-800/50 rounded-full text-xs text-zinc-400">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {showSender && !isOwn && (
        <Avatar
          src={message.sender?.avatar_url}
          name={message.sender?.display_name || message.sender?.username}
          size="sm"
        />
      )}

      <div
        className={`
          max-w-[70%] rounded-2xl px-4 py-2
          ${
            isOwn
              ? 'bg-emerald-600 text-white rounded-br-md'
              : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
          }
        `}
      >
        {/* Sender name for groups */}
        {showSender && !isOwn && message.sender && (
          <p className="text-xs font-medium text-emerald-400 mb-1">
            {message.sender.display_name || message.sender.username}
          </p>
        )}

        {/* Text message */}
        {message.type === 'text' && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Voice message */}
        {message.type === 'voice' && (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={handlePlayPause}
              className={`
                flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                ${isOwn ? 'bg-emerald-700' : 'bg-zinc-700'}
                hover:opacity-80 transition-opacity
              `}
              disabled={!voiceUrl}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>

            <div className="flex-1">
              {/* Progress bar */}
              <div
                className={`h-1 rounded-full ${
                  isOwn ? 'bg-emerald-700' : 'bg-zinc-700'
                }`}
              >
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <p className="text-xs mt-1 opacity-70">
                {message.voice_duration
                  ? formatDuration(message.voice_duration)
                  : '0:00'}
              </p>
            </div>

            {voiceUrl && (
              <audio
                ref={audioRef}
                src={voiceUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
              />
            )}
          </div>
        )}

        {/* Time and status */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 ${
            isOwn ? 'text-emerald-200' : 'text-zinc-500'
          }`}
        >
          <span className="text-[10px]">{formattedTime}</span>
          {isOwn && (
            <CheckCheck className="h-3 w-3" />
          )}
        </div>
      </div>
    </div>
  )
}
