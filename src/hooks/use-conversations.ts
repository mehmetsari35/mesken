'use client'

import { useCallback, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import type { ConversationWithMembers } from '@/types/database'

export function useConversations() {
  const supabase = getSupabaseClient()
  const { user } = useAuthStore()
  const {
    conversations,
    isLoadingConversations,
    setConversations,
    addConversation,
    updateConversation,
    setLoadingConversations,
  } = useChatStore()

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return

    setLoadingConversations(true)
    try {
      // Get conversation IDs where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError

      const members = memberData as { conversation_id: string }[] | null
      const conversationIds = members?.map((m) => m.conversation_id) || []

      if (conversationIds.length === 0) {
        setConversations([])
        return
      }

      // Fetch conversations with members
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from('conversations')
          .select(
            `
            *,
            members:conversation_members(
              *,
              profile:profiles(*)
            )
          `
          )
          .in('id', conversationIds)
          .order('updated_at', { ascending: false })

      if (conversationsError) throw conversationsError

      // Fetch last message for each conversation
      const convos = conversationsData as ConversationWithMembers[] | null
      const conversationsWithLastMessage = await Promise.all(
        (convos || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...conv,
            last_message: lastMessage || undefined,
          } as ConversationWithMembers
        })
      )

      setConversations(conversationsWithLastMessage)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoadingConversations(false)
    }
  }, [supabase, user, setConversations, setLoadingConversations])

  // Create DM conversation
  const createDM = useCallback(
    async (otherUserId: string) => {
      if (!user) return { data: null, error: new Error('Not authenticated') }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_or_create_dm', {
        other_user_id: otherUserId,
      })

      if (!error) {
        await fetchConversations()
      }

      return { data, error }
    },
    [supabase, user, fetchConversations]
  )

  // Create group conversation
  const createGroup = useCallback(
    async (
      title: string,
      description?: string,
      memberIds?: string[]
    ) => {
      if (!user) return { data: null, error: new Error('Not authenticated') }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('create_group', {
        group_title: title,
        group_description: description || null,
        member_ids: memberIds || [],
      })

      if (!error) {
        await fetchConversations()
      }

      return { data, error }
    },
    [supabase, user, fetchConversations]
  )

  // Join group via invite code
  const joinGroup = useCallback(
    async (inviteCode: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('join_group_via_code', {
        group_invite_code: inviteCode,
      })

      if (!error) {
        await fetchConversations()
      }

      return { data, error }
    },
    [supabase, fetchConversations]
  )

  // Subscribe to conversation updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            updateConversation(payload.new.id, payload.new as ConversationWithMembers)
          } else {
            // For INSERT/DELETE, refetch all conversations
            fetchConversations()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user, updateConversation, fetchConversations])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    isLoading: isLoadingConversations,
    fetchConversations,
    createDM,
    createGroup,
    joinGroup,
    addConversation,
    updateConversation,
  }
}
