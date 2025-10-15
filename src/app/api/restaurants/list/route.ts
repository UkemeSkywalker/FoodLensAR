import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase'

// GET /api/restaurants/list - List all restaurants (for testing/admin purposes)
export async function GET() {
  try {
    const supabase = createPublicClient()

    // Get all restaurants with basic info
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching restaurants:', error)
      return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
    }

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error('Restaurants list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}