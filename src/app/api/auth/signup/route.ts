import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, restaurantName } = await request.json()

    // Validate input
    if (!email || !password || !restaurantName) {
      return NextResponse.json(
        { error: 'Email, password, and restaurant name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = await createClient()

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      // Handle rate limiting by providing a more user-friendly message
      let errorMessage = authError.message
      if (errorMessage.includes('For security purposes, you can only request this after')) {
        errorMessage = 'Please wait a moment before trying again.'
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create restaurant profile
    const { data: restaurant, error: profileError } = await supabase
      .from('restaurants')
      .insert([
        {
          name: restaurantName,
          email: email,
        }
      ])
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create restaurant profile: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: authData.user,
      restaurant: restaurant,
      message: 'Account created successfully'
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}