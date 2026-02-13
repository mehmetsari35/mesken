// Database types for Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          code: string
          created_by: string | null
          expires_at: string | null
          max_uses: number
          uses_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          created_by?: string | null
          expires_at?: string | null
          max_uses?: number
          uses_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          created_by?: string | null
          expires_at?: string | null
          max_uses?: number
          uses_count?: number
          is_active?: boolean
          created_at?: string
        }
      }
      invite_uses: {
        Row: {
          id: string
          invite_id: string
          used_by: string
          used_at: string
        }
        Insert: {
          id?: string
          invite_id: string
          used_by: string
          used_at?: string
        }
        Update: {
          id?: string
          invite_id?: string
          used_by?: string
          used_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          type: 'dm' | 'group'
          title: string | null
          description: string | null
          avatar_url: string | null
          created_by: string | null
          is_private: boolean
          invite_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'dm' | 'group'
          title?: string | null
          description?: string | null
          avatar_url?: string | null
          created_by?: string | null
          is_private?: boolean
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'dm' | 'group'
          title?: string | null
          description?: string | null
          avatar_url?: string | null
          created_by?: string | null
          is_private?: boolean
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
          last_read_at: string | null
          is_muted: boolean
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          last_read_at?: string | null
          is_muted?: boolean
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          last_read_at?: string | null
          is_muted?: boolean
        }
      }
      messages: {
        Row: {
          id: number
          conversation_id: string
          sender_id: string | null
          type: 'text' | 'voice' | 'system'
          content: string | null
          voice_path: string | null
          voice_duration: number | null
          reply_to: number | null
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          conversation_id: string
          sender_id?: string | null
          type?: 'text' | 'voice' | 'system'
          content?: string | null
          voice_path?: string | null
          voice_duration?: number | null
          reply_to?: number | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          conversation_id?: string
          sender_id?: string | null
          type?: 'text' | 'voice' | 'system'
          content?: string | null
          voice_path?: string | null
          voice_duration?: number | null
          reply_to?: number | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      validate_and_consume_invite: {
        Args: { invite_code: string }
        Returns: Json
      }
      check_username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
      get_or_create_dm: {
        Args: { other_user_id: string }
        Returns: string
      }
      create_group: {
        Args: {
          group_title: string
          group_description?: string | null
          member_ids?: string[]
        }
        Returns: string
      }
      join_group_via_code: {
        Args: { group_invite_code: string }
        Returns: Json
      }
      generate_invite_code: {
        Args: {
          max_uses_param: number
          expires_in_days: number
        }
        Returns: string
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationMember = Database['public']['Tables']['conversation_members']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

// Extended types with relations
export interface ConversationWithMembers extends Conversation {
  members?: (ConversationMember & { profile?: Profile })[]
  last_message?: Message
  unread_count?: number
}

export interface MessageWithSender extends Message {
  sender?: Profile
}
