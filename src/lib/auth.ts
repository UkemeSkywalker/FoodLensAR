// Note: Server-side auth is handled directly in API routes
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

    // Note: This function is deprecated in favor of direct server client usage in API routes
    return null
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

// Server-side auth method using cookies (for Server Components and API Routes)
// Note: This function is deprecated. Use direct server client creation in API routes instead.
export async function getAuthenticatedUserFromCookies(): Promise<User | null> {
  console.log('getAuthenticatedUserFromCookies is deprecated. Use direct server client in API routes.')
  return null
}