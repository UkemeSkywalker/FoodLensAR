import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test connection by trying to query the restaurants table
    const { error: restaurantsError } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1)
    
    // Test connection by trying to query the menu_items table
    const { error: menuItemsError } = await supabase
      .from('menu_items')
      .select('count')
      .limit(1)
    
    const existingTables = []
    if (!restaurantsError) existingTables.push('restaurants')
    if (!menuItemsError) existingTables.push('menu_items')
    
    return NextResponse.json({ 
      message: 'Database connection successful',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      existingTables,
      tableTests: {
        restaurants: { error: restaurantsError?.message || null, success: !restaurantsError },
        menu_items: { error: menuItemsError?.message || null, success: !menuItemsError }
      },
      timestamp: new Date().toISOString(),
      status: existingTables.length === 2 ? 'All tables found' : 'Some tables missing'
    })
    
  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      { status: 500 }
    )
  }
}