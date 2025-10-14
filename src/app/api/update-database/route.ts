import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Disable RLS for development
    const { error: rlsError1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;'
    })
    
    const { error: rlsError2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;'
    })

    if (rlsError1 || rlsError2) {
      console.error('RLS disable errors:', rlsError1, rlsError2)
    }

    return NextResponse.json({
      message: 'Database updated successfully - RLS disabled for development',
      rlsDisabled: true
    })

  } catch (error) {
    console.error('Database update error:', error)
    return NextResponse.json(
      { error: 'Failed to update database: ' + error },
      { status: 500 }
    )
  }
}