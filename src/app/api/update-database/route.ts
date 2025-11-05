import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('Starting database migration...')

    // Add QR code URL field to restaurants table
    const { data: qrData, error: qrCodeError } = await supabaseAdmin
      .from('restaurants')
      .select('qr_code_url')
      .limit(1)

    let qrCodeFieldExists = true
    if (qrCodeError && qrCodeError.message.includes('column "qr_code_url" does not exist')) {
      qrCodeFieldExists = false
      console.log('QR code field does not exist, adding it...')
      
      // Use raw SQL to add the column
      const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE restaurants ADD COLUMN qr_code_url TEXT;'
      })
      
      if (alterError) {
        console.error('Error adding QR code field:', alterError)
      } else {
        console.log('QR code field added successfully')
        qrCodeFieldExists = true
      }
    }

    // Create index for QR code URL
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_restaurants_qr_code_url ON restaurants(qr_code_url);'
    })

    if (indexError) {
      console.error('QR code index creation error:', indexError)
    } else {
      console.log('QR code index created successfully')
    }

    // Disable RLS for development
    const { error: rlsError1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;'
    })
    
    const { error: rlsError2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;'
    })

    if (rlsError1 || rlsError2) {
      console.error('RLS disable errors:', rlsError1, rlsError2)
    } else {
      console.log('RLS disabled successfully for development')
    }

    return NextResponse.json({
      message: 'Database updated successfully - QR code field added, RLS disabled for development',
      qrCodeFieldExists,
      qrCodeFieldAdded: !qrCodeError,
      indexCreated: !indexError,
      rlsDisabled: !rlsError1 && !rlsError2
    })

  } catch (error) {
    console.error('Database update error:', error)
    return NextResponse.json(
      { error: 'Failed to update database: ' + (error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}