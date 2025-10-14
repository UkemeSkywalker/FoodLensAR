import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Handle rate limiting by providing a more user-friendly message
      let errorMessage = error.message
      if (errorMessage.includes('For security purposes, you can only request this after')) {
        errorMessage = 'Please wait a moment before trying again.'
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to authenticate user' },
        { status: 500 }
      )
    }

    // Get restaurant profile
    const { data: restaurant, error: profileError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Continue without restaurant data for now
    }

    return NextResponse.json({
      user: data.user,
      restaurant: restaurant || null,
      session: data.session,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}