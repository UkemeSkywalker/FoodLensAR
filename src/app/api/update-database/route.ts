import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Starting database migration...')

    // Create service role client for admin operations
    const supabaseAdmin = createServiceRoleClient()

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

    // Add model_url field to menu_items table for AR 3D models
    const { data: modelData, error: modelUrlError } = await supabaseAdmin
      .from('menu_items')
      .select('model_url')
      .limit(1)

    let modelUrlFieldExists = true
    if (modelUrlError && modelUrlError.message.includes('column "model_url" does not exist')) {
      modelUrlFieldExists = false
      console.log('Model URL field does not exist, adding it...')
      
      // Use raw SQL to add the column
      const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE menu_items ADD COLUMN model_url TEXT;'
      })
      
      if (alterError) {
        console.error('Error adding model URL field:', alterError)
      } else {
        console.log('Model URL field added successfully')
        modelUrlFieldExists = true
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

    // Create index for model URL
    const { error: modelIndexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_menu_items_model_url ON menu_items(model_url);'
    })

    if (modelIndexError) {
      console.error('Model URL index creation error:', modelIndexError)
    } else {
      console.log('Model URL index created successfully')
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
      message: 'Database updated successfully - QR code field and model URL field added, RLS disabled for development',
      qrCodeFieldExists,
      qrCodeFieldAdded: !qrCodeError,
      modelUrlFieldExists,
      modelUrlFieldAdded: !modelUrlError,
      indexCreated: !indexError,
      modelIndexCreated: !modelIndexError,
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