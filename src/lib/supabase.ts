import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for server-side operations (when service role key is available)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

// Client for server-side operations with user context (uses anon key + cookies)
export const createServerClientWithAuth = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      getSession: async () => {
        // Try to get session from cookies
        const accessToken = cookieStore.get('sb-access-token')?.value
        const refreshToken = cookieStore.get('sb-refresh-token')?.value
        
        if (!accessToken) {
          return { data: { session: null }, error: null }
        }
        
        // Create a temporary client to validate the session
        const tempClient = createClient(supabaseUrl, supabaseAnonKey)
        return await tempClient.auth.getSession()
      }
    }
  })
}