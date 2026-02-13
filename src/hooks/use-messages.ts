'use client'

import { useCallback, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import type { MessageWithSender } from '@/types/database'

export function useMessages(conversationId: string | null) {
  const supabase = getSupabaseClient()
  const { user } = useAuthStore()
  const {
    messages,
    isLoadingMessages,
    setMessages,
    addMessage,
    updateMessage,
    setLoadingMessages,
  } = useChatStore()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const isRealtimeConnected = useRef(false)

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return

    setLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:profiles(*)
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      setMessages((data as MessageWithSender[]) || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }, [supabase, conversationId, setMessages, setLoadingMessages])

  // Send text message
  const sendTextMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user) {
        return { error: new Error('Not authenticated or no conversation') }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          type: 'text',
          content: content.trim(),
        } as never)
        .select(
          `
          *,
          sender:profiles(*)
        `
        )
        .single()

      // Add message to state immediately after successful send
      if (!error && data) {
        addMessage(data as MessageWithSender)
      }

      return { data: data as unknown as MessageWithSender, error }
    },
    [supabase, conversationId, user, addMessage]
  )

  // Send voice message
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob, duration: number) => {
      if (!conversationId || !user) {
        return { error: new Error('Not authenticated or no conversation') }
      }

      // Generate unique filename
      const filename = `${user.id}/${conversationId}/${Date.now()}.webm`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('voice')
        .upload(filename, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        })

      if (uploadError) {
        return { error: uploadError }
      }

      // Create message record
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          type: 'voice',
          voice_path: filename,
          voice_duration: Math.round(duration),
        } as never)
        .select(
          `
          *,
          sender:profiles(*)
        `
        )
        .single()

      // Add message to state immediately after successful send
      if (!error && data) {
        addMessage(data as MessageWithSender)
      }

      return { data: data as unknown as MessageWithSender, error }
    },
    [supabase, conversationId, user, addMessage]
  )

  // Get signed URL for voice message
  const getVoiceUrl = useCallback(
    async (voicePath: string) => {
      const { data, error } = await supabase.storage
        .from('voice')
        .createSignedUrl(voicePath, 3600) // 1 hour expiry

      if (error) {
        console.error('Error getting voice URL:', error)
        return null
      }

      return data.signedUrl
    },
    [supabase]
  )

  // Update last read timestamp
  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return

    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() } as never)
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
  }, [supabase, conversationId, user])

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId || !user) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Skip if this is our own message (already added locally after send)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newMessage = payload.new as any
          if (newMessage.sender_id === user?.id) {
            console.log('[realtime] Skipping own message:', newMessage.id)
            return
          }

          // Fetch the complete message with sender for other users' messages
          console.log('[realtime] New message from other user:', newMessage.id)
          const { data } = await supabase
            .from('messages')
            .select(
              `
              *,
              sender:profiles(*)
            `
            )
            .eq('id', newMessage.id)
            .single()

          if (data) {
            addMessage(data as MessageWithSender)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          updateMessage(payload.new.id as number, payload.new as MessageWithSender)
        }
      )
      .subscribe((status) => {
        console.log('[realtime] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[realtime] Successfully subscribed to messages:', conversationId)
          isRealtimeConnected.current = true
          // Stop polling if realtime connects
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('[realtime] Connection failed, starting polling fallback:', conversationId)
          isRealtimeConnected.current = false
          // Start polling as fallback (every 3 seconds)
          if (!pollingRef.current) {
            pollingRef.current = setInterval(() => {
              console.log('[polling] Fetching messages...')
              fetchMessages()
            }, 3000)
          }
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [supabase, conversationId, user, addMessage, updateMessage, fetchMessages])

  // Initial fetch when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages()
      markAsRead()
    } else {
      setMessages([])
    }
  }, [conversationId, fetchMessages, markAsRead, setMessages])

  return {
    messages,
    isLoading: isLoadingMessages,
    fetchMessages,
    sendTextMessage,
    sendVoiceMessage,
    getVoiceUrl,
    markAsRead,
  }
}
