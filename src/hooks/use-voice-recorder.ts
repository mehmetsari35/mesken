'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceRecorderOptions {
  maxDuration?: number // in seconds
  onRecordingComplete?: (blob: Blob, duration: number) => void
}

interface UseVoiceRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  duration: number
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  cancelRecording: () => void
  error: string | null
}

export function useVoiceRecorder({
  maxDuration = 60,
  onRecordingComplete,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Clean up
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    setDuration(0)
    setIsPaused(false)
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      cleanup()

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const recordedDuration = (Date.now() - startTimeRef.current) / 1000

        if (onRecordingComplete && blob.size > 0) {
          onRecordingComplete(blob, recordedDuration)
        }

        cleanup()
      }

      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      startTimeRef.current = Date.now()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDuration(elapsed)

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording()
        }
      }, 100)
    } catch (err) {
      console.error('Recording error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Mikrofon erişimi sağlanamadı'
      )
      cleanup()
    }
  }, [cleanup, maxDuration, onRecordingComplete])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setIsPaused(true)
    }
  }, [])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume()

      // Resume timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDuration(elapsed)

        if (elapsed >= maxDuration) {
          stopRecording()
        }
      }, 100)

      setIsPaused(false)
    }
  }, [maxDuration, stopRecording])

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Remove the onstop handler to prevent callback
      mediaRecorderRef.current.onstop = null
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
    cleanup()
    setIsRecording(false)
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    error,
  }
}
