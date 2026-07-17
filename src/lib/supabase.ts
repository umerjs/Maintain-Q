import { createClient } from '@supabase/supabase-js'

// Use VITE_ prefix for client-side (Vite injects these), fall back to bare name for SSR.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '')
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_PUBLISHABLE_KEY : '')

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required')
}

function createSupabaseClient() {
  return createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      // localStorage is not available during SSR; fall back to undefined so Supabase
      // uses its in-memory store. All real auth happens client-side via useEffect.
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  })
}

// Lazy proxy: createClient() (which needs WebSocket) is only called on first access.
// During SSR the module is imported but supabase properties are never read
// (all usage is inside useEffect hooks, which don't run server-side).
let _supabase: ReturnType<typeof createSupabaseClient> | undefined

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient()
    return Reflect.get(_supabase, prop, receiver)
  },
})

// ⚠️ NOTE FOR PRODUCTION: Admin role is self-assignable at signup (demo/hackathon only).
// Before production use, remove 'admin' from the signup role selector and require
// admin role to be granted by a superadmin via a secure API route.

export type Profile = {
  id: string
  full_name: string
  name: string
  role: 'student' | 'technician' | 'admin'
  email: string
  phone?: string
  department?: string
  specialty?: string
  created_at: string
}
