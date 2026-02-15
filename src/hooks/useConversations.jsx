import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    if (!user) return

    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (!participantData || participantData.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const conversationIds = participantData.map(p => p.conversation_id)

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('created_at', { ascending: false })

    if (!convos) {
      setConversations([])
      setLoading(false)
      return
    }

    const enriched = await Promise.all(
      convos.map(async (conv) => {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)

        const otherUserIds = participants
          ?.filter(p => p.user_id !== user.id)
          .map(p => p.user_id) || []

        let otherUser = null
        if (otherUserIds.length > 0) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', otherUserIds[0])
            .single()
          otherUser = data
        }

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conv,
          otherUser,
          lastMessage: lastMsg || null
        }
      })
    )

    enriched.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at
      const bTime = b.lastMessage?.created_at || b.created_at
      return new Date(bTime) - new Date(aTime)
    })

    setConversations(enriched)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_participants' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchConversations])

  const createConversation = async (otherUserId) => {
    const { data: myConvos } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (myConvos && myConvos.length > 0) {
      const myConvoIds = myConvos.map(c => c.conversation_id)
      const { data: otherConvos } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvoIds)

      if (otherConvos && otherConvos.length > 0) {
        return otherConvos[0].conversation_id
      }
    }

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single()

    if (newConv) {
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId }
      ])
      fetchConversations()
      return newConv.id
    }

    return null
  }

  return { conversations, loading, createConversation, refetch: fetchConversations }
}
