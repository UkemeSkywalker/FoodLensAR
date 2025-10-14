import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserFromCookies } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG AUTH ===')
    
    // Log all cookies
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const allCookies: Record<string, string> = {}
    
    cookieStore.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value
      console.log(`Cookie: ${cookie.name} = ${cookie.value.substring(0, 50)}...`)
    })
    
    // Try to get authenticated user
    const user = await getAuthenticatedUserFromCookies()
    console.log('Authenticated user:', user ? user.email : 'null')
    
    return NextResponse.json({
      cookies: Object.keys(allCookies),
      user: user ? { id: user.id, email: user.email } : null,
      message: 'Debug info logged to console'
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}