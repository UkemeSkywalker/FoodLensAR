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
    const supabase = createServerClient()
    
    // Get the session from Supabase using cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return null
    }
    
    if (!session?.user) {
      console.log('No session or user found')
      return null
    }
    
    console.log('Authenticated user:', session.user.email)
    return session.user
  } catch (error) {
    console.error('Cookie auth error:', error)
    return null
  }
}