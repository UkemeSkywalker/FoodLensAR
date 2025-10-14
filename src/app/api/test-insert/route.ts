import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Test inserting a restaurant (should fail due to RLS)
    const testRestaurant = {
      name: 'Test Restaurant',
      email: `test-${Date.now()}@example.com`
    }
    
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert(testRestaurant)
      .select()
      .single()
    
    return NextResponse.json({
      success: !restaurantError,
      message: restaurantError ? 'RLS is working - insert blocked' : 'Insert succeeded (unexpected)',
      testResults: {
        insertAttempt: {
          data: restaurant,
          error: restaurantError,
          rlsBlocked: restaurantError?.code === '42501'
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}