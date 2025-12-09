import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // Get all restaurants
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching restaurants:', error)
      return NextResponse.json({ error: 'Failed to fetch restaurants', details: error }, { status: 500 })
    }

    return NextResponse.json({
      restaurants: restaurants || [],
      count: restaurants?.length || 0,
      message: 'Restaurants fetched successfully'
    })
  } catch (error) {
    console.error('Debug restaurants error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}