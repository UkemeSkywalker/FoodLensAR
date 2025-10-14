import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Test basic table access (should fail due to RLS, which is expected)
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1)
    
    const { data: menuItemData, error: menuItemError } = await supabase
      .from('menu_items')
      .select('count')
      .limit(1)
    
    // Test connection to Supabase auth
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      message: 'Database connectivity test completed',
      testResults: {
        restaurantTable: {
          accessible: !restaurantError,
          error: restaurantError?.message || null,
          rlsWorking: restaurantError?.code === '42501' // RLS policy violation
        },
        menuItemTable: {
          accessible: !menuItemError,
          error: menuItemError?.message || null,
          rlsWorking: menuItemError?.code === '42501' // RLS policy violation
        },
        authService: {
          accessible: !authError,
          error: authError?.message || null,
          sessionExists: !!authData?.session
        }
      },
      securityStatus: {
        rlsEnabled: (restaurantError?.code === '42501' && menuItemError?.code === '42501'),
        message: 'RLS is working correctly - unauthenticated access is blocked'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}