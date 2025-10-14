import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserFromCookies } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthenticatedUserFromCookies()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get restaurant profile
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('email', user.email)
      .single()

    if (error) {
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

    // Update restaurant profile
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('email', user.email)
      .select()
      .single()

    if (error) {
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