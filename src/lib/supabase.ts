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

// Client for public server-side operations (uses anon key for public access)
export const createPublicClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Client for server-side operations with user context (uses anon key + cookies)
export const createServerClientWithAuth = async () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}