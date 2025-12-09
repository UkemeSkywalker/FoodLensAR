import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for frontend use (Client Components)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      return document.cookie.split(';').map(cookie => {
        const [name, ...rest] = cookie.trim().split('=')
        return { name, value: rest.join('=') }
      })
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        let cookie = `${name}=${value}`
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
        if (options?.path) cookie += `; path=${options.path}`
        if (options?.domain) cookie += `; domain=${options.domain}`
        if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
        if (options?.secure) cookie += '; secure'
        document.cookie = cookie
      })
    }
  }
})

// Client for public server-side operations (uses anon key for public access)
export const createPublicClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split(';').map(cookie => {
          const [name, ...rest] = cookie.trim().split('=')
          return { name, value: rest.join('=') }
        })
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookie = `${name}=${value}`
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
          if (options?.path) cookie += `; path=${options.path}`
          if (options?.domain) cookie += `; domain=${options.domain}`
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
          if (options?.secure) cookie += '; secure'
          document.cookie = cookie
        })
      }
    }
  })
}

// Service role client for admin operations
export const createServiceRoleClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  return createBrowserClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return document.cookie.split(';').map(cookie => {
          const [name, ...rest] = cookie.trim().split('=')
          return { name, value: rest.join('=') }
        })
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookie = `${name}=${value}`
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
          if (options?.path) cookie += `; path=${options.path}`
          if (options?.domain) cookie += `; domain=${options.domain}`
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
          if (options?.secure) cookie += '; secure'
          document.cookie = cookie
        })
      }
    }
  })
}