'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, X, Pause, Play, Loader2 } from 'lucide-react'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'

interface MessageInputProps {
  onSendText: (content: string) => Promise<void>
  onSendVoice: (blob: Blob, duration: number) => Promise<void>
  disabled?: boolean
}

export function MessageInput({
  onSendText,
  onSendVoice,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    error: recordingError,
  } = useVoiceRecorder({
    maxDuration: 60,
    onRecordingComplete: async (blob, recordedDuration) => {
      setIsSending(true)
      try {
        await onSendVoice(blob, recordedDuration)
      } finally {
        setIsSending(false)
      }
    },
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendText = async () => {
    if (!text.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendText(text.trim())
      setText('')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  // Focus input when not recording
  useEffect(() => {
    if (!isRecording && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isRecording])

  // Recording mode UI
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-t border-zinc-800">
        {/* Cancel button */}
        <button
          onClick={cancelRecording}
          className="h-10 w-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600/30 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Recording indicator */}
        <div className="flex-1 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-zinc-300 font-mono">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Pause/Resume button */}
          <button
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            {isPaused ? (
              <Play className="h-4 w-4 text-zinc-300" />
            ) : (
              <Pause className="h-4 w-4 text-zinc-300" />
            )}
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={stopRecording}
          className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800">
      {/* Recording error */}
      {recordingError && (
        <p className="text-xs text-red-400 mb-2">{recordingError}</p>
      )}

      <div className="flex items-center gap-3">
        {/* Text input */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesaj yaz..."
            className="w-full px-4 py-2.5 rounded-full bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={disabled || isSending}
          />
        </div>

        {/* Voice or Send button */}
        {text.trim() ? (
          <button
            onClick={handleSendText}
            disabled={disabled || isSending}
            className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="h-10 w-10 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
