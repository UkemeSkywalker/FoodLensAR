import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for frontend use (Client Components)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Client for public server-side operations (uses anon key for public access)
export const createPublicClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Service role client for admin operations
export const createServiceRoleClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  return createBrowserClient(supabaseUrl, serviceRoleKey)
}