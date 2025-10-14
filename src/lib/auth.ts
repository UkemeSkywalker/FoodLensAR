import { createServerClient } from './supabase'
import { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

export interface AuthenticatedRequest extends NextRequest {
  user: User
}

export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const supabase = createServerClient()
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user

    return handler(authenticatedRequest)
  }
}

// Alternative auth method using cookies (for browser-based requests)
export async function getAuthenticatedUserFromCookies(): Promise<User | null> {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    // Log all cookies to debug
    console.log('=== All cookies ===')
    cookieStore.getAll().forEach(cookie => {
      console.log(`${cookie.name}: ${cookie.value.substring(0, 50)}...`)
    })
    
    // Look for any Supabase-related cookies
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    )
    
    console.log('Supabase cookies found:', supabaseCookies.map(c => c.name))
    
    // For now, return null to disable server-side auth
    // This will force the API to rely on client-side auth
    return null
  } catch (error) {
    console.error('Cookie auth error:', error)
    return null
  }
}