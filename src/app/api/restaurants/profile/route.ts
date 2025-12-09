import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserFromCookies, getAuthenticatedUser } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Try cookie-based auth first
    let user = await getAuthenticatedUserFromCookies()
    
    // If cookie auth fails, try header-based auth
    if (!user) {
      user = await getAuthenticatedUser(request)
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get restaurant profile
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('email', user.email)
      .single()

    if (error) {
      console.error('Restaurant query error:', error)
      return NextResponse.json(
        { error: 'Restaurant profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ restaurant })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromCookies()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Restaurant name is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Update restaurant profile
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('email', user.email)
      .select()
      .single()

    if (error) {
      console.error('Restaurant update error:', error)
      return NextResponse.json(
        { error: 'Failed to update restaurant profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      restaurant,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}