import { create } from 'zustand'
import type { ConversationWithMembers, MessageWithSender } from '@/types/database'

interface ChatState {
  conversations: ConversationWithMembers[]
  currentConversation: ConversationWithMembers | null
  messages: MessageWithSender[]
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  setConversations: (conversations: ConversationWithMembers[]) => void
  addConversation: (conversation: ConversationWithMembers) => void
  updateConversation: (id: string, updates: Partial<ConversationWithMembers>) => void
  setCurrentConversation: (conversation: ConversationWithMembers | null) => void
  setMessages: (messages: MessageWithSender[]) => void
  addMessage: (message: MessageWithSender) => void
  updateMessage: (id: number, updates: Partial<MessageWithSender>) => void
  setLoadingConversations: (loading: boolean) => void
  setLoadingMessages: (loading: boolean) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    })),

  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  setLoadingConversations: (isLoadingConversations) =>
    set({ isLoadingConversations }),

  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  reset: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoadingConversations: false,
      isLoadingMessages: false,
    }),
}))
