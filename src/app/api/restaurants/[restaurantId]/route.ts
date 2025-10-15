import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase'

// GET /api/restaurants/[restaurantId] - Get restaurant information (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const supabase = createPublicClient()

    // Get restaurant information
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, created_at')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error('Restaurant GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}