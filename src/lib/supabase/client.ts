import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })
}

// Singleton instance for client-side usage
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}
